import { getAuth as getFirebaseAuth } from "firebase/auth";
import { app } from "./firebase";

// Firebase Authentication-ийг инициализаци хийх
const getAuth = () => getFirebaseAuth(app);

// User session-ийн төрлийг тодорхойлох
export interface UserSession {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  } | null;
  accessToken?: string;
  refreshToken?: string;
  tokenExpiry?: number;
  expires: Date;
}

// User session-ийг шинэчлэх
export function updateSession(
  session: UserSession,
  updates: Partial<UserSession>
): UserSession {
  return {
    ...session,
    ...updates,
  };
}

export { getAuth };
