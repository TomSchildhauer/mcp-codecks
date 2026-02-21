import { describe, expect, it } from "vitest";
import { loadSchema } from "../../src/utils/schema.js";
import {
  buildRelationKey,
  buildRootQuery,
  denormalizeRootRelation,
  normalizeSelection,
  type Selection
} from "../../src/utils/query-builder.js";

const schema = loadSchema();

describe("query builder", () => {
  it("buildRelationKey stringifies query params", () => {
    const key = buildRelationKey("cards", { deckId: "123", $limit: 5 });
    expect(key).toBe("cards({\"deckId\":\"123\",\"$limit\":5})");
  });

  it("normalizes user email selection to primaryEmail", () => {
    const selection: Selection[] = ["id", "name", "email"];
    const normalized = normalizeSelection(schema, "user", selection);
    expect(normalized).toContain("id");
    expect(normalized).toContain("name");
    expect(normalized).not.toContain("email");
    const hasPrimaryEmail = normalized.some(
      (item) => typeof item === "object" && Object.keys(item)[0]?.startsWith("primaryEmail")
    );
    expect(hasPrimaryEmail).toBe(true);
  });

  it("buildRootQuery returns _root structure", () => {
    const query = buildRootQuery(schema, "account", ["id", "name"]);
    expect(query).toHaveProperty("_root");
    expect(Array.isArray(query._root)).toBe(true);
    expect(query._root[0]).toHaveProperty("account");
  });

  it("denormalizeRootRelation resolves nested relations", () => {
    const selection: Selection[] = ["id", "title", { deck: ["id", "name"] }];
    const accountSelection: Selection[] = [{ cards: selection }];

    const response = {
      _root: [{ account: "acc1" }],
      account: {
        acc1: { id: "acc1", cards: ["c1"] }
      },
      card: {
        c1: { id: "c1", title: "Card One", deck: "d1" }
      },
      deck: {
        d1: { id: "d1", name: "Main Deck" }
      }
    };

    const account = denormalizeRootRelation(schema, response, "account", accountSelection);
    expect(account?.cards?.[0]?.deck?.name).toBe("Main Deck");
  });
});
