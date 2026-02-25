"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useAuthStore } from "../store/auth";

export function OnboardingModal() {
    const { user, login } = useAuthStore();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: user?.name === 'Coder' ? '' : (user?.name || ''),
        year: "",
        semester: "",
        branch: "",
        section: ""
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/profile`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                const data = await res.json();
                login(data.user, data.token);
                // Page will automatically re-render and hide modal because user.is_profile_complete = true
                window.location.reload(); // Hard reload just to be sure states are fresh
            } else {
                alert("Failed to update profile details. Make sure all fields are filled.");
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="w-full max-w-[480px] bg-[#121212] border border-white/10 rounded-3xl p-8 shadow-[0_0_80px_rgba(245,158,11,0.15)] relative overflow-hidden"
            >
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-500/20 via-primary to-emerald-500/20"></div>

                <h2 className="text-2xl font-black text-white mb-2">Complete Your Profile</h2>
                <p className="text-slate-400 text-sm mb-6">Welcome to CodeArena! Please complete your academic profile to unlock the arena.</p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">Full Name</label>
                        <input
                            type="text"
                            name="name"
                            required
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="John Doe"
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">Year</label>
                            <select
                                name="year"
                                required
                                value={formData.year}
                                onChange={handleChange}
                                className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                            >
                                <option value="">Select</option>
                                <option value="1">1st Year</option>
                                <option value="2">2nd Year</option>
                                <option value="3">3rd Year</option>
                                <option value="4">4th Year</option>
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">Semester</label>
                            <select
                                name="semester"
                                required
                                value={formData.semester}
                                onChange={handleChange}
                                className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                            >
                                <option value="">Select</option>
                                <option value="1">1st Sem</option>
                                <option value="2">2nd Sem</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">Branch</label>
                            <select
                                name="branch"
                                required
                                value={formData.branch}
                                onChange={handleChange}
                                className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                            >
                                <option value="">Select</option>
                                <option value="CSE">CSE</option>
                                <option value="ECE">ECE</option>
                                <option value="EEE">EEE</option>
                                <option value="MECH">MECH</option>
                                <option value="CIVIL">CIVIL</option>
                                <option value="AI">AI</option>
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">Section</label>
                            <input
                                type="text"
                                name="section"
                                required
                                placeholder="e.g. A"
                                value={formData.section}
                                onChange={handleChange}
                                className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all uppercase"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full h-12 mt-4 bg-primary text-background-dark text-sm font-bold rounded-xl shadow-lg shadow-primary/20 hover:opacity-90 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center"
                    >
                        {loading ? "Saving..." : "Save & Unlock Arena"}
                    </button>
                </form>
            </motion.div>
        </div>
    );
}
