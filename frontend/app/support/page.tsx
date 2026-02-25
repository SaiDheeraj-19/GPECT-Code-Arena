"use client";

import { motion } from "framer-motion";
import { Mail, MessageCircle, MapPin } from "lucide-react";
import { Navbar } from "../../components/Navbar";
import { Footer } from "../../components/Footer";

export default function SupportPage() {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0b] text-slate-900 dark:text-slate-100 font-display selection:bg-primary selection:text-white dark:selection:text-background-dark transition-colors duration-500 overflow-x-hidden">
            <Navbar />

            <main className="pt-40 pb-20 px-6 max-w-4xl mx-auto relative z-10 min-h-[70vh]">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-16 border-b border-slate-200 dark:border-white/5 pb-10"
                >
                    <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 text-slate-900 dark:text-white">Contact CodeArena</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-lg max-w-xl mx-auto">
                        Need an execution audit? Discovered a vulnerability in the platform? We&apos;re listening to all feedback.
                    </p>
                </motion.div>

                <div className="grid md:grid-cols-3 gap-6">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white dark:bg-[#121212] p-8 rounded-3xl border border-slate-200 dark:border-white/5 shadow-xl dark:shadow-none text-center">
                        <Mail className="mx-auto text-primary mb-4" size={32} />
                        <h3 className="font-bold text-slate-900 dark:text-white mb-2">Email Desk</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">admin@gpcet-codearena.com</p>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white dark:bg-[#121212] p-8 rounded-3xl border border-slate-200 dark:border-white/5 shadow-xl dark:shadow-none text-center">
                        <MessageCircle className="mx-auto text-amber-500 dark:text-amber-400 mb-4" size={32} />
                        <h3 className="font-bold text-slate-900 dark:text-white mb-2">Live Support</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">#support on Discord</p>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white dark:bg-[#121212] p-8 rounded-3xl border border-slate-200 dark:border-white/5 shadow-xl dark:shadow-none text-center">
                        <MapPin className="mx-auto text-emerald-500 dark:text-emerald-400 mb-4" size={32} />
                        <h3 className="font-bold text-slate-900 dark:text-white mb-2">IT Office</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">GPCET Main Block, Lab 4</p>
                    </motion.div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
