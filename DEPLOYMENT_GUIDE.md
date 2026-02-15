# 🚀 Complete Deployment Guide - Team Goal Tracker

This guide will help you deploy your Team Goal Tracker application to free hosting platforms.

---

## 📋 Pre-Deployment Checklist

Before deploying, make sure you have:

- ✅ Node.js installed locally
- ✅ Git installed
- ✅ GitHub account created
- ✅ Code tested locally
- ✅ Environment variables configured

---

## 🌐 Option 1: Vercel (Recommended - Easiest)

**Best For:** Quick deployment, automatic HTTPS, great for full-stack apps  
**Free Tier:** Unlimited projects, 100GB bandwidth/month

### Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

### Step 2: Login to Vercel

```bash
vercel login
```

### Step 3: Deploy

```bash
cd team-goal-tracker
vercel
```

Follow the prompts:
- **Set up and deploy?** Yes
- **Which scope?** Your account
- **Link to existing project?** No
- **Project name?** team-goal-tracker
- **Directory?** ./
- **Override settings?** No

### Step 4: Set Environment Variables

Go to your Vercel dashboard:
1. Select your project
2. Go to **Settings** → **Environment Variables**
3. Add the following:

```
JWT_SECRET=your-super-secret-key-here-change-this
NODE_ENV=production
```

### Step 5: Redeploy

```bash
vercel --prod
```

**Your app is now live!** 🎉

---

## 🚂 Option 2: Railway

**Best For:** Backend with database, great uptime  
**Free Tier:** $5 credit/month (~500 hours)

### Step 1: Push to GitHub

```bash
cd team-goal-tracker
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin YOUR_GITHUB_REPO_URL
git push -u origin main
```

### Step 2: Deploy on Railway

1. Go to https://railway.app
2. Click **Start a New Project**
3. Select **Deploy from GitHub repo**
4. Authorize GitHub and select your repository
5. Railway will auto-detect Node.js

### Step 3: Configure Backend

1. Click on your service
2. Go to **Variables** tab
3. Add environment variables:

```
JWT_SECRET=your-super-secret-key
PORT=5000
NODE_ENV=production
```

4. Go to **Settings** tab
5. Set **Start Command**: `cd backend && node server.js`
6. Set **Build Command**: `cd backend && npm install`

### Step 4: Deploy Frontend (Use Vercel)

Deploy the frontend separately on Vercel:

1. Update `frontend/.env`:
```
REACT_APP_API_URL=https://your-railway-backend.up.railway.app/api
```

2. Deploy frontend to Vercel (see Option 1)

**Your app is now live!** 🎉

---

## 🎨 Option 3: Render (All-in-One)

**Best For:** Complete full-stack deployment  
**Free Tier:** 750 hours/month for web services

### Step 1: Push to GitHub

```bash
cd team-goal-tracker
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin YOUR_GITHUB_REPO_URL
git push -u origin main
```

### Step 2: Deploy Backend

1. Go to https://render.com
2. Click **New +** → **Web Service**
3. Connect your GitHub repository
4. Configure:
   - **Name**: team-tracker-backend
   - **Environment**: Node
   - **Build Command**: `cd backend && npm install`
   - **Start Command**: `cd backend && node server.js`
5. Add Environment Variables:
   ```
   JWT_SECRET=your-super-secret-key
   NODE_ENV=production
   PORT=5000
   ```
6. Click **Create Web Service**

### Step 3: Deploy Frontend

1. Click **New +** → **Static Site**
2. Connect same GitHub repository
3. Configure:
   - **Name**: team-tracker-frontend
   - **Build Command**: `cd frontend && npm install && npm run build`
   - **Publish Directory**: `frontend/build`
4. Add Environment Variable:
   ```
   REACT_APP_API_URL=https://team-tracker-backend.onrender.com/api
   ```
5. Click **Create Static Site**

**Your app is now live!** 🎉

---

## 🔧 Post-Deployment Setup

### 1. Test Your Deployment

Visit your deployed URL and:
- ✅ Register a new account
- ✅ Login successfully
- ✅ Create a quarterly goal
- ✅ Create a monthly plan
- ✅ Create a weekly task
- ✅ Log time on a task
- ✅ Check notifications
- ✅ View dashboard charts

### 2. Create Admin Account

The first user registered can be made admin by directly updating the database or by modifying the registration code temporarily.

### 3. Invite Team Members

Share your deployment URL with team members:
```
https://your-app-name.vercel.app
```

