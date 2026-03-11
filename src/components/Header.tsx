"use client";

import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

export function Header() {
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();

  const handleSignOut = async () => {
    await authClient.signOut();
    router.push("/login");
  };

  return (
    <header className="flex h-14 items-center justify-between border-b border-gray-200 bg-white px-6">
      <h1
        className="cursor-pointer text-lg font-bold text-gray-800"
        onClick={() => router.push("/")}
      >
        さくっと印字
      </h1>

      <div className="flex items-center gap-4">
        {isPending ? (
          <span className="text-sm text-gray-400">読み込み中...</span>
        ) : session ? (
          <>
            <span className="text-sm text-gray-600">{session.user.name}</span>
            <button
              onClick={handleSignOut}
              className="rounded-md bg-gray-100 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-200"
            >
              ログアウト
            </button>
          </>
        ) : (
          <button
            onClick={() => router.push("/login")}
            className="rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700"
          >
            ログイン
          </button>
        )}
      </div>
    </header>
  );
}
