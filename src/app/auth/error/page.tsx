"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

// Content component that uses useSearchParams
function AuthErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams?.get("error");

  const getErrorMessage = (errorCode: string | null) => {
    if (!errorCode) return "Нэвтрэх явцад тодорхойгүй алдаа гарлаа.";

    switch (errorCode) {
      case "Callback":
        return "Нэвтрэх явцад Google-ээс буцаан хариу ирсэнгүй. OAuth callback алдаа.";
      case "OAuthSignin":
        return "Google OAuth эхлүүлэх үед алдаа гарлаа.";
      case "OAuthCallback":
        return "Google OAuth callback хүлээн авах үед алдаа гарлаа.";
      case "OAuthCreateAccount":
        return "Google дансаар нэвтрэхэд алдаа гарлаа.";
      case "EmailCreateAccount":
        return "Имэйл дансаар нэвтрэхэд алдаа гарлаа.";
      case "Callback":
        return "Нэвтрэх явцад алдаа гарлаа.";
      case "OAuthAccountNotLinked":
        return "Энэ имэйл өөр аргаар бүртгэгдсэн байна.";
      case "EmailSignin":
        return "Имэйл илгээхэд алдаа гарлаа.";
      case "CredentialsSignin":
        return "Нэвтрэх мэдээлэл буруу байна.";
      case "SessionRequired":
        return "Энэ хуудсыг үзэхийн тулд та эхлээд нэвтрэх хэрэгтэй.";
      case "Default":
      default:
        return "Нэвтрэх явцад тодорхойгүй алдаа гарлаа.";
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
        <div className="mb-6">
          <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <svg
              className="h-10 w-10 text-red-600"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
        </div>

        <h2 className="text-2xl font-bold text-gray-800 mb-4">Нэвтрэх алдаа</h2>

        <p className="text-gray-600 mb-8">{getErrorMessage(error || null)}</p>

        <div className="flex flex-col space-y-3">
          <Link
            href="/auth/signin"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg text-center"
          >
            Дахин нэвтрэх
          </Link>

          <Link
            href="/"
            className="inline-block text-blue-600 hover:text-blue-800 font-medium py-2 text-center"
          >
            Нүүр хуудас руу буцах
          </Link>
        </div>
      </div>
    </div>
  );
}

// Wrap in Suspense for Next.js
export default function AuthError() {
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
      <AuthErrorContent />
    </Suspense>
  );
}
