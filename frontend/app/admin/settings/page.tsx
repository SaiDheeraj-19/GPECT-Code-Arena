"use client";

import { Save, Lock, Mail, Server, Shield, User, ToggleLeft, ToggleRight, CheckCircle2 } from "lucide-react";
import { useState } from "react";

export default function AdminSettings() {
    const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'system'>('profile');
    const [resetRequested, setResetRequested] = useState(false);

    const handleReset = () => {
        setResetRequested(true);
        setTimeout(() => setResetRequested(false), 3000);
    }

    return (
        <div className="p-8 max-w-5xl mx-auto w-full space-y-8 bg-[#FDFDFD] dark:bg-[#0a0a0b] min-h-screen text-slate-900 dark:text-slate-100 transition-colors duration-500 animate-in fade-in duration-300">
            <div className="mb-8">
                <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 transition-colors">Platform Settings</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 transition-colors">Configure your administrator profile and application preferences.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Left Navigation col */}
                <div className="col-span-1 space-y-2">
                    <button
                        onClick={() => setActiveTab('profile')}
                        className={`w-full text-left px-4 py-3 rounded-lg text-sm flex items-center gap-3 transition-colors ${activeTab === 'profile' ? 'font-bold bg-slate-900 dark:bg-white text-white dark:text-slate-900' : 'font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5'}`}
                    >
                        <User size={18} />
                        Profile Settings
                    </button>
                    <button
                        onClick={() => setActiveTab('security')}
                        className={`w-full text-left px-4 py-3 rounded-lg text-sm flex items-center gap-3 transition-colors ${activeTab === 'security' ? 'font-bold bg-slate-900 dark:bg-white text-white dark:text-slate-900' : 'font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5'}`}
                    >
                        <Shield size={18} />
                        Security & Auth
                    </button>
                    <button
                        onClick={() => setActiveTab('system')}
                        className={`w-full text-left px-4 py-3 rounded-lg text-sm flex items-center gap-3 transition-colors ${activeTab === 'system' ? 'font-bold bg-slate-900 dark:bg-white text-white dark:text-slate-900' : 'font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5'}`}
                    >
                        <Server size={18} />
                        System Config
                    </button>
                </div>

                {/* Main Content Area */}
                <div className="col-span-1 md:col-span-2 space-y-6">

                    {activeTab === 'profile' && (
                        <div className="bg-white dark:bg-[#0a0a0b] border text-left border-slate-100 dark:border-white/10 p-8 rounded-2xl shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300 transition-colors">
                            <h2 className="text-lg font-black text-slate-900 dark:text-slate-100 mb-6 border-b border-slate-100 dark:border-white/10 pb-4 transition-colors">Personal Details</h2>

                            <div className="space-y-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2 transition-colors">Full Name</label>
                                        <input
                                            type="text"
                                            defaultValue="Arena Master"
                                            className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2 transition-colors">Display Role</label>
                                        <input
                                            type="text"
                                            defaultValue="Super Admin"
                                            disabled
                                            className="w-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-500 dark:text-slate-400 text-sm focus:outline-none font-medium opacity-70 transition-colors"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2 transition-colors">Email Address</label>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 transition-colors" size={18} />
                                        <input
                                            type="email"
                                            defaultValue="founder@codearena.gpcet.ac.in"
                                            className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl pl-12 pr-4 py-3 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 flex justify-end">
                                <button className="bg-primary hover:bg-primary/90 text-background-dark font-black py-2.5 px-6 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-lg shadow-primary/20 active:scale-95 text-sm uppercase tracking-widest">
                                    <Save size={16} />
                                    Save Changes
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'security' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="bg-white dark:bg-[#0a0a0b] border text-left border-red-100 dark:border-red-500/20 p-8 rounded-2xl shadow-sm relative overflow-hidden transition-colors">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-red-50 dark:bg-red-500/10 rounded-full blur-3xl -mr-16 -mt-16 z-0 pointer-events-none transition-colors"></div>
                                <h2 className="text-lg font-black text-red-700 dark:text-red-400 mb-2 relative z-10 flex items-center gap-2 transition-colors">
                                    <Lock size={18} />
                                    Master Password Reset
                                </h2>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 relative z-10 w-3/4 leading-relaxed transition-colors">
                                    This triggers an email with a secure, one-time-use link to confidently reset your master administrative password without exposing your hash to the database. It overrides standard lockouts.
                                </p>

                                <div className="flex justify-start relative z-10">
                                    <button
                                        onClick={handleReset}
                                        className={`font-bold py-2.5 px-6 rounded-lg transition-all text-sm flex items-center gap-2 ${resetRequested ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-500/20 hover:bg-red-100 dark:hover:bg-red-500/20'}`}
                                    >
                                        {resetRequested ? <><CheckCircle2 size={16} /> Reset Link Dispatched</> : 'Request Reset Link'}
                                    </button>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-[#0a0a0b] border text-left border-slate-100 dark:border-white/10 p-8 rounded-2xl shadow-sm transition-colors">
                                <h2 className="text-lg font-black text-slate-900 dark:text-slate-100 mb-6 border-b border-slate-100 dark:border-white/10 pb-4 transition-colors">Security Preferences</h2>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-bold text-slate-900 dark:text-white text-sm transition-colors">Strict 2FA Enforcement</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 transition-colors">Require an extra Authenticator pin during master login phase.</p>
                                        </div>
                                        <ToggleLeft size={36} className="text-slate-300 dark:text-slate-600 cursor-not-allowed transition-colors" />
                                    </div>
                                    <div className="flex items-center justify-between border-t border-slate-50 dark:border-white/5 pt-4 transition-colors">
                                        <div>
                                            <p className="font-bold text-slate-900 dark:text-white text-sm transition-colors">Session Timeout Lock</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 transition-colors">Automatically log out inactive instances after 30 minutes.</p>
                                        </div>
                                        <ToggleRight size={36} className="text-primary cursor-pointer transition-colors" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'system' && (
                        <div className="bg-white dark:bg-[#0a0a0b] border text-left border-slate-100 dark:border-white/10 p-8 rounded-2xl shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300 transition-colors">
                            <h2 className="text-lg font-black text-slate-900 dark:text-slate-100 mb-6 border-b border-slate-100 dark:border-white/10 pb-4 transition-colors">Exam Configuration</h2>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-bold text-slate-900 dark:text-white text-sm transition-colors">Strict Proctoring Override</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 transition-colors">Instantly lock a student&apos;s exam on multi-tab or copy-paste violation.</p>
                                    </div>
                                    <ToggleRight size={36} className="text-primary cursor-pointer transition-colors" />
                                </div>
                                <div className="flex items-center justify-between border-t border-slate-50 dark:border-white/5 pt-4 transition-colors">
                                    <div>
                                        <p className="font-bold text-slate-900 dark:text-white text-sm transition-colors">Language Engine Extensions</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 transition-colors">Allow isolated Python logic compiling inside the Docker sandbox.</p>
                                    </div>
                                    <ToggleRight size={36} className="text-primary cursor-pointer transition-colors" />
                                </div>
                                <div className="flex items-center justify-between border-t border-slate-50 dark:border-white/5 pt-4 transition-colors">
                                    <div>
                                        <p className="font-bold text-slate-900 dark:text-white text-sm transition-colors">Database Maintenance Mode</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 transition-colors">Restrict student platform access and display downtime alerts natively.</p>
                                    </div>
                                    <ToggleLeft size={36} className="text-slate-300 dark:text-slate-600 cursor-not-allowed transition-colors" />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
