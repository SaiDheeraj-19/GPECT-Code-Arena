"use client";

import { useRouter, usePathname } from "next/navigation";
import { ThemeToggle } from "./ThemeToggle";
import { useAuthStore } from "../store/auth";
import {
    Settings,
    History,
    Flame,
    Terminal,
    ChevronDown,
    User as UserIcon,
    LayoutDashboard,
    LogOut,
    Zap
} from "lucide-react";
import { useState } from "react";
import { PointActivityModal } from "./PointActivityModal";
import { motion, AnimatePresence } from "framer-motion";

export function Navbar() {
    const router = useRouter();
    const pathname = usePathname();
    const { user, logout } = useAuthStore();
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isActivityOpen, setIsActivityOpen] = useState(false);

    const getRank = (points: number) => {
        if (points >= 15000) return { name: 'RADIANT', color: 'text-rose-400', glow: 'shadow-[0_0_15px_rgba(244,63,94,0.4)]', bg: 'bg-rose-400/10' };
        if (points >= 10000) return { name: 'DIAMOND', color: 'text-indigo-400', glow: 'shadow-[0_0_12px_rgba(129,140,248,0.4)]', bg: 'bg-indigo-400/10' };
        if (points >= 6000) return { name: 'PLATINUM', color: 'text-teal-400', glow: 'shadow-[0_0_10px_rgba(45,212,191,0.4)]', bg: 'bg-teal-400/10' };
        if (points >= 3000) return { name: 'GOLD', color: 'text-amber-400', glow: 'shadow-[0_0_8px_rgba(251,191,36,0.4)]', bg: 'bg-amber-400/10' };
        if (points >= 1500) return { name: 'SILVER', color: 'text-slate-300', glow: 'shadow-[0_0_6px_rgba(203,213,225,0.3)]', bg: 'bg-slate-300/10' };
        if (points >= 500) return { name: 'BRONZE', color: 'text-orange-400', glow: 'shadow-none', bg: 'bg-orange-400/10' };
        return { name: 'NOVICE', color: 'text-slate-500', glow: 'shadow-none', bg: 'bg-slate-500/10' };
    };

    const rank = getRank(user?.points || 0);

    if (!user) return null;

    return (
        <>
            <header className="fixed top-6 inset-x-0 flex justify-center z-50 w-full pointer-events-none">
                <nav className="glass-nav pointer-events-auto rounded-full px-4 py-2 flex items-center justify-between w-[95%] max-w-6xl shadow-2xl border border-border bg-background/80 backdrop-blur-xl transition-all duration-500">
                    {/* Logo */}
                    <div className="flex items-center gap-3 cursor-pointer pl-2 group" onClick={() => router.push('/')}>
                        <div className="size-8 bg-amber-500 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/20 group-hover:scale-110 transition-transform">
                            <Terminal size={18} className="text-black stroke-[3]" />
                        </div>
                        <span className="font-black text-sm tracking-tighter text-foreground uppercase transition-colors">Arena <span className="text-amber-500">v2</span></span>
                    </div>

                    {/* Desktop Navigation */}
                    <div className="hidden lg:flex items-center gap-1">
                        <NavLink active={pathname === '/'} onClick={() => router.push('/')}>Home</NavLink>
                        <NavLink active={pathname.startsWith('/problems')} onClick={() => router.push('/problems')}>Problems</NavLink>
                        <NavLink active={pathname === '/leaderboard'} onClick={() => router.push('/leaderboard')}>Rankings</NavLink>
                        <NavLink active={pathname.startsWith('/contests')} onClick={() => router.push('/contests')}>Contests</NavLink>
                    </div>

                    {/* Right Actions */}
                    <div className="flex items-center gap-3 pr-1">
                        <ThemeToggle />

                        {user ? (
                            <div className="flex items-center gap-2">
                                {/* Points Display */}
                                <button
                                    onClick={() => setIsActivityOpen(true)}
                                    className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-all group"
                                >
                                    <div className="size-5 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-500">
                                        <Zap size={14} className="fill-amber-500" />
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-foreground">{user?.points || 0}</span>
                                    <History size={12} className="text-slate-500 group-hover:text-amber-500 transition-colors" />
                                </button>

                                {/* Streak Display */}
                                <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-full bg-orange-500/10 border border-orange-500/20">
                                    <Flame size={14} className="text-orange-500 fill-orange-500" />
                                    <span className="text-[10px] font-black text-orange-500 font-mono">{user?.streak || 0}</span>
                                </div>

                                {/* Profile Dropdown */}
                                <div className="relative">
                                    <button
                                        onClick={() => setIsProfileOpen(!isProfileOpen)}
                                        className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full bg-foreground/5 border border-border hover:border-amber-500/30 transition-all select-none"
                                    >
                                        <div className={`size-8 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 overflow-hidden border-2 border-white/10 ${rank.glow}`}>
                                            {user?.avatar_url ? (
                                                <img src={user.avatar_url} alt="" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-black">
                                                    <UserIcon size={16} />
                                                </div>
                                            )}
                                        </div>
                                        <ChevronDown size={14} className={`text-slate-500 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
                                    </button>

                                    <AnimatePresence>
                                        {isProfileOpen && (
                                            <>
                                                <div className="fixed inset-0 z-40" onClick={() => setIsProfileOpen(false)} />
                                                <motion.div
                                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                    className="absolute right-0 mt-3 w-56 bg-card border border-border rounded-3xl p-2 shadow-2xl z-50 overflow-hidden"
                                                >
                                                    <div className="px-4 py-3 border-b border-border mb-2">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <p className="text-[10px] font-black text-foreground uppercase tracking-tighter truncate">{user?.name}</p>
                                                            <span className={`text-[8px] font-black px-1.5 py-0.5 rounded ${rank.bg} ${rank.color}`}>{rank.name}</span>
                                                        </div>
                                                        <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5 truncate">{user?.roll_number || user?.email}</p>
                                                    </div>

                                                    <DropdownItem icon={UserIcon} label="My Profile" onClick={() => { router.push('/profile'); setIsProfileOpen(false); }} />
                                                    <DropdownItem icon={LayoutDashboard} label="Dashboard" onClick={() => { router.push('/problems'); setIsProfileOpen(false); }} />
                                                    <DropdownItem icon={Settings} label="Profile Settings" onClick={() => { router.push('/settings'); setIsProfileOpen(false); }} />

                                                    <div className="h-px bg-white/5 my-2 mx-2"></div>

                                                    <button
                                                        onClick={() => { logout(); router.push('/'); }}
                                                        className="w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl text-red-500 hover:bg-red-500/10 transition-colors text-[9px] font-black uppercase tracking-[0.2em]"
                                                    >
                                                        <LogOut size={16} />
                                                        Sign Out
                                                    </button>
                                                </motion.div>
                                            </>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>
                        ) : (
                            <button
                                onClick={() => router.push('/login')}
                                className="px-6 py-2.5 bg-amber-500 text-black text-[10px] font-black uppercase tracking-widest rounded-full hover:shadow-[0_0_20px_rgba(245,158,11,0.3)] transition-all flex items-center gap-2 group"
                            >
                                Start Coding
                                <Zap size={14} className="group-hover:translate-x-0.5 transition-transform" />
                            </button>
                        )}
                    </div>
                </nav>
            </header>

            <PointActivityModal
                isOpen={isActivityOpen}
                onClose={() => setIsActivityOpen(false)}
            />
        </>
    );
}

function NavLink({ children, active, onClick }: { children: React.ReactNode, active: boolean, onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] transition-all ${active
                ? 'text-amber-500 bg-amber-500/10'
                : 'text-muted-foreground hover:text-foreground hover:bg-foreground/5'
                }`}
        >
            {children}
        </button>
    );
}

function DropdownItem({ icon: Icon, label, onClick }: { icon: React.ElementType, label: string, onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl text-slate-400 hover:text-white hover:bg-white/5 transition-all text-[9px] font-black uppercase tracking-[0.2em]"
        >
            <Icon size={16} />
            {label}
        </button>
    );
}
