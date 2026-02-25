"use client";

/**
 * Student Certificates Page
 * 
 * Beautiful certificate gallery with:
 * - Certificate cards with medal indicators (Gold/Silver/Bronze)
 * - Certificate detail/preview modal
 * - Verification code display
 * - Contest history with ranks
 * - Download/share functionality
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore, AuthState } from "../../store/auth";
import api from "../../lib/api";
import {
    Award, Trophy, Star, Calendar,
    Shield, ArrowLeft, Download,
    ChevronRight,
    Copy, Check, X
} from "lucide-react";

interface CertificateData {
    id: string;
    certificate_type: string;
    rank: number;
    score: number;
    verification_code: string;
    issued_at: string;
    certificate_url: string | null;
    contest: {
        id: string;
        title: string;
        start_time: string;
        end_time: string;
    };
}

const CERT_CONFIG: Record<string, {
    gradient: string;
    border: string;
    icon: string;
    medal: string;
    label: string;
    glow: string;
    bg: string;
}> = {
    GOLD: {
        gradient: 'from-amber-400 via-yellow-300 to-amber-500',
        border: 'border-amber-400/50',
        icon: '🥇',
        medal: 'bg-gradient-to-br from-amber-400 to-yellow-600',
        label: '1st Place',
        glow: 'shadow-amber-500/30',
        bg: 'bg-amber-500/5',
    },
    SILVER: {
        gradient: 'from-slate-300 via-gray-200 to-slate-400',
        border: 'border-slate-300/50',
        icon: '🥈',
        medal: 'bg-gradient-to-br from-slate-300 to-gray-500',
        label: '2nd Place',
        glow: 'shadow-slate-400/20',
        bg: 'bg-slate-500/5',
    },
    BRONZE: {
        gradient: 'from-orange-400 via-amber-600 to-orange-700',
        border: 'border-orange-400/50',
        icon: '🥉',
        medal: 'bg-gradient-to-br from-orange-400 to-amber-700',
        label: '3rd Place',
        glow: 'shadow-orange-500/20',
        bg: 'bg-orange-500/5',
    },
    MERIT: {
        gradient: 'from-indigo-400 via-blue-400 to-indigo-500',
        border: 'border-indigo-400/30',
        icon: '⭐',
        medal: 'bg-gradient-to-br from-indigo-400 to-blue-600',
        label: 'Top 10%',
        glow: 'shadow-indigo-500/20',
        bg: 'bg-indigo-500/5',
    },
    PARTICIPATION: {
        gradient: 'from-emerald-400 via-teal-400 to-emerald-500',
        border: 'border-emerald-400/20',
        icon: '✅',
        medal: 'bg-gradient-to-br from-emerald-400 to-teal-600',
        label: 'Participation',
        glow: 'shadow-emerald-500/10',
        bg: 'bg-emerald-500/5',
    },
};

export default function CertificatesPage() {
    const user = useAuthStore((state: AuthState) => state.user);
    const router = useRouter();
    const [certificates, setCertificates] = useState<CertificateData[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCert, setSelectedCert] = useState<CertificateData | null>(null);
    const [copiedCode, setCopiedCode] = useState(false);

    useEffect(() => {
        if (!user) {
            router.push('/');
            return;
        }
        fetchCertificates();
    }, [user, router]);

    const fetchCertificates = async () => {
        try {
            const { data } = await api.get('/certificates/my');
            setCertificates(data);
        } catch (error) {
            console.error('Failed to fetch certificates:', error);
        }
        setLoading(false);
    };

    const copyCode = (code: string) => {
        navigator.clipboard.writeText(code);
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 2000);
    };

    const stats = {
        total: certificates.length,
        gold: certificates.filter(c => c.certificate_type === 'GOLD').length,
        silver: certificates.filter(c => c.certificate_type === 'SILVER').length,
        bronze: certificates.filter(c => c.certificate_type === 'BRONZE').length,
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#FAFBFC] dark:bg-[#0a0a0b] flex items-center justify-center transition-colors duration-500">
                <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FDFDFD] dark:bg-[#0a0a0b] font-sans text-slate-900 dark:text-slate-100 transition-colors duration-500 pb-20">
            {/* Header */}
            <header className="bg-white/80 dark:bg-[#0a0a0b]/80 border-b border-slate-200/60 dark:border-white/10 px-8 py-6 backdrop-blur-xl sticky top-0 z-40 transition-colors">
                <div className="max-w-6xl mx-auto">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => router.push('/problems')}
                                className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white transition"
                            >
                                <ArrowLeft size={20} />
                            </button>
                            <div>
                                <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight transition-colors">
                                    My Certificates
                                </h1>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 transition-colors">
                                    Your achievements and contest accomplishments
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2">
                                <span className="text-lg">🏆</span>
                                <span className="text-sm font-bold text-amber-800">
                                    {stats.gold}G · {stats.silver}S · {stats.bronze}B
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-6xl mx-auto px-8 py-8">
                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-2xl p-5 text-center shadow-sm transition-colors">
                        <Award size={24} className="mx-auto text-primary mb-2" />
                        <p className="text-3xl font-black text-slate-900 dark:text-white transition-colors">{stats.total}</p>
                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase mt-1 transition-colors">Total Certificates</p>
                    </div>
                    <div className="bg-white dark:bg-white/5 border border-amber-100 dark:border-amber-500/20 rounded-2xl p-5 text-center shadow-sm transition-colors">
                        <span className="text-2xl block mb-1">🥇</span>
                        <p className="text-3xl font-black text-amber-600 dark:text-amber-500 transition-colors">{stats.gold}</p>
                        <p className="text-[10px] font-bold text-amber-400 uppercase mt-1 transition-colors">Gold Medals</p>
                    </div>
                    <div className="bg-white dark:bg-white/5 border border-slate-100 dark:border-slate-500/20 rounded-2xl p-5 text-center shadow-sm transition-colors">
                        <span className="text-2xl block mb-1">🥈</span>
                        <p className="text-3xl font-black text-slate-500 dark:text-slate-400 transition-colors">{stats.silver}</p>
                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase mt-1 transition-colors">Silver Medals</p>
                    </div>
                    <div className="bg-white dark:bg-white/5 border border-orange-100 dark:border-orange-500/20 rounded-2xl p-5 text-center shadow-sm transition-colors">
                        <span className="text-2xl block mb-1">🥉</span>
                        <p className="text-3xl font-black text-orange-600 dark:text-orange-500 transition-colors">{stats.bronze}</p>
                        <p className="text-[10px] font-bold text-orange-400 uppercase mt-1 transition-colors">Bronze Medals</p>
                    </div>
                </div>

                {/* Certificate Gallery */}
                {certificates.length === 0 ? (
                    <div className="bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-2xl p-16 text-center shadow-sm transition-colors">
                        <Trophy size={56} className="mx-auto text-slate-200 dark:text-slate-700 mb-4 transition-colors" />
                        <h3 className="text-xl font-bold text-slate-400 dark:text-slate-500 transition-colors">No Certificates Yet</h3>
                        <p className="text-sm text-slate-400 dark:text-slate-500 mt-2 max-w-sm mx-auto transition-colors">
                            Participate in contests and perform well to earn certificates.
                            Top 10% performers in each contest receive certificates!
                        </p>
                        <button
                            onClick={() => router.push('/contests')}
                            className="mt-6 px-6 py-3 bg-primary text-background-dark rounded-xl font-bold text-sm shadow-lg shadow-primary/20 hover:opacity-90 transition-all"
                        >
                            Browse Contests
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {certificates.map((cert) => {
                            const config = CERT_CONFIG[cert.certificate_type] || CERT_CONFIG.PARTICIPATION;
                            return (
                                <div
                                    key={cert.id}
                                    onClick={() => setSelectedCert(cert)}
                                    className={`group relative bg-white dark:bg-[#0f0f11] border ${config.border} rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-xl ${config.glow} hover:-translate-y-1`}
                                >
                                    {/* Certificate Header Gradient */}
                                    <div className={`h-2 bg-gradient-to-r ${config.gradient}`} />

                                    <div className="p-6">
                                        {/* Medal & Type */}
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <span className="text-3xl">{config.icon}</span>
                                                <div>
                                                    <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider transition-colors">
                                                        {config.label}
                                                    </p>
                                                    <p className="text-lg font-black text-slate-900 dark:text-slate-100 mt-0.5 transition-colors">
                                                        Rank #{cert.rank}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className={`w-12 h-12 ${config.medal} rounded-xl flex items-center justify-center text-white font-black text-lg shadow-lg`}>
                                                {cert.rank}
                                            </div>
                                        </div>

                                        {/* Contest Title */}
                                        <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm mb-3 line-clamp-2 transition-colors">
                                            {cert.contest.title}
                                        </h3>

                                        {/* Details */}
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 transition-colors">
                                                <Calendar size={12} />
                                                <span>{new Date(cert.contest.start_time).toLocaleDateString('en-IN', {
                                                    day: 'numeric', month: 'short', year: 'numeric'
                                                })}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 transition-colors">
                                                <Star size={12} />
                                                <span>Score: {cert.score}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 transition-colors">
                                                <Shield size={12} />
                                                <span className="font-mono text-[10px]">{cert.verification_code}</span>
                                            </div>
                                        </div>

                                        {/* View Button */}
                                        <div className="mt-4 pt-4 border-t border-slate-50 dark:border-white/5 flex items-center justify-between transition-colors">
                                            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase transition-colors">
                                                {new Date(cert.issued_at).toLocaleDateString()}
                                            </span>
                                            <span className="text-xs font-bold text-primary hover:text-primary/80 flex items-center gap-1 transition-colors">
                                                View Certificate <ChevronRight size={14} />
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Certificate Detail Modal */}
            {selectedCert && (
                <div
                    className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6"
                    onClick={() => setSelectedCert(null)}
                >
                    <div
                        className="bg-white dark:bg-[#0a0a0b] rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl transition-colors"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Certificate Preview */}
                        <CertificatePreview
                            cert={selectedCert}
                            userName={user?.name || 'Student'}
                            rollNumber={user?.roll_number || ''}
                            onClose={() => setSelectedCert(null)}
                            onCopyCode={() => copyCode(selectedCert.verification_code)}
                            copiedCode={copiedCode}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

// ── Certificate Preview Component ──
function CertificatePreview({
    cert,
    userName,
    rollNumber,
    onClose,
    onCopyCode,
    copiedCode
}: {
    cert: CertificateData;
    userName: string;
    rollNumber: string;
    onClose: () => void;
    onCopyCode: () => void;
    copiedCode: boolean;
}) {
    const config = CERT_CONFIG[cert.certificate_type] || CERT_CONFIG.PARTICIPATION;

    return (
        <div>
            {/* Close button */}
            <div className="flex justify-end p-4 pb-0">
                <button onClick={onClose} className="p-2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-white transition">
                    <X size={20} />
                </button>
            </div>

            {/* Certificate Body */}
            <div className="px-12 pb-10">
                {/* Top ornamental gradient */}
                <div className={`h-1.5 bg-gradient-to-r ${config.gradient} rounded-full mb-8`} />

                <div className="text-center mb-6">
                    <span className="text-5xl block mb-3">{config.icon}</span>
                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] transition-colors">
                        GPCET CodeArena
                    </p>
                    <h2 className="text-3xl font-black text-slate-900 dark:text-white mt-2 tracking-tight transition-colors">
                        Certificate of {cert.certificate_type === 'PARTICIPATION' ? 'Participation' : 'Achievement'}
                    </h2>
                </div>

                {/* Divider */}
                <div className="flex items-center gap-4 my-6">
                    <div className="flex-1 h-px bg-slate-100 dark:bg-white/10 transition-colors" />
                    <Star size={14} className="text-amber-400" />
                    <div className="flex-1 h-px bg-slate-100 dark:bg-white/10 transition-colors" />
                </div>

                {/* Recipient */}
                <div className="text-center mb-6">
                    <p className="text-sm text-slate-500 dark:text-slate-400 transition-colors">This is to certify that</p>
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-2 transition-colors">{userName}</h3>
                    {rollNumber && (
                        <p className="text-sm text-slate-500 dark:text-slate-400 font-mono mt-1 transition-colors">{rollNumber}</p>
                    )}
                </div>

                {/* Achievement */}
                <div className="text-center mb-8">
                    <p className="text-sm text-slate-500 dark:text-slate-400 transition-colors">
                        has achieved <span className="font-bold text-slate-700 dark:text-slate-300">{config.label}</span> (Rank #{cert.rank}) in
                    </p>
                    <h4 className="text-lg font-bold text-primary mt-1 transition-colors">{cert.contest.title}</h4>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 transition-colors">
                        held on {new Date(cert.contest.start_time).toLocaleDateString('en-IN', {
                            day: 'numeric', month: 'long', year: 'numeric'
                        })}
                    </p>
                    <p className="text-sm font-bold text-slate-600 dark:text-slate-400 mt-2 transition-colors">
                        Score: {cert.score} points
                    </p>
                </div>

                {/* Bottom ornamental gradient */}
                <div className={`h-1.5 bg-gradient-to-r ${config.gradient} rounded-full mb-6`} />

                {/* Verification & Actions */}
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider transition-colors">
                            Verification Code
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                            <code className="text-sm font-bold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-white/5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 font-mono transition-colors">
                                {cert.verification_code}
                            </code>
                            <button
                                onClick={onCopyCode}
                                className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-white transition"
                                title="Copy code"
                            >
                                {copiedCode ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                            </button>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider transition-colors">
                            Issued On
                        </p>
                        <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mt-1 transition-colors">
                            {new Date(cert.issued_at).toLocaleDateString('en-IN', {
                                day: 'numeric', month: 'long', year: 'numeric'
                            })}
                        </p>
                    </div>
                </div>

                {/* Download Button */}
                {cert.certificate_url && (
                    <div className="mt-6 flex justify-center">
                        <a
                            href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/certificates/download/${cert.verification_code}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 bg-primary text-background-dark px-6 py-3 rounded-xl font-bold text-sm shadow-lg shadow-primary/20 hover:opacity-90 transition-all active:scale-95"
                        >
                            <Download size={16} />
                            Download Certificate (PDF)
                        </a>
                    </div>
                )}
            </div>
        </div>
    );
}
