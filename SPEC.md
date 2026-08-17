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

## v1.2 추가: 이름풀이 (2026-08-16 사장님 지시)
```js
window.NameReader.analyze(name /*한글 2~4자*/, chart|null) → {
  syllables: [{ch, cho, jung, elements:{초성오행, 종성오행|null}, strokes}],
  soriFlow: { pairs:[{from,to,rel:'상생'|'상극'|'비화'}], verdict, para },   // 소리오행 흐름
  suri: { wonhyeong:{num,grade,name,para}, hyeonggyeok:{...}, igyeok:{...}, jeonggyeok:{...} }, // 한글 획수 4격×81수리
  sajuFit: chart ? { fillsLack:bool, lackElement, nameElements, verdict, para } : null,  // 이름이 사주 부족 오행을 보완하는가
  overall: { score:0~100, headline, para },
}
```
- 자음→오행: ㄱㅋ=목/ㄴㄷㅌㄹ=화/ㅇㅎ=토/ㅅㅈㅊ=금/ㅁㅂㅍ=수 (전통 소리오행). 획수는 채택 규약을 코드 주석에 명시하고 공개 사례 2건+로 교차확인.
- 81수리 길흉표 전체 내장(수별 이름·등급·2문장 풀이).
- UI: 입력폼에 "이름(선택)" 필드 — 입력 시 결과에 "이름풀이" 탭 추가(soriFlow→suri 4격 카드→sajuFit→overall). 미입력 시 탭 숨김. 성(姓) 1자+이름 1~3자 가정, 한글만 허용(검증). 한자 이름풀이는 차기(범위 외) 명시.
- 이름도 로컬 처리(전송 0) — 푸터 고지에 반영.

## v1.3 추가: 한자 뜻풀이 (2026-08-16 사장님 지시)
```js
window.HanjaDB = { byReading: { '민': [{ch:'旼',meaning:'화락할',strokes원획:8,jawonElement:'화'|..}, ...], ... } }
window.NameReader.analyzeHanja(selected /*[{ch,...}] 음절별 선택*/, chart|null) → {
  perChar: [{ch, reading, meaning, jawonElement, strokes}],
  meaningPara,            // 이름 전체 의미 조합 해석 (조합 템플릿, 존댓말)
  jawonFit: chart ? {...sajuFit과 동형} : null,   // 자원오행의 사주 보완
  suriHanja: { wonhyeong..jeonggyeok },           // 원획 기반 수리 4격 (한글 수리와 별도 표시)
  overall: {score, headline, para},
}
```
- DB: 자주 쓰는 인명 한자 음절별 후보(총 500자+), 출처=공개 데이터셋(libhangul hanja.txt 뜻·음 / Unihan kTotalStrokes) 기반 + **원획 보정표**(氵→水4, 扌→手4, 忄→心4, 艹→艸6, 阝좌→阜8, 阝우→邑7, 王→玉5, 月(육달)→肉6, 辶→辵7, 礻→示5, 衤→衣6, 犭→犬4, 灬→火4, 罒→网6 등) 적용. 표본 20자+ 성명학 사이트 교차검증 필수.
- UI: 이름풀이 탭 안에 "한자로 더 보기" — 음절별 후보 선택 칩 → 선택 완료 시 뜻풀이·자원오행·원획 수리 섹션 추가 렌더. 후보에 없으면 "목록에 없음" 선택지→한글 풀이 유지.
- 미신 고지·로컬 처리 원칙 동일.

## v1.4 추가: 오늘의운세 로또 번호 (2026-08-16 사장님 지시)
```js
ContentDB.lotto(chart, 'YYYY-MM-DD') → { numbers:[6개 오름차순 1~45 중복없음], para(1문장), show:bool }
```
- 결정적 시드 = chart(8글자)+날짜 → 같은 사람·같은 날 = 같은 번호, 날마다 변경. 오행→숫자 대역 가중(목1~9/화10~18/토19~27/금28~36/수37~45에 당일 일진 오행·본인 부족 오행 가중치) 후 6개 추출.
- show: 월~금만 true (토·일 false → UI 미노출). UI는 오늘의운세 카드 하단 공 모양 번호 6개.
- 고지: "재미로 보는 번호이며 당첨과 무관합니다" 카드 내 소문구 필수.

## v1.5 추가: 궁합 이름풀이 반영 (2026-08-16 사장님 지시)
```js
window.NameReader.compatNames(nameA, nameB, chartA|null, chartB|null) → {
  elementsA, elementsB,          // 각 이름의 소리오행 구성
  nameRel: { rel:'상생(A→B)'|'상생(B→A)'|'상호상생'|'상극'|'비화', para },  // 두 이름 대표오행 관계
  giveTake: [                    // 이름이 상대 사주에 주는 기운 (chart 있는 쪽만)
    {dir:'A→B', fills:bool, element, para}, {dir:'B→A', ...}
  ],
  suriPair: { aScore, bScore, para },   // 각자 정격 등급 조합 코멘트
  score: 0~100, headline, para,
}
```
- UI: 궁합 폼에 양쪽 "이름(선택)" 필드 추가 → 둘 다 입력 시 궁합 결과에 "이름 궁합" 섹션(이름 오행 관계도 + 서로 주는 기운 + 종합), 한쪽만 입력 시 그쪽 분석만 축약 표시, 미입력 시 섹션 없음.
- 기존 SajuEngine.compat 점수 체계는 무변경 — 이름 궁합은 별도 보조 점수·섹션으로 병기(사주 궁합 점수와 혼합 금지).
- 결정성·존댓말·경향 톤·로컬 처리 원칙 동일.

