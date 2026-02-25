"use client";

import React, { useState } from 'react';
import {
    ChevronLeft,
    Terminal,
    Settings,
    Play,
    Send,
    Search,
    Star,
    Share2,
    Clock,
    ThumbsUp,
    Layout,
    BookOpen,
    MessageSquare,
    Focus,
    HelpCircle,
    Maximize2,
    AlignLeft,
    ChevronDown,
    Rocket
} from 'lucide-react';

export default function PremiumEditor() {
    const [activeTab, setActiveTab] = useState('description');
    const [language, setLanguage] = useState('Python 3');

    return (
        <div className="h-screen bg-[#FDFDFD] flex flex-col font-sans text-slate-900 overflow-hidden selection:bg-amber-100 selection:text-amber-900">
            {/* Top Navigation Bar (Apple-Inspired) */}
            <header className="h-14 border-b border-slate-200/60 flex items-center justify-between px-6 bg-white/80 backdrop-blur-md z-50 sticky top-0">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-3">
                        <div className="size-8 bg-gradient-to-br from-[#c9a326] to-[#e6bc2f] rounded-lg flex items-center justify-center shadow-lg shadow-amber-500/10">
                            <Terminal size={18} className="text-white font-bold" />
                        </div>
                        <h1 className="font-bold text-lg tracking-tight hidden md:block">CodeArena<span className="text-[#c9a326]">.</span></h1>
                    </div>
                    <nav className="hidden lg:flex items-center gap-1">
                        <a className="px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-slate-100 transition-colors text-slate-500 hover:text-slate-900" href="#">Explore</a>
                        <a className="px-3 py-1.5 rounded-lg text-sm font-medium bg-slate-100 text-slate-900" href="#">Problems</a>
                        <a className="px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-slate-100 transition-colors text-slate-500 hover:text-slate-900" href="#">Contests</a>
                        <a className="px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-slate-100 transition-colors text-slate-500 hover:text-slate-900" href="#">Leaderboard</a>
                    </nav>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center bg-slate-100/50 rounded-xl px-3 py-1.5 border border-slate-200/50">
                        <Search size={14} className="text-slate-400 mr-2" />
                        <input
                            type="text"
                            placeholder="Jump to..."
                            className="bg-transparent border-none focus:ring-0 text-xs w-32 md:w-48 placeholder:text-slate-400"
                        />
                        <span className="text-[10px] bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-400 font-mono shadow-sm">⌘K</span>
                    </div>

                    <div className="flex items-center gap-2">
                        <button className="flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 transition-all active:scale-95 shadow-sm">
                            <Play size={14} />
                            Run
                        </button>
                        <button className="flex items-center gap-2 bg-[#c9a326] hover:bg-[#b08d1f] text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg shadow-amber-500/20 transition-all active:scale-95">
                            <Send size={14} />
                            Submit
                        </button>
                    </div>

                    <div className="h-8 w-px bg-slate-200/60 mx-1"></div>
                    <div className="size-8 rounded-full border-2 border-amber-500/20 overflow-hidden cursor-pointer hover:border-amber-500/50 transition-all shadow-sm">
                        <img
                            src="https://api.dicebear.com/7.x/avataaars/svg?seed=Lucky"
                            alt="Avatar"
                            className="w-full h-full object-cover"
                        />
                    </div>
                </div>
            </header>

            {/* Main Workspace Layout */}
            <main className="flex-1 flex overflow-hidden">
                {/* Left Sidebar: Problem Description (Glassmorphic Light) */}
                <aside className="w-[450px] flex-shrink-0 bg-slate-50/50 backdrop-blur-sm border-r border-slate-200/60 flex flex-col overflow-y-auto overflow-x-hidden">
                    <div className="p-8 space-y-8">
                        {/* Problem Meta */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Algorithms / Array</span>
                                <div className="flex gap-2">
                                    <Star size={18} className="text-slate-300 cursor-pointer hover:text-amber-500 transition-colors" />
                                    <Share2 size={18} className="text-slate-300 cursor-pointer hover:text-slate-900 transition-colors" />
                                </div>
                            </div>
                            <h2 className="text-4xl font-black tracking-tight text-slate-900 leading-[1.1]">1. Two Sum</h2>
                            <div className="flex items-center gap-3">
                                <span className="px-3 py-1.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100/50 shadow-sm">EASY</span>
                                <div className="flex items-center gap-1.5 text-slate-400 text-xs font-medium">
                                    <Clock size={14} />
                                    15 mins
                                </div>
                                <div className="flex items-center gap-1.5 text-slate-400 text-xs font-medium">
                                    <ThumbsUp size={14} />
                                    12.4k
                                </div>
                            </div>
                        </div>

                        {/* Pill Segmented Tabs (extracted from downloaded folder) */}
                        <div className="flex p-1 bg-slate-100/50 rounded-2xl border border-slate-200/40">
                            <button
                                onClick={() => setActiveTab('description')}
                                className={`flex-1 py-1.5 px-4 rounded-xl text-xs font-bold transition-all ${activeTab === 'description'
                                        ? 'bg-white text-slate-900 shadow-sm border border-slate-200/40'
                                        : 'text-slate-500 hover:text-slate-700'
                                    }`}
                            >
                                Description
                            </button>
                            <button
                                onClick={() => setActiveTab('solutions')}
                                className={`flex-1 py-1.5 px-4 rounded-xl text-xs font-bold transition-all ${activeTab === 'solutions'
                                        ? 'bg-white text-slate-900 shadow-sm border border-slate-200/40'
                                        : 'text-slate-500 hover:text-slate-700'
                                    }`}
                            >
                                Solutions
                            </button>
                            <button
                                onClick={() => setActiveTab('submissions')}
                                className={`flex-1 py-1.5 px-4 rounded-xl text-xs font-bold transition-all ${activeTab === 'submissions'
                                        ? 'bg-white text-slate-900 shadow-sm border border-slate-200/40'
                                        : 'text-slate-500 hover:text-slate-700'
                                    }`}
                            >
                                Submissions
                            </button>
                        </div>

                        {/* Description Body */}
                        <div className="space-y-6 text-[15px] leading-relaxed text-slate-600">
                            <p>
                                Given an array of integers <code className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded font-mono text-xs font-bold">nums</code> and an integer <code className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded font-mono text-xs font-bold">target</code>, return indices of the two numbers such that they add up to <code className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded font-mono text-xs font-bold">target</code>.
                            </p>
                            <p>
                                You may assume that each input would have exactly one solution, and you may not use the same element twice.
                            </p>

                            <div className="space-y-4 pt-4">
                                <h4 className="font-bold text-slate-900 text-sm uppercase tracking-wider">Example 1:</h4>
                                <div className="bg-white border border-slate-200/60 p-5 rounded-2xl shadow-sm text-sm space-y-3 font-mono">
                                    <div><span className="text-slate-400 font-bold block text-[10px] uppercase mb-1">Input</span> nums = [2,7,11,15], target = 9</div>
                                    <div className="pt-2"><span className="text-slate-400 font-bold block text-[10px] uppercase mb-1 border-t border-slate-100 pt-2">Output</span> <span className="text-emerald-600 font-bold">[0,1]</span></div>
                                    <div className="text-slate-400 italic text-xs mt-2 font-sans pt-2 border-t border-slate-100 select-none">// Because nums[0] + nums[1] == 9, we return [0, 1].</div>
                                </div>
                            </div>

                            <div className="space-y-4 pt-4 pb-8">
                                <h4 className="font-bold text-slate-900 text-sm uppercase tracking-wider">Constraints:</h4>
                                <ul className="space-y-2.5 text-slate-500 text-sm">
                                    <li className="flex items-start gap-2">
                                        <div className="size-1.5 rounded-full bg-slate-300 mt-1.5 shrink-0" />
                                        <code className="text-slate-900 font-mono text-xs">2 ≤ nums.length ≤ 10^4</code>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <div className="size-1.5 rounded-full bg-slate-300 mt-1.5 shrink-0" />
                                        <code className="text-slate-900 font-mono text-xs">-10^9 ≤ nums[i] ≤ 10^9</code>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <div className="size-1.5 rounded-full bg-[#c9a326] mt-1.5 shrink-0" />
                                        <span className="text-[#c9a326] font-medium">Only one valid answer exists.</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Sidebar Promo (from workspace dark folder, light version) */}
                    <div className="mt-auto p-6 border-t border-slate-200/60 bg-white/40">
                        <div className="bg-gradient-to-br from-amber-50 to-white border border-amber-200/50 p-5 rounded-[2rem] shadow-sm">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="size-8 rounded-full bg-amber-500 flex items-center justify-center text-white">
                                    <span className="material-symbols-outlined text-lg">workspace_premium</span>
                                </div>
                                <span className="text-xs font-black uppercase tracking-wider text-amber-600">Pro Upgrade</span>
                            </div>
                            <p className="text-xs text-slate-500 font-medium leading-relaxed">Get access to premium interview questions from FAANG companies.</p>
                            <button className="mt-4 w-full py-2.5 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold transition-all shadow-md">Upgrade Now</button>
                        </div>
                    </div>
                </aside>

                {/* Right Side: Code Editor & Output */}
                <section className="flex-1 flex flex-col bg-white relative">
                    {/* Editor Toolbar */}
                    <div className="h-12 flex items-center justify-between px-4 border-b border-slate-200/40 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 cursor-pointer group px-3 py-1 rounded-lg hover:bg-slate-50 transition-colors">
                                <span className="text-xs font-bold text-slate-700">{language}</span>
                                <ChevronDown size={14} className="text-slate-400 group-hover:text-slate-900 transition-colors" />
                            </div>
                            <div className="h-4 w-px bg-slate-200"></div>
                            <button className="p-1.5 rounded-lg hover:bg-slate-50 text-slate-400 hover:text-slate-900 transition-colors">
                                <Settings size={16} />
                            </button>
                        </div>
                        <div className="flex items-center gap-2">
                            <button className="p-1.5 rounded-lg hover:bg-slate-50 text-slate-400 hover:text-slate-900 transition-colors" title="Format Code">
                                <AlignLeft size={16} />
                            </button>
                            <button className="p-1.5 rounded-lg hover:bg-slate-50 text-slate-400 hover:text-slate-900 transition-colors" title="Full Screen">
                                <Maximize2 size={16} />
                            </button>
                        </div>
                    </div>

                    {/* Code Content Area (Mocking Editor in Light Mode) */}
                    <div className="flex-1 overflow-hidden relative flex bg-slate-50/20">
                        {/* Line Numbers */}
                        <div className="w-12 border-r border-slate-200/60 bg-white/40 flex flex-col items-center pt-6 text-[11px] font-mono text-slate-300 select-none">
                            {[...Array(12)].map((_, i) => <div key={i} className="h-6 leading-6">{i + 1}</div>)}
                        </div>

                        {/* Mock Code Editor Body */}
                        <div className="flex-1 p-6 font-mono text-[14px] leading-6 overflow-y-auto">
                            <div><span className="text-purple-600 font-bold">class</span> <span className="text-blue-600">Solution</span>:</div>
                            <div className="pl-6"><span className="text-purple-600 font-bold">def</span> <span className="text-blue-600">twoSum</span>(self, nums: List[int], target: int) -&gt; List[int]:</div>
                            <div className="pl-12 text-slate-400 italic"># Use a hash map to store seen values</div>
                            <div className="pl-12">prevMap = {"{}"} <span className="text-slate-400 italic"># val : index</span></div>
                            <div className="pl-12 h-4"></div>
                            <div className="pl-12"><span className="text-purple-600 font-bold">for</span> i, n <span className="text-purple-600 font-bold">in</span> <span className="text-blue-600">enumerate</span>(nums):</div>
                            <div className="pl-18">diff = target - n</div>
                            <div className="pl-18"><span className="text-purple-600 font-bold">if</span> diff <span className="text-purple-600 font-bold">in</span> prevMap:</div>
                            <div className="pl-24"><span className="text-purple-600 font-bold">return</span> [prevMap[diff], i]</div>
                            <div className="pl-18">prevMap[n] = i</div>
                            <div className="pl-12"><span className="text-purple-600 font-bold">return</span> [] <span className="text-slate-400 italic"># Base case</span></div>

                            {/* Cursor Mock */}
                            <div className="inline-block w-[2px] h-4 bg-[#c9a326] ml-1 animate-pulse align-middle" />
                        </div>
                    </div>

                    {/* Bottom Terminal / Output Pane (Collapsible style) */}
                    <div className="h-64 border-t border-slate-200/60 bg-white flex flex-col shadow-[0_-4px_20px_rgba(0,0,0,0.02)]">
                        <div className="h-10 px-4 flex items-center justify-between border-b border-slate-100/60 bg-slate-50/30">
                            <div className="flex gap-4">
                                <button className="text-[10px] font-black uppercase tracking-widest text-[#c9a326] border-b-2 border-[#c9a326] h-10 px-1">Testcase</button>
                                <button className="text-[10px] font-black uppercase tracking-widest text-slate-400 h-10 px-1 hover:text-slate-600 transition-colors">Console</button>
                            </div>
                            <button className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
                                <ChevronDown size={14} className="text-slate-400" />
                            </button>
                        </div>
                        <div className="flex-1 p-5 flex gap-8">
                            <div className="w-56 flex flex-col gap-2">
                                <div className="bg-white p-4 rounded-2xl border border-amber-200 shadow-sm cursor-pointer hover:bg-amber-50/30 transition-all">
                                    <div className="text-[9px] text-amber-600 font-black uppercase mb-1.5 tracking-tighter">Case 1</div>
                                    <div className="text-xs font-mono font-bold text-slate-700 truncate">nums = [2,7,11,15]</div>
                                </div>
                                <div className="p-4 rounded-2xl border border-transparent cursor-pointer hover:bg-slate-50 transition-all opacity-50">
                                    <div className="text-[9px] text-slate-400 font-black uppercase mb-1.5 tracking-tighter">Case 2</div>
                                    <div className="text-xs font-mono font-bold text-slate-400 truncate">nums = [3,2,4]</div>
                                </div>
                            </div>
                            <div className="flex-1 bg-slate-50/50 rounded-[2rem] border border-slate-200/40 p-6 font-mono text-sm overflow-hidden relative">
                                <div className="space-y-6">
                                    <div>
                                        <div className="text-slate-400 text-[9px] uppercase font-black mb-1.5 tracking-wider">Input</div>
                                        <div className="bg-white p-3 rounded-xl border border-slate-200/60 text-slate-900 font-bold text-xs">nums = [2,7,11,15], target = 9</div>
                                    </div>
                                    <div>
                                        <div className="text-slate-400 text-[9px] uppercase font-black mb-1.5 tracking-wider">Expected Output</div>
                                        <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100 text-emerald-600 font-bold text-xs ring-4 ring-emerald-500/5">[0,1]</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            {/* Floating Tool Dock (macOS Style - Light version) */}
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] bg-white/90 backdrop-blur-2xl border border-slate-200/60 h-14 px-3 rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.08)] flex items-center gap-1 group">
                <button className="size-10 rounded-xl hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-[#c9a326] transition-all active:scale-90" title="Keyboard Shortcuts">
                    <BookOpen size={20} />
                </button>
                <div className="w-px h-6 bg-slate-200/60 mx-1"></div>
                <button className="size-10 rounded-xl hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all active:scale-90" title="Community Discussion">
                    <MessageSquare size={20} />
                </button>
                <button className="size-10 rounded-xl hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all active:scale-90" title="Focus Mode">
                    <Focus size={20} />
                </button>
                <div className="w-px h-6 bg-slate-200/60 mx-1"></div>
                <button className="size-10 rounded-xl hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all active:scale-90" title="Help">
                    <HelpCircle size={20} />
                </button>
                <div className="w-px h-6 bg-slate-200/60 mx-1"></div>
                <button className="size-10 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 flex items-center justify-center text-amber-600 transition-all active:scale-90" title="Launch Demo">
                    <Rocket size={20} />
                </button>
            </div>

            <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap');
        
        body {
          font-family: 'Space Grotesk', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        }

        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(0, 0, 0, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar:hover::-webkit-scrollbar-thumb {
          background: rgba(0, 0, 0, 0.1);
        }
      `}</style>
        </div>
    );
}
