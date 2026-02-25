"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Zap, Trophy, ShieldCheck, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";

export default function LandingPage() {
    const router = useRouter();
    const [animationKey, setAnimationKey] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setAnimationKey(prev => prev + 1);
        }, 4000); // Replay timelapse loop every 4 seconds
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0b] text-slate-900 dark:text-slate-100 font-display selection:bg-primary selection:text-white dark:selection:text-background-dark overflow-x-hidden transition-colors duration-500">

            {/* Mesh gradient backgrounds matching the image style */}
            <div className="absolute top-0 inset-x-0 h-[600px] bg-gradient-to-br from-primary/20 dark:from-primary/10 via-transparent to-transparent opacity-50 blur-3xl pointer-events-none" />
            <div className="absolute -top-[30vh] -left-[20vw] w-[60vw] h-[60vh] bg-primary/10 dark:bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

            {/* Navigation Bar */}
            <Navbar />

            {/* Hero Section */}
            <section className="pt-40 pb-20 px-6 flex flex-col items-center justify-center text-center relative z-10 max-w-4xl mx-auto">
                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-6xl md:text-[5rem] font-extrabold tracking-tighter leading-[1] mb-6 text-slate-900 dark:text-white"
                >
                    Code. Create.<br className="hidden md:block" />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-amber-500">Command.</span>
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-slate-500 dark:text-slate-400 text-lg md:text-xl max-w-2xl mx-auto font-medium mb-10 leading-relaxed"
                >
                    The ultimate arena for GPCET engineers to master the craft of software with precision-engineered tools and elite competition.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto"
                >
                    <button
                        onClick={() => router.push('/login')}
                        className="w-full sm:w-auto px-8 py-4 bg-primary text-white dark:text-background-dark font-bold rounded-full shadow-lg shadow-primary/20 hover:opacity-90 transition-all flex items-center justify-center gap-2 group"
                    >
                        Get Started
                        <ArrowRight size={18} strokeWidth={2.5} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                    <button
                        onClick={() => router.push('/leaderboard')}
                        className="w-full sm:w-auto px-8 py-4 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/10 text-slate-900 dark:text-white font-bold rounded-full transition-all flex items-center justify-center shadow-sm dark:shadow-none"
                    >
                        View Ranking
                    </button>
                </motion.div>
            </section>

            {/* IDE Mockup Section */}
            <section id="challenges" className="px-6 py-10 max-w-6xl mx-auto relative z-10 w-full mb-32">
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.8 }}
                    className="relative w-full aspect-video rounded-3xl overflow-hidden border border-slate-200 dark:border-white/10 shadow-2xl dark:shadow-[0_0_50px_rgba(0,0,0,0.5)] bg-slate-100 dark:bg-[#0d0d0d] flex flex-col"
                >
                    {/* Mockup Toolbar */}
                    <div className="h-10 bg-slate-200 dark:bg-[#1a1a1a] border-b border-slate-300 dark:border-white/5 flex items-center px-4 gap-2 shrink-0">
                        <div className="size-3 rounded-full bg-red-500/80"></div>
                        <div className="size-3 rounded-full bg-amber-500/80"></div>
                        <div className="size-3 rounded-full bg-emerald-500/80"></div>
                    </div>
                    {/* Code Content Timelapse */}
                    <div className="p-8 flex-1 overflow-hidden relative pointer-events-none flex flex-col">
                        <pre key={animationKey} className="font-mono text-xs md:text-sm text-slate-700 dark:text-slate-300 flex flex-col gap-[2px] md:gap-1">
                            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
                                <span className="text-amber-600 dark:text-amber-400">class</span> <span className="text-blue-600 dark:text-blue-400">Solution</span>:
                            </motion.div>
                            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }} className="pl-4 md:pl-6 leading-relaxed">
                                <span className="text-amber-600 dark:text-amber-400">def</span> <span className="text-emerald-600 dark:text-emerald-400">twoSum</span>(self, nums: List[int], target: int) -{">"} List[int]:
                            </motion.div>
                            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.0 }} className="pl-8 md:pl-12 leading-relaxed">
                                prevMap = {"{}"} <span className="text-slate-400 dark:text-slate-500"># val : index</span>
                            </motion.div>
                            <div className="h-2 md:h-3"></div>
                            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.5 }} className="pl-8 md:pl-12 leading-relaxed">
                                <span className="text-amber-600 dark:text-amber-400">for</span> i, n <span className="text-primary">in</span> <span className="text-emerald-600 dark:text-emerald-400">enumerate</span>(nums):
                            </motion.div>
                            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 2.0 }} className="pl-12 md:pl-16 leading-relaxed">
                                diff = target - n
                            </motion.div>
                            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 2.5 }} className="pl-12 md:pl-16 leading-relaxed">
                                <span className="text-amber-600 dark:text-amber-400">if</span> diff <span className="text-primary">in</span> prevMap:
                            </motion.div>
                            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 3.0 }} className="pl-16 md:pl-20 leading-relaxed">
                                <span className="text-amber-600 dark:text-amber-400">return</span> [prevMap[diff], i]
                            </motion.div>
                            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 3.5 }} className="pl-12 md:pl-16 leading-relaxed">
                                prevMap[n] = i
                            </motion.div>
                            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 4.0 }} className="pl-8 md:pl-12 leading-relaxed">
                                <span className="text-amber-600 dark:text-amber-400">return</span> [] <span className="text-slate-400 dark:text-slate-500"># Base case guaranteed valid hit</span>
                            </motion.div>
                        </pre>
                    </div>
                </motion.div>
            </section>

            {/* Core Features Grid */}
            <section id="features" className="px-6 pb-32 max-w-6xl mx-auto z-10 relative">
                <div className="grid md:grid-cols-3 gap-6">

                    {/* Card 1 */}
                    <div className="p-8 rounded-[2rem] bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 shadow-xl shadow-slate-200/50 dark:shadow-none hover:bg-slate-50 dark:hover:bg-white/[0.05] dark:hover:border-white/10 transition-all hover:-translate-y-2">
                        <div className="size-12 bg-primary/10 dark:bg-white/5 rounded-2xl flex items-center justify-center mb-6 text-primary">
                            <Zap size={24} />
                        </div>
                        <h3 className="text-xl font-bold mb-3 text-slate-900 dark:text-white">Turbo Compiler</h3>
                        <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                            Zero-latency execution for 20+ languages. Test your logic against massive datasets in milliseconds.
                        </p>
                    </div>

                    {/* Card 2 */}
                    <div className="p-8 rounded-[2rem] bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 shadow-xl shadow-slate-200/50 dark:shadow-none hover:bg-slate-50 dark:hover:bg-white/[0.05] dark:hover:border-white/10 transition-all hover:-translate-y-2">
                        <div className="size-12 bg-primary/10 dark:bg-white/5 rounded-2xl flex items-center justify-center mb-6 text-primary">
                            <Trophy size={24} />
                        </div>
                        <h3 className="text-xl font-bold mb-3 text-slate-900 dark:text-white">Global Arena</h3>
                        <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                            Compete with the top 1% of GPCET developers. Real-time leaderboards and seasonal tournaments.
                        </p>
                    </div>

                    {/* Card 3 */}
                    <div className="p-8 rounded-[2rem] bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 shadow-xl shadow-slate-200/50 dark:shadow-none hover:bg-slate-50 dark:hover:bg-white/[0.05] dark:hover:border-white/10 transition-all hover:-translate-y-2">
                        <div className="size-12 bg-primary/10 dark:bg-white/5 rounded-2xl flex items-center justify-center mb-6 text-primary">
                            <ShieldCheck size={24} />
                        </div>
                        <h3 className="text-xl font-bold mb-3 text-slate-900 dark:text-white">Pro Sandbox</h3>
                        <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                            Encrypted workspace for your private projects and proprietary algorithms. Secure by design.
                        </p>
                    </div>

                </div>
            </section>

            {/* Bounded Info Block */}
            <section id="documentation" className="px-6 pb-32 max-w-6xl mx-auto relative z-10">
                <div className="rounded-[3rem] bg-white dark:bg-[#121212] border border-slate-200 dark:border-white/5 p-10 md:p-16 flex flex-col md:flex-row items-center gap-12 overflow-hidden relative shadow-2xl dark:shadow-none">
                    {/* Left text */}
                    <div className="flex-1">
                        <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-6 text-slate-900 dark:text-white">
                            Built for the next<br />generation of<br />engineers.
                        </h2>
                        <p className="text-slate-500 dark:text-slate-400 text-lg mb-10 max-w-md">
                            We&apos;ve stripped away the noise to give you a focused coding experience. Beautiful syntax, meaningful metrics, and a community of high-performers.
                        </p>
                    </div>

                    {/* Right decorative mock IDE */}
                    <div className="w-full md:w-[400px] shrink-0 rotate-3 border border-slate-200 dark:border-white/5 rounded-2xl overflow-hidden bg-slate-100 dark:bg-[#0a0a0b] shadow-2xl relative translate-x-4 md:translate-x-12 hover:rotate-0 transition-transform duration-500">
                        <div className="h-8 bg-slate-200 dark:bg-[#1a1a1a] flex items-center px-4 gap-1.5 border-b border-slate-300 dark:border-white/5">
                            <div className="size-2.5 rounded-full bg-red-500/80"></div>
                            <div className="size-2.5 rounded-full bg-amber-500/80"></div>
                            <div className="size-2.5 rounded-full bg-emerald-500/80"></div>
                        </div>
                        <div className="p-6 font-mono text-xs text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-[#0a0a0b] opacity-90 dark:opacity-80">
                            <span className="text-primary">class</span> GPCETEngineer {"{"}<br />
                            &nbsp;&nbsp;&nbsp;&nbsp;codeCenter() {"{"}<br />
                            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{/* Initialize */}<br />
                            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-primary">this</span>.skills = [<span className="text-amber-600 dark:text-amber-400">&apos;Code&apos;</span>, <span className="text-amber-600 dark:text-amber-400">&apos;Create&apos;</span>, <br />
                            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-amber-600 dark:text-amber-400">&apos;Command&apos;</span>];<br />
                            &nbsp;&nbsp;&nbsp;&nbsp;{"}"}<br />
                            <br />
                            &nbsp;&nbsp;&nbsp;&nbsp;masterCraft() {"{"}<br />
                            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-primary">return</span> <span className="text-amber-600 dark:text-amber-400">this</span>.arena.levelUp();<br />
                            &nbsp;&nbsp;&nbsp;&nbsp;{"}"}<br />
                            {"}"}
                        </div>
                    </div>
                </div>
            </section>

            {/* Universal Footer Component */}
            <Footer />

        </div>
    );
}
