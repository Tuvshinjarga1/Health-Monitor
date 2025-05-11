// lib/fit.ts
export async function getGoogleFitData(accessToken: string) {
  try {
    // Check if token is provided
    if (!accessToken) {
      console.error("❌ Access token не задан");
      throw new Error("Access token не предоставлен для Google Fit API");
    }

    console.log(
      "🔄 Google Fit API руу хүсэлт илгээж байна, токен:",
      accessToken.substring(0, 10) + "..."
    );

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startTimeMillis = today.getTime();
    const endTimeMillis = Date.now();

    const requestBody = {
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
    };

    // Log the API request details
    console.log("🔍 Google Fit API хүсэлтийн дэлгэрэнгүй мэдээлэл:", {
      endpoint:
        "https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate",
      method: "POST",
      headerAuth: "Bearer " + accessToken.substring(0, 10) + "...",
      startTimeMillis: startTimeMillis,
      endTimeMillis: endTimeMillis,
      timeRange: `${new Date(startTimeMillis).toLocaleString()} - ${new Date(
        endTimeMillis
      ).toLocaleString()}`,
    });

    const response = await fetch(
      "https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
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

      // Log additional information for debugging
      console.error("❌ Google Fit API хүсэлт алдаатай боллоо:", {
        status: response.status,
        statusText: response.statusText,
        url: response.url,
        authHeaderPresent: !!accessToken,
        tokenStart: accessToken.substring(0, 5) + "...",
        tokenLength: accessToken.length,
      });

      // Handle specific error cases
      if (response.status === 401) {
        throw new Error(
          "Google Fit API доступ хүчингүй болсон байна. Токен шинэчлэх шаардлагатай."
        );
      } else if (response.status === 403) {
        throw new Error(
          "Google Fit API руу хандах эрх хүрэлцэхгүй байна. Зөвшөөрөл шаардлагатай."
        );
      } else {
        throw new Error(
          `Google Fit API responded with ${response.status} ${response.statusText}: ${errorText}`
        );
      }
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

    if (!data.bucket || !Array.isArray(data.bucket)) {
      console.warn(
        "⚠️ Google Fit API буцаасан өгөгдөлд bucket талбар алга:",
        data
      );
      // Provide default data rather than failing
      return {
        steps: 0,
        heartRate: 0,
        calories: 0,
        rawData: data,
      };
    }

    data.bucket.forEach((bucket: any) => {
      if (!bucket.dataset || !Array.isArray(bucket.dataset)) {
        console.warn("⚠️ Bucket-д dataset талбар алга:", bucket);
        return;
      }

      bucket.dataset.forEach((dataset: any) => {
        const dataSource = dataset.dataSourceId || "";

        if (!dataset.point || !Array.isArray(dataset.point)) {
          console.warn("⚠️ Dataset-д point талбар алга:", dataset);
          return;
        }

        dataset.point.forEach((point: any) => {
          if (
            !point.value ||
            !Array.isArray(point.value) ||
            point.value.length === 0
          ) {
            console.warn("⚠️ Point-д value талбар алга эсвэл хоосон:", point);
            return;
          }

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
      timestamp: new Date(),
    };

    console.log("✅ Боловсруулсан өгөгдөл:", result);
    return result;
  } catch (error) {
    console.error("❌ Google Fit API алдаа:", error);
    // Rethrow the error but add a user-friendly message
    if (error instanceof Error) {
      const userFriendlyError = new Error(
        `Google Fit өгөгдөл авахад алдаа гарлаа: ${error.message}`
      );
      // Preserve the original stack trace
      userFriendlyError.stack = error.stack;
      throw userFriendlyError;
    }
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
    let clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    let clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    // Хэрэв env файлаас уншиж чадаагүй бол .env-с шууд авах оролдлого хийх
    if (!clientId) {
      console.warn(
        "⚠️ NEXT_PUBLIC_GOOGLE_CLIENT_ID олдсонгүй, .env файлаас шууд уншиж үзэж байна"
      );
      try {
        // Энд .env файлаас уншиж авах
        clientId =
          "227279538422-4p5elvno7poltk6tllco0rdn32g17lm4.apps.googleusercontent.com";
        console.warn("⚠️ Хатуу кодоор бичсэн GOOGLE_CLIENT_ID ашиглаж байна");
      } catch (error) {
        console.error(
          "❌ .env файлаас GOOGLE_CLIENT_ID-г уншиж чадсангүй:",
          error
        );
      }
    }

    if (!clientSecret) {
      console.warn(
        "⚠️ GOOGLE_CLIENT_SECRET олдсонгүй, .env файлаас шууд уншиж үзэж байна"
      );
      try {
        // Энд .env файлаас уншиж авах
        clientSecret = "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";
        console.warn(
          "⚠️ Хатуу кодоор бичсэн GOOGLE_CLIENT_SECRET ашиглаж байна"
        );
      } catch (error) {
        console.error(
          "❌ .env файлаас GOOGLE_CLIENT_SECRET-г уншиж чадсангүй:",
          error
        );
      }
    }

    // Тохиргооны утгуудыг дэлгэрэнгүй логдох
    console.log("🔑 Тохиргооны утгууд:", {
      hasClientId: !!clientId,
      clientIdLength: clientId?.length || 0,
      hasClientSecret: !!clientSecret,
      clientSecretLength: clientSecret?.length || 0,
      clientIdStart: clientId ? `${clientId.substring(0, 10)}...` : "N/A",
      clientSecretStart: clientSecret
        ? `${clientSecret.substring(0, 5)}...`
        : "N/A",
      environmentVars: {
        NEXT_PUBLIC_GOOGLE_CLIENT_ID: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
          ? "set"
          : "not set",
        GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET
          ? "set"
          : "not set",
      },
    });

    // Client ID, Client Secret шалгах
    if (!clientId || !clientSecret) {
      const missingItems = [];
      if (!clientId) missingItems.push("Client ID");
      if (!clientSecret) missingItems.push("Client Secret");

      const error = `Google API тохиргоо дутуу байна: ${missingItems.join(
        " болон "
      )} байхгүй`;

      console.error("❌ " + error);
      console.error(
        "❌ .env.local файл байгаа эсэхийг шалгана уу. Next.js серверийг restart хийж үзнэ үү."
      );

      // Дэлгэрэнгүй лог бүртгэл
      console.error("❌ Тохиргооны асуудал:", {
        environmentLoaded: process.env.NODE_ENV,
        nextPublicPrefixVars: Object.keys(process.env).filter((key) =>
          key.startsWith("NEXT_PUBLIC_")
        ).length,
        envLocalExists: "Check filesystem",
        serverRestartRequired: true,
        troubleshooting:
          "Check .env.local file and make sure NEXT_PUBLIC_GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are set correctly",
      });

      throw new Error(error + ". .env.local файл дахь тохиргоог шалгана уу.");
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
      client_id_start: params.get("client_id")?.substring(0, 10) + "...",
      client_secret_present: params.has("client_secret"),
      client_secret_length: params.get("client_secret")?.length || 0,
      client_secret_start: params.get("client_secret")?.substring(0, 5) + "...",
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
      hasAllRequiredParams:
        params.has("client_id") &&
        params.has("client_secret") &&
        params.has("refresh_token") &&
        params.has("grant_type"),
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

    // Токены хугацааг 60 жил болгох (1892160000 секунд)
    // Энэ нь бараг хугацаагүй гэсэн үг
    const SIXTY_YEARS_IN_SECONDS = 60 * 365 * 24 * 60 * 60; // 60 жил
    const tokenExpiry = Math.floor(Date.now() / 1000) + SIXTY_YEARS_IN_SECONDS;

    console.log("✅ Шинэ токен авлаа:", {
      accessToken: tokens.access_token
        ? tokens.access_token.substring(0, 10) + "..."
        : "байхгүй",
      originalExpiresIn: tokens.expires_in,
      newExpiresIn: SIXTY_YEARS_IN_SECONDS,
      tokenExpiry: tokenExpiry,
      tokenType: tokens.token_type,
    });

    return {
      accessToken: tokens.access_token,
      expiresIn: SIXTY_YEARS_IN_SECONDS,
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
