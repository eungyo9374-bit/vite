// Vercel Serverless Function: Pixabay API 프록시
// API 키를 브라우저에 노출하지 않기 위해 서버에서만 호출합니다.
export default async function handler(req, res) {
  const key = process.env.PIXABAY_API_KEY
  if (!key) {
    return res.status(500).json({ error: '서버에 PIXABAY_API_KEY 환경변수가 설정되지 않았어요.' })
  }

  const q = String(req.query.q || 'jeju island').slice(0, 100)
  const page = Math.min(20, Math.max(1, parseInt(req.query.page, 10) || 1))
  const params = new URLSearchParams({
    key,
    q,
    image_type: 'photo',
    orientation: 'horizontal',
    safesearch: 'true',
    per_page: '24',
    page: String(page),
    order: 'popular',
  })
  if (/[가-힣]/.test(q)) params.set('lang', 'ko')

  try {
    const r = await fetch('https://pixabay.com/api/?' + params.toString())
    if (!r.ok) {
      return res.status(r.status).json({ error: `Pixabay 응답 오류 (${r.status})` })
    }
    const data = await r.json()
    // Pixabay 이용 약관상 결과는 24시간 캐시하는 것을 권장합니다.
    res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=3600')
    return res.status(200).json({
      totalHits: data.totalHits,
      hits: (data.hits || []).map((h) => ({
        id: h.id,
        tags: h.tags,
        webformatURL: h.webformatURL,
        largeImageURL: h.largeImageURL,
        user: h.user,
        pageURL: h.pageURL,
      })),
    })
  } catch (e) {
    return res.status(502).json({ error: 'Pixabay 에 연결하지 못했어요.' })
  }
}
