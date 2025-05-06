"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

export default function AuthError() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const errorParam = searchParams?.get("error");
    if (errorParam) {
      switch (errorParam) {
        case "OAuthSignin":
          setError("OAuth-аар нэвтрэх үйлдэл алдаатай.");
          break;
        case "OAuthCallback":
          setError("OAuth callback хүсэлт алдаатай.");
          break;
        case "OAuthCreateAccount":
          setError("OAuth бүртгэл үүсгэхэд алдаа гарлаа.");
          break;
        case "EmailCreateAccount":
          setError("И-мэйлээр бүртгэл үүсгэхэд алдаа гарлаа.");
          break;
        case "Callback":
          setError("OAuth provider-ийн callback хүсэлт амжилтгүй.");
          break;
        case "OAuthAccountNotLinked":
          setError("И-мэйл ашиглан аль хэдийн бүртгэлтэй байна.");
          break;
        case "AccessDenied":
          setError("Хандах эрх хаагдсан.");
          break;
        case "Configuration":
          setError("NextAuth тохиргоонд алдаа гарлаа.");
          break;
        default:
          setError(`Тодорхойгүй алдаа: ${errorParam}`);
          break;
      }
    } else {
      setError("Нэвтрэхэд алдаа гарлаа.");
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <svg
              className="w-16 h-16 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              ></path>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Нэвтрэлтийн алдаа
          </h1>
          {error && <p className="text-red-600 mb-6">{error}</p>}
        </div>

        <div className="space-y-4">
          <Link
            href="/auth/signin"
            className="block w-full text-center bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition duration-300"
          >
            Дахин оролдох
          </Link>
          <Link
            href="/"
            className="block w-full text-center bg-white border border-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-50 transition duration-300"
          >
            Нүүр хуудас руу буцах
          </Link>
        </div>
      </div>
    </div>
  );
}
