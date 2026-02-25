"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "../../store/auth";
import api from "../../lib/api";
import {
    BarChart3, TrendingUp, Code2, Database, Trophy,
    ArrowLeft, Target, Calendar, Award,
    Zap, CheckCircle2, XCircle
} from "lucide-react";

interface Analytics {
    totalSubmissions: number;
    totalSolved: number;
    mostUsedLanguage: string;
    languageAnalysis: Record<string, {
        total: number;
        passed: number;
        failed: number;
        errors: number;
        successRate: number;
    }>;
    difficultyBreakdown: {
        Easy: number;
        Medium: number;
        Hard: number;
    };
    codingVsSql: {
        coding: number;
        sql: number;
    };
    contestHistory: {
        contestId: string;
        contestTitle: string;
        startTime: string;
        score: number;
        solvedCount: number;
        penaltyTime: number;
    }[];
    heatmap: Record<string, number>;
}

export default function AnalyticsPage() {
    const user = useAuthStore(state => state.user);
    const router = useRouter();
    const [analytics, setAnalytics] = useState<Analytics | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) { router.push('/'); return; }
        fetchAnalytics();
    }, [user, router]);

    const fetchAnalytics = async () => {
        try {
            const { data } = await api.get('/submissions/analytics');
            setAnalytics(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-[#FDFDFD] dark:bg-[#0a0a0b] transition-colors duration-500">
            <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
        </div>
    );

    if (!analytics) return (
        <div className="min-h-screen flex items-center justify-center bg-[#FDFDFD] dark:bg-[#0a0a0b] text-slate-400 dark:text-slate-500 transition-colors duration-500">
            Failed to load analytics
        </div>
    );

    const langColors: Record<string, string> = {
        c: '#555555',
        cpp: '#00599C',
        python: '#3776AB',
        java: '#ED8B00',
        javascript: '#F7DF1E',
        sql: '#336791',
        bash: '#4EAA25',
    };

    const maxLangTotal = Math.max(...Object.values(analytics.languageAnalysis).map(v => v.total), 1);

    // Generate heatmap for last 90 days
    const heatmapDays: { date: string; count: number }[] = [];
    for (let i = 89; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        heatmapDays.push({ date: dateStr, count: analytics.heatmap[dateStr] || 0 });
    }
    const maxHeatmap = Math.max(...heatmapDays.map(d => d.count), 1);

    return (
        <div className="min-h-screen bg-[#FDFDFD] dark:bg-[#0a0a0b] font-sans text-slate-900 dark:text-slate-100 p-8 transition-colors duration-500">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-10 border-b border-slate-200 dark:border-white/10 pb-6 transition-colors">
                    <div>
                        <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
                            <BarChart3 size={28} className="text-primary" /> My Analytics
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">Track your coding journey and performance</p>
                    </div>
                    <button onClick={() => router.push('/problems')} className="text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition flex items-center gap-2">
                        <ArrowLeft size={16} /> Back
                    </button>
                </div>

                {/* Top Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-10">
                    <StatCard
                        icon={<Target size={20} />}
                        label="Problems Solved"
                        value={analytics.totalSolved}
                        color="text-emerald-600"
                        bg="bg-emerald-50"
                    />
                    <StatCard
                        icon={<Zap size={20} />}
                        label="Total Submissions"
                        value={analytics.totalSubmissions}
                        color="text-blue-600"
                        bg="bg-blue-50"
                    />
                    <StatCard
                        icon={<Code2 size={20} />}
                        label="Most Used Language"
                        value={analytics.mostUsedLanguage}
                        color="text-purple-600"
                        bg="bg-purple-50"
                    />
                    <StatCard
                        icon={<Trophy size={20} />}
                        label="Contests Joined"
                        value={analytics.contestHistory.length}
                        color="text-amber-500"
                        bg="bg-amber-500/10"
                    />
                </div>

                {/* Submission Heatmap */}
                <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-3xl p-8 mb-8 shadow-sm transition-colors">
                    <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                        <Calendar size={14} /> Submission Activity (Last 90 Days)
                    </h3>
                    <div className="flex flex-wrap gap-1">
                        {heatmapDays.map((day) => {
                            const intensity = day.count === 0 ? 0 : Math.ceil((day.count / maxHeatmap) * 4);
                            const colors = ['bg-slate-100 dark:bg-white/5', 'bg-emerald-200 dark:bg-emerald-900', 'bg-emerald-300 dark:bg-emerald-700', 'bg-emerald-400 dark:bg-emerald-500', 'bg-emerald-600 dark:bg-emerald-400'];
                            return (
                                <div
                                    key={day.date}
                                    className={`w-3.5 h-3.5 rounded-sm ${colors[intensity]} transition-colors`}
                                    title={`${day.date}: ${day.count} submissions`}
                                />
                            );
                        })}
                    </div>
                    <div className="flex items-center gap-2 mt-4 text-[10px] text-slate-400 dark:text-slate-500 font-bold">
                        <span>Less</span>
                        <div className="w-3 h-3 rounded-sm bg-slate-100 dark:bg-white/5" />
                        <div className="w-3 h-3 rounded-sm bg-emerald-200 dark:bg-emerald-900" />
                        <div className="w-3 h-3 rounded-sm bg-emerald-300 dark:bg-emerald-700" />
                        <div className="w-3 h-3 rounded-sm bg-emerald-400 dark:bg-emerald-500" />
                        <div className="w-3 h-3 rounded-sm bg-emerald-600 dark:bg-emerald-400" />
                        <span>More</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    {/* Language Usage */}
                    <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-3xl p-8 shadow-sm transition-colors">
                        <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                            <Code2 size={14} /> Language Performance
                        </h3>
                        <div className="space-y-5">
                            {Object.entries(analytics.languageAnalysis)
                                .sort(([, a], [, b]) => b.total - a.total)
                                .map(([lang, stats]) => (
                                    <div key={lang}>
                                        <div className="flex justify-between items-center mb-2">
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: langColors[lang] || '#888' }} />
                                                <span className="text-sm font-bold text-slate-700 dark:text-slate-300 capitalize">{lang}</span>
                                            </div>
                                            <div className="flex items-center gap-3 text-xs text-slate-400 dark:text-slate-500">
                                                <span className="flex items-center gap-1">
                                                    <CheckCircle2 size={12} className="text-emerald-500" /> {stats.passed}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <XCircle size={12} className="text-red-400" /> {stats.failed}
                                                </span>
                                                <span className="font-bold text-slate-600 dark:text-slate-400">{stats.successRate}%</span>
                                            </div>
                                        </div>
                                        <div className="w-full h-2.5 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden transition-colors">
                                            <div
                                                className="h-full rounded-full transition-all duration-500"
                                                style={{
                                                    width: `${(stats.total / maxLangTotal) * 100}%`,
                                                    backgroundColor: langColors[lang] || '#888'
                                                }}
                                            />
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </div>

                    {/* Difficulty Breakdown */}
                    <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-3xl p-8 shadow-sm transition-colors">
                        <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                            <TrendingUp size={14} /> Difficulty Breakdown
                        </h3>
                        <div className="space-y-8">
                            {['Easy', 'Medium', 'Hard'].map(diff => {
                                const count = analytics.difficultyBreakdown[diff as keyof typeof analytics.difficultyBreakdown] || 0;
                                const colors = {
                                    Easy: { bg: 'bg-emerald-500', light: 'bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400' },
                                    Medium: { bg: 'bg-amber-500', light: 'bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400' },
                                    Hard: { bg: 'bg-red-500', light: 'bg-red-500/10', text: 'text-red-600 dark:text-red-400' },
                                };
                                const c = colors[diff as keyof typeof colors];
                                return (
                                    <div key={diff} className="flex items-center gap-4">
                                        <div className={`w-14 h-14 ${c.light} rounded-2xl flex items-center justify-center transition-colors`}>
                                            <span className={`text-2xl font-black ${c.text}`}>{count}</span>
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{diff}</p>
                                            <div className="w-full h-2 bg-slate-100 dark:bg-white/5 rounded-full mt-2 overflow-hidden transition-colors">
                                                <div
                                                    className={`h-full ${c.bg} rounded-full`}
                                                    style={{ width: `${analytics.totalSolved > 0 ? (count / analytics.totalSolved) * 100 : 0}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Coding vs SQL */}
                        <div className="mt-10 border-t border-slate-100 dark:border-white/10 pt-8 transition-colors">
                            <h4 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                <Database size={14} /> Coding vs SQL
                            </h4>
                            <div className="flex gap-6">
                                <div className="flex-1 text-center bg-blue-500/10 rounded-2xl p-5 border border-blue-500/20">
                                    <Code2 size={24} className="text-blue-500 mx-auto mb-2" />
                                    <p className="text-3xl font-black text-blue-600 dark:text-blue-400">{analytics.codingVsSql.coding}</p>
                                    <p className="text-[10px] font-bold text-blue-500 dark:text-blue-500/80 uppercase mt-1">Coding</p>
                                </div>
                                <div className="flex-1 text-center bg-purple-500/10 rounded-2xl p-5 border border-purple-500/20">
                                    <Database size={24} className="text-purple-500 mx-auto mb-2" />
                                    <p className="text-3xl font-black text-purple-600 dark:text-purple-400">{analytics.codingVsSql.sql}</p>
                                    <p className="text-[10px] font-bold text-purple-500 dark:text-purple-500/80 uppercase mt-1">SQL</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Contest History */}
                {analytics.contestHistory.length > 0 && (
                    <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-3xl p-8 shadow-sm transition-colors">
                        <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                            <Award size={14} /> Contest History
                        </h3>
                        <div className="space-y-4">
                            {analytics.contestHistory.map((ch) => (
                                <div key={ch.contestId} className="flex items-center justify-between p-5 border border-slate-100 dark:border-white/10 rounded-2xl hover:border-slate-300 dark:hover:border-white/20 transition-all">
                                    <div>
                                        <h4 className="font-bold text-slate-900 dark:text-slate-100">{ch.contestTitle}</h4>
                                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                                            {new Date(ch.startTime).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-6 text-sm">
                                        <div className="text-center">
                                            <p className="font-black text-emerald-600 dark:text-emerald-500">{ch.solvedCount}</p>
                                            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase">Solved</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="font-black text-blue-600 dark:text-blue-500">{ch.score}</p>
                                            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase">Score</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="font-mono text-slate-600 dark:text-slate-400">{ch.penaltyTime}m</p>
                                            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase">Penalty</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function StatCard({ icon, label, value, color, bg }: {
    icon: React.ReactNode; label: string; value: string | number; color: string; bg: string;
}) {
    return (
        <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-3xl p-6 shadow-sm hover:shadow-lg dark:hover:border-white/20 hover:-translate-y-0.5 transition-all">
            <div className={`w-12 h-12 ${bg} rounded-2xl flex items-center justify-center mb-4 ${color}`}>
                {icon}
            </div>
            <p className="text-[10px] uppercase font-black text-slate-400 dark:text-slate-500 tracking-[0.15em] mb-1">{label}</p>
            <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter capitalize transition-colors">{value}</p>
        </div>
    );
}
