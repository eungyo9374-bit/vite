import './style.css'
import { supabase, configured } from './supabase.js'
import { searchImages } from './api.js'

const app = document.getElementById('app')

const CATS = [
  { id: 'all', label: '제주 전체', q: 'jeju island', emoji: '🏝️' },
  { id: 'hallasan', label: '한라산', q: 'hallasan mountain', emoji: '🏔️' },
  { id: 'sea', label: '제주 바다', q: 'jeju sea', emoji: '🌊' },
  { id: 'tangerine', label: '감귤', q: 'tangerine orchard', emoji: '🍊' },
  { id: 'haenyeo', label: '해녀', q: 'haenyeo diver', emoji: '🤿' },
  { id: 'harubang', label: '돌하르방', q: 'dol hareubang', emoji: '🗿' },
  { id: 'canola', label: '유채꽃', q: 'canola flower field', emoji: '🌼' },
  { id: 'oreum', label: '오름', q: 'jeju oreum', emoji: '⛰️' },
]

const state = {
  user: null,
  favs: [], // 내 보관함 (DB)
  favIds: new Set(),
  byId: new Map(), // 화면에 나온 이미지 정보
  gal: { cat: 'all', q: 'jeju island', input: '', page: 1, hits: [], total: 0, loading: false },
}

const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))

function toast(msg, type = 'info') {
  const el = document.createElement('div')
  el.className = `toast ${type}`
  el.textContent = msg
  document.body.appendChild(el)
  requestAnimationFrame(() => el.classList.add('show'))
  setTimeout(() => {
    el.classList.remove('show')
    setTimeout(() => el.remove(), 300)
  }, 2800)
}

const AUTH_ERRORS = {
  'Invalid login credentials': '이메일 또는 비밀번호가 올바르지 않아요.',
  'Email not confirmed': '이메일 인증이 아직 완료되지 않았어요. 받은 편지함을 확인해 주세요.',
  'User already registered': '이미 가입된 이메일이에요. 로그인해 주세요.',
}
const authMsg = (e) => {
  const m = e?.message || ''
  if (AUTH_ERRORS[m]) return AUTH_ERRORS[m]
  if (/Password should be at least/i.test(m)) return '비밀번호는 6자 이상이어야 해요.'
  if (/failed to fetch|network/i.test(m)) return '서버에 연결하지 못했어요. VITE_SUPABASE_URL 값을 확인해 주세요.'
  if (/rate limit/i.test(m)) return '요청이 너무 많아요. 잠시 후 다시 시도해 주세요.'
  return m || '문제가 생겼어요. 잠시 후 다시 시도해 주세요.'
}

const dbMsg = (e) => {
  const m = e?.message || ''
  if (e?.code === '42P01' || e?.code === 'PGRST205' || /schema cache|does not exist/i.test(m))
    return '보관함 테이블이 없어요. Supabase SQL Editor 에서 supabase/schema.sql 을 실행해 주세요.'
  if (e?.code === '42501' || /permission denied|row-level security/i.test(m))
    return '보관함 권한 오류예요. supabase/schema.sql 의 GRANT 와 정책(policy) 부분을 실행해 주세요.'
  return m || '보관함 처리 중 문제가 생겼어요.'
}

/* ---------------- 보관함 (Supabase DB) ---------------- */
async function loadFavs() {
  if (!state.user) {
    state.favs = []
    state.favIds = new Set()
    return
  }
  const { data, error } = await supabase.from('favorites').select('*').order('created_at', { ascending: false })
  if (error) {
    console.error('favorites select', error)
    toast(dbMsg(error), 'error')
    return
  }
  state.favs = data
  state.favIds = new Set(data.map((f) => Number(f.pixabay_id)))
}

