# Vercel Deployment Guide

This guide explains how to deploy the HourMaster app to Vercel.

## Prerequisites

- A Vercel account
- Git repository with your code

## Deployment Steps

### 1. Connect to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "New Project"
3. Import your Git repository

### 2. Configure Build Settings

Vercel will automatically detect the configuration from `vercel.json`:

- **Framework Preset**: Vite
- **Build Command**: `npm run build:client`
- **Output Directory**: `dist/public`
- **Install Command**: `npm install`

### 3. Environment Variables

No environment variables are needed for the client-side deployment since this is a static PWA.

### 4. Deploy

Click "Deploy" and Vercel will:
1. Install dependencies
2. Run the build command
3. Serve the static files

## Important Notes

- This deployment only includes the **client-side code**
- The server code (`server/` directory) is excluded via `.vercelignore`
- The app works as a **Progressive Web App (PWA)** with local storage
- No backend API is needed for the core functionality

## Troubleshooting

### If you see server code instead of the app:

1. Make sure `vercel.json` is in the root directory
2. Verify `.vercelignore` excludes server files
3. Check that the build command is `npm run build:client`
4. Ensure the output directory is `dist/public`

### Build errors:

1. Check that all dependencies are in `package.json`
2. Verify the Vite configuration is correct
3. Make sure the build script exists: `"build:client": "vite build"`

## Local Testing

To test the build locally before deploying:

```bash
npm run build:client
```

This will create the `dist/public` directory with the static files that Vercel will serve. 