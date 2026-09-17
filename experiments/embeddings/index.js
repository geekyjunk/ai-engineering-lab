import { embed, chat } from '../../lib/ollama.js';
import fs from "fs";
import { PDFParse } from 'pdf-parse';

import { QdrantClient } from "@qdrant/js-client-rest";
const client = new QdrantClient({ host: "localhost", port: 6333 });

const COLLECTION = "essay_collection";
const VECTOR_SIZE = 768; // nomic-embed-text

async function ensureCollection() {
  try {
    const { config } = await client.getCollection(COLLECTION);
    if (config.params.vectors.size !== VECTOR_SIZE) {
      await client.deleteCollection(COLLECTION);
      await client.createCollection(COLLECTION, {
        vectors: { size: VECTOR_SIZE, distance: "Cosine" },
      });
    }
  } catch (e) {
    if (e.status === 404) {
      await client.createCollection(COLLECTION, {
        vectors: { size: VECTOR_SIZE, distance: "Cosine" },
      });
    } else {
      throw e;
    }
  }
}

async function upsertData() {
  const chunks = chunkText(essay);
  let id = 0;
  for (const chunk of chunks) {
    const embedding = await createEmbedding(chunk);
    await client.upsert(COLLECTION, {
      wait: true,
      points: [{ id: id++, vector: embedding, payload: { text: chunk } }],
    });
  }
}

// let searchResult = await client.query(
//   "essay_collection", {
//   query: [0.2, 0.1, 0.9, 0.7],
//   limit: 3
// });

// -----------------------------
// 1. Load knowledge source
// -----------------------------

async function convertPDFToText() {
  const parser = new PDFParse({ url: 'experiments/embeddings/essay.pdf' });

  const result = await parser.getText();
  return result.text;
}
await ensureCollection();
const essay = await convertPDFToText();
await upsertData();

// -----------------------------
// 2. Split essay into chunks
// -----------------------------

function chunkText(text, chunkSize = 300) {
  const chunks = [];

  for (let i = 0; i < text.length; i += chunkSize) {
    chunks.push(text.slice(i, i + chunkSize));
  }

  return chunks;
}

// -----------------------------
// 3. Create embeddings
// -----------------------------

async function createEmbedding(text) {
  const response = await embed(text);

  return response;
}

// -----------------------------
// 4. Cosine similarity
// -----------------------------

function cosineSimilarity(a, b) {
  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    magnitudeA += a[i] * a[i];
    magnitudeB += b[i] * b[i];
  }

  return (
    dotProduct /
    (Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB))
  );
}


// -----------------------------
// 6. Ask a question
// -----------------------------

const question = "What did Pablo Neruda say about prophetic dreams?";

const questionEmbedding = await createEmbedding(question);

// -----------------------------
// 7. Find most relevant chunk
// -----------------------------

const results = await client.query(COLLECTION, {
  query: questionEmbedding,
  limit: 3,
  with_payload: true,
});

const relevantChunk = results.points[0];

// -----------------------------
// 8. Ask the LLM using the
//    retrieved knowledge
// -----------------------------

const prompt = `
Answer the question using only the knowledge provided below.

Knowledge:
${relevantChunk.payload.text}

Question:
${question}

`;

const response = await chat(prompt);

console.log("\nAnswer:");
console.log(response);
