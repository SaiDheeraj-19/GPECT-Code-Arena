/**
 * ═══════════════════════════════════════════════════════════════
 *  GPCET Certificate PDF Generator Service
 * ═══════════════════════════════════════════════════════════════
 *
 * Generates tamper-proof PDF certificates with:
 * - College logo/branding
 * - Student name & roll number
 * - Contest title & date
 * - Achievement (Rank & Score)
 * - QR code linking to verification page
 * - Unique verification code
 * - HMAC-based integrity hash (tamper-proof)
 *
 * Uses PDFKit for PDF rendering and qrcode for QR generation.
 */

import PDFDocument from 'pdfkit';
import * as QRCode from 'qrcode';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

// ── Certificate data shape ──
export interface CertificatePayload {
    verificationCode: string;
    studentName: string;
    rollNumber: string;
    contestTitle: string;
    contestDate: string;       // formatted date string
    rank: number;
    score: number;
    totalParticipants: number;
    certificateType: string;   // GOLD | SILVER | BRONZE | MERIT | PARTICIPATION
    issuedAt: string;          // ISO date
    template?: any;            // Custom template from frontend designer
}

// ── Default Template (matches frontend) ──
const DEFAULT_TEMPLATE = {
    collegeName: "G. Pullaiah College of Engineering & Technology",
    departmentName: "Department of Computer Science & Engineering",
    platformName: "GPCET CodeArena",
    titles: {
        GOLD: "CERTIFICATE OF EXCELLENCE",
        SILVER: "CERTIFICATE OF DISTINCTION",
        BRONZE: "CERTIFICATE OF ACHIEVEMENT",
        MERIT: "CERTIFICATE OF MERIT",
        PARTICIPATION: "CERTIFICATE OF PARTICIPATION",
    } as Record<string, string>,
    colors: {
        GOLD: "#DAA520",
        SILVER: "#A9A9A9",
        BRONZE: "#CD7F32",
        MERIT: "#4B0082",
        PARTICIPATION: "#008080",
    } as Record<string, string>,
    bodyPrefix: "This certificate is proudly awarded to",
    achievementPrefix: "for achieving",
    contestPrefix: "in",
    scorePrefix: "with a score of",
    signatureTitle: "Head of Department",
    signatureSubtitle: "CSE, GPCET",
    footerText: "This is a computer-generated certificate.",
    borderStyle: "double", // "double" | "single" | "ornate"
    showQRCode: true,
    showIntegrityHash: true,
    showLogo: true,
    bgColor: "#FEFCF8",
    textColor: "#0F172A",
    subtextColor: "#64748B",
};

// ── Output directory ──
const CERT_DIR = path.resolve(__dirname, '../certificates');
const ASSETS_DIR = path.resolve(__dirname, '../assets');

// ── Tamper-proof secret (use env var in production) ──
const HMAC_SECRET = process.env.CERTIFICATE_HMAC_SECRET || 'gpcet-certificate-secret-2026';

// ── Certificate type display config ──
const TYPE_CONFIG: Record<string, {
    title: string;
    color: [number, number, number];
    accentColor: [number, number, number];
    icon: string;
}> = {
    GOLD: {
        title: 'CERTIFICATE OF EXCELLENCE',
        color: [218, 165, 32],      // Gold
        accentColor: [184, 134, 11],
        icon: '🥇',
    },
    SILVER: {
        title: 'CERTIFICATE OF DISTINCTION',
        color: [169, 169, 169],     // Silver
        accentColor: [128, 128, 128],
        icon: '🥈',
    },
    BRONZE: {
        title: 'CERTIFICATE OF ACHIEVEMENT',
        color: [205, 127, 50],      // Bronze
        accentColor: [166, 95, 17],
        icon: '🥉',
    },
    MERIT: {
        title: 'CERTIFICATE OF MERIT',
        color: [75, 0, 130],        // Indigo
        accentColor: [63, 81, 181],
        icon: '⭐',
    },
    PARTICIPATION: {
        title: 'CERTIFICATE OF PARTICIPATION',
        color: [0, 128, 128],       // Teal
        accentColor: [0, 150, 136],
        icon: '✅',
    },
};

/**
 * Generate an HMAC integrity hash for a certificate
 * This makes certificates tamper-proof — any modification
 * to the data will invalidate the hash.
 */
