# Mission Control Dashboard - Vercel Deployment Guide

## Overview

Mission Control is a Next.js 15 PWA dashboard for monitoring OpenClaw agents. It features password authentication, real-time data views, and works offline as a PWA.

**v0.4.0 Update:** Dashboard now supports live data mode when running on the same host as the mission control system, with automatic fallback to static demo data on Vercel.

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
| `DISABLE_FILESYSTEM` | No | Set to `true` on Vercel to disable filesystem reads | `true` |

### Security Notes

- Use a strong password (16+ characters recommended)
- `JWT_SECRET` should be at least 32 characters
- Both values should be kept secret and never committed to git

## Deployment Steps

### 1. Push to Git

```bash
cd ~/WORK/GINA/mission-control/dashboard
git add .
git commit -m "Dashboard updates"
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
3. Add `DISABLE_FILESYSTEM` = `true` (required for Vercel)
4. (Optional) Add `JWT_SECRET` with a random 32+ char string
5. Click "Save"

### 5. Deploy

Click "Deploy" and wait for the build to complete.

## Post-Deployment

### Access the Dashboard

- URL: `https://your-project.vercel.app`
- Login with the password you set in `DASHBOARD_PASSWORD`

### Data Modes

The dashboard operates in two modes:

#### Live Data Mode (Local/Dev Server)
When running on the same machine as the mission control system:
- Reads agent status from `~/WORK/GINA/mission-control/status/*.json`
- Reads tasks from `~/WORK/GINA/mission-control/data/tasks.json`
- Generates alerts from `~/WORK/GINA/mission-control/tasks.jsonl`
- Shows green "LIVE" badge in header
- Updates every 30 seconds

#### Static/Demo Mode (Vercel)
When deployed to Vercel or when filesystem is unavailable:
- Falls back to static JSON in `src/data/dashboard.json`
- Shows amber "Demo Data Mode" indicator
- Manual updates via git push

## Local Development with Live Data

To run locally with live data:

```bash
cd ~/WORK/GINA/mission-control/dashboard
npm install
npm run dev
```

The dashboard will automatically detect and read from the mission control status files if they exist at the expected paths.

### Custom Data Paths

Override default paths with environment variables:

```bash
export MISSION_CONTROL_DIR=/custom/path/to/mission-control
export MISSION_CONTROL_STATUS=/custom/path/to/status
export MISSION_CONTROL_TASKS=/custom/path/to/tasks.json
export MISSION_CONTROL_TASKS_LOG=/custom/path/to/tasks.jsonl
```

## PWA Installation

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

### Live Data Not Working

- Ensure you're running on the same machine as mission control
- Check that status files exist: `ls ~/WORK/GINA/mission-control/status/`
- Verify the paths in environment variables if customized
- On Vercel, live data is unavailable by design (filesystem isolation)

### PWA Not Installing

- Ensure you're using HTTPS (Vercel provides this)
- Check that `manifest.json` is accessible at `/manifest.json`
- Service Worker requires a secure context

## File Structure

```
dashboard/
├── src/
│   ├── app/
│   │   ├── api/           # API routes (auth, data, live feeds)
│   │   ├── login/         # Login page
│   │   ├── layout.tsx     # Root layout with PWA
│   │   └── page.tsx       # Main dashboard
│   ├── components/        # React components
│   ├── data/
│   │   └── dashboard.json # Static fallback data
│   ├── lib/
│   │   ├── auth.ts        # Session/auth logic
│   │   ├── data.ts        # Static data helpers
│   │   ├── live-data.ts   # Live filesystem data reader
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
- ✅ Live data mode (local) with static fallback (Vercel)
- ✅ Visual indicator for data source (live vs static)

## Version History

- **v0.4.0** - Live data integration with filesystem reader
- **v0.3.0** - Premium control-plane redesign
- **v0.2.0** - Relative time, refresh fixes, sidebar, calendar polish
- **v0.1.0** - Initial dashboard release

## Support

For issues or feature requests, contact the OpenClaw team.
