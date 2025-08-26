# ⚡ Quick Deployment Guide (15 Minutes)

**The EASIEST way to deploy your LMS project for beginners.**

## 🎯 Recommended Platform Combination

- **Backend**: [Railway.app](https://railway.app) - Super easy Node.js deployment
- **Frontend**: [Netlify.com](https://netlify.com) - Best for React apps
- **Total Cost**: FREE (for small to medium traffic)

## 📝 Prerequisites Checklist

- [ ] GitHub account
- [ ] Your code pushed to GitHub repository
- [ ] All your API keys ready (Clerk, Stripe, MongoDB, etc.)

## 🚀 Step-by-Step Quick Deploy

### STEP 1: Deploy Backend (5 minutes)

1. **Go to [railway.app](https://railway.app)**
2. **Click "Login" → Sign in with GitHub**
3. **Click "New Project" → "Deploy from GitHub repo"**
4. **Select your repository**
5. **Railway will automatically detect your Node.js app**
6. **Wait for initial deploy (2-3 minutes)**
7. **Go to Variables tab and add these:**
   ```
   MONGODB_URI=your_mongodb_uri
   CLERK_SECRET_KEY=your_clerk_secret
   CLERK_PUBLISHABLE_KEY=your_clerk_publishable
   CLERK_WEBHOOK_SECRET=your_clerk_webhook
   CLOUDINARY_NAME=your_cloudinary_name
   CLOUDINARY_API_KEY=your_cloudinary_key
   CLOUDINARY_SECRET_KEY=your_cloudinary_secret
   STRIPE_SECRET_KEY=your_stripe_secret
   STRIPE_PUBLISHABLE_KEY=your_stripe_publishable
   MIDTRANS_SERVER_KEY=your_midtrans_key
   OPENROUTER_API_KEY=your_openrouter_key
   CLIENT_URL=https://your-frontend-url.netlify.app
   CURRENCY=IDR
   ```
8. **Copy your Railway URL** (e.g., `https://yourapp-production.railway.app`)

### STEP 2: Deploy Frontend (5 minutes)

1. **Update client/.env with your Railway URL:**
   ```
   VITE_BACKEND_URL=https://your-railway-url.railway.app
   VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable
   VITE_CURRENCY=Rp
   VITE_MIDTRANS_CLIENT_KEY=your_midtrans_client_key
   ```

2. **Go to [netlify.com](https://netlify.com)**
3. **Click "Add new site" → "Import an existing project"**
4. **Connect GitHub and select your repo**
5. **Set build settings:**
   - Base directory: `client`
   - Build command: `npm run build`
   - Publish directory: `client/dist`
6. **Add environment variables in Netlify:**
   - Go to Site settings → Environment variables
   - Add all your VITE_ variables from step 1
7. **Deploy site**

### STEP 3: Update URLs (3 minutes)

1. **Copy your Netlify URL** (e.g., `https://yourapp.netlify.app`)
2. **Go back to Railway → Variables**
3. **Update CLIENT_URL** with your Netlify URL
4. **Restart your Railway service**

### STEP 4: Configure External Services (2 minutes)

1. **Clerk Dashboard:**
   - Add your Netlify and Railway URLs to allowed origins
   - Update webhook URLs to point to Railway

2. **Stripe Dashboard:**
   - Update webhook endpoints to your Railway URL

## 🎉 You're Live!

Your LMS is now deployed and accessible worldwide!

- **Frontend**: Your Netlify URL
- **Backend**: Your Railway URL
- **Automatic Updates**: Push to GitHub to automatically redeploy

## 🆘 Quick Fixes

**Can't login?** → Check Clerk URLs are updated  
**Payment not working?** → Verify Stripe webhook URLs  
**Files not uploading?** → Check Cloudinary credentials  
**API errors?** → Check Railway logs and environment variables  

**Need help?** Check the full DEPLOYMENT_GUIDE.md for detailed troubleshooting!