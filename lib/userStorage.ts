export type UserTokenInfo = {
  userId: string;
  name?: string;
  email?: string;
  accessToken: string;
  refreshToken: string;
  tokenExpiry: number;
  lastUpdated?: Date | any; // Can be a Date, Timestamp, or other Firestore value
  fitnessData?: {
    steps: number;
    heartRate: number;
    calories: number;
    timestamp?: Date;
  };
  supervisorId?: string; // Хянагч эмчийн ID
};

// Сэсссэн мэдээллээс хэрэглэгчийн token хадгалах
export async function saveUserToken(
  userId: string,
  name: string,
  email: string,
  accessToken: string,
  refreshToken: string,
  tokenExpiry: number
): Promise<boolean> {
  try {
    if (typeof window === "undefined") return false;

    // Одоо байгаа хэрэглэгчдийн жагсаалтыг авах
    const existingUsers: UserTokenInfo[] = getUserTokens();

    // Одоо байгаа хэрэглэгчийг хайх
    const userIndex = existingUsers.findIndex((user) => user.userId === userId);

    const userInfo: UserTokenInfo = {
      userId,
      name,
      email,
      accessToken,
      refreshToken,
      tokenExpiry,
      lastUpdated: new Date(),
    };

    // Хэрэглэгч оршин байвал, мэдээллийг шинэчлэх
    if (userIndex >= 0) {
      existingUsers[userIndex] = {
        ...existingUsers[userIndex],
        ...userInfo,
      };
    } else {
      // Байхгүй бол нэмэх
      existingUsers.push(userInfo);
    }

    // LocalStorage руу хадгалах
    localStorage.setItem("googlefit_users", JSON.stringify(existingUsers));
    return true;
  } catch (error) {
    console.error("Error saving user token:", error);
    return false;
  }
}

// Бүх хэрэглэгчийн token мэдээллийг авах
export function getUserTokens(): UserTokenInfo[] {
  try {
    if (typeof window === "undefined") return [];

    const usersJson = localStorage.getItem("googlefit_users");
    if (!usersJson) return [];

    return JSON.parse(usersJson) as UserTokenInfo[];
  } catch (error) {
    console.error("Error getting user tokens:", error);
    return [];
  }
}

// Нэг хэрэглэгчийн token мэдээллийг авах
export function getUserToken(userId: string): UserTokenInfo | null {
  try {
    const users = getUserTokens();
    return users.find((user) => user.userId === userId) || null;
  } catch (error) {
    console.error("Error getting user token:", error);
    return null;
  }
}

// Хэрэглэгчийн token-ийг шинэчлэх
export function updateUserToken(
  userId: string,
  accessToken: string,
  tokenExpiry: number
): boolean {
  try {
    if (typeof window === "undefined") return false;

    const users = getUserTokens();
    const userIndex = users.findIndex((user) => user.userId === userId);

    if (userIndex >= 0) {
      users[userIndex] = {
        ...users[userIndex],
        accessToken,
        tokenExpiry,
        lastUpdated: new Date(),
      };

      localStorage.setItem("googlefit_users", JSON.stringify(users));
      return true;
    }

    return false;
  } catch (error) {
    console.error("Error updating user token:", error);
    return false;
  }
}

// Хэрэглэгчийн token мэдээллийг устгах
export function removeUserToken(userId: string): boolean {
  try {
    if (typeof window === "undefined") return false;

    const users = getUserTokens();
    const filteredUsers = users.filter((user) => user.userId !== userId);

    localStorage.setItem("googlefit_users", JSON.stringify(filteredUsers));
    return true;
  } catch (error) {
    console.error("Error removing user token:", error);
    return false;
  }
}
