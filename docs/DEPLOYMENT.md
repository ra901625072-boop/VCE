# VCE Pali — Cloud Deployment & Operations Guide
## Frontend on Vercel + Backend on Render (Zero Manual Configuration)

This repository is pre-configured with **Infrastructure-as-Code** specifications for automated, zero-touch deployment:
- **Frontend**: Hosted on [Vercel](https://vercel.com) using [`vercel.json`](file:///d:/VCE/vercel.json).
- **Backend**: Hosted on [Render](https://render.com) using [`render.yaml`](file:///d:/VCE/render.yaml) (Blueprint).

---

## 🚀 Part 1: Deploy Backend on Render (5 Minutes)

Render provides free Python hosting with automated SSL, continuous Git deployment, and background worker support.

### Step 1: Push Code to GitHub / GitLab
Make sure your latest code including `render.yaml` and `requirements.txt` is pushed to your Git repository.

### Step 2: Create Service using Render Blueprint
1. Log in to [Render Dashboard](https://dashboard.render.com).
2. Click **New +** (top right) and select **Blueprint**.
3. Connect your repository (`VCE` or your repo name).
4. Render will automatically detect [`render.yaml`](file:///d:/VCE/render.yaml) and pre-configure:
   - **Service Name**: `vce-pali-backend`
   - **Runtime**: Python 3.12
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`
   - **Region**: Singapore (lowest latency for India / Gujarat)
   - **Plan**: Free
   - **Environment Variables**: Auto-generated `SECRET_KEY`, `APP_ENV=production`, `DEBUG=false`, `TIMEZONE=Asia/Kolkata`.
5. Click **Apply**.
6. Render will build the environment, run database migrations on boot, and assign a public URL like:
   ```
   https://vce-pali-backend.onrender.com
   ```
7. Verify by opening `https://vce-pali-backend.onrender.com/api/health` in your browser. You should receive:
   ```json
   {"status":"ok","app":"VCE Pali — e-Gram Seva & Financial Ledger","version":"2.0.0","env":"production","database":"connected"}
   ```

> [!NOTE]
> **Render Free Tier Sleeping**: Free tier instances spin down after 15 minutes of inactivity. When a request arrives, Render automatically wakes the server up within ~30-40 seconds.

---

## ⚡ Part 2: Deploy Frontend on Vercel (2 Minutes)

Vercel provides a global edge network with instant cache invalidation and zero cold starts.

### Step 1: Import Project into Vercel
1. Log in to [Vercel Dashboard](https://vercel.com/dashboard).
2. Click **Add New...** -> **Project**.
3. Select your Git repository.
4. **Leave all settings at default!**
   - Framework Preset: *Other* (detected automatically)
   - Root Directory: `./` (leave default)
   - Build & Output Settings: Pre-configured by `vercel.json` (`outputDirectory: "frontend"`)
5. Click **Deploy**.

### Step 2: Transparent Edge Proxy Rewrites
Vercel reads [`vercel.json`](file:///d:/VCE/vercel.json) and configures transparent edge proxy rewrites:
- Any request from the browser to `/api/*` is reverse-proxied to `https://vce-pali-backend.onrender.com/api/*`.
- **Zero CORS issues**: The browser communicates on the same origin (`your-app.vercel.app`).
- **Zero Manual Configuration**: No build environment variables are required.

---

## 🔧 Part 3: Connecting a Custom Render URL

If your Render backend was assigned a custom URL (e.g., `https://my-custom-vce.onrender.com`), you have two simple options:

### Option A: Via Settings Page (No Redeployment Needed)
1. Open your deployed Vercel site in your browser.
2. Log in using your operator credentials.
3. Navigate to **Settings** (`/pages/settings.html`).
4. Scroll to the **Cloud Backend Connection** card.
5. Paste your Render backend URL (e.g. `https://my-custom-vce.onrender.com`).
6. Click **⚡ Test Connection** to verify live communication.
7. Click **Save URL**. All API calls will now route directly to that URL.

### Option B: Update `vercel.json`
Update the `destination` property in `vercel.json` and git push:
```json
{
  "source": "/api/:path*",
  "destination": "https://YOUR-SERVICE-NAME.onrender.com/api/:path*"
}
```

---

## 💾 Part 4: Persistent SQLite Storage on Render

On Render's free tier, the local filesystem is ephemeral (resets on redeploy). For production environments requiring permanent persistence:

1. Upgrade the Render web service to an entry-level paid plan.
2. In the Render Dashboard under **Disks**, add a persistent disk:
   - **Name**: `vce-data`
   - **Mount Path**: `/var/data`
   - **Size**: 1 GB
3. Under **Environment Variables**, set:
   - `DB_PATH`: `/var/data/vce.db`
4. The database migrations and transactions will now safely persist across all restarts and deployments.

---

## 💻 Part 5: Local Development Run

To test locally on Windows before deploying:
```cmd
run.bat
```
Or directly with Python:
```powershell
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```
Open [http://127.0.0.1:8000](http://127.0.0.1:8000) in your browser.
