/**
 * email.ts — Envio de e-mail via Resend (server-only). Degrada com elegância:
 * se `RESEND_API_KEY` não estiver configurada, apenas não envia (retorna false).
 */

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  const from =
    process.env.FEEDBACK_EMAIL_FROM ?? "Solando <onboarding@resend.dev>";
  if (!key || !opts.to) return false;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [opts.to],
        subject: opts.subject,
        html: opts.html,
        reply_to: opts.replyTo,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** Casca visual simples e temática para os e-mails do Solando. */
export function emailShell(title: string, bodyHtml: string): string {
  return `
  <div style="font-family:system-ui,Arial,sans-serif;max-width:560px;margin:0 auto;background:#0a0914;color:#e8e6f0;border:1px solid #2a2440;border-radius:14px;overflow:hidden">
    <div style="background:linear-gradient(135deg,#4c1d95,#7c3aed);padding:16px 20px">
      <span style="font-size:18px;font-weight:800;letter-spacing:2px">✦ SOLANDO</span>
    </div>
    <div style="padding:20px">
      <h2 style="margin:0 0 12px;font-size:18px;color:#c4b5fd">${title}</h2>
      ${bodyHtml}
    </div>
    <div style="padding:14px 20px;border-top:1px solid #2a2440;color:#8b86a0;font-size:12px">
      Você recebeu este aviso porque deixou um contato ao enviar um feedback no Solando.
    </div>
  </div>`;
}
