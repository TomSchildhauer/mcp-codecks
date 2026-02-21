/**
 * Zod schemas for tool input validation
 */

import { z } from "zod";
import { ResponseFormat } from "../types.js";
import { DEFAULT_LIMIT, MAX_LIMIT } from "../constants.js";

// Common schemas
export const PaginationSchema = z.object({
  limit: z.number()
    .int()
    .min(1)
    .max(MAX_LIMIT)
    .default(DEFAULT_LIMIT)
    .describe("Maximum number of results to return"),
  offset: z.number()
    .int()
    .min(0)
    .default(0)
    .describe("Number of results to skip for pagination")
});

export const ResponseFormatSchema = z.nativeEnum(ResponseFormat)
  .default(ResponseFormat.MARKDOWN)
  .describe("Output format: 'markdown' for human-readable or 'json' for structured data");

// Card schemas
export const ListCardsSchema = z.object({
  deck_id: z.string().optional().describe("Filter by specific deck ID"),
  milestone_id: z.string().optional().describe("Filter by specific milestone ID"),
  assignee_id: z.string().optional().describe("Filter by assigned user ID"),
  status: z.enum(["unassigned", "assigned", "started", "review", "blocked", "done"]).optional()
    .describe("Filter by workflow status"),
  search: z.string().optional().describe("Search term to filter cards by title/content"),
  limit: z.number().int().min(1).max(MAX_LIMIT).default(DEFAULT_LIMIT),
  offset: z.number().int().min(0).default(0),
  response_format: ResponseFormatSchema
}).strict();

export const GetCardSchema = z.object({
  card_id: z.string().describe("The card ID to retrieve"),
  response_format: ResponseFormatSchema
}).strict();

export const CreateCardSchema = z.object({
  content: z.string().min(1).describe("Card content (first line becomes title)"),
  deck_id: z.string().optional().describe("Deck to place card in"),
  assignee_id: z.string().optional().describe("User ID to assign card to"),
  effort: z.number().int().min(0).optional().describe("Effort/complexity points"),
  priority: z.enum(["a", "b", "c"]).optional().describe("Priority: a (high), b (medium), c (low)"),
  milestone_id: z.string().optional().describe("Milestone to assign card to"),
  put_on_hand: z.boolean().default(false).describe("Whether to add card to your hand"),
  user_id: z.string().describe("Your user ID (required for creating cards)")
}).strict();

export const UpdateCardSchema = z.object({
  card_id: z.string().describe("The card ID to update"),
  content: z.string().optional().describe("Updated card content"),
  assignee_id: z.string().optional().describe("New assignee user ID (null to unassign)"),
  effort: z.number().int().min(0).optional().describe("Updated effort points"),
  priority: z.enum(["a", "b", "c"]).optional().describe("Updated priority"),
  status: z.enum(["unassigned", "assigned", "started", "review", "blocked", "done"]).optional()
    .describe("Updated workflow status"),
  user_id: z.string().describe("Your user ID")
}).strict();

// Deck schemas
export const ListDecksSchema = z.object({
  project_id: z.string().optional().describe("Filter by specific project ID"),
  response_format: ResponseFormatSchema
}).strict();

export const GetDeckSchema = z.object({
  deck_id: z.string().describe("The deck ID to retrieve"),
  response_format: ResponseFormatSchema
}).strict();

// Project schemas
export const ListProjectsSchema = z.object({
  include_archived: z.boolean().default(false).describe("Include archived projects"),
  response_format: ResponseFormatSchema
}).strict();

// Milestone schemas
export const ListMilestonesSchema = z.object({
  response_format: ResponseFormatSchema
}).strict();

export const GetMilestoneSchema = z.object({
  milestone_id: z.string().describe("The milestone ID to retrieve"),
  response_format: ResponseFormatSchema
}).strict();

// User schema
export const GetCurrentUserSchema = z.object({
  response_format: ResponseFormatSchema
}).strict();

// Type exports
export type ListCardsInput = z.infer<typeof ListCardsSchema>;
export type GetCardInput = z.infer<typeof GetCardSchema>;
export type CreateCardInput = z.infer<typeof CreateCardSchema>;
export type UpdateCardInput = z.infer<typeof UpdateCardSchema>;
export type ListDecksInput = z.infer<typeof ListDecksSchema>;
export type GetDeckInput = z.infer<typeof GetDeckSchema>;
export type ListProjectsInput = z.infer<typeof ListProjectsSchema>;
export type ListMilestonesInput = z.infer<typeof ListMilestonesSchema>;
export type GetMilestoneInput = z.infer<typeof GetMilestoneSchema>;
export type GetCurrentUserInput = z.infer<typeof GetCurrentUserSchema>;
