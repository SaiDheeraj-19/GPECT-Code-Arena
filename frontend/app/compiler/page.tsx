"use client";

import { motion } from "framer-motion";
import { Server, Code, Zap } from "lucide-react";
import { Navbar } from "../../components/Navbar";
import { Footer } from "../../components/Footer";

export default function CompilerHubPage() {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0b] text-slate-900 dark:text-slate-100 font-display selection:bg-primary selection:text-white dark:selection:text-background-dark transition-colors duration-500 overflow-x-hidden p-0 m-0 w-full relative">
            <div className="absolute top-0 inset-x-0 h-[400px] bg-gradient-to-b from-primary/10 dark:from-primary/5 to-transparent pointer-events-none" />
            <Navbar />

            <main className="pt-40 pb-20 px-6 max-w-6xl mx-auto relative z-10 min-h-[70vh]">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-16 border-b border-slate-200 dark:border-white/5 pb-10"
                >
                    <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 text-slate-900 dark:text-white">Compiler Hub Sandbox</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-lg max-w-2xl mx-auto mb-8">
                        The raw turbo compiler. Directly execute your logic in 25+ environments without competitive constraints. Perfect for scratchpad work.
                    </p>
                </motion.div>

                {/* Mock Compiler Area */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full h-[500px] bg-[#1e1e1e] rounded-3xl overflow-hidden border border-slate-200 dark:border-white/10 shadow-2xl dark:shadow-none flex flex-col group relative"
                >
                    <div className="h-12 bg-slate-200 dark:bg-[#252526] border-b border-slate-300 dark:border-[#333333] flex items-center justify-between px-4 shrink-0">
                        <div className="flex items-center gap-2">
                            <Code size={16} className="text-primary" />
                            <span className="text-xs text-slate-800 dark:text-slate-300 font-medium">main.cpp</span>
                        </div>
                        <div className="flex gap-2">
                            <button className="px-4 py-1.5 text-xs font-bold bg-primary text-white dark:text-background-dark rounded hover:opacity-90 flex items-center gap-2">
                                <Zap size={14} /> Run
                            </button>
                        </div>
                    </div>
                    <div className="flex-1 p-6 font-mono text-sm overflow-hidden text-slate-300 relative">
                        <Server className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-32 text-white/5 pointer-events-none" />
                        <span className="text-pink-400">#include</span> <span className="text-orange-300">&lt;iostream&gt;</span><br />
                        <span className="text-pink-400">using namespace</span> std;<br /><br />
                        <span className="text-blue-400">int</span> <span className="text-yellow-200">main</span>() {"{"}<br />
                        &nbsp;&nbsp;&nbsp;&nbsp;cout <span className="text-pink-400">&lt;&lt;</span> <span className="text-orange-300">&quot;Welcome to the CodeArena Sandbox.\n&quot;</span>;<br />
                        &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-pink-400">return</span> <span className="text-green-400">0</span>;<br />
                        {"}"}
                    </div>
                </motion.div>
            </main>

            <Footer />
        </div>
    );
}
