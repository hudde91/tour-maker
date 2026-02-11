import { createMiddleware } from "hono/factory";
import admin from "firebase-admin";

// Initialize Firebase Admin SDK (once)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

export interface AuthUser {
  uid: string;
  email?: string;
}

// Extend Hono's context variables
declare module "hono" {
  interface ContextVariableMap {
    user: AuthUser;
  }
}

/**
 * Middleware that verifies Firebase JWT tokens.
 * Attaches the decoded user to c.var.user.
 */
export const authMiddleware = createMiddleware(async (c, next) => {
  const authHeader = c.req.header("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return c.json({ error: "unauthorized", message: "Missing or invalid Authorization header" }, 401);
  }

  const token = authHeader.slice(7);

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    c.set("user", { uid: decoded.uid, email: decoded.email });
    await next();
  } catch {
    return c.json({ error: "unauthorized", message: "Invalid or expired token" }, 401);
  }
});

/**
 * Optional auth middleware -- sets user if token is present, but doesn't block.
 * Useful for public endpoints (e.g., leaderboard via shareable URL).
 */
export const optionalAuthMiddleware = createMiddleware(async (c, next) => {
  const authHeader = c.req.header("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    try {
      const decoded = await admin.auth().verifyIdToken(token);
      c.set("user", { uid: decoded.uid, email: decoded.email });
    } catch {
      // Invalid token, continue without user
    }
  }
  await next();
});
