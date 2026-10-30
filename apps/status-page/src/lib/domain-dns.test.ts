import { describe, expect, it } from "vitest";

import { domainPointsToTarget } from "./domain-dns";

const emptyLookup = async () => Promise.resolve([] as string[]);

describe("domainPointsToTarget", () => {
  it("accepts a CNAME to the configured target", async () => {
    await expect(
      domainPointsToTarget("status.acme.com", "status.example.com", {
        resolve4: emptyLookup,
        resolve6: emptyLookup,
        resolveCname: async () => ["status.example.com."],
      }),
    ).resolves.toBe(true);
  });

  it("accepts matching addresses for apex aliases", async () => {
    await expect(
      domainPointsToTarget("acme.com", "status.example.com", {
        resolve4: async () => ["192.0.2.10"],
        resolve6: emptyLookup,
        resolveCname: emptyLookup,
      }),
    ).resolves.toBe(true);
  });

  it("rejects unrelated DNS", async () => {
    await expect(
      domainPointsToTarget("status.acme.com", "status.example.com", {
        resolve4: async (hostname) =>
          hostname === "status.acme.com" ? ["192.0.2.20"] : ["192.0.2.10"],
        resolve6: emptyLookup,
        resolveCname: emptyLookup,
      }),
    ).resolves.toBe(false);
  });
});
