// lib/firebase.ts
import { initializeApp, getApps } from "firebase/app";
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

// Initialize Firebase
const app =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const db = getFirestore(app);

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
    const officerData: UserTokenInfo & { supervisorId?: string } = {
      userId: officerId,
      name,
      email,
      accessToken,
      refreshToken,
      tokenExpiry,
      lastUpdated: serverTimestamp(), // Серверийн timestamp ашиглах
      supervisorId,
    };

    await setDoc(doc(db, "officers", officerId), officerData);
    return true;
  } catch (error) {
    console.error("Error saving officer data to Firestore:", error);
    return false;
  }
}

// Цагдаа ажилтны мэдээллийг шинэчлэх
export async function updatePoliceOfficerData(
  officerId: string,
  fitnessData: any
) {
  try {
    const updateData: any = {
      lastUpdated: serverTimestamp(), // Серверийн timestamp ашиглах
    };

    if (fitnessData) {
      updateData.fitnessData = fitnessData;
    }

    await updateDoc(doc(db, "officers", officerId), updateData);
    return true;
  } catch (error) {
    console.error("Error updating officer data:", error);
    return false;
  }
}

// Хянагч нэг эмчийн хяналтан дахь бүх цагдаа ажилтны жагсаалтыг авах
export async function getSupervisorOfficers(supervisorId: string) {
  try {
    const officersRef = collection(db, "officers");
    const q = query(
      officersRef,
      where("supervisorId", "==", supervisorId),
      orderBy("lastUpdated", "desc")
    );

    const querySnapshot = await getDocs(q);
    const officers: UserTokenInfo[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();

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

    return officers;
  } catch (error) {
    console.error("Error getting supervisor's officers:", error);
    return [];
  }
}

// Нэг цагдаа ажилтны мэдээллийг авах
export async function getPoliceOfficerData(officerId: string) {
  try {
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

      return data as UserTokenInfo;
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error getting officer data:", error);
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
