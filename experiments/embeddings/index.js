import { embed, chat } from '../../lib/ollama.js';

import fs from "fs";

// -----------------------------
// 1. Load knowledge source
// -----------------------------

const essay = fs.readFileSync("./experiments/embeddings/essay.txt", "utf8");

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

const chunks = chunkText(essay);
console.log(chunks,"\n\n");
console.log(`Created ${chunks.length} chunks`);

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
// 5. Embed all essay chunks
// -----------------------------

const knowledgeBase = [];

for (const chunk of chunks) {
  const embedding = await createEmbedding(chunk);

  knowledgeBase.push({
    text: chunk,
    embedding,
  });
}

console.log("Knowledge base created");

// -----------------------------
// 6. Ask a question
// -----------------------------

const question = "What can AI systems do?";

const questionEmbedding = await createEmbedding(question);

// -----------------------------
// 7. Find most relevant chunk
// -----------------------------

const results = knowledgeBase
  .map((item) => ({
    text: item.text,
    score: cosineSimilarity(
      questionEmbedding,
      item.embedding
    ),
  }))
  .sort((a, b) => b.score - a.score);

const relevantChunk = results[0];
console.log(results,"\n\n");
console.log("\nRelevant knowledge:");
console.log(relevantChunk.text);
console.log("Similarity:", relevantChunk.score);

// -----------------------------
// 8. Ask the LLM using the
//    retrieved knowledge
// -----------------------------

const prompt = `
Answer the question using only the knowledge provided below.

Knowledge:
${relevantChunk.text}

Question:
${question}

If the answer cannot be found in the knowledge, say:
"I don't know based on the provided essay."
`;

const response = await chat(prompt);

console.log("\nAnswer:");
console.log(response);
