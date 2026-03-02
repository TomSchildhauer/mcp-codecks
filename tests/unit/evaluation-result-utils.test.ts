import { describe, expect, it } from "vitest";
import { classifyToolFailure, extractSearchablePayload } from "../../scripts/evaluation-result-utils.mjs";

describe("evaluation result utils", () => {
  it("classifies MCP protocol error as hard failure", () => {
    const result = classifyToolFailure({ error: { code: -32000, message: "boom" } });
    expect(result.failed).toBe(true);
    expect(result.reason).toContain("Tool protocol error");
  });

  it("classifies isError results as hard failures", () => {
    const result = classifyToolFailure({ result: { isError: true, content: [] } });
    expect(result.failed).toBe(true);
  });

  it("classifies text and structured error payloads as hard failures", () => {
    const textError = classifyToolFailure({
      result: { content: [{ type: "text", text: "Error: upstream failure" }] }
    });
    expect(textError.failed).toBe(true);

    const structuredError = classifyToolFailure({
      result: { structuredContent: { error: "bad request" }, content: [{ type: "text", text: "{}" }] }
    });
    expect(structuredError.failed).toBe(true);
  });

  it("classifies json-in-text errors as hard failures", () => {
    const result = classifyToolFailure({
      result: { content: [{ type: "text", text: "{\"error\":\"bad\"}" }] }
    });
    expect(result.failed).toBe(true);
  });

  it("fails when payload is missing", () => {
    const result = classifyToolFailure({ result: { content: [] } });
    expect(result.failed).toBe(true);
    expect(result.reason).toContain("Missing usable tool payload");
  });

  it("passes valid payload and extracts searchable text", () => {
    const response = {
      result: {
        structuredContent: { id: "abc", name: "demo" },
        content: [
          { type: "text", text: "hello world" },
          { type: "json", json: { extra: "value" } }
        ]
      }
    };
    const failure = classifyToolFailure(response);
    expect(failure.failed).toBe(false);

    const payload = extractSearchablePayload(response);
    expect(payload).toContain("\"id\":\"abc\"");
    expect(payload).toContain("hello world");
    expect(payload).toContain("\"extra\":\"value\"");
  });
});
