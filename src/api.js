// Pixabay 이미지 검색 (서버리스 프록시 /api/pixabay 사용)
export async function searchImages(q, page = 1) {
  const k = `px:${q}:${page}`
  try {
    const c = sessionStorage.getItem(k)
    if (c) return JSON.parse(c)
  } catch {}

  const r = await fetch(`/api/pixabay?q=${encodeURIComponent(q)}&page=${page}`)
  if (!r.ok) {
    let m = '이미지를 불러오지 못했어요.'
    try { m = (await r.json()).error || m } catch {}
    throw new Error(m)
  }
  const d = await r.json()
  try { sessionStorage.setItem(k, JSON.stringify(d)) } catch {}
  return d
}
