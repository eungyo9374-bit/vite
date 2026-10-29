# 🍊 제주나라 (Vite + Supabase + Pixabay + Vercel)

제주 풍경 사진을 모아 보고, 회원가입/로그인 후 마음에 드는 사진을 **내 보관함**에 담는 사이트입니다.

| 기능 | 사용 기술 |
|---|---|
| 프런트엔드 | Vite (바닐라 JS) |
| 회원가입 · 로그인 · 보관함 DB | Supabase Auth + Postgres(RLS) |
| 제주 사진 | Pixabay API (Vercel 서버리스 함수 `api/pixabay.js` 로 키 보호) |
| 배포 | GitHub → Vercel |

## 3D 지도 (`#/map`)
three.js 로 만든 입체 제주 지도입니다. 한라산·오름, 풍력발전기, 등대, 돌하르방, 항·포구, 올레길, 감귤 재배지를 켜고 끌 수 있고,
서귀포 관광지 6곳의 월별 방문객(공공데이터포털 API)을 3D 막대로 보여 줍니다. 지형은 `public/jeju_dem.bin`(AWS Terrain Tiles 기반 고도 격자)입니다.
마커 좌표는 감상용 대략 위치이며 `src/jejuData.js` 에서 고칠 수 있어요.

## 환경변수 4개

| 이름 | 어디서 얻나 | 노출 범위 | 쓰이는 곳 |
|---|---|---|---|
| `VITE_SUPABASE_URL` | Supabase 프로젝트 URL | 브라우저 (공개 가능) | `src/supabase.js` |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon(publishable) 키 | 브라우저 (공개 가능, RLS 로 보호) | `src/supabase.js` |
| `PIXABAY_API_KEY` | Pixabay API 키 | **서버만** (`VITE_` 를 붙이지 마세요) | `api/pixabay.js` |

| `ODCLOUD_SERVICE_KEY` | 공공데이터포털 마이페이지 → 개발계정 상세 → 일반 인증키(**Decoding**) | **서버만** | `api/visitors.js` (3D 지도의 월별 방문객) |

> `service_role` 키는 절대 사용하지도, 넣지도 마세요.

## 설정 순서

### 1. Node.js 설치
https://nodejs.org 에서 LTS 설치 → 새 터미널에서 `node -v`, `npm -v` 확인.

### 2. Supabase
1. 대시보드 상단 **Connect** 버튼 또는 **Project Settings → API** 에서
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public (또는 publishable) key** → `VITE_SUPABASE_ANON_KEY`
2. 왼쪽 **SQL Editor → New query** 에 `supabase/schema.sql` 내용을 붙여넣고 **Run** (favorites 테이블 + RLS 생성).
3. **Authentication → Providers → Email** 이 켜져 있는지 확인.
   - 개발 중 메일 인증이 번거로우면 **Confirm email** 을 잠시 끄세요. (켜 두면 가입 후 메일 링크를 눌러야 로그인됩니다.)

### 3. Pixabay
https://pixabay.com 가입/로그인 → https://pixabay.com/api/docs/ 페이지의 **Your API key** 를 복사 → `PIXABAY_API_KEY`.

### 4. 내 PC 에서 실행
```bash
cd jeju-site
npm install
copy .env.example .env      # macOS/Linux: cp .env.example .env
# .env 를 열어 위 3개 값을 채운 뒤
npm run dev
```
http://localhost:5173 에서 확인합니다. (개발 서버가 `/api/pixabay` 도 같이 처리합니다.)

### 5. GitHub 에 올리기
GitHub 에서 **빈 저장소**(README/.gitignore 추가 없이)를 만든 뒤:
```bash
git remote add origin https://github.com/<내아이디>/<저장소이름>.git
git push -u origin main
```
`.env` 는 `.gitignore` 에 들어 있어 올라가지 않습니다.

### 6. Vercel 배포
1. https://vercel.com → **Add New… → Project** → GitHub 저장소 **Import**.
2. Framework Preset 이 **Vite** 로 잡히는지 확인 (Build: `npm run build`, Output: `dist`).
3. **Environment Variables** 에 3개를 모두 추가 (Production · Preview · Development 모두 체크):
   `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `PIXABAY_API_KEY`
4. **Deploy**. (환경변수를 나중에 바꾸면 **Redeploy** 해야 반영됩니다. `VITE_` 값은 빌드 때 들어가기 때문입니다.)

### 7. 배포 주소를 Supabase 에 알려 주기
**Authentication → URL Configuration**
- **Site URL**: `https://내프로젝트.vercel.app`
- **Redirect URLs** 에 `https://내프로젝트.vercel.app/**` 와 `http://localhost:5173/**` 추가

(안 하면 인증 메일 링크가 localhost 로 열립니다.)

## 폴더 구조
```
api/pixabay.js        Vercel 서버리스 함수 (Pixabay 프록시, 키 보호, 24시간 캐시)
src/main.js           라우터 · 인증 · 갤러리 · 보관함
src/supabase.js       Supabase 클라이언트
src/api.js            이미지 검색 호출
supabase/schema.sql   DB 테이블과 RLS
```

## 참고
- 사진은 Pixabay 라이선스를 따르며, 사진을 열면 촬영자 출처(Image by … from Pixabay)가 표시됩니다.
- Pixabay API 약관은 이미지를 장기간 핫링크하지 말고 서버에 저장해 쓰도록 안내합니다. 공부/포트폴리오용으로는 충분하지만, 실서비스라면 이미지를 직접 저장하는 방식으로 바꾸는 것을 권장합니다.
