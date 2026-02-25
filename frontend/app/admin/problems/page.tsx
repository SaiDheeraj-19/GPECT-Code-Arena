"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "../../../lib/api";
import { Search, Loader2, Plus, Code2, X, Trash2, CheckCircle2 } from "lucide-react";

interface TestCase {
    input: string;
    expected_output: string;
    is_hidden: boolean;
}

interface Problem {
    id: string;
    title: string;
    description: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    tags: string[];
    testCases: TestCase[];
}

interface NewProblemFormState {
    title: string;
    description: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    tags: string; // This is a comma-separated string in the form
    testCases: TestCase[];
}

export default function AdminProblems() {
    const router = useRouter();
    const [problems, setProblems] = useState<Problem[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [saving, setSaving] = useState(false);

    // Problem state initialization logic follows...
    const [newProblem, setNewProblem] = useState<NewProblemFormState>({
        title: "",
        description: "",
        difficulty: "Easy",
        tags: "",
        testCases: [{ input: "", expected_output: "", is_hidden: false }]
    });

    useEffect(() => {
        fetchProblems();
    }, []);

    const fetchProblems = async () => {
        try {
            const { data } = await api.get('/problems');
            setProblems(data);
        } catch (error) {
            console.error("Failed to fetch problems:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateProblem = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setSaving(true);
            const payload = {
                ...newProblem,
                tags: newProblem.tags.split(',').map(t => t.trim()).filter(Boolean)
            };
            await api.post('/admin/problems', payload);
            setShowModal(false);
            setNewProblem({
                title: "",
                description: "",
                difficulty: "Easy",
                tags: "",
                testCases: [{ input: "", expected_output: "", is_hidden: false }]
            });
            fetchProblems();
        } catch (error) {
            console.error("Failed to create problem:", error);
            alert("Failed to create problem. Check console for details.");
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteProblem = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this problem?")) return;
        try {
            await api.delete(`/admin/problems/${id}`);
            fetchProblems();
        } catch (error) {
            console.error("Failed to delete problem:", error);
            alert("Failed to delete problem.");
        }
    };

    const addTestCase = () => {
        setNewProblem({
            ...newProblem,
            testCases: [...newProblem.testCases, { input: "", expected_output: "", is_hidden: false }]
        });
    };

    const removeTestCase = (index: number) => {
        const updated = newProblem.testCases.filter((_, i) => i !== index);
        setNewProblem({ ...newProblem, testCases: updated });
    };

    const updateTestCase = (index: number, field: keyof TestCase, value: string | boolean) => {
        const updated = newProblem.testCases.map((tc, i) =>
            i === index ? { ...tc, [field]: value } : tc
        );
        setNewProblem({ ...newProblem, testCases: updated });
    };

    if (loading) {
        return (
            <div className="flex h-[calc(100vh-theme(spacing.16))] items-center justify-center bg-[#FDFDFD] dark:bg-[#0a0a0b] transition-colors duration-500">
                <Loader2 className="h-8 w-8 animate-spin text-slate-400 dark:text-slate-500" />
            </div>
        );
    }

    return (
        <div className="p-8 max-w-7xl mx-auto w-full space-y-8 relative bg-[#FDFDFD] dark:bg-[#0a0a0b] font-sans text-slate-900 dark:text-slate-100 transition-colors duration-500 min-h-screen">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 transition-colors">Problem Management</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 transition-colors">Create, edit, and organize coding challenges.</p>
                </div>

                <div className="flex items-center gap-4 w-full sm:w-auto">
                    <div className="relative w-full max-w-xs">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={18} />
                        <input
                            type="text"
                            placeholder="Search problems..."
                            className="w-full bg-white dark:bg-[#0a0a0b]/80 border border-slate-200 dark:border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary dark:text-white transition-all backdrop-blur-md"
                        />
                    </div>
                    <button
                        onClick={() => router.push('/admin/problems/create')}
                        className="bg-primary hover:bg-primary/90 text-background-dark px-4 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all shrink-0 shadow-lg shadow-primary/20 active:scale-95"
                    >
                        <Plus size={16} />
                        Create Problem
                    </button>
                </div>
            </div>

            {/* Problems Table */}
            <div className="bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-2xl shadow-sm overflow-hidden transition-colors">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 dark:bg-white/5 text-xs text-slate-500 dark:text-slate-400 uppercase font-bold border-b border-slate-100 dark:border-white/10 transition-colors">
                        <tr>
                            <th className="py-4 px-6 w-1/2">Problem Title</th>
                            <th className="py-4 px-6">Difficulty</th>
                            <th className="py-4 px-6 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-white/5 transition-colors">
                        {problems.map((prob: Problem) => (
                            <tr key={prob.id} className="hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors">
                                <td className="py-4 px-6">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 transition-colors">
                                            <Code2 size={16} />
                                        </div>
                                        <div>
                                            <span className="font-bold text-slate-900 dark:text-slate-100 block transition-colors">{prob.title}</span>
                                            {prob.tags && prob.tags.length > 0 && (
                                                <div className="flex gap-1 mt-1">
                                                    {prob.tags.map((tag: string) => (
                                                        <span key={tag} className="text-[10px] bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded uppercase tracking-widest transition-colors">{tag}</span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </td>
                                <td className="py-4 px-6">
                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border transition-colors ${prob.difficulty === 'Easy' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20' :
                                        prob.difficulty === 'Hard' ? 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-100 dark:border-red-500/20' :
                                            'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-500/20'
                                        }`}>
                                        {prob.difficulty}
                                    </span>
                                </td>
                                <td className="py-4 px-6 text-right space-x-2 flex justify-end items-center">
                                    <button
                                        onClick={() => router.push(`/admin/problems/edit?id=${prob.id}`)}
                                        className="text-xs font-bold text-primary hover:text-primary/80 bg-primary/10 px-3 py-1.5 rounded-lg transition-colors"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleDeleteProblem(prob.id)}
                                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {problems.length === 0 && (
                            <tr>
                                <td colSpan={3} className="py-12 text-center text-slate-500 dark:text-slate-400 transition-colors">
                                    No problems created yet.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Create Problem Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-slate-900/40 dark:bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 overflow-y-auto transition-colors">
                    <div className="bg-white dark:bg-[#0a0a0b] border border-white/5 rounded-[2rem] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto transition-colors">
                        <div className="p-8 border-b border-slate-100 dark:border-white/10 flex justify-between items-center sticky top-0 bg-white dark:bg-[#0a0a0b]/90 backdrop-blur-md z-10 transition-colors">
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white transition-colors">Create New Challenge</h2>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 transition-colors">Define problem requirements and test validation.</p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-full transition-colors">
                                <X size={24} className="text-slate-400 dark:text-slate-500" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateProblem} className="p-8 space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1 transition-colors">Problem Title</label>
                                        <input
                                            required
                                            type="text"
                                            value={newProblem.title}
                                            onChange={(e) => setNewProblem({ ...newProblem, title: e.target.value })}
                                            className="w-full bg-slate-50 dark:bg-white/5 border border-transparent dark:border-white/10 rounded-2xl px-5 py-4 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 dark:focus:ring-primary/20 transition-all outline-none"
                                            placeholder="e.g. Binary Search implementation"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1 transition-colors">Difficulty</label>
                                            <select
                                                value={newProblem.difficulty}
                                                onChange={(e) => setNewProblem({ ...newProblem, difficulty: e.target.value as 'Easy' | 'Medium' | 'Hard' })}
                                                className="w-full bg-slate-50 dark:bg-white/5 border border-transparent dark:border-white/10 rounded-2xl px-5 py-4 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 transition-all outline-none appearance-none"
                                            >
                                                <option value="Easy" className="bg-white dark:bg-[#0a0a0b] text-slate-900 dark:text-white">Easy</option>
                                                <option value="Medium" className="bg-white dark:bg-[#0a0a0b] text-slate-900 dark:text-white">Medium</option>
                                                <option value="Hard" className="bg-white dark:bg-[#0a0a0b] text-slate-900 dark:text-white">Hard</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1 transition-colors">Tags (comma separated)</label>
                                            <input
                                                type="text"
                                                value={newProblem.tags}
                                                onChange={(e) => setNewProblem({ ...newProblem, tags: e.target.value })}
                                                className="w-full bg-slate-50 dark:bg-white/5 border border-transparent dark:border-white/10 rounded-2xl px-5 py-4 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                                                placeholder="array, search, basic"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1 transition-colors">Description (Markdown supported)</label>
                                        <textarea
                                            required
                                            rows={8}
                                            value={newProblem.description}
                                            onChange={(e) => setNewProblem({ ...newProblem, description: e.target.value })}
                                            className="w-full bg-slate-50 dark:bg-white/5 border border-transparent dark:border-white/10 rounded-2xl px-5 py-4 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 transition-all outline-none resize-none"
                                            placeholder="Describe the problem, constraints, and requirements..."
                                        ></textarea>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="flex justify-between items-center ml-1">
                                        <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest transition-colors">Test Cases</label>
                                        <button
                                            type="button"
                                            onClick={addTestCase}
                                            className="text-[10px] font-bold text-primary uppercase tracking-widest hover:text-primary/80 underline underline-offset-4 transition-colors"
                                        >
                                            + Add Case
                                        </button>
                                    </div>

                                    <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                                        {newProblem.testCases.map((tc, index) => (
                                            <div key={index} className="p-6 bg-slate-50 dark:bg-white/5 rounded-3xl border border-slate-100 dark:border-white/10 space-y-4 relative group transition-colors">
                                                <button
                                                    type="button"
                                                    onClick={() => removeTestCase(index)}
                                                    className="absolute top-4 right-4 text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                                                >
                                                    <Trash2 size={16} />
                                                </button>

                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1 transition-colors">Input</label>
                                                    <textarea
                                                        required
                                                        value={tc.input}
                                                        onChange={(e) => updateTestCase(index, 'input', e.target.value)}
                                                        className="w-full bg-white dark:bg-[#0a0a0b] border-slate-100 dark:border-white/10 text-slate-900 dark:text-slate-200 rounded-xl px-4 py-3 text-xs font-mono focus:ring-1 focus:ring-primary/20 outline-none resize-none transition-colors border"
                                                        rows={2}
                                                    ></textarea>
                                                </div>

                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1 transition-colors">Expected Output</label>
                                                    <textarea
                                                        required
                                                        value={tc.expected_output}
                                                        onChange={(e) => updateTestCase(index, 'expected_output', e.target.value)}
                                                        className="w-full bg-white dark:bg-[#0a0a0b] border-slate-100 dark:border-white/10 text-slate-900 dark:text-slate-200 rounded-xl px-4 py-3 text-xs font-mono focus:ring-1 focus:ring-primary/20 outline-none resize-none transition-colors border"
                                                        rows={2}
                                                    ></textarea>
                                                </div>

                                                <div className="flex items-center gap-2 ml-1">
                                                    <input
                                                        type="checkbox"
                                                        id={`hidden-${index}`}
                                                        checked={tc.is_hidden}
                                                        onChange={(e) => updateTestCase(index, 'is_hidden', e.target.checked)}
                                                        className="rounded border-slate-300 dark:border-white/10 dark:bg-white/5 text-primary focus:ring-primary/20 transition-colors"
                                                    />
                                                    <label htmlFor={`hidden-${index}`} className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase cursor-pointer transition-colors">Hidden Case</label>
                                                </div>
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
                                    disabled={saving}
                                    className="bg-primary text-background-dark px-10 py-4 rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-primary/20 active:scale-95 transition-all flex items-center gap-3 disabled:opacity-50 hover:opacity-90"
                                >
                                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 size={16} />}
                                    Deploy Challenge
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
