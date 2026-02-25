/* eslint-disable */
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "../../store/auth";
import api from "../../lib/api";
import { Navbar } from "../../components/Navbar";
import { Footer } from "../../components/Footer";
import { Trophy, Code2, Award, Terminal, CheckCircle2 } from "lucide-react";

export default function ProfilePage() {
    const { user } = useAuthStore();
    const router = useRouter();

    const [stats, setStats] = useState({ totalSolved: 0, easy: 0, medium: 0, hard: 0 });
    const [recentProblems, setRecentProblems] = useState<any[]>([]);
    const [certificates, setCertificates] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

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

            // Get 5 most recent problems (assuming array is somewhat chronological)
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
            <div className="min-h-screen flex items-center justify-center bg-[#FDFDFD] dark:bg-[#0a0a0b] transition-colors duration-500">
                <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0b] text-slate-900 dark:text-slate-100 font-display selection:bg-primary selection:text-white dark:selection:text-background-dark transition-colors duration-500 overflow-x-hidden">
            <Navbar />

            <main className="pt-32 pb-20 px-6 max-w-5xl mx-auto relative z-10 transition-colors">
                {/* Profile Header */}
                <div className="bg-white dark:bg-[#121212] rounded-3xl p-8 border border-slate-200 dark:border-white/5 shadow-xl dark:shadow-none mb-10 flex flex-col md:flex-row items-center gap-8">
                    <div className="size-24 rounded-full border-4 border-primary p-1 shrink-0">
                        <div className="w-full h-full rounded-full overflow-hidden bg-slate-100 dark:bg-white/5 flex items-center justify-center">
                            {user?.avatar_url ? (
                                <img src={user.avatar_url} alt={user.name} className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-3xl font-bold text-slate-400">
                                    {user?.name?.charAt(0) || 'U'}
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="flex-1 text-center md:text-left space-y-2">
                        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">{user?.name}</h1>
                        <p className="text-slate-500 dark:text-slate-400 font-medium">
                            {user?.roll_number ? `${user.roll_number} • ` : ''}GPCET Engineer
                        </p>
                        {user?.bio && <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">{user.bio}</p>}
                    </div>
                    <div className="flex gap-4 shrink-0">
                        <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 px-6 py-4 rounded-2xl text-center">
                            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-500">{user?.points || 0}</div>
                            <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-500 uppercase tracking-widest mt-1">XP Points</div>
                        </div>
                        <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-6 py-4 rounded-2xl text-center">
                            <div className="text-2xl font-black text-amber-600 dark:text-amber-500">{user?.streak || 0}</div>
                            <div className="text-[10px] font-bold text-amber-600 dark:text-amber-500 uppercase tracking-widest mt-1">Day Streak</div>
                        </div>
                    </div>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {/* Left Column: Stats & Problems */}
                    <div className="md:col-span-2 space-y-8">
                        {/* Summary Stats */}
                        <div className="bg-white dark:bg-[#121212] p-8 rounded-3xl border border-slate-200 dark:border-white/5 shadow-xl dark:shadow-none">
                            <h2 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
                                <Terminal size={16} /> Coding Activity
                            </h2>
                            <div className="grid grid-cols-4 gap-4 text-center">
                                <div className="space-y-2">
                                    <div className="text-3xl font-bold text-slate-900 dark:text-white">{stats.totalSolved}</div>
                                    <div className="text-[10px] font-bold text-slate-500 uppercase">Total Solved</div>
                                </div>
                                <div className="space-y-2">
                                    <div className="text-3xl font-bold text-emerald-500">{stats.easy}</div>
                                    <div className="text-[10px] font-bold text-emerald-600 uppercase">Easy</div>
                                </div>
                                <div className="space-y-2">
                                    <div className="text-3xl font-bold text-amber-500">{stats.medium}</div>
                                    <div className="text-[10px] font-bold text-amber-600 uppercase">Medium</div>
                                </div>
                                <div className="space-y-2">
                                    <div className="text-3xl font-bold text-red-500">{stats.hard}</div>
                                    <div className="text-[10px] font-bold text-red-600 uppercase">Hard</div>
                                </div>
                            </div>
                        </div>

                        {/* Recent Problems Solved */}
                        <div className="bg-white dark:bg-[#121212] p-8 rounded-3xl border border-slate-200 dark:border-white/5 shadow-xl dark:shadow-none">
                            <h2 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
                                <Code2 size={16} /> Recently Solved
                            </h2>
                            {recentProblems.length > 0 ? (
                                <div className="space-y-3">
                                    {recentProblems.map((p) => (
                                        <div key={p.id} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-white/[0.02]">
                                            <div className="flex items-center gap-3">
                                                <CheckCircle2 size={18} className="text-emerald-500" />
                                                <span className="font-bold text-sm text-slate-900 dark:text-white">{p.title}</span>
                                            </div>
                                            <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${p.difficulty === 'Easy' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10' :
                                                p.difficulty === 'Medium' ? 'bg-amber-50 text-amber-600 dark:bg-amber-500/10' :
                                                    'bg-red-50 text-red-600 dark:bg-red-500/10'
                                                }`}>
                                                {p.difficulty}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-10">
                                    <p className="text-sm text-slate-500 font-medium">No problems solved yet.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Certifications */}
                    <div className="space-y-8">
                        <div className="bg-white dark:bg-[#121212] p-8 rounded-3xl border border-slate-200 dark:border-white/5 shadow-xl dark:shadow-none h-full">
                            <h2 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
                                <Award size={16} /> Certifications
                            </h2>
                            {certificates.length > 0 ? (
                                <div className="space-y-4">
                                    {certificates.map((cert) => (
                                        <div key={cert.id} className="p-4 rounded-2xl border border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-white/[0.02] hover:border-primary/50 transition-colors">
                                            <div className="flex items-start gap-4 mb-3">
                                                <div className="size-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary shrink-0">
                                                    <Trophy size={20} />
                                                </div>
                                                <div>
                                                    <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight mb-1">{cert.contest?.title || 'Contest Participation'}</h3>
                                                    <p className="text-xs text-slate-500 font-medium">{cert.certificate_type} Certificate</p>
                                                </div>
                                            </div>
                                            {cert.certificate_url && (
                                                <a href={cert.certificate_url} target="_blank" rel="noreferrer" className="block text-center text-xs font-bold text-primary hover:text-primary/80 transition-colors bg-primary/5 rounded-lg py-2">
                                                    View Certificate
                                                </a>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-10 space-y-3">
                                    <div className="size-12 bg-slate-100 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto">
                                        <Award size={20} className="text-slate-400" />
                                    </div>
                                    <p className="text-sm text-slate-500 font-medium">Participate in contests to earn certifications.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
