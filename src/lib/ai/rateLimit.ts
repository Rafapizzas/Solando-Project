/**
 * rateLimit.ts — Limitador simples em memória (janela deslizante) para proteger
 * as rotas de IA da cota gratuita. É "best-effort": em serverless cada instância
 * tem seu próprio contador, mas ainda contém rajadas e uso abusivo por IP.
 */

interface Bucket {
  hits: number[];
}

const buckets = new Map<string, Bucket>();

export interface RateLimitResult {
  ok: boolean;
  retryAfterSeconds: number;
}

/**
 * Permite `limit` requisições por `windowMs` para a `key` informada.
 */
export function rateLimit(key: string, limit = 12, windowMs = 60_000): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(key) ?? { hits: [] };
  bucket.hits = bucket.hits.filter((t) => now - t < windowMs);

  if (bucket.hits.length >= limit) {
    const oldest = bucket.hits[0];
    const retryAfterSeconds = Math.max(1, Math.ceil((windowMs - (now - oldest)) / 1000));
    buckets.set(key, bucket);
    return { ok: false, retryAfterSeconds };
  }

  bucket.hits.push(now);
  buckets.set(key, bucket);

  // Limpeza oportunista para não crescer indefinidamente.
  if (buckets.size > 5000) {
    for (const [k, b] of buckets) {
      if (b.hits.every((t) => now - t >= windowMs)) buckets.delete(k);
    }
  }

  return { ok: true, retryAfterSeconds: 0 };
}

/** Deriva uma chave de IP a partir dos headers da requisição. */
export function clientKey(request: Request, scope: string): string {
  const fwd = request.headers.get("x-forwarded-for") ?? "";
  const ip = fwd.split(",")[0].trim() || request.headers.get("x-real-ip") || "anon";
  return `${scope}:${ip}`;
}
