"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { savePoliceOfficerData } from "../../../lib/firebase";

// Главный контент компонента
function ConnectFitContent() {
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const supervisorId = searchParams?.get("supervisor"); // Цагдаа ажилтны хянагч эмчийн ID (имэйл)

  // useCallback ашиглан функцыг мемоизаци хийн
  const connectToGoogleFit = useCallback(async () => {
    console.log("🔄 Google Fit холболт эхлэж байна");
    console.log("🔑 Session мэдээлэл:", {
      hasAccessToken: !!session?.accessToken,
      hasRefreshToken: !!session?.refreshToken,
      hasUser: !!session?.user,
      userEmail: session?.user?.email,
      tokenExpiry: session?.tokenExpiry,
    });

    console.log("👀 supervisorId:", supervisorId);

    if (
      !session?.accessToken ||
      !session?.refreshToken ||
      !session?.user?.email
    ) {
      console.error("❌ Session мэдээлэл дутуу байна:", {
        hasAccessToken: !!session?.accessToken,
        hasRefreshToken: !!session?.refreshToken,
        hasEmail: !!session?.user?.email,
      });
      setError(
        "Google Fit-д холбогдоход шаардлагатай мэдээлэл дутуу байна. Дахин нэвтрэх шаардлагатай байж болно."
      );
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log("💾 Firebase руу хадгалах гэж байна:", {
        email: session.user.email,
        name: session.user.name,
        tokenLength: session.accessToken?.length || 0,
        refreshTokenLength: session.refreshToken?.length || 0,
        supervisorId: supervisorId || "байхгүй",
      });

      // Цагдаа ажилтны мэдээллийг Firestore-д хадгалах
      const result = await savePoliceOfficerData(
        session.user.email,
        session.user.name ?? "Тодорхойгүй",
        session.user.email,
        session.accessToken,
        session.refreshToken,
        session.tokenExpiry ?? 0,
        supervisorId || undefined // Хянагч эмчийн ID (имэйл)
      );

      if (result) {
        console.log("✅ Firebase-д амжилттай хадгалагдлаа");
        setSuccess(true);
      } else {
        console.error("❌ Firebase-д хадгалахад алдаа гарлаа");
        setError(
          "Google Fit холбогдолт хадгалахад алдаа гарлаа. Firebase холболтыг шалгана уу."
        );
      }
    } catch (err) {
      console.error("❌ Google Fit холболтын алдаа:", err);
      setError(
        "Google Fit-д холбогдоход алдаа гарлаа" +
          (err instanceof Error ? `: ${err.message}` : "")
      );
    } finally {
      setLoading(false);
    }
  }, [session, supervisorId, setLoading, setError, setSuccess]);

  const handleDebugClick = async () => {
    console.log("🔍 Session дэлгэрэнгүй:", session);

    // Check if Firebase is initialized correctly
    try {
      const result = await fetch("/api/check-firebase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: session?.user?.email,
          test: true,
        }),
      });
      const data = await result.json();
      console.log("✅ Firebase шалгалтын үр дүн:", data);
    } catch (err) {
      console.error("❌ Firebase шалгалтын алдаа:", err);
    }
  };

  useEffect(() => {
    if (status === "loading") return;

    // Хэрэглэгч нэвтэрсэн ба Google Fit-д холбогдсон эсэхийг шалгах
    if (session?.accessToken) {
      console.log(
        "🔄 useEffect дотор session.accessToken олдлоо, connectToGoogleFit дуудах гэж байна"
      );
      connectToGoogleFit();
    } else {
      console.log("⚠️ useEffect дотор session.accessToken олдсонгүй:", {
        status,
        hasSession: !!session,
        hasAccessToken: !!session?.accessToken,
      });
    }
  }, [session, status, connectToGoogleFit]);

  const handleConnectClick = () => {
    if (session) {
      connectToGoogleFit();
    } else {
      // Хэрэглэгч нэвтрээгүй бол нэвтрэх хуудас руу чиглүүлнэ
      window.location.href = `/api/auth/signin?${
        supervisorId
          ? `callbackUrl=/connect-fit?supervisor=${encodeURIComponent(
              supervisorId
            )}`
          : ""
      }`;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Google Fit холболт
          </h1>
          <p className="text-gray-600">
            {supervisorId
              ? "Эрүүл мэндийн мэдээллээ хянуулахын тулд Google Fit-тэй холбогдоно уу"
              : "Google Fit-ээс фитнесс өгөгдөл авахын тулд холбогдоно уу"}
          </p>
        </div>

        {success ? (
          <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-green-400"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-700">
                  Google Fit амжилттай холбогдлоо!
                </p>
                {supervisorId && (
                  <p className="text-xs text-green-600 mt-1">
                    Таны эрүүл мэндийн мэдээллийг хянагч ашиглах боломжтой
                    болсон.
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <>
            {error && (
              <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-red-400"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={handleConnectClick}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg flex items-center justify-center"
            >
              {loading ? (
                <svg
                  className="animate-spin h-5 w-5 mr-2 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  ></path>
                </svg>
              ) : (
                <svg
                  className="h-5 w-5 mr-2"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
              {loading ? "Холбогдож байна..." : "Google Fit-тэй холбогдох"}
            </button>

            {/* Debug button - only show in development */}
            {process.env.NODE_ENV !== "production" && (
              <button
                onClick={handleDebugClick}
                className="mt-4 w-full bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded-lg flex items-center justify-center text-sm"
              >
                <svg
                  className="h-4 w-4 mr-2"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Диагностик (Debug)
              </button>
            )}
          </>
        )}

        {success && (
          <div className="mt-6 text-center">
            <a
              href="/dashboard"
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Хяналтын самбар руу буцах
            </a>
          </div>
        )}

        {session && (
          <div className="mt-8 text-center text-xs text-gray-500">
            <p>
              {session.user?.email} хаягаар нэвтэрсэн байна.{" "}
              {!success && "Амжилттай холбогдох болно."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// Wrap the component in Suspense for Next.js
export default function ConnectFit() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
          <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
            <p className="text-gray-600">Уншиж байна...</p>
          </div>
        </div>
      }
    >
      <ConnectFitContent />
    </Suspense>
  );
}
