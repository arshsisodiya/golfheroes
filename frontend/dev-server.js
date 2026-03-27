import { createServer } from 'vite';
import path from 'path';

const DEFAULT_PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 5173;

async function start(port = DEFAULT_PORT) {
  try {
    const server = await createServer({
      root: process.cwd(),
      configFile: path.resolve(process.cwd(), 'vite.config.js'),
      server: { port, strictPort: false }
    });

    await server.listen();

    // try to read the actual bound port
    let boundPort = port;
    try {
      if (server.httpServer && server.httpServer.address) {
        const addr = server.httpServer.address();
        if (addr && typeof addr === 'object' && addr.port) boundPort = addr.port;
      } else if (server.config && server.config.server && server.config.server.port) {
        boundPort = server.config.server.port;
      }
    } catch (_) {
      // ignore
    }

    console.log(`Vite dev server running on port ${boundPort}`);
    if (typeof server.printUrls === 'function') server.printUrls();
  } catch (err) {
    console.error('Failed to start Vite dev server:', err);
    process.exit(1);
  }
}

start();
