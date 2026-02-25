"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
    ChevronRight,
    Settings,
    Terminal,
    Rocket,
    Plus,
    X,
    Type,
    BarChart3,
    Tag,
    FileText,
    Eye,
    ChevronLeft
} from "lucide-react";
import api from "../../../../lib/api";

export default function CreateProblemPremium() {
    const router = useRouter();
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'description' | 'testcases' | 'solution'>('description');

    const [problem, setProblem] = useState({
        title: "",
        description: "",
        difficulty: "Easy",
        tags: "",
        default_solution: "",
        is_interview: false,
        testCases: [{ input: "", expected_output: "", is_hidden: false }]
    });

    const handleSave = async () => {
        try {
            setSaving(true);
            const payload = {
                ...problem,
                tags: problem.tags.split(',').map(t => t.trim()).filter(Boolean)
            };
            await api.post('/admin/problems', payload);
            router.push('/admin/problems');
        } catch {
            alert("Failed to create problem");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#FDFDFD] dark:bg-[#0a0a0b] flex flex-col font-sans text-slate-900 dark:text-slate-100 selection:bg-amber-100 transition-colors duration-500">
            {/* Header (Apple-Inspired Premium) */}
            <header className="h-16 border-b border-slate-200/60 dark:border-white/10 flex items-center justify-between px-8 bg-white/80 dark:bg-[#0a0a0b]/80 backdrop-blur-xl sticky top-0 z-50 transition-colors">
                <div className="flex items-center gap-6">
                    <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                        <ChevronLeft size={20} />
                        <span className="text-sm font-medium">Back</span>
                    </button>
                    <div className="h-4 w-px bg-slate-200 dark:bg-white/10 transition-colors"></div>
                    <div className="flex items-center gap-2">
                        <div className="size-7 bg-amber-500 rounded-lg flex items-center justify-center text-white shadow-lg shadow-amber-500/20">
                            <Plus size={16} strokeWidth={3} />
                        </div>
                        <span className="text-sm font-bold tracking-tight uppercase">CodeArena <span className="text-slate-400 dark:text-slate-500 font-normal underline decoration-slate-200 dark:decoration-white/10">Admin</span></span>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <button className="text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">
                        <Settings size={20} />
                    </button>
                    <div className="size-8 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 overflow-hidden shadow-sm font-bold text-slate-400 dark:text-slate-500 flex items-center justify-center text-[10px] transition-colors">
                        ADMIN
                    </div>
                </div>
            </header>

            <main className="flex-1 flex overflow-hidden">
                {/* Left Sidebar: Metadata */}
                <aside className="w-[400px] border-r border-slate-200/60 dark:border-white/10 flex flex-col bg-slate-50/30 dark:bg-white/5 overflow-y-auto transition-colors">
                    <div className="p-10 space-y-10">
                        <section className="space-y-4">
                            <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 transition-colors">
                                <Type size={12} className="text-amber-500" /> Problem Title
                            </label>
                            <input
                                value={problem.title}
                                onChange={e => setProblem({ ...problem, title: e.target.value })}
                                className="w-full bg-white dark:bg-[#0a0a0b] border border-slate-200 dark:border-white/10 rounded-2xl px-5 py-4 text-sm font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all shadow-sm placeholder:text-slate-300 dark:placeholder:text-slate-700"
                                placeholder="e.g. Invert Binary Tree"
                                type="text"
                            />
                        </section>

                        <section className="grid grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 transition-colors">
                                    <BarChart3 size={12} className="text-amber-500" /> Difficulty
                                </label>
                                <select
                                    value={problem.difficulty}
                                    onChange={e => setProblem({ ...problem, difficulty: e.target.value })}
                                    className="w-full bg-white dark:bg-[#0a0a0b] border border-slate-200 dark:border-white/10 rounded-2xl px-5 py-4 text-sm font-medium appearance-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all shadow-sm text-slate-900 dark:text-white"
                                >
                                    <option className="bg-white dark:bg-[#0a0a0b]">Easy</option>
                                    <option className="bg-white dark:bg-[#0a0a0b]">Medium</option>
                                    <option className="bg-white dark:bg-[#0a0a0b]">Hard</option>
                                </select>
                            </div>
                            <div className="space-y-4">
                                <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 transition-colors">
                                    <Rocket size={12} className="text-amber-500" /> Points
                                </label>
                                <input
                                    className="w-full bg-white dark:bg-[#0a0a0b] border border-slate-200 dark:border-white/10 rounded-2xl px-5 py-4 text-sm font-medium focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all shadow-sm text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-700"
                                    placeholder="100"
                                    type="number"
                                />
                            </div>
                        </section>

                        <section className="space-y-4">
                            <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 transition-colors">
                                <Tag size={12} className="text-amber-500" /> Categories
                            </label>
                            <div className="space-y-3">
                                <input
                                    value={problem.tags}
                                    onChange={e => setProblem({ ...problem, tags: e.target.value })}
                                    className="w-full bg-white dark:bg-[#0a0a0b] border border-slate-200 dark:border-white/10 rounded-2xl px-5 py-4 text-sm font-medium focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all shadow-sm placeholder:text-slate-300 dark:placeholder:text-slate-700 text-slate-900 dark:text-white"
                                    placeholder="e.g. Algorithms, Trees (comma separated)"
                                />
                                <div className="flex flex-wrap gap-2">
                                    {problem.tags.split(',').filter(Boolean).map((tag, i) => (
                                        <span key={i} className="px-3 py-1.5 bg-amber-50 dark:bg-amber-500/10 border border-amber-100/50 dark:border-amber-500/20 rounded-full text-[10px] font-bold text-amber-700 dark:text-amber-400 flex items-center gap-2 shadow-sm transition-colors">
                                            {tag.trim()}
                                            <X size={10} className="cursor-pointer hover:text-amber-900 dark:hover:text-amber-200" onClick={() => {
                                                const tags = problem.tags.split(',').filter((_, index) => index !== i).join(',');
                                                setProblem({ ...problem, tags });
                                            }} />
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </section>

                        <section className="space-y-4">
                            <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 transition-colors">
                                <Eye size={12} className="text-amber-500" /> Visibility & Type
                            </label>
                            <label className="flex items-center justify-between p-4 bg-white dark:bg-[#0a0a0b] border border-slate-200 dark:border-white/10 rounded-2xl cursor-pointer hover:border-amber-500/50 transition-all group">
                                <div className="space-y-0.5">
                                    <span className="text-xs font-bold text-slate-900 dark:text-white block">Interview Ready</span>
                                    <span className="text-[10px] text-slate-400 dark:text-slate-500">Mark as an interview question</span>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={problem.is_interview}
                                    onChange={e => setProblem({ ...problem, is_interview: e.target.checked })}
                                    className="size-5 rounded border-slate-200 dark:border-white/10 text-amber-500 focus:ring-amber-500/20"
                                />
                            </label>
                        </section>

                        <div className="pt-6">
                            <button className="w-full flex items-center justify-between px-6 py-4 rounded-2xl border border-slate-200 dark:border-white/10 hover:bg-white dark:hover:bg-white/5 hover:border-amber-500 hover:shadow-xl hover:shadow-amber-500/5 transition-all group">
                                <span className="text-sm font-bold text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">Advanced Limits</span>
                                <ChevronRight size={18} className="text-slate-300 dark:text-slate-600 group-hover:translate-x-1 group-hover:text-amber-500 transition-all" />
                            </button>
                        </div>
                    </div>
                </aside>

                {/* Main Content: Tabs & Editor */}
                <section className="flex-1 flex flex-col relative bg-slate-100/30 dark:bg-white/5 transition-colors">
                    <div className="h-16 flex items-center justify-center px-8 border-b border-slate-200/40 dark:border-white/10 bg-white dark:bg-[#0a0a0b] transition-colors">
                        <div className="flex p-1 bg-slate-100/50 dark:bg-white/5 rounded-2xl border border-slate-200/40 dark:border-white/10 transition-colors">
                            <button
                                onClick={() => setActiveTab('description')}
                                className={`px-8 py-2 rounded-xl text-xs font-bold tracking-tight transition-all ${activeTab === 'description'
                                    ? 'bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-lg shadow-slate-200/50 dark:shadow-black/20 border border-slate-200/40 dark:border-white/10 scale-[1.02]'
                                    : 'text-slate-500 dark:text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                                    }`}
                            >
                                Description
                            </button>
                            <button
                                onClick={() => setActiveTab('testcases')}
                                className={`px-8 py-2 rounded-xl text-xs font-bold tracking-tight transition-all ${activeTab === 'testcases'
                                    ? 'bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-lg shadow-slate-200/50 dark:shadow-black/20 border border-slate-200/40 dark:border-white/10 scale-[1.02]'
                                    : 'text-slate-500 dark:text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                                    }`}
                            >
                                Test Cases
                            </button>
                            <button
                                onClick={() => setActiveTab('solution')}
                                className={`px-8 py-2 rounded-xl text-xs font-bold tracking-tight transition-all ${activeTab === 'solution'
                                    ? 'bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-lg shadow-slate-200/50 dark:shadow-black/20 border border-slate-200/40 dark:border-white/10 scale-[1.02]'
                                    : 'text-slate-500 dark:text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                                    }`}
                            >
                                Default Solution
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 px-12 py-10 overflow-hidden flex flex-col">
                        <div className="flex-1 bg-white dark:bg-[#0a0a0b] rounded-[2.5rem] border border-slate-200/60 dark:border-white/10 shadow-2xl shadow-slate-200/40 dark:shadow-black/30 overflow-hidden flex flex-col transition-colors">
                            {activeTab === 'description' && (
                                <>
                                    <div className="h-12 border-b border-slate-100 dark:border-white/10 bg-slate-50/30 dark:bg-white/5 px-8 flex items-center justify-between transition-colors">
                                        <div className="flex items-center gap-3">
                                            <FileText size={14} className="text-slate-400 dark:text-slate-500 transition-colors" />
                                            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] transition-colors">Markdown Pro Editor</span>
                                        </div>
                                        <div className="flex gap-4">
                                            {['bold', 'italic', 'code', 'image', 'link'].map(tool => (
                                                <button key={tool} className="text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors uppercase text-[9px] font-black">{tool}</button>
                                            ))}
                                        </div>
                                    </div>
                                    <textarea
                                        value={problem.description}
                                        onChange={e => setProblem({ ...problem, description: e.target.value })}
                                        className="flex-1 p-10 font-mono text-sm leading-relaxed focus:outline-none resize-none bg-transparent placeholder:text-slate-200 dark:placeholder:text-slate-800 text-slate-900 dark:text-white transition-colors"
                                        placeholder="## Problem Title
                                        
Describe the problem here using Markdown...

### Example 1:
Input: x = 1
Output: 2"
                                    />
                                </>
                            )}

                            {activeTab === 'testcases' && (
                                <div className="flex-1 p-10 space-y-6 overflow-y-auto">
                                    {problem.testCases.map((tc, i) => (
                                        <div key={i} className="bg-slate-50/50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[2rem] p-8 space-y-6 relative group transition-colors">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] font-black text-amber-600 dark:text-amber-500 uppercase tracking-widest bg-amber-50 dark:bg-amber-500/10 px-3 py-1 rounded-full border border-amber-100 dark:border-amber-500/20 transition-colors">Case {i + 1}</span>
                                                <button
                                                    onClick={() => {
                                                        const testCases = problem.testCases.filter((_, index) => index !== i);
                                                        setProblem({ ...problem, testCases });
                                                    }}
                                                    className="p-1.5 text-slate-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                                                >
                                                    <X size={16} />
                                                </button>
                                            </div>
                                            <div className="grid grid-cols-2 gap-6">
                                                <div className="space-y-3">
                                                    <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-2 transition-colors">Input Data</label>
                                                    <textarea
                                                        value={tc.input}
                                                        onChange={e => {
                                                            const testCases = [...problem.testCases];
                                                            testCases[i].input = e.target.value;
                                                            setProblem({ ...problem, testCases });
                                                        }}
                                                        className="w-full bg-white dark:bg-[#0a0a0b] border border-slate-200 dark:border-white/10 rounded-2xl p-4 text-xs font-mono focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none h-24 text-slate-900 dark:text-white transition-all"
                                                    />
                                                </div>
                                                <div className="space-y-3">
                                                    <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-2 transition-colors">Expected Output</label>
                                                    <textarea
                                                        value={tc.expected_output}
                                                        onChange={e => {
                                                            const testCases = [...problem.testCases];
                                                            testCases[i].expected_output = e.target.value;
                                                            setProblem({ ...problem, testCases });
                                                        }}
                                                        className="w-full bg-white dark:bg-[#0a0a0b] border border-slate-200 dark:border-white/10 rounded-2xl p-4 text-xs font-mono focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none h-24 text-slate-900 dark:text-white transition-all"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    <button
                                        onClick={() => setProblem({ ...problem, testCases: [...problem.testCases, { input: "", expected_output: "", is_hidden: false }] })}
                                        className="w-full py-6 border-2 border-dashed border-slate-200 dark:border-white/10 rounded-[2rem] text-slate-400 dark:text-slate-600 font-bold text-sm hover:border-amber-500 dark:hover:border-amber-500/50 hover:text-amber-500 dark:hover:text-amber-400 hover:bg-amber-50/20 dark:hover:bg-amber-500/5 transition-all flex items-center justify-center gap-2"
                                    >
                                        <Plus size={18} /> Add Another Test Case
                                    </button>
                                </div>
                            )}

                            {activeTab === 'solution' && (
                                <>
                                    <div className="h-12 border-b border-slate-100 dark:border-white/10 bg-slate-50/30 dark:bg-white/5 px-8 flex items-center justify-between transition-colors">
                                        <div className="flex items-center gap-3">
                                            <Terminal size={14} className="text-amber-500 transition-colors" />
                                            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] transition-colors">Reference Implementation</span>
                                        </div>
                                    </div>
                                    <textarea
                                        value={problem.default_solution}
                                        onChange={e => setProblem({ ...problem, default_solution: e.target.value })}
                                        className="flex-1 p-10 font-mono text-sm leading-relaxed focus:outline-none resize-none bg-transparent placeholder:text-slate-200 dark:placeholder:text-slate-800 text-slate-900 dark:text-white transition-colors"
                                        placeholder="// Enter the reference solution here...
// This will be shown to students after they solve the problem or used for debugging.
"
                                    />
                                </>
                            )}
                        </div>
                    </div>

                    {/* Bottom Floating Bar */}
                    <div className="absolute bottom-10 right-10 flex items-center gap-4 bg-white/60 dark:bg-[#0a0a0b]/60 backdrop-blur-md p-2 rounded-full border border-slate-200/60 dark:border-white/10 shadow-xl transition-colors">
                        <button className="h-12 px-8 rounded-full text-slate-500 dark:text-slate-400 font-bold text-sm hover:bg-slate-100 dark:hover:bg-white/5 transition-all flex items-center gap-2">
                            <Eye size={18} />
                            Preview
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="h-12 px-10 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-sm flex items-center gap-2 hover:bg-black dark:hover:bg-slate-100 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg disabled:opacity-50"
                        >
                            {saving ? "Publishing..." : "Publish Problem"}
                            <Terminal size={18} className="text-amber-500" />
                        </button>
                    </div>
                </section>
            </main>
        </div>
    );
}
