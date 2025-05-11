import { NextResponse } from "next/server";
import { collection, getDocs, query, where, limit } from "firebase/firestore";
import { db } from "../../../../lib/firebase";

// Энэ нь нээлттэй API эндпоинт - токен шаардахгүй
export async function GET(request: Request) {
  try {
    // URL-с параметрүүд авах
    const { searchParams } = new URL(request.url);
    const maxResults = parseInt(searchParams.get("limit") || "10");

    console.log("🔍 Нээлттэй API хүсэлт ирлээ:", {
      maxResults,
      requestUrl: request.url,
    });

    // Хариулт үүсгэх
    const response: {
      timestamp: string;
      serverTime: string;
      databaseConnected: boolean;
      officersCount: number;
      officersList: any[];
      error: string | null;
    } = {
      timestamp: new Date().toISOString(),
      serverTime: new Date().toLocaleString("mn-MN"),
      databaseConnected: false,
      officersCount: 0,
      officersList: [],
      error: null,
    };

    // Firestore-д холбогдох
    try {
      if (!db) {
        throw new Error("Firebase DB холбогдоогүй байна");
      }

      response.databaseConnected = true;

      // Цагдаа нарын жагсаалт авах - зөвхөн нээлттэй мэдээлэл
      const officersRef = collection(db, "officers");
      const q = query(officersRef, limit(maxResults));
      const querySnapshot = await getDocs(q);

      // Дүн мэдээлэл үүсгэх
      response.officersCount = querySnapshot.size;

      // Ажилтан бүрийн мэдээлэл цуглуулах - зөвхөн нээлттэй талбарууд
      querySnapshot.forEach((doc) => {
        const data = doc.data();

        // Хувийн мэдээллийг арилгаж зөвхөн нээлттэй мэдээлэл үлдээх
        response.officersList.push({
          id: doc.id,
          userId: data.userId,
          name: data.name,
          lastUpdated: data.lastUpdated
            ? data.lastUpdated.toDate().toISOString()
            : null,
          // Хэрэв fitnessData байгаа бол энгийн статистик мэдээлэл үзүүлэх
          fitnessStats: data.fitnessData
            ? {
                steps: data.fitnessData.steps,
                heartRate: data.fitnessData.heartRate,
                calories: data.fitnessData.calories,
              }
            : null,
        });
      });
    } catch (error) {
      console.error("⚠️ Нээлттэй API алдаа:", error);
      response.error = error instanceof Error ? error.message : "Unknown error";
    }

    // JSON хариулт буцаах
    return NextResponse.json(response);
  } catch (error) {
    console.error("❌ Нээлттэй API endpoint алдаа:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
