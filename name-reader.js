/**
 * name-reader.js — MZ사주풀이 이름풀이(한글 성명학) 엔진
 * v1.2 (2026-08-16, SPEC.md "v1.2 추가: 이름풀이" 계약 준수)
 *
 * 순수 JS · 외부 라이브러리 0 · 네트워크 0 · window.NameReader 전역 노출
 * saju-engine.js / content-db.js 는 import/수정하지 않는다 (파일 독립).
 *
 * window.NameReader.analyze(name, chart|null) → {
 *   syllables, soriFlow, suri, sajuFit, overall
 * }
 *
 * 범위: 순한글 이름(성 1자 + 이름 1~3자)만 다룬다. 한자 이름풀이는 차기(범위 외).
 * 처리는 전부 로컬(기기 내)에서만 이뤄지며 어떤 값도 외부로 전송하지 않는다.
 */
(function (global) {
  'use strict';

  // ============================================================
  // 1. 한글 음절 분해 (초성/중성/종성)
  // ============================================================
  var CHO_LIST = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
  var JUNG_LIST = ['ㅏ', 'ㅐ', 'ㅑ', 'ㅒ', 'ㅓ', 'ㅔ', 'ㅕ', 'ㅖ', 'ㅗ', 'ㅘ', 'ㅙ', 'ㅚ', 'ㅛ', 'ㅜ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅠ', 'ㅡ', 'ㅢ', 'ㅣ'];
  // index 0 = 종성 없음
  var JONG_LIST = ['', 'ㄱ', 'ㄲ', 'ㄳ', 'ㄴ', 'ㄵ', 'ㄶ', 'ㄷ', 'ㄹ', 'ㄺ', 'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ', 'ㅁ', 'ㅂ', 'ㅄ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];

  function isHangulSyllable(ch) {
    var code = ch.charCodeAt(0) - 0xAC00;
    return code >= 0 && code <= 11171;
  }

  function decompose(ch) {
    var code = ch.charCodeAt(0) - 0xAC00;
    if (code < 0 || code > 11171) return null;
    var jongIdx = code % 28;
    var jungIdx = Math.floor(code / 28) % 21;
    var choIdx = Math.floor(code / 28 / 21);
    return { cho: CHO_LIST[choIdx], jung: JUNG_LIST[jungIdx], jong: jongIdx === 0 ? null : JONG_LIST[jongIdx] };
  }

  // ============================================================
  // 2. 소리오행 (발음오행) — 초성/종성 자음 → 오행
  // 채택 규약: 훈민정음 제자 원리의 조음 위치(오음) 분류를 따른다.
  //   아음(어금닛소리) ㄱㅋㄲ → 목 / 설음(혓소리) ㄴㄷㅌㄹㄸ → 화 /
  //   후음(목구멍소리) ㅇㅎ → 토 / 치음(잇소리) ㅅㅈㅊㅆㅉ → 금 /
  //   순음(입술소리) ㅁㅂㅍㅃ → 수
  // 교차확인 출처:
  //   ① SPEC.md v1.2 명시 규약 (사장님 확정, 훈민정음 오음 분류와 일치)
  //   ② 무명작명소 "발음오행이란? 한글 소리에 숨은 오행 원리" (mumyeong.kr/guide/발음오행) —
  //      동일하게 목ㄱㅋ/화ㄴㄷㄹㅌ/토ㅇㅎ/금ㅅㅈㅊ/수ㅁㅂㅍ 로 기술, threads.com/@nana_tarot 작명 참고글도 동일 분류 확인
  // 겹받침(복합 종성)은 표준발음법(국립국어원)의 대표음 규칙에 따라 대표 자음 하나로 환산해 오행을 정한다.
  // ============================================================
  var CONSONANT_ELEMENT = {
    'ㄱ': '목', 'ㅋ': '목', 'ㄲ': '목',
    'ㄴ': '화', 'ㄷ': '화', 'ㅌ': '화', 'ㄹ': '화', 'ㄸ': '화',
    'ㅇ': '토', 'ㅎ': '토',
    'ㅅ': '금', 'ㅈ': '금', 'ㅊ': '금', 'ㅆ': '금', 'ㅉ': '금',
    'ㅁ': '수', 'ㅂ': '수', 'ㅍ': '수', 'ㅃ': '수'
  };

  // 표준발음법(국립국어원) 제4장 겹받침 대표음 규칙: 어말에서 실제 발음되는 자음 하나로 환산
  var JONG_REPRESENTATIVE = {
    'ㄳ': 'ㄱ', 'ㄵ': 'ㄴ', 'ㄶ': 'ㄴ', 'ㄺ': 'ㄱ', 'ㄻ': 'ㅁ',
    'ㄼ': 'ㄹ', 'ㄽ': 'ㄹ', 'ㄾ': 'ㄹ', 'ㄿ': 'ㅂ', 'ㅀ': 'ㄹ', 'ㅄ': 'ㅂ'
  };

  function elementOfJong(jong) {
    if (!jong) return null;
    var rep = JONG_REPRESENTATIVE[jong] || jong;
    return CONSONANT_ELEMENT[rep] || null;
  }

  // ============================================================
  // 3. 한글 획수표 (성명학 4격 계산용)
  // 채택 규약: 훈민정음 해례본의 "가획(加畫)" 원리를 필기 획수로 그대로 환산한다.
  //   - 기본자(각 조음위치의 최소 형태)를 1획으로 삼고, 가획할 때마다 1획씩 늘린다.
  //     아음 ㄱ(1)→ㅋ(2) / 설음 ㄴ(1)→ㄷ(2)→ㅌ(3), 이체자 ㄹ은 3획 처리 /
  //     순음 ㅁ(3, 네모 형태를 3획으로 씀)→ㅂ(4)→ㅍ(5) / 치음 ㅅ(2)→ㅈ(3)→ㅊ(4) /
  //     후음 ㅇ(1)→ㅎ(3, ㅇ에서 2단계 가획)
  //   - 각자병서(쌍자음)는 기본자 획수를 두 번 더한 값으로 본다. (ㄲ=1+1, ㄸ=2+2, ㅃ=4+4, ㅆ=2+2, ㅉ=3+3)
  //   - 모음은 기본자 ㅡ·ㅣ를 1획으로 삼고, 합성모음은 구성 요소 획수의 합으로 계산한다.
  //     (예: ㅏ=ㅣ+가로획=2, ㅘ=ㅗ+ㅏ=2+2=4)
  // 교차확인 출처:
  //   ① GitHub forteleaf/makename (README "한글 획수와 오행") — 실사용 음절-총획수 예시 데이터로,
  //      본 표로 역산한 기본 자모 획수(ㄱ=1,ㅋ=2,ㄴ=1,ㄷ=2,ㅇ=1,ㅅ=2,ㅁ=3,ㅡ=1,ㅣ=1)와 정확히 일치함을 확인.
  //   ② 초등 국어 받아쓰기 필순 교육 관행(자모 1자 = 최소 선/획 개수로 세는 통상적 셈법) — 위 ①의
  //      기본자 값과 동일한 결과를 주는 셈법임을 확인.
  // 이 규약은 "정답"이 아니라 재미 콘텐츠를 위해 채택한 하나의 규칙임을 코드/문서에 명시한다.
  // ============================================================
  var CONSONANT_STROKES = {
    'ㄱ': 1, 'ㅋ': 2, 'ㄲ': 2,
    'ㄴ': 1, 'ㄷ': 2, 'ㅌ': 3, 'ㄹ': 3, 'ㄸ': 4,
    'ㅇ': 1, 'ㅎ': 3,
    'ㅅ': 2, 'ㅈ': 3, 'ㅊ': 4, 'ㅆ': 4, 'ㅉ': 6,
    'ㅁ': 3, 'ㅂ': 4, 'ㅍ': 5, 'ㅃ': 8
  };

  var VOWEL_STROKES = {
    'ㅏ': 2, 'ㅐ': 3, 'ㅑ': 3, 'ㅒ': 4, 'ㅓ': 2, 'ㅔ': 3, 'ㅕ': 3, 'ㅖ': 4,
    'ㅗ': 2, 'ㅘ': 4, 'ㅙ': 5, 'ㅚ': 3, 'ㅛ': 3, 'ㅜ': 2, 'ㅝ': 4, 'ㅞ': 5,
    'ㅟ': 3, 'ㅠ': 3, 'ㅡ': 1, 'ㅢ': 2, 'ㅣ': 1
  };

  // 겹받침(복합 종성)의 필기 획수 = 구성 두 자음의 획수 합 (쓰는 동작 기준이라 대표음과 무관하게 둘 다 센다)
  var COMPOUND_JONG_PARTS = {
    'ㄳ': ['ㄱ', 'ㅅ'], 'ㄵ': ['ㄴ', 'ㅈ'], 'ㄶ': ['ㄴ', 'ㅎ'], 'ㄺ': ['ㄹ', 'ㄱ'], 'ㄻ': ['ㄹ', 'ㅁ'],
    'ㄼ': ['ㄹ', 'ㅂ'], 'ㄽ': ['ㄹ', 'ㅅ'], 'ㄾ': ['ㄹ', 'ㅌ'], 'ㄿ': ['ㄹ', 'ㅍ'], 'ㅀ': ['ㄹ', 'ㅎ'], 'ㅄ': ['ㅂ', 'ㅅ']
  };

  function strokesOfJong(jong) {
    if (!jong) return 0;
    var parts = COMPOUND_JONG_PARTS[jong];
    if (parts) return CONSONANT_STROKES[parts[0]] + CONSONANT_STROKES[parts[1]];
    return CONSONANT_STROKES[jong] || 0;
  }

  function syllableStrokes(d) {
    return CONSONANT_STROKES[d.cho] + VOWEL_STROKES[d.jung] + strokesOfJong(d.jong);
  }

  // ============================================================
  // 4. 오행 상생상극 (소리 흐름 판정용, saju-engine.js/content-db.js와 별개의 자체 상수)
  // ============================================================
  var GEN_NEXT = { 목: '화', 화: '토', 토: '금', 금: '수', 수: '목' };   // 상생(내가 생하는 오행)
  var CTRL_NEXT = { 목: '토', 토: '수', 수: '화', 화: '금', 금: '목' };  // 상극(내가 극하는 오행)

  function relationOf(a, b) {
    if (a === b) return '비화';
    if (CTRL_NEXT[a] === b || CTRL_NEXT[b] === a) return '상극';
    return '상생';
  }

  // ============================================================
  // 5. 81수리 길흉표 (전통 성명학 원형이정 4격 판정용)
  // 채택 규약: 격 명칭·등급은 아래 [출처1]의 1~81 전체표를 뼈대로 삼아 내적 일관성을 유지하고,
  // 통상적으로 널리 알려진 길수/흉수 방향(예: 1,3,5,6,7,8,11,13,15,16,17,18,21,24,25,29,31,33,37,38,
  // 41,45,47,48,52,57,58,61,63,65,67,68,73,75,81 은 길 / 2,4,9,10,12,14,19,20,22,34,42,43,44 등은 흉)이
  // [출처2][출처3]와 일치함을 교차확인했다. 격 명칭은 유파마다 표기가 다를 수 있어(예시 21획을 '두령격'
  // '두령운' 등으로 부르는 경우가 많음) 대표 명칭 하나를 채택했다.
  //   [출처1] kimtaku.com "성명학 81수리이론" (news/6127) — 1~81 전체 격 명칭·등급표
  //   [출처2] 도경담원 dgsaju.co.kr 공지사항(847158) "한자 81수의 길흉(길한 수리)" — 길수 명칭·상징 문구
  //   [출처3] Daum 카페 HG899 "81수리 해설 (1~40획)" — 1~40획 상세 해설(흉수 포함) 및 등급 방향 대조
  // grade는 4단계로 정규화: 길(최상/길운) · 중길(상운) · 평(길흉난분) · 흉(흉운/최흉)
  // 81을 넘는 획수는 -80씩 순환시켜 1~81 범위로 환산한다(81수리 순환 원칙).
  // ============================================================
  var SURI_TABLE = {
    1: { name: '기본격', grade: '중길', s1: '번영과 발달의 기운이 강해 새로운 출발에 유리한 흐름입니다.' },
    2: { name: '분리격', grade: '흉', s1: '관계가 흔들리기 쉬운 편이라 사람 사이의 조율에 마음을 쓰면 좋은 수리입니다.' },
    3: { name: '성형격', grade: '중길', s1: '지혜롭고 순조롭게 입신출세하는 기운을 지닌 흐름입니다.' },
    4: { name: '부정격', grade: '흉', s1: '고비가 잦은 편이라 계획을 자주 다잡아야 하는 수리입니다.' },
    5: { name: '정성격', grade: '중길', s1: '음양이 조화를 이루어 복이 따르고 무난히 풀리는 흐름입니다.' },
    6: { name: '계성격', grade: '중길', s1: '주변의 도움과 음덕을 잘 받는 넉넉한 흐름입니다.' },
    7: { name: '독립격', grade: '길', s1: '정력이 왕성해 스스로의 힘으로 성취를 이루는 흐름입니다.' },
    8: { name: '개물격', grade: '길', s1: '꾸준한 노력으로 자발적으로 길을 열어가는 흐름입니다.' },
    9: { name: '궁박격', grade: '흉', s1: '시작은 좋으나 마무리에 정성을 더 들여야 하는 수리입니다.' },
    10: { name: '공허격', grade: '흉', s1: '중도에 힘이 흩어지기 쉬워 다잡음이 필요한 수리입니다.' },
    11: { name: '신성격', grade: '중길', s1: '봄을 맞은 초목처럼 다시 일어서는 온건한 흐름입니다.' },
    12: { name: '박약격', grade: '흉', s1: '혼자 애쓰기보다 주변과 함께할 때 힘이 붙는 수리입니다.' },
    13: { name: '지모격', grade: '길', s1: '두뇌 회전이 좋고 지혜로운 계책으로 입신하는 흐름입니다.' },
    14: { name: '이산격', grade: '흉', s1: '애쓴 만큼 결실이 더디게 오는 편, 인내가 필요한 수리입니다.' },
    15: { name: '통솔격', grade: '중길', s1: '겸손하면서도 통솔력이 있어 대사를 이루는 흐름입니다.' },
    16: { name: '덕망격', grade: '길', s1: '신망을 얻고 명예와 이로움을 함께 쌓는 흐름입니다.' },
    17: { name: '건창격', grade: '길', s1: '굳은 의지로 고비를 넘기고 귀인의 도움을 받는 흐름입니다.' },
    18: { name: '발전격', grade: '중길', s1: '계획한 바를 순리대로 밀고 나가는 흐름입니다.' },
    19: { name: '고난격', grade: '흉', s1: '초반의 번창 뒤에 건강과 인연에 마음을 써야 하는 수리입니다.' },
    20: { name: '허망격', grade: '흉', s1: '일시적 성취 뒤 진퇴양난에 놓이기 쉬워 서두르지 않는 것이 좋은 수리입니다.' },
    21: { name: '두령격', grade: '길', s1: '백절불굴의 정신으로 앞장서는 리더십의 흐름입니다.' },
    22: { name: '중절격', grade: '흉', s1: '계획이 자주 흔들리는 편이라 페이스 조절이 중요한 수리입니다.' },
    23: { name: '공명격', grade: '길', s1: '권위와 추진력으로 큰 성취를 이루는 흐름입니다.' },
    24: { name: '입신격', grade: '중길', s1: '초반의 어려움을 딛고 불굴의 의지로 대성하는 흐름입니다.' },
    25: { name: '안전격', grade: '길', s1: '대인관계가 원만하며 명예와 재물을 함께 쌓는 흐름입니다.' },
    26: { name: '영웅시비격', grade: '흉', s1: '기개는 크나 시비에 휘말리기 쉬운 편이라 처신에 마음을 쓰면 좋은 수리입니다.' },
    27: { name: '중단격', grade: '흉', s1: '자존심이 강해 중도에 부딪히기 쉬운 편의 수리입니다.' },
    28: { name: '파란격', grade: '흉', s1: '변화가 잦은 편이라 가까운 사람과의 조율이 중요한 수리입니다.' },
    29: { name: '성공격', grade: '길', s1: '적극적인 활동력으로 부귀와 명예를 함께 이루는 흐름입니다.' },
    30: { name: '부몽격', grade: '흉', s1: '꿈처럼 일이 붕 뜨기 쉬운 편이라 현실적인 계획이 도움 되는 수리입니다.' },
    31: { name: '융창격', grade: '길', s1: '굳은 의지로 역경을 넘어서 명예와 재물을 얻는 흐름입니다.' },
    32: { name: '요행격', grade: '중길', s1: '뜻밖의 도움을 받아 순조롭게 발전하는 흐름입니다.' },
    33: { name: '승천격', grade: '길', s1: '과감한 결단력으로 크게 이루는 흐름입니다.' },
    34: { name: '파멸격', grade: '흉', s1: '부침이 큰 편이라 무리한 확장을 경계하면 좋은 수리입니다.' },
    35: { name: '평범격', grade: '중길', s1: '차분하고 신중하여 평안을 유지하는 흐름입니다.' },
    36: { name: '영걸시비격', grade: '흉', s1: '기세는 좋으나 시기 조절이 필요한 수리입니다.' },
    37: { name: '인덕격', grade: '중길', s1: '어질고 덕이 있어 대체로 순조롭게 풀리는 흐름입니다.' },
    38: { name: '복록격', grade: '길', s1: '인내와 성실함으로 복록을 쌓아가는 흐름입니다.' },
    39: { name: '안락격', grade: '중길', s1: '현명하게 다스려 살림과 자손이 번창하는 흐름입니다.' },
    40: { name: '무상격', grade: '흉', s1: '기복이 있는 편이라 분수를 지키면 무리 없이 흘러가는 수리입니다.' },
    41: { name: '대공격', grade: '길', s1: '영명한 지혜로 큰 뜻을 이루는 흐름입니다.' },
    42: { name: '고행격', grade: '흉', s1: '애쓴 만큼 더디게 돌아오는 편, 끈기가 필요한 수리입니다.' },
    43: { name: '미혹격', grade: '흉', s1: '마음이 자주 흔들리는 편이라 중심을 잡는 것이 관건인 수리입니다.' },
    44: { name: '마장격', grade: '흉', s1: '예상 밖의 장애가 잦은 편이라 미리 대비하면 좋은 수리입니다.' },
    45: { name: '대지격', grade: '길', s1: '지모가 출중해 큰 흐름을 읽어내는 대길의 기운입니다.' },
    46: { name: '부지격', grade: '흉', s1: '방향을 잡기 어려운 편이라 계획을 세우면 도움 되는 수리입니다.' },
    47: { name: '출세격', grade: '길', s1: '기회를 잘 포착해 태평한 흐름을 만드는 기운입니다.' },
    48: { name: '유덕격', grade: '길', s1: '성실함으로 명예와 이로움을 함께 누리는 흐름입니다.' },
    49: { name: '은퇴격', grade: '평', s1: '나아감과 물러남의 갈림에서 신중함이 필요한 흐름입니다.' },
    50: { name: '불행격', grade: '흉', s1: '뜻대로 되지 않는 시기가 있는 편이라 서두르지 않는 것이 좋은 수리입니다.' },
    51: { name: '춘추격', grade: '평', s1: '초반과 후반의 흐름이 다른 편으로, 중반 이후 기운이 살아나는 흐름입니다.' },
    52: { name: '능직격', grade: '길', s1: '선견지명이 탁월해 앞서 준비하고 나아가는 흐름입니다.' },
    53: { name: '불화격', grade: '흉', s1: '안팎의 조율이 필요한 편이라 관계에 마음을 쓰면 좋은 수리입니다.' },
    54: { name: '신고격', grade: '흉', s1: '수고로움이 따르는 편이라 내실을 다지는 것이 중요한 수리입니다.' },
    55: { name: '불인격', grade: '흉', s1: '겉과 속의 차이를 견뎌야 하는 편이라 인내가 필요한 수리입니다.' },
    56: { name: '부족격', grade: '흉', s1: '채워지지 않는 아쉬움이 있는 편이라 꾸준함이 관건인 수리입니다.' },
    57: { name: '노력격', grade: '길', s1: '끈기 있는 노력으로 만복을 불러들이는 흐름입니다.' },
    58: { name: '자력격', grade: '길', s1: '스스로의 힘과 인내로 늦게라도 행복을 찾는 흐름입니다.' },
    59: { name: '불우격', grade: '흉', s1: '때를 만나기까지 시간이 걸리는 편이라 준비가 중요한 수리입니다.' },
    60: { name: '암흑격', grade: '흉', s1: '방향을 잃기 쉬운 편이라 원칙을 지키면 도움 되는 수리입니다.' },
    61: { name: '영화격', grade: '길', s1: '재능이 출중해 영화로운 결실을 누리는 흐름입니다.' },
    62: { name: '고독격', grade: '흉', s1: '혼자 감당하기 쉬운 편이라 곁을 챙기면 좋은 수리입니다.' },
    63: { name: '길상격', grade: '길', s1: '주도면밀함으로 무궁히 발전하는 길상의 흐름입니다.' },
    64: { name: '침체격', grade: '흉', s1: '속도가 더딘 편이라 조급해하지 않는 태도가 필요한 수리입니다.' },
    65: { name: '완미격', grade: '길', s1: '합리적인 판단으로 순풍에 돛 단 듯 나아가는 흐름입니다.' },
    66: { name: '역난격', grade: '흉', s1: '역풍이 잦은 편이라 무리한 시도를 아끼면 좋은 수리입니다.' },
    67: { name: '성장격', grade: '길', s1: '강직함으로 대업을 성취하는 흐름입니다.' },
    68: { name: '달성격', grade: '길', s1: '근면함으로 뜻한 바를 이루고 공을 인정받는 흐름입니다.' },
    69: { name: '쇠약격', grade: '흉', s1: '기운이 가라앉기 쉬운 편이라 휴식과 재정비가 도움 되는 수리입니다.' },
    70: { name: '암난격', grade: '흉', s1: '어두운 시기를 지날 수 있는 편이라 서두르지 않는 것이 좋은 수리입니다.' },
    71: { name: '불안격', grade: '길', s1: '한때 불안해 보여도 지나고 나면 얻는 것이 많은 흐름입니다.' },
    72: { name: '상반격', grade: '흉', s1: '좋고 나쁨이 반반으로 갈리기 쉬운 편이라 균형이 필요한 수리입니다.' },
    73: { name: '형통격', grade: '길', s1: '실천력이 우수해 부귀와 명예를 함께 얻는 흐름입니다.' },
    74: { name: '불교격', grade: '흉', s1: '인연이 옅어지기 쉬운 편이라 관계를 소중히 하면 좋은 수리입니다.' },
    75: { name: '왕성격', grade: '길', s1: '온유하고 유덕하여 오래도록 평안한 흐름입니다.' },
    76: { name: '이산격', grade: '흉', s1: '흩어지기 쉬운 편이라 중심을 지키는 것이 필요한 수리입니다.' },
    77: { name: '강건격', grade: '길', s1: '굳건함으로 앞의 어려움을 넘어서는 흐름입니다.' },
    78: { name: '무력격', grade: '흉', s1: '힘이 부치기 쉬운 편이라 무리하지 않는 것이 좋은 수리입니다.' },
    79: { name: '불신격', grade: '흉', s1: '신뢰를 쌓는 데 시간이 걸리는 편이라 꾸준함이 관건인 수리입니다.' },
    80: { name: '음영격', grade: '흉', s1: '그늘이 지기 쉬운 편이라 밝은 쪽으로 방향을 잡으면 좋은 수리입니다.' },
    81: { name: '환희격', grade: '길', s1: '청룡이 하늘에 오르듯 큰 행복을 불러오는 흐름입니다.' }
  };

  var GRADE_TAIL = {
    '길': '전통 성명학에서는 이 수리를 지닌 이름을 길한 흐름으로 보는 편입니다.',
    '중길': '전통 성명학에서는 이 수리를 무난하고 안정적인 흐름으로 보는 편입니다.',
    '평': '전통 성명학에서는 이 수리를 길흉이 함께 섞인 흐름으로 보아, 마음가짐에 따라 결과가 달라질 수 있다고 풀이합니다.',
    '흉': '다만 이는 여러 전통적 해석 중 하나이니, 이름의 수리보다 살아가는 태도가 더 큰 영향을 준다고 여기시면 좋겠습니다.'
  };

  var GRADE_SCORE = { '길': 90, '중길': 70, '평': 50, '흉': 32 };

  function reduceToSuri(n) {
    var v = n;
    while (v > 81) v -= 80;
    while (v < 1) v += 80;
    return v;
  }

  function suriEntry(rawNum) {
    var n = reduceToSuri(rawNum);
    var e = SURI_TABLE[n];
    return {
      num: n,
      grade: e.grade,
      name: e.name,
      para: e.s1 + ' ' + GRADE_TAIL[e.grade]
    };
  }

  // ============================================================
  // 6. 입력 검증
  // ============================================================
  function isValidName(name) {
    return typeof name === 'string' && /^[가-힣]{2,4}$/.test(name);
  }

  // ============================================================
  // 7. 메인 분석 함수
  // ============================================================
  function analyze(name, chart) {
    if (!isValidName(name)) {
      throw new Error('이름은 한글 2~4자(성 1자 + 이름 1~3자)여야 합니다.');
    }

    var chars = name.split('');
    var decomposed = chars.map(function (ch) {
      var d = decompose(ch);
      if (!d) throw new Error('완성형 한글이 아닌 글자가 포함되어 있습니다: ' + ch);
      return d;
    });

    // ---- 7-1. syllables ----
    var syllables = chars.map(function (ch, i) {
      var d = decomposed[i];
      return {
        ch: ch,
        cho: d.cho,
        jung: d.jung,
        elements: {
          초성오행: CONSONANT_ELEMENT[d.cho],
          종성오행: d.jong ? elementOfJong(d.jong) : null
        },
        strokes: syllableStrokes(d)
      };
    });

    // ---- 7-2. soriFlow (소리오행 흐름: 초성 오행을 음절 순서대로 비교) ----
    var choChain = syllables.map(function (s) { return s.elements.초성오행; });
    var pairs = [];
    for (var i = 0; i < choChain.length - 1; i++) {
      pairs.push({ from: choChain[i], to: choChain[i + 1], rel: relationOf(choChain[i], choChain[i + 1]) });
    }
    var genCount = pairs.filter(function (p) { return p.rel === '상생'; }).length;
    var ctrlCount = pairs.filter(function (p) { return p.rel === '상극'; }).length;
    var sameCount = pairs.filter(function (p) { return p.rel === '비화'; }).length;
    var soriVerdict, soriPara;
    if (ctrlCount === 0 && genCount > 0) {
      soriVerdict = '상생 흐름';
      soriPara = '이름 소리(초성)가 오행상 서로 부딪히지 않고 순하게 이어지는 흐름입니다. 물 흐르듯 자연스럽게 어울리는 발음오행 구성으로 보입니다.';
    } else if (ctrlCount === 0 && genCount === 0) {
      soriVerdict = '비화 흐름';
      soriPara = '같은 오행이 반복되어 안정적이지만 다소 단조로울 수 있는 흐름입니다. 한 가지 기운이 뚜렷하게 이어지는 이름으로 볼 수 있습니다.';
    } else if (ctrlCount >= genCount + sameCount) {
      soriVerdict = '상극 흐름';
      soriPara = '이름 소리 사이에 기운이 부딪히는 지점이 여러 곳 있는 편입니다. 다만 이는 발음오행 한 가지 기준일 뿐이니 참고로만 봐주시면 좋겠습니다.';
    } else {
      soriVerdict = '혼합 흐름';
      soriPara = '순하게 이어지는 부분과 살짝 부딪히는 부분이 함께 있는 흐름입니다. 전체적으로는 무난하게 조화를 이루는 편으로 볼 수 있습니다.';
    }

    // ---- 7-3. suri (원형이정 4격) ----
    // 성 1자 + 이름 1~3자를 가정한다.
    // - 이름 2자(기본): 원격=이름1+이름2, 형격=성+이름1, 이격=성+이름 끝자(이름2), 정격=전체합
    // - 이름 1자: 첫/끝 구분이 없어 형격=이격=성+이름(같은 값). 원격은 그 글자 획수 그대로, 정격은 전체합.
    // - 이름 3자: 원격=이름1+이름2+이름3(이름 전체합), 형격=성+이름1, 이격=성+이름3(끝자, 이름2는
    //   형격/이격에 단독 반영되지 않고 원격·정격 합산에는 포함됨 — 여러 성명학 실무에서 채택하는 방식과 동일)
    var surnameS = syllables[0].strokes;
    var nameSyllables = syllables.slice(1); // 1~3개
    var wonRaw, hyeongRaw, iRaw, jeongRaw;
    var totalNameStrokes = nameSyllables.reduce(function (sum, s) { return sum + s.strokes; }, 0);
    if (nameSyllables.length === 1) {
      wonRaw = nameSyllables[0].strokes;
      hyeongRaw = surnameS + nameSyllables[0].strokes;
      iRaw = hyeongRaw;
    } else {
      wonRaw = totalNameStrokes;
      hyeongRaw = surnameS + nameSyllables[0].strokes;
      iRaw = surnameS + nameSyllables[nameSyllables.length - 1].strokes;
    }
    jeongRaw = surnameS + totalNameStrokes;

    var suri = {
      wonhyeong: suriEntry(wonRaw),
      hyeonggyeok: suriEntry(hyeongRaw),
      igyeok: suriEntry(iRaw),
      jeonggyeok: suriEntry(jeongRaw)
    };

    // ---- 7-4. sajuFit (chart가 있을 때만) ----
    var sajuFit = null;
    if (chart && chart.elements) {
      var ORDER = ['목', '화', '토', '금', '수'];
      var minEl = ORDER[0], minN = chart.elements[ORDER[0]] === undefined ? 0 : chart.elements[ORDER[0]];
      ORDER.forEach(function (e) {
        var v = chart.elements[e] || 0;
        if (v < minN) { minN = v; minEl = e; }
      });
      var nameElSet = {};
      syllables.forEach(function (s) {
        nameElSet[s.elements.초성오행] = true;
        if (s.elements.종성오행) nameElSet[s.elements.종성오행] = true;
      });
      var nameElements = Object.keys(nameElSet);
      var fillsLack = !!nameElSet[minEl];
      sajuFit = {
        fillsLack: fillsLack,
        lackElement: minEl,
        nameElements: nameElements,
        verdict: fillsLack ? '오행 보완' : '오행 비보완',
        para: fillsLack
          ? ('사주에서 가장 약한 오행인 \'' + minEl + '\'의 기운이 이름 소리에도 담겨 있어, 이름이 사주의 부족한 부분을 보완해주는 흐름으로 볼 수 있습니다. 부르고 쓸 때마다 그 기운을 조금씩 채워주는 이름이라고 여기시면 좋겠습니다.')
          : ('사주에서 가장 약한 오행인 \'' + minEl + '\'의 기운이 이름 소리에는 직접 담겨 있지 않은 편입니다. 이름 자체가 부족한 오행을 채워주진 않지만, 색이나 방향 등 다른 개운 방법과 함께 활용하시면 좋겠습니다.')
      };
    }

    // ---- 7-5. overall (결정적 가중 합산) ----
    var suriAvg = (GRADE_SCORE[suri.wonhyeong.grade] + GRADE_SCORE[suri.hyeonggyeok.grade] +
      GRADE_SCORE[suri.igyeok.grade] + GRADE_SCORE[suri.jeonggyeok.grade]) / 4;
    var flowBase = 55;
    var flowScore = flowBase + (genCount - ctrlCount) * 15;
    flowScore = Math.max(0, Math.min(100, flowScore));

    var score;
    if (sajuFit) {
      var fitScore = sajuFit.fillsLack ? 85 : 55;
      score = suriAvg * 0.5 + flowScore * 0.3 + fitScore * 0.2;
    } else {
      score = suriAvg * 0.6 + flowScore * 0.4;
    }
    score = Math.round(Math.max(0, Math.min(100, score)));

    var headline, overallPara;
    if (score >= 80) {
      headline = '이름의 기운이 두루 잘 어울리는 흐름입니다';
      overallPara = '수리와 소리오행이 대체로 순하게 어우러져, 전반적으로 안정적이고 힘 있는 이름으로 풀이됩니다.';
    } else if (score >= 65) {
      headline = '전반적으로 무난하고 좋은 흐름입니다';
      overallPara = '군데군데 살짝 아쉬운 지점이 있지만, 전체적으로는 순조롭게 흘러가는 이름으로 볼 수 있습니다.';
    } else if (score >= 50) {
      headline = '장단점이 함께 있는 흐름입니다';
      overallPara = '좋은 기운과 다소 조심스러운 기운이 섞여 있어, 이름 하나보다는 살아가는 태도와 함께 볼 때 더 의미가 있는 흐름입니다.';
    } else {
      headline = '조심스러운 지점이 있는 흐름입니다';
      overallPara = '전통 성명학 기준으로는 다소 아쉬운 수리가 섞여 있지만, 이는 하나의 재미 요소일 뿐 삶의 태도가 더 큰 영향을 준다고 여기시면 좋겠습니다.';
    }

    return {
      syllables: syllables,
      soriFlow: { pairs: pairs, verdict: soriVerdict, para: soriPara },
      suri: suri,
      sajuFit: sajuFit,
      overall: { score: score, headline: headline, para: overallPara }
    };
  }

  var NameReader = {
    analyze: analyze,
    isValidName: isValidName,
    // 테스트/디버깅용 내부 노출 (test.html, node 유닛테스트에서 사용)
    _internal: {
      decompose: decompose,
      isHangulSyllable: isHangulSyllable,
      CONSONANT_ELEMENT: CONSONANT_ELEMENT,
      CONSONANT_STROKES: CONSONANT_STROKES,
      VOWEL_STROKES: VOWEL_STROKES,
      COMPOUND_JONG_PARTS: COMPOUND_JONG_PARTS,
      JONG_REPRESENTATIVE: JONG_REPRESENTATIVE,
      syllableStrokes: syllableStrokes,
      SURI_TABLE: SURI_TABLE,
      reduceToSuri: reduceToSuri,
      relationOf: relationOf
    }
  };

  global.NameReader = NameReader;
  if (typeof module !== 'undefined' && module.exports) module.exports = NameReader;
})(typeof window !== 'undefined' ? window : this);
