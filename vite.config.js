import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

function stalePwaRecovery() {
  return {
    name: 'stale-pwa-recovery',
    configureServer(server) {
      server.middlewares.use('/@vite-plugin-pwa/pwa-entry-point-loaded', (_request, response) => {
        response.setHeader('Content-Type', 'application/javascript');
        response.end("import '/src/main.tsx';");
      });
    },
  };
}

export default defineConfig({ plugins: [react(), stalePwaRecovery()] });
