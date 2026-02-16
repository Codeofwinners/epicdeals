# Firebase Authentication Troubleshooting Guide

## Problem: "Sign In" button doesn't work

### Step 1: Check Browser Console for Errors

1. **Open your browser's Developer Tools:**
   - **Chrome/Firefox:** Press `F12` or `Ctrl+Shift+I` (Windows) / `Cmd+Option+I` (Mac)
   - **Safari:** Press `Cmd+Option+U`

2. **Go to the "Console" tab**

3. **Click "Sign In" button and look for error messages**

---

## Common Issues & Solutions

### Issue 1: ❌ "Firebase not initialized"

**Error Message in Console:**
```
❌ Firebase configuration missing! Please set these environment variables:
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_APP_ID
```

**Solution:** Your Firebase environment variables are missing or not set correctly.

**How to fix:**

1. **Get your Firebase config:**
   - Go to [Firebase Console](https://console.firebase.google.com)
   - Click your project
   - Go to Project Settings ⚙️
   - Find "Your apps" section
   - Look for the Web app configuration

2. **Create/Update `.env.local` file:**
   - In your project root, create or edit `.env.local`
   - Add these lines (replace with YOUR values):

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://your_project.firebaseio.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

3. **Restart your dev server:**
   ```bash
   npm run dev
   ```

4. **Verify in Console:**
   - Should see: `✅ Firebase initialized successfully`

---

### Issue 2: ❌ "Error: Failed to initialize Firebase"

**Possible causes:**
- Firebase API key is invalid
- Firebase account is not set up
- OAuth not enabled in Firebase

**Solution:**

1. **Verify Firebase project exists:**
   - Go to [Firebase Console](https://console.firebase.google.com)
   - Make sure your project appears in the list

2. **Enable Google Sign-In:**
   - Go to **Authentication** section
   - Click **Sign-in method**
   - Click **Google**
   - Toggle **Enable**
   - Fill in project name and support email
   - Click **Save**

3. **Add your domain to authorized redirects:**
   - In **Authentication** → **Settings**
   - Scroll to **Authorized domains**
   - Add `localhost` (for local testing)
   - Add your domain (e.g., `legit.discount`)

4. **Verify API Keys:**
   - Go to **Project Settings** → **Service Accounts**
   - Check that Firebase Admin SDK is created

---

### Issue 3: ❌ "Popup was blocked by browser"

**Error in Console:**
```
Popup request was denied
```

**Solution:**

This happens when:
- Ad blocker is blocking the popup
- Browser security settings blocked it
- You used an incorrect redirect URL

**How to fix:**

1. **Allow popups for your site:**
   - Check if you have popup blockers enabled
   - Whitelist your domain in browser settings

2. **Disable browser extensions temporarily:**
   - Try disabling ad blockers, VPN, privacy extensions
   - Test signin again

3. **Try a different browser:**
   - Use Chrome, Firefox, Safari to test
   - See if issue is browser-specific

4. **Check Authorized Domains in Firebase:**
   - Go to **Authentication** → **Settings**
   - Ensure `localhost` is in authorized domains (for local testing)

---

### Issue 4: ❌ "auth is null" or "Cannot read property 'uid' of undefined"

**This means Firebase didn't initialize at all.**

**Solution:** Go back to **Issue 1** above - your environment variables aren't set.

---

### Issue 5: ✅ Sign In works but user profile not created

**You signed in but don't see avatar**

**Possible cause:** Firestore database isn't created

**Solution:**

1. **Create Firestore Database:**
   - Go to Firebase Console
   - Go to **Firestore Database**
   - Click **Create Database**
   - Choose **Production mode**
   - Select your region (closest to you)
   - Click **Create**

2. **Update security rules:**
   - In Firestore → **Rules**
   - Replace with content from `/firestore.rules`
   - Click **Publish**

3. **Try signing in again**
   - User collection should auto-create

---

## How to Debug Step-by-Step

### 1. Check Environment Variables

**In your terminal:**
```bash
cat .env.local
```

**You should see:**
```
NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
...
```

If empty or missing → **Go to Issue 1 solution above**

---

### 2. Check Console Logs

**Open DevTools (F12) → Console tab**

**Look for these signs:**

✅ **Good - You should see:**
```
✅ Firebase initialized successfully
✅ Google signin successful: user@gmail.com
```

❌ **Bad - You'll see:**
```
❌ Firebase configuration missing! Please set these environment variables...
❌ Firebase initialization failed: ...
❌ Google signin failed: ...
```

---

### 3. Test with Incognito/Private Window

Sometimes browser cache or extensions cause issues.

**Try:**
- Open site in Incognito/Private window
- Attempt signin
- Check console for errors

---

### 4. Check Firebase Console

**Verify these are enabled:**

1. **Go to Project Settings**
   - Authentication should show "Google" as enabled
   - Firestore Database should be created
   - API keys should exist

2. **Check Authorized Domains**
   - Should include `localhost`
   - Should include your domain (`legit.discount`)

3. **Check Firestore Security Rules**
   - Rules should allow read/write based on auth
   - Go to Firestore → Rules → check current rules

---

## Testing Checklist

- [ ] `.env.local` has all Firebase variables
- [ ] Firebase Authentication enabled with Google
- [ ] Firestore Database created
- [ ] Authorized domains include your domain
- [ ] Security rules deployed
- [ ] Dev server restarted after adding env variables
- [ ] Browser console shows `✅ Firebase initialized successfully`
- [ ] Clicked Sign In button and waited 2-3 seconds
- [ ] No ad blocker or VPN blocking popup
- [ ] Tested in Incognito/Private window

---

## Quick Checklist: Getting OAuth Credentials

1. **Google Cloud Console Setup:**
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Select your Firebase project
   - Go to **Credentials** (left menu)
   - Look for Web Application credentials
   - If not found, create: **Create Credentials → OAuth 2.0 Client ID**

2. **Firebase Setup:**
   - Go to [Firebase Console](https://console.firebase.google.com)
   - Your project
   - **Authentication** → **Sign-in method**
   - Click **Google**
   - Make sure it's **Enabled** (toggle is ON)

3. **Your Site Setup:**
   - Create `.env.local` in project root
   - Add all `NEXT_PUBLIC_FIREBASE_*` variables
   - Restart dev server: `npm run dev`

---

## Still Not Working?

### Get Help with These Steps:

1. **Copy your error message:**
   - Right-click error in console
   - Select "Copy message"

2. **Check current environment:**
   ```bash
   # Verify env variables are loaded
   echo $NEXT_PUBLIC_FIREBASE_API_KEY

   # Should output your API key, not empty
   ```

3. **Verify Firebase project:**
   - Go to [Firebase Console](https://console.firebase.google.com)
   - Do you see your project?
   - Is Authentication enabled?
   - Is Google Sign-In enabled?

4. **Check browser compatibility:**
   - Try in Chrome, Firefox, Safari
   - Try in Incognito window

---

## Working Configuration Example

**If everything is set up correctly, here's what you should see:**

**Browser Console:**
```javascript
✅ Firebase initialized successfully
// User clicks Sign In button
// Google OAuth popup appears
// User selects Google account
// Popup closes
✅ Google signin successful: user@example.com
// Avatar appears in top right with user's Google photo
```

**Firestore Database:**
```
users/
└── {userId}/
    ├── displayName: "User Name"
    ├── email: "user@example.com"
    ├── photoURL: "https://..."
    ├── dealsSubmitted: 0
    ├── createdAt: timestamp
    └── role: "user"
```

---

## Quick Links

- [Firebase Console](https://console.firebase.google.com)
- [Google Cloud Console](https://console.cloud.google.com)
- [Firebase Docs - Authentication](https://firebase.google.com/docs/auth)
- [Firebase Docs - Web SDK Setup](https://firebase.google.com/docs/web/setup)

---

## Still Stuck?

If you've done all of the above and it still doesn't work:

1. **Check the browser console** - copy the exact error message
2. **Check .env.local** - verify all variables are present
3. **Verify Firebase project** - go to console.firebase.google.com
4. **Restart everything** - kill dev server and restart with `npm run dev`
5. **Hard refresh** - Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)

The most common issue is **missing or incomplete `.env.local` file**.

**Make sure you have this exact line with YOUR API KEY:**
```
NEXT_PUBLIC_FIREBASE_API_KEY=AIza...yourkey...
```

Not just empty or partially filled!
