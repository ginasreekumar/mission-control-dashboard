# Mission Control Dashboard - Vercel Deployment Guide

## Overview

Mission Control is a Next.js 15 PWA dashboard for monitoring OpenClaw agents. It features password authentication, real-time data views via bridge API, and works offline as a PWA.

**v0.5.0 Update:** Dashboard now supports live data via the Mission Control Bridge API, enabling real-time agent status on Vercel deployments.

## Prerequisites

- Vercel account (Hobby tier works fine)
- Git repository with the dashboard code
- Node.js 20+ (for local testing)
- Host machine running the Mission Control Bridge (for live data)

## Environment Variables

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `DASHBOARD_PASSWORD` | **Yes** | Password for dashboard access | `my-secure-password-123` |
| `JWT_SECRET` | No | Secret for session tokens | `min-32-char-random-string` |
| `MC_BRIDGE_URL` | No | URL of the Mission Control Bridge | `https://bridge.example.com` |
| `MC_BRIDGE_TOKEN` | No | Auth token for the bridge | `your-secret-token` |

## Deployment Steps

### 1. Set Up the Bridge (For Live Data)

See `BRIDGE_SETUP.md` for detailed instructions.

Quick start:
```bash
cd ~/WORK/GINA/mission-control/bridge
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
MC_BRIDGE_TOKEN=$(openssl rand -hex 32)
echo "MC_BRIDGE_TOKEN=$MC_BRIDGE_TOKEN" > .env
python bridge.py
```

### 2. Expose the Bridge

**ngrok (testing):**
```bash
ngrok http 8787
```

**Production:** Use reverse proxy with HTTPS.

### 3. Configure Vercel

1. Import your Git repository to Vercel
2. Set environment variables:
   - `DASHBOARD_PASSWORD`
   - `MC_BRIDGE_URL` (your bridge URL)
   - `MC_BRIDGE_TOKEN` (same as bridge)
3. Deploy

## Data Modes

| Mode | Indicator | Description |
|------|-----------|-------------|
| Bridge | WiFi icon + "Bridge Connected" | Live data via API (Vercel) |
| Live | Radio icon + "Live Data Mode" | Direct filesystem (local) |
| Static | Database icon + "Demo Data Mode" | Static JSON fallback |

## Version History

- **v0.5.0** - Bridge API support for Vercel live data
- **v0.4.0** - Live data integration with filesystem reader
- **v0.3.0** - Premium control-plane redesign
- **v0.2.0** - Relative time, refresh fixes
- **v0.1.0** - Initial dashboard release

## Security

- Bridge is read-only (never modifies files)
- Optional Bearer token authentication
- CORS restricted to configured origins
- Dashboard password-protected
