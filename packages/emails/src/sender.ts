const SUBSCRIBERS_ADDRESS = "notifications@subscribers.openstatus.dev";
const MAX_DISPLAY_NAME_LENGTH = 60;

/**
 * `From` header for status page emails. The page title is customer input, so
 * drop anything that would break the quoted display name (quotes, angle
 * brackets, backslashes, control chars) or make it look like an address (`@`),
 * and cap the length so it doesn't read as spam in the inbox.
 */
export function statusPageFrom(pageTitle: string | null | undefined) {
  const cleaned = (pageTitle ?? "")
    .replace(/["<>\\@\p{Cc}]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
  const name = Array.from(cleaned)
    .slice(0, MAX_DISPLAY_NAME_LENGTH)
    .join("")
    .trim();
  // Self-hosted deployments point these at a verified Resend domain.
  const address =
    process.env.EMAIL_FROM_SUBSCRIBERS?.trim() ||
    process.env.EMAIL_FROM?.trim() ||
    SUBSCRIBERS_ADDRESS;
  return `"${name || "openstatus"}" <${address}>`;
}
