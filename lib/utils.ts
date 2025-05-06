// lib/utils.ts

// Огноог Монгол хэл дээр форматлах
export function formatDate(date: Date | string | number | null | undefined) {
  try {
    // Хэрэв date нь null эсвэл undefined бол одоогийн огноог авах
    if (!date) {
      return "Огноо тодорхойгүй";
    }

    // date нь Date объект биш бол Date болгох
    const validDate = date instanceof Date ? date : new Date(date);

    // Хүчинтэй эсэхийг шалгах (Invalid Date объект нь NaN-тай тэнцүү getTime() утга өгдөг)
    if (isNaN(validDate.getTime())) {
      return "Буруу огноо";
    }

    return new Intl.DateTimeFormat("mn-MN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(validDate);
  } catch (error) {
    console.error("Date formatting error:", error);
    return "Огноо алдаатай";
  }
}

// Хэрэглэгчийн токены мэдээллийг Firebase-д хадгалах ID үүсгэх
export function generateUniqueId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

// Өгөгдөл шинэчлэгдсэн хугацаа
export function getTimeSince(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  let interval = seconds / 31536000;

  if (interval > 1) {
    return Math.floor(interval) + " жилийн өмнө";
  }
  interval = seconds / 2592000;
  if (interval > 1) {
    return Math.floor(interval) + " сарын өмнө";
  }
  interval = seconds / 86400;
  if (interval > 1) {
    return Math.floor(interval) + " өдрийн өмнө";
  }
  interval = seconds / 3600;
  if (interval > 1) {
    return Math.floor(interval) + " цагийн өмнө";
  }
  interval = seconds / 60;
  if (interval > 1) {
    return Math.floor(interval) + " минутын өмнө";
  }
  return Math.floor(seconds) + " секундын өмнө";
}
