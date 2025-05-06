import { signInWithCustomToken } from "firebase/auth";
import { auth, db } from "./firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";

// NextAuth session-оос авсан OAuth токеныг Firebase-руу оруулах
export async function syncUserWithFirebase(session: any) {
  if (!session?.user) return null;

  try {
    const userId = session.user.email;

    // Firestore-д хэрэглэгчийн мэдээлэл байгаа эсэхийг шалгах
    const userDocRef = doc(db, "users", userId);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      // Шинэ хэрэглэгч бол мэдээлэл үүсгэх
      await setDoc(userDocRef, {
        email: session.user.email,
        name: session.user.name,
        image: session.user.image,
        createdAt: new Date(),
      });

      // Хэрэглэгчийн профайл үүсгэх
      const profileDocRef = doc(db, "userProfiles", userId);
      await setDoc(profileDocRef, {
        name: session.user.name,
        email: session.user.email,
        image: session.user.image,
        createdAt: new Date(),
      });
    }

    return userId;
  } catch (error) {
    console.error("Error syncing user with Firebase:", error);
    return null;
  }
}
