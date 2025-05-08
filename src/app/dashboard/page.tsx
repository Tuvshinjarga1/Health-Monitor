"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { getSupervisorOfficers } from "../../../lib/firebase";
import { UserTokenInfo } from "../../../lib/userStorage";
import { formatDate } from "../../../lib/utils";
import PatientDetails from "../../../components/PatientDetails";
import { savePoliceOfficerData } from "../../../lib/firebase";

export default function Dashboard() {
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [officers, setOfficers] = useState<UserTokenInfo[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [redirectingToConnect, setRedirectingToConnect] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false); // Хажуугийн талбарыг харуулах эсэх

  const fetchOfficers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("🔍 Ажилтны мэдээлэл татаж байна, session:", {
        hasSession: !!session,
        hasEmail: !!session?.user?.email,
        email: session?.user?.email,
      });

      // Нэвтэрсэн хэрэглэгчийн имэйл хаягаар цагдаа нарын мэдээлэл татах
      if (session?.user?.email) {
        console.log(
          "📋 getSupervisorOfficers функцыг дуудаж байна:",
          session.user.email
        );
        const officerList = await getSupervisorOfficers(session.user.email);
        console.log("✅ Ажилтны жагсаалт авлаа:", officerList.length, "хүн");

        // If no officers found and user has tokens, maybe user hasn't connected to Google Fit yet
        if (
          officerList.length === 0 &&
          session?.accessToken &&
          session?.refreshToken
        ) {
          console.log(
            "⚠️ Хэрэглэгч Firebase-д бүртгэлгүй байна, автоматаар Google Fit-тэй холбох гэж байна"
          );
          console.log(
            "💾 Хэрэглэгч мэдээллийг Firebase-д хадгалах гэж байна:",
            {
              email: session.user.email,
              name: session.user.name,
            }
          );

          try {
            // Try to save the user data to Firebase directly
            const result = await savePoliceOfficerData(
              session.user.email!,
              session.user.name || "Тодорхойгүй",
              session.user.email!,
              session.accessToken,
              session.refreshToken,
              session.tokenExpiry || 0
            );

            if (result) {
              console.log(
                "✅ Firebase-д амжилттай хадгалагдлаа, дахин жагсаалт татаж байна"
              );
              // Try to fetch officers again
              const updatedOfficerList = await getSupervisorOfficers(
                session.user.email
              );
              setOfficers(updatedOfficerList);

              if (updatedOfficerList.length === 0) {
                console.log(
                  "⚠️ Хэрэглэгчийг Firebase-д хадгалсан ч жагсаалт хоосон байна"
                );
                // Redirect to connect page after saving if still no officers
                setRedirectingToConnect(true);
                window.location.href = "/connect-fit";
                return;
              }
            } else {
              // If saving failed, redirect to connect page
              console.log(
                "❌ Firebase-д хадгалахад алдаа гарлаа, Google Fit холболт руу чиглүүлж байна"
              );
              setRedirectingToConnect(true);
              window.location.href = "/connect-fit";
              return;
            }
          } catch (err) {
            console.error("❌ Firebase-д хадгалахад алдаа гарлаа:", err);
            setRedirectingToConnect(true);
            window.location.href = "/connect-fit";
            return;
          }
        } else {
          setOfficers(officerList);
        }
      } else {
        console.log("❌ Хэрэглэгчийн email олдсонгүй");
      }
    } catch (err) {
      console.error("❌ Ажилтны жагсаалт татахад алдаа гарлаа:", err);
      setError("Цагдаа нарын мэдээлэл авахад алдаа гарлаа");
    } finally {
      setLoading(false);
    }
  }, [session, setOfficers, setLoading, setError]);

  useEffect(() => {
    if (status === "loading" || redirectingToConnect) return;

    console.log("🔄 Dashboard эффект ажиллаж байна, status:", status);

    if (!session) {
      // Хэрэглэгч нэвтрээгүй бол нэвтрэх хуудас руу чиглүүлэх
      console.log("⚠️ Хэрэглэгч нэвтрээгүй, чиглүүлж байна");
      window.location.href = "/auth/signin";
      return;
    }

    fetchOfficers();
  }, [session, status, fetchOfficers, redirectingToConnect]);

  const handleRefresh = () => {
    fetchOfficers();
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 text-white">
        <div className="w-20 h-20 rounded-full border-4 border-blue-500 border-t-transparent animate-spin mb-6"></div>
        <h2 className="text-2xl font-semibold mb-2">Уншиж байна</h2>
        <p className="text-gray-400">Түр хүлээнэ үү...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 text-white p-4">
        <div className="max-w-md w-full bg-gray-800 rounded-xl shadow-2xl overflow-hidden">
          <div className="p-8">
            <div className="flex items-center justify-center h-20 w-20 bg-yellow-100 text-yellow-500 rounded-full mx-auto mb-6">
              <svg
                className="h-10 w-10"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>

            <h2 className="text-2xl font-bold text-center text-white mb-4">
              Нэвтрээгүй байна
            </h2>
            <p className="text-gray-400 text-center mb-8">
              Системийг ашиглахын тулд нэвтрэх шаардлагатай
            </p>

            <a
              href="/auth/signin"
              className="block w-full py-3 px-4 text-center bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium rounded-lg transition-all duration-200 transform hover:-translate-y-1 hover:shadow-lg"
            >
              Нэвтрэх
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      {/* Header */}
      <header className="sticky top-0 bg-gray-900 bg-opacity-80 backdrop-blur-sm z-10 border-b border-gray-800 px-4 py-4">
        <div className="container mx-auto">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              {/* Хажуу талын талбарыг харуулах товч */}
              <button
                onClick={() => setShowSidebar(!showSidebar)}
                className="mr-3 bg-gray-700 hover:bg-gray-600 text-white p-2 rounded-lg md:hidden transition-colors duration-200"
              >
                <svg
                  className="h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>
              <h1 className="text-2xl font-bold text-white flex items-center">
                <svg
                  className="h-8 w-8 mr-3 text-blue-500"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M16 8v8m-8-8v8M12 2a2 2 0 00-2 2v4m4-4v4m-5 6a5 5 0 0010 0" />
                  <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Эрүүл мэндийн хяналт
              </h1>
            </div>
            <div className="flex space-x-3 items-center">
              <span className="hidden md:block text-sm text-gray-400 mr-3">
                {session?.user?.email || ""}
              </span>
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-2 px-4 rounded-lg flex items-center transition-all duration-200 transform hover:-translate-y-1 hover:shadow-lg disabled:opacity-50 disabled:pointer-events-none"
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
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Error message */}
        {error && (
          <div className="mb-6 bg-red-500 bg-opacity-20 border-l-4 border-red-500 rounded-lg p-4 animate-pulse">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-500"
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
                <p className="text-red-100 font-medium">{error}</p>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar */}
          <div
            className={`${
              showSidebar ? "block" : "hidden"
            } md:block w-full md:w-1/4 lg:w-1/5 space-y-6`}
          >
            {/* Officers list */}
            <div className="bg-gray-800 rounded-xl shadow-xl overflow-hidden border border-gray-700 transition-all duration-300 hover:shadow-blue-900/20">
              <div className="p-4 border-b border-gray-700 bg-gray-800">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-white flex items-center">
                    <svg
                      className="h-5 w-5 mr-2 text-blue-400"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                    </svg>
                    Хяналтад буй
                  </h2>
                  <span className="bg-blue-500 text-xs font-medium px-2.5 py-0.5 rounded-full">
                    {officers.length}
                  </span>
                </div>
              </div>

              <div className="p-4">
                {loading && officers.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8">
                    <div className="w-10 h-10 rounded-full border-2 border-blue-500 border-t-transparent animate-spin mb-4"></div>
                    <p className="text-gray-400 text-sm">Уншиж байна...</p>
                  </div>
                ) : officers.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8">
                    <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mb-4">
                      <svg
                        className="h-8 w-8 text-gray-500"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <p className="text-gray-400 text-center">
                      Хяналтад буй ажилтан байхгүй байна
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                    {officers.map((officer) => (
                      <div
                        key={officer.userId}
                        className="p-3 rounded-lg cursor-pointer transition-all duration-200 hover:bg-gray-700 hover:shadow-lg border border-gray-700 group"
                        onClick={() => {
                          // Мобайл дээр хажуугийн талбар хаах
                          setShowSidebar(false);
                          // Хэрэглэгчийн хэсэг рүү скролл хийх
                          document
                            .getElementById(officer.userId)
                            ?.scrollIntoView({
                              behavior: "smooth",
                              block: "center",
                            });
                        }}
                      >
                        <div className="flex items-center">
                          <div className="h-10 w-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center mr-3 text-white font-bold">
                            {officer.name
                              ? officer.name.charAt(0).toUpperCase()
                              : "?"}
                          </div>
                          <div className="overflow-hidden">
                            <div className="font-medium text-white truncate group-hover:text-blue-400 transition-colors">
                              {officer.name || "Нэргүй"}
                            </div>
                            <div className="text-sm text-gray-400 truncate">
                              {officer.email}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between mt-2">
                          {officer.lastUpdated && (
                            <div className="text-xs text-gray-500">
                              {formatDate(new Date(officer.lastUpdated))}
                            </div>
                          )}

                          {officer.fitnessData &&
                            officer.fitnessData.heartRate > 100 && (
                              <div className="flex items-center text-amber-500 text-xs">
                                <svg
                                  className="h-4 w-4 mr-1"
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
                                Анхаарах
                              </div>
                            )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Invitation link */}
            <div className="bg-gray-800 rounded-xl shadow-xl overflow-hidden border border-gray-700 transition-all duration-300 hover:shadow-blue-900/20">
              <div className="p-4 border-b border-gray-700">
                <h2 className="text-lg font-semibold text-white flex items-center">
                  <svg
                    className="h-5 w-5 mr-2 text-green-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
                  </svg>
                  Урих холбоос
                </h2>
              </div>
              <div className="p-4">
                <p className="text-sm text-gray-400 mb-4">
                  Доорх холбоосыг ажилтандаа илгээж health-тэй холбох боломжтой
                </p>

                <div className="border border-gray-700 rounded-lg p-3 bg-gray-900 text-sm text-gray-300 break-all mb-3">
                  {`${
                    window.location.origin
                  }/connect-fit?supervisor=${encodeURIComponent(
                    session.user?.email || ""
                  )}`}
                </div>

                <button
                  onClick={() => {
                    navigator.clipboard.writeText(
                      `${
                        window.location.origin
                      }/connect-fit?supervisor=${encodeURIComponent(
                        session.user?.email || ""
                      )}`
                    );
                  }}
                  className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white py-2 px-4 rounded-lg flex items-center justify-center transition-all duration-200 hover:shadow-lg"
                >
                  <svg
                    className="h-4 w-4 mr-2"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                    <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                  </svg>
                  Холбоос хуулах
                </button>
              </div>
            </div>
          </div>

          {/* Main content */}
          <div className={`w-full md:w-3/4 lg:w-4/5`}>
            {officers.length === 0 ? (
              loading ? (
                <div className="bg-gray-800 rounded-xl shadow-xl overflow-hidden border border-gray-700 p-6 text-center py-12">
                  <div className="w-16 h-16 rounded-full border-4 border-blue-500 border-t-transparent animate-spin mx-auto mb-6"></div>
                  <h3 className="text-lg font-medium text-gray-200 mb-2">
                    Ажилтнуудын мэдээлэл уншиж байна
                  </h3>
                  <p className="text-gray-400">Түр хүлээнэ үү...</p>
                </div>
              ) : (
                <div className="bg-gray-800 rounded-xl shadow-xl overflow-hidden border border-gray-700 p-6 text-center py-12">
                  <div className="w-20 h-20 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg
                      className="h-10 w-10 text-gray-500"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-4">
                    Хяналтад буй ажилтан байхгүй байна
                  </h3>
                  <p className="text-gray-400 mb-8 max-w-md mx-auto">
                    Хяналтад ажилтнууд нэмэхийн тулд дээрх урих холбоосыг
                    илгээнэ үү
                  </p>
                  <a
                    href="/connect-fit"
                    className="inline-block bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 transform hover:-translate-y-1 hover:shadow-lg"
                  >
                    Google Fit холбох
                  </a>
                </div>
              )
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {officers.map((officer) => (
                  <div
                    key={officer.userId}
                    id={officer.userId}
                    className="bg-gray-800 rounded-xl shadow-xl overflow-hidden border border-gray-700 transition-all duration-300 hover:shadow-blue-900/20"
                  >
                    <PatientDetails patientId={officer.userId} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
