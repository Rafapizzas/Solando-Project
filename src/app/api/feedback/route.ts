import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { clientKey, rateLimit } from "@/lib/ai/rateLimit";

/**
 * /api/feedback — recebe feedback do público (erro, sugestão, opinião, nota).
 *
 * - SEMPRE tenta salvar no Supabase (tabela `public.feedback`, RLS permite
 *   insert anônimo). Se o Supabase não estiver configurado, apenas ignora.
 * - Se `RESEND_API_KEY` e `FEEDBACK_EMAIL_TO` existirem, envia também um e-mail
 *   para o dono do site. Tudo é opcional e degrada com elegância.
 *
 * As chaves ficam só no servidor; nada sensível vai para o cliente.
 */

const CATEGORIES = new Set(["bug", "sugestao", "opiniao", "outro"]);

interface FeedbackBody {
  category?: unknown;
  rating?: unknown;
  message?: unknown;
  email?: unknown;
  page?: unknown;
  profileName?: unknown;
}

const CATEGORY_LABELS: Record<string, string> = {
  bug: "🐛 Erro / Bug",
  sugestao: "💡 Sugestão",
  opiniao: "💬 Opinião",
  outro: "❓ Outro",
};

export async function POST(request: Request) {
  const rl = rateLimit(clientKey(request, "feedback"), 6, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Muitos envios. Aguarde um instante." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } },
    );
  }

  let body: FeedbackBody;
  try {
    body = (await request.json()) as FeedbackBody;
  } catch {
    return NextResponse.json({ error: "Corpo inválido." }, { status: 400 });
  }

  const category = typeof body.category === "string" ? body.category : "";
  const message =
    typeof body.message === "string" ? body.message.trim().slice(0, 4000) : "";
  const rating =
    typeof body.rating === "number" && body.rating >= 1 && body.rating <= 5
      ? Math.round(body.rating)
      : null;
  const email =
    typeof body.email === "string" && body.email.includes("@")
      ? body.email.trim().slice(0, 200)
      : null;
  const page = typeof body.page === "string" ? body.page.slice(0, 200) : null;
  const profileName =
    typeof body.profileName === "string" ? body.profileName.slice(0, 120) : null;

  if (!CATEGORIES.has(category)) {
    return NextResponse.json({ error: "Categoria inválida." }, { status: 400 });
  }
  if (!message) {
    return NextResponse.json({ error: "Escreva uma mensagem." }, { status: 400 });
  }

  const userAgent = request.headers.get("user-agent")?.slice(0, 400) ?? null;

  // 1) Salvar no Supabase (best-effort).
  let stored = false;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (url && anonKey) {
    try {
      const db = createClient(url, anonKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
      const { error } = await db.from("feedback").insert({
        category,
        rating,
        message,
        contact_email: email,
        page,
        user_agent: userAgent,
        profile_name: profileName,
      });
      stored = !error;
    } catch {
      /* ignora — segue para o e-mail */
    }
  }

  // 2) Enviar e-mail via Resend (opcional).
  const resendKey = process.env.RESEND_API_KEY;
  const to = process.env.FEEDBACK_EMAIL_TO;
  const from =
    process.env.FEEDBACK_EMAIL_FROM ?? "Solando Feedback <onboarding@resend.dev>";
  let emailed = false;
  if (resendKey && to) {
    try {
      const stars = rating ? "★".repeat(rating) + "☆".repeat(5 - rating) : "—";
      const html = `
        <h2>Novo feedback do Solando</h2>
        <p><b>Categoria:</b> ${CATEGORY_LABELS[category] ?? category}</p>
        <p><b>Nota:</b> ${stars} ${rating ? `(${rating}/5)` : ""}</p>
        <p><b>Mensagem:</b></p>
        <blockquote style="border-left:3px solid #7c3aed;padding-left:12px;color:#333">${escapeHtml(
          message,
        ).replace(/\n/g, "<br>")}</blockquote>
        <hr>
        <p style="color:#666;font-size:12px">
          Contato: ${email ?? "não informado"}<br>
          Perfil: ${profileName ?? "—"}<br>
          Página: ${page ?? "—"}<br>
          User-Agent: ${escapeHtml(userAgent ?? "—")}
        </p>`;
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from,
          to: [to],
          subject: `[Solando] ${CATEGORY_LABELS[category] ?? category}${
            rating ? ` — ${rating}★` : ""
          }`,
          html,
          reply_to: email ?? undefined,
        }),
      });
      emailed = res.ok;
    } catch {
      /* ignora — o registro no banco já basta */
    }
  }

  if (!stored && !emailed) {
    return NextResponse.json({
      ok: true,
      persisted: false,
      note: "Recebido, mas o armazenamento não está configurado no servidor.",
    });
  }

  return NextResponse.json({ ok: true, persisted: stored, emailed });
}

/** Escapa HTML para evitar injeção no corpo do e-mail. */
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