export function generateIntegrityHash(payload: CertificatePayload): string {
    const data = [
        payload.verificationCode,
        payload.studentName,
        payload.rollNumber,
        payload.contestTitle,
        payload.rank.toString(),
        payload.score.toString(),
        payload.certificateType,
    ].join('|');

    return crypto
        .createHmac('sha256', HMAC_SECRET)
        .update(data)
        .digest('hex')
        .substring(0, 16)
        .toUpperCase();
}

/**
 * Verify a certificate's integrity hash
 */
export function verifyIntegrity(payload: CertificatePayload, hash: string): boolean {
    return generateIntegrityHash(payload) === hash;
}

/**
 * Generate a QR code as a data URL (base64 PNG)
 */
async function generateQRCode(url: string): Promise<Buffer> {
    return QRCode.toBuffer(url, {
        type: 'png',
        width: 120,
        margin: 1,
        color: {
            dark: '#1E293B',
            light: '#FFFFFF',
        },
        errorCorrectionLevel: 'H',
    });
}

/**
 * Draw the decorative border on the certificate
 */
function drawBorder(doc: PDFKit.PDFDocument, color: string | [number, number, number], style: string) {
    const w = doc.page.width;
    const h = doc.page.height;
    const margin = 30;

    // Outer border
    doc.rect(margin, margin, w - 2 * margin, h - 2 * margin)
        .lineWidth(style === 'ornate' ? 3 : 2)
        .strokeColor(color)
        .stroke();

    // Inner border (double-line effect)
    if (style === 'double') {
        doc.rect(margin + 6, margin + 6, w - 2 * (margin + 6), h - 2 * (margin + 6))
            .lineWidth(1)
            .strokeColor(color)
            .stroke();
    }

    // Corner ornaments
    if (style === 'ornate') {
        const cornerSize = 20;
        const corners = [
            [margin + 12, margin + 12],                           // Top-left
            [w - margin - 12 - cornerSize, margin + 12],          // Top-right
            [margin + 12, h - margin - 12 - cornerSize],          // Bottom-left
            [w - margin - 12 - cornerSize, h - margin - 12 - cornerSize], // Bottom-right
        ];

        corners.forEach(([x, y]) => {
            doc.rect(x, y, cornerSize, cornerSize)
                .lineWidth(1.5)
                .strokeColor(color)
                .stroke();
        });
    }
}

/**
 * Draw a horizontal ornamental divider
 */
function drawDivider(doc: PDFKit.PDFDocument, y: number, color: string | [number, number, number]) {
    const cx = doc.page.width / 2;
    const lineWidth = 180;

    doc.moveTo(cx - lineWidth, y)
        .lineTo(cx - 20, y)
        .lineWidth(0.75)
        .strokeColor(color)
        .stroke();

    // Center diamond
    doc.save();
    doc.translate(cx, y);
    doc.rotate(45);
    doc.rect(-4, -4, 8, 8)
        .fillColor(color)
        .fill();
    doc.restore();

    doc.moveTo(cx + 20, y)
        .lineTo(cx + lineWidth, y)
        .lineWidth(0.75)
        .strokeColor(color)
        .stroke();
}

/**
 * MAIN: Generate a PDF certificate and save to disk
 *
 * Returns the file path of the generated PDF.
 */
