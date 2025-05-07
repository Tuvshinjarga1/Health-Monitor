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
  const [selectedOfficer, setSelectedOfficer] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [redirectingToConnect, setRedirectingToConnect] = useState(false);

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

              // Select first officer if available
              if (updatedOfficerList.length > 0 && !selectedOfficer) {
                setSelectedOfficer(updatedOfficerList[0].userId);
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

          // Автоматаар эхний цагдааг сонгох
          if (officerList.length > 0 && !selectedOfficer) {
            console.log(
              "🔘 Эхний ажилтныг сонгож байна:",
              officerList[0].userId
            );
            setSelectedOfficer(officerList[0].userId);
          } else if (officerList.length === 0) {
            console.log("❗ Ажилтны жагсаалт хоосон байна");
          }
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
  }, [
    session,
    selectedOfficer,
    setOfficers,
    setSelectedOfficer,
    setLoading,
    setError,
  ]);

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
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-20">
          <div className="spinner"></div>
          <p className="mt-4 text-gray-600">Уншиж байна...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <div className="flex">
            <div className="ml-3">
              <p className="text-yellow-700">
                Тa нэвтэрч орно уу.{" "}
                <a href="/auth/signin" className="font-medium underline">
                  Нэвтрэх
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 text-black">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-white">
          {/* Цагдаа ажилтнуудын эрүүл мэндийн хяналт */}
          Эрүүл мэндийн хяналт
        </h1>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg"
        >
          {loading ? "Шинэчилж байна..." : "Шинэчлэх"}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
          <div className="flex">
            <div className="ml-3">
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-4 mb-4">
            <h2 className="text-xl font-semibold mb-4 text-black">
              {/* Хяналтад буй цагдаа нар ({officers.length}) */}
              Хяналтад буй ({officers.length})
            </h2>

            {loading && officers.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                Уншиж байна...
              </div>
            ) : officers.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                Хяналтад буй ажилтан байхгүй байна
                {/* Хяналтад буй цагдаа ажилтан байхгүй байна */}
              </div>
            ) : (
              <div className="space-y-2 max-h-[70vh] overflow-y-auto">
                {officers.map((officer) => (
                  <div
                    key={officer.userId}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedOfficer === officer.userId
                        ? "bg-blue-50 border border-blue-200"
                        : "hover:bg-gray-50 border border-transparent"
                    }`}
                    onClick={() => setSelectedOfficer(officer.userId)}
                  >
                    <div className="font-medium">
                      {officer.name || "Нэргүй"}
                    </div>
                    <div className="text-sm text-gray-500">{officer.email}</div>
                    {officer.lastUpdated && (
                      <div className="text-xs text-gray-400 mt-1">
                        {formatDate(new Date(officer.lastUpdated))}
                      </div>
                    )}

                    {officer.fitnessData &&
                      officer.fitnessData.heartRate > 100 && (
                        <div className="mt-1 flex items-center text-yellow-600 text-xs">
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
                          Анхаарал хандуулах шаардлагатай
                        </div>
                      )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-md p-4">
            <h2 className="text-xl font-semibold mb-2 text-black">
              Нэмэх холбоос
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              {/* Доорх холбоосыг цагдаа ажилтандаа илгээж Google Fit-тэй холбох */}
              Доорх холбоосыг ажилтандаа илгээж health-тэй холбох боломжтой
            </p>

            <div className="border border-gray-200 rounded p-3 bg-gray-50 text-sm text-gray-700 break-all">
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
              className="mt-2 text-blue-600 hover:text-blue-800 text-sm flex items-center"
            >
              <svg
                className="h-4 w-4 mr-1"
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

        <div className="lg:col-span-3">
          {selectedOfficer ? (
            <PatientDetails patientId={selectedOfficer} />
          ) : (
            <div className="bg-white rounded-lg shadow-md p-6 text-center py-12">
              <svg
                className="h-16 w-16 text-gray-400 mx-auto mb-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              <h3 className="text-lg font-semibold text-gray-600 mb-2">
                ажилтан сонгоно уу
                {/* Цагдаа ажилтан сонгоно уу */}
              </h3>
              <p className="text-gray-500">
                {/* Дэлгэрэнгүй мэдээллийг харахын тулд жагсаалтаас цагдаа ажилтныг */}
                Дэлгэрэнгүй мэдээллийг харахын тулд жагсаалтаас ажилтныг сонгоно
                уу
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