async function toggleFav(img) {
  if (!configured) return toast('Supabase 환경변수를 먼저 설정해 주세요.', 'error')
  if (!state.user) {
    toast('로그인하면 마음에 드는 사진을 보관할 수 있어요 🍊')
    location.hash = '#/login'
    return
  }
  const id = Number(img.id)
  if (state.favIds.has(id)) {
    const { error } = await supabase.from('favorites').delete().eq('pixabay_id', id)
    if (error) return (console.error('favorites delete', error), toast(dbMsg(error), 'error'))
    state.favIds.delete(id)
    state.favs = state.favs.filter((f) => Number(f.pixabay_id) !== id)
    toast('보관함에서 뺐어요')
  } else {
    const row = {
      pixabay_id: id,
      image_url: img.webformatURL,
      large_url: img.largeImageURL,
      tags: img.tags,
      author: img.user,
      page_url: img.pageURL,
    }
    const { data, error } = await supabase.from('favorites').insert(row).select().single()
    if (error) return (console.error('favorites insert', error), toast(dbMsg(error), 'error'))
    state.favIds.add(id)
    state.favs.unshift(data)
    toast('보관함에 담았어요 ♥')
  }
  document.querySelectorAll(`[data-fav="${id}"]`).forEach((b) => b.classList.toggle('on', state.favIds.has(id)))
  if (currentRoute() === 'my') renderRoute()
}