export async function generateCertificatePDF(payload: CertificatePayload): Promise<string> {
    // Ensure output directory exists
    if (!fs.existsSync(CERT_DIR)) {
        fs.mkdirSync(CERT_DIR, { recursive: true });
    }

    const tpl = { ...DEFAULT_TEMPLATE, ...(payload.template || {}) };
    const certColor = tpl.colors[payload.certificateType] || tpl.colors.PARTICIPATION;
    const certTitle = tpl.titles[payload.certificateType] || tpl.titles.PARTICIPATION;

    const filename = `${payload.verificationCode}.pdf`;
    const filepath = path.join(CERT_DIR, filename);

    // Generate QR code
    const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/certificates/verify/${payload.verificationCode}`;
    const qrBuffer = await generateQRCode(verifyUrl);

    // Generate integrity hash
    const integrityHash = generateIntegrityHash(payload);

    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({
            size: 'A4',
            layout: 'landscape',
            margins: { top: 50, bottom: 50, left: 60, right: 60 },
            info: {
                Title: `${certTitle} - ${payload.contestTitle}`,
                Author: tpl.platformName,
                Subject: `Certificate for ${payload.studentName}`,
                Keywords: payload.verificationCode,
            },
        });

        const writeStream = fs.createWriteStream(filepath);
        doc.pipe(writeStream);

        const pageW = doc.page.width;
        const pageH = doc.page.height;
        const centerX = pageW / 2;

        // ════════════════════════════════
        // BACKGROUND
        // ════════════════════════════════
        doc.rect(0, 0, pageW, pageH)
            .fillColor(tpl.bgColor)
            .fill();

        // Subtle top accent bar
        doc.rect(0, 0, pageW, 8)
            .fillColor(certColor)
            .fill();

        // Bottom accent bar
        doc.rect(0, pageH - 8, pageW, 8)
            .fillColor(certColor)
            .fill();

        // ════════════════════════════════
        // DECORATIVE BORDER
        // ════════════════════════════════
        drawBorder(doc, certColor, tpl.borderStyle);

        // ════════════════════════════════
        // COLLEGE LOGO / HEADER
        // ════════════════════════════════
        let yPos = 55;

        // Check if logo exists
        const logoPath = path.join(ASSETS_DIR, 'college-logo.png');
        if (tpl.showLogo && fs.existsSync(logoPath)) {
            doc.image(logoPath, centerX - 60, yPos, { fit: [120, 60], align: 'center' });
            yPos += 70;
        } else if (tpl.showLogo) {
            // Text-based logo fallback
            doc.fontSize(14)
                .font('Helvetica-Bold')
                .fillColor(tpl.textColor)
                .text('GPCET', 0, yPos, { align: 'center', width: pageW });
            yPos += 18;
        }

        // Institution name
        doc.fontSize(10)
            .font('Helvetica-Bold')
            .fillColor(tpl.textColor)
            .text(tpl.collegeName, 0, yPos, {
                align: 'center', width: pageW,
            });
        yPos += 14;

        doc.fontSize(8)
            .fillColor(tpl.subtextColor)
            .text(tpl.departmentName, 0, yPos, {
                align: 'center', width: pageW,
            });
        yPos += 20;

        // ════════════════════════════════
        // ORNAMENTAL DIVIDER
        // ════════════════════════════════
        drawDivider(doc, yPos, certColor);
        yPos += 20;

        // ════════════════════════════════
        // CERTIFICATE TITLE
        // ════════════════════════════════
        doc.fontSize(26)
            .font('Helvetica-Bold')
            .fillColor(certColor)
            .text(certTitle, 0, yPos, {
                align: 'center', width: pageW,
                characterSpacing: 4,
            });
        yPos += 38;

        // ════════════════════════════════
        // CONTEST NAME
        // ════════════════════════════════
        doc.fontSize(10)
            .font('Helvetica')
            .fillColor(tpl.subtextColor)
            .text(tpl.bodyPrefix, 0, yPos, {
                align: 'center', width: pageW,
            });
        yPos += 20;

        // ════════════════════════════════
        // STUDENT NAME (prominent)
        // ════════════════════════════════
        doc.fontSize(28)
            .font('Helvetica-Bold')
            .fillColor(tpl.textColor)
            .text(payload.studentName, 0, yPos, {
                align: 'center', width: pageW,
            });
        yPos += 36;

        // Roll number
        if (payload.rollNumber) {
            doc.fontSize(10)
                .font('Helvetica')
                .fillColor(tpl.subtextColor)
                .text(`Roll No: ${payload.rollNumber}`, 0, yPos, {
                    align: 'center', width: pageW,
                });
            yPos += 18;
        }

        // ════════════════════════════════
        // ACHIEVEMENT DESCRIPTION
        // ════════════════════════════════
        doc.fontSize(10)
            .font('Helvetica')
            .fillColor(tpl.subtextColor)
            .text(tpl.achievementPrefix, 0, yPos, {
                align: 'center', width: pageW,
            });
        yPos += 18;

        // Rank display
        const rankLabel = payload.rank <= 3
            ? `Rank #${payload.rank}`
            : `Top ${Math.ceil((payload.rank / payload.totalParticipants) * 100)}%`;

        doc.fontSize(20)
            .font('Helvetica-Bold')
            .fillColor(certColor)
            .text(rankLabel, 0, yPos, {
                align: 'center', width: pageW,
            });
        yPos += 28;

        // Contest title and score
        doc.fontSize(10)
            .font('Helvetica')
            .fillColor(tpl.subtextColor)
            .text(`${tpl.contestPrefix} "${payload.contestTitle}"`, 0, yPos, {
                align: 'center', width: pageW,
            });
        yPos += 16;

        doc.fontSize(10)
            .fillColor(tpl.subtextColor)
            .text(`${tpl.scorePrefix} ${payload.score} points among ${payload.totalParticipants} participants`, 0, yPos, {
                align: 'center', width: pageW,
            });
        yPos += 14;

        doc.fontSize(9)
            .fillColor(tpl.subtextColor)
            .text(`held on ${payload.contestDate}`, 0, yPos, {
                align: 'center', width: pageW,
            });
        yPos += 22;

        // ════════════════════════════════
        // DIVIDER
        // ════════════════════════════════
        drawDivider(doc, yPos, certColor);
        yPos += 20;

        // ════════════════════════════════
        // BOTTOM SECTION: QR + Verification + Date
        // ════════════════════════════════
        const bottomY = yPos;

        // QR Code (left side)
        if (tpl.showQRCode) {
            doc.image(qrBuffer, 75, bottomY - 5, { width: 70, height: 70 });
            doc.fontSize(6)
                .font('Helvetica')
                .fillColor(tpl.subtextColor)
                .text('Scan to verify', 75, bottomY + 68, {
                    width: 70, align: 'center',
                });
        }

        // Verification code (center)
        doc.fontSize(8)
            .font('Helvetica')
            .fillColor(tpl.subtextColor)
            .text('Verification Code', 0, bottomY, {
                align: 'center', width: pageW,
            });

        doc.fontSize(12)
            .font('Helvetica-Bold')
            .fillColor(tpl.textColor)
            .text(payload.verificationCode, 0, bottomY + 12, {
                align: 'center', width: pageW,
            });

        if (tpl.showIntegrityHash) {
            doc.fontSize(7)
                .font('Helvetica')
                .fillColor(tpl.subtextColor)
                .text(`Integrity: ${integrityHash}`, 0, bottomY + 28, {
                    align: 'center', width: pageW,
                });
        }

        doc.fontSize(8)
            .fillColor(tpl.subtextColor)
            .text(`Issued: ${new Date(payload.issuedAt).toLocaleDateString('en-IN', {
                day: 'numeric', month: 'long', year: 'numeric',
            })}`, 0, bottomY + 43, {
                align: 'center', width: pageW,
            });

        // Signature placeholder (right side)
        const sigX = pageW - 230;
        const sigLineY = bottomY + 48;

        doc.moveTo(sigX, sigLineY)
            .lineTo(sigX + 150, sigLineY)
            .lineWidth(0.5)
            .strokeColor('#CBD5E1')
            .stroke();

        doc.fontSize(7)
            .font('Helvetica')
            .fillColor(tpl.subtextColor)
            .text(tpl.signatureTitle, sigX, sigLineY + 4, {
                width: 150, align: 'center',
            });

        doc.fontSize(6)
            .fillColor(tpl.subtextColor)
            .text(tpl.signatureSubtitle, sigX, sigLineY + 14, {
                width: 150, align: 'center',
            });

        // ════════════════════════════════
        // FOOTER
        // ════════════════════════════════
        const footerVerificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/certificates/verify/${payload.verificationCode}`;
        doc.fontSize(6)
            .font('Helvetica')
            .fillColor(tpl.subtextColor)
            .text(
                `${tpl.footerText} Verify authenticity at ` + footerVerificationUrl,
                0, pageH - 42,
                { align: 'center', width: pageW }
            );

        // Finalize
        doc.end();

        writeStream.on('finish', () => resolve(filepath));
        writeStream.on('error', reject);
    });
}

/**
 * Delete a certificate file from disk
 */
export function deleteCertificateFile(verificationCode: string): void {
    const filepath = path.join(CERT_DIR, `${verificationCode}.pdf`);
    if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
    }
}

/**
 * Get the file path for a certificate
 */
export function getCertificateFilePath(verificationCode: string): string | null {
    const filepath = path.join(CERT_DIR, `${verificationCode}.pdf`);
    return fs.existsSync(filepath) ? filepath : null;
}
