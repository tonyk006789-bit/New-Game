import { createApi } from './app.js';
const app = await createApi();
const port=Number(process.env.PORT||3000);
await app.listen(port, '127.0.0.1');
console.log(`Arcade API: http://127.0.0.1:${port}/v1/health`);
