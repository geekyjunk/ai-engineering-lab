import { generate } from '../../lib/ollama.js';

const text = await generate('Write a haiku about coding.');
console.log(text);
