"use client";

import { Search, Bell, Plus, Users, CheckCircle2, AlertTriangle, Trophy, MoreHorizontal, Loader2, Info, Shield } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import api from "../../../lib/api";

interface DashboardStats {
    totalStudents: number;
    problemsSolved: number;
    suspiciousEvents: number;
    recentLogs: DashboardLog[];
}

interface DashboardLog {
    id: string;
    action: string;
    timestamp: string;
    user?: {
        name?: string;
        roll_number: string;
    };
}

export default function AdminDashboard() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [showNotifications, setShowNotifications] = useState(false);
    const notifRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const { data } = await api.get('/admin/stats');
                setStats(data);
            } catch (error) {
                console.error("Failed to fetch dashboard stats", error);
            }
        };
        fetchStats();

        const handleClickOutside = (event: MouseEvent) => {
            if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
                setShowNotifications(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    if (!stats) return <div className="flex h-[calc(100vh-theme(spacing.16))] items-center justify-center bg-[#FDFDFD] dark:bg-[#0a0a0b] transition-colors duration-500"><Loader2 className="h-8 w-8 animate-spin text-slate-400 dark:text-slate-500" /></div>;

    return (
        <div className="p-8 max-w-7xl mx-auto w-full space-y-8 bg-[#FDFDFD] dark:bg-[#0a0a0b] font-sans text-slate-900 dark:text-slate-100 transition-colors duration-500 min-h-screen">
            {/* Top Header Region */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="relative w-full max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={18} />
                    <input
                        type="text"
                        placeholder="Quick search..."
                        className="w-full bg-white dark:bg-[#0a0a0b]/80 border border-slate-200 dark:border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary dark:text-white transition-all backdrop-blur-md"
                    />
                </div>

                <div className="flex items-center gap-4 w-full sm:w-auto justify-end">
                    <div className="relative" ref={notifRef}>
                        <button
                            onClick={() => setShowNotifications(!showNotifications)}
                            className="relative p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                        >
                            <Bell size={20} />
                            {stats.suspiciousEvents > 0 && (
                                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-[#0a0a0b]"></span>
                            )}
                        </button>

                        {/* Notifications Dropdown */}
                        {showNotifications && (
                            <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-[#0a0a0b] rounded-xl shadow-xl border border-slate-100 dark:border-white/10 z-50 overflow-hidden transition-colors">
                                <div className="p-3 border-b border-slate-50 dark:border-white/5 flex items-center justify-between transition-colors">
                                    <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-widest transition-colors">Notifications</h3>
                                    <span className="text-[10px] bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-full font-bold transition-colors">{stats.suspiciousEvents} New</span>
                                </div>
                                <div className="max-h-[300px] overflow-y-auto">
                                    {stats.suspiciousEvents > 0 ? (
                                        <div className="p-4 flex gap-3 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer border-l-2 border-red-500">
                                            <div className="w-8 h-8 rounded-full bg-red-50 dark:bg-red-500/10 flex items-center justify-center text-red-500 shrink-0 transition-colors">
                                                <AlertTriangle size={14} />
                                            </div>
                                            <div>
                                                <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 leading-tight transition-colors">System detected {stats.suspiciousEvents} suspicious activities.</p>
                                                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-medium transition-colors">Please check the Security Logs.</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="p-6 text-center flex flex-col items-center justify-center gap-2">
                                            <Info size={24} className="text-slate-300 dark:text-slate-600 transition-colors" />
                                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 transition-colors">You&apos;re all caught up!</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <Link href="/admin/problems/create" className="bg-primary hover:bg-primary/90 text-background-dark px-4 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all shadow-lg shadow-primary/20 active:scale-95">
                        <Plus size={16} />
                        Create Problem
                    </Link>

                    <Link
                        href="/admin/dashboard/violations"
                        className="bg-red-600/10 hover:bg-red-600/20 text-red-600 border border-red-600/20 px-4 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all active:scale-95"
                    >
                        <Shield size={16} />
                        Anti-Cheat Monitor
                    </Link>
                </div>
            </div>

            {/* Page Title */}
            <div>
                <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 transition-colors">Dashboard Overview</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 transition-colors">Real-time metrics and system health monitoring.</p>
            </div>

            {/* Stat Cards Matrix */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white dark:bg-white/5 border text-left border-slate-100 dark:border-white/10 p-6 rounded-2xl shadow-sm flex flex-col justify-between transition-colors hover:shadow-lg dark:hover:border-white/20">
                    <div className="flex justify-between items-center mb-4">
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 transition-colors">Total Students</p>
                        <div className="bg-slate-50 dark:bg-white/5 p-2 rounded-lg transition-colors"><Users size={18} className="text-slate-600 dark:text-slate-400 transition-colors" /></div>
                    </div>
                    <div className="flex items-end gap-3">
                        <h3 className="text-3xl font-black text-slate-900 dark:text-white transition-colors">{stats.totalStudents}</h3>
                    </div>
                </div>

                <div className="bg-white dark:bg-white/5 border text-left border-slate-100 dark:border-white/10 p-6 rounded-2xl shadow-sm flex flex-col justify-between transition-colors hover:shadow-lg dark:hover:border-white/20">
                    <div className="flex justify-between items-center mb-4">
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 transition-colors">Problems Solved</p>
                        <div className="bg-slate-50 dark:bg-white/5 p-2 rounded-lg transition-colors"><CheckCircle2 size={18} className="text-slate-600 dark:text-slate-400 transition-colors" /></div>
                    </div>
                    <div className="flex items-end gap-3">
                        <h3 className="text-3xl font-black text-slate-900 dark:text-white transition-colors">{stats.problemsSolved}</h3>
                    </div>
                </div>

                <div className="bg-white dark:bg-[#0a0a0b] border text-left border-red-100 dark:border-red-500/20 p-6 rounded-2xl shadow-sm flex flex-col justify-between relative overflow-hidden transition-colors hover:shadow-lg">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-red-50 dark:bg-red-500/10 rounded-full blur-3xl -mr-16 -mt-16 z-0 transition-colors"></div>
                    <div className="flex justify-between items-center mb-4 relative z-10">
                        <p className="text-sm font-medium text-red-900 dark:text-red-400 transition-colors">Suspicious Events</p>
                        <div className="bg-red-50 dark:bg-red-500/10 p-2 rounded-lg transition-colors"><AlertTriangle size={18} className="text-red-500" /></div>
                    </div>
                    <div className="flex items-end gap-3 relative z-10">
                        <h3 className="text-3xl font-black text-red-600 dark:text-red-500 transition-colors">{stats.suspiciousEvents}</h3>
                        <span className="text-xs font-medium text-red-500 mb-1">Flags</span>
                    </div>
                </div>

                <div className="bg-white dark:bg-[#0a0a0b] border text-left border-indigo-100 dark:border-indigo-500/20 p-6 rounded-2xl shadow-sm flex flex-col justify-between relative overflow-hidden transition-colors hover:shadow-lg">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 dark:bg-indigo-500/10 rounded-full blur-3xl -mr-16 -mt-16 z-0 transition-colors"></div>
                    <div className="flex justify-between items-center mb-4 relative z-10">
                        <p className="text-sm font-medium text-indigo-900 dark:text-indigo-400 transition-colors">Weekly Contest</p>
                        <div className="bg-indigo-50 dark:bg-indigo-500/10 p-2 rounded-lg transition-colors"><Trophy size={18} className="text-indigo-500" /></div>
                    </div>
                    <div className="flex items-end gap-3 relative z-10">
                        <h3 className="text-3xl font-black text-indigo-600 dark:text-indigo-500 transition-colors">Active</h3>
                        <span className="text-xs font-medium text-indigo-600 dark:text-indigo-500 mb-1 transition-colors">Live Now</span>
                    </div>
                </div>
            </div>

            {/* Main Grids */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Security Log */}
                <div className="col-span-1 lg:col-span-3 bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-2xl shadow-sm p-6 overflow-x-auto transition-colors">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 transition-colors">Recent Security Logs</h2>
                        <button className="text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white px-3 py-1.5 border border-slate-200 dark:border-white/10 rounded-md transition-colors text-center">Export CSV</button>
                    </div>

                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-slate-400 dark:text-slate-500 uppercase font-bold border-b border-slate-100 dark:border-white/10 transition-colors">
                            <tr>
                                <th className="pb-3 px-2">Student</th>
                                <th className="pb-3 px-2">Violation</th>
                                <th className="pb-3 px-2">Time</th>
                                <th className="pb-3 px-2">Severity</th>
                                <th className="pb-3 px-2 text-right">Review</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-white/5 transition-colors">
                            {stats.recentLogs && stats.recentLogs.map((log: DashboardLog) => {
                                let severity = "INFO";
                                let color = "blue";
                                if (log.action.includes('Switch') || log.action.includes('Lost Focus')) {
                                    severity = "WARNING";
                                    color = "amber";
                                }
                                if (log.action.includes('Copy') || log.action.includes('Paste') || log.action.includes('Multiple Accounts')) {
                                    severity = "CRITICAL";
                                    color = "red";
                                }


                                return (
                                    <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors">
                                        <td className="py-4 px-2">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/10 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300 transition-colors">
                                                    {log.user?.name ? log.user.name.substring(0, 2).toUpperCase() : 'ST'}
                                                </div>
                                                <span className="font-bold text-slate-900 dark:text-slate-200 transition-colors">{log.user?.name || log.user?.roll_number}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-2 text-slate-600 dark:text-slate-400 font-medium transition-colors">{log.action}</td>
                                        <td className="py-4 px-2 text-slate-500 dark:text-slate-500 font-mono text-xs transition-colors">{new Date(log.timestamp).toLocaleTimeString()}</td>
                                        <td className="py-4 px-2">
                                            <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-md bg-${color}-50 dark:bg-${color}-500/10 text-${color}-600 dark:text-${color}-400 border border-${color}-100 dark:border-${color}-500/20 transition-colors`}>
                                                {severity}
                                            </span>
                                        </td>
                                        <td className="py-4 px-2 text-right">
                                            <button className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors p-1">
                                                <MoreHorizontal size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                )
                            })}
                            {(!stats.recentLogs || stats.recentLogs.length === 0) && (
                                <tr>
                                    <td colSpan={5} className="py-12 text-center text-slate-500 dark:text-slate-500 font-medium transition-colors">No suspicious events recorded.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