/* ---------------- 공통 UI ---------------- */
function currentRoute() {
  return (location.hash.replace(/^#\/?/, '') || 'home').split('?')[0]
}

function headerHtml(route) {
  const u = state.user
  const nick = u?.user_metadata?.nickname || u?.email?.split('@')[0] || ''
  const link = (r, label) => `<a href="#/${r === 'home' ? '' : r}" class="${route === r ? 'on' : ''}">${label}</a>`
  return `
  <header class="top">
    <a class="logo" href="#/"><span>🍊</span> 제주나라</a>
    <nav>
      ${link('home', '홈')}${link('map', '3D 지도')}${link('gallery', '갤러리')}${link('my', '내 보관함')}
    </nav>
    <div class="auth">
      ${
        u
          ? `<span class="who">${esc(nick)} 님</span><button id="logout" class="btn ghost">로그아웃</button>`
          : `<a class="btn ghost" href="#/login">로그인</a><a class="btn" href="#/signup">회원가입</a>`
      }
    </div>
  </header>
  ${configured ? '' : '<div class="warn">⚠️ Supabase 환경변수(VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)가 없어 로그인 기능이 꺼져 있어요. README 의 설정 순서를 따라 주세요.</div>'}`
}

const footerHtml = `<footer class="foot">
  <p>🍊 제주나라 — 사진 출처 <a href="https://pixabay.com" target="_blank" rel="noopener">Pixabay</a> · 각 사진의 촬영자는 사진을 열면 볼 수 있어요.</p>
</footer>`

function cardHtml(h) {
  state.byId.set(Number(h.id), h)
  const on = state.favIds.has(Number(h.id))
  return `<figure class="card" data-id="${h.id}">
    <img loading="lazy" src="${esc(h.webformatURL)}" alt="${esc(h.tags)}" />
    <figcaption><span class="by">📷 ${esc(h.user)}</span>
      <button class="heart ${on ? 'on' : ''}" data-fav="${h.id}" aria-label="보관함에 담기">♥</button>
    </figcaption>
  </figure>`
}

function bindGrid(el) {
  el.addEventListener('click', (e) => {
    const card = e.target.closest('.card')
    if (!card) return
    const img = state.byId.get(Number(card.dataset.id))
    if (!img) return
    if (e.target.closest('.heart')) toggleFav(img)
    else openLightbox(img)
  })
}

function openLightbox(h) {
  const on = state.favIds.has(Number(h.id))
  const el = document.createElement('div')
  el.className = 'lightbox'
  el.innerHTML = `<div class="lb-box">
    <button class="lb-x" aria-label="닫기">✕</button>
    <img src="${esc(h.largeImageURL || h.webformatURL)}" alt="${esc(h.tags)}" />
    <div class="lb-info">
      <div><strong>${esc(h.tags)}</strong>
        <p>Image by <a href="${esc(h.pageURL)}" target="_blank" rel="noopener">${esc(h.user)}</a> from Pixabay</p></div>
      <button class="heart big ${on ? 'on' : ''}" data-fav="${h.id}">♥ 보관</button>
    </div></div>`
  const close = () => {
    el.remove()
    document.removeEventListener('keydown', onKey)
  }
  const onKey = (e) => e.key === 'Escape' && close()
  el.addEventListener('click', (e) => {
    if (e.target === el || e.target.closest('.lb-x')) close()
    else if (e.target.closest('.heart')) toggleFav(h)
  })
  document.addEventListener('keydown', onKey)
  document.body.appendChild(el)
}

/* ---------------- 페이지: 홈 ---------------- */
function pageHome(root) {
  root.innerHTML = `
  <section class="hero" id="hero">
    <div class="hero-in">
      <p class="kicker">JEJU ISLAND</p>
      <h1>바람, 바다, 그리고 감귤.<br />제주의 풍경을 모아 보세요</h1>
      <p class="lead">한라산부터 유채꽃밭까지, 마음에 드는 제주 사진을 내 보관함에 담아 둘 수 있어요.</p>
      <div class="cta">
        <a class="btn big" href="#/map">🗺️ 3D 지도 탐험</a>
        <a class="btn big ghost light" href="#/gallery">갤러리 둘러보기</a>
        ${state.user ? '<a class="btn big ghost light" href="#/my">내 보관함</a>' : '<a class="btn big ghost light" href="#/signup">무료 회원가입</a>'}
      </div>
    </div>
    <p class="credit" id="heroCredit"></p>
  </section>
  <section class="wrap">
    <h2 class="h2">테마로 둘러보기</h2>
    <div class="tiles" id="tiles">
      ${CATS.slice(1).map((c) => `<a class="tile" href="#/gallery?c=${c.id}" data-cat="${c.id}"><span class="t-emoji">${c.emoji}</span><span class="t-label">${c.label}</span></a>`).join('')}
    </div>
  </section>
  <section class="wrap feats">
    <div class="feat"><b>🗺️ 입체 제주 지도</b><p>한라산·오름·풍력발전기·등대·돌하르방을 돌려 보고 확대하며 둘러봐요.</p></div>
    <div class="feat"><b>🔐 안전한 회원 기능</b><p>Supabase 인증으로 이메일 회원가입과 로그인을 지원해요.</p></div>
    <div class="feat"><b>♥ 나만의 보관함</b><p>마음에 드는 사진을 담아 두면 언제든 다시 볼 수 있어요.</p></div>
    <div class="feat"><b>📷 Pixabay 사진</b><p>무료로 쓸 수 있는 고화질 사진을 실시간으로 불러와요.</p></div>
  </section>`

  searchImages('jeju island')
    .then((d) => {
      if (!d.hits.length) return
      const h = d.hits[new Date().getDate() % d.hits.length]
      const hero = document.getElementById('hero')
      if (!hero) return
      hero.style.backgroundImage = `linear-gradient(180deg,#0b2a3a99,#0b2a3acc),url("${h.largeImageURL || h.webformatURL}")`
      document.getElementById('heroCredit').innerHTML = `Photo by <a href="${esc(h.pageURL)}" target="_blank" rel="noopener">${esc(h.user)}</a> / Pixabay`
    })
    .catch(() => {})
}

/* ---------------- 페이지: 갤러리 ---------------- */
function pageGallery(root) {
  const g = state.gal
  const qs = new URLSearchParams(location.hash.split('?')[1] || '')
  const cparam = qs.get('c')
  if (cparam && cparam !== g.cat && CATS.some((c) => c.id === cparam)) {
    g.cat = cparam
    g.q = CATS.find((c) => c.id === cparam).q
    g.input = ''
    g.hits = []
    g.page = 1
  }
  root.innerHTML = `<section class="wrap">
    <h1 class="h1">제주 갤러리</h1>
    <p class="sub">사진을 누르면 크게 볼 수 있고, ♥ 를 누르면 내 보관함에 담겨요.</p>
    <form id="sf" class="search">
      <input name="q" placeholder="직접 검색해 보세요 (예: 한라산, 해녀, 성산일출봉)" value="${esc(g.input)}" />
      <button class="btn">검색</button>
    </form>
    <div class="chips">${CATS.map((c) => `<button class="chip ${g.cat === c.id ? 'on' : ''}" data-cat="${c.id}">${c.emoji} ${c.label}</button>`).join('')}</div>
    <div id="grid" class="grid"></div>
    <div id="msg" class="msg"></div>
    <div class="more"><button id="more" class="btn ghost" hidden>더 보기</button></div>
  </section>`

  const grid = root.querySelector('#grid')
  const msg = root.querySelector('#msg')
  const more = root.querySelector('#more')
  bindGrid(grid)

  const paint = (append) => {
    if (!append) grid.innerHTML = ''
    const start = append ? grid.children.length : 0
    grid.insertAdjacentHTML('beforeend', g.hits.slice(start).map(cardHtml).join(''))
    more.hidden = g.hits.length >= g.total || g.hits.length === 0
    msg.textContent = g.hits.length === 0 && !g.loading ? '검색 결과가 없어요. 다른 단어로 찾아볼까요?' : ''
  }
  const load = async (reset) => {
    if (g.loading) return
    g.loading = true
    msg.textContent = '불러오는 중…'
    more.hidden = true
    try {
      if (reset) { g.page = 1; g.hits = [] }
      else g.page += 1
      const d = await searchImages(g.q, g.page)
      g.total = d.totalHits
      g.hits = reset ? d.hits : g.hits.concat(d.hits)
      g.loading = false
      paint(!reset)
    } catch (e) {
      g.loading = false
      if (!reset) g.page -= 1
      msg.textContent = e.message
    }
  }

  root.querySelector('.chips').addEventListener('click', (e) => {
    const b = e.target.closest('.chip')
    if (!b) return
    const c = CATS.find((x) => x.id === b.dataset.cat)
    g.cat = c.id
    g.q = c.q
    g.input = ''
    root.querySelectorAll('.chip').forEach((x) => x.classList.toggle('on', x === b))
    root.querySelector('#sf input').value = ''
    load(true)
  })
  root.querySelector('#sf').addEventListener('submit', (e) => {
    e.preventDefault()
    const v = new FormData(e.target).get('q').toString().trim()
    if (!v) return
    g.input = v
    g.q = /jeju|제주/i.test(v) ? v : '제주 ' + v
    g.cat = ''
    root.querySelectorAll('.chip').forEach((x) => x.classList.remove('on'))
    load(true)
  })
  more.addEventListener('click', () => load(false))

  if (g.hits.length) paint(false)
  else load(true)
}

/* ---------------- 페이지: 로그인 / 회원가입 ---------------- */
function pageAuth(root, mode) {
  const signup = mode === 'signup'
  root.innerHTML = `<section class="auth-card">
    <h1>${signup ? '회원가입' : '로그인'}</h1>
    <p class="sub">${signup ? '가입하면 마음에 드는 제주 사진을 보관할 수 있어요.' : '다시 만나서 반가워요 🍊'}</p>
    <form id="af">
      ${signup ? '<label>닉네임<input name="nickname" maxlength="20" placeholder="예: 감귤왕" required /></label>' : ''}
      <label>이메일<input name="email" type="email" autocomplete="email" placeholder="you@example.com" required /></label>
      <label>비밀번호<input name="password" type="password" minlength="6" autocomplete="${signup ? 'new-password' : 'current-password'}" placeholder="6자 이상" required /></label>
      <button class="btn big full" ${configured ? '' : 'disabled'}>${signup ? '가입하기' : '로그인'}</button>
    </form>
    <p class="swap">${signup ? '이미 계정이 있나요? <a href="#/login">로그인</a>' : '처음이세요? <a href="#/signup">회원가입</a>'}</p>
  </section>`

  root.querySelector('#af').addEventListener('submit', async (e) => {
    e.preventDefault()
    const f = new FormData(e.target)
    const email = f.get('email').toString().trim()
    const password = f.get('password').toString()
    const btn = e.target.querySelector('button')
    btn.disabled = true
    try {
      if (signup) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { nickname: f.get('nickname').toString().trim() }, emailRedirectTo: location.origin },
        })
        if (error) throw error
        if (data.user && data.user.identities && data.user.identities.length === 0) {
          throw new Error('User already registered')
        }
        if (!data.session) {
          toast('인증 메일을 보냈어요. 메일의 링크를 누른 뒤 로그인해 주세요 ✉️')
          location.hash = '#/login'
        } else {
          toast('가입을 환영해요! 🎉')
          location.hash = '#/'
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        toast('로그인 되었어요 🍊')
        location.hash = '#/'
      }
    } catch (err) {
      toast(authMsg(err), 'error')
    } finally {
      btn.disabled = !configured
    }
  })
}

