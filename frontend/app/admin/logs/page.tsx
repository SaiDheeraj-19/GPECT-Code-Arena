"use client";

import { useState, useEffect } from "react";
import api from "../../../lib/api";
import { Search, Loader2, AlertTriangle, Filter } from "lucide-react";

interface LogEntry {
    id: string;
    timestamp: string;
    action: string;
    problem_id: string;
    user: {
        name: string;
    };
}

export default function AdminLogs() {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        try {
            const { data } = await api.get('/admin/logs');
            setLogs(data);
        } catch (error) {
            console.error("Failed to fetch logs:", error);
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
                    <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 transition-colors">User Security Logs</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 transition-colors">Review suspicious activities and potential cheating flags.</p>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={18} />
                        <input
                            type="text"
                            placeholder="Search logs..."
                            className="w-full bg-white dark:bg-[#0a0a0b]/80 border border-slate-200 dark:border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary dark:text-white transition-all backdrop-blur-md"
                        />
                    </div>
                    <button className="p-2.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors shadow-sm">
                        <Filter size={18} />
                    </button>
                </div>
            </div>

            {/* Warnings Container */}
            {logs.length > 0 && (
                <div className="bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-xl p-4 flex items-start gap-3 transition-colors">
                    <AlertTriangle className="text-red-500 dark:text-red-400 shrink-0 mt-0.5 transition-colors" size={20} />
                    <div>
                        <h4 className="text-sm font-bold text-red-700 dark:text-red-400 transition-colors">Action Required</h4>
                        <p className="text-sm text-red-600 dark:text-red-300 mt-1 transition-colors">There are multiple critical flags recorded during recent exam sessions. Review is advised.</p>
                    </div>
                </div>
            )}

            <div className="bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-2xl shadow-sm overflow-hidden transition-colors">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 dark:bg-white/5 text-xs text-slate-500 dark:text-slate-400 uppercase font-bold border-b border-slate-100 dark:border-white/10 transition-colors">
                        <tr>
                            <th className="py-4 px-6">Time</th>
                            <th className="py-4 px-6">Student</th>
                            <th className="py-4 px-6">Problem ID</th>
                            <th className="py-4 px-6">Action Detected</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-white/5 transition-colors">
                        {logs.map((log: LogEntry) => (
                            <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors">
                                <td className="py-4 px-6 text-slate-500 dark:text-slate-400 font-mono text-xs transition-colors">
                                    {new Date(log.timestamp).toLocaleString()}
                                </td>
                                <td className="py-4 px-6 font-bold text-slate-900 dark:text-slate-200 transition-colors">
                                    {log.user?.name || "Unknown"}
                                </td>
                                <td className="py-4 px-6 text-slate-600 dark:text-slate-400 font-mono text-xs transition-colors">
                                    {log.problem_id}
                                </td>
                                <td className="py-4 px-6">
                                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20 transition-colors">
                                        {log.action}
                                    </span>
                                </td>
                            </tr>
                        ))}
                        {logs.length === 0 && (
                            <tr>
                                <td colSpan={4} className="py-12 text-center text-slate-500 dark:text-slate-400 transition-colors">
                                    No suspicious logs recorded.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
