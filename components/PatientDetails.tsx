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

        setPatient(data);

        // Ажилтны фитнесс өгөгдөл байгаа эсэхийг шалгах
        if (data.fitnessData) {
          setFitnessData(data.fitnessData);
        } else {
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

      // Токен хугацаа дууссан эсэхийг шалгах
      const now = Math.floor(Date.now() / 1000);
      let accessToken = officerData.accessToken;

      if (now > officerData.tokenExpiry) {
        // Токен шинэчлэх
        const newTokens = await refreshAccessToken(officerData.refreshToken);
        accessToken = newTokens.accessToken;

        // Шинэ токеныг хадгалах
        await updatePoliceOfficerData(officerData.userId, undefined);
      }

      // Google Fit-ээс өгөгдөл авах
      const fitData = await getGoogleFitData(accessToken);

      // Өгөгдлийг хадгалах
      await updatePoliceOfficerData(officerData.userId, fitData);
      setFitnessData(fitData);
    } catch (err) {
      setError("Фитнесс өгөгдөл авахад алдаа гарлаа");
      console.error(err);
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
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-2xl font-bold">{patient.name}</h3>
          <p className="text-gray-600">{patient.email}</p>
          <p className="text-sm text-gray-500 mt-1">
            Сүүлд шинэчилсэн:{" "}
            {patient.lastUpdated && formatDate(new Date(patient.lastUpdated))}
            {patient.lastUpdated &&
              ` (${getTimeSince(new Date(patient.lastUpdated))})`}
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={loading}
          className={`px-4 py-2 rounded ${
            loading ? "bg-gray-300" : "bg-blue-500 hover:bg-blue-600"
          } text-white`}
        >
          {loading ? "Шинэчилж байна..." : "Шинэчлэх"}
        </button>
      </div>

      {fitnessData ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="text-lg font-semibold text-blue-700">Алхалт</h4>
            <p className="text-3xl font-bold mt-2">
              {fitnessData.steps.toLocaleString()} алхам
            </p>
            <p className="text-sm text-gray-600 mt-1">
              Өнөөдрийн зорилт: 8,000
            </p>
            <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
              <div
                className="bg-blue-600 h-2.5 rounded-full"
                style={{
                  width: `${Math.min(100, (fitnessData.steps / 8000) * 100)}%`,
                }}
              ></div>
            </div>
          </div>

          <div className="bg-red-50 p-4 rounded-lg">
            <h4 className="text-lg font-semibold text-red-700">
              Зүрхний цохилт
            </h4>
            <p className="text-3xl font-bold mt-2">
              {fitnessData.heartRate} BPM
            </p>
            <p className="text-sm text-gray-600 mt-1">
              {fitnessData.heartRate > 100 ? "Хэвийн бус" : "Хэвийн"}
            </p>
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <h4 className="text-lg font-semibold text-green-700">
              Зарцуулсан калори
            </h4>
            <p className="text-3xl font-bold mt-2">
              {fitnessData.calories.toLocaleString()} ккал
            </p>
            <p className="text-sm text-gray-600 mt-1">
              Өнөөдрийн зорилт: 2,000
            </p>
            <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
              <div
                className="bg-green-600 h-2.5 rounded-full"
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
        <div className="text-center py-8 text-gray-500">
          Фитнесс өгөгдөл ачааллаж байна...
        </div>
      )}

      {fitnessData && fitnessData.heartRate > 100 && (
        <div className="mt-6 bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-yellow-400"
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
              <h3 className="text-sm font-medium text-yellow-800">
                Анхааруулга
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
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
