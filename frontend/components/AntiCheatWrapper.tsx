/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

/**
 * ═══════════════════════════════════════════════════════════════
 *  GPCET Anti-Cheat Engine — Client-Side Enforcement
 * ═══════════════════════════════════════════════════════════════
 * 
 * This component wraps any contest/exam page and enforces:
 * 
 * 1. COPY-PASTE BLOCKING
 *    - Ctrl+C/V/X disabled
 *    - Right-click context menu disabled
 *    - Clipboard paste event blocked
 *    - Drag and drop disabled
 *    - onPaste/beforeinput/keydown detection
 * 
 * 2. TAB SWITCH / WINDOW FOCUS DETECTION
 *    - document.visibilitychange
 *    - window.onblur / onfocus
 *    - Basic devtools detection
 * 
 * 3. FULLSCREEN MODE (strict mode)
 *    - Requests fullscreen on mount
 *    - Logs exit as violation
 * 
 * 4. SERVER-SIDE LOGGING
 *    - Every violation is POSTed to /api/violations
 *    - Response includes violation count, flag status, DQ status
 * 
 * 5. AUTO-SUBMIT ON DISQUALIFICATION
 *    - If violationCount >= threshold, auto-submit and lock
 * 
 * Usage:
 *   <AntiCheatWrapper contestId="..." problemId="..." onAutoSubmit={fn}>
 *     <YourContestPage />
 *   </AntiCheatWrapper>
 */

import React, { useEffect, useRef, useState, useCallback } from "react";
import api from "../lib/api";
import { useAuthStore } from "../store/auth";

interface AntiCheatProps {
    children: React.ReactNode;
    contestId?: string;          // Required for violation logging
    problemId?: string;          // Optional context
    strictMode?: boolean;        // Enable fullscreen requirement
    onAutoSubmit?: () => void;   // Called when auto-submit triggered
    enabled?: boolean;           // Default true; set false to disable during practice
}

interface WarningState {
    show: boolean;
    message: string;
    type: 'warning' | 'danger' | 'critical';
    count: number;
}

const VIOLATION_LABELS: Record<string, string> = {
    PASTE_ATTEMPT: '📋 Paste Attempt Detected',
    TAB_SWITCH: '🔀 Tab Switch Detected',
    DEVTOOLS_OPEN: '🔧 Developer Tools Detected',
    FULLSCREEN_EXIT: '🖥️ Fullscreen Exit Detected',
    RIGHT_CLICK: '🖱️ Right-Click Blocked',
    DRAG_DROP: '🎯 Drag & Drop Blocked',
    CLIPBOARD: '📋 Clipboard Access Blocked',
    COPY_ATTEMPT: '📄 Copy Attempt Blocked',
    CUT_ATTEMPT: '✂️ Cut Attempt Blocked',
    PAGE_RELOAD: '🔄 Page Reload Attempt',
};

