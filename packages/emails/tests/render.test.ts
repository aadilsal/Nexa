import { describe, expect, it } from "vitest";
import { emailRegistry } from "../src/registry";
import { sendNexaEmail } from "../src/render";

describe("email templates", () => {
  for (const [id, template] of Object.entries(emailRegistry)) {
    it(`renders ${id} without errors`, async () => {
      const rendered = await sendNexaEmail(
        id as keyof typeof emailRegistry,
        template.exampleProps as never,
      );

      expect(rendered.subject.length).toBeGreaterThan(0);
      expect(rendered.html.length).toBeGreaterThan(1000);
      expect(rendered.text.length).toBeGreaterThan(0);
      expect(rendered.html).not.toContain("server rendering errored");
    });
  }
});
