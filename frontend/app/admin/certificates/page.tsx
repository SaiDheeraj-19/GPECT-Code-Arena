"use client";

/**
 * Admin Certificate Template Designer
 *
 * Live preview + customization of certificate template.
 * Admins can tweak every aspect of the certificate before issuing.
 * Changes persist via localStorage and are sent to the backend
 * when finalizing a contest.
 */

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import {
    Award,
    Type,
    Palette,
    Save,
    FileText,
    Eye,
    CheckCircle2,
    ArrowLeft,
    RotateCcw,
    Image as ImageIcon,
    Settings2,
    Star,
    Shield,
    Trophy,
    Medal
} from "lucide-react";
import { useRouter } from "next/navigation";

// ── Default template settings ──
const DEFAULT_TEMPLATE = {
    // Header
    collegeName: "G. Pullaiah College of Engineering & Technology",
    departmentName: "Department of Computer Science & Engineering",
    platformName: "GPCET CodeArena",

    // Certificate Titles per type
    titles: {
        GOLD: "CERTIFICATE OF EXCELLENCE",
        SILVER: "CERTIFICATE OF DISTINCTION",
        BRONZE: "CERTIFICATE OF ACHIEVEMENT",
        MERIT: "CERTIFICATE OF MERIT",
        PARTICIPATION: "CERTIFICATE OF PARTICIPATION",
    } as Record<string, string>,

    // Colors (hex)
    colors: {
        GOLD: "#DAA520",
        SILVER: "#A9A9A9",
        BRONZE: "#CD7F32",
        MERIT: "#4B0082",
        PARTICIPATION: "#008080",
    } as Record<string, string>,

    // Body text
    bodyPrefix: "This certificate is proudly awarded to",
    achievementPrefix: "for achieving",
    contestPrefix: "in",
    scorePrefix: "with a score of",

    // Footer
    signatureTitle: "Head of Department",
    signatureSubtitle: "CSE, GPCET",
    footerText: "This is a computer-generated certificate.",

    // Style
    borderStyle: "double" as "double" | "single" | "ornate",
    showQRCode: true,
    showIntegrityHash: true,
    showLogo: true,

    // Background
    bgColor: "#FEFCF8",
    textColor: "#0F172A",
    subtextColor: "#64748B",
};

type TemplateSettings = typeof DEFAULT_TEMPLATE;

const STORAGE_KEY = "gpcet_cert_template";

// ── Certificate type selector options ──
const CERT_TYPES = [
    { key: "GOLD", label: "Gold (1st)", Icon: Trophy },
    { key: "SILVER", label: "Silver (2nd)", Icon: Medal },
    { key: "BRONZE", label: "Bronze (3rd)", Icon: Award },
    { key: "MERIT", label: "Merit (Top 10%)", Icon: Star },
    { key: "PARTICIPATION", label: "Participation", Icon: CheckCircle2 },
];

