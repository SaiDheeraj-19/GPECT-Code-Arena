"use client";

import { motion } from "framer-motion";
import { Navbar } from "../../components/Navbar";
import { Footer } from "../../components/Footer";
import { ShieldAlert } from "lucide-react";

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0b] text-slate-900 dark:text-slate-100 font-display selection:bg-primary selection:text-white dark:selection:text-background-dark transition-colors duration-500 overflow-x-hidden">
            <Navbar />

            <main className="pt-40 pb-20 px-6 max-w-4xl mx-auto relative z-10 min-h-[70vh]">
                <div className="flex items-center gap-3 mb-6 border-b border-slate-200 dark:border-white/5 pb-10">
                    <ShieldAlert size={36} className="text-primary hidden md:block" />
                    <div>
                        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white">Privacy Policy</h1>
                        <p className="text-slate-500 dark:text-slate-400 text-lg mt-2">
                            Strict data custody rules applied across GPCET CodeArena.
                        </p>
                    </div>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="prose dark:prose-invert prose-slate max-w-none text-slate-600 dark:text-slate-400"
                >
                    <p className="mb-4 text-sm leading-relaxed">
                        Last Updated: September 2024
                    </p>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-8 mb-4">1. Telemetry & Sandbox Execution</h3>
                    <p className="mb-4 text-sm leading-relaxed">
                        Every piece of code executed is temporarily stored exclusively for compilation inside secure, isolated Docker containers. Code payloads are dropped post-execution unless submitted against a challenge, where it enters our permanent evaluation ledger attached to your GPCET Roll Number.
                    </p>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-8 mb-4">2. Anti-Cheat Monitoring</h3>
                    <p className="mb-4 text-sm leading-relaxed">
                        During active Proctored Contests, we capture browser viewport focus state, copy/paste buffer hashes, and key-press event cadences. This ensures absolute integrity. These heuristics are retained only for the duration of the tournament audit window.
                    </p>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-8 mb-4">3. Data Residency</h3>
                    <p className="mb-4 text-sm leading-relaxed">
                        Your data never leaves the GPCET localized AWS region. We do not sell, rent, or vend profiling metrics to third parties. Rankings and algorithmic ratings are exclusively displayed internally within the campus network or associated domains.
                    </p>
                </motion.div>
            </main>

            <Footer />
        </div>
    );
}
