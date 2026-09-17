import { createApp } from './app.js';
import { loadConfig } from './config.js';
const config = loadConfig();
const port = Number(process.env.PORT || 3000);
const host = process.env.HOST || '127.0.0.1';
const server = createApp(config).listen(port, host, () => {
  console.log(`Backend praktikum aktif di http://${host}:${port}`);
  console.log('POST /login | GET /protected-data');
});
server.on('error', error => { console.error(error.message); process.exitCode = 1; });
