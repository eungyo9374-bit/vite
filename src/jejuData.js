// 3D 지도에 표시할 제주 대표 경관 데이터
// ※ 좌표는 지도 감상용 "대략적인 위치"입니다. (정확한 길 안내용이 아니에요)

export const LAYERS = {
  peak: { label: '한라산·오름', emoji: '🏔️', color: '#2f9e44' },
  wind: { label: '풍력발전기', emoji: '🌬️', color: '#1c7ed6' },
  light: { label: '등대', emoji: '🗼', color: '#e03131' },
  harubang: { label: '돌하르방', emoji: '🗿', color: '#868e96' },
  port: { label: '항·포구', emoji: '⚓', color: '#1971c2' },
  olle: { label: '올레길', emoji: '🥾', color: '#f76707' },
  orchard: { label: '감귤 재배지', emoji: '🍊', color: '#f59f00' },
  visit: { label: '관광지 방문객', emoji: '📊', color: '#d6336c' },
}

export const PLACES = [
  // 한라산·오름
  { id: 'hallasan', layer: 'peak', name: '한라산 (백록담)', lat: 33.3617, lon: 126.5292, big: true,
    desc: '해발 1,947m로 대한민국에서 가장 높은 산이에요. 정상에는 화구호인 백록담이 있어요.' },
  { id: 'seongsan', layer: 'peak', name: '성산일출봉', lat: 33.4581, lon: 126.9425,
    desc: '바닷속 화산 폭발로 만들어진 분화구예요. 유네스코 세계자연유산 "제주 화산섬과 용암동굴"에 포함돼 있어요.' },
  { id: 'sanbang', layer: 'peak', name: '산방산', lat: 33.2397, lon: 126.3141,
    desc: '종을 엎어 놓은 모양의 용암 돔이에요. 기슭의 용머리해안과 함께 대표 명소예요.' },
  { id: 'saebyeol', layer: 'peak', name: '새별오름', lat: 33.3641, lon: 126.3567,
    desc: '가을 억새와 들불축제로 잘 알려진 서쪽의 대표 오름이에요.' },
  { id: 'geomun', layer: 'peak', name: '거문오름', lat: 33.4348, lon: 126.7132,
    desc: '용암동굴계를 만든 분화구예요. 세계자연유산의 핵심 구성 요소예요.' },
  { id: 'darangshi', layer: 'peak', name: '다랑쉬오름', lat: 33.4928, lon: 126.8225,
    desc: '동부 중산간의 둥근 분화구가 아름다운 오름이에요.' },
  { id: 'songak', layer: 'peak', name: '송악산', lat: 33.2052, lon: 126.2928,
    desc: '해안 절벽 위에서 가파도와 마라도를 바라볼 수 있는 오름이에요.' },

  // 풍력발전기 (단지 중심)
  { id: 'w-haengwon', layer: 'wind', name: '행원 풍력단지', lat: 33.5560, lon: 126.8000,
    desc: '바람이 센 제주 동북쪽 해안의 대표적인 풍력발전 단지예요.' },
  { id: 'w-gimnyeong', layer: 'wind', name: '김녕 풍력단지', lat: 33.5590, lon: 126.7450,
    desc: '해안을 따라 하얀 풍차가 줄지어 서 있는 곳이에요.' },
  { id: 'w-hangyeong', layer: 'wind', name: '한경 풍력단지', lat: 33.3320, lon: 126.1700,
    desc: '서쪽 끝 한경면 바닷가의 풍력발전 단지예요.' },
  { id: 'w-gasiri', layer: 'wind', name: '가시리 풍력단지', lat: 33.3950, lon: 126.7050,
    desc: '넓은 초원 위에 풍차가 서 있는 중산간의 풍력발전 단지예요.' },

  // 등대
  { id: 'l-udo', layer: 'light', name: '우도등대', lat: 33.5020, lon: 126.9550,
    desc: '소가 누운 모양의 섬 우도를 밝혀 주는 등대예요.' },
  { id: 'l-mara', layer: 'light', name: '마라도등대', lat: 33.1142, lon: 126.2705,
    desc: '대한민국 최남단 섬 마라도의 등대예요.' },
  { id: 'l-sanji', layer: 'light', name: '산지등대', lat: 33.5186, lon: 126.5317,
    desc: '제주항 입구에서 배들의 길을 밝혀 주는 등대예요.' },
  { id: 'l-chagwi', layer: 'light', name: '차귀도 등대', lat: 33.3115, lon: 126.1670,
    desc: '서쪽 바다에 떠 있는 무인도 차귀도의 등대예요.' },

  // 돌하르방
  { id: 'h-airport', layer: 'harubang', name: '제주국제공항 돌하르방', lat: 33.5067, lon: 126.4930,
    desc: '제주에 도착하면 가장 먼저 만나는 돌하르방이에요.' },
  { id: 'h-mokgwana', layer: 'harubang', name: '제주목 관아', lat: 33.5136, lon: 126.5214,
    desc: '조선시대 제주목의 관청 터로, 제주 원도심의 대표 명소예요.' },
  { id: 'h-seongeup', layer: 'harubang', name: '성읍민속마을', lat: 33.3870, lon: 126.7990,
    desc: '옛 제주의 마을 모습과 돌하르방을 볼 수 있는 민속마을이에요.' },

  // 항·포구
  { id: 'p-jeju', layer: 'port', name: '제주항', lat: 33.5200, lon: 126.5400,
    desc: '제주시의 관문 항구로 육지를 오가는 여객선이 드나들어요.' },
  { id: 'p-seogwipo', layer: 'port', name: '서귀포항', lat: 33.2400, lon: 126.5650,
    desc: '새섬과 이어지는 서귀포 앞바다의 항구예요.' },
  { id: 'p-seongsan', layer: 'port', name: '성산포항', lat: 33.4740, lon: 126.9290,
    desc: '우도로 가는 배가 출발하는 항구예요.' },
  { id: 'p-hallim', layer: 'port', name: '한림항', lat: 33.4150, lon: 126.2640,
    desc: '비양도 등 가까운 섬으로 가는 배가 오가는 서쪽 항구예요.' },
  { id: 'p-hwasun', layer: 'port', name: '화순항', lat: 33.2300, lon: 126.3400,
    desc: '산방산 가까이에 있는 남쪽 항구예요.' },

  // 올레길 (대표 구간 일부)
  { id: 'o-1', layer: 'olle', name: '올레 1코스 · 광치기해변', lat: 33.4600, lon: 126.9330,
    desc: '성산일출봉을 바라보며 걷는 올레길의 첫 코스 구간이에요.' },
  { id: 'o-5', layer: 'olle', name: '올레 5코스 · 남원포구', lat: 33.2760, lon: 126.7190,
    desc: '남쪽 바닷가 마을을 지나는 올레길 구간이에요.' },
  { id: 'o-7', layer: 'olle', name: '올레 7코스 · 외돌개', lat: 33.2440, lon: 126.5470,
    desc: '바다에 홀로 우뚝 선 바위 외돌개 옆을 지나는 인기 코스예요.' },
  { id: 'o-12', layer: 'olle', name: '올레 12코스 · 수월봉', lat: 33.2970, lon: 126.1620,
    desc: '서쪽 해안 절벽과 일몰이 아름다운 올레길 구간이에요.' },
  { id: 'o-17', layer: 'olle', name: '올레 17코스 · 용두암', lat: 33.5170, lon: 126.5120,
    desc: '제주시 바닷가 용두암 근처를 지나는 올레길 구간이에요.' },

  // 감귤 재배지 (대략적인 분포)
  { id: 'c-namwon', layer: 'orchard', name: '남원·위미 감귤밭', lat: 33.2800, lon: 126.6500, r: 4.2,
    desc: '남쪽 해안 중산간에 감귤밭이 넓게 펼쳐진 지역이에요.' },
  { id: 'c-hyodon', layer: 'orchard', name: '효돈·신효 감귤밭', lat: 33.2900, lon: 126.6000, r: 3.4,
    desc: '귤 맛이 좋기로 알려진 서귀포 동쪽의 감귤 재배지예요.' },
  { id: 'c-jungmun', layer: 'orchard', name: '중문·색달 감귤밭', lat: 33.2750, lon: 126.4300, r: 3.4,
    desc: '관광지 사이사이로 감귤밭이 이어지는 지역이에요.' },
  { id: 'c-aewol', layer: 'orchard', name: '애월·한림 감귤밭', lat: 33.4150, lon: 126.3600, r: 3.0,
    desc: '제주 북서쪽에서도 감귤을 많이 재배하는 지역이에요.' },

  // 관광지 방문객 (공공데이터 API 와 연결: key = API 의 칼럼 이름)
  { id: 'v-gamgyul', layer: 'visit', key: '감귤박물관', name: '감귤박물관', lat: 33.2790, lon: 126.6020,
    desc: '제주 감귤의 역사와 문화를 배울 수 있는 박물관이에요.' },
  { id: 'v-sanbang', layer: 'visit', key: '산방산_용머리', name: '산방산·용머리해안', lat: 33.2308, lon: 126.3131,
    desc: '산방산 아래 층층이 쌓인 사암 절벽 해안이에요.' },
  { id: 'v-jeongbang', layer: 'visit', key: '정방폭포', name: '정방폭포', lat: 33.2443, lon: 126.5710,
    desc: '바다로 곧장 떨어지는 폭포로 유명해요.' },
  { id: 'v-jusang', layer: 'visit', key: '중문대포 주상절리대', name: '중문대포 주상절리대', lat: 33.2381, lon: 126.4251,
    desc: '용암이 식으며 만든 육각 기둥 절벽이에요.' },
  { id: 'v-cheonjeyeon', layer: 'visit', key: '천제연폭포', name: '천제연폭포', lat: 33.2531, lon: 126.4128,
    desc: '3단으로 떨어지는 중문의 폭포예요.' },
  { id: 'v-cheonjiyeon', layer: 'visit', key: '천지연폭포', name: '천지연폭포', lat: 33.2467, lon: 126.5545,
    desc: '서귀포 시내 가까이에 있는 대표 폭포예요.' },
]
