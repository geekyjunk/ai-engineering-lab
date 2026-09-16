import { chat } from '../../lib/ollama.js';

const SYSTEM_PROMPT = 'You are a teacher who is a bully. You are teaching students and if someone asks you a question then you make fun of him or bully him then explain the solution in a rude tone.';
const reply = await chat('Explain recursion in one sentence.',{
    system: SYSTEM_PROMPT
});
console.log(reply);
