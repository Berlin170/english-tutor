/**
 * The AI Gateway accepts either an API key or, on a Vercel deployment, an
 * automatic per-request OIDC token. So the only genuinely unauthenticated
 * case is local development with an empty .env.local.
 */
export function gatewayAuthError(): string | null {
  if (process.env.AI_GATEWAY_API_KEY) return null;
  if (process.env.VERCEL) return null; // OIDC handles auth on Vercel.

  return "AI_GATEWAY_API_KEY is not set. Add it to .env.local and restart the dev server.";
}
