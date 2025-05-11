import { NextResponse } from "next/server";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../../../../lib/firebase";

// Энэ нь нээлттэй API эндпоинт - токен шаардахгүй
export async function GET(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const userId = params.userId;

    console.log("🔍 Нээлттэй API хүсэлт - тодорхой ажилтны мэдээлэл:", {
      userId,
      requestUrl: request.url,
    });

    // Firestore-с ажилтны мэдээлэл авах
    if (!db) {
      return NextResponse.json(
        { error: "Firebase DB холбогдоогүй байна" },
        { status: 500 }
      );
    }

    // Ажилтны мэдээлэл авах
    const officerRef = doc(db, "officers", userId);
    const officerSnap = await getDoc(officerRef);

    if (!officerSnap.exists()) {
      return NextResponse.json(
        { error: "Ажилтны мэдээлэл олдсонгүй" },
        { status: 404 }
      );
    }

    // Мэдээлэл авах
    const data = officerSnap.data();

    // Зөвхөн нээлттэй мэдээлэл буцаах - токен зэрэг мэдрэмтгий мэдээллийг арилгах
    const publicData = {
      id: officerSnap.id,
      userId: data.userId,
      name: data.name,
      lastUpdated: data.lastUpdated
        ? data.lastUpdated.toDate().toISOString()
        : null,
      // Фитнесс мэдээлэл буцаах (хэрэв байгаа бол)
      fitnessData: data.fitnessData
        ? {
            steps: data.fitnessData.steps,
            heartRate: data.fitnessData.heartRate,
            calories: data.fitnessData.calories,
            lastUpdated: data.fitnessData.timestamp
              ? new Date(data.fitnessData.timestamp).toISOString()
              : null,
          }
        : null,
      // Хэмжээст мэдээлэл нь гарч байна уу гэдгийг мэдэгдэх
      hasTokens: !!(data.accessToken && data.refreshToken),
      supervisor: data.supervisorId || null,
    };

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      officer: publicData,
    });
  } catch (error) {
    console.error("❌ Нээлттэй API endpoint алдаа:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
