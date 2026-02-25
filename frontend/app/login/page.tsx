/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { ThemeToggle } from "../../components/ThemeToggle";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import api from "../../lib/api";
import { useAuthStore } from "../../store/auth";
import { jwtDecode } from "jwt-decode";
import { Lock, AtSign, Eye, EyeOff, ShieldCheck, ArrowRight, Code2, AlertCircle, ArrowLeft } from "lucide-react";

export default function LoginPage() {
    const [identifier, setIdentifier] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const router = useRouter();
    const setAuth = useAuthStore((state) => state.login);
    const initializeAuth = useAuthStore((state) => state.initialize);

    useEffect(() => {
        initializeAuth();
        const user = useAuthStore.getState().user;
        if (user) {
            if (user.must_change_password) router.push('/reset-password');
            else if (user.role === 'ADMIN') router.push('/admin/dashboard');
            else router.push('/profile');
        }
    }, [router, initializeAuth]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const { data } = await api.post('/auth/login', { identifier, password });
            const decoded: any = jwtDecode(data.token);
            setAuth(data.token, {
                id: decoded.id,
                email: decoded.email,
                roll_number: decoded.roll_number,
                role: decoded.role,
                must_change_password: decoded.must_change_password,
                is_profile_complete: decoded.is_profile_complete
            });

            if (decoded.must_change_password) {
                router.push('/reset-password');
            } else if (decoded.role === 'ADMIN') {
                router.push('/admin/dashboard');
            } else {
                router.push('/profile');
            }
        } catch (err: any) {
            setError(err.response?.data?.error || "Connection error. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative min-h-screen overflow-x-hidden dark:mesh-gradient text-slate-900 dark:text-slate-100 selection:bg-primary selection:text-background-dark font-display flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-[#0a0a0b] transition-colors duration-500">

            {/* Top Navigation */}
            <div className="absolute top-6 right-6 z-50 flex items-center gap-4">
                <button
                    onClick={() => router.push('/')}
                    className="text-sm font-bold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors flex items-center gap-2"
                >
                    <ArrowLeft size={16} /> Back to Home
                </button>
                <ThemeToggle />
            </div>

            {/* Login Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="z-10 w-full max-w-[440px] mt-10"
            >
                <div className="mb-8 text-center flex flex-col items-center">
                    <div className="size-12 mb-6 bg-primary rounded-2xl flex items-center justify-center text-background-dark shadow-xl shadow-primary/20">
                        <Code2 size={28} strokeWidth={2.5} />
                    </div>
                    <h1 className="text-4xl font-bold tracking-tighter text-slate-900 dark:text-white mb-2 hero-text-glow leading-[1.1]">
                        Welcome <span className="text-transparent bg-clip-text bg-gradient-to-b from-slate-600 dark:from-white via-primary/80 to-primary">Back.</span>
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">Authenticate to access your secure workspace.</p>
                </div>

                <div className="glass-card rounded-3xl p-10 sm:p-12 relative overflow-hidden shadow-2xl bg-white/70 dark:bg-white/5 border border-slate-200/60 dark:border-white/5">
                    <AnimatePresence mode="wait">
                        {error && (
                            <motion.div
                                initial={{ height: 0, opacity: 0, y: -10 }}
                                animate={{ height: "auto", opacity: 1, y: 0 }}
                                exit={{ height: 0, opacity: 0, y: -10 }}
                                className="mb-8 overflow-hidden"
                            >
                                <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 p-4 rounded-xl text-[13px] flex items-center gap-3 font-medium">
                                    <AlertCircle size={18} className="shrink-0" />
                                    <p>{error}</p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                        <div className="space-y-2">
                            <label className="block text-[10px] font-bold tracking-widest text-slate-500 dark:text-slate-400 uppercase">Identity</label>
                            <div className="relative group/input">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none group-focus-within/input:text-primary text-slate-400 dark:text-slate-500 transition-colors">
                                    <AtSign size={18} />
                                </div>
                                <input
                                    type="text"
                                    required
                                    placeholder="Roll Number or Email"
                                    value={identifier}
                                    onChange={(e) => setIdentifier(e.target.value)}
                                    className="w-full bg-slate-100/50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary focus:bg-white dark:focus:bg-white/10 transition-all shadow-inner dark:shadow-none placeholder:text-slate-400 dark:placeholder:text-slate-500 font-mono"
                                />
                            </div>
                        </div>

                        <AnimatePresence>
                            {(identifier.includes('@') || identifier === '') && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="space-y-2 overflow-hidden"
                                >
                                    <label className="block text-[10px] font-bold tracking-widest text-slate-500 dark:text-slate-400 uppercase">Passkey</label>
                                    <div className="relative group/input">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none group-focus-within/input:text-primary text-slate-400 dark:text-slate-500 transition-colors">
                                            <Lock size={18} />
                                        </div>
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            required={identifier.includes('@')}
                                            placeholder="••••••••"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full bg-slate-100/50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl pl-12 pr-12 py-3.5 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary focus:bg-white dark:focus:bg-white/10 transition-all shadow-inner dark:shadow-none placeholder:text-slate-400 dark:placeholder:text-slate-500 font-mono tracking-wider"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-white transition-colors"
                                        >
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="flex items-center justify-between !mt-4">
                            <label className="flex items-center gap-2 cursor-pointer group/check">
                                <div className="relative flex items-center">
                                    <input type="checkbox" className="peer w-4 h-4 rounded bg-slate-100 dark:bg-white/5 border-slate-300 dark:border-white/10 text-primary focus:ring-primary/50 focus:ring-offset-white dark:focus:ring-offset-background-dark focus:ring-offset-2 transition-all cursor-pointer" />
                                </div>
                                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 group-hover/check:text-slate-700 dark:group-hover/check:text-slate-300 transition-colors select-none">Stay logged in</span>
                            </label>

                            <a href="#" className="text-xs font-bold text-primary hover:text-primary/80 transition-colors">Reset Access?</a>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full h-12 mt-6 bg-primary text-background-dark text-sm font-bold rounded-xl shadow-lg shadow-primary/20 flex items-center justify-center gap-2 hover:opacity-90 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-background-dark/20 border-t-background-dark rounded-full animate-spin" />
                            ) : (
                                <>
                                    Command Workspace
                                    <ArrowRight size={16} strokeWidth={2.5} />
                                </>
                            )}
                        </button>
                    </form>

                    {/* Decorative abstract glow inside card */}
                    <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/20 rounded-full blur-3xl pointer-events-none"></div>
                </div>

                <div className="mt-8 text-center flex flex-col items-center gap-2">
                    <p className="text-[10px] text-slate-500 font-mono flex items-center gap-1.5 justify-center">
                        <ShieldCheck size={14} className="text-primary" /> End-to-End Encrypted Framework
                    </p>
                </div>
            </motion.div>
        </div>

    );
}
