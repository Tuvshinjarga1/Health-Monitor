import { NextResponse } from "next/server";
import { getDoc, doc } from "firebase/firestore";
import { db } from "../../../../lib/firebase";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, test } = body;

    console.log("🔥 Firebase шалгалт эхэллээ:", { email, test });

    // Object to store all results
    const results: {
      timestamp: string;
      databaseConnected: boolean;
      userExists: boolean;
      userDocument: any | null;
      error: string | null;
    } = {
      timestamp: new Date().toISOString(),
      databaseConnected: false,
      userExists: false,
      userDocument: null,
      error: null,
    };

    // Verify database connection
    try {
      if (!db) {
        throw new Error("Firebase DB холбогдоогүй байна");
      }

      results.databaseConnected = true;

      // Only check user if email provided
      if (email) {
        const userRef = doc(db, "officers", email);
        const userSnapshot = await getDoc(userRef);

        results.userExists = userSnapshot.exists();

        if (userSnapshot.exists()) {
          const data = userSnapshot.data();
          // Clean sensitive data
          results.userDocument = {
            userId: data.userId,
            name: data.name,
            email: data.email,
            hasAccessToken: !!data.accessToken,
            hasRefreshToken: !!data.refreshToken,
            tokenExpiry: data.tokenExpiry,
            lastUpdated: data.lastUpdated,
            hasFitnessData: !!data.fitnessData,
          };
        }
      }
    } catch (error) {
      console.error("Firebase шалгалтын алдаа:", error);
      results.error = error instanceof Error ? error.message : "Unknown error";
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error("API endpoint error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
