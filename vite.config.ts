import fs from 'fs';
import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const REMOTE_GLB_URL =
  'https://www.gstatic.com/aistudio/starter-apps/chaco-canyon/chaco_canyon.glb';

let cachedGlbBuffer: Buffer | null = null;
let inflightGlbPromise: Promise<Buffer> | null = null;

function fetchRemoteGlb(): Promise<Buffer> {
  if (cachedGlbBuffer) return Promise.resolve(cachedGlbBuffer);
  if (!inflightGlbPromise) {
    inflightGlbPromise = fetch(REMOTE_GLB_URL)
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`Failed to fetch remote GLB: HTTP ${res.status}`);
        }
        const ab = await res.arrayBuffer();
        cachedGlbBuffer = Buffer.from(ab);
        return cachedGlbBuffer;
      })
      .finally(() => {
        inflightGlbPromise = null;
      });
  }
  return inflightGlbPromise;
}

function createGlbProxyMiddleware() {
  return async (req: any, res: any, next: any) => {
    const reqPath = (req.url || '').split('?')[0];
    if (reqPath === '/chaco_canyon.glb' || reqPath.endsWith('/chaco_canyon.glb')) {
      try {
        const buf = await fetchRemoteGlb();
        res.statusCode = 200;
        res.setHeader('Content-Type', 'model/gltf-binary');
        res.setHeader('Content-Length', String(buf.length));
        res.setHeader('Cache-Control', 'public, max-age=604800');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.end(buf);
        return;
      } catch (err) {
        next(err);
        return;
      }
    }
    next();
  };
}

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'copy-chaco-runtime-assets',
      configureServer(server) {
        server.middlewares.use(createGlbProxyMiddleware());
      },
      configurePreviewServer(server) {
        server.middlewares.use(createGlbProxyMiddleware());
      },
      async closeBundle() {
        const outDir = path.resolve('dist');
        if (!fs.existsSync(outDir)) return;
        for (const file of ['chaco_canyon.glb', 'chaco_data.json']) {
          if (fs.existsSync(file)) {
            fs.copyFileSync(file, path.join(outDir, file));
          }
        }
        const outGlb = path.join(outDir, 'chaco_canyon.glb');
        if (!fs.existsSync(outGlb)) {
          try {
            const buf = await fetchRemoteGlb();
            fs.writeFileSync(outGlb, buf);
          } catch (err) {
            console.warn('Could not fetch remote GLB during build:', err);
          }
        }
        if (fs.existsSync('renders')) {
          fs.cpSync('renders', path.join(outDir, 'renders'), { recursive: true });
        }
      },
    },
  ],
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
});
