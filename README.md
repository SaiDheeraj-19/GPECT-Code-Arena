<div align="center">

# 🚀 GPCET Code Arena 
**The Next-Generation Sandboxed Coding Assessment Platform**

[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js&style=for-the-badge)](https://nextjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-Express-339933?logo=node.js&style=for-the-badge)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript&style=for-the-badge)](https://www.typescriptlang.org/)
[![Docker](https://img.shields.io/badge/Docker-Sandbox-2496ED?logo=docker&style=for-the-badge)](https://www.docker.com/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma&style=for-the-badge)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-DB-4169E1?logo=postgresql&style=for-the-badge)](https://www.postgresql.org/)

<p align="center">
  A highly secure, investor-ready coding assessment platform engineered explicitly for <b>GPCET</b>. Featuring true Docker-based code isolation, military-grade anti-cheat systems, and a devastatingly beautiful glowing UI.
</p>

</div>

---

## ✨ Features That Set Us Apart

### 🛡️ Iron-Clad Anti-Cheat Engine (Student Arena)
- **Zero-Tolerance Policy:** Automatically detects and logs suspicious activity.
- **Strict Lockdown:** Disables `Ctrl+C`, `Ctrl+V`, `Right-Click`, and limits context menus.
- **Tab Switching Analytics:** Flags users who blur the window or switch tabs. Exceeding 3 warnings triggers an auto-submission.
- **Fullscreen Enforcement:** Requires test-takers to remain in fullscreen mode for the duration of the assessment.

### 🐳 True Docker Sandboxing
- **Secure Execution:** Submissions never run on the host system. They are dynamically spun up in short-lived Docker containers.
- **Hard Quotas:** 
  - ⏳ `2.0s` absolute Time Limit Constraint
  - 💾 `256MB` Memory Limit 
  - 🌐 `--network none` (Total internet blackout for the executing code to prevent external API calls)
- **Multi-Language Support:** Instant support for `C++`, `Python 3`, and `JavaScript`.

### 🥷 Role-Based Architecture
- **Automatic Master Admin:** The founder's email gracefully triggers an internal override, turning their portal into an all-access Admin Dashboard.
- **Student Roll Validations:** Students cannot randomly sign up; they must pass rigorous Regex identifier checks (e.g., `24ATA05123`).
- **Dynamic JWT Filtering:** Next-level role checks ensure students can never access the hidden test cases—only the master admin can manage those.

### 🎨 State-of-the-Art Aesthetic
- **Neon-Drenched Dark Mode:** Inspired layout combining deep navy backgrounds (`#0f172a`), heavy glassmorphism, and neon-green accents (`#22c55e`).
- **Smooth Animations:** Powered by `framer-motion` for buttery routing and modal transitions.
- **Split-Screen Editor:** Real-time Monaco editor running alongside robust Markdown-based problem describer.

---

## 🛠️ Technology Stack

| Layer | Technology | Purpose |
| --- | --- | --- |
| **Frontend** | Next.js 14, TailwindCSS, Framer Motion | SSR, layout, glowing styling, animations |
| **Core UI** | Shadcn UI, Monaco Editor | Unstyled premium components & VSCode-like editor |
| **Backend** | Node.js, Express, TypeScript | RESTful API structure mapped via fast robust endpoints |
| **Database** | PostgreSQL, Prisma ORM | Relational structures for Logs, Problems, Submissions |
| **Engine** | Docker | Sandboxing untrusted code safely |
| **Security** | JWT, bcrypt, Rate Limiting | Stateless authenticated sessions, salted passwords, flood prevention |

---

## 🚀 Quick Start Guide

### 1. Database & Sandbox Configuration (Backend)
Navigate to the central nervous system:
\`\`\`bash
cd backend
\`\`\`

Populate your `.env`:
\`\`\`env
ADMIN_EMAIL=founder@codearena.gpcet.ac.in
DATABASE_URL="postgresql://user:password@localhost:5432/gpcet_db?schema=public"
JWT_SECRET="YOUR_SUPER_SECRET_STRING!"
PORT=5000
\`\`\`

**CRITICAL:** Build the execution container image (required for code processing)
\`\`\`bash
cd dockerRunner && docker build -t gpcet-runner . && cd ..
\`\`\`

Generate Schema & Seed the Master Admin:
\`\`\`bash
npm install
npx prisma generate
npx prisma db push
npm run prisma.seed
\`\`\`

Fire up the engine:
\`\`\`bash
npm run dev
\`\`\`

### 2. Ignition (Frontend)
Move to the user-facing portal:
\`\`\`bash
cd frontend
\`\`\`

Feed the `.env.local`:
\`\`\`env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
\`\`\`

Boot the arena:
\`\`\`bash
npm install
npm run dev
\`\`\`

---

## 🔐 Authentication Ecosystem

1. **The Founder Login:** 
   Log in with the pre-configured admin email and secure password defined in your `.env` to automatically be hoisted to the Master Admin Dashboard.
2. **Student Entry:** 
   Students register and login using their unique standard identifiers (e.g. `24ATA[0-9A-Z]{5}`), requiring a universal first-time setup before being forced to permanently update it.

---

<div align="center">
  <i>Developed with ❤️ for GPCET. Built for scale, security, and elegance.</i>
</div>
