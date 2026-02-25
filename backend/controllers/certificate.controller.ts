/**
 * ═══════════════════════════════════════════════════════════════
 *  Certificate & Contest Results Controller
 * ═══════════════════════════════════════════════════════════════
 *
 * Complete certificate lifecycle:
 *
 * 1. FINALIZE CONTEST
 *    - Lock leaderboard (mark contest inactive)
 *    - Calculate final ranks (by solved_count DESC, penalty ASC)
 *    - Identify: Rank 1, 2, 3, Top 10%
 *    - Generate PDF certificates automatically
 *    - Generate unique verification codes
 *    - Store certificate records in database
 *
 * 2. DOWNLOAD CERTIFICATE (PDF)
 *    - Serve generated PDF files for download
 *
 * 3. VERIFY CERTIFICATE (public, no auth)
 *    - Server-side validation with HMAC integrity check
 *
 * 4. VIEW CERTIFICATES
 *    - Student: My certificates
 *    - Admin: Contest certificates
 *    - Contest results / leaderboard
 */

import { Request, Response } from 'express';
import path from 'path';
import prisma from '../prisma';
import crypto from 'crypto';
import {
    generateCertificatePDF,
    generateIntegrityHash,
    getCertificateFilePath,
    CertificatePayload,
} from '../services/certificateGenerator';

// ════════════════════════════════════════════
// HELPER: Generate unique verification code
// ════════════════════════════════════════════
function generateVerificationCode(): string {
    const year = new Date().getFullYear();
    const randomPart = crypto.randomBytes(4).toString('hex').toUpperCase();
    return `GPCET-${year}-${randomPart}`;
}

// ════════════════════════════════════════════
// HELPER: Determine certificate type by rank
// Rank 1 = GOLD, Rank 2 = SILVER, Rank 3 = BRONZE
// Top 10% = MERIT, rest = PARTICIPATION
// ════════════════════════════════════════════
function getCertificateType(rank: number, totalParticipants: number): string {
    if (rank === 1) return 'GOLD';
    if (rank === 2) return 'SILVER';
    if (rank === 3) return 'BRONZE';
    const topTenPercent = Math.max(3, Math.ceil(totalParticipants * 0.1));
    if (rank <= topTenPercent) return 'MERIT';
    return 'PARTICIPATION';
}

