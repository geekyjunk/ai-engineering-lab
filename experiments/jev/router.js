import { routeMessage } from '../../lib/router.js';

const SAMPLES = {
  incident: 'PAGERDUTY: error rate on /api/checkout spiked 400% — p99 latency 12s, rollback deploy #8821?',
  debug: `TypeError: Cannot read properties of undefined (reading 'id')
    at getUser (src/services/user.ts:42)
    at POST /api/users (src/routes/users.ts:18)`,
  code_review: '@you Can we extract this into a shared util instead of duplicating the retry logic in 3 places?',
  ci_cd: 'GitHub Actions: job "test" failed — 1 flaky test: auth.test.ts > should refresh token (timeout 5000ms)',
  implement: 'JIRA-441: Add rate limiting to POST /api/webhooks — 100 req/min per API key, return 429',
  defer: 'FYI: v2.4.0 shipped to prod this morning. Changelog in #releases.',
};

const args = process.argv.slice(2);
const key = args[0];
const message = SAMPLES[key] && args.length === 1
  ? SAMPLES[key]
  : args.join(' ') || SAMPLES.debug;

if (SAMPLES[key] && args.length === 1) {
  console.log(`Sample: ${key}\n`);
}

console.log('Input:', message);
console.log('---');

const { route, confidence, blocks_work, response } = await routeMessage(message);

console.log(`Route: ${route} (confidence: ${confidence})`);
console.log(`Blocks work: ${blocks_work ? 'yes' : 'no'}`);
console.log('---');
console.log(response);
