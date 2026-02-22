#!/usr/bin/env node
import { CodecksClient } from '../dist/services/codecks-client.js';

const client = new CodecksClient(process.env.CODECKS_AUTH_TOKEN, process.env.CODECKS_ACCOUNT_SUBDOMAIN);

async function exploreActivities() {
  try {
    const projectsResponse = await client.query({ _root: [{ account: [{ projects: ['id'] }] }] });
    const firstProjectId = projectsResponse.project ? Object.keys(projectsResponse.project)[0] : null;

    if (!firstProjectId) {
      console.log("No projects found, can't query for activities.");
      return;
    }
    
    console.log(`--- Querying activities for project: ${firstProjectId} ---\n`);

    const activityQuery = {
      _root: [{
        account: [{
          [`activities({"projectId": "${firstProjectId}", "$limit": 5, "$order": "-createdAt"})`]: [
            'id', 'type', 'createdAt', 'cardId', 'commentId'
          ]
        }]
      }]
    };
    
    const response = await client.query(activityQuery);

    if (response.activity && Object.keys(response.activity).length > 0) {
      console.log('Found activities:', JSON.stringify(response.activity, null, 2));
    } else {
      console.log('Query successful, but no activities found for this project.');
    }
  } catch (e) {
    console.error('Failed to get activities:', e.message);
  }
}

exploreActivities();
