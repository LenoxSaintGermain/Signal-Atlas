#!/usr/bin/env node
/**
 * Verify that ElevenLabs agent has all Ghost tools registered.
 *
 * Usage:
 *   ELEVENLABS_API_KEY=<key> ELEVENLABS_AGENT_ID=<id> node scripts/verify_elevenlabs_tools.mjs
 *
 * Or source from .env:
 *   source .env && node scripts/verify_elevenlabs_tools.mjs
 */

const apiKey = process.env.ELEVENLABS_API_KEY;
const agentId = process.env.ELEVENLABS_AGENT_ID;

if (!apiKey || !agentId) {
  console.error('Missing ELEVENLABS_API_KEY or ELEVENLABS_AGENT_ID');
  process.exit(1);
}

const EXPECTED_CLIENT_TOOLS = [
  'navigate_module',
  'close_module',
  'toggle_admin',
  'dispatch_agent',
  'update_stance',
  'address_gap',
];

const EXPECTED_SERVER_TOOLS = [
  'fetch_briefing',
  'fetch_artifact',
  'fetch_drive_documents',
];

async function verify() {
  const url = `https://api.elevenlabs.io/v1/convai/agents/${agentId}`;
  const res = await fetch(url, {
    headers: { 'xi-api-key': apiKey },
  });

  if (!res.ok) {
    console.error(`API error: ${res.status} ${res.statusText}`);
    const text = await res.text();
    console.error(text);
    process.exit(1);
  }

  const agent = await res.json();
  const tools = agent.prompt?.tools || agent.tools || [];
  const toolNames = tools.map((t) => t.name);

  console.log('\n=== Ghost Tool Verification ===\n');
  console.log(`Agent: ${agent.name || agentId}`);
  console.log(`Tools found: ${toolNames.length}\n`);

  let allGood = true;

  console.log('CLIENT TOOLS:');
  for (const name of EXPECTED_CLIENT_TOOLS) {
    const found = toolNames.includes(name);
    const icon = found ? '\u2713' : '\u2717';
    console.log(`  ${icon} ${name}`);
    if (!found) allGood = false;
  }

  console.log('\nSERVER TOOLS:');
  for (const name of EXPECTED_SERVER_TOOLS) {
    const found = toolNames.includes(name);
    const icon = found ? '\u2713' : '\u2717';
    console.log(`  ${icon} ${name}`);
    if (!found) allGood = false;
  }

  console.log('');
  if (allGood) {
    console.log('All tools registered. Ghost is armed.\n');
  } else {
    console.log('MISSING TOOLS. Follow the dashboard setup guide to add them.\n');
    process.exit(1);
  }
}

verify().catch((err) => {
  console.error('Verification failed:', err.message);
  process.exit(1);
});
