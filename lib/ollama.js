import ollama from 'ollama';

const DEFAULT_MODEL = 'llama3.2';

export async function chat(prompt, { model = DEFAULT_MODEL, system } = {}) {
  const messages = [];
  if (system) messages.push({ role: 'system', content: system });
  messages.push({ role: 'user', content: prompt });

  const { message } = await ollama.chat({ model, messages });
  return message.content;
}

export async function generate(prompt, { model = DEFAULT_MODEL } = {}) {
  const { response } = await ollama.generate({ model, prompt });
  return response;
}

export async function embed(text, { model = 'nomic-embed-text' } = {}) {
  const { embeddings } = await ollama.embed({ model, input: text });
  return embeddings[0];
}

export async function listModels() {
  const { models } = await ollama.list();
  return models.map((m) => m.name);
}
