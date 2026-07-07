// scripts/dev.ts
// A zero-dependency static file dev server using Bun's built-in Bun.serve.
// Serves the public/ showcase pages on port 5173.

import { serve } from 'bun'
import { join } from 'path'

const PORT = parseInt(process.env.PORT || '5173', 10)

const server = serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url)
    let path = url.pathname
    
    // Default to index.html for root
    if (path === '/') {
      path = '/index.html'
    }

    const filePath = join(process.cwd(), 'public', path)
    const file = Bun.file(filePath)
    
    if (await file.exists()) {
      return new Response(file)
    }
    
    return new Response('Not Found', { status: 404 })
  }
})

console.log(`\n✦ Dev server running at http://localhost:${server.port} ✧`)
console.log(`✿ Press Ctrl+C to stop ⚢\n`)
