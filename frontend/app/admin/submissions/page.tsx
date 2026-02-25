"use client";

import { useState, useEffect } from "react";
import api from "../../../lib/api";
import { Search, Loader2 } from "lucide-react";

interface Submission {
    id: string;
    language: string;
    status: string;
    created_at: string;
    user: {
        name: string;
    };
    problem: {
        title: string;
    };
}

export default function AdminSubmissions() {
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSubmissions();
    }, []);

    const fetchSubmissions = async () => {
        try {
            const { data } = await api.get('/admin/submissions');
            setSubmissions(data);
        } catch (error) {
            console.error("Failed to fetch submissions:", error);
        } finally {
            setLoading(false);
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
                    <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 transition-colors">All Submissions</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 transition-colors">Monitor code executions and test case validities.</p>
                </div>

                <div className="relative w-full max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={18} />
                    <input
                        type="text"
                        placeholder="Search by student or problem..."
                        className="w-full bg-white dark:bg-[#0a0a0b]/80 border border-slate-200 dark:border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary dark:text-white transition-all backdrop-blur-md"
                    />
                </div>
            </div>

            <div className="bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-2xl shadow-sm overflow-hidden transition-colors">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 dark:bg-white/5 text-xs text-slate-500 dark:text-slate-400 uppercase font-bold border-b border-slate-100 dark:border-white/10 transition-colors">
                        <tr>
                            <th className="py-4 px-6">Student</th>
                            <th className="py-4 px-6">Problem</th>
                            <th className="py-4 px-6">Language</th>
                            <th className="py-4 px-6">Status</th>
                            <th className="py-4 px-6 text-right">Time</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-white/5 transition-colors">
                        {submissions.map((sub: Submission) => (
                            <tr key={sub.id} className="hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors">
                                <td className="py-4 px-6 font-bold text-slate-900 dark:text-slate-200 transition-colors">{sub.user?.name || "Unknown"}</td>
                                <td className="py-4 px-6 text-slate-600 dark:text-slate-400 font-medium transition-colors">{sub.problem?.title || "Unknown"}</td>
                                <td className="py-4 px-6 text-slate-500 dark:text-slate-300 uppercase text-xs font-black tracking-widest transition-colors">{sub.language}</td>
                                <td className="py-4 px-6">
                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border transition-colors ${sub.status === 'PASS' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20' :
                                        sub.status === 'FAIL' ? 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-100 dark:border-red-500/20' :
                                            'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-500/20'
                                        }`}>
                                        {sub.status}
                                    </span>
                                </td>
                                <td className="py-4 px-6 text-right text-slate-500 dark:text-slate-500 font-mono text-xs transition-colors">
                                    {new Date(sub.created_at).toLocaleString()}
                                </td>
                            </tr>
                        ))}
                        {submissions.length === 0 && (
                            <tr>
                                <td colSpan={5} className="py-12 text-center text-slate-500 dark:text-slate-400 transition-colors">
                                    No submissions found yet.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
