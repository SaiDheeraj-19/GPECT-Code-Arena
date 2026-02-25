"use client";

import { useState, useEffect } from "react";
import { User, Shield, Sliders, Bell, CreditCard, LogOut, Camera, Github, Linkedin, Loader2, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "../../store/auth";

export default function SettingsPage() {
    const router = useRouter();
    const { user, login, logout } = useAuthStore();
    const [activeTab, setActiveTab] = useState("Account");

    const [publicRanking, setPublicRanking] = useState(true);
    const [hiring, setHiring] = useState(false);
    const [experimental, setExperimental] = useState(true);

    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const [formData, setFormData] = useState({
        name: "",
        username: "",
        bio: "",
        portfolio_url: "",
        avatar_url: ""
    });

    useEffect(() => {
        if (!user) {
            router.push('/login');
        } else {
            setFormData({
                name: user.name || "",
                username: user.username || "",
                bio: user.bio || "",
                portfolio_url: user.portfolio_url || "",
                avatar_url: user.avatar_url || ""
            });
        }
    }, [user, router]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSave = async () => {
        setLoading(true);
        setSuccess(false);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/profile`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });
            if (res.ok) {
                const data = await res.json();
                login(data.user, data.token);
                setSuccess(true);
                setTimeout(() => setSuccess(false), 3000);
            } else {
                const err = await res.json();
                alert(err.error || "Failed to update profile");
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const sidebarItems = [
        { icon: User, label: "Account" },
        { icon: Shield, label: "Security" },
        { icon: Sliders, label: "Preferences" },
        { icon: Bell, label: "Notifications" },
        { icon: CreditCard, label: "Billing" },
    ];

    return (
        <div className="min-h-screen bg-[#0a0a0b] text-slate-100 font-display selection:bg-primary selection:text-background-dark">

            {/* Top Navigation */}
            <header className="h-16 border-b border-white/5 bg-[#0a0a0b]/80 backdrop-blur-md z-50 px-6 flex items-center justify-between sticky top-0">
                <div className="flex items-center gap-8">
                    <div className="flex items-center gap-3 cursor-pointer" onClick={() => router.push('/')}>
                        <div className="size-8 bg-primary rounded-lg flex items-center justify-center shadow-lg shadow-primary/20">
                            <span className="text-background-dark font-black text-xl tracking-tighter">&lt;/&gt;</span>
                        </div>
                        <h1 className="font-bold text-lg tracking-tight hidden md:block">CodeArena</h1>
                    </div>
                    <nav className="hidden md:flex items-center gap-6">
                        <a href="/problems" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Arena</a>
                        <a href="#" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Courses</a>
                        <a href="#" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Community</a>
                    </nav>
                </div>
                <div className="flex items-center gap-4">
                    <button className="text-slate-400 hover:text-white transition">
                        <Bell size={18} />
                    </button>
                    <div className="size-8 rounded-full border-2 border-primary/50 overflow-hidden cursor-pointer bg-slate-800" onClick={() => router.push('/settings')}>
                        {user?.avatar_url ? (
                            <img src={user.avatar_url} alt="User" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400">
                                <User size={16} />
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-6xl mx-auto px-4 md:px-8 py-10 md:py-16">

                {/* Page Header */}
                <div className="mb-10">
                    <h1 className="text-4xl font-extrabold tracking-tight mb-2">Settings</h1>
                    <p className="text-slate-400">Manage your professional coding identity and account security.</p>
                </div>

                {/* Settings Layout */}
                <div className="flex flex-col md:flex-row gap-8">

                    {/* Sidebar Navigation */}
                    <aside className="w-full md:w-64 shrink-0">
                        <nav className="flex flex-col gap-1">
                            {sidebarItems.map((item) => (
                                <button
                                    key={item.label}
                                    onClick={() => setActiveTab(item.label)}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === item.label
                                        ? "bg-white/10 text-white"
                                        : "text-slate-400 hover:text-white hover:bg-white/5"
                                        }`}
                                >
                                    <item.icon size={18} className={activeTab === item.label ? "text-primary" : "text-slate-500"} />
                                    {item.label}
                                </button>
                            ))}

                            <hr className="border-white/5 my-4" />

                            <button
                                onClick={() => { logout(); router.push('/'); }}
                                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
                            >
                                <LogOut size={18} className="text-slate-500 hover:text-red-400" />
                                Sign Out
                            </button>
                        </nav>
                    </aside>

                    {/* Content Panel */}
                    <div className="flex-1 bg-[#121212] border border-white/5 rounded-3xl p-8 md:p-10 shadow-2xl">

                        {/* Profile Header section */}
                        <div className="flex flex-col md:flex-row items-start md:items-center gap-6 mb-12">
                            <div className="relative">
                                <div className="size-24 rounded-full border-2 border-primary p-1">
                                    <div className="w-full h-full rounded-full overflow-hidden bg-white/5 flex items-center justify-center">
                                        {formData.avatar_url ? (
                                            <img src={formData.avatar_url} alt={formData.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <User size={32} className="text-slate-500" />
                                        )}
                                    </div>
                                </div>
                                <button className="absolute bottom-0 right-0 size-8 bg-primary rounded-full text-background-dark flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
                                    <Camera size={14} fill="currentColor" />
                                </button>
                            </div>

                            <div className="flex-1">
                                <h2 className="text-2xl font-bold mb-1">{formData.name || 'Engineer'}</h2>
                                <p className="text-slate-400 text-sm mb-4">{user?.roll_number ? `${user.roll_number} • ` : ''}GPCET</p>
                                <div className="flex gap-3">
                                    <input
                                        type="text"
                                        name="avatar_url"
                                        placeholder="Avatar Image URL..."
                                        value={formData.avatar_url}
                                        onChange={handleChange}
                                        className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-primary/50 flex-1 max-w-xs"
                                    />
                                    <button
                                        onClick={() => setFormData({ ...formData, avatar_url: '' })}
                                        className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 text-xs font-semibold rounded-lg transition-colors border border-red-500/10"
                                    >
                                        Remove
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Form Grid */}
                        <div className="grid md:grid-cols-2 gap-6 mb-8">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">Full Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">Email Address</label>
                                <input
                                    type="email"
                                    value={user?.email || ""}
                                    disabled
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-slate-400 text-sm cursor-not-allowed opacity-70"
                                />
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6 mb-8">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">Username</label>
                                <input
                                    type="text"
                                    name="username"
                                    value={formData.username}
                                    onChange={handleChange}
                                    placeholder="your_handle"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">Portfolio/GitHub URL</label>
                                <input
                                    type="text"
                                    name="portfolio_url"
                                    value={formData.portfolio_url}
                                    onChange={handleChange}
                                    placeholder="https://github.com/..."
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                                />
                            </div>
                        </div>

                        <div className="space-y-2 mb-12">
                            <label className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">Bio</label>
                            <textarea
                                rows={3}
                                name="bio"
                                value={formData.bio}
                                onChange={handleChange}
                                placeholder="Tell us about yourself..."
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none"
                            ></textarea>
                        </div>

                        <hr className="border-white/5 my-8" />

                        {/* Social Connections */}
                        <h3 className="text-xl font-bold mb-6">Social Connections</h3>
                        <div className="space-y-4 mb-12">
                            {/* Github */}
                            <div className="flex items-center justify-between p-4 rounded-2xl border border-white/5 bg-white/[0.02]">
                                <div className="flex items-center gap-4">
                                    <div className="size-10 bg-[#24292e] text-white rounded-xl flex items-center justify-center border border-white/10">
                                        <Github size={20} />
                                    </div>
                                    <div>
                                        <div className="font-bold text-sm">GitHub</div>
                                        <div className="text-xs text-slate-500">Connected as @alexchen_dev</div>
                                    </div>
                                </div>
                                <button className="text-[10px] font-bold tracking-widest text-amber-500 hover:text-amber-400 uppercase transition-colors">
                                    Revoke
                                </button>
                            </div>

                            {/* LinkedIn */}
                            <div className="flex items-center justify-between p-4 rounded-2xl border border-white/5 bg-white/[0.02]">
                                <div className="flex items-center gap-4">
                                    <div className="size-10 bg-[#0077b5] text-white rounded-xl flex items-center justify-center border border-white/10">
                                        <Linkedin size={20} />
                                    </div>
                                    <div>
                                        <div className="font-bold text-sm">LinkedIn</div>
                                        <div className="text-xs text-slate-500">Not connected</div>
                                    </div>
                                </div>
                                <button className="text-[10px] font-bold tracking-widest text-primary hover:text-primary/80 uppercase transition-colors">
                                    Connect
                                </button>
                            </div>
                        </div>

                        <hr className="border-white/5 my-8" />

                        {/* Experience Preferences */}
                        <h3 className="text-xl font-bold mb-6">Experience Preferences</h3>
                        <div className="space-y-6 mb-12">

                            {/* Option 1 */}
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="font-bold text-sm text-white mb-1">Public Ranking</div>
                                    <div className="text-xs text-slate-500">Display your level and badges on the global leaderboard.</div>
                                </div>
                                <button
                                    onClick={() => setPublicRanking(!publicRanking)}
                                    className={`relative w-12 h-6 rounded-full transition-colors ${publicRanking ? 'bg-primary' : 'bg-white/10'}`}
                                >
                                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${publicRanking ? 'left-7' : 'left-1'}`} />
                                </button>
                            </div>

                            {/* Option 2 */}
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="font-bold text-sm text-white mb-1">Hiring Availability</div>
                                    <div className="text-xs text-slate-500">Allow partner companies to contact you for roles.</div>
                                </div>
                                <button
                                    onClick={() => setHiring(!hiring)}
                                    className={`relative w-12 h-6 rounded-full transition-colors ${hiring ? 'bg-primary' : 'bg-white/10'}`}
                                >
                                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${hiring ? 'left-7' : 'left-1'}`} />
                                </button>
                            </div>

                            {/* Option 3 */}
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="font-bold text-sm text-white mb-1">Experimental UI</div>
                                    <div className="text-xs text-slate-500">Try out pre-release dashboard and compiler features.</div>
                                </div>
                                <button
                                    onClick={() => setExperimental(!experimental)}
                                    className={`relative w-12 h-6 rounded-full transition-colors ${experimental ? 'bg-primary' : 'bg-white/10'}`}
                                >
                                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${experimental ? 'left-7' : 'left-1'}`} />
                                </button>
                            </div>

                        </div>

                        {/* Form Actions */}
                        <div className="flex items-center justify-end gap-6 pt-6 mt-8">
                            {success && (
                                <span className="flex items-center gap-2 text-emerald-500 text-sm font-bold">
                                    <Check size={16} /> Saved Successfully
                                </span>
                            )}
                            <button className="text-sm font-bold text-slate-400 hover:text-white transition-colors">
                                Discard
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={loading}
                                className="px-6 py-3 bg-primary text-background-dark font-bold text-sm rounded-xl shadow-lg shadow-primary/20 hover:opacity-90 transition-all active:scale-[0.98] flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {loading && <Loader2 size={16} className="animate-spin" />}
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
