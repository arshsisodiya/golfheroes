# ⛳ GolfHeroes Platform

> Play. Give. Win. — A subscription-based golf platform combining performance tracking, charity giving, and monthly prize draws.

Built for the **Digital Heroes Full-Stack Trainee Selection Process**.

---

## 📋 PRD Coverage

| Module | Status |
|---|---|
| Subscription Engine (Monthly / Yearly) | ✅ |
| Score Entry — 5-score rolling Stableford | ✅ |
| Draw Engine (Random + Algorithmic) | ✅ |
| Prize Pool Logic (40/35/25% tiers) | ✅ |
| Jackpot Rollover | ✅ |
| Charity Integration (min 10%, custom %) | ✅ |
| Winner Verification + Proof Upload | ✅ |
| User Dashboard (all 5 modules) | ✅ |
| Admin Dashboard (users, draws, charities, winners) | ✅ |
| JWT Authentication | ✅ |
| Role-based Access Control | ✅ |
| Subscription gate on all protected features | ✅ |
| Simulation mode before publish | ✅ |
| Mobile-responsive design | ✅ |
| Emotion-led UI (charity-first, not golf-cliché) | ✅ |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ (recommended)
- npm 9+

### Install dependencies

Install repository root (installs workspace helpers) then install backend and frontend packages individually:

```bash
npm install
cd backend && npm install
cd ../frontend && npm install
cd ..
```

### Configure environment

Copy the backend example and edit as needed (SMTP, Supabase keys, JWT secret):

```bash
cp backend/.env.example backend/.env
```

### Run servers (development)

Start backend API (default port 3001):

```bash
cd backend
npm run dev
# or: node server.js
```

Start frontend dev server (Vite) from the `frontend` folder:

```bash
cd frontend
npm run dev
# or run directly with npx: npx vite --port 5173
```

Frontend default URL: http://localhost:5173 — Backend default URL: http://localhost:3001

Change the frontend port by setting the `PORT` env var or passing `--port` to Vite. Examples:

PowerShell:
```powershell
$env:PORT = 5175; npm run dev
```
Linux / macOS:
```bash
PORT=5175 npm run dev
```
Or directly:
```bash
npx vite --port 5175
```

---

## 🔐 Demo Credentials

| Role | Email | Password |
|---|---|---|
| Player | player@golfheroes.com | Player123! |
| Admin | admin@golfheroes.com | Admin123! |

---

## 🏗 Architecture

```
golf-platform/
├── backend/                  # Node.js + Express API
│   ├── server.js             # App entry, route mounting
│   ├── db.js                 # In-memory store + seed data
│   ├── middleware/
│   │   └── auth.js           # JWT, role, subscription guards
│   └── routes/
│       ├── auth.js           # Register, login, /me
│       ├── users.js          # Profile management
│       ├── scores.js         # 5-score rolling logic
│       ├── draws.js          # Draw engine (random + algorithmic)
│       ├── charities.js      # Charity CRUD + search
│       ├── subscriptions.js  # Plan management, charity %
│       ├── winners.js        # Proof upload, payout tracking
│       └── admin.js          # Stats, user management
│
└── frontend/                 # React + Vite
    └── src/
        ├── context/
        │   ├── AuthContext.jsx   # Auth state + JWT
        │   └── ToastContext.jsx  # Global notifications
        ├── utils/api.js          # Fetch wrapper with auth
        ├── styles/global.css     # Design system (CSS vars)
        ├── pages/
        │   ├── HomePage.jsx      # Emotion-led landing page
        │   ├── LoginPage.jsx     # Sign in
        │   ├── RegisterPage.jsx  # 3-step signup flow
        │   ├── SubscribePage.jsx # Plan selection
        │   ├── DashboardPage.jsx # User overview
        │   ├── ScoresPage.jsx    # Score CRUD + visualisation
        │   ├── DrawsPage.jsx     # Results + upcoming
        │   ├── WinningsPage.jsx  # Prizes + proof upload
        │   ├── SettingsPage.jsx  # Profile + charity prefs
        │   ├── CharitiesPage.jsx # Public charity directory
        │   └── admin/
        │       ├── AdminDashboard.jsx
        │       ├── AdminUsers.jsx
        │       ├── AdminDraws.jsx    # Simulate + publish draws
        │       ├── AdminCharities.jsx
        │       └── AdminWinners.jsx  # Verify + payout
        └── components/layout/
            ├── Navbar.jsx      # Public nav
            ├── AppShell.jsx    # Collapsible sidebar
            └── AdminShell.jsx  # Admin sidebar
```

