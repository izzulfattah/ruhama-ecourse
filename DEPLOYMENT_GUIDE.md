# 🚀 Complete Deployment Guide for LMS Project

This guide will help you deploy your Learning Management System with **zero deployment experience**.

## 📋 Project Overview

Your LMS consists of:
- **Frontend**: React app with Vite (client folder)
- **Backend**: Node.js/Express API (server folder)
- **Database**: MongoDB (cloud-hosted)
- **Authentication**: Clerk
- **Payments**: Stripe & Midtrans
- **File Storage**: Cloudinary

## 🎯 Recommended Deployment Strategy (Easiest)

**Frontend**: Deploy to **Netlify** (Free)  
**Backend**: Deploy to **Railway** (Free tier available)

This combination is the easiest for beginners and requires minimal configuration.

---

## 🔧 Step 1: Prepare Your Environment Variables

### 1.1 Backend Environment Variables
Create a production `.env` file for your server with these variables:

```bash
# Copy your existing values from server/.env
CURRENCY="IDR"
MONGODB_URI="your_mongodb_connection_string"
CLOUDINARY_NAME="your_cloudinary_name"
CLOUDINARY_API_KEY="your_cloudinary_api_key"
CLOUDINARY_SECRET_KEY="your_cloudinary_secret_key"
CLERK_WEBHOOK_SECRET="your_clerk_webhook_secret"
CLERK_PUBLISHABLE_KEY="your_clerk_publishable_key"
CLERK_SECRET_KEY="your_clerk_secret_key"
MIDTRANS_SERVER_KEY="your_midtrans_server_key"
CLIENT_URL="https://your-frontend-domain.netlify.app"
OPENROUTER_API_KEY="your_openrouter_api_key"
```

### 1.2 Frontend Environment Variables
Update client/.env for production:

```bash
VITE_CLERK_PUBLISHABLE_KEY="your_clerk_publishable_key"
VITE_BACKEND_URL="https://your-backend-domain.railway.app"
VITE_CURRENCY="Rp"
VITE_MIDTRANS_CLIENT_KEY="your_midtrans_client_key"
```

---

## 🌐 Step 2: Deploy Backend to Railway

### 2.1 Create Railway Account
1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. Verify your email

### 2.2 Deploy Your Backend
1. Click "New Project"
2. Select "Deploy from GitHub repo"
3. Connect your GitHub account if not connected
4. Select your repository
5. Choose "Deploy from repo root"

### 2.3 Configure Railway Settings
1. In your Railway project dashboard:
   - Go to "Variables" tab
   - Add all your backend environment variables (from Step 1.1)
   - Set `PORT` to `5050` (or let Railway auto-assign)

### 2.4 Update Build Settings
1. Go to "Settings" tab
2. Set "Root Directory" to `server`
3. Build Command: `npm install`
4. Start Command: `npm start`

### 2.5 Get Your Backend URL
1. Go to "Settings" > "Domains"
2. Copy the Railway-provided domain (e.g., `https://your-app-name.railway.app`)
3. Update your `CLIENT_URL` environment variable with your frontend URL

---

## 🎨 Step 3: Deploy Frontend to Netlify

### 3.1 Build Your Frontend
```bash
cd client
npm run build
```

