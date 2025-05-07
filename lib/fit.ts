// lib/fit.ts
export async function getGoogleFitData(accessToken: string) {
  try {
    console.log(
      "🔄 Google Fit API руу хүсэлт илгээж байна, токен:",
      accessToken.substring(0, 10) + "..."
    );

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startTimeMillis = today.getTime();
    const endTimeMillis = Date.now();

    const response = await fetch(
      "https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          aggregateBy: [
            {
              dataTypeName: "com.google.step_count.delta",
              dataSourceId:
                "derived:com.google.step_count.delta:com.google.android.gms:estimated_steps",
            },
            {
              dataTypeName: "com.google.heart_rate.bpm",
            },
            {
              dataTypeName: "com.google.calories.expended",
            },
          ],
          bucketByTime: { durationMillis: 86400000 },
          startTimeMillis,
          endTimeMillis,
        }),
      }
    );

    console.log(
      "🌐 Google Fit API хариу код:",
      response.status,
      response.statusText
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Google Fit API алдаа:", errorText);
      throw new Error(
        `Google Fit API responded with ${response.status} ${response.statusText}: ${errorText}`
      );
    }

    const data = await response.json();
    console.log(
      "✅ Google Fit өгөгдөл авлаа:",
      JSON.stringify(data).substring(0, 200) + "..."
    );

    // Өгөгдөл боловсруулах
    let steps = 0;
    let heartRateSum = 0;
    let heartRateCount = 0;
    let calories = 0;

    data.bucket.forEach((bucket: any) => {
      bucket.dataset.forEach((dataset: any) => {
        const dataSource = dataset.dataSourceId;
        dataset.point.forEach((point: any) => {
          const value = point.value[0];
          if (dataSource.includes("step_count")) {
            steps += value.intVal || 0;
          } else if (dataSource.includes("heart_rate") && value.fpVal) {
            heartRateSum += value.fpVal;
            heartRateCount++;
          } else if (dataSource.includes("calories") && value.fpVal) {
            calories += value.fpVal;
          }
        });
      });
    });

    const heartRate = heartRateCount > 0 ? heartRateSum / heartRateCount : 0;

    const result = {
      steps,
      heartRate: Math.round(heartRate),
      calories: Math.round(calories),
      rawData: data,
    };

    console.log("✅ Боловсруулсан өгөгдөл:", result);
    return result;
  } catch (error) {
    console.error("❌ Google Fit API алдаа:", error);
    throw error;
  }
}

// Google API-н токеныг шинэчлэх функц
export async function refreshAccessToken(refreshToken: string) {
  try {
    console.log(
      "🔄 Токен шинэчилж байна, refresh token:",
      refreshToken.substring(0, 10) + "..."
    );

    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "",
        client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Токен шинэчлэхэд алдаа гарлаа:", errorText);
      throw new Error(
        `Failed to refresh token: ${response.status} ${response.statusText}`
      );
    }

    const tokens = await response.json();
    console.log("✅ Шинэ токен авлаа:", {
      accessToken: tokens.access_token
        ? tokens.access_token.substring(0, 10) + "..."
        : "байхгүй",
      expiresIn: tokens.expires_in,
      tokenExpiry: Math.floor(Date.now() / 1000) + tokens.expires_in,
      tokenType: tokens.token_type,
    });

    return {
      accessToken: tokens.access_token,
      expiresIn: tokens.expires_in,
      tokenExpiry: Math.floor(Date.now() / 1000) + tokens.expires_in,
      tokenType: tokens.token_type,
    };
  } catch (error) {
    console.error("❌ Токен шинэчлэх процесст алдаа гарлаа:", error);
    throw error;
  }
}

// Бүх хэрэглэгчийн Google Fit өгөгдлийг авах
export async function fetchAllUsersGoogleFitData(
  userTokens: {
    userId: string;
    accessToken: string;
    tokenExpiry: number;
    refreshToken: string;
  }[]
) {
  const results: any[] = [];

  for (const user of userTokens) {
    try {
      // Хугацаа дууссан эсэхийг шалгах
      const now = Math.floor(Date.now() / 1000);
      let userAccessToken = user.accessToken;

      if (now > user.tokenExpiry) {
        // Токен хугацаа дууссан тул шинэчлэх
        const newTokens = await refreshAccessToken(user.refreshToken);
        userAccessToken = newTokens.accessToken;
        // Шинэ токены мэдээллийг хадгалах (IndexedDB эсвэл localStorage) шаардлагатай бол
      }

      // Google Fit өгөгдөл авах
      const fitData = await getGoogleFitData(userAccessToken);

      // Үр дүнг цуглуулах
      results.push({
        userId: user.userId,
        steps: fitData.steps,
        heartRate: fitData.heartRate,
        calories: fitData.calories,
        timestamp: new Date(),
      });
    } catch (error) {
      console.error(`Error fetching data for user ${user.userId}:`, error);
      // Алдаатай хэрэглэгчийг алгасч, дараагийнх руу орох
    }
  }

  return results;
}
