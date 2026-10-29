import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { PLACES, LAYERS } from './jejuData.js'

/* DEM(고도 격자)은 public/jeju_dem.bin : int16 534x407, 경도 126.0~127.1, 위도 33.0~33.7 (웹 메르카토르) */
const DEM_W = 534
const DEM_H = 407
const PX_KM = 0.19155 // DEM 한 칸의 실제 크기(km) → 1 scene unit = 1 km
const LON0 = 126.0, LON1 = 127.1, LAT0 = 33.0, LAT1 = 33.7
const VEX = 2.4 // 높이 과장 배율
const SX = DEM_W * PX_KM
const SZ = DEM_H * PX_KM
const mercY = (lat) => Math.asinh(Math.tan((lat * Math.PI) / 180))
const MY0 = mercY(LAT1)
const MY1 = mercY(LAT0)

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
const clamp = (v, a, b) => Math.max(a, Math.min(b, v))

export function ll(lat, lon) {
  const u = (lon - LON0) / (LON1 - LON0)
  const v = (MY0 - mercY(lat)) / (MY0 - MY1)
  return { x: (u - 0.5) * SX, z: (v - 0.5) * SZ }
}

/* ---------- 라벨(스프라이트) ---------- */
function makeLabel(text, color = '#e8590c', sub = '') {
  const c = document.createElement('canvas')
  const x = c.getContext('2d')
  const f1 = 'bold 44px "Noto Sans KR","Malgun Gothic",sans-serif'
  const f2 = '34px "Noto Sans KR","Malgun Gothic",sans-serif'
  x.font = f1
  const w1 = x.measureText(text).width
  let w2 = 0
  if (sub) { x.font = f2; w2 = x.measureText(sub).width }
  const pad = 22
  c.width = Math.ceil(Math.max(w1, w2) + pad * 2)
  c.height = sub ? 118 : 74
  x.fillStyle = 'rgba(255,255,255,.94)'
  x.strokeStyle = color
  x.lineWidth = 5
  x.beginPath()
  x.roundRect(3, 3, c.width - 6, c.height - 6, 22)
  x.fill()
  x.stroke()
  x.textAlign = 'center'
  x.textBaseline = 'middle'
  x.fillStyle = '#1f2a30'
  x.font = f1
  x.fillText(text, c.width / 2, sub ? 36 : c.height / 2 + 2)
  if (sub) {
    x.font = f2
    x.fillStyle = color
    x.fillText(sub, c.width / 2, 82)
  }
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false, depthWrite: false }))
  s.renderOrder = 20
  s.userData.aspect = c.width / c.height
  s.userData.base = 1.15
  s.scale.set(s.userData.base * s.userData.aspect, s.userData.base, 1)
  return s
}

/* ---------- 작은 3D 모형들 ---------- */
const M = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.7, ...extra })
const mesh = (geo, mat, x = 0, y = 0, z = 0) => {
  const m = new THREE.Mesh(geo, mat)
  m.position.set(x, y, z)
  return m
}

function buildTurbine(spin) {
  const g = new THREE.Group()
  g.add(mesh(new THREE.CylinderGeometry(0.05, 0.1, 1.6, 10), M('#f1f3f5'), 0, 0.8, 0))
  g.add(mesh(new THREE.BoxGeometry(0.16, 0.14, 0.34), M('#dee2e6'), 0, 1.62, 0.05))
  const rotor = new THREE.Group()
  rotor.position.set(0, 1.62, 0.26)
  for (let i = 0; i < 3; i++) {
    const b = new THREE.Group()
    b.rotation.z = (i * Math.PI * 2) / 3
    b.add(mesh(new THREE.BoxGeometry(0.07, 0.85, 0.02), M('#ffffff'), 0, 0.42, 0))
    rotor.add(b)
  }
  g.add(rotor)
  spin.push(rotor)
  return g
}

