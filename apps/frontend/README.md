# 🎬 Cinema Management — Frontend

> React + TypeScript + Vite application for the Galaxiad Cinema Core platform.

## Introduction

The frontend provides a complete cinema management interface for **7 user roles**: Customer, Cashier, Movie Manager, Theater Manager, Facilities Manager, Admin, and Guest (public).

**Features by role:**
- **Guest / Public**: Browse movies, showtimes, view offers, contact forms, legal pages
- **Customer**: Book tickets, real-time seat selection (SSE), ticket download, movie reviews, chatbot
- **Cashier**: POS counter sales, shift check-in/out, facial recognition
- **Movie Manager**: Movie CRUD, age ratings, formats, cinema authorization
- **Theater Manager**: Staff shifts management, pay approval, AI showtime recommendations
- **Facilities Manager**: Cinema CRUD, auditorium seat layout, department management, pricing segments
- **Admin**: User management, role & permission assignment, rights transfer, vouchers, pricing promotions, audit log, dashboard

## Technology Stack

- **React 19** + **TypeScript**
- **Vite 7** (build tool)
- **React Router v7** (client-side routing)
- **Axios** (HTTP client)
- **SSE (native EventSource)** — real-time seat locking & payment status (replaces SignalR)
- **React i18next** — internationalization (EN, RU, VI)
- **Lucide React** — icons

## Dev Accounts (Seed Data)

> **Common password for all accounts:** `anhduc9a5`

| Role | Email | Description |
|------|-------|-------------|
| **Admin** | `admin@cinema.com` | Full system access |
| **Movie Manager** | `movie.manager@cinema.com` | Movie content management |
| **Theater Manager** | `theater.manager@cinema.com` | Cinema ops + shift approval |
| **Facilities Manager** | `facilities.manager@cinema.com` | Cinema facilities management |
| **Cashier (Ticket)** | `quay_ve_01@cinema.com` | Ticket counter sales |
| **Cashier (Food)** | `quay_bapnuoc_01@cinema.com` | Food counter sales |

> **Note:** When a new cinema is created via Admin/Facilities Manager, the system automatically creates cashier accounts for that cinema with default password `123456`. Email format: `cashier_{cinema_code}@cinema.com`.

## Running Locally

```bash
cd apps/frontend
npm install
npm run dev
```

Access: `http://localhost:5173`

## Production Build

```bash
npm run build
```

## Key Architecture Decisions

### Seat Locking (SSE + HTTP POST)

We use **native SSE** (not SignalR) for real-time seat locking:
- `EventSource` connects to `GET /api/v1/booking/seats/events/{scheduleId}`
- Lock/unlock actions use `POST /seats/lock` and `POST /seats/unlock`
- The hook `useSeatSse` wraps all this logic — see `src/hooks/useSeatSse.ts`
- On tab close, all seats held by the client are auto-released

### Payment Status (SSE)

- After initiating VNPay payment, the frontend opens an SSE connection to `payment-status/{orderId}`
- When VNPay callback is processed, the server sends `payment-result` event
- Frontend redirects to success/failure page accordingly

### 3-Language i18n

- English (default), Vietnamese, Russian
- Translation files: `src/i18n/locales/{en,vi,ru}/translation.json`
- Hook: `useTranslation()` from `react-i18next`
