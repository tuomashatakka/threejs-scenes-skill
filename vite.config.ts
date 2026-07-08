// vite.config.ts
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { defineConfig } from 'vite'


const rootDir = fileURLToPath(new URL('.', import.meta.url))
const siteDir = resolve(rootDir, 'site')

export default defineConfig({
  root:      siteDir,
  base:      '/threejs-scenes-skill/',
  publicDir: 'public',
  build:     {
    outDir:     '../site-dist',
    emptyOutDir: true,
    rolldownOptions: {
      input: {
        main:    resolve(siteDir, 'index.html'),
        library: resolve(siteDir, 'library/index.html'),
        demos:   resolve(siteDir, 'demos/index.html'),
        skill:   resolve(siteDir, 'skill/index.html'),
        api:     resolve(siteDir, 'api/index.html'),
      },
    },
  },
})
