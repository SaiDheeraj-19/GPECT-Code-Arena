/* eslint-disable */
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "../../store/auth";
import api from "../../lib/api";
import { Navbar } from "../../components/Navbar";
import { Footer } from "../../components/Footer";
import { OnboardingModal } from "../../components/OnboardingModal";
import { motion, AnimatePresence } from "framer-motion";
import {
    Star,
    ArrowRight,
    Zap,
    Shield,
    TrendingUp,
    Activity,
    Code2,
    CheckCircle2,
    Terminal,
    Award,
    LayoutDashboard,
    Trophy
} from "lucide-react";

export default function ProfilePage() {
    const { user } = useAuthStore();
    const router = useRouter();

    const [stats, setStats] = useState({ totalSolved: 0, easy: 0, medium: 0, hard: 0 });
    const [recentProblems, setRecentProblems] = useState<any[]>([]);
    const [certificates, setCertificates] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'monthly' | 'all'>('all');

    useEffect(() => {
        if (!user) {
            router.push('/');
            return;
        }
        fetchProfileData();
    }, [user, router]);

    const fetchProfileData = async () => {
        try {
            setLoading(true);
            const [problemsRes, certsRes] = await Promise.all([
                api.get('/problems'),
                api.get('/certificates/my').catch(() => ({ data: [] }))
            ]);

            const allProblems = problemsRes.data || [];
            const solved = allProblems.filter((p: any) => p.status === 'SOLVED');

            setStats({
                totalSolved: solved.length,
                easy: solved.filter((p: any) => p.difficulty === 'Easy').length,
                medium: solved.filter((p: any) => p.difficulty === 'Medium').length,
                hard: solved.filter((p: any) => p.difficulty === 'Hard').length
            });

            // Get 5 most recent problems
            setRecentProblems(solved.slice(0, 5));

            if (certsRes.data) {
                setCertificates(certsRes.data);
            }
        } catch (error) {
            console.error('Error fetching profile data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0a0a0b]">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                    <Zap className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary animate-pulse" size={20} />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#070708] text-slate-100 font-display selection:bg-primary selection:text-background-dark overflow-x-hidden">
            {user?.role === 'STUDENT' && user?.is_profile_complete === false && (
                <OnboardingModal />
            )}

            <Navbar />

            {/* Premium Background Elements */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[150px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-amber-500/5 blur-[150px] rounded-full" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] bg-blue-500/5 blur-[180px] rounded-full" />
                <div className="bg-noise absolute inset-0 opacity-[0.03]" />
            </div>

            <main className="pt-32 pb-20 px-4 md:px-8 max-w-7xl mx-auto relative z-10">

                {/* Dashboard Headline */}
                <header className="mb-12">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-3 mb-4"
                    >
                        <div className="px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-[0.2em]">
                            System Active
                        </div>
                        <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
                    </motion.div>
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-5xl md:text-6xl font-black tracking-tighter"
                    >
                        COMMAND <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-white/40">CENTER.</span>
                    </motion.h1>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* PROFILE CARD & PRIMARY STATS (L-Column) */}
                    <div className="lg:col-span-4 space-y-8">

                        {/* Profile Identity Card */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="glass-card rounded-[40px] p-8 relative overflow-hidden group"
                        >
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <Shield size={80} />
                            </div>

                            <div className="relative z-10 flex flex-col items-center text-center">
                                <div className="relative mb-6">
                                    <div className="size-32 rounded-[40px] border-2 border-white/10 p-2 rotate-3 group-hover:rotate-0 transition-transform duration-500">
                                        <div className="w-full h-full rounded-[32px] overflow-hidden bg-white/5 flex items-center justify-center relative border border-white/5">
                                            {user?.avatar_url ? (
                                                <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-amber-500/20">
                                                    <span className="text-4xl font-black text-white/20">{user?.name?.charAt(0)}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <motion.div
                                        animate={{ y: [0, -5, 0] }}
                                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                                        className="absolute -bottom-2 -right-2 size-10 bg-primary rounded-2xl flex items-center justify-center text-background-dark shadow-xl shadow-primary/20 border-4 border-[#121214]"
                                    >
                                        <Zap size={18} className="fill-current" />
                                    </motion.div>
                                </div>

                                <h2 className="text-2xl font-black tracking-tight text-white mb-1 uppercase">{user?.name}</h2>
                                <p className="text-xs font-bold text-slate-500 tracking-[0.2em] uppercase mb-6">
                                    {user?.roll_number || 'IDENTIFIED ENGINEER'}
                                </p>

                                <div className="grid grid-cols-2 gap-3 w-full">
                                    <div className="bg-white/5 border border-white/5 rounded-2xl p-4 text-center">
                                        <div className="text-xl font-black text-amber-500 leading-none mb-1">{user?.points || 0}</div>
                                        <div className="text-[8px] font-black uppercase tracking-widest text-slate-500">Total HP</div>
                                    </div>
                                    <div className="bg-white/5 border border-white/5 rounded-2xl p-4 text-center">
                                        <div className="text-xl font-black text-primary leading-none mb-1">{user?.streak || 0}</div>
                                        <div className="text-[8px] font-black uppercase tracking-widest text-slate-500">Day Streak</div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Quick Metrics */}
                        <div className="grid grid-cols-1 gap-4">
                            <StatPill icon={TrendingUp} label="Acceptance" value={stats.totalSolved > 0 ? "100%" : "0.0%"} color="text-blue-400" bg="bg-blue-400/10" dot="bg-blue-400" />
                            <StatPill icon={Star} label="Global Rank" value="Unranked" color="text-amber-400" bg="bg-amber-400/10" dot="bg-amber-400" />
                            <StatPill icon={Activity} label="Arena Level" value={`Level ${Math.floor(stats.totalSolved / 5) + 1}`} color="text-primary" bg="bg-primary/10" dot="bg-primary" />
                        </div>
                    </div>

                    {/* ACTIVITY & CONTENT (R-Column) */}
                    <div className="lg:col-span-8 space-y-8">

                        {/* Summary Visualization */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-white/5 border border-white/5 rounded-[40px] p-8 md:p-10 relative overflow-hidden"
                        >
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-10">
                                <div>
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary mb-2">Performance Matrix</h3>
                                    <h4 className="text-3xl font-black tracking-tighter">MISSION LOGS</h4>
                                </div>
                                <div className="flex gap-2 bg-black/20 p-1.5 rounded-2xl border border-white/5">
                                    <button
                                        onClick={() => setActiveTab('monthly')}
                                        className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === 'monthly' ? 'bg-primary text-background-dark shadow-lg shadow-primary/20' : 'text-slate-500 hover:text-white'}`}
                                    >
                                        Monthly
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('all')}
                                        className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === 'all' ? 'bg-primary text-background-dark shadow-lg shadow-primary/20' : 'text-slate-500 hover:text-white'}`}
                                    >
                                        All Time
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                                <BigMetric label="Total Solved" value={activeTab === 'all' ? stats.totalSolved : 0} sub="Missions" />
                                <BigMetric label="Easy" value={activeTab === 'all' ? stats.easy : 0} sub="Scout" color="text-emerald-500" />
                                <BigMetric label="Medium" value={activeTab === 'all' ? stats.medium : 0} sub="Combat" color="text-amber-500" />
                                <BigMetric label="Hard" value={activeTab === 'all' ? stats.hard : 0} sub="Elite" color="text-rose-500" />
                            </div>

                            {/* Visual Progress Bar */}
                            <div className="mt-12 space-y-2">
                                <div className="flex justify-between text-[8px] font-black uppercase tracking-widest text-slate-500">
                                    <span>Deployment Progress</span>
                                    <span>{Math.min(100, (stats.totalSolved / 50) * 100).toFixed(1)}%</span>
                                </div>
                                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden p-0.5 border border-white/5">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${Math.min(100, (stats.totalSolved / 50) * 100)}%` }}
                                        className="h-full bg-gradient-to-r from-primary to-amber-500 rounded-full shadow-[0_0_10px_rgba(34,197,94,0.3)] transition-all duration-1000"
                                    />
                                </div>
                            </div>
                        </motion.div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                            {/* Recently Solved */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="glass-card rounded-[32px] p-8 flex flex-col"
                            >
                                <div className="flex items-center justify-between mb-8">
                                    <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-3">
                                        <Code2 size={16} className="text-primary" /> Recent Missions
                                    </h3>
                                    <TrendingUp size={16} className="text-slate-600" />
                                </div>

                                <div className="space-y-3 flex-1">
                                    {recentProblems.length > 0 ? (
                                        recentProblems.map((p, i) => (
                                            <div key={p.id} className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all group cursor-pointer">
                                                <div className="flex items-center gap-3 overflow-hidden">
                                                    <div className="size-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0">
                                                        <CheckCircle2 size={14} />
                                                    </div>
                                                    <span className="font-bold text-xs truncate uppercase tracking-tight">{p.title}</span>
                                                </div>
                                                <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-md shrink-0 ml-2 ${p.difficulty === 'Easy' ? 'bg-emerald-500/10 text-emerald-500' :
                                                    p.difficulty === 'Medium' ? 'bg-amber-500/10 text-amber-500' :
                                                        'bg-rose-500/10 text-rose-500'
                                                    }`}>
                                                    {p.difficulty}
                                                </span>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="h-full flex flex-col items-center justify-center py-10 opacity-30 text-center">
                                            <Terminal size={32} className="mb-4" />
                                            <p className="text-[10px] uppercase font-black tracking-widest">No recently cleared objectives</p>
                                        </div>
                                    )}
                                </div>
                            </motion.div>

                            {/* Certifications Card */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="glass-card rounded-[32px] p-8 flex flex-col"
                            >
                                <div className="flex items-center justify-between mb-8">
                                    <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-3">
                                        <Award size={16} className="text-amber-500" /> Endorsements
                                    </h3>
                                    <LayoutDashboard size={16} className="text-slate-600" />
                                </div>

                                <div className="space-y-4 flex-1">
                                    {certificates.length > 0 ? (
                                        certificates.map((cert) => (
                                            <div key={cert.id} className="p-4 rounded-2xl border border-white/5 bg-white/[0.02] hover:border-primary/50 transition-all flex items-center gap-4 group">
                                                <div className="size-12 bg-amber-500/10 rounded-[18px] flex items-center justify-center text-amber-500 shrink-0 group-hover:scale-110 transition-transform">
                                                    <Trophy size={20} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="text-xs font-black uppercase truncate mb-0.5 tracking-tight">{cert.contest?.title || 'Contest Merit'}</h4>
                                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{cert.certificate_type}</p>
                                                </div>
                                                {cert.certificate_url && (
                                                    <a href={cert.certificate_url} target="_blank" rel="noreferrer" className="size-8 bg-white/5 rounded-lg flex items-center justify-center hover:bg-primary hover:text-background-dark transition-all">
                                                        <ArrowRight size={14} />
                                                    </a>
                                                )}
                                            </div>
                                        ))
                                    ) : (
                                        <div className="h-full flex flex-col items-center justify-center py-10 opacity-30 text-center">
                                            <Award size={32} className="mb-4" />
                                            <p className="text-[10px] uppercase font-black tracking-widest">No combat certificates earned</p>
                                        </div>
                                    )}
                                </div>
                            </motion.div>

                        </div>

                    </div>

                </div>
            </main>

            <Footer />
        </div>
    );
}

function StatPill({ icon: Icon, label, value, color, bg, dot }: any) {
    return (
        <div className="flex items-center justify-between p-4 rounded-3xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.05] transition-all">
            <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${bg} ${color}`}>
                    <Icon size={16} />
                </div>
                <div>
                    <p className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-500">{label}</p>
                    <p className="text-sm font-black text-white">{value}</p>
                </div>
            </div>
            <div className={`size-1.5 rounded-full ${dot} animate-pulse shadow-[0_0_8px] shadow-current`} />
        </div>
    );
}

function BigMetric({ label, value, sub, color = "text-white" }: any) {
    return (
        <div className="group">
            <p className="text-[8px] font-black uppercase tracking-widest text-slate-500 mb-2">{label}</p>
            <div className="flex items-baseline gap-1">
                <span className={`text-4xl font-black tracking-tighter transition-transform group-hover:scale-110 flex inline-block ${color}`}>{value}</span>
                <span className="text-[10px] font-bold text-slate-600 uppercase italic transition-opacity group-hover:opacity-100">{sub}</span>
            </div>
        </div>
    );
}

