# 🚀 GPCET Code Arena 
**The Next-Generation Sandboxed Coding Assessment Platform**

[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js&style=for-the-badge)](https://nextjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-Express-339933?logo=node.js&style=for-the-badge)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript&style=for-the-badge)](https://www.typescriptlang.org/)
[![Docker](https://img.shields.io/badge/Docker-Sandbox-2496ED?logo=docker&style=for-the-badge)](https://www.docker.com/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma&style=for-the-badge)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-DB-4169E1?logo=postgresql&style=for-the-badge)](https://www.postgresql.org/)

<p align="center">
  A highly secure, proctored coding assessment platform engineered explicitly for <b>GPCET</b>. Featuring authentic Docker-based code isolation, military-grade anti-cheat telemetry, and a devastatingly beautiful high-performance UI.
</p>

---

## ✨ Core Pillars

### 🛡️ Iron-Clad Anti-Cheat Engine
- **Telemetry Logging:** Automatically captures and analyzes suspicious browser behavior.
- **Proctored Lockdown:** Disables copy-paste, right-click, and restricted keyboard shortcuts.
- **Smart-Track Warnings:** Real-time flagging for tab-switching and window blurring.
- **Fullscreen Enforcement:** Forces student environment persistence throughout the exam.

### 🐳 Secure Execution (Docker Sandboxing)
- **Zero-Trust Environment:** Code executes inside transient, isolated Docker containers.
- **Resource Guardrails:** 
  - ⏳ `2.0s` Execution Timeout
  - 💾 `256MB` RAM Allocation 
  - 🌐 `--network none` (Total internet isolation)
- **Language Support:** Optimized runtimes for `C++`, `Python 3`, and `JavaScript`.

### 🏆 Advanced Admin Dashboard
- **Live Contest Management:** Start weekly contests, add questions dynamically, and track live leaderboards.
- **Security Triage:** Real-time monitoring of security violations across all active sessions.
- **Student Analytics:** View deep-dive performance metrics and submission histories.
- **Master Reset:** High-entropy password rotation system for absolute administrative control.

---

## 🛠️ Technology Stack

| Layer | Technology | Purpose |
| --- | --- | --- |
| **Frontend** | Next.js 14, TailwindCSS, Framer Motion | SSR, layout, glassmorphic styling |
| **Backend** | Node.js, Express, TypeScript | High-concurrency RESTful API |
| **Database** | PostgreSQL, Prisma ORM | Relational data persistence & migrations |
| **Engine** | Docker | Sandboxing untrusted code securely |
| **Security** | JWT, bcrypt, Rate Limiting | Stateless auth & brute-force protection |

---

## 🚀 Deployment Guide

### 1. Backend Configuration
Navigate to the engine directory:
```bash
cd backend
```

Configure `.env`:
```env
ADMIN_EMAIL=your-admin@gpcet.ac.in
ADMIN_PASSWORD=your-secure-password
DATABASE_URL="postgresql://user:password@localhost:5432/gpcet_db"
JWT_SECRET="generate-a-32-char-secret"
PORT=5050
```

**Build Submissions Runner:**
```bash
cd dockerRunner && docker build -t gpcet-runner . && cd ..
```

**Initialize Database:**
```bash
npm install
npx prisma db push
npm run db:seed
```

### 2. Frontend Ignition
```bash
cd frontend
```

Configure `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:5050/api
```

**Start Portal:**
```bash
npm install
npm run dev
```

---

## 🔐 Authentication Ecosystem

1. **The Founder Access:** 
   Log in with the `ADMIN_EMAIL` and `ADMIN_PASSWORD` defined in your environment to unlock the Master Dashboard.
2. **Student Access:** 
   Students authenticate using institutional identifiers (e.g. `24ATA05269`). Standard initial access requires a password change for permanent security.

---

<div align="center">
  <i>Developed with ❤️ for GPCET. Built for scale, security, and elegance.</i>
</div>
