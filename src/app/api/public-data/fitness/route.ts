import { NextResponse } from "next/server";
import { collection, getDocs, query, where, limit } from "firebase/firestore";
import { db } from "../../../../../lib/firebase";

// Энэ нь нээлттэй API эндпоинт - токен шаардахгүй
export async function GET(request: Request) {
  try {
    // URL-с параметрүүд авах
    const { searchParams } = new URL(request.url);
    const maxResults = parseInt(searchParams.get("limit") || "50");

    console.log("📊 Нээлттэй фитнесс мэдээллийн API хүсэлт ирлээ:", {
      maxResults,
      requestUrl: request.url,
    });

    // Хариулт үүсгэх
    const response: {
      timestamp: string;
      dataCount: number;
      fitnessData: any[];
      error: string | null;
    } = {
      timestamp: new Date().toISOString(),
      dataCount: 0,
      fitnessData: [],
      error: null,
    };

    // Firestore-д холбогдох
    if (!db) {
      return NextResponse.json(
        { error: "Firebase DB холбогдоогүй байна" },
        { status: 500 }
      );
    }

    // Цагдаа нарын жагсаалт авах
    const officersRef = collection(db, "officers");
    const q = query(officersRef, limit(maxResults));
    const querySnapshot = await getDocs(q);

    // Зөвхөн фитнесс мэдээлэл бүхий ажилтнуудыг цуглуулах
    querySnapshot.forEach((doc) => {
      const data = doc.data();

      // Зөвхөн fitnessData-тай бичлэгүүдийг авах
      if (data.fitnessData) {
        response.fitnessData.push({
          userId: data.userId,
          name: data.name,
          stats: {
            steps: data.fitnessData.steps,
            heartRate: data.fitnessData.heartRate,
            calories: data.fitnessData.calories,
            timestamp: data.fitnessData.timestamp
              ? new Date(data.fitnessData.timestamp).toISOString()
              : null,
          },
        });
      }
    });

    // Дүн мэдээлэл үүсгэх
    response.dataCount = response.fitnessData.length;

    // Зэрэглэлээр эрэмблэх - алхалт хамгийн их байх
    response.fitnessData.sort((a, b) => b.stats.steps - a.stats.steps);

    // JSON хариулт буцаах
    return NextResponse.json(response);
  } catch (error) {
    console.error("❌ Нээлттэй фитнесс API endpoint алдаа:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
