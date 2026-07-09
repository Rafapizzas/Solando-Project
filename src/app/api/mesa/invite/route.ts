import { NextResponse } from "next/server";
import { clientKey, rateLimit } from "@/lib/ai/rateLimit";
import { getAdminClient, getUserFromRequest } from "@/lib/supabase/admin";
import { emailShell, escapeHtml, sendEmail } from "@/lib/email";

/**
 * /api/mesa/invite — envia um convite de mesa por e-mail.
 *
 * Segurança: exige token de acesso válido (Bearer) e verifica, via service role,
 * que o solicitante pode gerenciar a mesa. Só então dispara o e-mail com o link.
 */

interface InviteBody {
  tableId?: unknown;
  tableName?: unknown;
  email?: unknown;
  code?: unknown;
  origin?: unknown;
}

export async function POST(request: Request) {
  const rl = rateLimit(clientKey(request, "mesa-invite"), 10, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Muitos convites. Aguarde um instante." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } },
    );
  }

  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  let body: InviteBody;
  try {
    body = (await request.json()) as InviteBody;
  } catch {
    return NextResponse.json({ error: "Corpo inválido." }, { status: 400 });
  }

  const tableId = typeof body.tableId === "string" ? body.tableId : "";
  const tableName =
    typeof body.tableName === "string" ? body.tableName.slice(0, 120) : "Mesa";
  const code = typeof body.code === "string" ? body.code.slice(0, 40) : "";
  const email =
    typeof body.email === "string" && body.email.includes("@")
      ? body.email.trim().slice(0, 200)
      : "";
  const origin = typeof body.origin === "string" ? body.origin.slice(0, 200) : "";

  if (!tableId || !code || !email) {
    return NextResponse.json({ error: "Dados incompletos." }, { status: 400 });
  }

  const admin = getAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Servidor não configurado." }, { status: 500 });
  }

  // Confirma que o solicitante gerencia esta mesa.
  const { data: membership } = await admin
    .from("table_members")
    .select("can_manage, role")
    .eq("table_id", tableId)
    .eq("user_id", user.id)
    .maybeSingle();
  const canManage = membership?.can_manage === true || membership?.role === "owner";
  if (!canManage) {
    return NextResponse.json({ error: "Sem permissão para convidar." }, { status: 403 });
  }

  // Confirma que o convite pertence à mesa.
  const { data: invite } = await admin
    .from("table_invites")
    .select("id")
    .eq("table_id", tableId)
    .eq("code", code)
    .maybeSingle();
  if (!invite) {
    return NextResponse.json({ error: "Convite inválido." }, { status: 400 });
  }

  const safeOrigin = /^https?:\/\//.test(origin) ? origin : "";
  const link = safeOrigin
    ? `${safeOrigin}/mesa?convite=${encodeURIComponent(code)}`
    : `Use o código ${code} em Mesas.`;

  const sent = await sendEmail({
    to: email,
    subject: `Convite para a mesa "${tableName}" no Solando`,
    html: emailShell(
      "Você foi convidado para uma mesa!",
      `<p style="margin:0 0 12px">${escapeHtml(user.name)} convidou você para a mesa
       <b>${escapeHtml(tableName)}</b> no Solando.</p>
       <p style="margin:0 0 16px">Entre pelo link abaixo:</p>
       <a href="${escapeHtml(safeOrigin ? `${safeOrigin}/mesa?convite=${encodeURIComponent(code)}` : "#")}"
          style="display:inline-block;background:#7c3aed;color:#fff;padding:10px 18px;border-radius:10px;text-decoration:none;font-weight:700">
          Entrar na mesa
       </a>
       <p style="margin:16px 0 0;color:#8b86a0;font-size:13px">
         Ou use o código <b>${escapeHtml(code)}</b>. ${escapeHtml(safeOrigin ? "" : link)}
       </p>`,
    ),
  });

  if (!sent) {
    return NextResponse.json(
      { ok: false, error: "E-mail não configurado no servidor. Use o link/código." },
      { status: 200 },
    );
  }
  return NextResponse.json({ ok: true });
}
