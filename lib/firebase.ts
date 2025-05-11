// lib/firebase.ts
import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  getDocs,
  query,
  where,
  orderBy,
  updateDoc,
  deleteDoc,
  Timestamp,
  serverTimestamp,
} from "firebase/firestore";
import { UserTokenInfo } from "./userStorage";

// Firebase тохиргоо
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

console.log("🔥 Firebase тохиргоо шалгаж байна:", {
  hasApiKey: !!firebaseConfig.apiKey,
  hasAuthDomain: !!firebaseConfig.authDomain,
  hasProjectId: !!firebaseConfig.projectId,
  hasAppId: !!firebaseConfig.appId,
});

// Check if any Firebase config values are missing
const missingConfigValues = Object.entries(firebaseConfig)
  .filter(([_, value]) => !value)
  .map(([key]) => key);

if (missingConfigValues.length > 0) {
  console.error("❌ Firebase тохиргооны дутуу утгууд:", missingConfigValues);
}

// Initialize Firebase
let app: FirebaseApp;
let db: any;
let auth: any;

try {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  auth = getAuth(app);
  db = getFirestore(app);
  console.log("✅ Firebase амжилттай холбогдлоо");
} catch (error) {
  console.error("❌ Firebase initialization error:", error);
  throw new Error("Firebase initialization failed");
}

// Цагдаа ажилтны мэдээллийг Firestore-д хадгалах
export async function savePoliceOfficerData(
  officerId: string,
  name: string,
  email: string,
  accessToken: string,
  refreshToken: string,
  tokenExpiry: number,
  supervisorId?: string // Хянагч эмчийн ID
) {
  try {
    console.log("🔑 Хадгалж буй токен мэдээлэл:", {
      officerId,
      name,
      email,
      accessToken: accessToken
        ? accessToken.substring(0, 10) + "..."
        : "байхгүй",
      refreshToken: refreshToken
        ? refreshToken.substring(0, 10) + "..."
        : "байхгүй",
      tokenExpiry,
      supervisorId,
    });

    // Validate required fields
    if (!officerId) {
      console.error("❌ OfficerId заавал шаардлагатай");
      return false;
    }

    if (!accessToken) {
      console.error("❌ AccessToken заавал шаардлагатай");
      return false;
    }

    if (!refreshToken) {
      console.error("❌ RefreshToken заавал шаардлагатай");
      return false;
    }

    // Токены хугацааг 60 жил болгох (1892160000 секунд)
    // Энэ нь бараг хугацаагүй гэсэн үг
    const SIXTY_YEARS_IN_SECONDS = 60 * 365 * 24 * 60 * 60; // 60 жил
    const now = Math.floor(Date.now() / 1000);
    let finalTokenExpiry = tokenExpiry;

    // Хэрэв tokenExpiry дамжуулаагүй эсвэл одоогоос 60 жилээс бага байвал 60 жил хугацаатай болгох
    if (!finalTokenExpiry || finalTokenExpiry - now < SIXTY_YEARS_IN_SECONDS) {
      finalTokenExpiry = now + SIXTY_YEARS_IN_SECONDS;
      console.log(
        "🔄 Токены хугацааг 60 жил болгож өөрчиллөө:",
        finalTokenExpiry
      );
    }

    // Fix the path (collection name) if needed. Make sure "officers" collection exists
    const collectionPath = "officers";
    console.log(
      `📁 Firestore "${collectionPath}" collection руу хадгалж байна, documentId: ${officerId}`
    );

    // Create the officer data object without supervisorId first
    const officerData: UserTokenInfo & { supervisorId?: string | null } = {
      userId: officerId,
      name,
      email,
      accessToken,
      refreshToken,
      tokenExpiry: finalTokenExpiry,
      lastUpdated: serverTimestamp(), // Серверийн timestamp ашиглах
    };

    // Only add supervisorId if it has a valid string value (not undefined)
    if (supervisorId) {
      officerData.supervisorId = supervisorId;
    } else {
      // Firestore doesn't allow undefined values, but null is permitted
      officerData.supervisorId = null;
    }

    console.log("📝 Хадгалах өгөгдөл:", {
      ...officerData,
      accessToken: accessToken
        ? accessToken.substring(0, 10) + "..."
        : "байхгүй",
      refreshToken: refreshToken
        ? refreshToken.substring(0, 10) + "..."
        : "байхгүй",
      lastUpdated: "serverTimestamp()",
    });

    // Try to set document data
    await setDoc(doc(db, collectionPath, officerId), officerData);
    console.log("✅ Firebase-д амжилттай хадгалагдлаа:", officerId);

    // Verify data was actually saved
    const savedDoc = await getDoc(doc(db, collectionPath, officerId));
    if (savedDoc.exists()) {
      console.log("✅ Хадгалсан мэдээлэл шалгалт амжилттай");
      return true;
    } else {
      console.error("❌ Мэдээлэл хадгалагдсан ч дараа нь олдсонгүй");
      return false;
    }
  } catch (error) {
    console.error("❌ Firebase-д хадгалахад алдаа гарлаа:", error);
    if (error instanceof Error) {
      console.error("❌ Алдааны дэлгэрэнгүй:", error.message);
      if (error.stack) {
        console.error("Stack trace:", error.stack);
      }
    }
    return false;
  }
}

