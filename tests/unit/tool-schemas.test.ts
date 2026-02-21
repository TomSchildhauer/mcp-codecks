import { describe, expect, it } from "vitest";
import {
  AddDecksToSpaceAfterSchema,
  BulkUpdateCardsSchema,
  CreateCardSchema,
  CreateDeckSchema
} from "../../src/schemas/tool-schemas.js";

describe("tool schemas", () => {
  it("validates bulk update cards inputs", () => {
    expect(() => BulkUpdateCardsSchema.parse({ ids: ["a"], status: "done" })).not.toThrow();
    expect(() => BulkUpdateCardsSchema.parse({ ids: ["a"], deck_id: "deck1" })).not.toThrow();
    expect(() => BulkUpdateCardsSchema.parse({ ids: ["a"] })).toThrow();
  });

  it("validates create deck inputs", () => {
    const value = {
      title: "Deck",
      project_id: "project-1",
      user_id: "user-1",
      space_id: 1
    };
    expect(() => CreateDeckSchema.parse(value)).not.toThrow();
  });

  it("validates add decks to space after inputs", () => {
    const value = {
      deck_ids: ["deck-1"],
      target_id: "deck-2",
      target_project_id: "project-1",
      target_space_id: 1
    };
    expect(() => AddDecksToSpaceAfterSchema.parse(value)).not.toThrow();
  });

  it("validates create card inputs", () => {
    const value = {
      content: "Hello",
      user_id: "user-1"
    };
    expect(() => CreateCardSchema.parse(value)).not.toThrow();
  });
});