export default function AntiCheatWrapper({
    children,
    contestId,
    problemId,
    strictMode = false,
    onAutoSubmit,
    enabled = true,
}: AntiCheatProps) {
    const user = useAuthStore((state: any) => state.user);
    const isAdmin = user?.role === 'ADMIN';

    const [warning, setWarning] = useState<WarningState>({
        show: false, message: '', type: 'warning', count: 0
    });
    const [isFlagged, setIsFlagged] = useState(false);
    const [isDisqualified, setIsDisqualified] = useState(false);
    const [totalViolations, setTotalViolations] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const devtoolsCheckRef = useRef<NodeJS.Timeout | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // ── Report violation to server ──
    const reportViolation = useCallback(async (
        violationType: string,
        metadata?: string
    ) => {
        if (!contestId || !enabled || isDisqualified || isAdmin) return;

        try {
            const { data } = await api.post('/violations', {
                contestId,
                violationType,
                metadata: metadata || `problemId:${problemId || 'unknown'}`,
            });

            setTotalViolations(data.violationCount);

            if (data.isFlagged) setIsFlagged(true);
            if (data.isDisqualified) {
                setIsDisqualified(true);
                // Auto-submit if callback provided
                if (onAutoSubmit) {
                    onAutoSubmit();
                }
            }

            // Show warning popup
            showWarning(
                data.warning || VIOLATION_LABELS[violationType] || 'Violation recorded',
                data.isDisqualified ? 'critical' : data.isFlagged ? 'danger' : 'warning',
                data.violationCount
            );

        } catch (error) {
            console.error('[AntiCheat] Failed to report violation:', error);
        }
    }, [contestId, enabled, isDisqualified, isAdmin, problemId, onAutoSubmit]);

    const showWarning = (message: string, type: WarningState['type'], count: number) => {
        if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
        setWarning({ show: true, message, type, count });
        warningTimeoutRef.current = setTimeout(() => {
            setWarning(prev => ({ ...prev, show: false }));
        }, type === 'critical' ? 10000 : type === 'danger' ? 6000 : 4000);
    };

    // ═══════════════════════════════════════════
    // 1. KEYBOARD SHORTCUT BLOCKING
    // ═══════════════════════════════════════════
    useEffect(() => {
        if (!enabled) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            const blocked = [
                // Copy
                (e.ctrlKey || e.metaKey) && e.key === 'c',
                // Paste
                (e.ctrlKey || e.metaKey) && e.key === 'v',
                // Cut
                (e.ctrlKey || e.metaKey) && e.key === 'x',
                // Select all (optional)
                (e.ctrlKey || e.metaKey) && e.key === 'a',
                // DevTools shortcuts
                e.key === 'F12',
                (e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'I',
                (e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'J',
                (e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'C',
                (e.ctrlKey || e.metaKey) && e.key === 'u', // View source
            ];

            if (blocked.some(Boolean)) {
                e.preventDefault();
                e.stopPropagation();

                // Determine violation type
                let vType = 'CLIPBOARD';
                let meta = `key:${e.key}`;
                if ((e.ctrlKey || e.metaKey) && e.key === 'v') { vType = 'PASTE_ATTEMPT'; }
                else if ((e.ctrlKey || e.metaKey) && e.key === 'c') { vType = 'COPY_ATTEMPT'; }
                else if ((e.ctrlKey || e.metaKey) && e.key === 'x') { vType = 'CUT_ATTEMPT'; }
                else if (e.key === 'F12' || ((e.ctrlKey || e.metaKey) && e.shiftKey)) { vType = 'DEVTOOLS_OPEN'; meta = 'keyboard shortcut'; }

                reportViolation(vType, meta);
                return false;
            }
        };

        document.addEventListener('keydown', handleKeyDown, true);
        return () => document.removeEventListener('keydown', handleKeyDown, true);
    }, [enabled, reportViolation]);

    // ═══════════════════════════════════════════
    // 2. PASTE / COPY / CUT EVENT BLOCKING
    // ═══════════════════════════════════════════
    useEffect(() => {
        if (!enabled) return;

        const handlePaste = (e: ClipboardEvent) => {
            // Allow paste inside Monaco editor textarea
            const target = e.target as HTMLElement;
            const isMonacoEditorElement =
                target.closest('.monaco-editor') !== null ||
                target.classList.contains('inputarea') ||
                target.getAttribute('role') === 'textbox';

            if (!isMonacoEditorElement) {
                e.preventDefault();
                reportViolation('PASTE_ATTEMPT', 'clipboardEvent:paste');
            }
            // Note: Even inside Monaco, paste from outside is blocked via keyboard
        };

        const handleCopy = (e: ClipboardEvent) => {
            // Block copy of problem description etc.
            const target = e.target as HTMLElement;
            const isMonacoEditorElement = target.closest('.monaco-editor') !== null;
            if (!isMonacoEditorElement) {
                e.preventDefault();
                reportViolation('COPY_ATTEMPT', 'clipboardEvent:copy');
            }
        };

        const handleCut = (e: ClipboardEvent) => {
            const target = e.target as HTMLElement;
            const isMonacoEditorElement = target.closest('.monaco-editor') !== null;
            if (!isMonacoEditorElement) {
                e.preventDefault();
                reportViolation('CUT_ATTEMPT', 'clipboardEvent:cut');
            }
        };

        const handleBeforeInput = (e: InputEvent) => {
            if (e.inputType === 'insertFromPaste') {
                const target = e.target as HTMLElement;
                const isMonaco = target.closest('.monaco-editor') !== null;
                if (!isMonaco) {
                    e.preventDefault();
                    reportViolation('PASTE_ATTEMPT', 'beforeinput:paste');
                }
            }
        };

        document.addEventListener('paste', handlePaste, true);
        document.addEventListener('copy', handleCopy, true);
        document.addEventListener('cut', handleCut, true);
        document.addEventListener('beforeinput', handleBeforeInput as EventListener, true);

        return () => {
            document.removeEventListener('paste', handlePaste, true);
            document.removeEventListener('copy', handleCopy, true);
            document.removeEventListener('cut', handleCut, true);
            document.removeEventListener('beforeinput', handleBeforeInput as EventListener, true);
        };
    }, [enabled, reportViolation]);

    // ═══════════════════════════════════════════
    // 3. RIGHT-CLICK CONTEXT MENU BLOCKING
    // ═══════════════════════════════════════════
    useEffect(() => {
        if (!enabled) return;

        const handleContextMenu = (e: MouseEvent) => {
            e.preventDefault();
            reportViolation('RIGHT_CLICK', 'contextmenu');
            return false;
        };

        document.addEventListener('contextmenu', handleContextMenu, true);
        return () => document.removeEventListener('contextmenu', handleContextMenu, true);
    }, [enabled, reportViolation]);

    // ═══════════════════════════════════════════
    // 4. DRAG AND DROP BLOCKING
    // ═══════════════════════════════════════════
    useEffect(() => {
        if (!enabled) return;

        const handleDragStart = (e: DragEvent) => {
            e.preventDefault();
            reportViolation('DRAG_DROP', 'dragstart');
        };

        const handleDrop = (e: DragEvent) => {
            e.preventDefault();
            reportViolation('DRAG_DROP', 'drop');
        };

        const handleDragOver = (e: DragEvent) => {
            e.preventDefault();
        };

        document.addEventListener('dragstart', handleDragStart, true);
        document.addEventListener('drop', handleDrop, true);
        document.addEventListener('dragover', handleDragOver, true);

        return () => {
            document.removeEventListener('dragstart', handleDragStart, true);
            document.removeEventListener('drop', handleDrop, true);
            document.removeEventListener('dragover', handleDragOver, true);
        };
    }, [enabled, reportViolation]);

    // ═══════════════════════════════════════════
    // 5. TAB SWITCH / WINDOW BLUR DETECTION
    // ═══════════════════════════════════════════
    useEffect(() => {
        if (!enabled) return;

        const handleVisibilityChange = () => {
            if (document.hidden) {
                reportViolation('TAB_SWITCH', 'visibilitychange:hidden');
            }
        };

        const handleBlur = () => {
            reportViolation('TAB_SWITCH', 'window:blur');
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('blur', handleBlur);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('blur', handleBlur);
        };
    }, [enabled, reportViolation]);

    // ═══════════════════════════════════════════
    // 6. DEVTOOLS DETECTION (basic)
    // ═══════════════════════════════════════════
    useEffect(() => {
        if (!enabled) return;

        // Method 1: Window size-based detection
        const checkDevTools = () => {
            const threshold = 160;
            const widthDiff = window.outerWidth - window.innerWidth > threshold;
            const heightDiff = window.outerHeight - window.innerHeight > threshold;

            if (widthDiff || heightDiff) {
                reportViolation('DEVTOOLS_OPEN', 'size:detected');
            }
        };

        // Check periodically (not too aggressive)
        devtoolsCheckRef.current = setInterval(checkDevTools, 5000);

        return () => {
            if (devtoolsCheckRef.current) clearInterval(devtoolsCheckRef.current);
        };
    }, [enabled, reportViolation]);

    // ═══════════════════════════════════════════
    // 7. FULLSCREEN MODE (strict mode)
    // ═══════════════════════════════════════════
    useEffect(() => {
        if (!enabled || !strictMode) return;

        // Request fullscreen on mount
        const requestFullscreen = async () => {
            try {
                if (containerRef.current && !document.fullscreenElement) {
                    await document.documentElement.requestFullscreen();
                    setIsFullscreen(true);
                }
            } catch (err) {
                console.warn('[AntiCheat] Fullscreen request denied:', err);
            }
        };

        requestFullscreen();

        const handleFullscreenChange = () => {
            const isFS = !!document.fullscreenElement;
            setIsFullscreen(isFS);
            if (!isFS) {
                reportViolation('FULLSCREEN_EXIT', 'fullscreenchange');
            }
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
        };
    }, [enabled, strictMode, reportViolation]);

    // ═══════════════════════════════════════════
    // 8. PREVENT PAGE RELOAD / NAVIGATION
    // ═══════════════════════════════════════════
    useEffect(() => {
        if (!enabled) return;

        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            e.preventDefault();
            e.returnValue = 'You are in a monitored exam. Leaving may result in disqualification.';
            reportViolation('PAGE_RELOAD', 'beforeunload');
            return e.returnValue;
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [enabled, reportViolation]);

    // ═══════════════════════════════════════════
    // 9. DISABLE TEXT SELECTION OUTSIDE EDITOR
    // ═══════════════════════════════════════════
    useEffect(() => {
        if (!enabled) return;

        const handleSelectStart = (e: Event) => {
            const target = e.target as HTMLElement;
            const isMonaco = target.closest('.monaco-editor') !== null;
            if (!isMonaco) {
                e.preventDefault();
            }
        };

        document.addEventListener('selectstart', handleSelectStart, true);
        return () => document.removeEventListener('selectstart', handleSelectStart, true);
    }, [enabled]);

    // ── Cleanup ──
    useEffect(() => {
        return () => {
            if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
            if (devtoolsCheckRef.current) clearInterval(devtoolsCheckRef.current);
        };
    }, []);

    if (!enabled || isAdmin) return <>{children}</>;

    // ── Warning Popup Colors ──
    const warningStyles = {
        warning: {
            bg: 'bg-amber-50 border-amber-400',
            text: 'text-amber-800',
            bar: 'bg-amber-400',
            icon: '⚠️',
        },
        danger: {
            bg: 'bg-red-50 border-red-500',
            text: 'text-red-800',
            bar: 'bg-red-500',
            icon: '🚨',
        },
        critical: {
            bg: 'bg-red-100 border-red-700',
            text: 'text-red-900',
            bar: 'bg-red-700',
            icon: '🛑',
        },
    };

    return (
        <div
            ref={containerRef}
            className="relative"
            style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => e.preventDefault()}
        >
            {/* Warning Popup Overlay */}
            {warning.show && (
                <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] animate-in slide-in-from-top-4 duration-300">
                    <div className={`${warningStyles[warning.type].bg} border-2 rounded-2xl px-8 py-5 shadow-2xl shadow-black/10 max-w-lg`}>
                        <div className="flex items-start gap-4">
                            <span className="text-3xl">{warningStyles[warning.type].icon}</span>
                            <div className="flex-1">
                                <h4 className={`font-black text-sm uppercase tracking-wider ${warningStyles[warning.type].text}`}>
                                    {warning.type === 'critical' ? 'DISQUALIFIED' :
                                        warning.type === 'danger' ? 'SUSPICIOUS ACTIVITY FLAGGED' :
                                            'VIOLATION DETECTED'}
                                </h4>
                                <p className={`text-sm mt-1 font-medium ${warningStyles[warning.type].text} opacity-80`}>
                                    {warning.message}
                                </p>
                                <div className="flex items-center gap-4 mt-3">
                                    <div className={`text-xs font-black ${warningStyles[warning.type].text} opacity-60`}>
                                        Violations: {warning.count}
                                    </div>
                                    {/* Violation progress bar */}
                                    <div className="flex-1 h-1.5 bg-white/50 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full ${warningStyles[warning.type].bar} rounded-full transition-all duration-500`}
                                            style={{ width: `${Math.min((warning.count / 7) * 100, 100)}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Flagged Banner */}
            {isFlagged && !isDisqualified && (
                <div className="fixed bottom-0 left-0 right-0 z-[9998] bg-red-600 text-white px-4 py-2 text-center font-bold text-xs uppercase tracking-wider animate-pulse">
                    ⚠️ Your activity has been flagged for review by the administrator. Proceed with integrity.
                </div>
            )}

            {/* Disqualified Overlay */}
            {isDisqualified && (
                <div className="fixed inset-0 z-[9999] bg-red-950/95 flex items-center justify-center backdrop-blur-sm">
                    <div className="text-center p-12 max-w-md">
                        <div className="text-7xl mb-6">🛑</div>
                        <h2 className="text-3xl font-black text-red-200 uppercase tracking-widest mb-4">
                            DISQUALIFIED
                        </h2>
                        <p className="text-red-300 font-medium text-lg leading-relaxed">
                            You have been automatically disqualified due to excessive integrity violations
                            ({totalViolations} recorded).
                        </p>
                        <p className="text-red-400 text-sm mt-6 font-medium">
                            This session has been locked. Your submission has been recorded.
                            Contact your administrator for further action.
                        </p>
                        <div className="mt-8 text-red-500 text-xs font-mono">
                            SESSION TERMINATED • {new Date().toLocaleTimeString()}
                        </div>
                    </div>
                </div>
            )}

            {/* Strict Mode: Fullscreen prompt */}
            {strictMode && !isFullscreen && !isDisqualified && (
                <div className="fixed inset-0 z-[9997] bg-slate-950/95 flex items-center justify-center backdrop-blur-sm">
                    <div className="text-center p-12 max-w-md">
                        <div className="text-6xl mb-6">🖥️</div>
                        <h2 className="text-2xl font-black text-white uppercase tracking-widest mb-4">
                            FULLSCREEN REQUIRED
                        </h2>
                        <p className="text-slate-300 font-medium mb-8">
                            This exam requires fullscreen mode. Click the button below to enter fullscreen and continue.
                        </p>
                        <button
                            onClick={async () => {
                                try {
                                    await document.documentElement.requestFullscreen();
                                    setIsFullscreen(true);
                                } catch { /* user denied */ }
                            }}
                            className="px-8 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition text-lg"
                        >
                            Enter Fullscreen
                        </button>
                    </div>
                </div>
            )}

            {/* Anti-cheat status indicator (bottom-right) */}
            {contestId && (
                <div className="fixed bottom-4 right-4 z-[9990] flex items-center gap-2 bg-white/80 backdrop-blur border border-slate-200 rounded-xl px-3 py-2 shadow-lg text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    <div className={`w-2 h-2 rounded-full ${isDisqualified ? 'bg-red-500' :
                        isFlagged ? 'bg-amber-500 animate-pulse' :
                            'bg-emerald-500'
                        } shadow-[0_0_6px_currentColor]`} />
                    {isDisqualified ? 'LOCKED' : isFlagged ? 'FLAGGED' : 'PROCTORED'}
                    {totalViolations > 0 && (
                        <span className={`ml-1 px-1.5 py-0.5 rounded text-white text-[9px] ${totalViolations >= 5 ? 'bg-red-500' :
                            totalViolations >= 3 ? 'bg-amber-500' :
                                'bg-slate-400'
                            }`}>
                            {totalViolations}
                        </span>
                    )}
                </div>
            )}

            {/* Main content */}
            {children}
        </div>
    );
}
