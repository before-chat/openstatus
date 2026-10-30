import { describe, expect, it } from "vitest";

import { buildStatusPageUrl } from "./status-page-url";

describe("buildStatusPageUrl", () => {
  it("uses the hosted subdomain when no base URL is configured", () => {
    expect(buildStatusPageUrl({ slug: "acme" })).toBe(
      "https://acme.openstatus.dev",
    );
  });

  it("uses the configured self-hosted domain as the slug suffix", () => {
    expect(
      buildStatusPageUrl({
        slug: "acme",
        baseUrl: "https://status.example.com/",
      }),
    ).toBe("https://acme.status.example.com");
  });

  it("supports wildcard-domain URL templates", () => {
    expect(
      buildStatusPageUrl({
        slug: "acme",
        baseUrl: "https://{slug}.status.example.com",
      }),
    ).toBe("https://acme.status.example.com");
  });

  it("prefers a custom domain", () => {
    expect(
      buildStatusPageUrl({
        slug: "acme",
        customDomain: "status.acme.com",
        baseUrl: "https://status.example.com",
      }),
    ).toBe("https://status.acme.com");
  });
});
