# Firebase Authentication Setup Guide

This guide will help you set up Google Authentication using Firebase for your Tour Maker application.

## Overview

The application has been updated to use Firebase Authentication instead of the device-based "Claim Player" system. Users must now sign in with their Google account to access scoring functionality.

## Changes Made

### Removed Features
- ❌ "Claim this player" functionality
- ❌ Player claiming by code
- ❌ Device-based authorization
- ❌ `claimedBy` and `playerCode` fields from Player type

### Added Features
- ✅ Firebase Authentication with Google Sign-In
- ✅ Authentication context and hooks (`useAuth`)
- ✅ Login/Logout UI components
- ✅ Token-based authentication (JWT from Firebase)
- ✅ Email-based user identification

## Firebase Project Setup

### Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter your project name (e.g., "Tour Maker")
4. Follow the setup wizard (you can disable Google Analytics if you don't need it)
5. Click "Create project"

### Step 2: Enable Google Authentication

1. In your Firebase project, go to **Authentication** in the left sidebar
2. Click **Get Started**
3. Go to the **Sign-in method** tab
4. Click on **Google** in the providers list
5. Toggle the **Enable** switch
6. Enter a **Project support email** (your email)
7. Click **Save**

### Step 3: Register Your Web App

1. In your Firebase project overview, click the **Web** icon (`</>`)
2. Enter an app nickname (e.g., "Tour Maker Web")
3. **DO NOT** check "Also set up Firebase Hosting" (unless you want to use Firebase Hosting)
4. Click **Register app**
5. Copy the Firebase configuration object (you'll need this in the next step)

### Step 4: Configure Environment Variables

1. Create a `.env` file in the root of your project:
   ```bash
   cp .env.example .env
   ```

2. Edit the `.env` file and add your Firebase configuration:
   ```env
   VITE_FIREBASE_API_KEY=your-api-key-here
   VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
   VITE_FIREBASE_APP_ID=your-app-id
   ```

3. Replace the placeholder values with your actual Firebase config values from Step 3

### Step 5: Add Authorized Domains (for Production)

When deploying to production:

1. Go to **Authentication** > **Settings** > **Authorized domains**
2. Add your production domain (e.g., `yourapp.com`)
3. Firebase automatically allows `localhost` for development

## How It Works

### Authentication Flow

1. **User opens the app** → AuthProvider listens for auth state changes
2. **User clicks "Sign in with Google"** → Firebase OAuth popup appears
3. **User signs in** → Firebase returns user object with:
   - `user.email` - User's email address
   - `user.uid` - Unique user ID
   - `user.displayName` - User's name
   - `user.photoURL` - Profile picture URL
4. **User is authenticated** → Can now access scoring features

### Authorization (Current Implementation)

**Current Behavior:**
- ✅ Authenticated users can score for **ALL** players in a round
- ❌ Unauthenticated users cannot score at all

**Future Implementation (for your backend):**
When you implement your backend, you should:
1. Get the user's ID token: `const token = await user.getIdToken()`
2. Send this token with API requests
3. Verify the token on your backend
4. Check the user's email against your database to determine permissions
5. Return which players/tournaments the user can access

### Using Authentication in Your Code

The `useAuth` hook provides authentication state and methods:

```tsx
import { useAuth } from '@/contexts/AuthContext';

function MyComponent() {
  const { user, loading, signInWithGoogle, signOut, getAuthToken } = useAuth();

  // Check if user is authenticated
  if (user) {
    console.log('User email:', user.email);
  }

  // Get auth token for API calls
  const handleApiCall = async () => {
    const token = await getAuthToken();
    // Send token to your backend
    fetch('/api/endpoint', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  };

  return (
    <div>
      {user ? (
        <button onClick={signOut}>Sign Out</button>
      ) : (
        <button onClick={signInWithGoogle}>Sign In</button>
      )}
    </div>
  );
}
```

## File Structure

### New Files
- `src/lib/firebase.ts` - Firebase initialization and configuration
- `src/contexts/AuthContext.tsx` - Authentication context provider
- `src/components/auth/AuthButton.tsx` - Login/logout UI component
- `src/lib/auth/permissions.ts` - Authorization utilities
- `.env.example` - Environment variable template

### Modified Files
- `src/main.tsx` - Added AuthProvider wrapper
- `src/pages/HomePage.tsx` - Added AuthButton to header
- `src/types/core.ts` - Removed `claimedBy` and `playerCode` from Player type
- All scoring components - Updated to use authentication instead of device claims

## Testing Authentication

### Local Development

1. Start the dev server:
   ```bash
   npm run dev
   ```

2. Open the app in your browser
3. You should see the "Sign in with Google" button in the top right
4. Click it and sign in with your Google account
5. Try accessing scoring features - they should work when authenticated
6. Click "Sign Out" and try scoring - it should show no players to score

### Production Deployment

1. Build the app:
   ```bash
   npm run build
   ```

2. Deploy the `dist` folder to your hosting provider
3. Make sure to set environment variables on your hosting platform
4. Add your production domain to Firebase authorized domains

## Security Considerations

### Current Setup (Client-Side Only)
- ✅ Users must authenticate with Google
- ⚠️ Authorization is client-side only (users can score for anyone)
- ⚠️ No backend verification yet

### Recommended Backend Implementation

When you build your backend:

1. **Verify Firebase tokens server-side:**
   ```javascript
   const admin = require('firebase-admin');

   // Verify the token
   const decodedToken = await admin.auth().verifyIdToken(token);
   const userEmail = decodedToken.email;
   ```

2. **Implement authorization database:**
   ```sql
   CREATE TABLE user_permissions (
     user_email VARCHAR(255),
     tournament_id VARCHAR(255),
     player_id VARCHAR(255),
     can_score BOOLEAN,
     PRIMARY KEY (user_email, tournament_id, player_id)
   );
   ```

3. **Check permissions on each request:**
   ```javascript
   // Check if user can score for this player
   const canScore = await checkUserPermission(
     userEmail,
     tournamentId,
     playerId
   );
   ```

## Troubleshooting

### "Sign in with Google" button doesn't work
- Check that you've enabled Google authentication in Firebase Console
- Verify that your environment variables are set correctly
- Check browser console for errors

### "Unauthorized domain" error
- Add your domain to Firebase authorized domains
- For localhost, make sure you're using `http://localhost:5173` (default Vite port)

### Build fails
- Make sure all environment variables are set
- Check that `.env` file exists and has correct values
- Firebase config values should NOT be in quotes

### Users see "no players to score"
- Make sure the user is signed in (check for user in top right)
- Check browser console for authentication errors
- Verify that the scoring component is checking `canUserScore(user)`

## Getting User Email in Backend

When you implement your backend, here's how to get the authenticated user's email:

```javascript
// Node.js/Express example
const admin = require('firebase-admin');

app.post('/api/score', async (req, res) => {
  const token = req.headers.authorization?.split('Bearer ')[1];

  try {
    // Verify the Firebase token
    const decodedToken = await admin.auth().verifyIdToken(token);
    const userEmail = decodedToken.email;
    const userId = decodedToken.uid;

    // Now check your database to see what this user can do
    const permissions = await db.getUserPermissions(userEmail);

    if (!permissions.canScore) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Process the scoring request
    // ...
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});
```

## Next Steps

1. ✅ Complete Firebase setup (follow steps above)
2. ✅ Test authentication locally
3. ⏭️ Design your user permissions database schema
4. ⏭️ Implement backend API with token verification
5. ⏭️ Update frontend to send tokens with API requests
6. ⏭️ Implement fine-grained authorization (who can score for which players)

## Support

- [Firebase Authentication Documentation](https://firebase.google.com/docs/auth)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)
- [Verifying ID Tokens](https://firebase.google.com/docs/auth/admin/verify-id-tokens)
