# 🏘️ Hệ thống Quản lý Thông minh Khu phố 3 An Phú

[![Deploy](https://img.shields.io/badge/deploy-vercel-black?logo=vercel)](https://bdhkp3.vercel.app)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue?logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61dafb?logo=react)](https://react.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green?logo=supabase)](https://supabase.com/)
[![Vite](https://img.shields.io/badge/Vite-6-646cff?logo=vite)](https://vite.dev/)

**Cổng Dịch vụ Cư dân số & Hệ thống Quản lý Thông minh** cho Khu phố 3, Phường An Phú, TP. Hồ Chí Minh.

---

## 📊 Quy mô dữ liệu thực tế

| Chỉ số | Giá trị |
|--------|---------|
| Nhân khẩu | **11.632 người** (2.076 thường trú + 9.556 tạm trú) |
| Hộ gia đình | **488 hộ** số hóa hoàn toàn |
| Cơ sở kinh doanh | **118 cơ sở** (108 nhà trọ, 7 doanh nghiệp) |
| Cơ sở lưu trú | 108 nhà trọ • 553 phòng |

---

## 🚀 Khởi chạy dự án

```bash
# Cài đặt dependencies
npm install

# Chạy local dev server
npm run dev

# Chạy kiểm thử (Vitest — Công cụ #23)
npm run test

# Kiểm tra TypeScript
npm run lint

# Build production
npm run build
```

## 🐍 Python Scripts

```bash
# Cài môi trường Python (uv — Công cụ #04)
pip install uv
uv venv .venv
uv pip install -r scripts/requirements.txt

# Chạy Python tests (pytest — Công cụ #22)
pytest scripts/tests/

# Lint Python (Ruff — Công cụ #21)
ruff check scripts/
```

---

## 🏗️ Kiến trúc hệ thống

```
src/
├── App.tsx                     # Entry point, data loading + routing
├── components/
│   ├── Dashboard.tsx           # Tổng quan số liệu thực tế
│   ├── CitizenManagement.tsx   # Quản lý 11.632 nhân khẩu
│   ├── HouseholdManagement.tsx # Sổ hộ khẩu 488 hộ
│   ├── BusinessManagement.tsx  # 118 cơ sở kinh doanh
│   ├── CitizenLandingPage.tsx  # Cổng cư dân số (công khai)
│   ├── GisMap.tsx              # Bản đồ số GIS (Leaflet)
│   ├── AiAssistant.tsx         # Trợ lý AI Gemini 2.5 Flash
│   └── ...
├── utils/
│   ├── householdRecognitionUtils.ts  # Thuật toán nhận diện hộ & phả hệ
│   └── __tests__/                    # Vitest unit tests
├── lib/supabase.ts             # Supabase client
└── types.ts                    # TypeScript types

api/
└── chat.ts                     # Serverless AI chat (Vercel Function)

scripts/                        # Python automation scripts
├── extract_hostels.py          # Bóc tách cơ sở nhà trọ
├── inspect_columns.py          # Kiểm tra cột dữ liệu Excel
└── requirements.txt            # Python dependencies
```

---

## 🔧 Công cụ phát triển (30 tools tích hợp)

### Nhóm 1 — Nền tảng
- **Git** — Version control + Conventional Commits
- **Node.js LTS** — Runtime chính
- **Python 3.11+** — Scripts automation
- **uv** — Python package manager nhanh
- **GitHub CLI** — Quản lý repo & issues
- **Docker** — Containerization (dev + prod)

### Nhóm 2 — Skills & AI
- **SKILL.md** — Agent skills cho dự án
- **Rules** — `AGENTS.md` + `.agents/rules/`
- **UI UX Pro Max** — Design system
- **planning-with-files** — `docs/ROADMAP.md`

### Nhóm 3 — MCP Servers
- **Supabase MCP** — Database management ✅
- **Vercel MCP** — Deployment management ✅
- **Context7** — Tài liệu thư viện
- **GitHub MCP** — Issue & PR automation
- **Playwright MCP** — E2E test automation
- **Chrome DevTools MCP** — Performance audit
- **Firecrawl MCP** — Web scraping pháp lý

### Nhóm 4 — Chất lượng mã
- **ESLint** — `eslint.config.js` ✅
- **Prettier** — `.prettierrc` ✅
- **Ruff** — `pyproject.toml` ✅
- **pytest** — `scripts/tests/` ✅
- **Vitest** — `src/**/__tests__/` ✅
- **Gitleaks** — `.gitleaks.toml` ✅

### Nhóm 5 — Năng suất
- **Repomix** — `repomix.config.json`
- **Postman/Bruno** — `bruno/` API collection
- **DBeaver** — PostgreSQL admin
- **GitLens** — `.vscode/settings.json`

---

## 🔐 Bảo mật

- RLS bật 100% trên 8 bảng Supabase
- Secrets quản lý qua `.env.local` (không commit)
- Gitleaks scan tự động trước commit
- Phân quyền 3 tầng: Anon → Staff → Admin

---

## 🌐 Production

| Môi trường | URL |
|-----------|-----|
| Production | [https://bdhkp3.vercel.app](https://bdhkp3.vercel.app) |
| Local Dev | http://localhost:3000 |

**Deploy:**
```bash
npx vercel --prod --yes --token <VERCEL_TOKEN>
```

---

*Ban Điều hành Khu phố 3, Phường An Phú, TP. Hồ Chí Minh — 2026*