### 3.2 Create Netlify Account
1. Go to [netlify.com](https://netlify.com)
2. Sign up with GitHub
3. Verify your email

### 3.3 Deploy Your Frontend
**Option A: Drag & Drop (Simplest)**
1. After building, go to your `client/dist` folder
2. Drag the entire `dist` folder to Netlify's deploy area
3. Your site will be live immediately

**Option B: GitHub Integration (Recommended)**
1. Click "Add new site" > "Import an existing project"
2. Connect GitHub and select your repository
3. Set these build settings:
   - **Base directory**: `client`
   - **Build command**: `npm run build`
   - **Publish directory**: `client/dist`

### 3.4 Configure Environment Variables
1. Go to Site settings > Environment variables
2. Add your frontend environment variables (from Step 1.2)
3. **Important**: Update `VITE_BACKEND_URL` with your Railway backend URL

### 3.5 Update Backend CLIENT_URL
1. Copy your Netlify site URL
2. Go back to Railway and update `CLIENT_URL` environment variable
3. Restart your Railway service

---

## ⚙️ Step 4: Configure Services

### 4.1 Update Clerk Settings
1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Update allowed origins:
   - Add your Netlify frontend URL
   - Add your Railway backend URL
3. Update webhook endpoints with your Railway URL


### 4.3 Update Midtrans Settings
1. Go to Midtrans Dashboard
2. Update return URLs to your Netlify frontend
3. Update notification URLs to your Railway backend

---

## 🧪 Step 5: Test Your Deployment

### 5.1 Basic Functionality Test
1. Visit your Netlify frontend URL
2. Test user registration/login
3. Test course browsing
4. Test file uploads
5. Test payment flows

### 5.2 Check Logs
- **Railway**: Check logs in Railway dashboard
- **Netlify**: Check function logs in Netlify dashboard

---

## 🔄 Step 6: Set Up Continuous Deployment

### 6.1 Automatic Frontend Updates
Netlify automatically redeploys when you push to GitHub (if using GitHub integration).

### 6.2 Automatic Backend Updates
Railway automatically redeploys when you push to GitHub.

---

## 🛠️ Alternative Deployment Options

### Option 2: Heroku (Both Frontend & Backend)
- **Cost**: Free tier limited, paid plans available
- **Complexity**: Medium
- **Best for**: Traditional deployment approach

### Option 3: Vercel + Railway
- **Frontend**: Vercel (excellent for React)
- **Backend**: Railway
- **Complexity**: Easy
- **Best for**: Next.js-style deployments

### Option 4: AWS/DigitalOcean
- **Cost**: Pay-as-you-go
- **Complexity**: Advanced
- **Best for**: Scalable production deployments

---

## 🚨 Common Issues & Solutions

### Issue 1: CORS Errors
**Solution**: Ensure your backend's `CLIENT_URL` matches your frontend URL exactly.

### Issue 2: Environment Variables Not Working
**Solution**: 
- Restart your Railway service after adding variables
- Ensure variable names match exactly (case-sensitive)

### Issue 3: Build Fails
**Solution**:
- Check Node.js version compatibility
- Ensure all dependencies are in package.json
- Check build logs for specific errors

### Issue 4: Database Connection Issues
**Solution**:
- Verify MongoDB URI is correct
- Check if your MongoDB service allows connections from Railway's IPs
- Test connection locally first

### Issue 5: File Upload Issues
**Solution**:
- Verify Cloudinary credentials
- Check file size limits
- Ensure proper CORS settings in Cloudinary

---

## 📈 Performance Optimization

### Frontend Optimization
1. Enable Netlify's asset optimization
2. Configure proper caching headers
3. Use Netlify's CDN features

### Backend Optimization
1. Use Railway's auto-scaling features
2. Monitor memory usage
3. Implement proper error logging

---

## 🔐 Security Checklist

- [ ] All environment variables are properly set
- [ ] No sensitive data in your repository
- [ ] HTTPS is enforced on both frontend and backend
- [ ] Webhooks are properly secured
- [ ] CORS is properly configured
- [ ] Authentication flows are working correctly

---

## 📞 Support & Troubleshooting

1. **Railway Support**: Check Railway documentation and Discord
2. **Netlify Support**: Netlify documentation and community forums
3. **Service-specific issues**: Check respective service documentation
4. **Database issues**: MongoDB Atlas support
5. **Payment issues**: Stripe/Midtrans documentation

---

## 🎉 Congratulations!

Your LMS is now deployed! Users can:
- Register and login securely
- Browse and enroll in courses
- Make payments
- Watch protected videos
- Take exams
- Track progress

Remember to monitor your deployments and update environment variables if any service URLs change.