"use client";

import { useState, useEffect } from "react";
import { getPoliceOfficerData, updatePoliceOfficerData } from "../lib/firebase";
import { getGoogleFitData, refreshAccessToken } from "../lib/fit";
import { formatDate, getTimeSince } from "../lib/utils";
import { UserTokenInfo } from "../lib/userStorage";

type PatientDetailsProps = {
  patientId: string;
};

export default function PatientDetails({ patientId }: PatientDetailsProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [patient, setPatient] = useState<UserTokenInfo | null>(null);
  const [fitnessData, setFitnessData] = useState<any>(null);

  useEffect(() => {
    const fetchPatientData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Firestore-с ажилтны мэдээлэл авах
        const data = await getPoliceOfficerData(patientId);
        if (!data) {
          setError("Ажилтны мэдээлэл олдсонгүй");
          return;
        }

        console.log("👤 Ажилтны мэдээлэл авлаа:", {
          userId: data.userId,
          name: data.name,
          email: data.email,
          hasAccessToken: !!data.accessToken,
          hasRefreshToken: !!data.refreshToken,
          tokenExpiry: data.tokenExpiry,
          lastUpdated: data.lastUpdated,
        });

        setPatient(data);

        // Ажилтны фитнесс өгөгдөл байгаа эсэхийг шалгах
        if (data.fitnessData) {
          console.log("📊 Байгаа өгөгдлийг харуулж байна");
          setFitnessData(data.fitnessData);
        } else {
          console.log("🔄 Шинэ өгөгдөл татаж байна");
          await fetchFitnessData(data);
        }
      } catch (err) {
        setError("Өгөгдөл авахад алдаа гарлаа");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (patientId) {
      fetchPatientData();
    }
  }, [patientId]);

  const fetchFitnessData = async (officerData: UserTokenInfo) => {
    try {
      setLoading(true);
      setError(null);

      // Лог нэмэх: хэрэглэгчийн мэдээлэл
      console.log("🚀 Fitnes өгөгдөл татах гэж байна хэрэглэгч:", {
        userId: officerData.userId,
        email: officerData.email,
        name: officerData.name,
        hasToken: !!officerData.accessToken,
        tokenExpiryTime: new Date(
          officerData.tokenExpiry * 1000
        ).toLocaleString(),
      });

      const now = Math.floor(Date.now() / 1000);
      let accessToken = officerData.accessToken;
      let tokenExpiry = officerData.tokenExpiry;
      let refreshToken = officerData.refreshToken;
      let tokensUpdated = false;

      console.log("🔐 Токены хугацаа шалгаж байна:", {
        now,
        tokenExpiry: officerData.tokenExpiry,
        isExpired: now > officerData.tokenExpiry,
        remainingTime: officerData.tokenExpiry - now,
        humanReadableExpiry: new Date(
          officerData.tokenExpiry * 1000
        ).toLocaleString(),
        tokenLength: officerData.accessToken?.length || 0,
      });

      // Токен хугацаа дууссан эсэхийг шалгаад шинэчлэх оролдлого
      if (now > officerData.tokenExpiry) {
        // Токен шинэчлэх
        console.log("🔄 Токен хугацаа дууссан, шинэчилж байна");
        try {
          const newTokens = await refreshAccessToken(officerData.refreshToken);
          accessToken = newTokens.accessToken;
          tokenExpiry = newTokens.tokenExpiry;
          tokensUpdated = true;

          console.log("✅ Шинэ токен авлаа:", {
            accessToken: accessToken
              ? accessToken.substring(0, 10) + "..."
              : "байхгүй",
            tokenExpiry: newTokens.tokenExpiry,
            humanReadableExpiry: new Date(
              newTokens.tokenExpiry * 1000
            ).toLocaleString(),
          });

          // Токенуудыг Firestore-д хадгалах
          await updatePoliceOfficerData(
            officerData.userId,
            {}, // Хоосон фитнесс өгөгдөл
            {
              accessToken,
              refreshToken,
              tokenExpiry,
            }
          );

          // Хэрэглэгчийн мэдээллийг шинэчлэх
          const updatedOfficerData = {
            ...officerData,
            accessToken,
            tokenExpiry,
            refreshToken,
          };
          setPatient(updatedOfficerData);
        } catch (refreshError) {
          console.error(
            "⚠️ Токен шинэчлэхэд алдаа гарлаа, хуучин токеныг ашиглахыг оролдоно:",
            refreshError
          );

          // Алдааны дэлгэрэнгүй мэдээлэл логдох
          const errorMessage =
            refreshError instanceof Error
              ? refreshError.message
              : String(refreshError);

          console.error("🔍 Токен шинэчлэх алдааны дэлгэрэнгүй мэдээлэл:", {
            errorType:
              refreshError instanceof Error
                ? refreshError.constructor.name
                : typeof refreshError,
            message: errorMessage,
            hasClientIdReference:
              errorMessage.includes("client") && errorMessage.includes("ID"),
            hasAuthReference:
              errorMessage.includes("auth") || errorMessage.includes("401"),
            refreshTokenLength: officerData.refreshToken?.length || 0,
          });

          // Хуучин токеныг ашиглах оролдлого хийх
          console.log(
            "🔧 Токен шинэчлэх алдаатай, дараагийн үе шат руу шилжиж байна"
          );

          // Хэрэглэгчид харуулах алдааны мессежийг зогсоож байна
          // setError(`Токен шинэчлэхэд алдаа гарлаа: ${errorMessage}`);
        }
      } else {
        console.log("✅ Токен хүчинтэй байна");
      }

      // Google Fit-ээс өгөгдөл авах оролдлого хийх
      console.log("🔍 Google Fit-ээс өгөгдөл татаж байна");
      try {
        const fitData = await getGoogleFitData(accessToken);

        // Өгөгдлийг хадгалах
        console.log("💾 Firestore-д өгөгдлийг хадгалж байна:", fitData);

        // Хэрэв токенууд шинэчлэгдсэн бол, бүх мэдээллийг хамт хадгалах
        let updateSuccess = false;
        if (tokensUpdated) {
          updateSuccess = await updatePoliceOfficerData(
            officerData.userId,
            fitData,
            {
              accessToken,
              refreshToken,
              tokenExpiry,
            }
          );
        } else {
          // Зөвхөн фитнесс мэдээллийг хадгалах
          updateSuccess = await updatePoliceOfficerData(
            officerData.userId,
            fitData
          );
        }

        if (updateSuccess) {
          console.log("✅ Өгөгдөл амжилттай хадгалагдлаа");

          // UI-д мэдээллийг шинэчлэх
          setFitnessData(fitData);

          // Хэрэглэгчийн мэдээллийг шинэчлэх
          setPatient((prev) => {
            if (!prev) return null;
            return {
              ...prev,
              fitnessData: fitData,
              lastUpdated: new Date(),
              ...(tokensUpdated
                ? { accessToken, tokenExpiry, refreshToken }
                : {}),
            };
          });
        } else {
          console.error("❌ Өгөгдөл хадгалахад алдаа гарлаа");
          setError("Өгөгдөл хадгалахад алдаа гарлаа. Дахин оролдоно уу.");
        }
      } catch (fitError) {
        // Хэрэв токен хугацаа дууссан гэсэн алдаа бол
        const errorMessage =
          fitError instanceof Error ? fitError.message : String(fitError);

        // Алдааны дэлгэрэнгүй мэдээлэл логдох
        console.error("❌ Google Fit өгөгдөл татахад алдаа гарлаа:", {
          errorType:
            fitError instanceof Error
              ? fitError.constructor.name
              : typeof fitError,
          message: errorMessage,
          hasAuthReference:
            errorMessage.includes("auth") ||
            errorMessage.includes("401") ||
            errorMessage.includes("доступ хүчингүй"),
          accessTokenLength: accessToken?.length || 0,
          accessTokenStart: accessToken
            ? accessToken.substring(0, 5) + "..."
            : "байхгүй",
        });

        // Токен дууссан алдааг дотооддоо шийдэх оролдлого хийх
        if (
          errorMessage.includes("401") ||
          errorMessage.includes("auth") ||
          errorMessage.includes("доступ хүчингүй")
        ) {
          console.log(
            "🔄 Токен хугацаа дууссан байх магадлалтай, нэмэлт оролдлого хийж байна"
          );
          try {
            // Шинэ токен авах оролдлого хийх
            const newTokens = await refreshAccessToken(
              officerData.refreshToken
            );
            accessToken = newTokens.accessToken;
            tokenExpiry = newTokens.tokenExpiry;

            // Шинэ токеноор өгөгдөл авах
            console.log("🔍 Шинэ токеноор Google Fit өгөгдөл татаж байна");
            const fitData = await getGoogleFitData(accessToken);

            // Шинэ токен ба өгөгдөл хадгалах
            const updateSuccess = await updatePoliceOfficerData(
              officerData.userId,
              fitData,
              {
                accessToken,
                refreshToken: officerData.refreshToken,
                tokenExpiry,
              }
            );

            if (updateSuccess) {
              setFitnessData(fitData);
              setPatient((prev) => {
                if (!prev) return null;
                return {
                  ...prev,
                  accessToken,
                  tokenExpiry,
                  fitnessData: fitData,
                  lastUpdated: new Date(),
                };
              });
              console.log("✅ Токен шинэчлэлт амжилттай боллоо");
              setError(null);
            } else {
              console.error("❌ Шинэ токен хадгалахад алдаа гарлаа");
              // Хэрэглэгчид дэлгэцэнд харуулахгүй
            }
          } catch (retryError) {
            const retryErrorMessage =
              retryError instanceof Error
                ? retryError.message
                : String(retryError);

            console.error(
              "❌ Автомат токен шинэчлэх оролдлого амжилтгүй боллоо:",
              retryError
            );

            // Алдааны дэлгэрэнгүй мэдээлэл логдох
            console.error(
              "🔍 Дахин токен шинэчлэх алдааны дэлгэрэнгүй мэдээлэл:",
              {
                errorType:
                  retryError instanceof Error
                    ? retryError.constructor.name
                    : typeof retryError,
                message: retryErrorMessage,
                hasClientIdReference:
                  retryErrorMessage.includes("client") &&
                  retryErrorMessage.includes("ID"),
                hasAuthReference:
                  retryErrorMessage.includes("auth") ||
                  retryErrorMessage.includes("401"),
              }
            );

            // Хэрэглэгчид харуулах алдааны текстийг нуух
            // Дахин холбогдох хүсэлт гаргасан тохиолдолд авах арга хэмжээ
            if (fitnessData) {
              // Хуучин өгөгдлийг харуулах боломжтой бол тэр өгөгдлийг харуулна
              console.log("⚠️ Хуучин фитнесс өгөгдлийг харуулж байна");
            } else {
              // Дэлгэцэд хоосон эсвэл үндсэн утгыг харуулна
              setFitnessData({
                steps: 0,
                heartRate: 0,
                calories: 0,
                timestamp: new Date(),
              });
              console.log("⚠️ Хоосон фитнесс өгөгдлийг харуулж байна");

              // Энд дахин холбогдох хуудас руу шилжүүлэх боломжтой
              // window.location.href = "/connect-fit"; - серверийн талын хуудсанд ашиглах боломжгүй
            }
          }
        } else {
          // Бусад төрлийн алдаа бол лог хийх, хэрэглэгчид харуулахгүй
          console.error("❌ Бусад төрлийн алдаа:", fitError);

          // Хэрэв өмнө нь фитнес өгөгдөл байгаа бол алдааны мессеж харуулахгүй
          if (!fitnessData) {
            setError(
              "Фитнесс өгөгдөл авах боломжгүй байна. Хуучин өгөгдлийг харуулж байна."
            );
          }
        }
      }
    } catch (err) {
      console.error("❌ Өгөгдөл авахад алдаа гарлаа:", err);

      // Алдааны дэлгэрэнгүй мэдээлэл логдох
      const errMessage = err instanceof Error ? err.message : String(err);
      console.error("🔍 Үндсэн алдааны дэлгэрэнгүй мэдээлэл:", {
        errorType: err instanceof Error ? err.constructor.name : typeof err,
        message: errMessage,
        stack: err instanceof Error ? err.stack : "No stack trace",
      });

      // Хуучин өгөгдөл байгаа эсэхийг шалгах
      if (fitnessData) {
        // Хэрэв хуучин өгөгдөл байгаа бол алдааны мессеж харуулахгүй
        console.log(
          "⚠️ Хуучин фитнесс өгөгдлийг харуулж байна, алдааны мессежийг харуулахгүй"
        );
      } else {
        // Зөвхөн хуучин өгөгдөл байхгүй үед л алдааны мессеж харуулах
        setError("Фитнесс өгөгдөл авах боломжгүй байна. Дахин оролдоно уу.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    if (!patient) return;
    await fetchFitnessData(patient);
  };

  if (loading && !fitnessData) {
    return <div className="p-4">Өгөгдөл ачааллаж байна...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">{error}</div>;
  }

  if (!patient) {
    return <div className="p-4">Ажилтны мэдээлэл олдсонгүй</div>;
  }

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-6 gap-4">
        <div className="flex items-center">
          <div className="h-14 w-14 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center mr-4 text-white text-xl font-bold">
            {patient.name ? patient.name.charAt(0).toUpperCase() : "?"}
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">{patient.name}</h3>
            <p className="text-gray-400">{patient.email}</p>
            <p className="text-sm text-gray-500 mt-1 flex items-center">
              <svg
                className="h-4 w-4 mr-1"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                  clipRule="evenodd"
                />
              </svg>
              {patient.lastUpdated && formatDate(new Date(patient.lastUpdated))}
              {patient.lastUpdated &&
                ` (${getTimeSince(new Date(patient.lastUpdated))})`}
            </p>
          </div>
        </div>

        <button
          onClick={handleRefresh}
          disabled={loading}
          className={`px-4 py-2 rounded-lg flex items-center transition-all duration-200 transform ${
            loading
              ? "bg-gray-700 cursor-wait"
              : "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 hover:shadow-lg hover:-translate-y-1"
          } text-white`}
        >
          <svg
            className={`h-5 w-5 mr-2 ${loading ? "animate-spin" : ""}`}
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          {loading ? "Шинэчилж байна..." : "Шинэчлэх"}
        </button>
      </div>

      {error && (
        <div className="bg-red-500 bg-opacity-20 border-l-4 border-red-500 rounded-lg p-4 mb-6 animate-pulse">
          <p className="text-red-100">{error}</p>
        </div>
      )}

      {fitnessData ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div className="bg-gradient-to-br from-blue-900 to-blue-800 p-5 rounded-xl shadow-lg border border-blue-700">
            <div className="flex items-center mb-3">
              <div className="h-10 w-10 bg-blue-800 bg-opacity-50 rounded-full flex items-center justify-center mr-3">
                <svg
                  className="h-5 w-5 text-blue-300"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <h4 className="text-lg font-semibold text-blue-100">Алхалт</h4>
            </div>
            <div className="flex items-baseline">
              <p className="text-3xl font-bold text-white">
                {fitnessData.steps.toLocaleString()}
              </p>
              <p className="ml-2 text-blue-300">алхам</p>
            </div>
            <div className="flex justify-between items-center mt-2 text-sm">
              <p className="text-blue-200">
                Зорилт: <span className="font-medium">8,000</span>
              </p>
              <p className="text-blue-200">
                {Math.min(100, Math.round((fitnessData.steps / 8000) * 100))}%
              </p>
            </div>
            <div className="w-full bg-blue-900 rounded-full h-2.5 mt-2 overflow-hidden">
              <div
                className="bg-blue-400 h-2.5 rounded-full"
                style={{
                  width: `${Math.min(100, (fitnessData.steps / 8000) * 100)}%`,
                }}
              ></div>
            </div>
          </div>

          <div
            className={`bg-gradient-to-br ${
              fitnessData.heartRate > 100
                ? "from-red-900 to-red-800 border-red-700"
                : "from-rose-900 to-rose-800 border-rose-700"
            } p-5 rounded-xl shadow-lg border`}
          >
            <div className="flex items-center mb-3">
              <div
                className={`h-10 w-10 ${
                  fitnessData.heartRate > 100 ? "bg-red-800" : "bg-rose-800"
                } bg-opacity-50 rounded-full flex items-center justify-center mr-3`}
              >
                <svg
                  className={`h-5 w-5 ${
                    fitnessData.heartRate > 100
                      ? "text-red-300"
                      : "text-rose-300"
                  }`}
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <h4
                className={`text-lg font-semibold ${
                  fitnessData.heartRate > 100 ? "text-red-100" : "text-rose-100"
                }`}
              >
                Зүрхний цохилт
              </h4>
            </div>
            <div className="flex items-baseline">
              <p className="text-3xl font-bold text-white">
                {fitnessData.heartRate}
              </p>
              <p
                className={`ml-2 ${
                  fitnessData.heartRate > 100 ? "text-red-300" : "text-rose-300"
                }`}
              >
                BPM
              </p>
            </div>
            <div className="mt-2">
              <span
                className={`inline-block px-2.5 py-0.5 rounded-full text-sm font-medium ${
                  fitnessData.heartRate > 100
                    ? "bg-red-800 text-red-200"
                    : "bg-green-800 text-green-200"
                }`}
              >
                {fitnessData.heartRate > 100 ? "Хэвийн бус" : "Хэвийн"}
              </span>
            </div>
            {fitnessData.heartRate > 100 && (
              <div className="flex items-center mt-2 text-sm text-red-300">
                <svg
                  className="h-4 w-4 mr-1 text-red-300"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                Анхаарал хандуулах шаардлагатай
              </div>
            )}
          </div>

          <div className="bg-gradient-to-br from-green-900 to-green-800 p-5 rounded-xl shadow-lg border border-green-700">
            <div className="flex items-center mb-3">
              <div className="h-10 w-10 bg-green-800 bg-opacity-50 rounded-full flex items-center justify-center mr-3">
                <svg
                  className="h-5 w-5 text-green-300"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <h4 className="text-lg font-semibold text-green-100">
                Зарцуулсан калори
              </h4>
            </div>
            <div className="flex items-baseline">
              <p className="text-3xl font-bold text-white">
                {fitnessData.calories.toLocaleString()}
              </p>
              <p className="ml-2 text-green-300">ккал</p>
            </div>
            <div className="flex justify-between items-center mt-2 text-sm">
              <p className="text-green-200">
                Зорилт: <span className="font-medium">2,000</span>
              </p>
              <p className="text-green-200">
                {Math.min(100, Math.round((fitnessData.calories / 2000) * 100))}
                %
              </p>
            </div>
            <div className="w-full bg-green-900 rounded-full h-2.5 mt-2 overflow-hidden">
              <div
                className="bg-green-400 h-2.5 rounded-full"
                style={{
                  width: `${Math.min(
                    100,
                    (fitnessData.calories / 2000) * 100
                  )}%`,
                }}
              ></div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-16 h-16 rounded-full border-4 border-blue-500 border-t-transparent animate-spin mb-6"></div>
          <p className="text-gray-400">Фитнесс өгөгдөл ачааллаж байна...</p>
        </div>
      )}

      {fitnessData && fitnessData.heartRate > 100 && (
        <div className="mt-6 bg-amber-500 bg-opacity-20 border-l-4 border-amber-500 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-6 w-6 text-amber-500"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-medium text-amber-300">
                Анхааруулга
              </h3>
              <div className="mt-2 text-sm text-amber-200">
                <p>
                  Ажилтны зүрхний цохилт хэвийн бус өндөр байна. Амрах, усны
                  хангамж зэргийг шалгах шаардлагатай.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
