# Meaning Risk Snapshot — What Time Binds

An interactive team communication diagnostic tool built for the *What Time Binds* Substack publication.

## What This Is

A 5-minute assessment that measures team communication health across 6 MRCI failure types:
- Referent Ambiguity
- Scope Drift
- Assumption Gap
- Hinge-Term Confusion
- Status Misalignment
- Context Collapse

Users receive a visual heatmap, personalized repair guidance, and a **downloadable PDF report**.

---

## 🚀 Deploy to Netlify (Step by Step)

### Option A: Deploy via GitHub (Recommended — enables easy updates)

1. **Create a GitHub account** (if you don't have one): https://github.com/signup
2. **Create a new repository**:
   - Go to https://github.com/new
   - Name it `meaning-risk-snapshot`
   - Set it to **Public** or **Private** (either works)
   - Click **Create repository**
3. **Upload these files**:
   - On the new repo page, click **"uploading an existing file"**
   - Drag the entire contents of this folder into the upload area
   - Click **Commit changes**
4. **Connect to Netlify**:
   - Go to https://app.netlify.com/signup and sign up with your GitHub account
   - Click **"Add new site"** → **"Import an existing project"**
   - Select **GitHub** and authorize Netlify
   - Find and select your `meaning-risk-snapshot` repo
   - Netlify will auto-detect the settings from `netlify.toml`:
     - Build command: `npm run build`
     - Publish directory: `dist`
   - Click **Deploy site**
5. **Your site is live!** Netlify will give you a URL like `https://random-name-12345.netlify.app`
6. **Set a custom name** (optional):
   - Go to **Site settings** → **Domain management** → **Change site name**
   - Change it to something like `meaning-risk-snapshot` for a URL like `https://meaning-risk-snapshot.netlify.app`

### Option B: Deploy via Drag & Drop (Fastest — no GitHub needed)

1. **Install Node.js** on your computer: https://nodejs.org/ (download the LTS version)
2. **Open your terminal/command prompt** and navigate to this folder:
   ```
   cd path/to/meaning-risk-snapshot
   ```
3. **Install dependencies and build**:
   ```
   npm install
   npm run build
   ```
4. **Go to Netlify**: https://app.netlify.com/drop
5. **Drag the `dist` folder** onto the Netlify drop zone
6. **Your site is live!**

---

## 🔒 Adding Password Protection (for Substack Paywall)

Once deployed, you can gate access behind a password you share in a paid Substack post:

### Free method (using StatiCrypt):
1. Install StatiCrypt: `npm install -g staticrypt`
2. After building, encrypt your index.html:
   ```
   staticrypt dist/index.html YOUR_PASSWORD -o dist/index.html
   ```
3. Deploy the `dist` folder to Netlify
4. Share the password in a paywalled Substack post

### Netlify Pro method ($19/month):
1. Upgrade to Netlify Pro plan
2. Go to **Site settings** → **Access control** → **Password protection**
3. Set a password
4. Share the password in a paywalled Substack post

---

## 🛠 Local Development

```bash
npm install
npm run dev
```

This starts a dev server at `http://localhost:5173` with hot reload.

---

## 📁 File Structure

```
meaning-risk-snapshot/
├── index.html          # Entry point
├── package.json        # Dependencies
├── vite.config.js      # Build configuration
├── netlify.toml        # Netlify deployment config
├── src/
│   ├── main.jsx        # React entry point
│   ├── App.jsx         # Main application (all screens)
│   └── generatePDF.js  # PDF report generation
└── public/             # Static assets (add logo here later)
```

---

## 📊 Future Enhancements (Phase 2+)

- **Team rooms**: Multiple team members complete the assessment, results aggregate
- **Supabase backend**: Store responses for analytics
- **Stripe webhook auth**: Replace password with real Substack subscriber verification
- **Repair Simulator**: Interactive branching-scenario game
- **Drift Tracker**: Longitudinal team pulse measurement

---

## Credits

Built for **What Time Binds** by Jerry W Washington, Ed.D.
Meaning Repair for High-Stakes Teams
https://www.what-time-binds.com
