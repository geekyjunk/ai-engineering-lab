import { embed } from '../../lib/ollama.js';

const vector = await embed('Hello, world!');
console.log(`Dimensions: ${vector.length}`);
console.log(vector.slice(0, 5), '...');
