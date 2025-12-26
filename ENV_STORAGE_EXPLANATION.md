# How We're Storing API Keys and Webhooks

## 🔍 Current Storage Method

### **Build-Time Environment Variables** (Current Approach)

**Where secrets are stored:**
- **`.env.local`** file (local file, gitignored, not committed)

**How it works:**
1. You create `.env.local` with your secrets:
   ```
   GEMINI_API_KEY=your_key_here
   FORM_WEBHOOK_URL=https://your-webhook.com/...
   ```

2. **Vite reads `.env.local` during build** (`npm run build`)
   - See `vite.config.ts` lines 6-20
   - Uses `loadEnv()` to read from `.env.local`
   - Uses `define` to replace `process.env.*` with actual values

3. **Values are baked into JavaScript bundle**
   - When you build, Vite replaces:
     ```typescript
     process.env.GEMINI_API_KEY
     ```
   - With the actual value:
     ```javascript
     "your-actual-api-key-here"
     ```

4. **Built files in `dist/` contain hardcoded values**
   - The JavaScript files have the actual API keys and URLs
   - These are deployed to Azure Static Web Apps

## ⚠️ Important Security Reality

**For client-side React applications:**
- API keys and webhook URLs **will always be visible** in the browser
- This is because JavaScript runs in the user's browser
- Anyone can open DevTools → Sources → see the values
- **This is normal and expected** for client-side apps

## 🔄 Alternative: Azure App Settings (For Server-Side)

Azure Static Web Apps supports environment variables, but:
- They're for **Azure Functions** (serverless backend)
- Not directly accessible in client-side React code
- Would require creating serverless functions to proxy API calls

## ✅ Why Current Approach is Correct

1. **Client-side app** - Secrets will be visible anyway
2. **Webhooks are meant to be public** - They're called from the browser
3. **Simple and standard** - This is how most React apps handle env vars
4. **Works with Static Web Apps** - No backend needed

## 📝 Current Flow

```
.env.local (local file)
    ↓
npm run build
    ↓
Vite reads .env.local
    ↓
vite.config.ts replaces process.env.* with values
    ↓
dist/ folder contains JavaScript with hardcoded values
    ↓
Deploy dist/ to Azure
    ↓
Values visible in browser (normal for client-side)
```

## 🔐 Security Measures We Have

✅ `.env.local` is gitignored (not in repository)
✅ `.env.example` has placeholders (safe template)
✅ No secrets in source code
✅ Error handling for missing env vars
✅ Documentation for other builders

## 🚀 For Azure Deployment

**Current process:**
1. Build locally with `.env.local`
2. Deploy `dist/` folder to Azure
3. Values are in the JavaScript (visible in browser)

**This is the standard approach for static sites.**

