# 사주×MBTI 운세 PWA — 인터페이스 계약서 (v1, 2026-08-14)

## 제품
- **앱 이름: "MZ사주풀이"** (2026-08-14 사장님 확정. 톤은 MZ 전환 아님 — 존댓말·차분 유지)
- 단일 폴더 정적 PWA (GitHub Pages 배포 예정). 모바일 우선.
- 입력: 생년월일(양력/음력+윤달), 출생시간(모름 허용), 성별, MBTI(모르면 12문항 약식검사).
- 출력: ①상세 리포트 4탭(총운/애정운/사업·재물운/건강운) ②오늘의 운세 ③궁합(두 사람) ④공유카드(canvas PNG 저장).
- 수익화: 애드센스 슬롯 placeholder 2곳(결과 하단, 탭 사이). AI 심층풀이 버튼은 UI만(백엔드 프록시 추후 배선, 미배선 시 버튼 숨김).

## 파일 구성
- `saju-engine.js` — 만세력·명리 계산 엔진 (담당: 엔진 에이전트)
- `content-db.js` — 풀이 텍스트 조각 DB + 조합기 (담당: 콘텐츠 에이전트)
- `index.html` — UI/PWA 셸, 위 둘을 script로 로드 (담당: UI 에이전트)
- `manifest.json`, `sw.js`, `icon-192.png`, `icon-512.png`
- `test.html` — 엔진 자가검증 페이지(알려진 만세력 사례 대조표)

## 전역 계약 (window 객체)

### window.SajuEngine
```js
SajuEngine.analyze({
  birthDate: 'YYYY-MM-DD',      // 입력 달력 기준
  calendar: 'solar'|'lunar',    // lunar면 내부에서 양력 변환
  lunarLeap: false,             // 음력 윤달 여부
  birthTime: 'HH:mm' | null,    // null=시간 모름 → hour pillar null
  gender: 'M'|'F',
}) → chart
```
`chart` = {
  solarDate: 'YYYY-MM-DD',
  pillars: { year:{gan,ji}, month:{gan,ji}, day:{gan,ji}, hour:{gan,ji}|null },
    // gan: '갑'~'계', ji: '자'~'해' (한글). 한자 변환표는 엔진이 GAN_HANJA/JI_HANJA로 export
  dayMaster: '갑'…'계',
  elements: { 목:n, 화:n, 토:n, 금:n, 수:n },   // 천간+지지(지장간 본기) 개수
  strength: '신강'|'중화'|'신약',
  sipsin: { year:{gan,ji}, month:{gan,ji}, hour:{gan,ji}|null },  // 일간 기준 십신 (비견~정인)
  specials: ['도화','역마','화개', ...],  // 12신살 중 대표 3종만 (일지 기준)
}

SajuEngine.today(chart, 'YYYY-MM-DD') → {
  iljin: {gan, ji},           // 해당일 일진
  sipsinVsDay: '비견'…'정인',  // 일진 천간 vs 내 일간
  branchRel: '합'|'충'|'형'|'해'|'파'|'무관',  // 일진 지지 vs 내 일지
  score: 0~100,               // 규칙 기반 종합점
}

SajuEngine.compat(chartA, chartB) → {
  ganRel: '합'|'극(A→B)'|'극(B→A)'|'생(A→B)'|'생(B→A)'|'비화',  // 두 일간 관계
  branchRel: '육합'|'삼합'|'충'|'형'|'해'|'파'|'무관',            // 두 일지 관계
  elementFit: 0~100,          // 오행 상호보완 점수
  score: 0~100,
}
```

### window.ContentDB
```js
ContentDB.compose(chart, mbti|null) → {
  total:  { headline, paras:[3~5문단] },
  love:   { headline, paras:[...] },
  biz:    { headline, paras:[...] },
  health: { headline, paras:[...], caution:[오행불균형 주의 문장] },
  persona: { title, summary },   // 일간×MBTI 캐릭터 요약 (공유카드용)
}
ContentDB.daily(todayResult, chart) → { headline, para, luckyColor, luckyItem }
ContentDB.compat(compatResult, mbtiA|null, mbtiB|null) → { headline, paras:[...], tips:[...] }
ContentDB.mbtiQuiz → [ {q, a:{text,axis:'E'|...}, b:{...}} ×12 ]   // 약식검사 문항
```

## v1.1 추가: 맞춤 추천 (2026-08-16 사장님 확정 — 개운+상품슬롯+직업/재테크)
```js
ContentDB.recommend(chart, mbti|null) → {
  actions:  [3~4개 {title, desc}],        // 개운 행동 (사주 약점 오행 보완 + MBTI 성향 반영)
  lucky:    { color, item, direction, number },  // 오행 기반
  career:   { headline, fields:[적성 직업군 3~5], style, para },  // 십신(식상/관성/재성/인성/비겁 구조)×MBTI 그룹 기반
  wealth:   { headline, style, tips:[2~3], caution },  // 재성 형태(정재/편재)+일간 강약+MBTI J/P 기반 재테크 성향
  products: [2~3개 {category, reason, link:null}],  // 오행 보완·건강운 연관 상품 카테고리 (link는 제휴 딥링크 발급 시 채움, null이면 UI에서 텍스트만)
}
```
- UI: 결과 화면에 5번째 탭 또는 별도 섹션 "맞춤 추천" — actions/lucky/career/wealth 렌더, products는 link null이면 카테고리 텍스트+"준비 중" 없이 자연스러운 추천 문장으로만.
- 단정 금지 톤 유지("~쪽이 잘 맞는 흐름"), 투자 단정 금지(wealth.caution 필수), 푸터 고지 문구가 재테크에도 적용됨을 명시.

## 품질 기준
- 엔진: test.html에 검증 사례 최소 8건(절기 경계일 2건, 자시 경계 1건, 음력 윤달 1건 포함) 전부 PASS 표기.
- 콘텐츠: 동일 조합이라도 문단이 조각 3개 이상 조합으로 구성돼 기계 반복감 없게. 존댓말, 단정 대신 경향("~한 흐름입니다"). 의료 단정 금지(건강운은 생활 조언 톤).
- 미신 고지 문구 푸터 필수: "본 콘텐츠는 전통 명리학과 성격유형 이론을 재미로 풀어낸 것으로, 의료·투자 판단의 근거가 될 수 없습니다."
