"use client";

import { motion } from "framer-motion";
import { BookOpen, Crosshair, Cpu, Zap, Star, ShieldCheck, Gamepad2, ChevronRight, Trophy } from "lucide-react";
import { Navbar } from "../../components/Navbar";
import { Footer } from "../../components/Footer";
import { useRouter } from "next/navigation";

export default function LearningPathsPage() {
    const router = useRouter();

    const paths = [
        {
            title: "NEO-MASTER",
            subtitle: "The Foundation",
            description: "Master Arrays, Strings, Hashmaps, and basic Logic. Built for first-year engineers.",
            icon: <BookOpen size={24} />,
            color: "text-blue-400",
            bg: "bg-blue-400/10",
            border: "border-blue-400/20",
            xp: 1500,
            status: "In Progress",
            progress: 25,
            difficulty: "Standard"
        },
        {
            title: "FAANG TARGET",
            subtitle: "The Interview Elite",
            description: "Graphs, Dynamic Programming, Tries, and system-level interview paradigms used by top-tier tech.",
            icon: <Crosshair size={24} />,
            color: "text-amber-500",
            bg: "bg-amber-500/10",
            border: "border-amber-500/20",
            xp: 4500,
            status: "Start Mission",
            progress: 0,
            difficulty: "High Rank"
        },
        {
            title: "ICPC CRUCIBLE",
            subtitle: "Mathematical War",
            description: "Segment Trees, Advanced Graph Theory, and combinatorial game logic. The ultimate test.",
            icon: <Cpu size={24} />,
            color: "text-rose-500",
            bg: "bg-rose-500/10",
            border: "border-rose-500/20",
            xp: 12000,
            status: "Locked",
            progress: 0,
            difficulty: "Legendary"
        }
    ];

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0b] text-slate-900 dark:text-slate-100 transition-colors duration-500 overflow-x-hidden">
            <Navbar />

            <main className="pt-40 pb-20 px-6 max-w-6xl mx-auto relative">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full -z-10" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-amber-500/5 blur-[120px] rounded-full -z-10" />

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-20"
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-200 dark:bg-white/5 border border-slate-300 dark:border-white/10 text-[10px] font-black uppercase tracking-widest mb-6">
                        <Gamepad2 size={12} className="text-primary" />
                        Career Development Quests
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-4 text-slate-900 dark:text-white leading-[0.9]">
                        CHOOSE YOUR <span className="text-primary">PATH.</span>
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 text-lg max-w-2xl mx-auto font-medium">
                        Structured blueprints spanning 0 to competitive mastery. Follow curated question trees and theory to master Data Structures and Algorithms.
                    </p>
                </motion.div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-32">
                    {paths.map((path, idx) => (
                        <motion.div
                            key={path.title}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="group relative"
                        >
                            <div className="relative h-full bg-white dark:bg-[#111113] border border-slate-200 dark:border-white/5 p-8 rounded-[40px] flex flex-col shadow-xl dark:shadow-2xl transition-all duration-500 hover:-translate-y-2 hover:border-primary/50">
                                <div className="flex justify-between items-start mb-8">
                                    <div className={`size-14 ${path.bg} ${path.color} rounded-2xl flex items-center justify-center`}>
                                        {path.icon}
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <div className="flex items-center gap-1 text-amber-500 font-black">
                                            <Zap size={14} className="fill-current" />
                                            <span className="text-lg tracking-tighter">{path.xp}</span>
                                        </div>
                                        <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Potential XP</span>
                                    </div>
                                </div>

                                <div className="mb-2">
                                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${path.bg} ${path.color} border ${path.border} uppercase tracking-widest`}>
                                        {path.difficulty}
                                    </span>
                                </div>
                                <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-1 uppercase tracking-tighter">{path.title}</h3>
                                <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-4">{path.subtitle}</p>

                                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-8 flex-grow">
                                    {path.description}
                                </p>

                                <div className="space-y-6 mt-auto">
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-500">
                                            <span>Progress</span>
                                            <span>{path.progress}%</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                                            <div className="h-full bg-primary rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]" style={{ width: `${path.progress}%` }} />
                                        </div>
                                    </div>

                                    <button
                                        disabled={path.status === "Locked"}
                                        className={`w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 ${path.status === "Locked"
                                                ? "bg-slate-100 dark:bg-white/5 text-slate-400 cursor-not-allowed"
                                                : "bg-primary text-white hover:shadow-[0_0_20px_rgba(59,130,246,0.4)] translate-y-0 active:scale-95 shadow-lg shadow-primary/20"
                                            }`}
                                    >
                                        {path.status === "Locked" ? <ShieldCheck size={14} /> : <Trophy size={14} />}
                                        {path.status}
                                        {path.status !== "Locked" && <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                <div className="bg-slate-900 dark:bg-primary/10 border border-white/5 rounded-[48px] p-12 flex flex-col md:flex-row items-center justify-between gap-8 mb-20 overflow-hidden relative">
                    <div className="relative z-10 text-center md:text-left">
                        <h2 className="text-3xl font-black text-white mb-2 uppercase tracking-tighter">Become a Mentor</h2>
                        <p className="text-slate-400 max-w-md text-sm font-medium">
                            Already reached <span className="text-rose-400 font-bold">Radiant</span> rank? Join the GPCET Mentor Program and earn unique badges by reviewing peer code.
                        </p>
                    </div>
                    <button className="relative z-10 px-8 py-4 bg-white text-black text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-slate-200 transition-colors shrink-0">
                        Join Elite Circle
                    </button>
                </div>
            </main>

            <Footer />
        </div>
    );
}