// Цагдаа ажилтны мэдээллийг шинэчлэх
export async function updatePoliceOfficerData(
  officerId: string,
  fitnessData: any,
  tokens?: {
    accessToken?: string;
    refreshToken?: string;
    tokenExpiry?: number;
  }
) {
  try {
    console.log("🔄 Ажилтны мэдээллийг шинэчилж байна:", {
      officerId,
      hasFitnessData: !!fitnessData,
      hasTokens: !!tokens,
      tokenInfo: tokens
        ? {
            hasAccessToken: !!tokens.accessToken,
            hasRefreshToken: !!tokens.refreshToken,
            hasTokenExpiry: !!tokens.tokenExpiry,
          }
        : null,
    });

    // Шинэчлэх өгөгдлийг бэлдэх
    const updateData: any = {
      lastUpdated: serverTimestamp(), // Серверийн timestamp ашиглах
    };

    // Фитнес өгөгдөл байвал нэмэх
    if (fitnessData) {
      updateData.fitnessData = fitnessData;
      console.log("📊 Фитнес өгөгдөл нэмж байна:", {
        steps: fitnessData.steps,
        heartRate: fitnessData.heartRate,
        calories: fitnessData.calories,
      });
    }

    // Токен мэдээлэл байвал нэмэх
    if (tokens) {
      if (tokens.accessToken) {
        updateData.accessToken = tokens.accessToken;
        console.log("🔑 Access token шинэчилж байна");
      }

      if (tokens.refreshToken) {
        updateData.refreshToken = tokens.refreshToken;
        console.log("🔑 Refresh token шинэчилж байна");
      }

      if (tokens.tokenExpiry) {
        updateData.tokenExpiry = tokens.tokenExpiry;
        console.log("🔑 Token expiry шинэчилж байна:", tokens.tokenExpiry);
      }
    }

    // Firestore руу хадгалах
    console.log(
      `📝 "${officerId}" ID-тай ажилтны мэдээллийг шинэчилж байна`,
      updateData
    );
    await updateDoc(doc(db, "officers", officerId), updateData);

    // Шинэчлэлт амжилттай
    console.log("✅ Ажилтны мэдээлэл амжилттай шинэчлэгдлээ:", officerId);
    return true;
  } catch (error) {
    console.error("❌ Ажилтны мэдээлэл шинэчлэхэд алдаа гарлаа:", error);
    if (error instanceof Error) {
      console.error("❌ Алдааны дэлгэрэнгүй:", error.message);
      if (error.stack) {
        console.error("Stack trace:", error.stack);
      }
    }
    return false;
  }
}

