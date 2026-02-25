"use client";

import { motion } from "framer-motion";
import { Clock, Users } from "lucide-react";
import { Navbar } from "../../components/Navbar";
import { Footer } from "../../components/Footer";

export default function CompetitionsPage() {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0b] text-slate-900 dark:text-slate-100 font-display selection:bg-primary selection:text-white dark:selection:text-background-dark transition-colors duration-500 overflow-x-hidden">
            <div className="absolute top-0 inset-x-0 h-[400px] bg-gradient-to-b from-primary/10 dark:from-primary/5 to-transparent pointer-events-none" />
            <Navbar />

            <main className="pt-40 pb-20 px-6 max-w-6xl mx-auto relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-16 border-b border-slate-200 dark:border-white/5 pb-10"
                >
                    <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 text-slate-900 dark:text-white">Active Competitions</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-lg max-w-2xl mx-auto">
                        Global Arena matchups built for the best GPCET developers. Standings update in real-time.
                    </p>
                </motion.div>

                <div className="space-y-6 min-h-[40vh]">
                    {/* Placeholder Tournament */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white dark:bg-[#121212] p-8 rounded-3xl border border-slate-200 dark:border-white/5 shadow-xl shadow-slate-200/50 dark:shadow-none hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors"
                    >
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="px-3 py-1 bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-500 text-xs font-bold rounded-lg border border-red-200 dark:border-red-500/20">LIVE NOW</span>
                                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Weekly GPCET Qualifier #18</h2>
                                </div>
                                <p className="text-slate-500 dark:text-slate-400 text-sm">4 Algorithm Questions • Penalty rules apply</p>
                            </div>

                            <div className="flex flex-wrap items-center gap-6">
                                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                                    <Users size={18} />
                                    <span className="text-sm font-semibold">1,204 Enrolled</span>
                                </div>
                                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                                    <Clock size={18} />
                                    <span className="text-sm font-semibold">Ends in 2h 45m</span>
                                </div>
                                <button className="px-6 py-2 bg-primary text-white dark:text-background-dark font-bold rounded-full hover:opacity-90 transition-opacity">
                                    Enter Arena
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