// ════════════════════════════════════════════
// 1. FINALIZE CONTEST RESULTS (Admin)
// ════════════════════════════════════════════
// POST /api/certificates/finalize/:contestId
//
// Flow:
// 1. Validate contest has ended
// 2. Lock leaderboard (set is_active = false)
// 3. Calculate final ranks
// 4. Identify Rank 1, 2, 3, Top 10%
// 5. Generate PDF certificates
// 6. Generate verification codes
// 7. Store certificate records
export const finalizeContest = async (req: Request, res: Response): Promise<void> => {
    try {
        const contestId = req.params.contestId as string;

        // ── Verify contest exists ──
        const contest = await prisma.contest.findUnique({
            where: { id: contestId },
            include: { problems: true },
        });

        if (!contest) {
            res.status(404).json({ error: 'Contest not found' });
            return;
        }

        // ── Must have ended ──
        if (new Date() < new Date(contest.end_time)) {
            res.status(400).json({
                error: 'Contest has not ended yet. Cannot finalize results.',
                endsAt: contest.end_time,
            });
            return;
        }

        // ── Check if already finalized ──
        const existingResults = await prisma.contestResult.findMany({
            where: { contest_id: contestId },
            take: 1,
        });
        if (existingResults.length > 0) {
            res.status(400).json({
                error: 'Contest results have already been finalized. Cannot re-finalize.',
            });
            return;
        }

        // ── Step 1: Lock leaderboard ──
        await prisma.contest.update({
            where: { id: contestId },
            data: { is_active: false },
        });

        // ── Step 2: Get all non-disqualified participations ──
        const participations = await prisma.participation.findMany({
            where: {
                contest_id: contestId,
                disqualified: false,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        roll_number: true,
                        email: true,
                    },
                },
            },
            orderBy: [
                { solved_count: 'desc' },
                { penalty_time: 'asc' },
                { score: 'desc' },
            ],
        });

        if (participations.length === 0) {
            res.status(400).json({ error: 'No valid participants to finalize.' });
            return;
        }

        const totalParticipants = participations.length;
        const contestDate = new Date(contest.start_time).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });

        // ── Step 3: Create results + certificates ──
        const contestResults: any[] = [];
        const certificateRecords: any[] = [];
        const pdfPromises: Promise<{ verificationCode: string; filepath: string }>[] = [];

        for (let i = 0; i < participations.length; i++) {
            const p = participations[i];
            const rank = i + 1;
            const certType = getCertificateType(rank, totalParticipants);
            const verificationCode = generateVerificationCode();

            // Result record
            contestResults.push({
                user_id: p.user_id,
                contest_id: contestId,
                rank,
                problems_solved: p.solved_count,
                penalty: p.penalty_time,
                score: p.score,
            });

            const { template } = req.body;

            // ... Check if already finalized ...

            // Result record
            contestResults.push({
                user_id: p.user_id,
                contest_id: contestId,
                rank,
                problems_solved: p.solved_count,
                penalty: p.penalty_time,
                score: p.score,
            });

            // Only generate certificates for participants who solved at least 1 problem
            if (p.solved_count > 0) {
                certificateRecords.push({
                    user_id: p.user_id,
                    contest_id: contestId,
                    certificate_type: certType as any,
                    rank,
                    score: p.score,
                    verification_code: verificationCode,
                });

                // Queue PDF generation
                const payload: CertificatePayload = {
                    verificationCode,
                    studentName: p.user.name,
                    rollNumber: p.user.roll_number || '',
                    contestTitle: contest.title,
                    contestDate,
                    rank,
                    score: p.score,
                    totalParticipants,
                    certificateType: certType,
                    issuedAt: new Date().toISOString(),
                    template, // Pass custom template to generator
                };

                pdfPromises.push(
                    generateCertificatePDF(payload).then((filepath) => ({
                        verificationCode,
                        filepath,
                    }))
                );
            }
        }

        // ── Step 4: Batch create results ──
        await prisma.contestResult.createMany({
            data: contestResults,
            skipDuplicates: true,
        });

        // ── Step 5: Batch create certificate records ──
        if (certificateRecords.length > 0) {
            await prisma.certificate.createMany({
                data: certificateRecords,
                skipDuplicates: true,
            });
        }

        // ── Step 6: Generate PDFs (parallel) ──
        let pdfResults: { verificationCode: string; filepath: string }[] = [];
        try {
            pdfResults = await Promise.all(pdfPromises);
            console.log(`[Certificate] Generated ${pdfResults.length} PDF certificates`);

            // Update certificate records with file URLs
            for (const { verificationCode, filepath } of pdfResults) {
                await prisma.certificate.update({
                    where: { verification_code: verificationCode },
                    data: {
                        certificate_url: `/api/certificates/download/${verificationCode}`,
                    },
                });
            }
        } catch (pdfError) {
            console.error('[Certificate] PDF generation error (results still saved):', pdfError);
        }

        // ── Response ──
        const stats = {
            totalParticipants,
            resultsCreated: contestResults.length,
            certificatesIssued: certificateRecords.length,
            pdfsGenerated: pdfResults.length,
            breakdown: {
                gold: certificateRecords.filter((c: any) => c.certificate_type === 'GOLD').length,
                silver: certificateRecords.filter((c: any) => c.certificate_type === 'SILVER').length,
                bronze: certificateRecords.filter((c: any) => c.certificate_type === 'BRONZE').length,
                merit: certificateRecords.filter((c: any) => c.certificate_type === 'MERIT').length,
                participation: certificateRecords.filter((c: any) => c.certificate_type === 'PARTICIPATION').length,
            },
            topTenPercentCutoff: Math.max(3, Math.ceil(totalParticipants * 0.1)),
        };

        res.json({
            success: true,
            message: `Contest finalized. ${stats.resultsCreated} results, ${stats.certificatesIssued} certificates, ${stats.pdfsGenerated} PDFs generated.`,
            stats,
        });

    } catch (error: any) {
        console.error('[Certificate] Finalize error:', error);
        res.status(500).json({ error: error.message || 'Failed to finalize contest' });
    }
};

