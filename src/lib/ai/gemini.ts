/**
 * gemini.ts — Helper de servidor para chamar o Google Gemini (tier gratuito).
 *
 * A chave fica SOMENTE no servidor (`GEMINI_API_KEY`, sem NEXT_PUBLIC). Se a
 * chave não estiver configurada — ou a IA falhar —, retornamos `{ fallback }`
 * para a UI degradar com elegância (nunca quebra e não há custo).
 *
 * NÃO importe este módulo em componentes de cliente: ele deve rodar apenas em
 * rotas de API / código de servidor.
 */

const MODEL = "gemini-1.5-flash";
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

export interface GeminiTurn {
  role: "user" | "model";
  parts: Array<{ text: string }>;
}

export interface GeminiRequest {
  system: string;
  contents: GeminiTurn[];
  temperature?: number;
  maxOutputTokens?: number;
}

export type GeminiResult =
  | { ok: true; text: string }
  | { ok: false; fallback: true; reason: string };

/** Chama o Gemini e devolve texto ou um fallback amigável (nunca lança). */
export async function callGemini(req: GeminiRequest): Promise<GeminiResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return { ok: false, fallback: true, reason: "GEMINI_API_KEY não configurada." };
  }

  try {
    const res = await fetch(`${ENDPOINT}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: req.system }] },
        contents: req.contents,
        generationConfig: {
          temperature: req.temperature ?? 0.6,
          maxOutputTokens: req.maxOutputTokens ?? 600,
        },
      }),
    });

    if (!res.ok) {
      return { ok: false, fallback: true, reason: `IA indisponível (HTTP ${res.status}).` };
    }

    const data = (await res.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (!text) {
      return { ok: false, fallback: true, reason: "Sem resposta da IA." };
    }
    return { ok: true, text };
  } catch {
    return { ok: false, fallback: true, reason: "Falha ao contatar a IA." };
  }
}
