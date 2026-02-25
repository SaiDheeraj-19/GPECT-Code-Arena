"use client";

/**
 * Admin Anti-Cheat Monitoring Dashboard
 * 
 * Real-time violation monitoring with:
 * - Live WebSocket alerts for flagged students
 * - Per-contest violation breakdown
 * - Disqualification controls
 * - Violation timeline
 */

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "../../../../store/auth";
import api, { createWebSocket } from "../../../../lib/api";
import {
    Shield, AlertTriangle, Ban, Eye, Clock,
    ArrowLeft, CheckCircle2, XCircle, Bell,
    UserX, RefreshCw, ChevronRight, Volume2,
    Clipboard, Monitor, Maximize, Mouse,
    GripVertical, Copy, Scissors, RotateCcw
} from "lucide-react";

interface ViolationAlert {
    type: 'violation_alert';
    contestId: string;
    contestTitle: string;
    userId: string;
    userName: string;
    userRollNumber: string;
    violationType: string;
    violationCount: number;
    isFlagged: boolean;
    isDisqualified: boolean;
    metadata: string | null;
    timestamp: string;
}

interface FlaggedUser {
    userId: string;
    userName: string;
    rollNumber: string;
    violationCount: number;
    isFlagged: boolean;
    isDisqualified: boolean;
    violations: {
        id: string;
        violation_type: string;
        metadata: string | null;
        timestamp: string;
    }[];
}

interface ContestViolationData {
    contestId: string;
    totalViolations: number;
    flaggedUsers: number;
    disqualifiedUsers: number;
    users: FlaggedUser[];
}

const VIOLATION_ICONS: Record<string, React.ElementType> = {
    PASTE_ATTEMPT: Clipboard,
    TAB_SWITCH: Monitor,
    DEVTOOLS_OPEN: Eye,
    FULLSCREEN_EXIT: Maximize,
    RIGHT_CLICK: Mouse,
    DRAG_DROP: GripVertical,
    CLIPBOARD: Clipboard,
    COPY_ATTEMPT: Copy,
    CUT_ATTEMPT: Scissors,
    PAGE_RELOAD: RotateCcw,
};

const VIOLATION_LABELS: Record<string, string> = {
    PASTE_ATTEMPT: 'Paste Attempt',
    TAB_SWITCH: 'Tab Switch',
    DEVTOOLS_OPEN: 'DevTools',
    FULLSCREEN_EXIT: 'Fullscreen Exit',
    RIGHT_CLICK: 'Right Click',
    DRAG_DROP: 'Drag & Drop',
    CLIPBOARD: 'Clipboard',
    COPY_ATTEMPT: 'Copy Attempt',
    CUT_ATTEMPT: 'Cut Attempt',
    PAGE_RELOAD: 'Page Reload',
};

