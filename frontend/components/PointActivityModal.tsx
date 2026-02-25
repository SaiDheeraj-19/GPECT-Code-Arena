"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Flame, Plus, History } from "lucide-react";
import { useEffect, useState } from "react";
import api from "../lib/api";

interface PointActivity {
    id: string;
    amount: number;
    reason: string;
    type: string;
    created_at: string;
}

export function PointActivityModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
    const [activities, setActivities] = useState<PointActivity[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen) {
            fetchActivities();
        }
    }, [isOpen]);

    const fetchActivities = async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/activities/points');
            setActivities(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-[#111113] border border-white/10 rounded-[32px] overflow-hidden z-[70] shadow-2xl"
                    >
                        <div className="p-6 border-b border-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="size-10 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/20">
                                    <History size={20} />
                                </div>
                                <h2 className="text-sm font-black uppercase tracking-widest text-white">Reward History</h2>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl transition-colors text-slate-500 hover:text-white">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-4 max-h-[400px] overflow-y-auto custom-scrollbar">
                            {loading ? (
                                <div className="py-20 flex justify-center">
                                    <div className="size-6 border-2 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
                                </div>
                            ) : activities.length > 0 ? (
                                <div className="space-y-2">
                                    {activities.map((activity) => (
                                        <div key={activity.id} className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between group hover:bg-white/[0.04] transition-all">
                                            <div className="flex items-center gap-4">
                                                <div className="size-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 shadow-inner">
                                                    <span className="font-black text-xs">+{activity.amount}</span>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black uppercase tracking-tight text-white">{activity.reason}</p>
                                                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">{new Date(activity.created_at).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                            <div className="size-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Plus size={14} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-20 text-center space-y-4">
                                    <div className="size-16 bg-white/5 rounded-[24px] flex items-center justify-center mx-auto text-slate-700">
                                        <History size={32} />
                                    </div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">No mission logs found</p>
                                </div>
                            )}
                        </div>

                        <div className="p-6 bg-amber-500/5 border-t border-white/5">
                            <div className="flex items-center gap-3">
                                <Flame size={16} className="text-amber-500" />
                                <p className="text-[10px] font-black uppercase tracking-widest text-amber-500/80">Keep logging in daily to build your streak!</p>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
