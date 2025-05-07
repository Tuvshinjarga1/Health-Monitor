"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";

export default function SignIn() {
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const callbackUrl = searchParams?.get("callbackUrl") || "/dashboard";
  const error = searchParams?.get("error");

  console.log("🔑 SignIn хуудас дуудагдлаа:", {
    callbackUrl,
    error,
    hasSearchParams: !!searchParams,
  });

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      console.log("🔄 Google нэвтрэх эхэллээ, callbackUrl:", callbackUrl);

      await signIn("google", {
        callbackUrl,
      });

      // signIn() нэвтэрсний дараа redirect хийгддэг тул энд хүрэх ёсгүй
      console.log("✅ Google нэвтрэлт амжилттай");
    } catch (error) {
      console.error("❌ Google нэвтрэлтэд алдаа гарлаа:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Нэвтрэх</h1>
          <p className="text-gray-600">
            Фитнесс хяналтын системд нэвтрэхийн тулд Google бүртгэлээрээ
            нэвтэрнэ үү
          </p>
        </div>

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
                <p className="text-sm text-red-700">
                  {error === "OAuthAccountNotLinked"
                    ? "Энэ имэйл өөр бүртгэлтэй холбоотой байна."
                    : "Нэвтрэхэд алдаа гарлаа. Дахин оролдоно уу."}
                </p>
              </div>
            </div>
          </div>
        )}

        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full bg-white border border-gray-300 hover:bg-gray-50 
          text-gray-800 py-3 px-4 rounded-lg flex items-center justify-center"
        >
          {loading ? (
            <svg
              className="animate-spin h-5 w-5 mr-2 text-gray-500"
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
            >
              <g transform="matrix(1, 0, 0, 1, 0, 0)">
                <g>
                  <path
                    fill="#4285F4"
                    d="M19.6 10.2c0-.7-.1-1.3-.2-1.9H10v3.7h5.5c-.2 1.1-.9 2.1-1.9 2.7v2.3h3.1c1.7-1.6 2.9-4.1 2.9-6.8z"
                  />
                  <path
                    fill="#34A853"
                    d="M10 20c2.6 0 4.7-.9 6.3-2.4l-3.1-2.3c-.8.6-1.9.9-3.2.9-2.5 0-4.5-1.7-5.3-3.9H1.6v2.4C3.2 17.8 6.4 20 10 20z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M4.7 12.3c-.2-.6-.3-1.2-.3-1.8s.1-1.2.3-1.8V6.3H1.6C.9 7.7.5 9.3.5 11s.4 3.3 1.1 4.7l3.1-2.4z"
                  />
                  <path
                    fill="#EA4335"
                    d="M10 4.3c1.4 0 2.6.5 3.6 1.4l2.7-2.7C14.6 1.4 12.5.5 10 .5 6.4.5 3.2 2.7 1.6 5.8l3.1 2.4c.7-2.2 2.8-3.9 5.3-3.9z"
                  />
                </g>
              </g>
            </svg>
          )}
          {loading ? "Нэвтэрч байна..." : "Google-ээр нэвтрэх"}
        </button>
      </div>
    </div>
  );
}
