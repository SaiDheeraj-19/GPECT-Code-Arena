"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "../../store/auth";
import api, { createWebSocket } from "../../lib/api";
import {
    Trophy, Clock, Users, ChevronRight, AlertCircle,
    CheckCircle2, Timer, ArrowLeft, Flame,
    Swords
} from "lucide-react";

import { Navbar } from "../../components/Navbar";

interface Contest {
    id: string;
    title: string;
    description?: string;
    start_time: string;
    end_time: string;
    status: 'upcoming' | 'active' | 'ended';
    problems: { id: string; title: string; difficulty: string }[];
    _count: { participations: number; submissions: number };
    admin?: { name: string };
    isRegistered?: boolean;
}

interface LeaderboardEntry {
    rank: number;
    userId: string;
    name: string;
    username: string;
    rollNumber: string;
    solvedCount: number;
    penaltyTime: number;
    score: number;
    problems: {
        problemId: string;
        problemTitle: string;
        solved: boolean;
        wrongAttempts: number;
        solveTime: number | null;
    }[];
}

export default function ContestsPage() {
    const user = useAuthStore(state => state.user);
    const router = useRouter();
    const [contests, setContests] = useState<Contest[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedContest, setSelectedContest] = useState<Contest | null>(null);
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [leaderboardLoading, setLeaderboardLoading] = useState(false);
    const [registering, setRegistering] = useState(false);
    const wsRef = useRef<WebSocket | null>(null);

    useEffect(() => {
        if (!user) { router.push('/'); return; }
        fetchContests();
    }, [user, router]);

    // WebSocket for real-time leaderboard
    useEffect(() => {
        if (!selectedContest || selectedContest.status !== 'active') return;

        const ws = createWebSocket();
        if (!ws) return;
        wsRef.current = ws;

        ws.onopen = () => {
            ws.send(JSON.stringify({ type: 'subscribe', contestId: selectedContest.id }));
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.type === 'leaderboard' && data.contestId === selectedContest.id) {
                    setLeaderboard(data.data);
                }
            } catch (e) { }
        };

        return () => {
            ws.close();
            wsRef.current = null;
        };
    }, [selectedContest]);

    const fetchContests = async () => {
        try {
            const { data } = await api.get('/contests');
            setContests(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const openContest = async (contest: Contest) => {
        setSelectedContest(contest);
        setLeaderboardLoading(true);
        try {
            const [contestRes, leaderboardRes] = await Promise.all([
                api.get(`/contests/${contest.id}`),
                api.get(`/contests/${contest.id}/leaderboard`),
            ]);
            setSelectedContest(contestRes.data);
            setLeaderboard(leaderboardRes.data.leaderboard || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLeaderboardLoading(false);
        }
    };

    const registerForContest = async () => {
        if (!selectedContest) return;
        setRegistering(true);
        try {
            await api.post(`/contests/${selectedContest.id}/register`);
            openContest(selectedContest); // Refresh
        } catch (e: any) {
            alert(e.response?.data?.error || 'Failed to register');
        } finally {
            setRegistering(false);
        }
    };

    const getTimeRemaining = (endTime: string): string => {
        const diff = new Date(endTime).getTime() - Date.now();
        if (diff <= 0) return 'Ended';
        const hours = Math.floor(diff / 3600000);
        const mins = Math.floor((diff % 3600000) / 60000);
        return `${hours}h ${mins}m remaining`;
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-[#FDFDFD] dark:bg-[#0a0a0b] transition-colors duration-500">
            <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
    );

    // ── Contest Detail View ──
    if (selectedContest) {
        const statusColors: Record<string, string> = {
            upcoming: 'bg-blue-100 text-blue-700',
            active: 'bg-emerald-100 text-emerald-700',
            ended: 'bg-slate-100 text-slate-600',
        };

        return (
            <div className="min-h-screen bg-[#FDFDFD] dark:bg-[#0a0a0b] font-sans text-slate-900 dark:text-slate-100 transition-colors duration-500">
                <Navbar />
                {/* Header */}
                <header className="pt-32 bg-white dark:bg-[#0a0a0b]/80 border-b border-slate-200 dark:border-white/10 px-8 py-6 backdrop-blur-md transition-colors">
                    <button onClick={() => setSelectedContest(null)} className="flex items-center gap-2 text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition mb-4">
                        <ArrowLeft size={16} /> Back to Contests
                    </button>
                    <div className="flex justify-between items-start">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <h1 className="text-3xl font-black tracking-tight">{selectedContest.title}</h1>
                                <span className={`text-xs font-black uppercase px-3 py-1 rounded-full ${statusColors[selectedContest.status]}`}>
                                    {selectedContest.status}
                                </span>
                            </div>
                            {selectedContest.description && (
                                <p className="text-slate-500 dark:text-slate-400 font-medium max-w-2xl transition-colors">{selectedContest.description}</p>
                            )}
                            <div className="flex items-center gap-6 mt-4 text-sm text-slate-500 dark:text-slate-400 transition-colors">
                                <span className="flex items-center gap-1.5">
                                    <Clock size={14} />
                                    {new Date(selectedContest.start_time).toLocaleString()} - {new Date(selectedContest.end_time).toLocaleString()}
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <Users size={14} />
                                    {selectedContest._count?.participations || 0} participants
                                </span>
                                {selectedContest.status === 'active' && (
                                    <span className="flex items-center gap-1.5 text-emerald-600 font-bold">
                                        <Timer size={14} />
                                        {getTimeRemaining(selectedContest.end_time)}
                                    </span>
                                )}
                            </div>
                        </div>
                        {!selectedContest.isRegistered && selectedContest.status !== 'ended' && (
                            <button
                                onClick={registerForContest}
                                disabled={registering}
                                className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-colors shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                            >
                                {registering ? 'Registering...' : 'Register Now'}
                            </button>
                        )}
                        {selectedContest.isRegistered && (
                            <span className="px-4 py-2 bg-emerald-50 text-emerald-600 font-bold text-sm rounded-xl border border-emerald-100 flex items-center gap-2">
                                <CheckCircle2 size={16} /> Registered
                            </span>
                        )}
                    </div>
                </header>

                <div className="max-w-7xl mx-auto px-8 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Problems List */}
                    <div className="lg:col-span-1">
                        <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Contest Problems</h2>
                        <div className="space-y-3">
                            {selectedContest.problems.map((p, i) => (
                                <div
                                    key={p.id}
                                    onClick={() => {
                                        if (selectedContest.status === 'active' && selectedContest.isRegistered) {
                                            router.push(`/problems/${p.id}`);
                                        } else if (!selectedContest.isRegistered) {
                                            alert("Please register for the contest to view problems.");
                                        } else if (selectedContest.status !== 'active') {
                                            alert("Problems are only available when the contest is active.");
                                        }
                                    }}
                                    className={`bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-5 ${selectedContest.status === 'active' && selectedContest.isRegistered
                                        ? 'hover:border-primary dark:hover:border-primary hover:shadow-lg cursor-pointer' : 'opacity-80'
                                        } transition-all group`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <span className="w-8 h-8 bg-slate-900 text-white rounded-lg flex items-center justify-center text-sm font-bold">
                                                {String.fromCharCode(65 + i)}
                                            </span>
                                            <span className="font-bold text-sm">{p.title}</span>
                                        </div>
                                        <span className={`text-[10px] font-black uppercase px-2 py-1 rounded ${p.difficulty === 'Easy' ? 'bg-emerald-50 text-emerald-600' :
                                            p.difficulty === 'Medium' ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600'
                                            }`}>
                                            {p.difficulty}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Leaderboard */}
                    <div className="lg:col-span-2">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                <Trophy size={14} className="text-amber-500" /> Live Leaderboard
                            </h2>
                            {selectedContest.status === 'active' && (
                                <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-500 animate-pulse">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                    LIVE
                                </span>
                            )}
                        </div>

                        <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm transition-colors">
                            {leaderboardLoading ? (
                                <div className="p-12 text-center">
                                    <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-3" />
                                    <p className="text-slate-400 dark:text-slate-500 font-medium text-sm">Loading leaderboard...</p>
                                </div>
                            ) : leaderboard.length === 0 ? (
                                <div className="p-12 text-center text-slate-400 dark:text-slate-500 font-medium">
                                    No submissions yet. Be the first!
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-slate-50/80 dark:bg-white/5 border-b border-slate-100 dark:border-white/10 transition-colors">
                                            <tr>
                                                <th className="px-6 py-4 font-bold text-slate-500 dark:text-slate-400 uppercase text-[10px] tracking-wider w-16">#</th>
                                                <th className="px-6 py-4 font-bold text-slate-500 uppercase text-[10px] tracking-wider">Participant</th>
                                                <th className="px-6 py-4 font-bold text-slate-500 uppercase text-[10px] tracking-wider text-center">Solved</th>
                                                <th className="px-6 py-4 font-bold text-slate-500 uppercase text-[10px] tracking-wider text-center">Penalty</th>
                                                {selectedContest.problems.map((p, i) => (
                                                    <th key={p.id} className="px-3 py-4 font-bold text-slate-500 uppercase text-[10px] tracking-wider text-center">
                                                        {String.fromCharCode(65 + i)}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {leaderboard.map((entry) => (
                                                <tr key={entry.userId} className={`hover:bg-slate-50/50 transition ${entry.userId === user?.id ? 'bg-emerald-50/30' : ''}`}>
                                                    <td className="px-6 py-4">
                                                        <span className={`font-black text-lg ${entry.rank === 1 ? 'text-amber-500' :
                                                            entry.rank === 2 ? 'text-slate-400' :
                                                                entry.rank === 3 ? 'text-amber-700' : 'text-slate-600'
                                                            }`}>
                                                            {entry.rank <= 3 ? ['🥇', '🥈', '🥉'][entry.rank - 1] : entry.rank}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div>
                                                            <p className="font-bold text-slate-900">{entry.name}</p>
                                                            <p className="text-[10px] text-slate-400 font-bold uppercase">{entry.rollNumber}</p>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className="font-black text-lg text-emerald-600">{entry.solvedCount}</span>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className="font-mono text-sm text-slate-500">{entry.penaltyTime}</span>
                                                    </td>
                                                    {entry.problems.map((prob) => (
                                                        <td key={prob.problemId} className="px-3 py-4 text-center">
                                                            {prob.solved ? (
                                                                <div className="flex flex-col items-center">
                                                                    <CheckCircle2 size={16} className="text-emerald-500" />
                                                                    <span className="text-[10px] text-emerald-600 font-bold mt-0.5">
                                                                        {prob.solveTime}m
                                                                        {prob.wrongAttempts > 0 && (
                                                                            <span className="text-red-400"> +{prob.wrongAttempts}</span>
                                                                        )}
                                                                    </span>
                                                                </div>
                                                            ) : prob.wrongAttempts > 0 ? (
                                                                <div className="flex flex-col items-center">
                                                                    <AlertCircle size={16} className="text-red-400" />
                                                                    <span className="text-[10px] text-red-400 font-bold mt-0.5">
                                                                        -{prob.wrongAttempts}
                                                                    </span>
                                                                </div>
                                                            ) : (
                                                                <span className="text-slate-300">—</span>
                                                            )}
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ── Contest List View ──
    const activeContests = contests.filter(c => c.status === 'active');
    const upcomingContests = contests.filter(c => c.status === 'upcoming');
    const pastContests = contests.filter(c => c.status === 'ended');

    return (
        <div className="min-h-screen bg-[#FDFDFD] dark:bg-[#0a0a0b] font-sans text-slate-900 dark:text-slate-100 transition-colors duration-500">
            <Navbar />
            <div className="max-w-5xl mx-auto pt-32 p-8">
                <div className="flex items-center justify-between mb-10 border-b border-slate-200 dark:border-white/10 pb-6 transition-colors">
                    <div>
                        <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
                            <Swords size={28} className="text-primary" /> Competition Arena
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">Compete in real-time coding contests</p>
                    </div>
                    <button onClick={() => router.push('/problems')} className="text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition flex items-center gap-2">
                        <ArrowLeft size={16} /> Back to Dashboard
                    </button>
                </div>

                {/* Active Contests */}
                {activeContests.length > 0 && (
                    <section className="mb-10">
                        <h2 className="text-xs font-black text-emerald-600 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                            <Flame size={14} /> Live Now
                        </h2>
                        <div className="space-y-4">
                            {activeContests.map(c => (
                                <div key={c.id} onClick={() => openContest(c)} className="bg-white dark:bg-white/5 border-2 border-emerald-200 dark:border-emerald-500/20 rounded-3xl p-6 cursor-pointer hover:shadow-xl hover:shadow-emerald-500/5 transition-all group relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                                    <div className="flex justify-between items-center relative">
                                        <div>
                                            <h3 className="text-xl font-black group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition">{c.title}</h3>
                                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">{c.description}</p>
                                            <div className="flex items-center gap-4 mt-3 text-xs text-slate-400 dark:text-slate-500">
                                                <span className="flex items-center gap-1"><Users size={12} /> {c._count?.participations || 0} participants</span>
                                                <span className="flex items-center gap-1"><Clock size={12} /> {c.problems?.length || 0} problems</span>
                                                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold"><Timer size={12} /> {getTimeRemaining(c.end_time)}</span>
                                            </div>
                                        </div>
                                        <ChevronRight size={24} className="text-slate-300 group-hover:text-emerald-500 transition" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Upcoming */}
                {upcomingContests.length > 0 && (
                    <section className="mb-10">
                        <h2 className="text-xs font-black text-blue-600 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                            <Clock size={14} /> Upcoming
                        </h2>
                        <div className="space-y-4">
                            {upcomingContests.map(c => (
                                <div key={c.id} onClick={() => openContest(c)} className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-3xl p-6 cursor-pointer hover:shadow-lg transition-all group">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <h3 className="text-lg font-bold group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">{c.title}</h3>
                                            <div className="flex items-center gap-4 mt-2 text-xs text-slate-400 dark:text-slate-500">
                                                <span>Starts: {new Date(c.start_time).toLocaleString()}</span>
                                                <span>{c.problems?.length || 0} problems</span>
                                            </div>
                                        </div>
                                        <ChevronRight size={20} className="text-slate-300 group-hover:text-blue-500 transition" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Past */}
                {pastContests.length > 0 && (
                    <section>
                        <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                            <Trophy size={14} /> Past Contests
                        </h2>
                        <div className="space-y-3">
                            {pastContests.map(c => (
                                <div key={c.id} onClick={() => openContest(c)} className="bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-2xl p-5 cursor-pointer hover:border-slate-300 dark:hover:border-white/20 transition-all group opacity-80 hover:opacity-100">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <h3 className="text-sm font-bold">{c.title}</h3>
                                            <div className="flex items-center gap-4 mt-1 text-xs text-slate-400 dark:text-slate-500">
                                                <span>{new Date(c.start_time).toLocaleDateString()}</span>
                                                <span>{c._count?.participations || 0} participants</span>
                                            </div>
                                        </div>
                                        <ChevronRight size={18} className="text-slate-300" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {contests.length === 0 && (
                    <div className="text-center py-20">
                        <Trophy size={48} className="text-slate-200 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-slate-400">No Contests Yet</h3>
                        <p className="text-slate-400 mt-2">Check back later for upcoming competitions</p>
                    </div>
                )}
            </div>
        </div>
    );
}
