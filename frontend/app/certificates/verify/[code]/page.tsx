"use client";

/**
 * Public Certificate Verification Page
 * 
 * Allows anyone to verify a certificate authenticity
 * by entering the verification code.
 * No authentication required.
 * Shows HMAC integrity hash for tamper-proof validation.
 */

import { useState } from "react";
import {
    Shield, CheckCircle2, XCircle, Search, Award,
    Calendar, Trophy, Hash, Star, Download, Lock
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface VerificationResult {
    valid: boolean;
    integrityHash?: string;
    certificate?: {
        recipientName: string;
        rollNumber: string;
        contestTitle: string;
        contestDate: string;
        certificateType: string;
        rank: number;
        score: number;
        totalParticipants: number;
        verificationCode: string;
        issuedAt: string;
        downloadUrl: string | null;
    };
    error?: string;
}

const TYPE_CONFIG: Record<string, { icon: string; label: string; color: string }> = {
    GOLD: { icon: '🥇', label: '1st Place — Gold', color: 'text-amber-600' },
    SILVER: { icon: '🥈', label: '2nd Place — Silver', color: 'text-slate-500' },
    BRONZE: { icon: '🥉', label: '3rd Place — Bronze', color: 'text-orange-600' },
    MERIT: { icon: '⭐', label: 'Top 10% — Merit', color: 'text-indigo-600' },
    PARTICIPATION: { icon: '✅', label: 'Participation', color: 'text-emerald-600' },
};

export default function VerifyCertificatePage() {
    const [code, setCode] = useState("");
    const [result, setResult] = useState<VerificationResult | null>(null);
    const [loading, setLoading] = useState(false);

    const verify = async () => {
        if (!code.trim()) return;
        setLoading(true);
        setResult(null);
        try {
            const res = await fetch(`${API_URL}/api/certificates/verify/${code.trim()}`);
            const data = await res.json();
            if (res.ok) {
                setResult(data);
            } else {
                setResult({ valid: false, error: data.error || 'Certificate not found.' });
            }
        } catch {
            setResult({ valid: false, error: 'Failed to connect to verification server.' });
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-[#FAFBFC] font-sans flex items-center justify-center p-6">
            <div className="max-w-lg w-full">
                {/* Header */}
                <div className="text-center mb-10">
                    <div className="w-16 h-16 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Shield size={28} className="text-indigo-500" />
                    </div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                        Verify Certificate
                    </h1>
                    <p className="text-sm text-slate-500 mt-2">
                        Enter the verification code to confirm certificate authenticity
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                        GPCET CodeArena
                    </p>
                </div>

                {/* Search Input */}
                <div className="bg-white border border-slate-200 rounded-2xl p-1.5 shadow-sm flex items-center gap-2 mb-6">
                    <input
                        type="text"
                        value={code}
                        onChange={(e) => setCode(e.target.value.toUpperCase())}
                        onKeyDown={(e) => e.key === 'Enter' && verify()}
                        placeholder="e.g., GPCET-2026-A1B2C3D4"
                        className="flex-1 px-4 py-3 text-sm font-mono font-bold text-slate-800 placeholder-slate-300 focus:outline-none bg-transparent"
                    />
                    <button
                        onClick={verify}
                        disabled={loading || !code.trim()}
                        className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold rounded-xl text-sm transition flex items-center gap-2"
                    >
                        {loading ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <Search size={16} />
                        )}
                        Verify
                    </button>
                </div>

                {/* Result */}
                {result && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {result.valid && result.certificate ? (
                            <div className="bg-white border-2 border-emerald-200 rounded-2xl overflow-hidden shadow-lg">
                                {/* Verified Banner */}
                                <div className="bg-emerald-50 p-4 flex items-center gap-3 border-b border-emerald-100">
                                    <CheckCircle2 size={24} className="text-emerald-500" />
                                    <div>
                                        <p className="font-black text-emerald-800 text-sm">VERIFIED ✓</p>
                                        <p className="text-xs text-emerald-600">This certificate is authentic and tamper-proof.</p>
                                    </div>
                                </div>

                                <div className="p-6 space-y-4">
                                    {/* Recipient */}
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 bg-indigo-50 rounded-xl flex items-center justify-center text-2xl">
                                            {TYPE_CONFIG[result.certificate.certificateType]?.icon || '🏆'}
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-black text-slate-900">
                                                {result.certificate.recipientName}
                                            </h3>
                                            <p className="text-xs text-slate-500 font-mono font-bold">
                                                {result.certificate.rollNumber}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Details */}
                                    <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-slate-500 flex items-center gap-2">
                                                <Trophy size={12} /> Contest
                                            </span>
                                            <span className="text-sm font-bold text-slate-700">
                                                {result.certificate.contestTitle}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-slate-500 flex items-center gap-2">
                                                <Award size={12} /> Achievement
                                            </span>
                                            <span className={`text-sm font-bold ${TYPE_CONFIG[result.certificate.certificateType]?.color || 'text-slate-700'}`}>
                                                {TYPE_CONFIG[result.certificate.certificateType]?.label || result.certificate.certificateType}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-slate-500 flex items-center gap-2">
                                                <Hash size={12} /> Rank
                                            </span>
                                            <span className="text-sm font-bold text-slate-700">
                                                #{result.certificate.rank} of {result.certificate.totalParticipants}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-slate-500 flex items-center gap-2">
                                                <Star size={12} /> Score
                                            </span>
                                            <span className="text-sm font-bold text-slate-700">
                                                {result.certificate.score} pts
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-slate-500 flex items-center gap-2">
                                                <Calendar size={12} /> Contest Date
                                            </span>
                                            <span className="text-sm font-medium text-slate-600">
                                                {new Date(result.certificate.contestDate).toLocaleDateString('en-IN', {
                                                    day: 'numeric', month: 'short', year: 'numeric'
                                                })}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-slate-500 flex items-center gap-2">
                                                <Shield size={12} /> Issued
                                            </span>
                                            <span className="text-sm font-medium text-slate-600">
                                                {new Date(result.certificate.issuedAt).toLocaleDateString('en-IN', {
                                                    day: 'numeric', month: 'short', year: 'numeric'
                                                })}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Integrity Hash */}
                                    {result.integrityHash && (
                                        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 flex items-center gap-3">
                                            <Lock size={14} className="text-emerald-500 shrink-0" />
                                            <div>
                                                <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                                                    Integrity Hash (HMAC-SHA256)
                                                </p>
                                                <code className="text-xs font-mono text-emerald-600">
                                                    {result.integrityHash}
                                                </code>
                                            </div>
                                        </div>
                                    )}

                                    {/* Verification Code */}
                                    <div className="text-center">
                                        <code className="text-xs font-mono text-slate-400">
                                            {result.certificate.verificationCode}
                                        </code>
                                    </div>

                                    {/* Download Button */}
                                    {result.certificate.downloadUrl && (
                                        <a
                                            href={`${API_URL}${result.certificate.downloadUrl}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-3 rounded-xl font-bold text-sm transition-all w-full"
                                        >
                                            <Download size={16} />
                                            Download Certificate (PDF)
                                        </a>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white border-2 border-red-200 rounded-2xl p-8 text-center">
                                <XCircle size={48} className="mx-auto text-red-400 mb-4" />
                                <h3 className="text-lg font-black text-red-700">Not Found</h3>
                                <p className="text-sm text-red-500 mt-2">
                                    {result.error || 'No certificate matches this verification code.'}
                                </p>
                                <p className="text-xs text-red-300 mt-4">
                                    If you believe this is an error, please contact the administration.
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* Footer */}
                <p className="text-center text-[10px] text-slate-400 mt-8">
                    GPCET CodeArena • Certificate Verification System<br />
                    Certificates are tamper-proof with HMAC-SHA256 integrity validation
                </p>
            </div>
        </div>
    );
}
