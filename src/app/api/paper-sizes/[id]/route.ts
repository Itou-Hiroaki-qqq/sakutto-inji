import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { getD1 } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

// DELETE /api/paper-sizes/:id - カスタム用紙サイズ削除
export async function DELETE(_request: Request, { params }: Params) {
  const { session, error } = await requireSession();
  if (error) return error;

  const { id } = await params;
  const db = await getD1();

  await db
    .prepare("DELETE FROM custom_paper_sizes WHERE id = ? AND user_id = ?")
    .bind(id, session.user.id)
    .run();

  return NextResponse.json({ success: true });
}
