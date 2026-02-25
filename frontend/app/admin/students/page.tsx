"use client";

import { useState, useEffect } from "react";
import { Search, Loader2, Users, CheckCircle2, XCircle } from "lucide-react";
import api from "../../../lib/api";

export default function AdminStudentsDirectory() {
    const [students, setStudents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [branchFilter, setBranchFilter] = useState("ALL");
    const [yearFilter, setYearFilter] = useState("ALL");

    useEffect(() => {
        const fetchStudents = async () => {
            try {
                const { data } = await api.get('/admin/students/directory');
                setStudents(data);
            } catch (error) {
                console.error("Failed to fetch students", error);
            } finally {
                setLoading(false);
            }
        };
        fetchStudents();
    }, []);

    const filteredStudents = students.filter(student => {
        const matchesSearch = student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            student.roll_number?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesBranch = branchFilter === "ALL" || student.branch === branchFilter;
        const matchesYear = yearFilter === "ALL" || student.year?.toString() === yearFilter;
        return matchesSearch && matchesBranch && matchesYear;
    });

    const activeStudents = filteredStudents.filter(s => s.is_profile_complete).length;
    const pendingStudents = filteredStudents.length - activeStudents;

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#FDFDFD] dark:bg-[#0a0a0b]">
                <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
        );
    }

    return (
        <div className="p-8 max-w-7xl mx-auto w-full space-y-8 bg-[#FDFDFD] dark:bg-[#0a0a0b] font-sans text-slate-900 dark:text-slate-100 transition-colors duration-500 min-h-screen border-l border-white/5">
            {/* Header section with Stats */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-slate-200 dark:border-white/10 pb-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                        <Users className="text-primary" size={28} />
                        Student Directory
                    </h1>
                    <p className="text-slate-500 text-sm mt-2">Manage all registered engineers, view analytics, and track profiles.</p>
                </div>
                <div className="flex gap-4 items-center">
                    <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 px-6 py-3 rounded-2xl flex flex-col items-center">
                        <span className="text-2xl font-black text-emerald-600 dark:text-emerald-500 leading-none">{activeStudents}</span>
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-500 uppercase tracking-widest mt-1">Live Profiles</span>
                    </div>
                    <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-6 py-3 rounded-2xl flex flex-col items-center">
                        <span className="text-2xl font-black text-amber-600 dark:text-amber-500 leading-none">{pendingStudents}</span>
                        <span className="text-[10px] font-bold text-amber-600 dark:text-amber-500 uppercase tracking-widest mt-1">Pending Sync</span>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search by name or roll number..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-white dark:bg-[#121212] border border-slate-200 dark:border-white/10 rounded-xl pl-12 pr-4 py-3 text-sm focus:ring-2 focus:ring-primary focus:outline-none transition-all dark:text-white"
                    />
                </div>
                <select
                    value={yearFilter}
                    onChange={(e) => setYearFilter(e.target.value)}
                    className="bg-white dark:bg-[#121212] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary focus:outline-none dark:text-white"
                >
                    <option value="ALL">All Years</option>
                    <option value="1">1st Year</option>
                    <option value="2">2nd Year</option>
                    <option value="3">3rd Year</option>
                    <option value="4">4th Year</option>
                </select>
                <select
                    value={branchFilter}
                    onChange={(e) => setBranchFilter(e.target.value)}
                    className="bg-white dark:bg-[#121212] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary focus:outline-none dark:text-white"
                >
                    <option value="ALL">All Branches</option>
                    <option value="CSE">CSE</option>
                    <option value="ECE">ECE</option>
                    <option value="EEE">EEE</option>
                    <option value="MECH">MECH</option>
                    <option value="CIVIL">CIVIL</option>
                    <option value="AI">AI</option>
                    <option value="DS">DS</option>
                </select>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-[#121212] border border-slate-200 dark:border-white/10 rounded-2xl shadow-xl dark:shadow-none overflow-hidden container-query">
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-white/5 border-b border-slate-200 dark:border-white/10 text-xs font-bold text-slate-500 uppercase tracking-widest">
                                <th className="p-4">Student</th>
                                <th className="p-4 text-center">Batch Info</th>
                                <th className="p-4 text-center">Status</th>
                                <th className="p-4 text-center">Platform Stats</th>
                                <th className="p-4 text-right">Last Login</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                            {filteredStudents.length > 0 ? filteredStudents.map((student) => (
                                <tr key={student.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0 border border-primary/20">
                                                {student.name ? student.name.substring(0, 2).toUpperCase() : 'ST'}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-900 dark:text-white">{student.name}</p>
                                                <p className="text-xs text-slate-500 font-mono tracking-wide">{student.roll_number}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4 text-center">
                                        <div className="flex flex-col items-center">
                                            {student.year && student.branch ? (
                                                <>
                                                    <span className="text-xs font-bold bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-md mb-1 border border-slate-200 dark:border-white/5">
                                                        {student.branch} • Yr {student.year}
                                                    </span>
                                                    <span className="text-[10px] text-slate-500">Sem {student.semester}, Sec {student.section}</span>
                                                </>
                                            ) : (
                                                <span className="text-[10px] text-slate-400 italic">Not set</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-4 text-center">
                                        {student.is_profile_complete ? (
                                            <span className="inline-flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-500/20">
                                                <CheckCircle2 size={14} /> LIVE
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1.5 bg-amber-50 dark:bg-amber-500/10 text-amber-600 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1.5 rounded-lg border border-amber-200 dark:border-amber-500/20">
                                                <XCircle size={14} /> PENDING
                                            </span>
                                        )}
                                    </td>
                                    <td className="p-4">
                                        <div className="flex gap-4 justify-center">
                                            <div className="text-center">
                                                <p className="text-xs font-black text-slate-900 dark:text-white">{student.points || 0}</p>
                                                <p className="text-[9px] font-bold text-slate-500 uppercase">XP</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-xs font-black text-slate-900 dark:text-white">{student.streak || 0}</p>
                                                <p className="text-[9px] font-bold text-slate-500 uppercase">Streak</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4 text-right">
                                        {student.last_login ? (
                                            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                                {new Date(student.last_login).toLocaleDateString()}
                                            </span>
                                        ) : (
                                            <span className="text-xs text-slate-400 italic">Never</span>
                                        )}
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={5} className="p-12 text-center">
                                        <div className="inline-flex justify-center items-center w-12 h-12 rounded-full bg-slate-100 dark:bg-white/5 mb-4 border border-slate-200 dark:border-white/10">
                                            <Search className="text-slate-400" size={24} />
                                        </div>
                                        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">No students found</h3>
                                        <p className="text-xs text-slate-500">Try adjusting your search or filters.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="text-center">
                <p className="text-[10px] text-slate-500 font-mono tracking-widest uppercase mt-4 opacity-50">Showing {filteredStudents.length} of {students.length} Total Engineers</p>
            </div>
        </div>
    );
}
