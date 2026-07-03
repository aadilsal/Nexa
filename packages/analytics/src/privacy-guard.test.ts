import { describe, expect, it } from "vitest";
import {
  assertNoForbiddenKeys,
  sanitizeProperties,
} from "../src/privacy-guard.js";

describe("privacy-guard", () => {
  it("strips forbidden keys", () => {
    expect(
      sanitizeProperties({ category: "FOOD", page: "/dashboard" }),
    ).toEqual({ page: "/dashboard" });
  });

  it("throws on forbidden keys in assert", () => {
    expect(() => assertNoForbiddenKeys({ amount: 100 })).toThrow(
      "Forbidden analytics property: amount",
    );
  });
});
