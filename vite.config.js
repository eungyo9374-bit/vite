import { defineConfig, loadEnv } from 'vite'
import pixabay from './api/pixabay.js'

// `npm run dev` 에서도 /api/pixabay 가 동작하도록 같은 핸들러를 개발 서버에 연결합니다.
// (배포 후에는 Vercel 이 api/ 폴더를 서버리스 함수로 실행합니다.)
function devApi(env) {
  return {
    name: 'dev-api-pixabay',
    configureServer(server) {
      server.middlewares.use('/api/pixabay', async (req, res) => {
        process.env.PIXABAY_API_KEY = env.PIXABAY_API_KEY || process.env.PIXABAY_API_KEY
        const u = new URL(req.url, 'http://localhost')
        const out = {
          status(c) { res.statusCode = c; return out },
          setHeader(k, v) { res.setHeader(k, v) },
          json(o) { res.setHeader('Content-Type', 'application/json; charset=utf-8'); res.end(JSON.stringify(o)) },
        }
        await pixabay({ query: Object.fromEntries(u.searchParams) }, out)
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return { plugins: [devApi(env)] }
})
