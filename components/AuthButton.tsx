"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

type AuthButtonProps = {
  onLogin?: () => void;
  className?: string;
};

export default function AuthButton({
  onLogin,
  className = "",
}: AuthButtonProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  const handleSignIn = async () => {
    router.push("/auth/signin");
    if (onLogin) onLogin();
  };

  if (status === "loading") {
    return (
      <button className={`${className} opacity-70`} disabled>
        Уншиж байна...
      </button>
    );
  }

  if (session) {
    return (
      <button
        onClick={() => signOut({ callbackUrl: "/" })}
        className={className}
      >
        Гарах
      </button>
    );
  }

  return (
    <button onClick={handleSignIn} className={className}>
      Нэвтрэх
    </button>
  );
}
