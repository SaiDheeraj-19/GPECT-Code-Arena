"use client";

import Link from "next/link";

export function Footer() {
    return (
        <>
            <footer className="px-6 py-12 max-w-6xl mx-auto border-t border-slate-200 dark:border-white/5 grid grid-cols-2 md:grid-cols-4 gap-8 mt-20 transition-colors z-10 relative">
                <div className="col-span-2 md:col-span-1">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="size-6 bg-primary rounded flex items-center justify-center transition-colors">
                            <span className="text-white dark:text-background-dark font-black text-xs tracking-tighter">&lt;/&gt;</span>
                        </div>
                        <span className="font-bold tracking-tight text-slate-900 dark:text-white transition-colors">CodeArena</span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-500 leading-relaxed max-w-[200px] transition-colors">
                        Engineering the future of GPCET developers, one line of code at a time.
                    </p>
                </div>
                <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-xs tracking-widest uppercase mb-4 transition-colors">Platform</h4>
                    <div className="flex flex-col gap-3">
                        <Link href="/competitions" className="text-xs text-slate-500 hover:text-primary dark:hover:text-white transition-colors">Competitions</Link>
                        <Link href="/learning-paths" className="text-xs text-slate-500 hover:text-primary dark:hover:text-white transition-colors">Learning Paths</Link>
                        <Link href="/compiler" className="text-xs text-slate-500 hover:text-primary dark:hover:text-white transition-colors">Compiler Hub</Link>
                    </div>
                </div>
                <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-xs tracking-widest uppercase mb-4 transition-colors">Company</h4>
                    <div className="flex flex-col gap-3">
                        <Link href="/about" className="text-xs text-slate-500 hover:text-primary dark:hover:text-white transition-colors">About GPCET</Link>
                        <Link href="/privacy" className="text-xs text-slate-500 hover:text-primary dark:hover:text-white transition-colors">Privacy Policy</Link>
                        <Link href="/support" className="text-xs text-slate-500 hover:text-primary dark:hover:text-white transition-colors">Contact Support</Link>
                    </div>
                </div>
                <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-xs tracking-widest uppercase mb-4 transition-colors">Social</h4>
                    <div className="flex flex-col gap-3">
                        <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-xs text-slate-500 hover:text-primary dark:hover:text-white transition-colors">Github</a>
                        <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-xs text-slate-500 hover:text-primary dark:hover:text-white transition-colors">LinkedIn</a>
                        <a href="https://discord.com" target="_blank" rel="noopener noreferrer" className="text-xs text-slate-500 hover:text-primary dark:hover:text-white transition-colors">Discord</a>
                    </div>
                </div>
            </footer>

            {/* Bottom Copyright */}
            <div className="max-w-6xl mx-auto px-6 py-6 border-t border-slate-200 dark:border-white/5 flex flex-col md:flex-row items-center justify-between text-[10px] text-slate-500 dark:text-slate-500 transition-colors z-10 relative">
                <p>&copy; {new Date().getFullYear()} GPCET CodeArena. All rights reserved.</p>
                <div className="flex items-center gap-2 mt-2 md:mt-0">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                    All Systems Operational
                </div>
            </div>
        </>
    );
}