export default function CertificateTemplatePage() {
    const router = useRouter();
    const [template, setTemplate] = useState<TemplateSettings>(DEFAULT_TEMPLATE);
    const [previewType, setPreviewType] = useState("GOLD");
    const [saved, setSaved] = useState(false);
    const [activeTab, setActiveTab] = useState<"header" | "body" | "style" | "footer">("header");

    // Load saved template
    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setTemplate({ ...DEFAULT_TEMPLATE, ...parsed });
            } catch { }
        }
    }, []);

    // Update a field
    const update = useCallback((path: string, value: string | boolean) => {
        setTemplate((prev) => {
            const next = { ...prev };
            const keys = path.split(".");
            let obj: Record<string, unknown> = next;
            for (let i = 0; i < keys.length - 1; i++) {
                obj[keys[i]] = { ...(obj[keys[i]] || {}) };
                obj = obj[keys[i]] as Record<string, unknown>;
            }
            obj[keys[keys.length - 1]] = value;
            return next;
        });
        setSaved(false);
    }, []);

    // Save to localStorage
    const saveTemplate = () => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(template));
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    // Reset to defaults
    const resetTemplate = () => {
        if (!confirm("Reset all certificate template settings to defaults?")) return;
        setTemplate(DEFAULT_TEMPLATE);
        localStorage.removeItem(STORAGE_KEY);
    };

    const currentColor = template.colors[previewType] || "#DAA520";

    return (
        <div className="min-h-screen bg-[#FDFDFD] dark:bg-[#0a0a0b] font-sans text-slate-900 dark:text-slate-100 transition-colors duration-500">
            {/* Top Bar */}
            <div className="bg-white/80 dark:bg-[#0a0a0b]/80 border-b border-slate-200 dark:border-white/10 px-6 py-4 sticky top-0 z-30 backdrop-blur-md transition-colors">
                <div className="max-w-[1400px] mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.push("/admin/dashboard")}
                            className="p-2 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-white transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-white/5"
                        >
                            <ArrowLeft size={18} />
                        </button>
                        <div>
                            <h1 className="text-lg font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2 transition-colors">
                                <FileText size={18} className="text-indigo-500 dark:text-indigo-400" />
                                Certificate Template Designer
                            </h1>
                            <p className="text-xs text-slate-500 dark:text-slate-400 transition-colors">
                                Customize how certificates appear before issuing
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={resetTemplate}
                            className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white px-4 py-2.5 border border-slate-200 dark:border-white/10 rounded-xl transition-colors hover:bg-slate-50 dark:hover:bg-white/5"
                        >
                            <RotateCcw size={14} />
                            Reset
                        </button>
                        <button
                            onClick={saveTemplate}
                            className="flex items-center gap-2 text-xs font-bold text-white bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700 dark:hover:bg-indigo-600 px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-indigo-600/10 dark:shadow-indigo-500/10 active:scale-95"
                        >
                            {saved ? <CheckCircle2 size={14} /> : <Save size={14} />}
                            {saved ? "Saved!" : "Save Template"}
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-[1400px] mx-auto p-6">
                <div className="grid grid-cols-1 xl:grid-cols-[380px_1fr] gap-6">
                    {/* ═══════════════════════════════════ */}
                    {/* LEFT: Controls Panel                */}
                    {/* ═══════════════════════════════════ */}
                    <div className="space-y-4">
                        {/* Preview Type Selector */}
                        <div className="bg-white dark:bg-[#0a0a0b] border border-slate-200 dark:border-white/10 rounded-2xl p-4 shadow-sm transition-colors">
                            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 transition-colors">
                                Preview Certificate Type
                            </p>
                            <div className="grid grid-cols-5 gap-1.5">
                                {CERT_TYPES.map((t) => (
                                    <button
                                        key={t.key}
                                        onClick={() => setPreviewType(t.key)}
                                        className={`py-2.5 rounded-xl text-center text-lg transition-all ${previewType === t.key
                                            ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-lg scale-105"
                                            : "bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-600 dark:text-slate-400"
                                            }`}
                                        title={t.label}
                                    >
                                        <t.Icon size={20} className="mx-auto" />
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Settings Tabs */}
                        <div className="bg-white dark:bg-[#0a0a0b] border border-slate-200 dark:border-white/10 rounded-2xl shadow-sm overflow-hidden transition-colors">
                            <div className="flex border-b border-slate-100 dark:border-white/5">
                                {([
                                    { key: "header", label: "Header", icon: <ImageIcon size={14} /> },
                                    { key: "body", label: "Body", icon: <Type size={14} /> },
                                    { key: "style", label: "Style", icon: <Palette size={14} /> },
                                    { key: "footer", label: "Footer", icon: <Settings2 size={14} /> },
                                ] as const).map((tab) => (
                                    <button
                                        key={tab.key}
                                        onClick={() => setActiveTab(tab.key)}
                                        className={`flex-1 py-3 text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors ${activeTab === tab.key
                                            ? "text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400 bg-indigo-50/50 dark:bg-indigo-500/10"
                                            : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
                                            }`}
                                    >
                                        {tab.icon}
                                        {tab.label}
                                    </button>
                                ))}
                            </div>

                            <div className="p-5 space-y-4 max-h-[460px] overflow-y-auto">
                                {activeTab === "header" && (
                                    <>
                                        <FieldInput
                                            label="College Name"
                                            value={template.collegeName}
                                            onChange={(v) => update("collegeName", v)}
                                        />
                                        <FieldInput
                                            label="Department Name"
                                            value={template.departmentName}
                                            onChange={(v) => update("departmentName", v)}
                                        />
                                        <FieldInput
                                            label="Platform Name"
                                            value={template.platformName}
                                            onChange={(v) => update("platformName", v)}
                                        />
                                        {CERT_TYPES.map((t) => (
                                            <FieldInput
                                                key={t.key}
                                                label={`${t.key} Title`}
                                                value={template.titles[t.key]}
                                                onChange={(v) => update(`titles.${t.key}`, v)}
                                            />
                                        ))}
                                    </>
                                )}

                                {activeTab === "body" && (
                                    <>
                                        <FieldInput
                                            label="Body Prefix"
                                            value={template.bodyPrefix}
                                            onChange={(v) => update("bodyPrefix", v)}
                                            hint="Text before student name"
                                        />
                                        <FieldInput
                                            label="Achievement Prefix"
                                            value={template.achievementPrefix}
                                            onChange={(v) => update("achievementPrefix", v)}
                                            hint="Text before rank"
                                        />
                                        <FieldInput
                                            label="Contest Prefix"
                                            value={template.contestPrefix}
                                            onChange={(v) => update("contestPrefix", v)}
                                            hint='e.g., "in"'
                                        />
                                        <FieldInput
                                            label="Score Prefix"
                                            value={template.scorePrefix}
                                            onChange={(v) => update("scorePrefix", v)}
                                            hint='e.g., "with a score of"'
                                        />
                                    </>
                                )}

                                {activeTab === "style" && (
                                    <>
                                        <div className="space-y-3 transition-colors">
                                            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                                                Medal Colors
                                            </p>
                                            {CERT_TYPES.map((t) => (
                                                <div key={t.key} className="flex items-center gap-3">
                                                    <span className="text-sm w-6 text-slate-400 dark:text-slate-500 flex justify-center"><t.Icon size={14} /></span>
                                                    <input
                                                        type="color"
                                                        value={template.colors[t.key]}
                                                        onChange={(e) => update(`colors.${t.key}`, e.target.value)}
                                                        className="w-10 h-8 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 cursor-pointer"
                                                    />
                                                    <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                                                        {template.colors[t.key]}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                        <hr className="border-slate-100 dark:border-white/5" />
                                        <div className="flex items-center gap-3 transition-colors">
                                            <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Background</span>
                                            <input
                                                type="color"
                                                value={template.bgColor}
                                                onChange={(e) => update("bgColor", e.target.value)}
                                                className="w-10 h-8 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 cursor-pointer"
                                            />
                                        </div>
                                        <div className="flex items-center gap-3 transition-colors">
                                            <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Text Color</span>
                                            <input
                                                type="color"
                                                value={template.textColor}
                                                onChange={(e) => update("textColor", e.target.value)}
                                                className="w-10 h-8 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 cursor-pointer"
                                            />
                                        </div>
                                        <hr className="border-slate-100 dark:border-white/5" />
                                        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest transition-colors">
                                            Border Style
                                        </p>
                                        <div className="flex gap-2 transition-colors">
                                            {(["double", "single", "ornate"] as const).map((s) => (
                                                <button
                                                    key={s}
                                                    onClick={() => update("borderStyle", s)}
                                                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold capitalize transition-colors ${template.borderStyle === s
                                                        ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md"
                                                        : "bg-slate-50 dark:bg-white/5 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10"
                                                        }`}
                                                >
                                                    {s}
                                                </button>
                                            ))}
                                        </div>
                                        <hr className="border-slate-100 dark:border-white/5" />
                                        <Toggle
                                            label="Show QR Code"
                                            checked={template.showQRCode}
                                            onChange={(v) => update("showQRCode", v)}
                                        />
                                        <Toggle
                                            label="Show Integrity Hash"
                                            checked={template.showIntegrityHash}
                                            onChange={(v) => update("showIntegrityHash", v)}
                                        />
                                        <Toggle
                                            label="Show College Logo"
                                            checked={template.showLogo}
                                            onChange={(v) => update("showLogo", v)}
                                        />
                                    </>
                                )}

                                {activeTab === "footer" && (
                                    <>
                                        <FieldInput
                                            label="Signature Title"
                                            value={template.signatureTitle}
                                            onChange={(v) => update("signatureTitle", v)}
                                        />
                                        <FieldInput
                                            label="Signature Subtitle"
                                            value={template.signatureSubtitle}
                                            onChange={(v) => update("signatureSubtitle", v)}
                                        />
                                        <FieldInput
                                            label="Footer Text"
                                            value={template.footerText}
                                            onChange={(v) => update("footerText", v)}
                                        />
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ═══════════════════════════════════ */}
                    {/* RIGHT: Live Certificate Preview     */}
                    {/* ═══════════════════════════════════ */}
                    <div>
                        <div className="bg-white dark:bg-[#0a0a0b] border border-slate-200 dark:border-white/10 rounded-2xl shadow-sm overflow-hidden transition-colors">
                            <div className="px-5 py-3 border-b border-slate-100 dark:border-white/10 flex items-center justify-between transition-colors">
                                <div className="flex items-center gap-2">
                                    <Eye size={14} className="text-indigo-500 dark:text-indigo-400" />
                                    <span className="text-xs font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider transition-colors">
                                        Live Preview
                                    </span>
                                </div>
                                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-white/5 px-3 py-1 rounded-full transition-colors">
                                    {CERT_TYPES.find((t) => t.key === previewType)?.label}
                                </span>
                            </div>

                            <div className="p-6 flex justify-center">
                                <CertificatePreview
                                    template={template}
                                    type={previewType}
                                    color={currentColor}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════
// LIVE CERTIFICATE PREVIEW COMPONENT
// ═══════════════════════════════════════════
function CertificatePreview({
    template,
    type,
    color,
}: {
    template: TemplateSettings;
    type: string;
    color: string;
}) {
    const title = template.titles[type] || "CERTIFICATE";
    const certConfig = CERT_TYPES.find((t) => t.key === type);
    const Icon = certConfig?.Icon || Trophy;

    // Sample data
    const sampleName = "Admin";
    const sampleRoll = "21R11A0582";
    const sampleContest = "GPCET Weekly Coding Sprint #12";
    const sampleRank = type === "GOLD" ? 1 : type === "SILVER" ? 2 : type === "BRONZE" ? 3 : type === "MERIT" ? 7 : 25;
    const sampleScore = type === "GOLD" ? 450 : type === "SILVER" ? 420 : type === "BRONZE" ? 395 : type === "MERIT" ? 310 : 150;
    const sampleCode = "GPCET-2026-A3F8B1D2";

    // Border styles
    const borderClass =
        template.borderStyle === "ornate"
            ? "border-[3px] shadow-inner"
            : template.borderStyle === "double"
                ? "border-[3px] ring-1 ring-offset-4"
                : "border-2";

    return (
        <div
            className={`relative w-full max-w-[700px] aspect-[1.414/1] rounded-xl overflow-hidden ${borderClass}`}
            style={{
                backgroundColor: template.bgColor,
                borderColor: color,
            }}
        >
            {/* Top accent line */}
            <div className="absolute top-0 left-0 right-0 h-2" style={{ backgroundColor: color }} />
            {/* Bottom accent line */}
            <div className="absolute bottom-0 left-0 right-0 h-2" style={{ backgroundColor: color }} />

            {/* Inner border (double effect) */}
            {template.borderStyle === "double" && (
                <div
                    className="absolute inset-3 border rounded-lg pointer-events-none"
                    style={{ borderColor: `${color}60` }}
                />
            )}

            {/* Ornate corners */}
            {template.borderStyle === "ornate" && (
                <>
                    {[
                        "top-3 left-3",
                        "top-3 right-3",
                        "bottom-3 left-3",
                        "bottom-3 right-3",
                    ].map((pos) => (
                        <div
                            key={pos}
                            className={`absolute ${pos} w-5 h-5 border-2 rounded-sm pointer-events-none`}
                            style={{ borderColor: color }}
                        />
                    ))}
                </>
            )}

            {/* Content */}
            <div className="relative z-10 flex flex-col items-center justify-center h-full px-8 py-6 text-center">
                {/* Logo */}
                {template.showLogo && (
                    <Image
                        src="/college-logo.png"
                        alt="College Logo"
                        width={100}
                        height={56}
                        className="h-14 w-auto object-contain mb-1"
                    />
                )}

                {/* College Name */}
                <p
                    className="text-[10px] font-bold"
                    style={{ color: template.textColor }}
                >
                    {template.collegeName}
                </p>
                <p
                    className="text-[8px]"
                    style={{ color: template.subtextColor }}
                >
                    {template.departmentName}
                </p>

                {/* Divider */}
                <div className="flex items-center gap-3 w-40 my-3">
                    <div className="flex-1 h-px" style={{ backgroundColor: `${color}40` }} />
                    <div
                        className="w-2 h-2 rotate-45"
                        style={{ backgroundColor: color }}
                    />
                    <div className="flex-1 h-px" style={{ backgroundColor: `${color}40` }} />
                </div>

                {/* Title */}
                <h2
                    className="text-base sm:text-lg font-black tracking-[0.15em] mb-1"
                    style={{ color }}
                >
                    {title}
                </h2>

                {/* Body Prefix */}
                <p
                    className="text-[9px] mt-2"
                    style={{ color: template.subtextColor }}
                >
                    {template.bodyPrefix}
                </p>

                {/* Student Name */}
                <h3
                    className="text-xl sm:text-2xl font-black mt-1"
                    style={{ color: template.textColor }}
                >
                    {sampleName}
                </h3>
                <p className="text-[8px] font-mono mt-0.5" style={{ color: template.subtextColor }}>
                    Roll No: {sampleRoll}
                </p>

                {/* Achievement */}
                <p className="text-[9px] mt-2" style={{ color: template.subtextColor }}>
                    {template.achievementPrefix}
                </p>
                <div className="text-sm font-black mt-0.5 flex items-center justify-center gap-2" style={{ color }}>
                    Rank #{sampleRank} <Icon size={14} />
                </div>
                <p className="text-[9px] mt-1" style={{ color: template.subtextColor }}>
                    {template.contestPrefix} &quot;{sampleContest}&quot;
                </p>
                <p className="text-[8px]" style={{ color: template.subtextColor }}>
                    {template.scorePrefix} {sampleScore} points
                </p>
                <p className="text-[7px] mt-0.5" style={{ color: `${template.subtextColor}80` }}>
                    held on 22 February 2026
                </p>

                {/* Divider */}
                <div className="flex items-center gap-3 w-40 my-3">
                    <div className="flex-1 h-px" style={{ backgroundColor: `${color}40` }} />
                    <Star size={8} style={{ color }} />
                    <div className="flex-1 h-px" style={{ backgroundColor: `${color}40` }} />
                </div>

                {/* Bottom: QR + Verification + Signature */}
                <div className="w-full flex items-end justify-between px-4 mt-auto">
                    {/* QR placeholder */}
                    {template.showQRCode && (
                        <div className="flex flex-col items-center">
                            <div className="w-12 h-12 bg-slate-100 dark:bg-white/5 rounded-lg flex items-center justify-center border border-slate-200 dark:border-white/10 transition-colors">
                                <Shield size={16} className="text-slate-400 dark:text-slate-500" />
                            </div>
                            <span className="text-[6px] text-slate-400 dark:text-slate-500 mt-1 transition-colors">Scan to verify</span>
                        </div>
                    )}

                    {/* Center: code + hash */}
                    <div className="text-center flex-1">
                        <p className="text-[7px]" style={{ color: template.subtextColor }}>
                            Verification Code
                        </p>
                        <p className="text-[9px] font-black font-mono" style={{ color: template.textColor }}>
                            {sampleCode}
                        </p>
                        {template.showIntegrityHash && (
                            <p className="text-[6px] font-mono mt-0.5" style={{ color: `${template.subtextColor}60` }}>
                                Integrity: A3F8B1D2E7C0
                            </p>
                        )}
                        <p className="text-[7px] mt-1" style={{ color: template.subtextColor }}>
                            Issued: 22 February 2026
                        </p>
                    </div>

                    {/* Signature */}
                    <div className="text-center w-28">
                        <div className="h-px bg-slate-200 dark:bg-white/10 mb-1 mx-2 transition-colors" />
                        <p className="text-[7px]" style={{ color: template.subtextColor }}>
                            {template.signatureTitle}
                        </p>
                        <p className="text-[6px]" style={{ color: `${template.subtextColor}80` }}>
                            {template.signatureSubtitle}
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <p className="text-[5px] mt-2" style={{ color: `${template.subtextColor}50` }}>
                    {template.footerText}
                </p>
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════
// REUSABLE: Text field input
// ═══════════════════════════════════════════
function FieldInput({
    label,
    value,
    onChange,
    hint,
}: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    hint?: string;
}) {
    return (
        <div className="space-y-1 transition-colors">
            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block transition-colors">
                {label}
            </label>
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-xl px-3 py-2 text-sm font-medium text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
            />
            {hint && (
                <p className="text-[9px] text-slate-400 dark:text-slate-500 italic transition-colors">{hint}</p>
            )}
        </div>
    );
}

// ═══════════════════════════════════════════
// REUSABLE: Toggle switch
// ═══════════════════════════════════════════
function Toggle({
    label,
    checked,
    onChange,
}: {
    label: string;
    checked: boolean;
    onChange: (v: boolean) => void;
}) {
    return (
        <div className="flex items-center justify-between transition-colors">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400 transition-colors">{label}</span>
            <button
                onClick={() => onChange(!checked)}
                className={`w-10 h-6 rounded-full transition-all relative ${checked ? "bg-indigo-600 dark:bg-indigo-500" : "bg-slate-200 dark:bg-white/10"
                    }`}
            >
                <div
                    className={`w-4 h-4 rounded-full bg-white dark:bg-slate-200 shadow-md absolute top-1 transition-all ${checked ? "left-5" : "left-1"
                        }`}
                />
            </button>
        </div>
    );
}