// ════════════════════════════════════════════
// 2. DOWNLOAD CERTIFICATE (PDF)
// ════════════════════════════════════════════
// GET /api/certificates/download/:code
export const downloadCertificate = async (req: Request, res: Response): Promise<void> => {
    try {
        const code = req.params.code as string;

        // Verify certificate exists in DB
        const certificate = await prisma.certificate.findUnique({
            where: { verification_code: code },
            include: {
                user: { select: { name: true } },
                contest: { select: { title: true } },
            },
        });

        if (!certificate) {
            res.status(404).json({ error: 'Certificate not found' });
            return;
        }

        // Find PDF file
        const filepath = getCertificateFilePath(code);
        if (!filepath) {
            res.status(404).json({
                error: 'Certificate PDF not found on disk. It may need to be regenerated.',
            });
            return;
        }

        // Send the PDF
        const filename = `GPCET-Certificate-${certificate.user.name.replace(/\s+/g, '_')}-${certificate.contest.title.replace(/\s+/g, '_')}.pdf`;
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.sendFile(filepath);

    } catch (error: any) {
        console.error('[Certificate] Download error:', error);
        res.status(500).json({ error: 'Failed to download certificate' });
    }
};

// ════════════════════════════════════════════
// 2.5 REGENERATE CERTIFICATES (Admin only)
// ════════════════════════════════════════════
export const regenerateCertificates = async (req: Request, res: Response): Promise<void> => {
    try {
        const contestId = req.params.contestId as string;
        const { template } = req.body;

        const contest = await prisma.contest.findUnique({
            where: { id: contestId },
        });

        if (!contest) {
            res.status(404).json({ error: 'Contest not found' });
            return;
        }

        const certificates = await prisma.certificate.findMany({
            where: { contest_id: contestId },
            include: { user: true },
        });

        if (certificates.length === 0) {
            res.status(400).json({ error: 'No certificates found for this contest. Please finalize the contest first.' });
            return;
        }

        const totalParticipants = await prisma.contestResult.count({
            where: { contest_id: contestId },
        });

        const contestDate = new Date(contest.start_time).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });

        const pdfPromises: Promise<{ verificationCode: string; filepath: string }>[] = [];

        for (const cert of certificates) {
            const payload: CertificatePayload = {
                verificationCode: cert.verification_code,
                studentName: (cert as any).user.name,
                rollNumber: (cert as any).user.roll_number || '',
                contestTitle: contest.title,
                contestDate,
                rank: cert.rank,
                score: cert.score,
                totalParticipants,
                certificateType: cert.certificate_type,
                issuedAt: cert.issued_at.toISOString(),
                template,
            };

            pdfPromises.push(
                generateCertificatePDF(payload).then((filepath) => ({
                    verificationCode: cert.verification_code,
                    filepath,
                }))
            );
        }

        const pdfResults = await Promise.all(pdfPromises);
        console.log(`[Certificate] Regenerated ${pdfResults.length} PDF certificates`);

        res.json({
            message: 'Certificates regenerated successfully',
            count: pdfResults.length,
        });

    } catch (error: any) {
        console.error('[Certificate] Regenerate error:', error);
        res.status(500).json({ error: 'Failed to regenerate certificates' });
    }
};

// ════════════════════════════════════════════
// 3. VERIFY CERTIFICATE (Public — no auth)
// ════════════════════════════════════════════
// GET /api/certificates/verify/:code
// Server-side validation with HMAC integrity check
export const verifyCertificate = async (req: Request, res: Response): Promise<void> => {
    try {
        const code = req.params.code as string;

        const certificate = await prisma.certificate.findUnique({
            where: { verification_code: code },
            include: {
                user: {
                    select: {
                        name: true,
                        roll_number: true,
                    },
                },
                contest: {
                    select: {
                        title: true,
                        start_time: true,
                        end_time: true,
                    },
                },
            },
        });

        if (!certificate) {
            res.status(404).json({
                valid: false,
                error: 'No certificate found with this verification code.',
            });
            return;
        }

        // Get total participants for context
        const totalParticipants = await prisma.contestResult.count({
            where: { contest_id: certificate.contest_id },
        });

        // Generate integrity hash for verification
        const payload: CertificatePayload = {
            verificationCode: certificate.verification_code,
            studentName: certificate.user.name,
            rollNumber: certificate.user.roll_number || '',
            contestTitle: certificate.contest.title,
            contestDate: new Date(certificate.contest.start_time).toLocaleDateString('en-IN', {
                day: 'numeric', month: 'long', year: 'numeric',
            }),
            rank: certificate.rank,
            score: certificate.score,
            totalParticipants,
            certificateType: certificate.certificate_type,
            issuedAt: certificate.issued_at.toISOString(),
        };

        const integrityHash = generateIntegrityHash(payload);

        res.json({
            valid: true,
            integrityHash,
            certificate: {
                recipientName: certificate.user.name,
                rollNumber: certificate.user.roll_number,
                contestTitle: certificate.contest.title,
                contestDate: certificate.contest.start_time,
                certificateType: certificate.certificate_type,
                rank: certificate.rank,
                score: certificate.score,
                totalParticipants,
                verificationCode: certificate.verification_code,
                issuedAt: certificate.issued_at,
                downloadUrl: certificate.certificate_url,
            },
        });

    } catch (error: any) {
        console.error('[Certificate] Verify error:', error);
        res.status(500).json({ error: 'Failed to verify certificate' });
    }
};

