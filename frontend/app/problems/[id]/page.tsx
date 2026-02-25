/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Editor from "@monaco-editor/react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../../../lib/api";
import { useAuthStore } from "../../../store/auth";
import AntiCheatWrapper from "../../../components/AntiCheatWrapper";
import {
    ShieldCheck,
    User as UserIcon,
    FileText,
    Settings,
    RotateCcw,
    CheckCircle2,
    AlertCircle,
    Server,
    Clock,
    Cpu,
    Terminal,
    Search,
    CloudUpload,
    Star,
    Share2,
    ChevronDown,
    Maximize,
    Play,
    Zap,
    XCircle,
    Timer,
    MemoryStick,
    ThumbsUp,
    ThumbsDown,
    MessageSquare,
    Globe,
    ExternalLink,
    Send,
    ChevronRight
} from "lucide-react";

interface LanguageOption {
    id: string;
    name: string;
    monacoId: string;
    boilerplate: string;
    fileExtension: string;
    timeLimit: number;
    memoryLimit: number;
}

export default function ProblemSolvePage() {
    const { id } = useParams() as { id: string };
    const searchParams = useSearchParams();
    const contestId = searchParams.get('contestId') || undefined;
    const user = useAuthStore(state => state.user);
    const router = useRouter();

    const [problem, setProblem] = useState<any>(null);
    const [code, setCode] = useState("// Write your solution here");
    const [language, setLanguage] = useState("python");
    const [languages, setLanguages] = useState<LanguageOption[]>([]);
    const [allowedLanguages, setAllowedLanguages] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [consoleOpen, setConsoleOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'description' | 'submissions' | 'solutions'>('description');
    const [mySubmissions, setMySubmissions] = useState<any[]>([]);
    const [solutions, setSolutions] = useState<any[]>([]);
    const [pollingId, setPollingId] = useState<string | null>(null);
    const [runningCode, setRunningCode] = useState(false);

    const [newSolution, setNewSolution] = useState({ title: "", explanation: "", code: "" });
    const [showSolutionForm, setShowSolutionForm] = useState(false);

    // Editor Settings
    const [showEditorSettings, setShowEditorSettings] = useState(false);
    const [editorConfig, setEditorConfig] = useState({
        fontSize: 14,
        theme: "vs-dark",
        minimap: false,
        wordWrap: "off" as "on" | "off"
    });

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => console.error(err));
        } else {
            if (document.exitFullscreen) document.exitFullscreen();
        }
    };

    const fetchLanguages = useCallback(async () => {
        try {
            const { data } = await api.get('/submissions/languages');
            setLanguages(data);
        } catch (e) {
            console.error('Failed to fetch languages:', e);
        }
    }, []);

    useEffect(() => {
        fetchLanguages();
    }, [fetchLanguages]);

    const fetchProblem = useCallback(async () => {
        try {
            const { data } = await api.get(`/problems/${id}`);
            setProblem(data);
            setAllowedLanguages(data.allowed_languages || []);

            const defaultLang = data.problem_type === 'SQL' ? 'sql' :
                (data.allowed_languages?.includes('python') ? 'python' : data.allowed_languages?.[0] || 'python');
            setLanguage(defaultLang);
        } catch (e) {
            console.error(e);
            router.push('/problems');
        } finally {
            setLoading(false);
        }
    }, [id, router]);

    const fetchMySubmissions = useCallback(async () => {
        try {
            const { data } = await api.get(`/submissions?problemId=${id}`);
            setMySubmissions(data);
        } catch (e) {
            console.error(e);
        }
    }, [id]);

    const fetchSolutions = useCallback(async () => {
        try {
            const { data } = await api.get(`/problems/${id}/solutions`);
            setSolutions(data);
        } catch (e) {
            console.error(e);
        }
    }, [id]);

    useEffect(() => {
        if (!user) {
            router.push('/');
            return;
        }
        fetchProblem();
    }, [id, user, router, fetchProblem]);

    useEffect(() => {
        if (problem) {
            fetchMySubmissions();
            fetchSolutions();
        }
    }, [problem, fetchMySubmissions, fetchSolutions]);

    useEffect(() => {
        if (!pollingId) return;

        // Automatically use current host, swap HTTP protocol for WS protocol
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = process.env.NEXT_PUBLIC_API_URL
            ? process.env.NEXT_PUBLIC_API_URL.replace('http:', 'ws:').replace('https:', 'wss:') + '/ws'
            : `${protocol}//${window.location.host}/ws`;

        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
            ws.send(JSON.stringify({ type: 'watch_submission', submissionId: pollingId }));
        };

        ws.onmessage = async (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.type === 'submission_update' && data.submissionId === pollingId) {
                    if (data.status !== 'PENDING') {
                        // The engine has finished running the code. Fetch full diagnostic result
                        const res = await api.get(`/submissions/${pollingId}`);
                        setResult(res.data);
                        setPollingId(null);
                        setSubmitting(false);
                        setConsoleOpen(true);
                        fetchMySubmissions();
                        ws.close();
                    }
                }
            } catch (e) { }
        };

        // Fallback cleanup + timeout (just in case the WS drops)
        const timeout = setTimeout(async () => {
            if (pollingId) {
                try {
                    const { data } = await api.get(`/submissions/${pollingId}`);
                    if (data.status !== 'PENDING') {
                        setResult(data);
                        setPollingId(null);
                        setSubmitting(false);
                        fetchMySubmissions();
                    }
                } catch (e) { }
            }
        }, 15000);

        return () => {
            clearTimeout(timeout);
            if (ws.readyState === WebSocket.OPEN) {
                ws.close();
            }
        };
    }, [pollingId, fetchMySubmissions]);

    const submitCode = async () => {
        if (submitting || runningCode) return;
        setSubmitting(true);
        setConsoleOpen(true);
        setResult(null);
        try {
            const { data } = await api.post('/submissions', {
                problemId: id,
                code: code,
                language: language
            });
            setPollingId(data.id);
            setResult({ status: 'PENDING', id: data.id, message: "Queued for submission..." });
        } catch (e: any) {
            setResult({ status: 'ERROR', error: e.response?.data?.error || 'System error' });
            setSubmitting(false);
        }
    };

    const runCodeOption = async () => {
        if (submitting || runningCode) return;
        setRunningCode(true);
        setConsoleOpen(true);
        setResult({ status: 'PENDING', message: "Executing instantly..." });
        try {
            const { data } = await api.post('/submissions/run', {
                problemId: id,
                code: code,
                language: language
            });
            setResult(data);
        } catch (e: any) {
            setResult({ status: 'ERROR', error: e.response?.data?.error || 'Execution failed' });
        } finally {
            setRunningCode(false);
        }
    };

    const handlePostSolution = async () => {
        try {
            await api.post(`/problems/${id}/solutions`, {
                ...newSolution,
                code: code,
                language: language
            });
            setShowSolutionForm(false);
            fetchSolutions();
        } catch (e) {
            alert("Failed to post solution");
        }
    };

    const handleLike = async (type: 'like' | 'dislike') => {
        try {
            await api.post(`/problems/${id}/${type}`);
            fetchProblem();
        } catch (e) {
            console.error(e);
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-[#0a0a0b] text-white">
            <div className="flex flex-col items-center gap-4">
                <div className="w-10 h-10 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
                <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">Warping to Arena...</p>
            </div>
        </div>
    );

    const statusConfig: Record<string, { color: string; icon: any; label: string }> = {
        'PENDING': { color: 'text-slate-500', icon: Clock, label: 'Judging...' },
        'PASS': { color: 'text-emerald-500', icon: CheckCircle2, label: 'Accepted' },
        'FAIL': { color: 'text-red-500', icon: XCircle, label: 'Wrong Answer' },
        'ERROR': { color: 'text-amber-500', icon: AlertCircle, label: 'Error' },
        'TLE': { color: 'text-orange-500', icon: Timer, label: 'Time Limit Exceeded' },
        'MLE': { color: 'text-purple-500', icon: MemoryStick, label: 'Memory Limit Exceeded' },
        'COMPILATION_ERROR': { color: 'text-yellow-500', icon: Terminal, label: 'Compilation Error' },
        'RUNTIME_ERROR': { color: 'text-red-400', icon: Zap, label: 'Runtime Error' },
    };

    const filteredLanguages = languages.filter(l =>
        allowedLanguages.length === 0 || allowedLanguages.includes(l.id)
    );

    const currentLangConfig = languages.find(l => l.id === language);

    return (
        <AntiCheatWrapper
            contestId={contestId}
            problemId={id}
            onAutoSubmit={submitCode}
            strictMode={!!contestId}
            enabled={!!contestId}
        >
            <div className="bg-slate-50 dark:bg-[#0a0a0b] text-slate-900 dark:text-slate-100 h-screen overflow-hidden flex flex-col font-sans selection:bg-amber-500 selection:text-black transition-colors duration-500">
                {/* Header */}
                <header className="h-14 border-b border-slate-200 dark:border-white/5 flex items-center justify-between px-6 bg-white/80 dark:bg-[#0a0a0b]/80 backdrop-blur-xl z-50 shrink-0">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push('/problems')}>
                            <div className="size-7 bg-amber-500 rounded flex items-center justify-center shadow-lg shadow-amber-500/20">
                                <Terminal size={18} className="text-black stroke-[3]" />
                            </div>
                            <h1 className="font-black text-sm tracking-tighter hidden md:block uppercase">Arena <span className="text-amber-500">v2</span></h1>
                        </div>
                        <div className="h-4 w-px bg-white/10 dark:block hidden"></div>
                        <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500 bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
                            <span className="size-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                            Online
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 bg-white/5 rounded-xl border border-white/5 p-1 px-3">
                            <Search size={14} className="text-slate-500" />
                            <input className="bg-transparent border-none focus:ring-0 text-[10px] w-32 placeholder:text-slate-600 font-bold uppercase tracking-widest focus:outline-none" placeholder="Go to..." type="text" />
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={runCodeOption}
                                disabled={submitting || runningCode}
                                className="flex items-center gap-2 bg-slate-800 text-slate-300 hover:text-white px-5 py-2 rounded-xl border border-white/10 text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-slate-700 transition-all disabled:opacity-50"
                            >
                                {runningCode ? <RotateCcw size={14} className="animate-spin" /> : <Play size={14} className="text-emerald-500" />}
                                {runningCode ? 'Running' : 'Run '}
                            </button>
                            <button
                                onClick={submitCode}
                                disabled={submitting || runningCode}
                                className="flex items-center gap-2 bg-amber-500 text-black px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-amber-500/20 hover:scale-105 transition-all disabled:opacity-50"
                            >
                                {submitting ? <RotateCcw size={14} className="animate-spin" /> : <CloudUpload size={14} />}
                                {submitting ? 'Judging' : 'Submit'}
                            </button>
                        </div>
                        <div className="size-8 rounded-full border border-white/10 overflow-hidden bg-white/5 flex items-center justify-center">
                            {user?.avatar_url ? <img src={user.avatar_url} className="w-full h-full object-cover" alt="" /> : <UserIcon size={16} />}
                        </div>
                    </div>
                </header>

                <main className="flex-1 flex overflow-hidden bg-[#0c0c0e]">
                    <aside className="w-[500px] flex-shrink-0 flex flex-col border-r border-white/5 bg-[#0a0a0b]">
                        <div className="flex bg-[#0f0f11] border-b border-white/5 px-4 h-12 items-center">
                            {['description', 'submissions', 'solutions'].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab as any)}
                                    className={`px-4 h-full text-[10px] font-black uppercase tracking-[0.2em] transition-all relative ${activeTab === tab ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
                                >
                                    {tab}
                                    {activeTab === tab && <motion.div layoutId="activeTab" className="absolute bottom-0 left-4 right-4 h-0.5 bg-amber-500" />}
                                </button>
                            ))}
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                            <AnimatePresence mode="wait">
                                {activeTab === 'description' && (
                                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} key="desc" className="space-y-8">
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${problem.difficulty === 'Easy' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                                                    problem.difficulty === 'Hard' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                                                        'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                                                    }`}>
                                                    {problem.difficulty}
                                                </span>
                                                <div className="flex items-center gap-4">
                                                    <button onClick={() => handleLike('like')} className="flex items-center gap-1.5 text-slate-400 hover:text-amber-500 transition-colors">
                                                        <ThumbsUp size={16} /> <span className="text-xs font-bold">{problem.likes_count || 0}</span>
                                                    </button>
                                                    <button onClick={() => handleLike('dislike')} className="flex items-center gap-1.5 text-slate-400 hover:text-red-500 transition-colors">
                                                        <ThumbsDown size={16} /> <span className="text-xs font-bold">{problem.dislikes_count || 0}</span>
                                                    </button>
                                                    <button className="text-slate-400 hover:text-white transition-colors"><Star size={16} /></button>
                                                    <button className="text-slate-400 hover:text-white transition-colors"><Share2 size={16} /></button>
                                                </div>
                                            </div>
                                            <h2 className="text-3xl font-black tracking-tight">{problem.title}</h2>
                                        </div>

                                        <div className="prose prose-invert max-w-none text-[15px] leading-relaxed text-slate-300 font-medium whitespace-pre-wrap">
                                            {problem.description}
                                        </div>

                                        {problem.testCases?.slice(0, 2).map((tc: any, i: number) => (
                                            <div key={i} className="space-y-3">
                                                <div className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Example {i + 1}</div>
                                                <div className="bg-[#1a1a1c] rounded-2xl p-5 border border-white/5 space-y-3 shadow-inner">
                                                    <div className="space-y-1">
                                                        <div className="text-[9px] font-black text-slate-500 uppercase">Input</div>
                                                        <code className="text-xs text-slate-100 font-mono italic">{tc.input}</code>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <div className="text-[9px] font-black text-slate-500 uppercase">Output</div>
                                                        <code className="text-xs text-amber-500 font-mono font-bold">{tc.expected_output}</code>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </motion.div>
                                )}

                                {activeTab === 'solutions' && (
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} key="solutions" className="space-y-6">
                                        <div className="flex justify-between items-center mb-6">
                                            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Community Solutions</h3>
                                            <button onClick={() => setShowSolutionForm(!showSolutionForm)} className="bg-amber-500/10 text-amber-500 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-500 hover:text-black transition-all">+ Post Mine</button>
                                        </div>

                                        {showSolutionForm && (
                                            <div className="p-6 bg-[#1a1a1c] border border-white/5 rounded-2xl space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                                <input
                                                    placeholder="Solution Title (e.g. Optimal O(N) Approach)"
                                                    className="w-full bg-black/50 border border-white/5 rounded-xl px-4 py-3 text-xs font-bold transition-all focus:border-amber-500 outline-none"
                                                    value={newSolution.title}
                                                    onChange={e => setNewSolution({ ...newSolution, title: e.target.value })}
                                                />
                                                <textarea
                                                    placeholder="Explain your logic..."
                                                    className="w-full bg-black/50 border border-white/5 rounded-2xl px-4 py-3 text-xs font-medium h-32 focus:border-amber-500 transition-all outline-none resize-none"
                                                    value={newSolution.explanation}
                                                    onChange={e => setNewSolution({ ...newSolution, explanation: e.target.value })}
                                                />
                                                <button onClick={handlePostSolution} className="w-full bg-amber-500 text-black py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-opacity flex items-center justify-center gap-2"><Send size={14} /> Publish Solution</button>
                                            </div>
                                        )}

                                        {solutions.map((sol: any) => (
                                            <div key={sol.id} className="bg-[#1a1a1c] border border-white/5 rounded-3xl p-6 space-y-4 group hover:border-amber-500/30 transition-all shadow-xl shadow-black/20">
                                                <div className="flex justify-between items-start">
                                                    <div className="flex gap-3 items-center">
                                                        <div className="size-10 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-500/5 flex items-center justify-center border border-amber-500/20"><UserIcon size={18} className="text-amber-500" /></div>
                                                        <div>
                                                            <div className="text-xs font-black uppercase tracking-tight">{sol.user?.name}</div>
                                                            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">{new Date(sol.created_at).toLocaleDateString()}</div>
                                                        </div>
                                                    </div>
                                                    <span className="text-[10px] font-black text-amber-500 bg-amber-500/10 px-2 py-1 rounded truncate max-w-[80px] uppercase">{sol.language}</span>
                                                </div>
                                                <h4 className="font-black text-lg text-white group-hover:text-amber-500 transition-colors leading-tight">{sol.title || "Untitled Solution"}</h4>
                                                <p className="text-xs text-slate-400 line-clamp-3 font-medium leading-relaxed italic">{sol.explanation}</p>
                                                <div className="flex items-center justify-between pt-2">
                                                    <div className="flex items-center gap-4">
                                                        <button className="flex items-center gap-1.5 text-slate-500 hover:text-amber-500 transition-colors"><ThumbsUp size={14} /> <span className="text-xs font-black">{sol.upvotes}</span></button>
                                                        <button className="flex items-center gap-1.5 text-slate-500 hover:text-white transition-colors"><MessageSquare size={14} /> <span className="text-xs font-black">0</span></button>
                                                    </div>
                                                    <button
                                                        onClick={() => { setCode(sol.code); setLanguage(sol.language); setActiveTab('description'); }}
                                                        className="text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-amber-500 flex items-center gap-1 transition-all"
                                                    >
                                                        View Code <ChevronRight size={12} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </motion.div>
                                )}

                                {activeTab === 'submissions' && (
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} key="subs" className="space-y-3">
                                        {mySubmissions.map((sub: any) => {
                                            const config = statusConfig[sub.status] || statusConfig['ERROR'];
                                            const StatusIcon = config.icon;
                                            return (
                                                <div key={sub.id} className="bg-[#1a1a1c] border border-white/5 rounded-2xl p-4 flex justify-between items-center group cursor-pointer hover:border-white/20 transition-all shadow-inner">
                                                    <div className="flex gap-4 items-center">
                                                        <div className={`size-10 rounded-xl flex items-center justify-center bg-white/5 ${config.color.replace('text', 'bg')}/10`}><StatusIcon size={20} className={config.color} /></div>
                                                        <div>
                                                            <div className={`text-[10px] font-black uppercase tracking-widest ${config.color}`}>{config.label}</div>
                                                            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">{new Date(sub.created_at).toLocaleTimeString()}</div>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-[10px] font-black uppercase text-white tracking-widest mb-1">{sub.language}</div>
                                                        <div className="text-[11px] font-mono font-bold text-slate-500">{sub.execution_time ? (sub.execution_time * 1000).toFixed(0) : '--'} MS</div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </aside>

                    <section className="flex-1 flex flex-col relative overflow-hidden bg-[#0c0c0e]">
                        <div className="h-12 border-b border-white/5 bg-[#0f0f11] flex items-center justify-between px-6 shrink-0 z-10">
                            <div className="flex items-center gap-6">
                                <div className="flex items-center gap-2 relative">
                                    <select
                                        value={language}
                                        onChange={e => {
                                            setLanguage(e.target.value);
                                            const cfg = languages.find(l => l.id === e.target.value);
                                            if (cfg) setCode(cfg.boilerplate);
                                        }}
                                        className="bg-transparent border-none text-[10px] font-black uppercase tracking-widest text-slate-300 focus:ring-0 outline-none cursor-pointer appearance-none hover:text-amber-500 transition-all z-10"
                                    >
                                        {filteredLanguages.map(l => <option key={l.id} value={l.id} className="bg-[#0f0f11]">{l.name}</option>)}
                                    </select>
                                    <ChevronDown size={14} className="text-slate-500 -ml-1 pointer-events-none" />
                                </div>
                                <div className="h-4 w-px bg-white/10"></div>
                                <button
                                    onClick={() => setShowEditorSettings(!showEditorSettings)}
                                    className={`flex items-center gap-2 transition-colors ${showEditorSettings ? 'text-amber-500' : 'text-slate-500 hover:text-white'}`}
                                >
                                    <Settings size={14} /><span className="text-[10px] font-black uppercase tracking-widest">Settings</span>
                                </button>
                                <button onClick={() => { const cfg = languages.find(l => l.id === language); if (cfg) setCode(cfg.boilerplate); }} className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors"><RotateCcw size={14} /><span className="text-[10px] font-black uppercase tracking-widest">Reset</span></button>
                            </div>
                            <div className="flex items-center gap-3">
                                {problem.problem_type === 'WEB_DEV' && <button className="flex items-center gap-2 bg-blue-500/10 text-blue-500 px-4 py-1.5 rounded-lg border border-blue-500/20 text-[10px] font-black uppercase tracking-widest hover:bg-blue-500 hover:text-white transition-all"><ExternalLink size={14} /> Live Preview</button>}
                                <button onClick={toggleFullscreen} className="p-2 text-slate-500 hover:text-white transition-colors" title="Full Screen"><Maximize size={16} /></button>
                            </div>
                        </div>

                        {/* Editor Settings Panel Overlay */}
                        <AnimatePresence>
                            {showEditorSettings && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="absolute right-6 top-14 z-30 w-64 bg-[#1a1a1c] border border-white/10 rounded-2xl shadow-2xl p-4 space-y-4"
                                >
                                    <div className="flex items-center justify-between pointer-events-none">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Editor Settings</span>
                                        <Settings size={14} className="text-slate-500" />
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold text-slate-300">Theme</span>
                                            <select
                                                value={editorConfig.theme}
                                                onChange={e => setEditorConfig({ ...editorConfig, theme: e.target.value })}
                                                className="bg-black/50 border border-white/5 rounded px-2 py-1 text-xs text-white outline-none"
                                            >
                                                <option value="vs-dark">Dark</option>
                                                <option value="light">Light</option>
                                                <option value="hc-black">High Contrast</option>
                                            </select>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold text-slate-300">Font Size</span>
                                            <div className="flex items-center gap-2 bg-black/50 border border-white/5 rounded px-2 py-1">
                                                <button onClick={() => setEditorConfig({ ...editorConfig, fontSize: Math.max(10, editorConfig.fontSize - 2) })} className="text-slate-400 hover:text-white transition-colors">-</button>
                                                <span className="text-xs font-mono w-4 text-center">{editorConfig.fontSize}</span>
                                                <button onClick={() => setEditorConfig({ ...editorConfig, fontSize: Math.min(32, editorConfig.fontSize + 2) })} className="text-slate-400 hover:text-white transition-colors">+</button>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold text-slate-300">Minimap</span>
                                            <button
                                                onClick={() => setEditorConfig({ ...editorConfig, minimap: !editorConfig.minimap })}
                                                className={`text-xs font-bold px-2 py-1 rounded transition-colors ${editorConfig.minimap ? 'bg-amber-500 text-black' : 'bg-white/5 text-slate-400'}`}
                                            >
                                                {editorConfig.minimap ? 'ON' : 'OFF'}
                                            </button>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold text-slate-300">Word Wrap</span>
                                            <button
                                                onClick={() => setEditorConfig({ ...editorConfig, wordWrap: editorConfig.wordWrap === 'on' ? 'off' : 'on' })}
                                                className={`text-xs font-bold px-2 py-1 rounded transition-colors ${editorConfig.wordWrap === 'on' ? 'bg-amber-500 text-black' : 'bg-white/5 text-slate-400'}`}
                                            >
                                                {editorConfig.wordWrap === 'on' ? 'ON' : 'OFF'}
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="flex-1 overflow-hidden relative border-b border-white/5 bg-[#0a0a0b]">
                            <Editor
                                height="100%"
                                language={currentLangConfig?.monacoId || 'plaintext'}
                                theme={editorConfig.theme}
                                value={code}
                                onChange={val => setCode(val || "")}
                                options={{
                                    minimap: { enabled: editorConfig.minimap },
                                    fontSize: editorConfig.fontSize,
                                    wordWrap: editorConfig.wordWrap,
                                    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                                    padding: { top: 20 },
                                    smoothScrolling: true,
                                    cursorBlinking: "expand",
                                    lineNumbers: "on",
                                    renderLineHighlight: "all",
                                    tabSize: 4,
                                    scrollBeyondLastLine: false,
                                    scrollbar: { verticalScrollbarSize: 8, horizontalScrollbarSize: 8 },
                                    cursorSmoothCaretAnimation: "on"
                                }}
                            />
                        </div>

                        <AnimatePresence>
                            {consoleOpen && result && (
                                <motion.div initial={{ height: 0 }} animate={{ height: "300px" }} exit={{ height: 0 }} className="border-t border-white/5 bg-[#0c0c0e]/95 backdrop-blur-3xl overflow-hidden flex flex-col z-20 shadow-[0_-20px_50px_rgba(0,0,0,0.5)]">
                                    <div className="h-10 px-6 border-b border-white/5 flex items-center justify-between shrink-0">
                                        <div className="flex gap-6 h-full">
                                            <button className="h-full px-2 text-[10px] font-black uppercase tracking-widest text-amber-500 border-b-2 border-amber-500">Output</button>
                                            <button className="h-full px-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-300">Test Result</button>
                                        </div>
                                        <button onClick={() => setConsoleOpen(false)} className="size-6 rounded-lg hover:bg-white/5 flex items-center justify-center text-slate-500 hover:text-white transition-colors"><ChevronDown size={14} /></button>
                                    </div>
                                    <div className="flex-1 p-6 overflow-y-auto custom-scrollbar font-mono text-xs">
                                        {result.status === 'PENDING' ? (
                                            <div className="flex items-center gap-4 text-slate-400"><RotateCcw size={16} className="animate-spin text-amber-500" /><span className="uppercase tracking-widest font-black">{result.message || 'Executing against test cases...'}</span></div>
                                        ) : result.status === 'PASS' ? (
                                            <div className="space-y-6">
                                                <div className="flex items-center gap-3 text-emerald-500"><CheckCircle2 size={24} /><div className="text-xl font-black uppercase tracking-tighter">Perfect! All Tests Passed</div></div>
                                                <div className="grid grid-cols-2 gap-4 max-w-md">
                                                    <div className="bg-[#1a1a1c] p-4 rounded-2xl border border-white/5">
                                                        <div className="text-[8px] uppercase font-black text-slate-500 mb-1">Time Complexity</div>
                                                        <div className="text-lg font-black text-white italic">{(result.execution_time * 1000).toFixed(0)} ms</div>
                                                    </div>
                                                    <div className="bg-[#1a1a1c] p-4 rounded-2xl border border-white/5">
                                                        <div className="text-[8px] uppercase font-black text-slate-500 mb-1">Memory Efficiency</div>
                                                        <div className="text-lg font-black text-white italic">{result.memory_used?.toFixed(1) || '0.0'} MB</div>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="space-y-6">
                                                <div className="flex items-center gap-3 text-red-500"><AlertCircle size={24} /><div className="text-xl font-black uppercase tracking-tighter">{statusConfig[result.status]?.label || 'Error Found'}</div></div>
                                                <div className="bg-[#1a1a1c] border border-white/5 p-4 rounded-2xl space-y-3">
                                                    <div className="text-[10px] font-black uppercase text-amber-400">Diagnostic Details</div>
                                                    <pre className="text-slate-300 whitespace-pre-wrap leading-relaxed">
                                                        {result.verdict || result.error || 'Logic mismatch detected.'}

                                                        {result.output && (
                                                            <>
                                                                <br /><br />
                                                                <span className="text-xs text-slate-500">--- Output ---</span><br />
                                                                {result.output}
                                                            </>
                                                        )}
                                                        {result.expected && result.status === 'FAIL' && (
                                                            <>
                                                                <br /><br />
                                                                <span className="text-xs text-slate-500">--- Expected ---</span><br />
                                                                {result.expected}
                                                            </>
                                                        )}
                                                    </pre>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </section>
                </main>
            </div>
        </AntiCheatWrapper>
    );
}
