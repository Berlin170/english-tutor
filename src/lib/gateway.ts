/**
 * The AI Gateway accepts either an API key or a Vercel OIDC token. `vercel link`
 * writes a development OIDC token into .env.local and deployments get one per
 * request, so the only unauthenticated case is a project that has neither.
 */
export function gatewayAuthError(): string | null {
  if (process.env.AI_GATEWAY_API_KEY) return null;
  if (process.env.VERCEL_OIDC_TOKEN) return null; // written by `vercel link`
  if (process.env.VERCEL) return null; // running on a Vercel deployment

  return "No AI Gateway credentials. Either run `vercel link` then `vercel env pull` to get an OIDC token, or put AI_GATEWAY_API_KEY in .env.local. Restart the dev server afterwards.";
}