## v1.6 추가: 메인화면(홈 대시보드) (2026-08-16 사장님 지시 "오늘의 운세, 로또 번호 등으로")
- **프로필 저장**: 결과 조회 완료 시 입력값(생년월일·달력·시간·성별·MBTI·이름)을 localStorage에 자동 저장(기기 로컬만 — 개인정보 원칙 동일, 푸터 고지 반영). 다중 프로필 허용(본인+가족 등, 최대 5개), 활성 프로필 1개.
- **첫 방문**(프로필 없음): 기존 입력 폼 그대로.
- **재방문**(프로필 있음): **홈 대시보드** 표시 —
  ① 인사 헤더: "안녕하세요, [이름/페르소나 별명]님" + 오늘 날짜·일진(간지)
  ② 오늘의 운세 카드(점수·headline·para·럭키 컬러/아이템)
  ③ 로또 번호 카드(월~금, v1.4 재사용)
  ④ 메뉴 타일: 내 상세 리포트 / 궁합 보기 / 이름풀이 / MBTI 약식검사 / 공유카드
  ⑤ 프로필 전환·수정·새 사주 보기
- 기존 결과 화면·계산 로직 무변경 — 홈은 기존 함수(ContentDB.daily/lotto, SajuEngine.analyze 재계산) 재사용. 라우팅은 해시 기반 화면 전환(SPA 유지).
- 메뉴 타일 확정(사장님 8/16 16:04): **사주(상세 리포트) / 이름풀이 / 한자 뜻풀이 / 로또 / 궁합** 5타일 + MBTI 약식검사는 보조 배치.
- 결정성·오프라인 동작·sw 버전업 동일 원칙.

### v1.6 테마: 사극(한국 전통) 배경 전면 전환 (사장님 8/16 16:04)
- 기존 다크+보라 → **사극 풍**: 먹빛 밤하늘 배경(#1a1410 계열 딥브라운·먹색), 한지 질감 카드(CSS 그라디언트/노이즈로 표현), 금색(#c9a227 계열) 포인트, 붉은 낙관(도장) 액센트 1~2곳.
- 장식 요소는 **인라인 SVG만**(외부 이미지 금지·오프라인 유지): 전통 구름 문양(운문), 산수 실루엣, 보름달, 기와/창살 패턴 중 2~3종을 배경 레이어로.
- 서체: 제목=명조/붓글씨 계열(Google Fonts 'Nanum Myeongjo' 로드 + sw 캐시, 실패 시 Batang·serif 폴백 필수 — 오프라인에서도 깨지지 않게), 본문 가독성 유지.
- 로또 공·오행 색상 등 기능적 색 규칙은 유지(가독성 우선). 전 화면(홈·입력·결과·궁합·이름) 일관 적용. 아이콘(icon-192/512)도 사극 톤(먹+금+낙관)으로 재생성.

## v1.7 추가: 한자 DB 확대 + 검색 (2026-08-17 사장님 실검수 지적 "이름 한자 찾을 때 너무 제한적 — 검색으로 찾게")
- **DB 확대**: v1.3 DB(2,564자, 음절당 최대 8자 상한 + KS X 1001 상용한자 범위)를
  6,819자(고유 6,513자, 478음절, 음절당 상한 폐지)로 확대. 벽자 제외 기준을
  "EUC-KR 인코딩 가능"에서 "Unicode kIRG_KSource가 K0(KS X 1001) 또는 K1(KS X 1002)로
  등재"로 넓혔다(근거·수치는 _data/build_db.py 헤더 참조). 파일 크기 650KB(<1MB).
- **원획 검증**: 확대분 전량을 irum.com 대조표와 재대조(_data/verify_all.py, 배치조회+
  개별폴백 병렬화) — 일치 4,803 + 불일치 43(COMPONENT_FIX로 교정, 최종 일치 4,846) +
  미조회 1,973(대조표에 없는 글자 — 프로그램 계산값 유지 + `unverified:true` 플래그,
  UI 표시는 검증 항목과 동일).
- **검색 UI**: 한자 선택 화면(음절별 후보 칩)에 후보가 10자를 넘는 음절만 검색창 노출.
  ① 음 검색(그 음절 전 후보 재노출) ② 뜻 키워드 검색(뜻 문자열 부분일치) ③ 획수 필터
  (드롭다운, 선택). 기본 노출은 빈도순 상위 10 + "더 보기". 입력 디바운스 200ms,
  재렌더로 검색창 포커스가 끊기지 않도록 커서 위치까지 복원. 선택 시 기존 플로우
  (data-idx/data-ch/data-reading → runHanjaAnalysis) 그대로 유지.
- name-hanja-db.js `HanjaDB.candidates()/lookup()` 계약, saju-engine.js·content-db.js·
  name-reader.js 로직은 v1.7에서 무변경(계약 유지).

## 품질 기준
- 엔진: test.html에 검증 사례 최소 8건(절기 경계일 2건, 자시 경계 1건, 음력 윤달 1건 포함) 전부 PASS 표기.
- 콘텐츠: 동일 조합이라도 문단이 조각 3개 이상 조합으로 구성돼 기계 반복감 없게. 존댓말, 단정 대신 경향("~한 흐름입니다"). 의료 단정 금지(건강운은 생활 조언 톤).
- 미신 고지 문구 푸터 필수: "본 콘텐츠는 전통 명리학과 성격유형 이론을 재미로 풀어낸 것으로, 의료·투자 판단의 근거가 될 수 없습니다."
