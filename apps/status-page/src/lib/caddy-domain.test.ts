import { describe, expect, it } from "vitest";

import { normalizeCaddyDomain, resolveCaddyDomainLookup } from "./caddy-domain";

describe("normalizeCaddyDomain", () => {
  it("normalizes case and a trailing dot", () => {
    expect(normalizeCaddyDomain("Status.Acme.com.")).toBe("status.acme.com");
  });

  it("rejects non-hostname input", () => {
    expect(normalizeCaddyDomain("https://status.acme.com")).toBeNull();
    expect(normalizeCaddyDomain("localhost")).toBeNull();
    expect(normalizeCaddyDomain("127.0.0.1")).toBeNull();
    expect(normalizeCaddyDomain("status.acme.com:443")).toBeNull();
  });
});

describe("resolveCaddyDomainLookup", () => {
  it("always checks the exact custom domain", () => {
    expect(
      resolveCaddyDomainLookup({
        domain: "status.acme.com",
        statusPageUrl: "https://status.example.com",
      }),
    ).toEqual({ domain: "status.acme.com", slug: null });
  });

  it("extracts a slug from a configured wildcard hostname", () => {
    expect(
      resolveCaddyDomainLookup({
        domain: "acme.status.example.com",
        statusPageUrl: "https://{slug}.status.example.com",
      }),
    ).toEqual({ domain: "acme.status.example.com", slug: "acme" });
  });

  it("extracts a slug using a configured base domain", () => {
    expect(
      resolveCaddyDomainLookup({
        domain: "acme.status.example.com",
        statusPageUrl: "https://status.example.com",
      }),
    ).toEqual({ domain: "acme.status.example.com", slug: "acme" });
  });

  it("does not treat an unrelated hostname as a slug", () => {
    expect(
      resolveCaddyDomainLookup({
        domain: "status.acme.com",
        statusPageUrl: "https://{slug}.status.example.com",
      }),
    ).toEqual({ domain: "status.acme.com", slug: null });
  });
});
