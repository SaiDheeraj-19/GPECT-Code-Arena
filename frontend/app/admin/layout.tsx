"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "../../store/auth";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Code2,
    ClipboardList,
    ShieldAlert,
    Settings,
    Box,
    User as UserIcon,
    Users,
    LogOut,
    Trophy,
    Award
} from "lucide-react";
import { ThemeToggle } from "../../components/ThemeToggle";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const user = useAuthStore((state) => state.user);
    const logout = useAuthStore((state) => state.logout);

    useEffect(() => {
        if (!user || user.role !== 'ADMIN') {
            router.push('/');
        }
    }, [user, router]);

    if (!user || user.role !== 'ADMIN') return null;

    const handleLogout = () => {
        logout();
        router.push('/');
    };

    const navItems = [
        { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
        { label: "Problems", href: "/admin/problems", icon: Code2 },
        { label: "Contests", href: "/admin/contests", icon: Trophy },
        { label: "Submissions", href: "/admin/submissions", icon: ClipboardList },
        { label: "Students", href: "/admin/students", icon: Users },
        { label: "Certificates", href: "/admin/certificates", icon: Award },
        { label: "User Logs", href: "/admin/logs", icon: ShieldAlert },
    ];

    return (
        <div className="min-h-screen bg-[#FDFDFD] dark:bg-[#0a0a0b] flex font-sans text-slate-900 dark:text-slate-100 transition-colors duration-500">
            {/* Sidebar Focus: Dark Deep Navy matching the mockup */}
            <aside className="w-64 bg-[#0F172A] text-slate-300 flex flex-col justify-between hidden md:flex h-screen sticky top-0 transition-colors">
                <div>
                    <div className="p-6 pb-8 flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-white flex items-center justify-center">
                            <Box className="text-[#0F172A]" size={20} />
                        </div>
                        <span className="text-white font-bold text-lg tracking-wide">GPCET Admin</span>
                    </div>

                    <nav className="px-4 space-y-1">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-sm font-medium ${isActive
                                        ? 'bg-white/10 text-white'
                                        : 'hover:bg-white/5 hover:text-white'
                                        }`}
                                >
                                    <item.icon size={18} className={isActive ? "text-white" : "text-slate-400"} />
                                    {item.label}
                                </Link>
                            );
                        })}

                        <div className="pt-8 pb-2">
                            <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">System</p>
                        </div>

                        <Link
                            href="/admin/settings"
                            className="flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-sm font-medium hover:bg-white/5 hover:text-white"
                        >
                            <Settings size={18} className="text-slate-400" />
                            Settings
                        </Link>
                    </nav>
                </div>

                {/* User Profile Footer */}
                <div className="p-4 m-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                            <UserIcon size={18} className="text-primary" />
                        </div>
                        <div className="truncate">
                            <p className="text-sm font-semibold text-white truncate">{user.name || "Arena Master"}</p>
                            <p className="text-xs text-slate-400">Super Admin</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="scale-75 origin-right">
                            <ThemeToggle />
                        </div>
                        <button
                            onClick={handleLogout}
                            className="text-slate-400 hover:text-red-400 transition ml-2 shrink-0"
                            title="Logout"
                        >
                            <LogOut size={16} />
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col min-h-screen overflow-y-auto">
                {children}
            </main>
        </div>
    );
}
