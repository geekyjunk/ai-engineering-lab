import dotenv from 'dotenv';
dotenv.config();

const API_URL = 'https://api.typesafe.ai/v1/systemone';
const DEFAULT_MODEL = 'jev-latest';

export async function callJev({ state, questions, model = DEFAULT_MODEL, apiKey = process.env.TEST_KEY }) {
  if (!apiKey) {
    throw new Error('TEST_KEY is not set in .env');
  }

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ state, model, questions }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Jev API error ${res.status}: ${err}`);
  }

  return res.json();
}
