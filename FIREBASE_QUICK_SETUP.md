# 🔥 Firebase Setup - 5 Minutes

## STOP. Just do this:

### Step 1: Go here
👉 https://console.firebase.google.com

### Step 2: Create a new project (if you don't have one)
- Click "Create project"
- Name it "Legit Discounts"
- Continue through wizard (keep defaults)
- Wait for it to finish

### Step 3: Create a web app
- Click the Web icon (looks like `</>`)`
- App nickname: "Legit Discounts"
- Check "Also set up Firebase Hosting"
- Click "Register app"

### Step 4: Copy the config

You'll see a code block like this:
```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "myproject.firebaseapp.com",
  projectId: "myproject",
  storageBucket: "myproject.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123",
  measurementId: "G-ABC123"
};
```

**Copy each value:**

### Step 5: Create `.env.local` file

In your project root (same folder as `package.json`):

Create a file named `.env.local` with this:

```
NEXT_PUBLIC_FIREBASE_API_KEY=paste_apiKey_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=paste_authDomain_here
NEXT_PUBLIC_FIREBASE_PROJECT_ID=paste_projectId_here
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=paste_storageBucket_here
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=paste_messagingSenderId_here
NEXT_PUBLIC_FIREBASE_APP_ID=paste_appId_here
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=paste_measurementId_here
```

Replace each `paste_XXX_here` with the values from step 4.

**Example:**
```
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyDxC3IEPJJqA123xyz
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=legitdiscounts.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=legitdiscounts-12345
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=legitdiscounts-12345.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123def456
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-ABC123XYZ
```

### Step 6: Enable Google Sign-In

Still in Firebase Console:
1. Click "Authentication" (left menu)
2. Click "Sign-in method"
3. Click "Google"
4. Toggle "Enable"
5. Pick a project support email
6. Click "Save"

### Step 7: Add your domain

Still in Authentication:
1. Click "Settings"
2. Scroll to "Authorized domains"
3. Click "Add domain"
4. Add: `localhost` (for local testing)
5. Later add your real domain

### Step 8: Create Firestore Database

1. Click "Firestore Database" (left menu)
2. Click "Create database"
3. Choose "Production mode"
4. Pick closest region
5. Click "Create"

### Step 9: Deploy security rules

1. In Firestore, go to "Rules"
2. Delete the default text
3. Paste this:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /deals/{dealId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update, delete: if request.auth.uid == resource.data.submittedBy;
    }
    match /users/{userId} {
      allow read: if true;
      allow write: if request.auth.uid == userId;
    }
    match /comments/{commentId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update, delete: if request.auth.uid == resource.data.userId;
    }
    match /votes/{userId}/dealUpvotes/{dealId} {
      allow read, create, delete: if request.auth.uid == userId;
    }
    match /votes/{userId}/dealDownvotes/{dealId} {
      allow read, create, delete: if request.auth.uid == userId;
    }
    match /savedDeals/{userId}/deals/{dealId} {
      allow read, create, delete: if request.auth.uid == userId;
    }
    match /stores/{storeId} {
      allow read: if true;
      allow write: if false;
    }
    match /categories/{categoryId} {
      allow read: if true;
      allow write: if false;
    }
  }
}
```

4. Click "Publish"

### Step 10: Restart your server

In your terminal:
```bash
npm run dev
```

### Step 11: TEST IT

1. Go to http://localhost:3000
2. Click "Sign In" button
3. Sign in with Google
4. Your avatar should appear!

---

## If it still doesn't work:

1. **Check you have `.env.local` file** - open it and verify all fields are filled
2. **Check console (F12)** - should say "✅ Firebase initialized successfully"
3. **Restart server** - kill with Ctrl+C, run `npm run dev` again
4. **Hard refresh** - Ctrl+Shift+R or Cmd+Shift+R

---

That's it! You're done. 🚀
