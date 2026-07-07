import { NextResponse } from "next/server";
import { clientKey, rateLimit } from "@/lib/ai/rateLimit";
import { getAdminClient, getUserFromRequest } from "@/lib/supabase/admin";
import { emailShell, escapeHtml, sendEmail } from "@/lib/email";

/**
 * /api/feedback/status — o ADMIN (dono do site) altera o status de um feedback
 * (ex.: marcar um erro como resolvido). Notifica por e-mail o autor original.
 */

const STATUSES = new Set(["aberto", "em_analise", "resolvido", "fechado"]);

const STATUS_LABELS: Record<string, string> = {
  aberto: "Aberto",
  em_analise: "Em análise",
  resolvido: "Resolvido ✅",
  fechado: "Fechado",
};

export async function POST(request: Request) {
  const rl = rateLimit(clientKey(request, "fb-status"), 30, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Aguarde um instante." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } },
    );
  }

  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }
  if (!user.isAdmin) {
    return NextResponse.json(
      { error: "Apenas o administrador pode alterar o status." },
      { status: 403 },
    );
  }

  const db = getAdminClient();
  if (!db) {
    return NextResponse.json({ error: "Servidor não configurado." }, { status: 503 });
  }

  let feedbackId = "";
  let status = "";
  try {
    const payload = (await request.json()) as { feedbackId?: unknown; status?: unknown };
    feedbackId = typeof payload.feedbackId === "string" ? payload.feedbackId : "";
    status = typeof payload.status === "string" ? payload.status : "";
  } catch {
    return NextResponse.json({ error: "Corpo inválido." }, { status: 400 });
  }
  if (!feedbackId || !STATUSES.has(status)) {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }

  const { error } = await db
    .from("feedback")
    .update({ status })
    .eq("id", feedbackId);
  if (error) {
    return NextResponse.json({ error: "Não foi possível atualizar." }, { status: 500 });
  }

  // Notifica o autor do feedback (se deixou e-mail).
  try {
    const { data: fb } = await db
      .from("feedback")
      .select("contact_email, message")
      .eq("id", feedbackId)
      .single();
    const to = fb?.contact_email as string | undefined;
    if (to) {
      const resolved = status === "resolvido";
      await sendEmail({
        to,
        subject: `${resolved ? "✅" : "🔔"} Seu feedback foi atualizado — Solando`,
        html: emailShell(
          `Status do seu feedback: ${STATUS_LABELS[status]}`,
          `<p>Boas novas, aventureiro! O seu feedback foi marcado como <b>${
            STATUS_LABELS[status]
          }</b>.</p>
           ${
             resolved
               ? "<p>O problema que você relatou foi resolvido. Valeu por ajudar a forjar o Solando! ⚔️</p>"
               : ""
           }
           <p style="color:#8b86a0;font-size:13px">Seu feedback: "${escapeHtml(
             (fb?.message as string) ?? "",
           ).slice(0, 160)}"</p>`,
        ),
      });
    }
  } catch {
    /* best-effort */
  }

  return NextResponse.json({ ok: true, status });
}
