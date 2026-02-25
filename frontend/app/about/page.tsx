"use client";

import { motion } from "framer-motion";
import { Navbar } from "../../components/Navbar";
import { Footer } from "../../components/Footer";

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0b] text-slate-900 dark:text-slate-100 font-display selection:bg-primary selection:text-white dark:selection:text-background-dark transition-colors duration-500 overflow-x-hidden">
            <Navbar />

            <main className="pt-40 pb-20 px-6 max-w-5xl mx-auto relative z-10 min-h-[70vh]">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-16 border-b border-slate-200 dark:border-white/5 pb-10"
                >
                    <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 text-slate-900 dark:text-white">About GPCET</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-lg">
                        G Pullaiah College of Engineering and Technology (GPCET) - Nurturing the next generation of top-tier software engineers.
                    </p>
                </motion.div>

                <div className="grid md:grid-cols-2 gap-12">
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
                        <h2 className="text-2xl font-bold mb-4 text-slate-900 dark:text-white">Our Mission</h2>
                        <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-6">
                            CodeArena was forged internally to transform the standard academic curriculum into a globally competitive training ground. We believe that mastery of algorithms and data structures is the undisputed core of elite software engineering.
                        </p>
                        <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                            Through continuous challenges, highly performant compiler infrastructure, and rigorous campus-wide standings, GPCET guarantees its students are continuously pushed beyond industrial requirements.
                        </p>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="bg-white dark:bg-[#121212] p-8 rounded-3xl border border-slate-200 dark:border-white/5 shadow-xl dark:shadow-none">
                        <div className="size-16 mb-6 bg-primary/20 dark:bg-white/10 rounded-2xl flex items-center justify-center">
                            <span className="text-2xl font-black text-primary dark:text-white">{'< />'}</span>
                        </div>
                        <h3 className="font-bold text-slate-900 dark:text-white mb-2">Designed by Developers, For Developers</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                            Every single line of this platform has been designed exactly to the specifications of modern tech expectations. No visual noise. No latency. Just you, your keyboard, and the machine.
                        </p>
                    </motion.div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
