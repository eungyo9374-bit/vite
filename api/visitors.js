// Vercel Serverless Function: 공공데이터포털(odcloud) 관광지 월별 방문객 프록시
// 인증키를 브라우저에 노출하지 않으려고 서버에서만 호출합니다.
const ENDPOINT = 'https://api.odcloud.kr/api/15125100/v1/uddi:32a1b877-af20-4505-a76a-fd389ebd30ca'
const META = new Set(['기준연도', '기준월', '데이터기준일자'])

export default async function handler(req, res) {
  let key = process.env.ODCLOUD_SERVICE_KEY
  if (!key) {
    return res.status(500).json({ error: '서버에 ODCLOUD_SERVICE_KEY 환경변수가 설정되지 않았어요.' })
  }
  // Encoding 키(%2B 같은 형태)를 넣어도 동작하도록 한 번 풀어 둡니다.
  try { key = decodeURIComponent(key) } catch {}

  const params = new URLSearchParams({ page: '1', perPage: '100', returnType: 'JSON', serviceKey: key })
  try {
    const r = await fetch(`${ENDPOINT}?${params}`)
    if (!r.ok) return res.status(r.status).json({ error: `공공데이터 응답 오류 (${r.status})` })
    const j = await r.json()
    const rows = (j.data || [])
      .map((d) => ({
        year: Number(d['기준연도']),
        month: Number(d['기준월']),
        spots: Object.fromEntries(
          Object.entries(d)
            .filter(([k]) => !META.has(k))
            .map(([k, v]) => [k, Number(v) || 0]),
        ),
      }))
      .sort((a, b) => a.year - b.year || a.month - b.month)
    res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=3600')
    return res.status(200).json({ rows })
  } catch {
    return res.status(502).json({ error: '공공데이터포털에 연결하지 못했어요.' })
  }
}
