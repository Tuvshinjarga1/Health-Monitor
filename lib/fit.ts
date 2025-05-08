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

    // Шаардлагатай зүйлсийг шалгах
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    // Тохиргооны утгуудыг логдох
    console.log("🔑 Тохиргооны утгууд:", {
      hasClientId: !!clientId,
      clientIdLength: clientId?.length || 0,
      hasClientSecret: !!clientSecret,
      clientSecretLength: clientSecret?.length || 0,
      clientIdStart: clientId?.substring(0, 5) || "N/A",
      clientSecretStart: clientSecret?.substring(0, 5) || "N/A",
    });

    // Client ID, Client Secret шалгах
    if (!clientId || !clientSecret) {
      const error =
        "Google API тохиргоо дутуу байна: " +
        (!clientId ? "Client ID байхгүй" : "") +
        (!clientSecret ? "Client Secret байхгүй" : "");
      console.error("❌ " + error);
      throw new Error(error);
    }

    // Параметрүүдийг бэлдэх
    const params = new URLSearchParams();
    params.append("client_id", clientId);
    params.append("client_secret", clientSecret);
    params.append("grant_type", "refresh_token");
    params.append("refresh_token", refreshToken);

    // Параметрүүдийг логдох (тест зорилгоор)
    console.log("🔄 Токен шинэчлэх параметрүүд:", {
      client_id_present: params.has("client_id"),
      client_id_length: params.get("client_id")?.length || 0,
      client_secret_present: params.has("client_secret"),
      client_secret_length: params.get("client_secret")?.length || 0,
      grant_type: params.get("grant_type"),
      refresh_token_present: params.has("refresh_token"),
      refresh_token_length: params.get("refresh_token")?.length || 0,
      full_params_size: params.toString().length,
    });

    console.log("🔄 Токен шинэчлэх хүсэлт илгээж байна:", {
      url: "https://oauth2.googleapis.com/token",
      method: "POST",
      contentType: "application/x-www-form-urlencoded",
      paramsSize: params.toString().length,
    });

    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params,
    });

    console.log("🌐 Токен шинэчлэх хариу:", {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("❌ Токен шинэчлэхэд алдаа гарлаа:", errorData);
      console.error("❌ Токен шинэчлэх хүсэлтийн дэлгэрэнгүй:", {
        status: response.status,
        url: response.url,
        params_summary: {
          has_client_id: params.has("client_id"),
          has_client_secret: params.has("client_secret"),
          has_refresh_token: params.has("refresh_token"),
        },
      });

      // Алдааны төрлийг тодорхойлох
      let errorMessage = `Failed to refresh token: ${response.status} ${response.statusText}`;
      if (errorData.includes("invalid_client")) {
        errorMessage =
          "Google OAuth client_id эсвэл client_secret буруу байна.";
      } else if (errorData.includes("invalid_grant")) {
        errorMessage =
          "Refresh token хүчингүй болсон. Дахин нэвтрэх шаардлагатай.";
      } else if (errorData.includes("client_id")) {
        errorMessage = "Client ID байхгүй байна. Тохиргоогоо шалгана уу.";
      }

      throw new Error(errorMessage);
    }

    const tokens = await response.json();

    // Токены хугацааг 7 хоног болгох (604800 секунд)
    const ONE_WEEK_IN_SECONDS = 7 * 24 * 60 * 60; // 7 хоног хугацаатай болгох
    const tokenExpiry = Math.floor(Date.now() / 1000) + ONE_WEEK_IN_SECONDS;

    console.log("✅ Шинэ токен авлаа:", {
      accessToken: tokens.access_token
        ? tokens.access_token.substring(0, 10) + "..."
        : "байхгүй",
      originalExpiresIn: tokens.expires_in,
      newExpiresIn: ONE_WEEK_IN_SECONDS,
      tokenExpiry: tokenExpiry,
      tokenType: tokens.token_type,
    });

    return {
      accessToken: tokens.access_token,
      expiresIn: ONE_WEEK_IN_SECONDS,
      tokenExpiry: tokenExpiry,
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
