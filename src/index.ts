#!/usr/bin/env node
/**
 * Codecks MCP Server
 * 
 * Provides tools to interact with Codecks game project tracker API,
 * including card management, deck organization, and milestone tracking.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import express from "express";

import { CodecksClient, formatError } from "./services/codecks-client.js";
import { ResponseFormat } from "./types.js";
import * as schemas from "./schemas/tool-schemas.js";
import * as format from "./utils/format.js";
import { loadSchema } from "./utils/schema.js";
import {
  buildIdQuery,
  buildRelationKey,
  buildRootQuery,
  denormalizeById,
  denormalizeRootRelation,
  validateSelection,
  type Selection
} from "./utils/query-builder.js";

// Initialize MCP server
const server = new McpServer({
  name: "codecks-mcp-server",
  version: "1.0.0"
});

const schema = loadSchema();

// Initialize Codecks client
let client: CodecksClient;

function getClient(): CodecksClient {
  if (!client) {
    const authToken = process.env.CODECKS_AUTH_TOKEN;
    const subdomain = process.env.CODECKS_ACCOUNT_SUBDOMAIN;

    if (!authToken || !subdomain) {
      throw new Error(
        "Missing required environment variables: CODECKS_AUTH_TOKEN and CODECKS_ACCOUNT_SUBDOMAIN"
      );
    }

    client = new CodecksClient(authToken, subdomain);
  }
  return client;
}

// ============================================================================
// TOOL: codecks_list_cards
// ============================================================================
server.registerTool(
  "codecks_list_cards",
  {
    title: "List Codecks Cards",
    description: `List cards from your Codecks account with optional filters.

This tool retrieves cards from Codecks, supporting various filters like deck, milestone, assignee, and status. Perfect for viewing your backlog, finding specific tasks, or getting an overview of work.

Args:
  - deck_id (string, optional): Filter by specific deck ID
  - milestone_id (string, optional): Filter by specific milestone ID
  - assignee_id (string, optional): Filter by assigned user ID
  - status (enum, optional): Filter by workflow status (unassigned, assigned, started, review, blocked, done)
  - search (string, optional): Search term to filter cards by title/content
  - limit (number): Maximum results to return (1-100, default: 20)
  - offset (number): Number of results to skip for pagination (default: 0)
  - response_format ('markdown' | 'json'): Output format (default: 'markdown')

Returns:
  For JSON format: Structured data with schema:
  {
    "cards": [{
      "id": string,
      "accountSeq": number,
      "title": string,
      "content": string,
      "derivedStatus": string,
      "effort": number (optional),
      "priority": string (optional),
      "assignee": {id, name} (optional),
      "deck": {id, name} (optional),
      "milestone": {id, name} (optional),
      "createdAt": string,
      "lastUpdatedAt": string
    }],
    "total": number,
    "count": number,
    "offset": number,
    "has_more": boolean,
    "next_offset": number (if has_more)
  }

Examples:
  - List all cards in a specific deck
  - Find cards assigned to a user
  - Search for cards containing specific text
  - Get cards in a milestone

Error Handling:
  - Returns authentication errors if credentials are invalid
  - Returns rate limit errors if too many requests
  - Provides clear messages for all error cases`,
    inputSchema: schemas.ListCardsSchema,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true
    }
  },
  async (params: schemas.ListCardsInput) => {
    try {
      const client = getClient();
      
      // Build query filters
      const filters: any = {};
      if (params.deck_id) filters.deckId = params.deck_id;
      if (params.milestone_id) filters.milestoneId = params.milestone_id;
      if (params.assignee_id) filters.assigneeId = params.assignee_id;
      if (params.status) filters.derivedStatus = params.status;
      if (params.search) {
        filters.content = { op: "search", value: params.search };
      }

      const cardSelection: Selection[] = [
        \"id\",
        \"accountSeq\",
        \"title\",
        \"content\",
        \"derivedStatus\",
        \"effort\",
        \"priority\",
        { assignee: [\"id\", \"name\"] },
        { deck: [\"id\", \"name\"] },
        { milestone: [\"id\", \"name\"] },
        \"createdAt\",
        \"lastUpdatedAt\"
      ];

      const cardsKey = buildRelationKey(\"cards\", {
        ...filters,
        $order: \"-lastUpdatedAt\",
        $limit: params.limit,
        $offset: params.offset
      });

      const accountSelection: Selection[] = [{ [cardsKey]: cardSelection }];
      validateSelection(schema, \"account\", accountSelection);

      const query = {
        _root: [
          {
            account: accountSelection
          }
        ]
      };

      const response = await client.query(query);
      const account = denormalizeRootRelation(schema, response as Record<string, any>, \"account\", accountSelection);
      const cards = account?.cards || [];

      // Calculate pagination metadata
      const meta = {
        total: cards.length, // Note: Codecks doesn't return total count in simple queries
        count: cards.length,
        offset: params.offset,
        has_more: cards.length === params.limit,
        ...(cards.length === params.limit ? { next_offset: params.offset + params.limit } : {})
      };

      const formatted = format.formatCardList(cards, params.response_format, meta);
      const { content, truncated } = format.checkAndTruncate(formatted, cards.length);

      return {
        content: [{ type: "text", text: content }],
        structuredContent: params.response_format === ResponseFormat.JSON ? { cards, ...meta } : undefined
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: formatError(error) }]
      };
    }
  }
);

// ============================================================================
// TOOL: codecks_get_card
// ============================================================================
server.registerTool(
  "codecks_get_card",
  {
    title: "Get Codecks Card",
    description: `Retrieve detailed information about a specific card.

Fetches complete details for a single card including title, content, status, assignee, deck, milestone, and all metadata.

Args:
  - card_id (string): The card ID to retrieve
  - response_format ('markdown' | 'json'): Output format (default: 'markdown')

Returns:
  Complete card details including all fields and relationships.

Error Handling:
  - Returns 404 error if card ID doesn't exist
  - Returns authentication errors if credentials are invalid`,
    inputSchema: schemas.GetCardSchema,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true
    }
  },
  async (params: schemas.GetCardInput) => {
    try {
      const client = getClient();

      const cardSelection: Selection[] = [
        \"id\",
        \"accountSeq\",
        \"title\",
        \"content\",
        \"derivedStatus\",
        \"effort\",
        \"priority\",
        { assignee: [\"id\", \"name\"] },
        { deck: [\"id\", \"name\"] },
        { milestone: [\"id\", \"name\", \"dueDate\"] },
        \"createdAt\",
        \"lastUpdatedAt\"
      ];

      const query = buildIdQuery(schema, \"card\", params.card_id, cardSelection);
      const response = await client.query(query);
      const card = denormalizeById(
        schema,
        response as Record<string, any>,
        \"card\",
        params.card_id,
        cardSelection
      );

      if (!card) {
        return {
          content: [{ type: "text", text: `Error: Card with ID '${params.card_id}' not found.` }]
        };
      }

      const formatted = format.formatCard(card, params.response_format);

      return {
        content: [{ type: "text", text: formatted }],
        structuredContent: params.response_format === ResponseFormat.JSON ? card : undefined
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: formatError(error) }]
      };
    }
  }
);

// ============================================================================
// TOOL: codecks_create_card
// ============================================================================
server.registerTool(
  "codecks_create_card",
  {
    title: "Create Codecks Card",
    description: `Create a new card in Codecks.

Creates a new task card with specified content and properties. The first line of content becomes the card title.

Args:
  - content (string): Card content (first line becomes title)
  - deck_id (string, optional): Deck to place card in
  - assignee_id (string, optional): User ID to assign card to
  - effort (number, optional): Effort/complexity points
  - priority ('a'|'b'|'c', optional): Priority (a=high, b=medium, c=low)
  - milestone_id (string, optional): Milestone to assign card to
  - put_on_hand (boolean): Whether to add card to your hand (default: false)
  - user_id (string): Your user ID (required for creating cards)

Returns:
  The created card with its new ID.

Error Handling:
  - Returns validation errors if parameters are invalid
  - Returns permission errors if you can't create cards in the specified deck`,
    inputSchema: schemas.CreateCardSchema,
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: true
    }
  },
  async (params: schemas.CreateCardInput) => {
    try {
      const client = getClient();

      const data = {
        content: params.content,
        deckId: params.deck_id || null,
        assigneeId: params.assignee_id || null,
        effort: params.effort || 0,
        priority: params.priority || null,
        milestoneId: params.milestone_id || null,
        putOnHand: params.put_on_hand,
        userId: params.user_id,
        masterTags: [],
        attachments: [],
        childCards: []
      };

      const response = await client.dispatch("cards/create", data);

      return {
        content: [{ 
          type: "text", 
          text: `Card created successfully! ID: ${response.cardId || response.id}` 
        }],
        structuredContent: response
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: formatError(error) }]
      };
    }
  }
);

// ============================================================================
// TOOL: codecks_list_decks
// ============================================================================
server.registerTool(
  "codecks_list_decks",
  {
    title: "List Codecks Decks",
    description: `List all decks in your Codecks account.

Retrieves all decks (card containers) from your Codecks organization, optionally filtered by project.

Args:
  - project_id (string, optional): Filter by specific project ID
  - response_format ('markdown' | 'json'): Output format (default: 'markdown')

Returns:
  List of decks with their IDs, names, types, and associated projects.

Examples:
  - List all decks across all projects
  - List decks in a specific project`,
    inputSchema: schemas.ListDecksSchema,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true
    }
  },
  async (params: schemas.ListDecksInput) => {
    try {
      const client = getClient();

      const filters: any = {};
      if (params.project_id) {
        filters.projectId = params.project_id;
      }

      const deckSelection: Selection[] = [
        \"id\",
        \"name\",
        \"type\",
        { project: [\"id\", \"name\"] }
      ];

      const decksKey = buildRelationKey(
        \"decks\",
        Object.keys(filters).length > 0 ? filters : undefined
      );

      const accountSelection: Selection[] = [{ [decksKey]: deckSelection }];
      validateSelection(schema, \"account\", accountSelection);

      const query = {
        _root: [
          {
            account: accountSelection
          }
        ]
      };

      const response = await client.query(query);
      const account = denormalizeRootRelation(schema, response as Record<string, any>, \"account\", accountSelection);
      const decks = account?.decks || [];

      const formatted = format.formatDeckList(decks, params.response_format);

      return {
        content: [{ type: "text", text: formatted }],
        structuredContent: params.response_format === ResponseFormat.JSON ? { decks } : undefined
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: formatError(error) }]
      };
    }
  }
);

// ============================================================================
// TOOL: codecks_get_deck
// ============================================================================
server.registerTool(
  "codecks_get_deck",
  {
    title: "Get Codecks Deck",
    description: `Retrieve detailed information about a specific deck.

Fetches deck metadata including name, type, description, project, and archival state.

Args:
  - deck_id (string): The deck ID to retrieve
  - response_format ('markdown' | 'json'): Output format (default: 'markdown')

Returns:
  Complete deck details including fields and relationships.`,
    inputSchema: schemas.GetDeckSchema,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true
    }
  },
  async (params: schemas.GetDeckInput) => {
    try {
      const client = getClient();

      const deckSelection: Selection[] = [
        "id",
        "name",
        "type",
        "description",
        "isArchived",
        { project: ["id", "name"] }
      ];

      const query = buildIdQuery(schema, "deck", params.deck_id, deckSelection);
      const response = await client.query(query);
      const deck = denormalizeById(
        schema,
        response as Record<string, any>,
        "deck",
        params.deck_id,
        deckSelection
      );

      if (!deck) {
        return {
          content: [{ type: "text", text: `Error: Deck with ID '${params.deck_id}' not found.` }]
        };
      }

      const formatted = format.formatDeck(deck, params.response_format);

      return {
        content: [{ type: "text", text: formatted }],
        structuredContent: params.response_format === ResponseFormat.JSON ? deck : undefined
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: formatError(error) }]
      };
    }
  }
);

// ============================================================================
// TOOL: codecks_list_projects
// ============================================================================
server.registerTool(
  "codecks_list_projects",
  {
    title: "List Codecks Projects",
    description: `List all projects in your Codecks account.

Retrieves all projects from your Codecks organization.

Args:
  - include_archived (boolean): Include archived projects (default: false)
  - response_format ('markdown' | 'json'): Output format (default: 'markdown')

Returns:
  List of projects with their IDs, names, and archived status.`,
    inputSchema: schemas.ListProjectsSchema,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true
    }
  },
  async (params: schemas.ListProjectsInput) => {
    try {
      const client = getClient();

      const projectSelection: Selection[] = [\"id\", \"name\", \"isArchived\"];
      const accountSelection: Selection[] = [{ anyProjects: projectSelection }];
      validateSelection(schema, \"account\", accountSelection);

      const query = {
        _root: [
          {
            account: accountSelection
          }
        ]
      };

      const response = await client.query(query);
      const account = denormalizeRootRelation(schema, response as Record<string, any>, \"account\", accountSelection);
      let projects = account?.anyProjects || [];

      if (!params.include_archived) {
        projects = projects.filter((p: any) => !p.isArchived);
      }

      const formatted = format.formatProjectList(projects, params.response_format);

      return {
        content: [{ type: "text", text: formatted }],
        structuredContent: params.response_format === ResponseFormat.JSON ? { projects } : undefined
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: formatError(error) }]
      };
    }
  }
);

// ============================================================================
// TOOL: codecks_list_milestones
// ============================================================================
server.registerTool(
  "codecks_list_milestones",
  {
    title: "List Codecks Milestones",
    description: `List all milestones in your Codecks account.

Retrieves all milestones (delivery date markers) from your Codecks organization.

Args:
  - response_format ('markdown' | 'json'): Output format (default: 'markdown')

Returns:
  List of milestones with their IDs, names, due dates, and descriptions.`,
    inputSchema: schemas.ListMilestonesSchema,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true
    }
  },
  async (params: schemas.ListMilestonesInput) => {
    try {
      const client = getClient();

      const milestoneSelection: Selection[] = [\"id\", \"name\", \"dueDate\", \"description\"];
      const accountSelection: Selection[] = [{ milestones: milestoneSelection }];
      validateSelection(schema, \"account\", accountSelection);

      const query = {
        _root: [
          {
            account: accountSelection
          }
        ]
      };

      const response = await client.query(query);
      const account = denormalizeRootRelation(schema, response as Record<string, any>, \"account\", accountSelection);
      const milestones = account?.milestones || [];

      const formatted = format.formatMilestoneList(milestones, params.response_format);

      return {
        content: [{ type: "text", text: formatted }],
        structuredContent: params.response_format === ResponseFormat.JSON ? { milestones } : undefined
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: formatError(error) }]
      };
    }
  }
);

// ============================================================================
// TOOL: codecks_get_milestone
// ============================================================================
server.registerTool(
  "codecks_get_milestone",
  {
    title: "Get Codecks Milestone",
    description: `Retrieve detailed information about a specific milestone.

Fetches milestone metadata including name, due date, description, project, and archival state.

Args:
  - milestone_id (string): The milestone ID to retrieve
  - response_format ('markdown' | 'json'): Output format (default: 'markdown')

Returns:
  Complete milestone details including fields and relationships.`,
    inputSchema: schemas.GetMilestoneSchema,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true
    }
  },
  async (params: schemas.GetMilestoneInput) => {
    try {
      const client = getClient();

      const milestoneSelection: Selection[] = [
        "id",
        "name",
        "dueDate",
        "description",
        "isArchived",
        { project: ["id", "name"] }
      ];

      const query = buildIdQuery(schema, "milestone", params.milestone_id, milestoneSelection);
      const response = await client.query(query);
      const milestone = denormalizeById(
        schema,
        response as Record<string, any>,
        "milestone",
        params.milestone_id,
        milestoneSelection
      );

      if (!milestone) {
        return {
          content: [
            { type: "text", text: `Error: Milestone with ID '${params.milestone_id}' not found.` }
          ]
        };
      }

      const formatted = format.formatMilestone(milestone, params.response_format);

      return {
        content: [{ type: "text", text: formatted }],
        structuredContent: params.response_format === ResponseFormat.JSON ? milestone : undefined
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: formatError(error) }]
      };
    }
  }
);

// ============================================================================
// TOOL: codecks_get_current_user
// ============================================================================
server.registerTool(
  "codecks_get_current_user",
  {
    title: "Get Current Codecks User",
    description: `Get information about the currently authenticated user.

Uses Codecks' read API to fetch the logged-in user (id, name) and (when available) their primary email via the userEmail model.

Args:
  - response_format ('markdown' | 'json'): Output format (default: 'markdown')

Returns:
  User information including id, name, and (if available) email.`,
    inputSchema: schemas.GetCurrentUserSchema,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true
    }
  },
  async (params: schemas.GetCurrentUserInput) => {
    try {
      const client = getClient();

      const userSelection: Selection[] = [
        \"id\",
        \"name\",
        { primaryEmail: [\"id\", \"email\", \"isPrimary\", \"isVerified\", \"userId\"] }
      ];

      const query = buildRootQuery(schema, \"loggedInUser\", userSelection);
      const response = await client.query(query);
      const user = denormalizeRootRelation(
        schema,
        response as Record<string, any>,
        \"loggedInUser\",
        userSelection
      );

      if (!user) {
        return {
          content: [{
            type: "text",
            text: "Error: Unable to retrieve current user information from Codecks. Please verify your token and subdomain, then retry."
          }]
        };
      }
      const emailObj = user.primaryEmail || null;

      const output = {
        id: user.id,
        name: user.name,
        ...(emailObj?.email ? { email: emailObj.email } : {}),
        ...(emailObj ? {
          email_is_primary: emailObj.isPrimary,
          email_is_verified: emailObj.isVerified
        } : {})
      };

      const formatted = params.response_format === ResponseFormat.JSON
        ? JSON.stringify(output, null, 2)
        : [
            "# Current User",
            "",
            `**ID**: ${output.id}`,
            `**Name**: ${output.name}`,
            ...(output.email ? [`**Email**: ${output.email}`] : ["**Email**: (not available)"])
          ].join("\n");

      return {
        content: [{ type: "text", text: formatted }],
        structuredContent: params.response_format === ResponseFormat.JSON ? output : undefined
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: formatError(error) }]
      };
    }
  }
);

// ============================================================================
// Transport Setup
// ============================================================================

async function runStdio() {
  const authToken = process.env.CODECKS_AUTH_TOKEN;
  const subdomain = process.env.CODECKS_ACCOUNT_SUBDOMAIN;

  if (!authToken || !subdomain) {
    console.error("ERROR: Required environment variables:");
    console.error("  - CODECKS_AUTH_TOKEN: Your Codecks API token");
    console.error("  - CODECKS_ACCOUNT_SUBDOMAIN: Your organization subdomain");
    process.exit(1);
  }

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Codecks MCP server running via stdio");
}

async function runHTTP() {
  const authToken = process.env.CODECKS_AUTH_TOKEN;
  const subdomain = process.env.CODECKS_ACCOUNT_SUBDOMAIN;

  if (!authToken || !subdomain) {
    console.error("ERROR: Required environment variables:");
    console.error("  - CODECKS_AUTH_TOKEN: Your Codecks API token");
    console.error("  - CODECKS_ACCOUNT_SUBDOMAIN: Your organization subdomain");
    process.exit(1);
  }

  const app = express();
  app.use(express.json());

  app.post('/mcp', async (req, res) => {
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true
    });
    res.on('close', () => transport.close());
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  });

  const port = parseInt(process.env.PORT || '3000');
  app.listen(port, () => {
    console.error(`Codecks MCP server running on http://localhost:${port}/mcp`);
  });
}

// Choose transport based on environment
const transport = process.env.TRANSPORT || 'stdio';
if (transport === 'http') {
  runHTTP().catch(error => {
    console.error("Server error:", error);
    process.exit(1);
  });
} else {
  runStdio().catch(error => {
    console.error("Server error:", error);
    process.exit(1);
  });
}