---

## 🐛 Common Issues & Solutions

### Issue: "Cannot connect to backend"

**Solution:**
1. Check that backend is deployed and running
2. Verify `REACT_APP_API_URL` in frontend environment variables
3. Ensure URL ends with `/api`
4. Check CORS settings in `backend/server.js`

### Issue: "Database errors"

**Solution:**
1. For SQLite, ensure write permissions on server
2. Consider upgrading to PostgreSQL for production (Render offers free PostgreSQL)
3. Check database file path in environment variables

### Issue: "Login not working"

**Solution:**
1. Verify `JWT_SECRET` is set in backend environment
2. Clear browser localStorage and cookies
3. Check browser console for errors
4. Ensure backend is accessible

### Issue: "Notifications not appearing"

**Solution:**
1. Check that cron jobs are running (check server logs)
2. Verify tasks have due dates set
3. Wait for scheduled times (9 AM and 6 PM)
4. Manually create a notification to test

### Issue: "Charts not displaying"

**Solution:**
1. Ensure Recharts is installed: `npm install recharts`
2. Check browser console for errors
3. Verify data is being fetched from API
4. Clear browser cache

---

## 🔄 Updating Your Deployment

### For Vercel:
```bash
git add .
git commit -m "Update features"
git push
vercel --prod
```

### For Railway:
```bash
git add .
git commit -m "Update features"
git push
# Railway auto-deploys on push
```

### For Render:
```bash
git add .
git commit -m "Update features"
git push
# Render auto-deploys on push
```

---

## 📊 Monitoring Your App

### Vercel
- Dashboard: https://vercel.com/dashboard
- View logs, analytics, and performance metrics

### Railway
- Dashboard: https://railway.app/dashboard
- View logs, metrics, and resource usage

### Render
- Dashboard: https://dashboard.render.com
- View logs, metrics, and deployment history

---

## 🔐 Security Best Practices

1. **Never commit `.env` files** - Use `.env.example` instead
2. **Use strong JWT secrets** - Generate with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
3. **Enable HTTPS** - All platforms provide this automatically
4. **Rotate secrets regularly** - Update JWT_SECRET periodically
5. **Monitor logs** - Check for suspicious activity

---

## 💰 Cost Comparison

| Platform | Free Tier | Best For | Limitations |
|----------|-----------|----------|-------------|
| **Vercel** | Unlimited projects | Frontend + Serverless | No persistent storage |
| **Railway** | $5 credit/month | Backend + DB | ~500 hours |
| **Render** | 750 hrs/month | Full-stack | Spins down after inactivity |

---

## 🎯 Recommended Setup

**For Small Teams (1-6 members):**
- Frontend: Vercel
- Backend: Render Free Tier
- Database: SQLite (embedded)
- **Cost: $0/month**

**For Growing Teams (6-20 members):**
- Frontend: Vercel
- Backend: Railway
- Database: Railway PostgreSQL
- **Cost: ~$5-10/month**

**For Large Teams (20+ members):**
- Consider paid hosting
- Use PostgreSQL instead of SQLite
- Add Redis for caching
- Implement load balancing

---

## 📱 Custom Domain Setup

### Vercel:
1. Go to Project Settings → Domains
2. Add your custom domain
3. Update DNS records as instructed
4. Wait for SSL certificate (automatic)

### Railway:
1. Go to Settings → Domains
2. Add custom domain
3. Update DNS CNAME record
4. SSL is automatic

### Render:
1. Go to Settings → Custom Domain
2. Add your domain
3. Update DNS records
4. SSL is automatic

---

## 🎓 Next Steps

After deployment:

1. ✅ Set up monitoring and alerts
2. ✅ Configure backups (export database regularly)
3. ✅ Add team members
4. ✅ Customize branding (logo, colors)
5. ✅ Set up analytics (Google Analytics, etc.)
6. ✅ Create user documentation
7. ✅ Plan feature roadmap

---

## 🆘 Getting Help

**Platform-Specific Documentation:**
- Vercel: https://vercel.com/docs
- Railway: https://docs.railway.app
- Render: https://render.com/docs

**Community Support:**
- Stack Overflow
- GitHub Issues
- Platform Discord servers

---

## 🎉 Congratulations!

Your Team Goal Tracker is now live and accessible to your team 24/7!

**Share your success:**
- Tweet about it
- Share with your team
- Add to your portfolio

**Happy tracking! 🚀**
