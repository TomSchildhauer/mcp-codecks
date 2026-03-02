function toJsonString(value) {
  try {
    return JSON.stringify(value);
  } catch {
    return "";
  }
}

function hasErrorKey(value) {
  return Boolean(value && typeof value === "object" && "error" in value && value.error);
}

function parseJson(text) {
  if (typeof text !== "string") {
    return null;
  }
  const trimmed = text.trim();
  if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) {
    return null;
  }
  try {
    return JSON.parse(trimmed);
  } catch {
    return null;
  }
}

export function classifyToolFailure(response) {
  if (!response || typeof response !== "object") {
    return { failed: true, reason: "Empty tool response." };
  }

  if (response.error) {
    return { failed: true, reason: `Tool protocol error: ${toJsonString(response.error) || "unknown"}` };
  }

  const result = response.result ?? response;

  if (result?.isError === true) {
    return { failed: true, reason: "Tool returned MCP isError=true." };
  }

  if (hasErrorKey(result?.structuredContent)) {
    return { failed: true, reason: `Tool returned structured error payload: ${toJsonString(result.structuredContent.error)}` };
  }

  const content = Array.isArray(result?.content) ? result.content : [];
  for (const entry of content) {
    if (entry?.type === "text" && typeof entry.text === "string") {
      if (/\bError:/i.test(entry.text)) {
        return { failed: true, reason: entry.text.slice(0, 160) };
      }
      const parsed = parseJson(entry.text);
      if (hasErrorKey(parsed)) {
        return { failed: true, reason: `Tool returned JSON error payload: ${toJsonString(parsed.error)}` };
      }
      if (parsed?.isError === true) {
        return { failed: true, reason: "Tool returned JSON payload with isError=true." };
      }
    }

    if (entry?.type === "json" && hasErrorKey(entry?.json)) {
      return { failed: true, reason: `Tool returned JSON content error: ${toJsonString(entry.json.error)}` };
    }
  }

  const hasUsablePayload =
    content.length > 0 ||
    (result?.structuredContent !== undefined && result?.structuredContent !== null);

  if (!hasUsablePayload) {
    return { failed: true, reason: "Missing usable tool payload (no content/structuredContent)." };
  }

  return { failed: false };
}

export function extractSearchablePayload(response) {
  const result = response?.result ?? response ?? {};
  const chunks = [];

  if (result.structuredContent !== undefined) {
    chunks.push(toJsonString(result.structuredContent));
  }

  const content = Array.isArray(result.content) ? result.content : [];
  for (const entry of content) {
    if (entry?.type === "text" && typeof entry.text === "string") {
      chunks.push(entry.text);
      continue;
    }
    if (entry?.type === "json" && entry.json !== undefined) {
      chunks.push(toJsonString(entry.json));
    }
  }

  return chunks.filter(Boolean).join("\n");
}