function buildLighthouse(glows) {
  const g = new THREE.Group()
  g.add(mesh(new THREE.CylinderGeometry(0.16, 0.26, 1.5, 14), M('#fff'), 0, 0.75, 0))
  g.add(mesh(new THREE.CylinderGeometry(0.2, 0.22, 0.28, 14), M('#e03131'), 0, 0.85, 0))
  g.add(mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.22, 14), M('#ffe066', { emissive: '#ffd43b', emissiveIntensity: 1.2 }), 0, 1.62, 0))
  g.add(mesh(new THREE.ConeGeometry(0.26, 0.3, 14), M('#e03131'), 0, 1.88, 0))
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ color: '#ffe066', transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.8 }))
  glow.scale.set(1.8, 1.8, 1)
  glow.position.y = 1.65
  g.add(glow)
  glows.push(glow)
  return g
}

function buildHarubang() {
  const g = new THREE.Group()
  const stone = M('#7b7b82', { roughness: 0.95 })
  g.add(mesh(new THREE.CapsuleGeometry(0.28, 0.5, 4, 12), stone, 0, 0.55, 0))
  g.add(mesh(new THREE.SphereGeometry(0.3, 16, 12), stone, 0, 1.2, 0))
  g.add(mesh(new THREE.CylinderGeometry(0.4, 0.42, 0.1, 18), M('#5f5f66', { roughness: 0.95 }), 0, 1.4, 0))
  g.add(mesh(new THREE.CylinderGeometry(0.22, 0.28, 0.2, 18), M('#5f5f66', { roughness: 0.95 }), 0, 1.54, 0))
  g.add(mesh(new THREE.SphereGeometry(0.05, 8, 6), M('#222'), -0.1, 1.22, 0.27))
  g.add(mesh(new THREE.SphereGeometry(0.05, 8, 6), M('#222'), 0.1, 1.22, 0.27))
  g.add(mesh(new THREE.BoxGeometry(0.14, 0.04, 0.05), M('#222'), 0, 1.1, 0.28))
  g.add(mesh(new THREE.SphereGeometry(0.12, 8, 6), stone, -0.2, 0.7, 0.28))
  g.add(mesh(new THREE.SphereGeometry(0.12, 8, 6), stone, 0.2, 0.62, 0.28))
  return g
}

function buildPort() {
  const g = new THREE.Group()
  g.add(mesh(new THREE.BoxGeometry(1.7, 0.1, 0.45), M('#8d6e63'), 0, 0.05, 0))
  g.add(mesh(new THREE.BoxGeometry(0.9, 0.2, 0.34), M('#f8f9fa'), 0.3, 0.2, 0.55))
  g.add(mesh(new THREE.BoxGeometry(0.9, 0.06, 0.36), M('#1971c2'), 0.3, 0.1, 0.55))
  g.add(mesh(new THREE.ConeGeometry(0.28, 0.8, 3), M('#ffffff'), 0.3, 0.68, 0.55))
  g.add(mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.8, 6), M('#555'), 0.3, 0.5, 0.55))
  g.add(mesh(new THREE.SphereGeometry(0.11, 10, 8), M('#e03131'), -0.7, 0.18, 0.1))
  return g
}

function buildOlle() {
  const g = new THREE.Group()
  g.add(mesh(new THREE.CylinderGeometry(0.04, 0.05, 1.3, 8), M('#8d6e63'), 0, 0.65, 0))
  g.add(mesh(new THREE.BoxGeometry(0.55, 0.14, 0.03), M('#1c7ed6'), 0.28, 1.15, 0))
  g.add(mesh(new THREE.BoxGeometry(0.55, 0.14, 0.03), M('#ff922b'), 0.28, 0.97, 0))
  g.add(mesh(new THREE.ConeGeometry(0.1, 0.18, 3), M('#1c7ed6'), 0.6, 1.15, 0).rotateZ(-Math.PI / 2))
  return g
}

function buildPeakPin(color, big) {
  const g = new THREE.Group()
  const s = big ? 1.5 : 1
  const pin = new THREE.Group()
  pin.add(mesh(new THREE.ConeGeometry(0.22 * s, 0.7 * s, 14).rotateX(Math.PI), M(color, { emissive: color, emissiveIntensity: 0.35 }), 0, 0.35 * s, 0))
  pin.add(mesh(new THREE.SphereGeometry(0.26 * s, 16, 12), M(color, { emissive: color, emissiveIntensity: 0.35 }), 0, 0.85 * s, 0))
  pin.add(mesh(new THREE.SphereGeometry(0.1 * s, 10, 8), M('#fff'), 0, 0.85 * s, 0.17 * s))
  pin.position.y = 0.5
  g.userData.pin = pin
  g.add(pin)
  return g
}