/* ---------------- 페이지: 내 보관함 (로그인 필요) ---------------- */
function pageMy(root) {
  if (!state.user) {
    toast('로그인이 필요한 페이지예요')
    location.hash = '#/login'
    return
  }
  const nick = state.user.user_metadata?.nickname || state.user.email
  root.innerHTML = `<section class="wrap">
    <h1 class="h1">${esc(nick)} 님의 보관함</h1>
    <p class="sub">${esc(state.user.email)} · 담아 둔 사진 ${state.favs.length}장</p>
    ${
      state.favs.length
        ? '<div id="grid" class="grid"></div>'
        : '<div class="empty">아직 담은 사진이 없어요.<br /><a class="btn" href="#/gallery">갤러리에서 찾아보기</a></div>'
    }
  </section>`
  const grid = root.querySelector('#grid')
  if (grid) {
    const items = state.favs.map((f) => ({
      id: Number(f.pixabay_id),
      webformatURL: f.image_url,
      largeImageURL: f.large_url,
      tags: f.tags,
      user: f.author,
      pageURL: f.page_url,
    }))
    grid.innerHTML = items.map(cardHtml).join('')
    bindGrid(grid)
  }
}

/* ---------------- 페이지: 3D 지도 ---------------- */
let mapToken = 0
let mapDispose = null
let visitorsCache = null
async function loadVisitors() {
  if (visitorsCache) return visitorsCache
  try {
    const r = await fetch('/api/visitors')
    if (!r.ok) return null
    visitorsCache = await r.json()
    return visitorsCache
  } catch {
    return null
  }
}
function pageMap(root) {
  const token = mapToken
  root.innerHTML = '<div class="map-boot">🍊 3D 지도를 불러오는 중…</div>'
  Promise.all([import('./map3d.js'), loadVisitors()])
    .then(async ([m, visitors]) => {
      if (token !== mapToken) return
      const dispose = await m.mountMap(root, { visitors })
      if (token !== mapToken) dispose()
      else mapDispose = dispose
    })
    .catch((e) => {
      console.error(e)
      if (token === mapToken) root.innerHTML = `<div class="map-boot">3D 지도를 열지 못했어요: ${esc(e.message)}<br>(WebGL 을 지원하는 브라우저인지 확인해 주세요)</div>`
    })
}

