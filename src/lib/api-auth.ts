import { getAuth } from "./auth";
import { headers } from "next/headers";

/** APIルートで認証済みユーザーのセッションを取得。未認証なら null */
export async function getSession() {
  const auth = await getAuth();
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  return session;
}

/** 認証必須のAPIで使用。未認証なら 401 Response を返す */
export async function requireSession() {
  const session = await getSession();
  if (!session) {
    return { session: null, error: new Response("Unauthorized", { status: 401 }) };
  }
  return { session, error: null };
}
