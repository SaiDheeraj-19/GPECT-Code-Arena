"use client";
import { useState, useEffect } from "react";
import api from "../../../lib/api";
import { Plus, Users, CheckCircle2, Trophy, Loader2, Calendar, Clock, BarChart3, Trash2, X, Code2, Award } from "lucide-react";

interface Problem {
    id: string;
    title: string;
    difficulty: string;
}

interface Contest {
    id: string;
    title: string;
    description: string;
    start_time: string;
    end_time: string;
    is_active: boolean;
    problems: Problem[];
    _count: {
        participations: number;
    }
}

export default function ContestsManager() {
    const [contests, setContests] = useState<Contest[]>([]);
    const [problems, setProblems] = useState<Problem[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [saving, setSaving] = useState(false);

    // New contest state
    const [newContest, setNewContest] = useState({
        title: "",
        description: "",
        start_time: "",
        end_time: "",
        problemIds: [] as string[]
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [contestsRes, problemsRes] = await Promise.all([
                api.get('/contests'),
                api.get('/problems')
            ]);
            setContests(contestsRes.data);
            setProblems(problemsRes.data);
        } catch (error) {
            console.error("Failed to fetch contest data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateContest = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setSaving(true);
            await api.post('/contests', newContest);
            setShowModal(false);
            setNewContest({
                title: "",
                description: "",
                start_time: "",
                end_time: "",
                problemIds: []
            });
            fetchData();
        } catch (error) {
            console.error("Failed to create contest:", error);
            alert("Failed to create contest. Ensure all fields including dates and problems are selected.");
        } finally {
            setSaving(false);
        }
    };

    const toggleProblem = (id: string) => {
        const current = [...newContest.problemIds];
        const index = current.indexOf(id);
        if (index > -1) {
            current.splice(index, 1);
        } else {
            current.push(id);
        }
        setNewContest({ ...newContest, problemIds: current });
    };

    const handleDeleteContest = async (id: string) => {
        if (!confirm("Are you sure you want to delete this contest?")) return;
        try {
            await api.delete(`/contests/${id}`);
            fetchData();
        } catch (error) {
            console.error("Failed to delete contest:", error);
        }
    };

    const handleFinalizeContest = async (id: string, title: string) => {
        if (!confirm(`Finalize "${title}" ? This will: \n• Compute final ranks for all participants\n• Generate certificates for top performers\n• Mark the contest as inactive\n\nThis action cannot be undone.`)) return;
        try {
            // Check if there's a custom template saved by the admin
            const savedTemplate = localStorage.getItem('gpcet_cert_template');
            const templateData = savedTemplate ? JSON.parse(savedTemplate) : null;

            const { data } = await api.post(`/certificates/finalize/${id}`, {
                generateCertificates: true,
                topN: 10,
                template: templateData,
            });
            alert(`✅ ${data.message} \n\nCertificates: ${data.stats?.gold || 0}G ${data.stats?.silver || 0}S ${data.stats?.bronze || 0}B`);
            fetchData();
        } catch (error: Error | unknown) {
            const err = error as { response?: { data?: { error?: string } } };
            alert(err.response?.data?.error || 'Failed to finalize contest.');
        }
    };

    const handleRegenerateCertificates = async (id: string, title: string) => {
        if (!confirm(`Regenerate certificates for "${title}" ? This will overwrite existing PDF files with the currently saved Certificate Template.`)) return;
        try {
            const savedTemplate = localStorage.getItem('gpcet_cert_template');
            const templateData = savedTemplate ? JSON.parse(savedTemplate) : null;

            const { data } = await api.post(`/certificates/regenerate/${id}`, {
                template: templateData,
            });
            alert(`✅ ${data.message}`);
        } catch (error: Error | unknown) {
            const err = error as { response?: { data?: { error?: string } } };
            alert(err.response?.data?.error || 'Failed to regenerate certificates.');
        }
    };
    if (loading) {
        return (
            <div className="flex h-[calc(100vh-theme(spacing.16))] items-center justify-center bg-[#FDFDFD] dark:bg-[#0a0a0b] transition-colors duration-500">
                <Loader2 className="h-8 w-8 animate-spin text-slate-400 dark:text-slate-500" />
            </div>
        );
    }

    return (
        <div className="p-8 max-w-7xl mx-auto w-full space-y-8 bg-[#FDFDFD] dark:bg-[#0a0a0b] min-h-screen text-slate-900 dark:text-slate-100 transition-colors duration-500">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 transition-colors">Contest Management</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 transition-colors">Host live coding exams, add challenge sets, and analyze performance.</p>
                </div>

                <div className="flex items-center gap-3">
                    <button className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 px-4 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors">
                        <BarChart3 size={16} />
                        View Analytics
                    </button>
                    <button
                        onClick={() => setShowModal(true)}
                        className="bg-primary hover:bg-primary/90 text-background-dark px-4 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all shadow-lg shadow-primary/20 active:scale-95"
                    >
                        <Plus size={16} />
                        New Contest
                    </button>
                </div>
            </div>

            {contests.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {contests.map((c) => (
                        <div key={c.id} className="bg-white dark:bg-[#0a0a0b] border border-slate-200 dark:border-white/10 rounded-[2rem] p-8 shadow-sm hover:shadow-xl dark:hover:border-white/20 transition-all relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-6">
                                <button
                                    onClick={() => handleDeleteContest(c.id)}
                                    className="p-2 text-slate-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>

                            <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-6 group-hover:bg-indigo-600 dark:group-hover:bg-indigo-500 group-hover:text-white transition-all">
                                <Trophy size={20} />
                            </div>

                            <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 mb-2 truncate pr-8 transition-colors">{c.title}</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-6 h-10 transition-colors">{c.description || "No description provided."}</p>

                            <div className="space-y-3">
                                <div className="flex items-center gap-3 text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest transition-colors">
                                    <Clock size={14} className="text-slate-300 dark:text-slate-600" />
                                    <span>{new Date(c.start_time).toLocaleDateString()} - {new Date(c.end_time).toLocaleDateString()}</span>
                                </div>
                                <div className="flex items-center gap-3 text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest transition-colors">
                                    <Code2 size={14} className="text-slate-300 dark:text-slate-600" />
                                    <span>{c.problems.length} Challenges</span>
                                </div>
                                <div className="flex items-center gap-3 text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest transition-colors">
                                    <Users size={14} className="text-slate-300 dark:text-slate-600" />
                                    <span>{c._count.participations} Participants</span>
                                </div>
                            </div>

                            <button className="w-full mt-6 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-slate-200 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-900 dark:hover:bg-white hover:text-white dark:hover:text-slate-900 transition-all border border-transparent dark:border-white/10">
                                View Leaderboard
                            </button>

                            {/* Finalize button — only shown for ended contests */}
                            {new Date(c.end_time) < new Date() && c.is_active !== false && (
                                <button
                                    onClick={() => handleFinalizeContest(c.id, c.title)}
                                    className="w-full mt-2 bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-amber-600 dark:hover:bg-amber-500 hover:text-white dark:hover:text-amber-900 hover:border-amber-600 dark:hover:border-transparent transition-all flex items-center justify-center gap-2"
                                >
                                    <Award size={14} />
                                    Finalize & Issue Certificates
                                </button>
                            )}
                            {c.is_active === false && (
                                <div className="space-y-2 mt-2">
                                    <div className="w-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest text-center flex items-center justify-center gap-2 transition-colors">
                                        <CheckCircle2 size={14} />
                                        Finalized — Certificates Issued
                                    </div>
                                    <button
                                        onClick={() => handleRegenerateCertificates(c.id, c.title)}
                                        className="w-full bg-slate-50 dark:bg-white/5 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10 py-2 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-slate-100 dark:hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                                    >
                                        <Award size={14} />
                                        Regenerate Certificates
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <div className="py-20 text-center bg-white dark:bg-[#0a0a0b] border border-dashed border-slate-200 dark:border-white/10 rounded-[2rem] transition-colors">
                    <div className="w-16 h-16 bg-slate-50 dark:bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-300 dark:text-slate-600 transition-colors">
                        <Trophy size={32} />
                    </div>
                    <h2 className="text-xl font-black text-slate-900 dark:text-white transition-colors">No active contests</h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-2 transition-colors">Start by creating your first weekly contest.</p>
                </div>
            )}

            {/* Create Contest Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-slate-900/40 dark:bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 transition-colors">
                    <div className="bg-white dark:bg-[#0a0a0b] border border-white/5 rounded-[2rem] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto transition-colors">
                        <div className="p-8 border-b border-slate-100 dark:border-white/10 flex justify-between items-center sticky top-0 bg-white dark:bg-[#0a0a0b]/90 backdrop-blur-md z-10 transition-colors">
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white transition-colors">Schedule New Contest</h2>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 transition-colors">Plan and publish your coding arena events.</p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-full transition-colors">
                                <X size={24} className="text-slate-400 dark:text-slate-500" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateContest} className="p-8 space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1 transition-colors">Contest Title</label>
                                        <input
                                            required
                                            type="text"
                                            value={newContest.title}
                                            onChange={(e) => setNewContest({ ...newContest, title: e.target.value })}
                                            className="w-full bg-slate-50 dark:bg-white/5 border border-transparent dark:border-white/10 rounded-2xl px-5 py-4 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                                            placeholder="e.g. GPCET Weekly Sprint #43"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1 transition-colors">Timeline</label>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="relative">
                                                <Calendar size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                                                <input
                                                    required
                                                    type="datetime-local"
                                                    value={newContest.start_time}
                                                    onChange={(e) => setNewContest({ ...newContest, start_time: e.target.value })}
                                                    className="w-full bg-slate-50 dark:bg-white/5 border border-transparent dark:border-white/10 rounded-2xl pl-10 pr-4 py-4 text-[10px] font-black uppercase text-slate-600 dark:text-slate-300 focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                                                />
                                            </div>
                                            <div className="relative">
                                                <Calendar size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                                                <input
                                                    required
                                                    type="datetime-local"
                                                    value={newContest.end_time}
                                                    onChange={(e) => setNewContest({ ...newContest, end_time: e.target.value })}
                                                    className="w-full bg-slate-50 dark:bg-white/5 border border-transparent dark:border-white/10 rounded-2xl pl-10 pr-4 py-4 text-[10px] font-black uppercase text-slate-600 dark:text-slate-300 focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1 transition-colors">Description</label>
                                        <textarea
                                            rows={5}
                                            value={newContest.description}
                                            onChange={(e) => setNewContest({ ...newContest, description: e.target.value })}
                                            className="w-full bg-slate-50 dark:bg-white/5 border border-transparent dark:border-white/10 rounded-2xl px-5 py-4 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 transition-all outline-none resize-none"
                                            placeholder="General instructions and rules..."
                                        ></textarea>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1 block mb-2 transition-colors">Select Problems ({newContest.problemIds.length})</label>
                                    <div className="bg-slate-50 dark:bg-[#0a0a0b] border border-slate-100 dark:border-white/10 rounded-[2rem] p-6 max-h-[400px] overflow-y-auto space-y-3 transition-colors">
                                        {problems.map((p) => (
                                            <div
                                                key={p.id}
                                                onClick={() => toggleProblem(p.id)}
                                                className={`p-4 rounded-2xl cursor-pointer transition-all flex items-center justify-between border-2 ${newContest.problemIds.includes(p.id)
                                                    ? "bg-primary border-primary text-background-dark shadow-lg shadow-primary/20"
                                                    : "bg-white dark:bg-white/5 border-transparent dark:border-white/5 text-slate-900 dark:text-slate-200 hover:border-slate-200 dark:hover:border-white/10"
                                                    } `}
                                            >
                                                <div>
                                                    <p className="text-xs font-bold truncate transition-colors">{p.title}</p>
                                                    <p className={`text-[10px] font-black uppercase tracking-widest mt-0.5 transition-colors ${newContest.problemIds.includes(p.id) ? "text-background-dark/70" : "text-slate-400 dark:text-slate-500"} `}>{p.difficulty}</p>
                                                </div>
                                                {newContest.problemIds.includes(p.id) && <CheckCircle2 size={16} />}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end pt-4 gap-4 border-t border-slate-50 dark:border-white/10 mt-8 transition-colors">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-white transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    disabled={saving || newContest.problemIds.length === 0}
                                    className="bg-primary text-background-dark px-10 py-4 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-primary/20 active:scale-95 transition-all flex items-center gap-3 disabled:opacity-50 hover:opacity-90"
                                >
                                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trophy size={16} />}
                                    Launch Contest
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
