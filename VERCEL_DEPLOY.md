# Mission Control Dashboard - Vercel Deployment Guide

## Overview

Mission Control is a Next.js 15 PWA dashboard for monitoring OpenClaw agents. It features password authentication, real-time data views, and works offline as a PWA.

## Prerequisites

- Vercel account (Hobby tier works fine)
- Git repository with the dashboard code
- Node.js 20+ (for local testing)

## Environment Variables

Set these in your Vercel project settings (Settings → Environment Variables):

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `DASHBOARD_PASSWORD` | **Yes** | Password for dashboard access | `my-secure-password-123` |
| `JWT_SECRET` | No | Secret for session tokens (auto-generated if not set) | `min-32-char-random-string` |

### Security Notes

- Use a strong password (16+ characters recommended)
- `JWT_SECRET` should be at least 32 characters
- Both values should be kept secret and never committed to git

## Deployment Steps

### 1. Push to Git

```bash
cd ~/WORK/GINA/mission-control/dashboard
git init  # if not already
git add .
git commit -m "Initial Mission Control dashboard"
git push origin main
```

### 2. Import to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New Project"
3. Import your Git repository
4. Select the `dashboard` folder as the root directory

### 3. Configure Build Settings

Vercel should auto-detect Next.js. Verify these settings:

- **Framework Preset:** Next.js
- **Root Directory:** `dashboard` (or your path)
- **Build Command:** `next build` (default)
- **Output Directory:** `.next` (default)

### 4. Add Environment Variables

In the Vercel dashboard:
1. Go to Project Settings → Environment Variables
2. Add `DASHBOARD_PASSWORD` with your chosen password
3. (Optional) Add `JWT_SECRET` with a random 32+ char string
4. Click "Save"

### 5. Deploy

Click "Deploy" and wait for the build to complete.

## Post-Deployment

### Access the Dashboard

- URL: `https://your-project.vercel.app`
- Login with the password you set in `DASHBOARD_PASSWORD`

### PWA Installation

**Mobile (iOS Safari):**
1. Open the dashboard in Safari
2. Tap Share → "Add to Home Screen"
3. The app will install with the Mission Control icon

**Mobile (Android Chrome):**
1. Open the dashboard in Chrome
2. Tap menu → "Add to Home Screen"
3. Or wait for the install prompt

**Desktop (Chrome/Edge):**
1. Look for the install icon in the address bar
2. Or go to menu → "Install Mission Control"

## Updating Data

The dashboard reads from static JSON at `src/data/dashboard.json`. To update:

1. Edit the JSON file locally
2. Commit and push
3. Vercel will auto-deploy

### Data Structure

```json
{
  "agents": [...],
  "tasks": [...],
  "alerts": [...],
  "lastUpdated": "2026-03-17T14:45:00Z"
}
```

## Troubleshooting

### Build Failures

```bash
# Test locally
npm install
npm run build
```

### Auth Issues

- Verify `DASHBOARD_PASSWORD` is set in Vercel
- Check that cookies are enabled in your browser
- Session expires after 8 hours (normal behavior)

### PWA Not Installing

- Ensure you're using HTTPS (Vercel provides this)
- Check that `manifest.json` is accessible at `/manifest.json`
- Service Worker requires a secure context

## File Structure

```
dashboard/
├── src/
│   ├── app/
│   │   ├── api/           # API routes (auth, data)
│   │   ├── login/         # Login page
│   │   ├── layout.tsx     # Root layout with PWA
│   │   └── page.tsx       # Main dashboard
│   ├── components/        # React components
│   ├── data/
│   │   └── dashboard.json # Static data source
│   ├── lib/
│   │   ├── auth.ts        # Session/auth logic
│   │   ├── data.ts        # Data helpers
│   │   └── types.ts       # TypeScript types
│   └── middleware.ts      # Auth middleware
├── public/
│   ├── manifest.json      # PWA manifest
│   ├── sw.js              # Service worker
│   └── icons/             # App icons
├── package.json
├── next.config.ts
└── VERCEL_DEPLOY.md       # This file
```

## Features

- ✅ Password authentication with secure session cookies
- ✅ Mobile-responsive design
- ✅ PWA support (installable, offline capable)
- ✅ Dark/light mode toggle
- ✅ Auto-refresh every 30 seconds
- ✅ View agents, tasks, and alerts
- ✅ Real-time stats overview

## Limitations

- Read-only (no editing via UI)
- Static JSON data source (update via git)
- Session expires after 8 hours
- No multi-user support (single shared password)

## Support

For issues or feature requests, contact the OpenClaw team.
