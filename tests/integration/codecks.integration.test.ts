import { describe, expect, it } from "vitest";
import { CodecksClient } from "../../src/services/codecks-client.js";

const authToken = process.env.CODECKS_AUTH_TOKEN;
const subdomain = process.env.CODECKS_ACCOUNT_SUBDOMAIN;
const runWriteTests = process.env.CODECKS_RUN_WRITE_TESTS === "1";

const maybeDescribe = authToken && subdomain ? describe : describe.skip;

maybeDescribe("codecks integration (read)", () => {
  const client = new CodecksClient(authToken as string, subdomain as string);

  it("fetches current user", async () => {
    const query = {
      _root: [
        {
          loggedInUser: ["id", "name"]
        }
      ]
    };

    const response: any = await client.query(query);
    const userId = response?._root?.loggedInUser;
    expect(userId).toBeTruthy();
  });

  it("reads account info", async () => {
    const query = {
      _root: [
        {
          account: ["id", "name", "subdomain"]
        }
      ]
    };

    const response: any = await client.query(query);
    const root = response?._root;
    const accountId = Array.isArray(root) ? root[0]?.account : root?.account;
    expect(accountId).toBeTruthy();
  });

  it("supports project-scoped deck filtering via client-side deck.project relation", async () => {
    const query = {
      _root: [
        {
          account: [
            {
              decks: ["id", "title", { project: ["id", "name"] }]
            }
          ]
        }
      ]
    };

    const response: any = await client.query(query);
    const root = response?._root;
    const accountId = Array.isArray(root) ? root[0]?.account : root?.account;
    const deckIds = accountId ? response?.account?.[accountId]?.decks || [] : [];
    expect(Array.isArray(deckIds)).toBe(true);

    if (deckIds.length === 0) {
      return;
    }

    const firstProjectId = response?.deck?.[deckIds[0]]?.project;
    expect(firstProjectId).toBeTruthy();

    const filteredDecks = deckIds.filter((deckId: string) => response?.deck?.[deckId]?.project === firstProjectId);
    expect(filteredDecks.length).toBeGreaterThan(0);
  });

  it("reads deck by ID using array syntax", async () => {
    const listQuery = {
      _root: [
        {
          account: [
            {
              decks: ["id", "title"]
            }
          ]
        }
      ]
    };
    const listResponse: any = await client.query(listQuery);
    const root = listResponse?._root;
    const accountId = Array.isArray(root) ? root[0]?.account : root?.account;
    const deckId = accountId ? listResponse?.account?.[accountId]?.decks?.[0] : undefined;

    if (!deckId) {
      return;
    }

    const getQuery = {
      [`deck(${JSON.stringify([deckId])})`]: ["id", "title", "deckType"]
    };
    const getResponse: any = await client.query(getQuery);
    expect(getResponse?.deck?.[deckId]?.id).toBe(deckId);
  });

  it("reads milestone by ID using array syntax", async () => {
    const listQuery = {
      _root: [
        {
          account: [
            {
              milestones: ["id", "name"]
            }
          ]
        }
      ]
    };
    const listResponse: any = await client.query(listQuery);
    const root = listResponse?._root;
    const accountId = Array.isArray(root) ? root[0]?.account : root?.account;
    const milestoneId = accountId ? listResponse?.account?.[accountId]?.milestones?.[0] : undefined;

    if (!milestoneId) {
      return;
    }

    const getQuery = {
      [`milestone(${JSON.stringify([milestoneId])})`]: ["id", "name", "description", "date"]
    };
    const getResponse: any = await client.query(getQuery);
    expect(getResponse?.milestone?.[milestoneId]?.id).toBe(milestoneId);
  });
});

const maybeDescribeWrite =
  authToken && subdomain && runWriteTests ? describe : describe.skip;

maybeDescribeWrite("codecks integration (write)", () => {
  const client = new CodecksClient(authToken as string, subdomain as string);

  it("creates and deletes a project", async () => {
    const name = `MCP Integration Test ${Date.now()}`;
    const createPayload = {
      name,
      fileId: null,
      defaultUserAccess: "everyone",
      templateId: "cdx/survival"
    };

    const created: any = await client.dispatch("projects/create", createPayload);

    const projectId =
      created?.projectId ||
      created?.id ||
      created?.payload?.id ||
      created?.payload?.projectId;

    expect(projectId).toBeTruthy();

    const deletePayload = {
      id: projectId,
      visibility: "deleted"
    };

    await client.dispatch("projects/setVisibility", deletePayload);
  });
});
