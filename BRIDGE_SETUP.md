# Mission Control Bridge Setup

This document explains how to set up the host-side bridge API for live Vercel dashboard data.

## Overview

The Mission Control Bridge is a lightweight FastAPI server that runs on the host machine and exposes mission-control data over HTTP. This allows the Vercel-hosted dashboard to display real-time agent status, tasks, and alerts.

```
┌─────────────────┐         HTTP/HTTPS          ┌──────────────────┐
│  Vercel         │  ──────────────────────────> │  Host Bridge     │
│  Dashboard      │   GET /dashboard             │  (port 8787)     │
│  (Next.js)      │   GET /stats                 │                  │
│                 │   GET /health                │  Reads from:     │
│                 │                              │  - status/*.json │
│                 │ <──────────────────────────  │  - tasks.jsonl   │
│                 │   JSON responses             │  - tasks.json    │
└─────────────────┘                              └──────────────────┘
```

## Prerequisites

- Python 3.9+
- pip
- Access to the host machine (where mission-control files are stored)
- A way to expose the bridge to the internet (ngrok, reverse proxy, or public IP)

## Installation

### 1. Clone/Navigate to the Bridge

```bash
cd ~/WORK/GINA/mission-control/bridge
```

### 2. Create Virtual Environment

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 3. Configure Environment

```bash
cp .env.example .env
```

Edit `.env`:

```bash
# Required: Port to run on
MC_BRIDGE_PORT=8787

# Recommended: Set a secure token
MC_BRIDGE_TOKEN=$(openssl rand -hex 32)

# Recommended: Restrict CORS to your Vercel domain
MC_BRIDGE_ORIGINS=https://your-app.vercel.app

# Paths (defaults should work)
MISSION_CONTROL_DIR=/home/siju/WORK/GINA/mission-control
```

### 4. Test the Bridge

```bash
python bridge.py
```

Visit http://localhost:8787/health to verify it's working.

## Deployment Options

### Option A: Direct with ngrok (Quick Testing)

```bash
# Terminal 1: Start bridge
python bridge.py

# Terminal 2: Expose via ngrok
ngrok http 8787
```

Copy the ngrok HTTPS URL (e.g., `https://abc123.ngrok.io`) for Vercel config.

### Option B: Systemd Service (Production)

```bash
# Copy service file
sudo cp bridge.service /etc/systemd/system/mc-bridge.service

# Edit with your user and paths
sudo systemctl edit mc-bridge

# Enable and start
sudo systemctl enable mc-bridge
sudo systemctl start mc-bridge

# Check status
sudo systemctl status mc-bridge
```

### Option C: Docker (Optional)

```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY bridge.py .

EXPOSE 8787

CMD ["uvicorn", "bridge:app", "--host", "0.0.0.0", "--port", "8787"]
```

### Option D: Reverse Proxy (Recommended for Production)

If you have a domain and want HTTPS:

```nginx
# nginx example
server {
    listen 443 ssl;
    server_name mc-bridge.yourdomain.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    location / {
        proxy_pass http://localhost:8787;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Vercel Configuration

### 1. Add Environment Variables

In Vercel dashboard or via CLI:

```bash
vercel env add MC_BRIDGE_URL
# Enter: https://your-bridge-url.com (or ngrok URL for testing)

vercel env add MC_BRIDGE_TOKEN
# Enter: your-secret-token (must match bridge .env)
```

### 2. Redeploy

```bash
vercel --prod
```

## Verification

1. **Check Bridge Health**: Visit `https://your-bridge/health`
2. **Check Dashboard**: Open Vercel dashboard, look for "Bridge Connected" indicator
3. **Verify Data**: Compare agent statuses between local and Vercel dashboards

## Security Considerations

1. **Always use HTTPS** in production (ngrok provides this, or use reverse proxy)
2. **Set MC_BRIDGE_TOKEN** to prevent unauthorized access
3. **Restrict MC_BRIDGE_ORIGINS** to your Vercel domain
4. **Firewall**: Only expose port 8787 if necessary; prefer localhost + reverse proxy
5. **No write operations**: Bridge is read-only by design

## Troubleshooting

### Dashboard shows "Demo Data Mode"

- Check `MC_BRIDGE_URL` is set in Vercel
- Verify bridge is accessible from internet
- Check Vercel function logs for errors

### CORS errors

- Verify `MC_BRIDGE_ORIGINS` includes your Vercel domain
- Check browser console for exact error

### Authentication errors

- Ensure `MC_BRIDGE_TOKEN` matches between bridge and Vercel
- Check token is being sent in Authorization header

### Bridge not starting

- Check Python version (3.9+)
- Verify virtual environment is activated
- Check port 8787 is not in use: `lsof -i :8787`

## API Reference

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/` | GET | No | Bridge info |
| `/health` | GET | No | Health check |
| `/dashboard` | GET | Yes* | Full dashboard data |
| `/stats` | GET | Yes* | Computed statistics |
| `/agents` | GET | Yes* | Agent statuses |
| `/tasks` | GET | Yes* | All tasks |
| `/alerts` | GET | Yes* | Recent alerts |

\* Only if `MC_BRIDGE_TOKEN` is configured

## Architecture Notes

- Bridge reads files on every request (no caching)
- Dashboard polls every 30 seconds
- No persistent connection required
- Bridge can be restarted without affecting dashboard (will reconnect)