export default function ViolationDashboard() {
    const user = useAuthStore((state) => state.user);
    const router = useRouter();

    interface ContestMinimal {
        id: string;
        title: string;
    }

    const [contestId, setContestId] = useState<string>('');
    const [contests, setContests] = useState<ContestMinimal[]>([]);
    const [violationData, setViolationData] = useState<ContestViolationData | null>(null);
    const [liveAlerts, setLiveAlerts] = useState<ViolationAlert[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedUser, setSelectedUser] = useState<FlaggedUser | null>(null);
    const [soundEnabled, setSoundEnabled] = useState(true);
    const wsRef = useRef<WebSocket | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        if (!user || user.role !== 'ADMIN') {
            router.push('/');
            return;
        }
        fetchContests();
    }, [user, router]);

    // WebSocket for real-time alerts
    useEffect(() => {
        const ws = createWebSocket();
        if (!ws) return;
        wsRef.current = ws;

        ws.onopen = () => {
            // Subscribe to global admin alerts
            ws.send(JSON.stringify({ type: 'subscribe_admin_global' }));

            // If viewing a specific contest, subscribe to its alerts
            if (contestId) {
                ws.send(JSON.stringify({ type: 'subscribe_admin', contestId }));
            }
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);

                if (data.type === 'violation_alert') {
                    setLiveAlerts(prev => [data as ViolationAlert, ...prev.slice(0, 49)]);

                    // Play alert sound
                    if (soundEnabled && audioRef.current) {
                        audioRef.current.play().catch(() => { });
                    }

                    // Refresh data if viewing this contest
                    if (data.contestId === contestId) {
                        fetchViolations(contestId);
                    }
                }

                if (data.type === 'violation_summary') {
                    // Initial summary when subscribing
                }
            } catch { }
        };

        return () => {
            ws.close();
            wsRef.current = null;
        };
    }, [contestId, soundEnabled]);

    const fetchContests = async () => {
        try {
            const { data } = await api.get('/contests');
            setContests(data);
        } catch { }
    };

    const fetchViolations = async (cId: string) => {
        setLoading(true);
        try {
            const { data } = await api.get(`/violations/contest/${cId}`);
            setViolationData(data);
        } catch { }
        setLoading(false);
    };

    const selectContest = (cId: string) => {
        setContestId(cId);
        fetchViolations(cId);

        // Subscribe to this contest's alerts via WS
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: 'subscribe_admin', contestId: cId }));
        }
    };

    const handleDisqualify = async (userId: string, userName: string) => {
        if (!confirm(`Are you sure you want to disqualify ${userName}? This action cannot be easily undone.`)) return;

        try {
            await api.post('/violations/disqualify', {
                userId,
                contestId,
                reason: 'Manual admin disqualification from violation dashboard',
            });
            fetchViolations(contestId);
        } catch { }
    };

    const handleUnflag = async (userId: string) => {
        try {
            await api.post('/violations/unflag', { userId, contestId });
            fetchViolations(contestId);
        } catch { }
    };

    return (
        <div className="min-h-screen bg-[#FDFDFD] dark:bg-[#0a0a0b] font-sans text-slate-900 dark:text-white transition-colors duration-500">
            {/* Invisible audio element for alert sound */}
            <audio ref={audioRef} preload="auto">
                <source src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbsGczPWug0NuzZjM9a6DQ27NmMz1roNDbs2YzPWug0NuzZjM9" type="audio/wav" />
            </audio>

            {/* Header */}
            <header className="bg-white dark:bg-[#0a0a0b]/80 border-b border-slate-200 dark:border-white/10 px-8 py-5 backdrop-blur-md transition-colors">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={() => router.push('/admin/dashboard')} className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">
                            <ArrowLeft size={20} />
                        </button>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl flex items-center justify-center transition-colors">
                                <Shield size={20} className="text-red-500 dark:text-red-400" />
                            </div>
                            <div>
                                <h1 className="text-lg font-black tracking-tight text-slate-900 dark:text-white transition-colors">Anti-Cheat Monitor</h1>
                                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium transition-colors">Real-time integrity surveillance</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Live Alerts Counter */}
                        <div className="flex items-center gap-2 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl px-4 py-2 transition-colors">
                            <Bell size={14} className="text-red-500 dark:text-red-400" />
                            <span className="text-sm font-bold text-red-600 dark:text-red-300">
                                {liveAlerts.length} Alert{liveAlerts.length !== 1 ? 's' : ''}
                            </span>
                            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                        </div>

                        {/* Sound Toggle */}
                        <button
                            onClick={() => setSoundEnabled(!soundEnabled)}
                            className={`p-2 rounded-lg transition-colors ${soundEnabled ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}
                        >
                            <Volume2 size={16} />
                        </button>
                    </div>
                </div>
            </header>

            <div className="flex h-[calc(100vh-73px)]">
                {/* Left Panel: Contest Selector + Live Feed */}
                <div className="w-96 border-r border-slate-200 dark:border-white/10 flex flex-col bg-slate-50 dark:bg-[#0a0a0b] transition-colors">
                    {/* Contest Selector */}
                    <div className="p-4 border-b border-slate-200 dark:border-white/10 transition-colors">
                        <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] block mb-2 transition-colors">
                            Select Contest
                        </label>
                        <select
                            value={contestId}
                            onChange={(e) => selectContest(e.target.value)}
                            className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-sm font-medium rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500/50 transition-colors"
                        >
                            <option value="">— Choose Contest —</option>
                            {contests.map((c) => (
                                <option key={c.id} value={c.id}>{c.title}</option>
                            ))}
                        </select>
                    </div>

                    {/* Stats Cards */}
                    {violationData && (
                        <div className="grid grid-cols-3 gap-2 p-4 border-b border-slate-200 dark:border-white/10 transition-colors">
                            <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-transparent rounded-xl p-3 text-center transition-colors">
                                <p className="text-2xl font-black text-slate-900 dark:text-white transition-colors">{violationData.totalViolations}</p>
                                <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase mt-1 transition-colors">Total</p>
                            </div>
                            <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl p-3 text-center transition-colors">
                                <p className="text-2xl font-black text-amber-600 dark:text-amber-400 transition-colors">{violationData.flaggedUsers}</p>
                                <p className="text-[9px] font-bold text-amber-600/60 dark:text-amber-500/60 uppercase mt-1 transition-colors">Flagged</p>
                            </div>
                            <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl p-3 text-center transition-colors">
                                <p className="text-2xl font-black text-red-600 dark:text-red-400 transition-colors">{violationData.disqualifiedUsers}</p>
                                <p className="text-[9px] font-bold text-red-600/60 dark:text-red-500/60 uppercase mt-1 transition-colors">DQ&apos;d</p>
                            </div>
                        </div>
                    )}

                    {/* Live Alert Feed */}
                    <div className="flex-1 overflow-y-auto">
                        <div className="px-4 py-3 sticky top-0 bg-slate-50/90 dark:bg-[#0a0a0b]/90 backdrop-blur-md z-10 transition-colors">
                            <h3 className="text-[10px] font-black text-red-500 dark:text-red-400 uppercase tracking-[0.2em] flex items-center gap-2 transition-colors">
                                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                Live Alert Stream
                            </h3>
                        </div>
                        <div className="px-4 space-y-2 pb-4">
                            {liveAlerts.length === 0 ? (
                                <div className="text-center py-12 text-slate-500 dark:text-slate-600 text-sm font-medium transition-colors">
                                    No alerts yet. Monitoring...
                                </div>
                            ) : (
                                liveAlerts.map((alert, idx) => {
                                    const VIcon = VIOLATION_ICONS[alert.violationType] || AlertTriangle;
                                    return (
                                        <div
                                            key={`${alert.timestamp}-${idx}`}
                                            className={`p-3 rounded-xl border transition-all cursor-pointer hover:border-slate-300 dark:hover:border-white/20 ${alert.isDisqualified ? 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/30' :
                                                alert.isFlagged ? 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20' :
                                                    'bg-white dark:bg-white/5 border-slate-200 dark:border-white/5'
                                                }`}
                                            onClick={() => {
                                                if (alert.contestId !== contestId) selectContest(alert.contestId);
                                            }}
                                        >
                                            <div className="flex items-center gap-3">
                                                <VIcon size={14} className={
                                                    alert.isDisqualified ? 'text-red-500 dark:text-red-400' :
                                                        alert.isFlagged ? 'text-amber-500 dark:text-amber-400' : 'text-slate-400'
                                                } />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate transition-colors">
                                                        {alert.userName}
                                                        <span className="text-slate-500 dark:text-slate-400 font-normal ml-2 transition-colors">
                                                            {alert.userRollNumber}
                                                        </span>
                                                    </p>
                                                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium flex items-center gap-2 transition-colors">
                                                        <span>{VIOLATION_LABELS[alert.violationType]}</span>
                                                        <span>•</span>
                                                        <span>#{alert.violationCount}</span>
                                                        <span>•</span>
                                                        <span>{new Date(alert.timestamp).toLocaleTimeString()}</span>
                                                    </p>
                                                </div>
                                                {alert.isDisqualified && (
                                                    <span className="text-[9px] font-black bg-red-500 text-white px-2 py-0.5 rounded-full">DQ</span>
                                                )}
                                                {!alert.isDisqualified && alert.isFlagged && (
                                                    <span className="text-[9px] font-black bg-amber-500 text-white px-2 py-0.5 rounded-full">⚠</span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>

                {/* Main Panel: Flagged Users Table */}
                <div className="flex-1 flex flex-col bg-white dark:bg-[#0a0a0b] transition-colors">
                    {!contestId ? (
                        <div className="flex-1 flex items-center justify-center text-slate-500 dark:text-slate-600 transition-colors">
                            <div className="text-center">
                                <Shield size={48} className="mx-auto mb-4 opacity-30" />
                                <p className="font-bold text-slate-900 dark:text-white transition-colors">Select a contest to monitor</p>
                                <p className="text-sm mt-1">Real-time violation tracking will appear here</p>
                            </div>
                        </div>
                    ) : loading ? (
                        <div className="flex-1 flex items-center justify-center">
                            <div className="w-8 h-8 border-4 border-red-500/20 border-t-red-500 rounded-full animate-spin" />
                        </div>
                    ) : (
                        <>
                            {/* Toolbar */}
                            <div className="px-6 py-4 border-b border-slate-200 dark:border-white/10 flex items-center justify-between transition-colors">
                                <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider transition-colors">
                                    Participants Under Review
                                </h2>
                                <button
                                    onClick={() => fetchViolations(contestId)}
                                    className="flex items-center gap-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-transparent text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors px-4 py-2 rounded-xl text-xs font-bold"
                                >
                                    <RefreshCw size={14} /> Refresh
                                </button>
                            </div>

                            {/* User Table */}
                            <div className="flex-1 overflow-y-auto">
                                {violationData && violationData.users.length > 0 ? (
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-slate-50 dark:bg-[#0F1219] sticky top-0 z-10 transition-colors">
                                            <tr className="border-b border-slate-200 dark:border-white/5 transition-colors">
                                                <th className="px-6 py-4 font-bold text-slate-500 text-[10px] uppercase tracking-wider">Status</th>
                                                <th className="px-6 py-4 font-bold text-slate-500 text-[10px] uppercase tracking-wider">Student</th>
                                                <th className="px-6 py-4 font-bold text-slate-500 text-[10px] uppercase tracking-wider text-center">Violations</th>
                                                <th className="px-6 py-4 font-bold text-slate-500 text-[10px] uppercase tracking-wider">Recent Type</th>
                                                <th className="px-6 py-4 font-bold text-slate-500 text-[10px] uppercase tracking-wider text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-white/5 transition-colors">
                                            {violationData.users.map((u) => {
                                                const latestViolation = u.violations[0];
                                                const LatestIcon = latestViolation
                                                    ? (VIOLATION_ICONS[latestViolation.violation_type] || AlertTriangle)
                                                    : AlertTriangle;

                                                return (
                                                    <tr
                                                        key={u.userId}
                                                        className={`cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-white/5 ${u.isDisqualified ? 'bg-red-50/50 dark:bg-red-500/5' :
                                                            u.isFlagged ? 'bg-amber-50/50 dark:bg-amber-500/5' : ''
                                                            }`}
                                                        onClick={() => setSelectedUser(u)}
                                                    >
                                                        <td className="px-6 py-4">
                                                            {u.isDisqualified ? (
                                                                <span className="flex items-center gap-2 text-red-400 font-bold text-xs">
                                                                    <Ban size={14} /> DISQUALIFIED
                                                                </span>
                                                            ) : u.isFlagged ? (
                                                                <span className="flex items-center gap-2 text-amber-400 font-bold text-xs animate-pulse">
                                                                    <AlertTriangle size={14} /> FLAGGED
                                                                </span>
                                                            ) : (
                                                                <span className="flex items-center gap-2 text-slate-500 font-bold text-xs">
                                                                    <Eye size={14} /> MONITORING
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <p className="font-bold text-slate-900 dark:text-white transition-colors">{u.userName}</p>
                                                            <p className="text-[10px] text-slate-500 font-bold uppercase">{u.rollNumber}</p>
                                                        </td>
                                                        <td className="px-6 py-4 text-center">
                                                            <span className={`inline-flex items-center justify-center w-10 h-10 rounded-xl font-black text-lg transition-colors ${u.violationCount >= 7 ? 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400' :
                                                                u.violationCount >= 3 ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400' :
                                                                    'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400'
                                                                }`}>
                                                                {u.violationCount}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            {latestViolation && (
                                                                <div className="flex items-center gap-2">
                                                                    <LatestIcon size={14} className="text-slate-400" />
                                                                    <div>
                                                                        <p className="text-xs font-medium text-slate-700 dark:text-slate-300 transition-colors">
                                                                            {VIOLATION_LABELS[latestViolation.violation_type]}
                                                                        </p>
                                                                        <p className="text-[10px] text-slate-500 dark:text-slate-600 transition-colors">
                                                                            {new Date(latestViolation.timestamp).toLocaleTimeString()}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <div className="flex items-center justify-end gap-2">
                                                                {!u.isDisqualified && (
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleDisqualify(u.userId, u.userName);
                                                                        }}
                                                                        className="p-2 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-lg transition-colors"
                                                                        title="Disqualify"
                                                                    >
                                                                        <UserX size={14} />
                                                                    </button>
                                                                )}
                                                                {u.isFlagged && !u.isDisqualified && (
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleUnflag(u.userId);
                                                                        }}
                                                                        className="p-2 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 rounded-lg transition-colors"
                                                                        title="Clear Flag"
                                                                    >
                                                                        <CheckCircle2 size={14} />
                                                                    </button>
                                                                )}
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); setSelectedUser(u); }}
                                                                    className="p-2 bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10 rounded-lg transition-colors"
                                                                    title="View Details"
                                                                >
                                                                    <ChevronRight size={14} />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                ) : (
                                    <div className="flex-1 flex items-center justify-center text-slate-600 py-20">
                                        <div className="text-center">
                                            <CheckCircle2 size={48} className="mx-auto mb-4 text-emerald-500/30" />
                                            <p className="font-bold text-emerald-500/50">All Clear</p>
                                            <p className="text-sm mt-1">No violations recorded for this contest</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>

                {/* Right Panel: User Detail Drawer */}
                {selectedUser && (
                    <div className="w-96 border-l border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-[#0D1017] flex flex-col transition-colors">
                        <div className="p-4 border-b border-slate-200 dark:border-white/5 flex items-center justify-between transition-colors">
                            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider transition-colors">Violation Timeline</h3>
                            <button onClick={() => setSelectedUser(null)} className="text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">
                                <XCircle size={18} />
                            </button>
                        </div>

                        {/* User Info */}
                        <div className="p-4 border-b border-slate-200 dark:border-white/5 transition-colors">
                            <div className="flex items-center gap-3 mb-3">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg transition-colors ${selectedUser.isDisqualified ? 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400' :
                                    selectedUser.isFlagged ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400' :
                                        'bg-slate-200 dark:bg-white/5 text-slate-600 dark:text-slate-400'
                                    }`}>
                                    {selectedUser.violationCount}
                                </div>
                                <div>
                                    <p className="font-bold text-slate-900 dark:text-white transition-colors">{selectedUser.userName}</p>
                                    <p className="text-xs text-slate-500 font-bold">{selectedUser.rollNumber}</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                {selectedUser.isDisqualified ? (
                                    <span className="text-[10px] font-black bg-red-500 text-white px-3 py-1 rounded-full">DISQUALIFIED</span>
                                ) : selectedUser.isFlagged ? (
                                    <span className="text-[10px] font-black bg-amber-500 text-white px-3 py-1 rounded-full">FLAGGED</span>
                                ) : (
                                    <span className="text-[10px] font-black bg-blue-500 text-white px-3 py-1 rounded-full">UNDER REVIEW</span>
                                )}
                            </div>
                        </div>

                        {/* Violation Timeline */}
                        <div className="flex-1 overflow-y-auto p-4">
                            <div className="space-y-3">
                                {selectedUser.violations.map((v, idx) => {
                                    const VIcon = VIOLATION_ICONS[v.violation_type] || AlertTriangle;
                                    return (
                                        <div key={v.id || idx} className="flex gap-3">
                                            <div className="flex flex-col items-center">
                                                <div className="w-8 h-8 bg-white dark:bg-[#161B25] border border-slate-200 dark:border-transparent rounded-lg flex items-center justify-center transition-colors">
                                                    <VIcon size={14} className="text-slate-400" />
                                                </div>
                                                {idx < selectedUser.violations.length - 1 && (
                                                    <div className="w-0.5 flex-1 bg-slate-200 dark:bg-white/5 mt-1 transition-colors" />
                                                )}
                                            </div>
                                            <div className="flex-1 pb-3">
                                                <p className="text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors">
                                                    {VIOLATION_LABELS[v.violation_type]}
                                                </p>
                                                {v.metadata && (
                                                    <p className="text-[10px] text-slate-500 dark:text-slate-600 font-mono mt-0.5 transition-colors">
                                                        {v.metadata}
                                                    </p>
                                                )}
                                                <p className="text-[10px] text-slate-500 dark:text-slate-600 mt-0.5 flex items-center gap-1 transition-colors">
                                                    <Clock size={10} />
                                                    {new Date(v.timestamp).toLocaleString()}
                                                </p>
                                            </div>
                                            <div className="text-[10px] text-slate-500 dark:text-slate-600 font-bold transition-colors">
                                                #{selectedUser.violations.length - idx}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="p-4 border-t border-slate-200 dark:border-white/5 space-y-2 transition-colors">
                            {!selectedUser.isDisqualified && (
                                <button
                                    onClick={() => handleDisqualify(selectedUser.userId, selectedUser.userName)}
                                    className="w-full py-3 bg-red-100 dark:bg-red-500/20 hover:bg-red-200 dark:hover:bg-red-500/30 text-red-600 dark:text-red-400 font-bold rounded-xl transition-colors text-sm flex items-center justify-center gap-2"
                                >
                                    <UserX size={16} /> Disqualify Student
                                </button>
                            )}
                            {selectedUser.isFlagged && !selectedUser.isDisqualified && (
                                <button
                                    onClick={() => handleUnflag(selectedUser.userId)}
                                    className="w-full py-3 bg-emerald-100 dark:bg-emerald-500/10 hover:bg-emerald-200 dark:hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold rounded-xl transition-colors text-sm flex items-center justify-center gap-2"
                                >
                                    <CheckCircle2 size={16} /> Clear Flag (Allow Continue)
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