/* ---------------- 라우터 ---------------- */
function renderRoute() {
  const route = currentRoute()
  const root = document.getElementById('view')
  if (!root) return
  mapToken++
  if (mapDispose) { mapDispose(); mapDispose = null }
  window.scrollTo(0, 0)
  if (route === 'map') pageMap(root)
  else if (route === 'gallery') pageGallery(root)
  else if (route === 'login') pageAuth(root, 'login')
  else if (route === 'signup') pageAuth(root, 'signup')
  else if (route === 'my') pageMy(root)
  else pageHome(root)
}

function render() {
  const route = currentRoute()
  app.innerHTML = headerHtml(route) + '<main id="view"></main>' + footerHtml
  document.getElementById('logout')?.addEventListener('click', async () => {
    await supabase.auth.signOut()
    toast('로그아웃 되었어요')
    location.hash = '#/'
  })
  renderRoute()
}

async function init() {
  if (configured) {
    const { data } = await supabase.auth.getSession()
    state.user = data.session?.user ?? null
    await loadFavs()
    supabase.auth.onAuthStateChange((_event, session) => {
      const next = session?.user ?? null
      if (next?.id === state.user?.id) return
      state.user = next
      // 콜백 안에서 바로 supabase 호출을 기다리면 멈출 수 있어 다음 틱에 실행
      setTimeout(async () => {
        await loadFavs()
        render()
      }, 0)
    })
  }
  window.addEventListener('hashchange', () => {
    // 헤더의 활성 메뉴까지 갱신
    render()
  })
  render()
}

init()
