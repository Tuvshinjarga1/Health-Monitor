"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AuthButton from "../../components/AuthButton";

export default function HomePage() {
  const { data: session } = useSession();
  const router = useRouter();

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-md overflow-hidden mb-8">
          <div className="p-8">
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-3xl font-bold text-gray-800">
                Google Fit Мониторинг
              </h1>
              <AuthButton className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700" />
            </div>

            <div className="prose max-w-none">
              <p className="text-lg text-gray-600 mb-6">
                Google Fit холбож өөрийн эрүүл мэндийн өгөгдлөө төрөлжүүлж, цаг
                хугацааг илүү үр дүнтэй зарцуулахад туслаарай.
              </p>

              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <div className="bg-blue-50 p-6 rounded-lg">
                  <h2 className="text-xl font-semibold text-blue-800 mb-3">
                    Хэрхэн ажилладаг вэ?
                  </h2>
                  <ol className="list-decimal pl-5 space-y-2 text-gray-700">
                    <li>Google акаунтаараа нэвтэрнэ</li>
                    <li>&ldquo;Google Fit холбох&rdquo; дарна</li>
                    <li>Google Fit-ийн зөвшөөрөл өгнө</li>
                    <li>
                      Системд таны аппликейшнээс эрүүл мэндийн өгөгдөл харагдана
                    </li>
                  </ol>
                </div>

                <div className="bg-gray-50 p-6 rounded-lg">
                  <h2 className="text-xl font-semibold text-gray-800 mb-3">
                    Ямар өгөгдөл харагдах вэ?
                  </h2>
                  <ul className="list-disc pl-5 space-y-2 text-gray-700">
                    <li>Өдөр тутмын алхалт</li>
                    <li>Зүрхний цохилтын хэмжээ</li>
                    <li>Шатаасан калори</li>
                    <li>Бусад Google Fit өгөгдөл</li>
                  </ul>
                </div>
              </div>

              <div className="flex justify-center space-x-4">
                {session ? (
                  <>
                    <Link
                      href="/connect-fit"
                      className="px-6 py-3 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 inline-flex items-center"
                    >
                      Google Fit холбох
                    </Link>
                    <Link
                      href="/dashboard"
                      className="px-6 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 inline-flex items-center"
                    >
                      Хянах самбар
                    </Link>
                  </>
                ) : (
                  <button
                    onClick={() => router.push("/connect-fit")}
                    className="px-6 py-3 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 inline-flex items-center"
                  >
                    Эхлэх
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Мониторинг системийн давуу талууд
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="p-4 border border-gray-200 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  Автомат шинэчлэлт
                </h3>
                <p className="text-gray-600">
                  15 минут тутамд Google Fit-ээс таны өгөгдлийг автоматаар татаж
                  авна.
                </p>
              </div>
              <div className="p-4 border border-gray-200 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  Нэг удаагийн холболт
                </h3>
                <p className="text-gray-600">
                  Зөвхөн нэг удаа Google Fit-тэй холбоход хангалттай, дахин
                  дахин нэвтрэх шаардлагагүй.
                </p>
              </div>
              <div className="p-4 border border-gray-200 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  Хүртээмжтэй өгөгдөл
                </h3>
                <p className="text-gray-600">
                  Өгөгдлөө хаанаас ч, хэзээ ч хянах боломжтой.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