// ════════════════════════════════════════════
// 4. GET CONTEST RESULTS (Final leaderboard)
// ════════════════════════════════════════════
// GET /api/certificates/results/:contestId
export const getContestResults = async (req: Request, res: Response): Promise<void> => {
    try {
        const contestId = req.params.contestId as string;

        const results = await prisma.contestResult.findMany({
            where: { contest_id: contestId },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        username: true,
                        roll_number: true,
                        avatar_url: true,
                    },
                },
                contest: {
                    select: {
                        title: true,
                        start_time: true,
                        end_time: true,
                    },
                },
            },
            orderBy: { rank: 'asc' },
        });

        res.json(results);

    } catch (error: any) {
        console.error('[Certificate] Get results error:', error);
        res.status(500).json({ error: 'Failed to fetch contest results' });
    }
};

// ════════════════════════════════════════════
// 5. GET MY CERTIFICATES (Student)
// ════════════════════════════════════════════
// GET /api/certificates/my
export const getMyCertificates = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).user?.id;

        const certificates = await prisma.certificate.findMany({
            where: { user_id: userId },
            include: {
                contest: {
                    select: {
                        id: true,
                        title: true,
                        start_time: true,
                        end_time: true,
                    },
                },
            },
            orderBy: { issued_at: 'desc' },
        });

        res.json(certificates);

    } catch (error: any) {
        console.error('[Certificate] Get my certificates error:', error);
        res.status(500).json({ error: 'Failed to fetch certificates' });
    }
};

// ════════════════════════════════════════════
// 6. GET SINGLE CERTIFICATE
// ════════════════════════════════════════════
// GET /api/certificates/:id
export const getCertificate = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = req.params.id as string;

        const certificate = await prisma.certificate.findUnique({
            where: { id },
            include: {
                user: {
                    select: {
                        name: true,
                        roll_number: true,
                        avatar_url: true,
                    },
                },
                contest: {
                    select: {
                        title: true,
                        start_time: true,
                        end_time: true,
                        description: true,
                    },
                },
            },
        });

        if (!certificate) {
            res.status(404).json({ error: 'Certificate not found' });
            return;
        }

        res.json(certificate);

    } catch (error: any) {
        console.error('[Certificate] Get certificate error:', error);
        res.status(500).json({ error: 'Failed to fetch certificate' });
    }
};

// ════════════════════════════════════════════
// 7. GET ALL CERTIFICATES FOR A CONTEST (Admin)
// ════════════════════════════════════════════
// GET /api/certificates/contest/:contestId
export const getContestCertificates = async (req: Request, res: Response): Promise<void> => {
    try {
        const contestId = req.params.contestId as string;

        const certificates = await prisma.certificate.findMany({
            where: { contest_id: contestId },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        roll_number: true,
                        email: true,
                    },
                },
            },
            orderBy: { rank: 'asc' },
        });

        res.json(certificates);

    } catch (error: any) {
        console.error('[Certificate] Get contest certificates error:', error);
        res.status(500).json({ error: 'Failed to fetch contest certificates' });
    }
};

// ════════════════════════════════════════════
// 8. GET USER'S CONTEST HISTORY
// ════════════════════════════════════════════
// GET /api/certificates/history/:userId
export const getUserContestHistory = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.params.userId as string;

        const results = await prisma.contestResult.findMany({
            where: { user_id: userId },
            include: {
                contest: {
                    select: {
                        id: true,
                        title: true,
                        start_time: true,
                        end_time: true,
                    },
                },
            },
            orderBy: { finalized_at: 'desc' },
        });

        // Get certificates for these contests
        const certificates = await prisma.certificate.findMany({
            where: { user_id: userId },
            select: {
                contest_id: true,
                certificate_type: true,
                verification_code: true,
                certificate_url: true,
                id: true,
            },
        });

        // Merge
        const history = results.map((r: any) => ({
            ...r,
            certificate: certificates.find((c: any) => c.contest_id === r.contest_id) || null,
        }));

        res.json(history);

    } catch (error: any) {
        console.error('[Certificate] Get history error:', error);
        res.status(500).json({ error: 'Failed to fetch contest history' });
    }
};
