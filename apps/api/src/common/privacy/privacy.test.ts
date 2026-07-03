import { describe, expect, it } from "vitest";
import {
  assertNoForbiddenKeys,
  sanitizeAnalyticsProperties,
} from "./forbidden-fields";
import {
  signAnalyticsPayload,
  verifyAnalyticsSignature,
} from "./event-signing";

describe("forbidden-fields", () => {
  it("strips financial keys", () => {
    expect(
      sanitizeAnalyticsProperties({ amount: 100, page: "/x" }),
    ).toEqual({ page: "/x" });
  });

  it("rejects forbidden keys", () => {
    expect(() => assertNoForbiddenKeys({ merchant: "x" })).toThrow();
  });
});

describe("event-signing", () => {
  it("verifies valid signature when secret set", () => {
    process.env.ANALYTICS_EVENT_SIGNING_SECRET = "test-secret-key-for-signing";
    const body = '{"events":[]}';
    const sig = signAnalyticsPayload(body);
    expect(verifyAnalyticsSignature(body, sig)).toBe(true);
    delete process.env.ANALYTICS_EVENT_SIGNING_SECRET;
  });
});
