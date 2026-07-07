import { NextResponse } from "next/server";
import { clientKey, rateLimit } from "@/lib/ai/rateLimit";
import { getAdminClient, getUserFromRequest } from "@/lib/supabase/admin";
import { emailShell, escapeHtml, sendEmail } from "@/lib/email";

/**
 * /api/feedback/comment — cria um comentário num feedback (thread pública).
 *
 * - Exige usuário logado (Bearer token). O servidor valida o token, escreve com
 *   service_role e define `is_admin` (impede falsificar o selo).
 * - Notifica por e-mail o autor original do feedback (se ele deixou contato e
 *   não é quem está comentando).
 */

const CATEGORY_LABELS: Record<string, string> = {
  bug: "🐛 Erro / Bug",
  sugestao: "💡 Sugestão",
  opiniao: "💬 Opinião",
  outro: "❓ Outro",
};

export async function POST(request: Request) {
  const rl = rateLimit(clientKey(request, "fb-comment"), 10, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Muitos comentários seguidos. Aguarde um instante." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } },
    );
  }

  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json(
      { error: "Faça login para comentar." },
      { status: 401 },
    );
  }

  const db = getAdminClient();
  if (!db) {
    return NextResponse.json(
      { error: "Comentários indisponíveis (servidor não configurado)." },
      { status: 503 },
    );
  }

  let feedbackId = "";
  let body = "";
  try {
    const payload = (await request.json()) as { feedbackId?: unknown; body?: unknown };
    feedbackId = typeof payload.feedbackId === "string" ? payload.feedbackId : "";
    body = typeof payload.body === "string" ? payload.body.trim().slice(0, 2000) : "";
  } catch {
    return NextResponse.json({ error: "Corpo inválido." }, { status: 400 });
  }
  if (!feedbackId || !body) {
    return NextResponse.json({ error: "Comentário vazio." }, { status: 400 });
  }

  const { data: comment, error } = await db
    .from("feedback_comments")
    .insert({
      feedback_id: feedbackId,
      author_id: user.id,
      author_name: user.name,
      body,
      is_admin: user.isAdmin,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: "Não foi possível comentar." }, { status: 500 });
  }

  // Notifica o autor do feedback (se deixou e-mail e não é quem comentou).
  try {
    const { data: fb } = await db
      .from("feedback")
      .select("contact_email, category, message")
      .eq("id", feedbackId)
      .single();
    const to = fb?.contact_email as string | undefined;
    if (to && to.toLowerCase() !== (user.email ?? "").toLowerCase()) {
      const who = user.isAdmin ? "O Arquimago (equipe Solando)" : user.name;
      await sendEmail({
        to,
        subject: "💬 Novo comentário no seu feedback — Solando",
        html: emailShell(
          "Responderam o seu feedback!",
          `<p><b>${escapeHtml(who)}</b> comentou no seu feedback ${
            CATEGORY_LABELS[fb?.category as string] ?? ""
          }:</p>
           <blockquote style="border-left:3px solid #7c3aed;padding-left:12px;color:#c4b5fd">${escapeHtml(
             body,
           ).replace(/\n/g, "<br>")}</blockquote>
           <p style="color:#8b86a0;font-size:13px">Seu feedback: "${escapeHtml(
             (fb?.message as string) ?? "",
           ).slice(0, 160)}"</p>`,
        ),
      });
    }
  } catch {
    /* notificação é best-effort */
  }

  return NextResponse.json({ ok: true, comment });
}
