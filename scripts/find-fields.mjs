#!/usr/bin/env node
import { CodecksClient } from '../dist/services/codecks-client.js';

const client = new CodecksClient(process.env.CODECKS_AUTH_TOKEN, process.env.CODECKS_ACCOUNT_SUBDOMAIN);

const modelName = process.argv[2];
if (!modelName) {
  console.error("Usage: node find-fields.mjs <model-name>");
  process.exit(1);
}

// A comprehensive list of common field names to try
const potentialFields = [
  'id', 'name', 'type', 'description', 'createdAt', 'lastUpdatedAt', 'accountSeq',
  'status', 'sprintStatus', 'visibility', 'goal', 'start', 'end', 'cardCount',
  'effortSum', 'completedAt', 'completedCardCount', 'completedEffortSum', 'cardId',
  'commentId', 'userId', 'projectId', 'deckId', 'milestoneId', 'isArchived'
];

console.log(`--- Testing fields for model: ${modelName} ---\n`);

async function findValidFields() {
  const workingFields = [];
  for (const field of potentialFields) {
    try {
      const query = { _root: [{ account: [{ [modelName]: [field] }] }] };
      const response = await client.query(query);

      // We only need to know that the query didn't throw a 500 error.
      // The content of the response doesn't matter for this check.
      console.log(`✓ ${field}`);
      workingFields.push(field);
    } catch (e) {
      // Suppress the error message for cleaner output, we only care about success
      // console.error(`✗ ${field}`);
    }
  }
  console.log(`\n--- Working fields for ${modelName}: ---\n`);
  console.log(workingFields.join(', '));
}

findValidFields();
