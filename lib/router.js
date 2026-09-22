import { callJev } from './jev.js';
import { chat } from './ollama.js';

// Routes for things engineers paste into Slack, GitHub, PagerDuty, CI logs daily
const ROUTE_QUESTIONS = {
  route: {
    type: 'choice',
    instructions: 'What kind of engineering work does this input require?',
    criteria: {
      incident: 'Production alert, outage, elevated error rate, or on-call page',
      debug: 'Stack trace, failing test, reproducible bug, or local error to diagnose',
      code_review: 'PR feedback, review request, or question about a code change',
      ci_cd: 'Pipeline failure, flaky test in CI, deploy failure, or build break',
      implement: 'Feature ticket, refactor task, or scoped work with a clear deliverable',
      defer: 'FYI, changelog, standup note, or message needing no action',
    },
  },
  blocks_work: {
    type: 'noul',
    instructions: 'Does this block shipping, break production, or need same-day attention?',
  },
};

const HANDLERS = {
  incident: async (message, { blocks_work }) => ({
    route: 'incident',
    response: await chat(message, {
      system: `You are an on-call engineer triaging an incident.
${blocks_work ? 'This is blocking — prioritize immediate mitigation.' : 'Assess severity first.'}
Respond with:
1. Severity (P0–P3) and why
2. First 3 checks to run now
3. Likely root cause hypotheses
4. Mitigation vs proper fix (what to do in the next 30 min)`,
    }),
  }),

  debug: async (message) => ({
    route: 'debug',
    response: await chat(message, {
      system: `You are a senior engineer debugging an issue.
Respond with:
1. Most likely root cause
2. Where to look first (files, logs, configs)
3. Minimal reproduction steps if unclear
4. Suggested fix with trade-offs`,
    }),
  }),

  code_review: async (message) => ({
    route: 'code_review',
    response: await chat(message, {
      system: `You are reviewing a PR comment or review thread.
Respond with:
1. Summary of what the reviewer is asking
2. Whether to push back, accept, or discuss async
3. Draft reply (concise, professional)
4. Code changes needed, if any`,
    }),
  }),

  ci_cd: async (message) => ({
    route: 'ci_cd',
    response: await chat(message, {
      system: `You are fixing a CI/CD or deployment failure.
Respond with:
1. What failed and why (parse the log/error)
2. Is it infra, config, flaky test, or code regression?
3. Fix steps in order
4. How to prevent recurrence`,
    }),
  }),

  implement: async (message) => ({
    route: 'implement',
    response: await chat(message, {
      system: `You are planning a software engineering task.
Respond with:
1. Restated goal in one sentence
2. Files/modules likely touched
3. Implementation steps (ordered, small commits)
4. Edge cases and tests to write
5. What to clarify before starting`,
    }),
  }),

  defer: async (message) => ({
    route: 'defer',
    response: `No action needed. Tagged as FYI/informational.\n\n> ${message.slice(0, 120)}${message.length > 120 ? '...' : ''}`,
  }),
};

export async function routeMessage(message, { questions = ROUTE_QUESTIONS } = {}) {
  const { answers } = await callJev({ state: message, questions });

  const route = answers.route.choice;
  const confidence = answers.route.confidence;
  const blocks_work = answers.blocks_work.noul >= 0.7;
  const handler = HANDLERS[route];
  console.log(confidence);
  if (!handler) {
    throw new Error(`Unknown route: ${route}`);
  }

  const result = await handler(message, { blocks_work });

  return {
    ...result,
    confidence,
    blocks_work,
    decision: answers,
  };
}
