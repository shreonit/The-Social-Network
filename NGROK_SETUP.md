# ngrok Setup Guide for SOCIATE

This guide will help you expose your local SOCIATE development server publicly using ngrok.

## Prerequisites

1. **Install ngrok**
   - Download from: https://ngrok.com/download
   - Or install via package manager:
     ```bash
     # macOS
     brew install ngrok
     
     # Windows (using Chocolatey)
     choco install ngrok
     
     # Or download from ngrok.com
     ```

2. **Sign up for ngrok account** (free tier works)
   - Go to: https://dashboard.ngrok.com/signup
   - Get your authtoken from: https://dashboard.ngrok.com/get-started/your-authtoken

3. **Configure ngrok** (first time only)
   ```bash
   ngrok config add-authtoken YOUR_AUTH_TOKEN_HERE
   ```

## Step-by-Step Instructions

### Step 1: Start Vite Development Server

Open a terminal and run:

```bash
npm run dev
```

The server will start on `http://localhost:5173` (default Vite port).

**Note:** If you need to use a different port, you can specify it:
```bash
npm run dev -- --port 3000
```

### Step 2: Start ngrok Tunnel

Open a **new terminal window** and run:

```bash
ngrok http 5173
```

**For better Vite HMR (Hot Module Replacement) support, use:**

```bash
ngrok http --host-header=rewrite 5173
```

This command:
- Creates a public tunnel to your local port 5173
- Provides a public URL like: `https://1234abcd.ngrok-free.app`
- Shows a web interface at `http://127.0.0.1:4040` for monitoring

### Step 3: Access Your Site

1. Copy the **HTTPS URL** from ngrok (e.g., `https://1234abcd.ngrok-free.app`)
2. Open it in your browser
3. Your SOCIATE app should be accessible publicly!

## Using Different Ports

If your Vite server runs on a different port, update the ngrok command:

```bash
# Example: Vite on port 3000
ngrok http --host-header=rewrite 3000

# Example: Vite on port 8080
ngrok http --host-header=rewrite 8080
```

## Firebase Authentication Setup

### Important: Add ngrok Domain to Firebase

For Google Login to work with ngrok, you must add your ngrok domain to Firebase:

1. **Get your ngrok URL**
   - From the ngrok terminal output, copy the HTTPS URL
   - Example: `https://1234abcd.ngrok-free.app`
   - Extract the domain: `1234abcd.ngrok-free.app`

2. **Add to Firebase Authorized Domains**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Select your project
   - Navigate to: **Authentication** → **Settings** → **Authorized domains**
   - Click **Add domain**
   - Enter your ngrok domain: `1234abcd.ngrok-free.app`
   - Click **Add**

3. **Note:** Each time you restart ngrok, you get a new URL
   - You'll need to add the new domain to Firebase each time
   - Or use a static domain with ngrok paid plan

## Quick Reference Commands

### Start Development Server
```bash
npm run dev
```

### Start ngrok (Basic)
```bash
ngrok http 5173
```

### Start ngrok (Recommended - with HMR support)
```bash
ngrok http --host-header=rewrite 5173
```

### Start ngrok (Custom Port)
```bash
ngrok http --host-header=rewrite 3000
```

## Troubleshooting

### Issue: Vite HMR not working through ngrok
**Solution:** Use `--host-header=rewrite` flag:
```bash
ngrok http --host-header=rewrite 5173
```

### Issue: Firebase Auth not working
**Solution:** 
1. Make sure you added the ngrok domain to Firebase Authorized Domains
2. Check that you're using HTTPS URL (not HTTP)
3. Verify Firebase config in `src/firebase.ts` is correct

### Issue: CORS errors
**Solution:** Vite should handle this automatically, but if issues persist:
- Check `vite.config.ts` has proper server configuration
- Ensure you're using `--host-header=rewrite` flag

### Issue: ngrok shows "Tunnel not found"
**Solution:**
- Make sure Vite dev server is running first
- Check the port number matches (default is 5173)
- Verify ngrok authtoken is configured

## ngrok Web Interface

While ngrok is running, you can monitor requests at:
```
http://127.0.0.1:4040
```

This shows:
- All incoming requests
- Request/response details
- Replay requests for testing

## Security Notes

⚠️ **Important:**
- ngrok exposes your local server to the internet
- Only use for development/testing
- Don't expose production servers this way
- Be careful with sensitive data
- Free ngrok URLs are temporary and change on restart

## Static Domain (Optional - Paid Feature)

If you need a consistent domain:
1. Upgrade to ngrok paid plan
2. Reserve a static domain
3. Use: `ngrok http --domain=your-domain.ngrok.app 5173`
4. Add the static domain to Firebase once

## Complete Workflow Example

```bash
# Terminal 1: Start Vite
npm run dev

# Terminal 2: Start ngrok
ngrok http --host-header=rewrite 5173

# Copy the HTTPS URL from ngrok
# Add domain to Firebase Authorized Domains
# Access your site via the ngrok URL
```

## Additional Resources

- [ngrok Documentation](https://ngrok.com/docs)
- [Vite Server Options](https://vitejs.dev/config/server-options.html)
- [Firebase Auth Domains](https://firebase.google.com/docs/auth/web/start#set_up_authorized_domains)

