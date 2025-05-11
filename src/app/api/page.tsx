import Link from "next/link";

export default function ApiPage() {
  return (
    <div className="min-h-screen p-4 md:p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-center mb-8">
          API Баримтжуулалт
        </h1>

        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">
            Нээлттэй API эндпоинтууд
          </h2>
          <p className="mb-4">
            Дараах API эндпоинтууд нь нээлттэй бөгөөд токен эсвэл хэрэглэгчийн
            нэвтрэлт шаардахгүй.
          </p>

          <div className="bg-gray-100 p-4 rounded-lg mb-6">
            <h3 className="text-lg font-medium mb-2">
              Бүх ажилтнуудын мэдээлэл
            </h3>
            <div className="flex items-center mb-2">
              <span className="inline-block bg-green-500 text-white px-3 py-1 text-sm font-bold rounded mr-3">
                GET
              </span>
              <code className="bg-gray-200 px-2 py-1 rounded">
                /api/public-data
              </code>
            </div>
            <p className="text-sm text-gray-700 mb-2">Параметрүүд:</p>
            <ul className="list-disc list-inside text-sm text-gray-700 mb-2 ml-4">
              <li>
                <code>limit</code> - Хэдэн ажилтны мэдээлэл авахаа заах (анхны
                утга: 10)
              </li>
            </ul>
            <p className="text-sm text-gray-700 mb-2">Жишээ:</p>
            <code className="block bg-gray-200 p-2 rounded text-sm">
              /api/public-data?limit=20
            </code>

            <div className="mt-2">
              <Link
                href="/api/public-data"
                className="text-blue-500 hover:text-blue-700 underline text-sm"
              >
                Туршиж үзэх →
              </Link>
            </div>
          </div>

          <div className="bg-gray-100 p-4 rounded-lg mb-6">
            <h3 className="text-lg font-medium mb-2">
              Тодорхой ажилтны мэдээлэл
            </h3>
            <div className="flex items-center mb-2">
              <span className="inline-block bg-green-500 text-white px-3 py-1 text-sm font-bold rounded mr-3">
                GET
              </span>
              <code className="bg-gray-200 px-2 py-1 rounded">
                /api/public-data/{"{userId}"}
              </code>
            </div>
            <p className="text-sm text-gray-700 mb-2">Жишээ:</p>
            <code className="block bg-gray-200 p-2 rounded text-sm">
              /api/public-data/user@example.com
            </code>
          </div>

          <div className="bg-gray-100 p-4 rounded-lg mb-6">
            <h3 className="text-lg font-medium mb-2">Фитнесс мэдээлэл</h3>
            <div className="flex items-center mb-2">
              <span className="inline-block bg-green-500 text-white px-3 py-1 text-sm font-bold rounded mr-3">
                GET
              </span>
              <code className="bg-gray-200 px-2 py-1 rounded">
                /api/public-data/fitness
              </code>
            </div>
            <p className="text-sm text-gray-700 mb-2">Параметрүүд:</p>
            <ul className="list-disc list-inside text-sm text-gray-700 mb-2 ml-4">
              <li>
                <code>limit</code> - Хэдэн ажилтны мэдээлэл авахаа заах (анхны
                утга: 50)
              </li>
            </ul>
            <p className="text-sm text-gray-700 mb-2">Жишээ:</p>
            <code className="block bg-gray-200 p-2 rounded text-sm">
              /api/public-data/fitness?limit=100
            </code>

            <div className="mt-2">
              <Link
                href="/api/public-data/fitness"
                className="text-blue-500 hover:text-blue-700 underline text-sm"
              >
                Туршиж үзэх →
              </Link>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">
            JavaScript-д ашиглах жишээ
          </h2>
          <pre className="bg-gray-800 text-white p-4 rounded-lg overflow-auto text-sm">
            {`// Бүх ажилтнуудын мэдээлэл авах
fetch('/api/public-data')
  .then(response => response.json())
  .then(data => console.log(data));

// Тодорхой ажилтны мэдээлэл авах
fetch('/api/public-data/user@example.com')
  .then(response => response.json())
  .then(data => console.log(data));

// Фитнесс мэдээлэл авах
fetch('/api/public-data/fitness')
  .then(response => response.json())
  .then(data => console.log(data));`}
          </pre>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Python-д ашиглах жишээ</h2>
          <pre className="bg-gray-800 text-white p-4 rounded-lg overflow-auto text-sm">
            {`import requests

# Бүх ажилтнуудын мэдээлэл авах
response = requests.get('https://yourdomain.com/api/public-data')
data = response.json()
print(data)

# Тодорхой ажилтны мэдээлэл авах
response = requests.get('https://yourdomain.com/api/public-data/user@example.com')
data = response.json()
print(data)

# Фитнесс мэдээлэл авах
response = requests.get('https://yourdomain.com/api/public-data/fitness')
data = response.json()
print(data)`}
          </pre>
        </div>
      </div>
    </div>
  );
}
