import { defineConfig, type Plugin } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';
import { createHash } from 'node:crypto';

/** Emits a precache SW after Vite writes all assets, avoiding hard-coded hashes. */
function offlinePrecache(): Plugin {
  return { name: 'metamodel-offline-precache', apply: 'build', async closeBundle() {
    const root = join(process.cwd(), 'dist');
    const files: string[] = [];
    async function collect(dir: string): Promise<void> {
      for (const entry of await readdir(dir, { withFileTypes: true })) {
        const full = join(dir, entry.name);
        if (entry.isDirectory()) await collect(full);
        else if (entry.isFile() && !['sw.js'].includes(entry.name)) files.push(relative(root, full).split(sep).join('/'));
      }
    }
    await collect(root);
    files.sort();
    const hash = createHash('sha256');
    for (const file of files) { hash.update(file); hash.update(await readFile(join(root, file))); }
    const revision = hash.digest('hex').slice(0, 16);
    const source = await readFile(join(process.cwd(), 'src/pwa/sw-template.js'), 'utf8');
    await writeFile(join(root, 'sw.js'), source.replace('__CACHE_VERSION__', revision).replace('__PRECACHE_FILES__', JSON.stringify(files)));
  }};
}
export default defineConfig({ plugins: [react(), offlinePrecache()], test: { environment: 'jsdom', include: ['src/**/*.test.ts', 'src/**/*.test.tsx'] } });
