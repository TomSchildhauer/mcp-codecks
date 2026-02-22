#!/usr/bin/env node
import { CodecksClient } from '../dist/services/codecks-client.js';

const client = new CodecksClient(process.env.CODECKS_AUTH_TOKEN, process.env.CODECKS_ACCOUNT_SUBDOMAIN);

const sprintFields = [
  'id', 'name', 'sprintStatus', 'start', 'end', 'goal',
  'cardCount', 'effortSum', 'completedAt', 'completedCardCount', 'completedEffortSum'
];

console.log('--- Testing Sprint Fields ---\\n');

async function testSprintFields() {
  for (const field of sprintFields) {
    try {
      const query = { _root: [{ account: [{ sprints: [field] }] }] };
      const response = await client.query(query);

      // Check if any sprints were returned to confirm the field is usable
      if (response && response.sprint && Object.keys(response.sprint).length > 0) {
        console.log(`✓ ${field} (found ${Object.keys(response.sprint).length} sprints)`);
      } else if (response && !response.sprint) {
        console.log(`✓ ${field} (no sprints in response, but query succeeded)`);
      }
      else {
        console.log(`✓ ${field} (returned 0 sprints)`);
      }
    } catch (e) {
      console.error(`✗ ${field}`);
    }
  }
}

testSprintFields();