/* =============================================================
   mountMap : 3D 지도를 root 안에 만들고, 정리(dispose) 함수를 돌려줍니다.
   ============================================================= */
export async function mountMap(root, { visitors } = {}) {
  root.innerHTML = `
  <div class="map-shell">
    <div class="map-stage"></div>
    <div class="map-loading" id="mLoad">🍊 3D 제주 지도를 만들고 있어요…</div>
    <aside class="map-layers">
      <h3>무엇을 볼까요?</h3>
      <div id="mLayers"></div>
      <p class="hint">🖱 드래그: 회전 · 휠: 확대/축소 · 우클릭 드래그: 이동<br>📍 마커를 누르면 설명이 나와요</p>
    </aside>
    <div class="map-views" id="mViews">
      <button data-v="all">🏝️ 전체</button><button data-v="hallasan">🏔️ 한라산</button>
      <button data-v="east">🌅 성산·동부</button><button data-v="south">🍊 서귀포</button><button data-v="west">🌬️ 서부</button>
    </div>
    <section class="map-info" id="mInfo" hidden></section>
    <section class="map-visit" id="mVisit"></section>
  </div>`
  const $ = (s) => root.querySelector(s)
  const stage = $('.map-stage')

  /* ----- DEM 읽기 ----- */
  const buf = await (await fetch(import.meta.env.BASE_URL + 'jeju_dem.bin')).arrayBuffer()
  const dem = new Int16Array(buf)
  if (dem.length !== DEM_W * DEM_H) throw new Error('지형 데이터 크기가 맞지 않아요.')
  const elev = (m) => (m >= 0 ? (m / 1000) * VEX : (m / 1000) * VEX * 0.5)
  const heightAt = (x, z) => {
    const fx = clamp((x / SX + 0.5) * (DEM_W - 1), 0, DEM_W - 1.001)
    const fz = clamp((z / SZ + 0.5) * (DEM_H - 1), 0, DEM_H - 1.001)
    const x0 = Math.floor(fx), z0 = Math.floor(fz), tx = fx - x0, tz = fz - z0
    const h = (xx, zz) => dem[zz * DEM_W + xx]
    const m = h(x0, z0) * (1 - tx) * (1 - tz) + h(x0 + 1, z0) * tx * (1 - tz) + h(x0, z0 + 1) * (1 - tx) * tz + h(x0 + 1, z0 + 1) * tx * tz
    return { m, y: elev(m) }
  }
  const landY = (x, z) => Math.max(0.02, heightAt(x, z).y)

  /* ----- 렌더러 / 씬 ----- */
  const renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.05
  stage.appendChild(renderer.domElement)
  const scene = new THREE.Scene()
  const SKY = new THREE.Color('#bfe6f2')
  scene.background = SKY
  scene.fog = new THREE.Fog(SKY, 150, 420)
  const camera = new THREE.PerspectiveCamera(45, 1, 0.5, 1200)
  const sun = new THREE.DirectionalLight('#fff4e0', 2.4)
  sun.position.set(70, 90, 50)
  scene.add(sun, new THREE.HemisphereLight('#dff3ff', '#8a7a5a', 0.9))

  /* ----- 지형 ----- */
  const orchards = PLACES.filter((p) => p.layer === 'orchard').map((p) => ({ ...p, ...ll(p.lat, p.lon) }))
  const geo = new THREE.PlaneGeometry(SX, SZ, DEM_W - 1, DEM_H - 1)
  geo.rotateX(-Math.PI / 2)
  const pos = geo.attributes.position
  const col = new Float32Array(pos.count * 3)
  const C = (hex) => new THREE.Color(hex)
  const stops = [
    [-200, C('#2a7fae')], [-40, C('#3a9ec6')], [-3, C('#6cc6dc')], [1, C('#ecdca8')], [14, C('#9ccc65')],
    [120, C('#6aa84f')], [450, C('#3f8a3d')], [900, C('#5d6b46')], [1300, C('#7a7568')], [1750, C('#bdb7a9')], [1950, C('#e8e4da')],
  ]
  const tmp = new THREE.Color()
  const orchardTint = C('#c9d94f')
  for (let i = 0; i < pos.count; i++) {
    const m = dem[i]
    pos.setY(i, elev(m))
    let k = 0
    while (k < stops.length - 2 && m > stops[k + 1][0]) k++
    const [a, ca] = stops[k]
    const [b, cb] = stops[k + 1]
    tmp.copy(ca).lerp(cb, clamp((m - a) / (b - a), 0, 1))
    if (m > 8 && m < 420) {
      const x = pos.getX(i), z = pos.getZ(i)
      for (const o of orchards) {
        const d = Math.hypot(x - o.x, z - o.z)
        if (d < o.r) tmp.lerp(orchardTint, 0.65 * (1 - d / o.r))
      }
    }
    col[i * 3] = tmp.r; col[i * 3 + 1] = tmp.g; col[i * 3 + 2] = tmp.b
  }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3))
  geo.computeVertexNormals()
  const terrain = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, metalness: 0 }))
  scene.add(terrain)

  // 바다 (살짝 출렁이는 법선 맵)
  const nc = document.createElement('canvas')
  nc.width = nc.height = 128
  {
    const x = nc.getContext('2d'), img = x.createImageData(128, 128)
    const hf = (i, j) => Math.sin(i * 0.35) * 0.5 + Math.sin(j * 0.27 + 1.3) * 0.5 + Math.sin((i + j) * 0.18) * 0.4
    for (let j = 0; j < 128; j++) for (let i = 0; i < 128; i++) {
      const dx = hf(i + 1, j) - hf(i - 1, j), dy = hf(i, j + 1) - hf(i, j - 1)
      const n = new THREE.Vector3(-dx * 0.35, -dy * 0.35, 1).normalize()
      const o = (j * 128 + i) * 4
      img.data[o] = (n.x * 0.5 + 0.5) * 255; img.data[o + 1] = (n.y * 0.5 + 0.5) * 255; img.data[o + 2] = (n.z * 0.5 + 0.5) * 255; img.data[o + 3] = 255
    }
    x.putImageData(img, 0, 0)
  }
  const nTex = new THREE.CanvasTexture(nc)
  nTex.wrapS = nTex.wrapT = THREE.RepeatWrapping
  nTex.repeat.set(70, 70)
  const sea = new THREE.Mesh(
    new THREE.PlaneGeometry(SX * 6, SZ * 6).rotateX(-Math.PI / 2),
    new THREE.MeshStandardMaterial({ color: '#1b93bf', transparent: true, opacity: 0.8, roughness: 0.18, metalness: 0.05, normalMap: nTex, normalScale: new THREE.Vector2(0.5, 0.5) }),
  )
  sea.position.y = 0.01
  scene.add(sea)
  const deep = new THREE.Mesh(new THREE.PlaneGeometry(SX * 6, SZ * 6).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#0f5f86' }))
  deep.position.y = -0.7
  scene.add(deep)

  /* ----- 마커 ----- */
  const spin = [], glows = [], pins = [], labels = []
  const layerGroups = {}
  for (const k of Object.keys(LAYERS)) {
    layerGroups[k] = new THREE.Group()
    scene.add(layerGroups[k])
  }
  const pickables = []
  const byId = new Map()
  const placed = {}

  const bars = {} // key → { mesh, label, cur, target }
  const visitRows = visitors?.rows?.length ? visitors.rows : null
  let maxVisit = 1
  if (visitRows) for (const r of visitRows) for (const v of Object.values(r.spots)) maxVisit = Math.max(maxVisit, v)

  for (const p of PLACES) {
    const { x, z } = ll(p.lat, p.lon)
    const lay = LAYERS[p.layer]
    const group = new THREE.Group()
    const y = landY(x, z)
    group.position.set(x, y, z)
    let labelY = 2.7
    const info = { ...p, x, z, y, groupRef: group }
    byId.set(p.id, info)

    if (p.layer === 'peak') {
      const g = buildPeakPin(lay.color, p.big)
      group.add(g)
      pins.push(g.userData.pin)
      labelY = p.big ? 2.6 : 2.2
    } else if (p.layer === 'wind') {
      const offs = [[-0.9, -0.5], [0, 0.4], [0.9, -0.4], [1.8, 0.3], [-1.8, 0.35]]
      for (const [dx, dz] of offs) {
        const t = buildTurbine(spin)
        t.position.set(dx, landY(x + dx, z + dz) - y, dz)
        t.rotation.y = 0.3
        group.add(t)
      }
      labelY = 2.9
    } else if (p.layer === 'light') {
      group.add(buildLighthouse(glows))
      labelY = 2.8
    } else if (p.layer === 'harubang') {
      group.add(buildHarubang())
      labelY = 2.5
    } else if (p.layer === 'port') {
      group.add(buildPort())
      labelY = 1.9
    } else if (p.layer === 'olle') {
      group.add(buildOlle())
      labelY = 2.0
    } else if (p.layer === 'orchard') {
      // 나무 모양 인스턴스
      let seed = Math.floor(Math.abs(p.lat * 1000)) + 7
      const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
      const N = 170
      const crown = new THREE.InstancedMesh(new THREE.SphereGeometry(0.3, 10, 8), M('#3f9b3a'), N)
      const fruit = new THREE.InstancedMesh(new THREE.SphereGeometry(0.09, 6, 5), M('#ff8c00', { emissive: '#ff7a00', emissiveIntensity: 0.25 }), N * 3)
      const d = new THREE.Object3D()
      let n = 0, tries = 0
      while (n < N && tries++ < 4000) {
        const a = rnd() * 6.283, r = Math.sqrt(rnd()) * p.r
        const tx = x + Math.cos(a) * r, tz = z + Math.sin(a) * r
        const h = heightAt(tx, tz)
        if (h.m < 8 || h.m > 420) continue
        d.position.set(tx - x, h.y - y + 0.28, tz - z)
        d.scale.set(1, 0.85, 1)
        d.updateMatrix()
        crown.setMatrixAt(n, d.matrix)
        for (let f = 0; f < 3; f++) {
          const fa = rnd() * 6.283
          d.position.set(tx - x + Math.cos(fa) * 0.22, h.y - y + 0.3 + rnd() * 0.25, tz - z + Math.sin(fa) * 0.22)
          d.scale.setScalar(1)
          d.updateMatrix()
          fruit.setMatrixAt(n * 3 + f, d.matrix)
        }
        n++
      }
      crown.count = n
      fruit.count = n * 3
      group.add(crown, fruit)
      group.position.y = y
      labelY = 2.0
      // 선택/클릭용 투명 원판
      const hit = new THREE.Mesh(new THREE.CylinderGeometry(p.r, p.r, 0.6, 24), new THREE.MeshBasicMaterial({ visible: false }))
      hit.position.y = 0.3
      group.add(hit)
    } else if (p.layer === 'visit') {
      const barMat = new THREE.MeshStandardMaterial({ color: '#d6336c', roughness: 0.4, metalness: 0.1 })
      const geoB = new THREE.CylinderGeometry(0.45, 0.45, 1, 20)
      geoB.translate(0, 0.5, 0)
      const bar = new THREE.Mesh(geoB, barMat)
      bar.scale.y = 0.05
      group.add(bar)
      bars[p.key] = { mesh: bar, mat: barMat, cur: 0.05, target: 0.05, place: info, labelObj: null }
      labelY = 3
    }

    // 라벨
    const label = makeLabel(p.name, lay.color)
    label.position.y = labelY
    group.add(label)
    labels.push(label)
    info.label = label
    info.labelY = labelY
    if (p.layer === 'visit') bars[p.key].labelObj = label

    group.traverse((o) => {
      if (o.isMesh) {
        o.userData.placeId = p.id
        pickables.push(o)
      }
    })
    layerGroups[p.layer].add(group)
    placed[p.id] = group
  }
  // 투명 hit 메시도 pickable 이어야 하므로 raycast 대상을 따로 확보
  const raycaster = new THREE.Raycaster()

  /* ----- 선택 링 ----- */
  const ringMesh = new THREE.Mesh(new THREE.TorusGeometry(1, 0.07, 10, 48).rotateX(Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#ff8a1f', transparent: true, opacity: 0.9, depthTest: false }))
  ringMesh.renderOrder = 15
  ringMesh.visible = false
  scene.add(ringMesh)

  /* ----- 컨트롤 / 카메라 이동 ----- */
  const controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.08
  controls.minDistance = 6
  controls.maxDistance = 220
  controls.maxPolarAngle = 1.48
  controls.screenSpacePanning = false
  const hallasan = byId.get('hallasan')
  const VIEWS = {
    all: { p: [0, 58, 70], t: [0, 0, 3] },
    hallasan: { p: [hallasan.x + 2, 34, hallasan.z + 40], t: [hallasan.x, 3, hallasan.z] },
    east: { p: [byId.get('seongsan').x - 12, 26, byId.get('seongsan').z + 38], t: [byId.get('seongsan').x - 4, 0, byId.get('seongsan').z + 2] },
    south: { p: [byId.get('v-cheonjiyeon').x - 8, 30, byId.get('v-cheonjiyeon').z + 40], t: [byId.get('v-jusang').x + 10, 0, byId.get('v-jusang').z - 2] },
    west: { p: [byId.get('w-hangyeong').x + 22, 28, byId.get('w-hangyeong').z + 36], t: [byId.get('w-hangyeong').x + 12, 0, byId.get('w-hangyeong').z - 4] },
  }
  camera.position.set(...VIEWS.all.p)
  controls.target.set(...VIEWS.all.t)
  let fly = null
  const flyTo = (p, t, dur = 1.3) => {
    fly = { p0: camera.position.clone(), t0: controls.target.clone(), p1: new THREE.Vector3(...p), t1: new THREE.Vector3(...t), k: 0, dur }
  }
  $('#mViews').addEventListener('click', (e) => {
    const b = e.target.closest('button')
    if (b) { const v = VIEWS[b.dataset.v]; flyTo(v.p, v.t) }
  })

  /* ----- 레이어 토글 ----- */
  const layerList = $('#mLayers')
  const counts = {}
  for (const p of PLACES) counts[p.layer] = (counts[p.layer] || 0) + 1
  layerList.innerHTML = Object.entries(LAYERS)
    .map(([k, l]) => `<label class="lay"><input type="checkbox" data-l="${k}" checked /><span class="dot" style="background:${l.color}"></span>${l.emoji} ${l.label}<em>${counts[k] || 0}</em></label>`)
    .join('')
  layerList.addEventListener('change', (e) => {
    const k = e.target.dataset.l
    if (!k) return
    layerGroups[k].visible = e.target.checked
    if (k === 'visit') $('#mVisit').style.display = e.target.checked ? '' : 'none'
    if (selected && selected.layer === k && !e.target.checked) clearSelection()
  })

  /* ----- 선택 / 정보 카드 ----- */
  const infoEl = $('#mInfo')
  let selected = null
  function clearSelection() {
    selected = null
    ringMesh.visible = false
    infoEl.hidden = true
  }
  function chartSvg(key) {
    if (!visitRows) return ''
    const vals = visitRows.map((r) => r.spots[key] || 0)
    const mx = Math.max(...vals, 1)
    const bw = 100 / vals.length
    const cur = Number($('#mSlider')?.value || 0)
    return `<svg viewBox="0 0 100 40" class="spark" preserveAspectRatio="none">${vals
      .map((v, i) => `<rect x="${(i * bw + 0.5).toFixed(2)}" y="${(40 - (v / mx) * 38).toFixed(2)}" width="${(bw - 1).toFixed(2)}" height="${((v / mx) * 38).toFixed(2)}" rx="1" fill="${i === cur ? '#d6336c' : '#f3a6c0'}"/>`)
      .join('')}</svg>
      <p class="cap">${visitRows[0].year}.${visitRows[0].month} ~ ${visitRows.at(-1).year}.${visitRows.at(-1).month} 월별 방문객 수 (막대가 진한 달 = 현재 선택)</p>`
  }
  function select(p, fly = true) {
    selected = p
    const lay = LAYERS[p.layer]
    infoEl.hidden = false
    infoEl.innerHTML = `<button class="x" aria-label="닫기">✕</button>
      <span class="badge" style="background:${lay.color}">${lay.emoji} ${lay.label}</span>
      <h3>${esc(p.name)}</h3><p>${esc(p.desc)}</p>
      ${p.layer === 'visit' ? chartSvg(p.key) : ''}
      <p class="note">※ 위치는 감상용으로 표시한 대략적인 곳이에요.</p>`
    infoEl.querySelector('.x').onclick = clearSelection
    ringMesh.visible = true
    ringMesh.position.set(p.x, p.y + 0.15, p.z)
    const r = p.layer === 'orchard' ? p.r : 1.6
    ringMesh.scale.set(r, 1, r)
    if (!fly) return
    const dist = p.layer === 'orchard' ? 30 : 16
    flyTo([p.x + dist * 0.35, p.y + dist * 0.8, p.z + dist], [p.x, p.y + 1, p.z], 1.1)
  }

  let downAt = null
  const dom = renderer.domElement
  const ndc = (e) => {
    const r = dom.getBoundingClientRect()
    return new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1)
  }
  const pick = (e) => {
    raycaster.setFromCamera(ndc(e), camera)
    const hits = raycaster.intersectObjects(pickables.filter((o) => o.parent && isVisible(o)), false)
    return hits.length ? byId.get(hits[0].object.userData.placeId) : null
  }
  const isVisible = (o) => {
    for (let n = o; n; n = n.parent) if (!n.visible) return false
    return true
  }
  const onDown = (e) => { downAt = [e.clientX, e.clientY] }
  const onUp = (e) => {
    if (!downAt) return
    const moved = Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1])
    downAt = null
    if (moved > 5) return
    const p = pick(e)
    if (p) select(p)
  }
  let hoverT = 0
  const onMove = (e) => {
    const now = performance.now()
    if (now - hoverT < 60) return
    hoverT = now
    dom.style.cursor = pick(e) ? 'pointer' : 'grab'
  }
  dom.addEventListener('pointerdown', onDown)
  dom.addEventListener('pointerup', onUp)
  dom.addEventListener('pointermove', onMove)

  /* ----- 방문객 패널 (공공데이터 API) ----- */
  const visitEl = $('#mVisit')
  let monthIdx = visitRows ? visitRows.length - 1 : 0
  let playing = false
  let playTimer = null
  function setMonth(i) {
    if (!visitRows) return
    monthIdx = i
    const row = visitRows[i]
    for (const [key, b] of Object.entries(bars)) {
      const v = row.spots[key] ?? 0
      b.target = Math.max(0.05, (v / maxVisit) * 9)
      b.value = v
      const t = v / maxVisit
      b.mat.color.setHSL(0.36 * (1 - clamp(t * 1.15, 0, 1)), 0.75, 0.5)
      const nl = makeLabel(`${b.place.name}`, LAYERS.visit.color, `${v.toLocaleString()}명`)
      nl.position.copy(b.place.label.position)
      b.place.groupRef.remove(b.place.label)
      b.place.label.material.map.dispose()
      b.place.label.material.dispose()
      labels.splice(labels.indexOf(b.place.label), 1)
      b.place.label = nl
      b.labelObj = nl
      labels.push(nl)
      b.place.groupRef.add(nl)
    }
    const rank = Object.entries(row.spots).sort((a, b) => b[1] - a[1])
    const nameOf = (k) => PLACES.find((p) => p.key === k)?.name || k
    const total = rank.reduce((s, [, v]) => s + v, 0)
    visitEl.querySelector('#mMonth').textContent = `${row.year}년 ${row.month}월`
    visitEl.querySelector('#mRank').innerHTML = rank
      .map(([k, v], n) => `<li><span class="n">${n + 1}</span><span class="nm">${esc(nameOf(k))}</span><span class="bar"><i style="width:${(v / (rank[0][1] || 1)) * 100}%"></i></span><b>${v.toLocaleString()}</b></li>`)
      .join('')
    visitEl.querySelector('#mTotal').textContent = `${total.toLocaleString()}명`
    if (selected?.layer === 'visit') select(selected, false)
    visitEl.querySelector('#mSlider').value = i
  }
  if (visitRows) {
    visitEl.innerHTML = `<div class="vh"><b>📊 월별 방문객 (서귀포 관광지 6곳)</b><button id="mPlay" class="mini">▶ 재생</button></div>
      <div class="vm"><span id="mMonth"></span><span>합계 <b id="mTotal"></b></span></div>
      <input id="mSlider" type="range" min="0" max="${visitRows.length - 1}" value="${monthIdx}" />
      <ol id="mRank"></ol>
      <p class="src">출처: 공공데이터포털 (제주 관광지 월별 방문객)</p>`
    visitEl.querySelector('#mSlider').addEventListener('input', (e) => { stopPlay(); setMonth(Number(e.target.value)) })
    visitEl.querySelector('#mPlay').addEventListener('click', () => (playing ? stopPlay() : startPlay()))
    setMonth(monthIdx)
    for (const b of Object.values(bars)) b.cur = b.target
  } else {
    visitEl.innerHTML = `<div class="vh"><b>📊 월별 방문객</b></div><p class="src">방문객 데이터를 불러오지 못했어요.<br>Vercel 환경변수 <code>ODCLOUD_SERVICE_KEY</code> 를 확인해 주세요.</p>`
  }
  function startPlay() {
    playing = true
    const b = visitEl.querySelector('#mPlay')
    if (b) b.textContent = '⏸ 멈춤'
    if (monthIdx >= visitRows.length - 1) setMonth(0)
    playTimer = setInterval(() => {
      if (monthIdx >= visitRows.length - 1) return stopPlay()
      setMonth(monthIdx + 1)
    }, 1100)
  }
  function stopPlay() {
    playing = false
    clearInterval(playTimer)
    const b = visitEl.querySelector('#mPlay')
    if (b) b.textContent = '▶ 재생'
  }

  /* ----- 리사이즈 / 루프 ----- */
  const resize = () => {
    const w = stage.clientWidth || 800, h = stage.clientHeight || 500
    renderer.setSize(w, h)
    camera.aspect = w / h
    camera.updateProjectionMatrix()
  }
  const ro = new ResizeObserver(resize)
  ro.observe(stage)
  resize()

  const clock = new THREE.Clock()
  let raf = 0
  let disposed = false
  const loop = () => {
    if (disposed) return
    raf = requestAnimationFrame(loop)
    const dt = Math.min(0.05, clock.getDelta())
    const t = clock.elapsedTime

    if (fly) {
      fly.k = Math.min(1, fly.k + dt / fly.dur)
      const e = fly.k * fly.k * (3 - 2 * fly.k)
      camera.position.lerpVectors(fly.p0, fly.p1, e)
      controls.target.lerpVectors(fly.t0, fly.t1, e)
      if (fly.k >= 1) fly = null
    }
    controls.update()

    nTex.offset.x = t * 0.004
    nTex.offset.y = t * 0.0025
    for (const r of spin) r.rotation.z -= dt * 1.6
    glows.forEach((g, i) => { g.material.opacity = 0.45 + 0.4 * Math.abs(Math.sin(t * 2 + i)) })
    pins.forEach((p, i) => { p.position.y = 0.5 + Math.sin(t * 2 + i) * 0.12; p.rotation.y = t * 0.8 + i })
    for (const b of Object.values(bars)) {
      b.cur += (b.target - b.cur) * 0.1
      b.mesh.scale.y = b.cur
      if (b.labelObj) b.labelObj.position.y = b.cur + 1.6
    }
    if (ringMesh.visible) {
      const s = 1 + Math.sin(t * 4) * 0.06
      ringMesh.scale.x = ringMesh.scale.z = (selected?.layer === 'orchard' ? selected.r : 1.6) * s
    }
    // 멀리서도 읽히도록 라벨 크기를 거리에 맞춰 조절
    const dist = camera.position.distanceTo(controls.target)
    const k = clamp(dist / 55, 0.5, 1.9)
    for (const l of labels) {
      const b = l.userData.base * k
      l.scale.set(b * l.userData.aspect, b, 1)
    }
    renderer.render(scene, camera)
  }
  loop()
  $('#mLoad').remove()

  window.__map = { camera, controls, select, byId, flyTo, setMonth }

  return () => {
    disposed = true
    cancelAnimationFrame(raf)
    clearInterval(playTimer)
    ro.disconnect()
    dom.removeEventListener('pointerdown', onDown)
    dom.removeEventListener('pointerup', onUp)
    dom.removeEventListener('pointermove', onMove)
    controls.dispose()
    scene.traverse((o) => {
      if (o.geometry) o.geometry.dispose()
      if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => { m.map?.dispose?.(); m.dispose() })
    })
    renderer.dispose()
    renderer.forceContextLoss()
    delete window.__map
  }
}
