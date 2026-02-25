/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import api from "../../lib/api";
import { useAuthStore } from "../../store/auth";
import { ShieldCheck, AlertCircle, Eye, EyeOff } from "lucide-react";

export default function ResetPasswordPage() {
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const router = useRouter();
    const user = useAuthStore((state) => state.user);
    const setAuth = useAuthStore((state) => state.login);

    useEffect(() => {
        // If no user or doesn't need to change password, redirect away
        if (!user) {
            router.push('/');
        } else if (!user.must_change_password) {
            router.push(user.role === 'ADMIN' ? '/admin/dashboard' : '/problems');
        }
    }, [user, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (newPassword !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        setLoading(true);

        try {
            const { data } = await api.post('/auth/reset-password', { newPassword });
            setAuth(data.token, data.user);
            router.push('/problems');
        } catch (err: any) {
            setError(err.response?.data?.error || "Error resetting password.");
        } finally {
            setLoading(false);
        }
    };

    // Prevent rendering flash
    if (!user || (!user.must_change_password && user)) return null;

    return (
        <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4 relative overflow-hidden font-sans">
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-primary/10 blur-[150px]" />
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-[420px] z-10 glassmorphism p-10 rounded-3xl shadow-2xl relative border border-white/10 bg-white/5 backdrop-blur-xl"
            >
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-primary/20 shadow-[0_0_20px_rgba(34,197,94,0.15)]">
                        <ShieldCheck className="text-primary" size={28} />
                    </div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">Setup Secure Password</h1>
                    <p className="text-sm text-gray-400 mt-2 leading-relaxed">
                        Welcome to Code Arena! <br /> Please change your default password to continue.
                    </p>
                </div>

                <AnimatePresence>
                    {error && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="mb-6 overflow-hidden">
                            <div className="bg-destructive/10 border border-destructive/20 text-red-400 p-3 rounded-xl text-sm flex items-start gap-3">
                                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                                <p>{error}</p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1.5 text-gray-300">New Password</label>
                        <div className="relative group/input">
                            <input
                                type={showPassword ? "text" : "password"}
                                required
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full bg-[#1e293b]/50 border border-white/5 rounded-xl px-4 py-3.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-gray-600 pr-12"
                                placeholder="Strong Password"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-white transition-colors"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                        <p className="text-[10px] text-gray-500 mt-2 leading-tight">Must contain 1 uppercase, 1 lowercase, 1 number, and 1 special character (@$!%*?&). Min length 8.</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1.5 text-gray-300">Confirm Password</label>
                        <div className="relative group/input">
                            <input
                                type={showPassword ? "text" : "password"}
                                required
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full bg-[#1e293b]/50 border border-white/5 rounded-xl px-4 py-3.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-gray-600 pr-12"
                                placeholder="Confirm Password"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-primary hover:bg-primary/90 text-[#0f172a] font-bold py-3.5 px-4 rounded-xl transition-all active:scale-[0.98] mt-6 shadow-[0_4px_14px_0_rgba(34,197,94,0.39)] disabled:opacity-70"
                    >
                        {loading ? "Updating..." : "Save and Continue"}
                    </button>
                </form>
            </motion.div>
        </div>
    );
}
