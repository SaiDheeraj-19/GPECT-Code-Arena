"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Zap, Target, User as UserIcon } from "lucide-react";
import { Navbar } from "../../components/Navbar";
import { Footer } from "../../components/Footer";
import Image from "next/image";

interface LeaderboardUser {
    id: string;
    name: string;
    username: string;
    roll_number: string;
    points: number;
    streak: number;
    avatar_url: string;
    rank: number;
}

const getRankTheme = (points: number) => {
    if (points >= 15000) return { name: 'RADIANT', color: 'text-rose-400', glow: 'shadow-[0_0_15px_rgba(244,63,94,0.4)]', bg: 'bg-rose-400/10', border: 'border-rose-400/30' };
    if (points >= 10000) return { name: 'DIAMOND', color: 'text-indigo-400', glow: 'shadow-[0_0_12px_rgba(129,140,248,0.4)]', bg: 'bg-indigo-400/10', border: 'border-indigo-400/30' };
    if (points >= 6000) return { name: 'PLATINUM', color: 'text-teal-400', glow: 'shadow-[0_0_10px_rgba(45,212,191,0.4)]', bg: 'bg-teal-400/10', border: 'border-teal-400/30' };
    if (points >= 3000) return { name: 'GOLD', color: 'text-amber-400', glow: 'shadow-[0_0_8px_rgba(251,191,36,0.4)]', bg: 'bg-amber-400/10', border: 'border-amber-400/30' };
    if (points >= 1500) return { name: 'SILVER', color: 'text-slate-300', glow: 'shadow-[0_0_6px_rgba(203,213,225,0.3)]', bg: 'bg-slate-300/10', border: 'border-slate-300/30' };
    if (points >= 500) return { name: 'BRONZE', color: 'text-orange-400', glow: '', bg: 'bg-orange-400/10', border: 'border-orange-400/30' };
    return { name: 'NOVICE', color: 'text-slate-500', glow: '', bg: 'bg-slate-500/10', border: 'border-slate-500/20' };
};

export default function LeaderboardPage() {
    const [users, setUsers] = useState<LeaderboardUser[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/submissions/global/leaderboard`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });
                if (response.ok) {
                    const data = await response.json();
                    setUsers(data);
                }
            } catch (error) {
                console.error('Failed to fetch leaderboard:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchLeaderboard();
    }, []);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0b] text-slate-900 dark:text-slate-100 font-display selection:bg-primary selection:text-white dark:selection:text-background-dark transition-colors duration-500 overflow-x-hidden">
            <Navbar />

            <main className="pt-32 pb-20 px-4 md:px-8 max-w-5xl mx-auto">
                <div className="flex flex-col items-center justify-center text-center mb-12">
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] font-black uppercase tracking-[0.3em] mb-6"
                    >
                        Hall of Fame
                    </motion.div>
                    <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-4 text-slate-900 dark:text-white leading-[0.9]">
                        TOP <span className="text-amber-500">ENGINEERS</span>
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 max-w-xl text-lg font-medium px-4">
                        Recognizing the elite minds pushing the boundaries of competitive programming at GPCET.
                    </p>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white dark:bg-[#111113] border border-slate-200 dark:border-white/5 rounded-[48px] overflow-hidden shadow-2xl transition-all"
                >
                    <div className="grid grid-cols-[60px_1fr_120px_100px] md:grid-cols-[100px_1fr_180px_140px] px-8 py-8 border-b border-slate-200 dark:border-white/5 text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">
                        <div>Rank</div>
                        <div>Engineer</div>
                        <div className="text-center">Honor & Rank</div>
                        <div className="text-right">Streak</div>
                    </div>

                    <div className="divide-y divide-slate-100 dark:divide-white/5 min-h-[400px]">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-40 gap-4">
                                <Zap className="text-amber-500 animate-pulse" size={40} />
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Loading Rankings...</span>
                            </div>
                        ) : users.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-40 gap-4 text-slate-500">
                                <Target size={40} opacity={0.2} />
                                <span className="text-[10px] font-black uppercase tracking-widest">No candidates found yet</span>
                            </div>
                        ) : (
                            users.map((user, idx) => {
                                const theme = getRankTheme(user.points);
                                return (
                                    <motion.div
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.02 }}
                                        key={user.id}
                                        className="grid grid-cols-[60px_1fr_120px_100px] md:grid-cols-[100px_1fr_180px_140px] px-8 py-6 items-center hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-all group"
                                    >
                                        <div className={`font-black text-2xl md:text-3xl tracking-tighter ${user.rank === 1 ? 'text-amber-500' :
                                            user.rank === 2 ? 'text-slate-400' :
                                                user.rank === 3 ? 'text-orange-500' :
                                                    'text-slate-300 dark:text-slate-800'
                                            }`}>
                                            #{user.rank}
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <div className={`size-12 rounded-full overflow-hidden border-2 flex-shrink-0 relative transition-transform group-hover:scale-110 ${theme.border} ${theme.glow}`}>
                                                {user.avatar_url ? (
                                                    <Image src={user.avatar_url} alt="" fill className="object-cover" />
                                                ) : (
                                                    <div className="w-full h-full bg-slate-200 dark:bg-white/5 flex items-center justify-center text-slate-500">
                                                        <UserIcon size={20} />
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <div className="font-black text-slate-900 dark:text-white text-base leading-tight uppercase tracking-tighter">
                                                    {user.name}
                                                </div>
                                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                    {user.roll_number || user.username || 'Engineer'}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-col items-center gap-1">
                                            <div className="text-lg font-black text-slate-900 dark:text-white tracking-tighter">
                                                {user.points} <span className="text-[10px] text-amber-500 tracking-normal antialiased">HP</span>
                                            </div>
                                            <span className={`text-[8px] font-black px-2 py-0.5 rounded-full ${theme.bg} ${theme.color} border ${theme.border} tracking-widest`}>
                                                {theme.name}
                                            </span>
                                        </div>

                                        <div className="text-right flex flex-col items-end">
                                            <div className="flex items-center gap-1 text-orange-500 font-black">
                                                <Zap size={14} className="fill-current" />
                                                <span className="text-lg tracking-tighter">{user.streak}</span>
                                            </div>
                                            <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Day Streak</span>
                                        </div>
                                    </motion.div>
                                );
                            })
                        )}
                    </div>
                </motion.div>

                <Footer />
            </main>
        </div>
    );
}
