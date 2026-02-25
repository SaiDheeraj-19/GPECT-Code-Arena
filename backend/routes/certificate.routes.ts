/**
 * Certificate & Contest Results Routes
 *
 * PUBLIC (no auth):
 *   GET  /api/certificates/verify/:code          → Verify certificate (server-side HMAC)
 *   GET  /api/certificates/download/:code         → Download certificate PDF
 *
 * AUTHENTICATED:
 *   GET  /api/certificates/my                     → Get my certificates (student)
 *   GET  /api/certificates/results/:contestId     → Get finalized contest results
 *   GET  /api/certificates/history/:userId        → Get user's contest history
 *   GET  /api/certificates/:id                    → Get single certificate details
 *
 * ADMIN ONLY:
 *   POST /api/certificates/finalize/:contestId    → Finalize contest & generate certificates
 *   GET  /api/certificates/contest/:contestId     → Get all certificates for a contest
 */

import { Router } from 'express';
import {
    finalizeContest,
    regenerateCertificates,
    getContestResults,
    getMyCertificates,
    getCertificate,
    verifyCertificate,
    downloadCertificate,
    getContestCertificates,
    getUserContestHistory,
} from '../controllers/certificate.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { requireAdmin } from '../middleware/role.middleware';

const router = Router();

// ── Public endpoints (no auth) ──
router.get('/verify/:code', verifyCertificate);
router.get('/download/:code', downloadCertificate);

// ── Authenticated endpoints ──
router.use(authenticateToken);

router.get('/my', getMyCertificates);
router.get('/results/:contestId', getContestResults);
router.get('/history/:userId', getUserContestHistory);
router.get('/:id', getCertificate);

// ── Admin-only endpoints ──
router.post('/finalize/:contestId', requireAdmin, finalizeContest);
router.post('/regenerate/:contestId', requireAdmin, regenerateCertificates);
router.get('/contest/:contestId', requireAdmin, getContestCertificates);

export default router;
