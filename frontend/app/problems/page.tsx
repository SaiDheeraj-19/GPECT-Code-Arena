/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "../../lib/api";
import { useAuthStore } from "../../store/auth";
import {
    Terminal,
    CheckCircle2,
    Search as SearchIcon,
    Flame,
    Code2,
    Database,
    Globe,
    Lock,
    Zap,
    Briefcase
} from "lucide-react";
import { Navbar } from "../../components/Navbar";

interface Problem {
    id: string;
    title: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    tags: string[];
    problem_type: 'CODING' | 'SQL' | 'WEB_DEV' | 'INTERVIEW';
    acceptanceRate: number;
    status: 'SOLVED' | 'ATTEMPTED' | null;
    likes_count: number;
    is_interview: boolean;
    isLocked?: boolean;
}

export default function StudentDashboard() {
    const user = useAuthStore(state => state.user);
    const router = useRouter();

    const [problems, setProblems] = useState<Problem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeType, setActiveType] = useState<string>('ALL');

    useEffect(() => {
        if (!user) {
            router.push('/');
            return;
        }
        fetchData();
    }, [user, router]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/problems');
            setProblems(data);
        } catch (e) {
            console.error('Error fetching data:', e);
        } finally {
            setLoading(false);
        }
    };

    const filteredProblems = problems.filter(p => {
        const title = p.title || "Untitled Problem";
        const matchesSearch = title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType = activeType === 'ALL' ||
            (activeType === 'INTERVIEW' ? p.is_interview : p.problem_type === activeType);
        return matchesSearch && matchesType;
    });

    const stats = {
        total: problems.length,
        solved: problems.filter(p => p.status === 'SOLVED').length,
        easy: problems.filter(p => p.difficulty === 'Easy' && p.status === 'SOLVED').length,
        medium: problems.filter(p => p.difficulty === 'Medium' && p.status === 'SOLVED').length,
        hard: problems.filter(p => p.difficulty === 'Hard' && p.status === 'SOLVED').length,
    };

    const typeIcons: any = {
        'ALL': <Code2 size={16} />,
        'CODING': <Terminal size={14} />,
        'SQL': <Database size={14} />,
        'WEB_DEV': <Globe size={14} />,
        'INTERVIEW': <Briefcase size={14} />
    };

    return (
        <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/30 selection:text-foreground">
            <Navbar />

            <main className="pt-24 min-h-screen px-6 md:px-12 pb-20 max-w-7xl mx-auto space-y-12">
                {/* Welcome Hero */}
                <div className="relative p-10 md:p-14 rounded-[48px] bg-card border border-border overflow-hidden shadow-2xl">
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-12">
                        <div className="space-y-6 text-center md:text-left">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] font-black uppercase tracking-[0.2em]">
                                <Zap size={14} className="fill-amber-500" />
                                Ranked Season 2 is Live
                            </div>
                            <h2 className="text-5xl md:text-7xl font-black text-foreground tracking-tighter leading-[0.9]">
                                READY TO <br />
                                <span className="text-amber-500">DOMINATE?</span>
                            </h2>
                            <p className="text-muted-foreground font-bold text-xs uppercase tracking-[0.2em] max-w-sm leading-relaxed">
                                {user?.name || 'Guest'}, you have <span className="text-foreground">{user?.points || 0}</span> honor points and a <span className="text-foreground">{user?.streak || 0}</span> day fire streak.
                            </p>
                        </div>

                        <div className="flex gap-4">
                            <HeroStat value={user?.points || 0} label="Points" color="text-amber-500" />
                            <HeroStat value={user?.streak || 0} label="Streak" color="text-orange-500" icon={<Flame size={20} className="fill-orange-500" />} />
                        </div>
                    </div>

                    {/* Decorative Elements */}
                    <div className="absolute right-0 top-0 w-1/2 h-full bg-gradient-to-l from-amber-500/5 to-transparent pointer-events-none" />
                    <div className="absolute -right-20 -top-20 size-80 bg-amber-500/5 rounded-full blur-[100px]" />
                </div>

                {/* Filter Tabs */}
                <div className="flex flex-wrap items-center gap-2 bg-secondary p-1.5 rounded-3xl border border-border backdrop-blur-md sticky top-32 z-30 w-fit mx-auto md:mx-0">
                    {['ALL', 'CODING', 'SQL', 'WEB_DEV', 'INTERVIEW'].map((type) => (
                        <button
                            key={type}
                            onClick={() => setActiveType(type)}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${activeType === type
                                ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                                : 'text-muted-foreground hover:text-foreground hover:bg-foreground/5'
                                }`}
                        >
                            {typeIcons[type]}
                            {type.replace('_', ' ')}
                        </button>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Problems Table */}
                    <div className="lg:col-span-8 space-y-6">
                        <div className="flex items-center justify-between px-2">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground flex items-center gap-2">
                                <Terminal size={14} /> Available Missions
                            </h3>
                            <div className="flex gap-2">
                                <div className="flex items-center bg-secondary rounded-xl px-4 border border-border group focus-within:border-primary/50 transition-all">
                                    <SearchIcon size={14} className="text-muted-foreground group-focus-within:text-primary" />
                                    <input
                                        placeholder="Filter results..."
                                        className="bg-transparent border-none focus:ring-0 text-[10px] text-foreground px-3 w-40 uppercase font-bold tracking-widest placeholder:text-muted-foreground group-focus-within:placeholder:text-primary/50 outline-none h-10"
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="bg-card rounded-[40px] border border-border overflow-hidden shadow-2xl relative">
                            {loading ? (
                                <div className="py-40 flex flex-col items-center gap-4">
                                    <div className="size-10 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Querying DB...</p>
                                </div>
                            ) : filteredProblems.length > 0 ? (
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-border">
                                            <th className="px-8 py-6 text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground">Intel</th>
                                            <th className="px-6 py-6 text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground">Precision</th>
                                            <th className="px-6 py-6 text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground text-right">Difficulty</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/[0.02]">
                                        {filteredProblems.map((p) => (
                                            <tr
                                                key={p.id}
                                                onClick={() => {
                                                    if (p.isLocked) {
                                                        alert("This mission is locked. Reach 10,000 honor points to unlock Interview Elite missions!");
                                                        return;
                                                    }
                                                    router.push(`/problems/${p.id}`);
                                                }}
                                                className={`group transition-all ${p.isLocked ? 'opacity-50 grayscale cursor-not-allowed bg-black/20' : 'hover:bg-white/[0.02] cursor-pointer'}`}
                                            >
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-5">
                                                        <div className={`size-10 rounded-2xl flex items-center justify-center transition-all ${p.status === 'SOLVED' ? 'bg-emerald-500/10 text-emerald-500' :
                                                            p.status === 'ATTEMPTED' ? 'bg-amber-500/10 text-amber-500' :
                                                                'bg-white/5 text-slate-700'
                                                            }`}>
                                                            {p.isLocked ? <Lock size={18} /> : p.status === 'SOLVED' ? <CheckCircle2 size={18} /> : <Code2 size={18} />}
                                                        </div>
                                                        <div className="space-y-1">
                                                            <div className="flex items-center gap-3">
                                                                <p className={`text-base font-black tracking-tight uppercase ${p.isLocked ? 'text-muted-foreground/30' : 'text-foreground group-hover:text-primary transition-colors'}`}>{p.title}</p>
                                                                {p.is_interview && <div className="px-2 py-0.5 rounded-md bg-purple-500/10 border border-purple-500/20 text-purple-500 text-[8px] font-black uppercase tracking-widest">Interview</div>}
                                                            </div>
                                                            <div className="flex gap-3">
                                                                {p.tags.slice(0, 3).map((tag, i) => (
                                                                    <span key={i} className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-600">{tag}</span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="flex-1 w-20 h-1.5 bg-secondary rounded-full overflow-hidden">
                                                            <div className={`h-full transition-all duration-1000 ${p.isLocked ? 'bg-muted' : 'bg-primary/50 group-hover:bg-primary'}`} style={{ width: p.isLocked ? '0%' : `${p.acceptanceRate}%` }}></div>
                                                        </div>
                                                        <span className="text-[11px] font-black text-muted-foreground font-mono italic">{p.isLocked ? '--' : p.acceptanceRate}%</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-6 text-right">
                                                    {p.isLocked ? (
                                                        <span className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-700 px-3 py-1.5 rounded-lg border border-white/5">Locked</span>
                                                    ) : (
                                                        <span className={`text-[9px] font-black uppercase tracking-widest px-4 py-2 rounded-xl border ${p.difficulty === 'Easy' ? 'text-emerald-500 border-emerald-500/20 bg-emerald-500/5' :
                                                            p.difficulty === 'Medium' ? 'text-amber-500 border-amber-500/20 bg-amber-500/5' :
                                                                'text-red-500 border-red-500/20 bg-red-500/5'
                                                            }`}>
                                                            {p.difficulty}
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <div className="py-40 text-center space-y-4">
                                    <div className="size-20 bg-white/5 rounded-[32px] flex items-center justify-center mx-auto text-slate-800">
                                        <SearchIcon size={40} />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">No Data Detected</p>
                                        <p className="text-[9px] font-bold text-slate-700 uppercase tracking-widest">Adjust filters to re-scan</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Stats Panel */}
                    <div className="lg:col-span-4 space-y-8 h-fit lg:sticky lg:top-36">
                        <div className="bg-card rounded-[48px] border border-border p-10 space-y-10 shadow-2xl relative overflow-hidden group">
                            <div className="space-y-8 relative z-10">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Mission Report</h4>
                                    <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[8px] font-black uppercase tracking-widest">Updating Live</div>
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    <StatBox value={stats.easy} label="Easy" color="text-emerald-500" />
                                    <StatBox value={stats.medium} label="Mid" color="text-amber-500" />
                                    <StatBox value={stats.hard} label="Hard" color="text-red-500" />
                                </div>

                                <div className="space-y-4 border-t border-border pt-10">
                                    <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                        <span>Total Efficiency</span>
                                        <span className="text-foreground">{stats.total > 0 ? Math.round((stats.solved / stats.total) * 100) : 0}%</span>
                                    </div>
                                    <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                                        <div className="h-full bg-gradient-to-r from-primary to-primary/80" style={{ width: `${stats.total > 0 ? (stats.solved / stats.total) * 100 : 0}%` }}></div>
                                    </div>
                                </div>
                            </div>
                            <div className="absolute -right-10 -bottom-10 size-40 bg-amber-500/5 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000"></div>
                        </div>

                        {/* Interview Promo */}
                        <div className="bg-gradient-to-br from-purple-500/20 to-transparent p-10 rounded-[48px] border border-purple-500/20 relative overflow-hidden group">
                            <div className="relative z-10 space-y-6">
                                <div className="size-14 bg-purple-500/20 rounded-2xl flex items-center justify-center text-purple-500 shadow-inner group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                                    <Briefcase size={28} />
                                </div>
                                <div className="space-y-2">
                                    <h5 className="font-black text-xl text-foreground uppercase tracking-tighter leading-none">Interview<br />Elite Mode</h5>
                                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest leading-relaxed">Unlock technical interview sims from FAANG companies.</p>
                                </div>
                                <div className="space-y-3 pt-2">
                                    <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest mb-3">
                                        <span className="text-muted-foreground">Access Progress</span>
                                        <span className="text-foreground">{(user?.points || 0)} / 10000 XP</span>
                                    </div>
                                    <div className="h-2 bg-secondary rounded-full overflow-hidden border border-border p-0.5">
                                        <div className="h-full bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)] transition-all duration-1000" style={{ width: `${Math.min((user?.points || 0) / 100, 100)}%` }}></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

function HeroStat({ value, label, color, icon }: { value: any, label: string, color: string, icon?: any }) {
    return (
        <div className="bg-foreground/5 backdrop-blur-xl p-8 rounded-[32px] text-center min-w-[140px] border border-border hover:border-primary/20 transition-all group">
            <div className="flex justify-center mb-3 group-hover:scale-110 transition-transform">{icon || <div className="size-5" />}</div>
            <div className={`text-4xl font-black ${color} leading-none font-mono`}>{value}</div>
            <div className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] mt-3">{label}</div>
        </div>
    );
}

function StatBox({ value, label, color }: { value: number, label: string, color: string }) {
    return (
        <div className="bg-secondary p-5 rounded-[24px] text-center space-y-2 group hover:bg-muted transition-all border border-transparent hover:border-border">
            <p className={`text-2xl font-black ${color} leading-none font-mono`}>{value}</p>
            <p className="text-[8px] font-black uppercase text-muted-foreground tracking-tighter truncate">{label}</p>
        </div>
    );
}