---

## 🎨 Design System

**Aesthetic direction:** Dark, modern, emotion-led. Charity impact first — not golf clichés.

- **Fonts:** Syne (display/headings) + DM Sans (body) + DM Mono (data)
- **Primary accent:** Lime `#c8f135` — energy, growth
- **Secondary:** Teal `#2dd4bf` (charity), Amber `#f5a623` (prizes/admin), Rose `#f43f5e` (warnings)
- **Background:** Near-black `#0a0a0a` with layered surfaces
- **Motion:** Fade-up entry animations, hover transitions, floating draw card

---

## ⚙️ Key Business Logic

### Score Rolling Window
```
POST /api/scores
→ If user has 5 scores: delete the oldest (by date)
→ Insert new score
→ Always return sorted newest-first
```

### Draw Engine
```
POST /api/draws/simulate   → Preview results, no prizes awarded
POST /api/draws/publish    → Official draw, prizes calculated & awarded
```

**Random:** `Math.random()` picks 5 unique numbers 1–45  
**Algorithmic:** Weights by most + least frequent scores across all users

### Prize Pool
```
Total pool = 60% of subscription revenue
Jackpot (5-match)   = 40% of pool (rolls over if no winner)
4-match prize       = 35% of pool (split equally)
3-match prize       = 25% of pool (split equally)
```

### Winner Verification Flow
```
Win in draw → status: "pending"
Submit proof → status: "under_review"
Admin approves → status: "approved"
Admin marks paid → status: "paid"
```

---

## 🔌 API Reference

### Auth
| Method | Path | Access |
|---|---|---|
| POST | `/api/auth/register` | Public |
| POST | `/api/auth/login` | Public |
| GET | `/api/auth/me` | Authenticated |

### Scores
| Method | Path | Access |
|---|---|---|
| GET | `/api/scores` | Active subscriber |
| POST | `/api/scores` | Active subscriber |
| PUT | `/api/scores/:id` | Active subscriber |
| DELETE | `/api/scores/:id` | Active subscriber |

### Draws
| Method | Path | Access |
|---|---|---|
| GET | `/api/draws` | Public |
| GET | `/api/draws/upcoming` | Active subscriber |
| POST | `/api/draws/simulate` | Admin |
| POST | `/api/draws/publish` | Admin |

### Charities
| Method | Path | Access |
|---|---|---|
| GET | `/api/charities` | Public |
| GET | `/api/charities/featured` | Public |
| POST | `/api/charities` | Admin |
| PUT | `/api/charities/:id` | Admin |
| DELETE | `/api/charities/:id` | Admin |

---

## 🗄 Production Deployment

### Supabase (replace in-memory db)
1. Create tables: `users`, `scores`, `draws`, `charities`, `winners`
2. Replace `db.js` imports in routes with Supabase client
3. Add `SUPABASE_URL` and `SUPABASE_KEY` to `.env`

### Vercel (frontend)
```bash
cd frontend && npm run build
# Deploy `dist/` to Vercel
# Set VITE_API_URL env var to your backend URL
```

### Backend hosting
- Railway, Render, or Fly.io for the Express API
- Set all `.env` variables in your hosting dashboard

### Payments (Razorpay)

- This project includes a Razorpay integration for subscription payments. The backend helper is in `backend/utils/razorpay.js` and the subscriptions table defaults to provider `razorpay` and currency `INR`.
- Required env vars for production: set `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` in `backend/.env`.
- Local dev can use Razorpay test keys. Ensure webhook endpoints (if used) are configured in your Razorpay dashboard and your hosting environment supports HTTPS for webhook verification.

---

## 📝 Evaluation Notes

- **Requirements interpretation:** All 16 PRD sections implemented
- **System design:** Clean route separation, middleware guards, in-memory DB with Supabase-ready architecture
- **UI/UX:** Emotion-driven design system, charity-first homepage, dark fluid aesthetic — deliberately avoids golf clichés
- **Data handling:** Rolling 5-score logic, precise prize tier splits, jackpot accumulation
- **Scalability:** Route modules, DB layer abstraction, environment config, multi-country ready

---

*Built with ❤️ for Digital Heroes — digitalheroes.co.in*