// Хянагч нэг эмчийн хяналтан дахь бүх цагдаа ажилтны жагсаалтыг авах
export async function getSupervisorOfficers(supervisorId: string) {
  try {
    console.log("🔍 Ажилтны жагсаалт хайж байна:", supervisorId);

    // First, check if user has own data (finding by userId = email)
    let ownData = null;
    try {
      const userDocRef = doc(db, "officers", supervisorId);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        console.log("✅ Хэрэглэгчийн өөрийн мэдээлэл олдлоо:", supervisorId);
        const data = userDocSnap.data();
        // Convert Firestore Timestamp to JS Date
        if (data.lastUpdated) {
          data.lastUpdated =
            data.lastUpdated instanceof Timestamp
              ? data.lastUpdated.toDate()
              : data.lastUpdated;
        }
        ownData = data as UserTokenInfo;
      } else {
        console.log("⚠️ Хэрэглэгчийн өөрийн мэдээлэл олдсонгүй:", supervisorId);
      }
    } catch (err) {
      console.error(
        "❌ Хэрэглэгчийн өөрийн мэдээлэл хайхад алдаа гарлаа:",
        err
      );
    }

    // Now find all officers supervised by this user
    console.log(
      "🔎 Firestore query үүсгэж байна - supervised хэрэглэгчид хайх"
    );
    const officersRef = collection(db, "officers");
    const q = query(
      officersRef,
      where("supervisorId", "==", supervisorId),
      orderBy("lastUpdated", "desc")
    );

    console.log("🔎 Firestore query үүсгэв, хүсэлт илгээж байна");
    const querySnapshot = await getDocs(q);
    console.log("✅ Firestore хариу авлаа, хэмжээ:", querySnapshot.size);

    const officers: UserTokenInfo[] = [];

    // First add the user's own data if found
    if (ownData) {
      officers.push(ownData);
    }

    // Then add all supervised officers
    querySnapshot.forEach((doc) => {
      // Skip if this is the user's own data (already added)
      if (doc.id === supervisorId) {
        return;
      }

      const data = doc.data();
      console.log("📄 Supervised хэрэглэгчийн мэдээлэл олдлоо:", doc.id);

      // Firestore Timestamp объектыг JavaScript Date болгох
      if (data.lastUpdated) {
        // Timestamp болон JavaScript Date-д хөрвүүлэх
        data.lastUpdated =
          data.lastUpdated instanceof Timestamp
            ? data.lastUpdated.toDate()
            : data.lastUpdated;
      }

      officers.push(data as UserTokenInfo);
    });

    console.log("📋 Нийт олдсон ажилтны тоо:", officers.length);
    return officers;
  } catch (error) {
    console.error("❌ Supervisor ажилтны жагсаалт авахад алдаа гарлаа:", error);
    return [];
  }
}

// Нэг цагдаа ажилтны мэдээллийг авах
export async function getPoliceOfficerData(officerId: string) {
  try {
    console.log("🔍 Ажилтны мэдээлэл хайж байна:", officerId);

    const docRef = doc(db, "officers", officerId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();

      // Firestore Timestamp объектыг JavaScript Date болгох
      if (data.lastUpdated) {
        // Timestamp болон JavaScript Date-д хөрвүүлэх
        data.lastUpdated =
          data.lastUpdated instanceof Timestamp
            ? data.lastUpdated.toDate()
            : data.lastUpdated;
      }

      console.log("✅ Ажилтны мэдээлэл олдлоо:", {
        userId: data.userId,
        name: data.name,
        email: data.email,
        hasAccessToken: !!data.accessToken,
        hasRefreshToken: !!data.refreshToken,
        tokenExpiry: data.tokenExpiry,
        lastUpdated: data.lastUpdated,
        hasFitnessData: !!data.fitnessData,
      });

      return data as UserTokenInfo;
    } else {
      console.log("❌ Ажилтны мэдээлэл олдсонгүй:", officerId);
      return null;
    }
  } catch (error) {
    console.error("❌ Ажилтны мэдээлэл авахад алдаа гарлаа:", error);
    return null;
  }
}

// Цагдаа ажилтны мэдээллийг устгах
export async function removePoliceOfficerData(officerId: string) {
  try {
    await deleteDoc(doc(db, "officers", officerId));
    return true;
  } catch (error) {
    console.error("Error removing officer data:", error);
    return false;
  }
}

export { app, auth, db };
