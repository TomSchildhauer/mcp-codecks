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
