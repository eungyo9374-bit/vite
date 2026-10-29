import { defineConfig, loadEnv } from 'vite'
import pixabay from './api/pixabay.js'
import visitors from './api/visitors.js'

// `npm run dev` 에서도 /api/* 가 동작하도록 같은 핸들러를 개발 서버에 연결합니다.
// (배포 후에는 Vercel 이 api/ 폴더를 서버리스 함수로 실행합니다.)
const ROUTES = { '/api/pixabay': pixabay, '/api/visitors': visitors }

function devApi(env) {
  return {
    name: 'dev-api',
    configureServer(server) {
      for (const [path, handler] of Object.entries(ROUTES)) {
        server.middlewares.use(path, async (req, res) => {
          for (const k of ['PIXABAY_API_KEY', 'ODCLOUD_SERVICE_KEY']) {
            if (env[k]) process.env[k] = env[k]
          }
          const u = new URL(req.url, 'http://localhost')
          const out = {
            status(c) { res.statusCode = c; return out },
            setHeader(k, v) { res.setHeader(k, v) },
            json(o) { res.setHeader('Content-Type', 'application/json; charset=utf-8'); res.end(JSON.stringify(o)) },
          }
          await handler({ query: Object.fromEntries(u.searchParams) }, out)
        })
      }
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return { plugins: [devApi(env)] }
})
