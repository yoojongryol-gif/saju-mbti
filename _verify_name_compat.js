/**
 * node 유닛 검증 스크립트 (v1.5 궁합 이름풀이, 일회성, 배포에는 포함하지 않음)
 * - 구조 검사(elementsA/B, nameRel, giveTake, suriPair, score/headline/para)
 * - 결정성(같은 입력 → 같은 출력)
 * - 상생상극 판정 6종 (합성 이름으로 오행 집합을 직접 구성해 경로를 정확히 겨냥)
 * - chart null 분기(양쪽 null → giveTake=[])
 * - giveTake 방향성(A→B / B→A 각각 chart 있는 쪽만 생성, fills 정합성)
 */
var NameReader = require('./name-reader.js');

var fails = 0;
function check(label, cond, extra) {
  if (cond) { console.log('PASS ' + label); }
  else { console.log('FAIL ' + label + (extra !== undefined ? ' — ' + JSON.stringify(extra) : '')); fails++; }
}

// ---- 합성 음절 생성기: 초성만 지정, 중성=ㅏ, 종성 없음 → 그 음절의 초성오행 하나만 갖게 만든다 ----
var CHO_LIST = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
function mk(choChar) {
  var choIdx = CHO_LIST.indexOf(choChar);
  if (choIdx < 0) throw new Error('unknown cho ' + choChar);
  var jungIdx = 0; // ㅏ
  var jongIdx = 0; // 종성 없음
  var code = (choIdx * 21 + jungIdx) * 28 + jongIdx;
  return String.fromCharCode(0xAC00 + code);
}
// 오행별 대표 초성 하나씩(전통 소리오행 규약, name-reader.js CONSONANT_ELEMENT와 동일 매핑)
var CHO_OF = { 목: 'ㄱ', 화: 'ㄴ', 토: 'ㅇ', 금: 'ㅅ', 수: 'ㅁ' };
check('CHO_OF 매핑이 실제 CONSONANT_ELEMENT와 일치',
  Object.keys(CHO_OF).every(function (el) { return NameReader._internal.CONSONANT_ELEMENT[CHO_OF[el]] === el; }));

// 두 글자 모두 같은 오행 → 그 이름의 오행 집합은 단일 원소
function name2(el) { return mk(CHO_OF[el]) + mk(CHO_OF[el]); }
// 서로 다른 오행 두 글자로 이루어진 이름(첫 글자가 순서상 먼저 등장 → order[0])
function nameOf(el1, el2) { return mk(CHO_OF[el1]) + mk(CHO_OF[el2]); }

// ============================================================
// 1. 구조 검사
// ============================================================
var r1 = NameReader.compatNames(name2('목'), name2('화'), null, null);
check('elementsA/B 구조', typeof r1.elementsA === 'object' && Array.isArray(r1.elementsA.elements) &&
  typeof r1.elementsA.dominant === 'string' && typeof r1.elementsB === 'object');
check('nameRel 구조 {rel,para}', typeof r1.nameRel.rel === 'string' && typeof r1.nameRel.para === 'string');
check('giveTake는 배열', Array.isArray(r1.giveTake));
check('suriPair 구조 {aScore,bScore,para}',
  typeof r1.suriPair.aScore === 'number' && typeof r1.suriPair.bScore === 'number' && typeof r1.suriPair.para === 'string');
check('score 0~100 범위', r1.score >= 0 && r1.score <= 100, r1.score);
check('headline/para 문자열', typeof r1.headline === 'string' && typeof r1.para === 'string');

// ============================================================
// 2. 결정성
// ============================================================
var chartX = { elements: { 목: 0, 화: 3, 토: 2, 금: 1, 수: 2 } };
var chartY = { elements: { 목: 3, 화: 0, 토: 2, 금: 2, 수: 1 } };
var d1 = NameReader.compatNames('김민준', '이서연', chartX, chartY);
var d2 = NameReader.compatNames('김민준', '이서연', { elements: { 목: 0, 화: 3, 토: 2, 금: 1, 수: 2 } }, { elements: { 목: 3, 화: 0, 토: 2, 금: 2, 수: 1 } });
check('결정성: 동일 입력(다른 객체 인스턴스) → 동일 JSON', JSON.stringify(d1) === JSON.stringify(d2));

// ============================================================
// 3. 상생상극 판정 6종
// ============================================================
// 3-1. 상생(A→B): A=목(단일), B=화(단일) → GEN_NEXT[목]=화
var c1 = NameReader.compatNames(name2('목'), name2('화'), null, null);
check('케이스1 상생(A→B): 목→화', c1.nameRel.rel === '상생(A→B)', c1.nameRel.rel);

// 3-2. 상생(B→A): A=화, B=목 (케이스1의 인자만 뒤집음)
var c2 = NameReader.compatNames(name2('화'), name2('목'), null, null);
check('케이스2 상생(B→A): 목→화 이지만 인자가 반대라 B→A', c2.nameRel.rel === '상생(B→A)', c2.nameRel.rel);

// 3-3. 상극: A=목(단일), B=토(단일) → CTRL_NEXT[목]=토
var c3 = NameReader.compatNames(name2('목'), name2('토'), null, null);
check('케이스3 상극(정방향, 목극토)', c3.nameRel.rel === '상극', c3.nameRel.rel);

// 3-4. 상극(반대 방향 경로): A=토, B=목 → CTRL_NEXT[목]=토 는 B(목)→A(토) 방향에서 성립
var c4 = NameReader.compatNames(name2('토'), name2('목'), null, null);
check('케이스4 상극(역방향 경로에서도 상극으로 판정)', c4.nameRel.rel === '상극', c4.nameRel.rel);

// 3-5. 비화: 서로 다른 글자(ㄱ vs ㅋ)지만 둘 다 목
var c5 = NameReader.compatNames(mk('ㄱ') + mk('ㄱ'), mk('ㅋ') + mk('ㅋ'), null, null);
check('케이스5 비화: 목(ㄱ) vs 목(ㅋ)', c5.nameRel.rel === '비화', c5.nameRel.rel);

// 3-6. 상호상생: A={화,금}, B={토,수} → 화→토(A generates B) & 토→금(B generates A)
var c6 = NameReader.compatNames(nameOf('화', '금'), nameOf('토', '수'), null, null);
check('케이스6 상호상생: {화,금}×{토,수}', c6.nameRel.rel === '상호상생', c6.nameRel.rel);
check('케이스6 elementsA.elements = [화,금]', JSON.stringify(c6.elementsA.elements) === JSON.stringify(['화', '금']), c6.elementsA.elements);
check('케이스6 elementsB.elements = [토,수]', JSON.stringify(c6.elementsB.elements) === JSON.stringify(['토', '수']), c6.elementsB.elements);

// ============================================================
// 4. chart null 분기
// ============================================================
var c7 = NameReader.compatNames('김민준', '이서연', null, null);
check('chart 둘 다 null → giveTake = []', Array.isArray(c7.giveTake) && c7.giveTake.length === 0);

// ============================================================
// 5. giveTake 방향성
// ============================================================
// chartB만 있을 때 → giveTake는 A→B 1건만
var lackChartB = { elements: { 목: 0, 화: 3, 토: 3, 금: 3, 수: 3 } }; // 목이 최소
var c8 = NameReader.compatNames(name2('목'), '이서연', null, lackChartB);
check('chartB만 있으면 giveTake 1건, dir=A→B', c8.giveTake.length === 1 && c8.giveTake[0].dir === 'A→B', c8.giveTake);
check('giveTake A→B: nameA가 목(木) 소리를 갖고 있으면 fills=true', c8.giveTake[0].fills === true && c8.giveTake[0].element === '목');

// chartA만 있을 때 → giveTake는 B→A 1건만
var lackChartA = { elements: { 목: 3, 화: 3, 토: 3, 금: 0, 수: 3 } }; // 금이 최소
var c9 = NameReader.compatNames('이서연', name2('금'), lackChartA, null);
check('chartA만 있으면 giveTake 1건, dir=B→A', c9.giveTake.length === 1 && c9.giveTake[0].dir === 'B→A', c9.giveTake);
check('giveTake B→A: nameB가 금(金) 소리를 갖고 있으면 fills=true', c9.giveTake[0].fills === true && c9.giveTake[0].element === '금');

// 둘 다 있을 때 → 2건, fills=false 케이스도 확인(부족오행을 이름이 못 채우는 경우)
var c10 = NameReader.compatNames(name2('목'), name2('화'), lackChartA, lackChartB);
check('chart 둘 다 있으면 giveTake 2건', c10.giveTake.length === 2, c10.giveTake);
var gtAtoB = c10.giveTake.filter(function (g) { return g.dir === 'A→B'; })[0];
var gtBtoA = c10.giveTake.filter(function (g) { return g.dir === 'B→A'; })[0];
check('A→B 존재 & 목 소리 보유 → fills=true (chartB 최소오행=목)', gtAtoB && gtAtoB.fills === true && gtAtoB.element === '목');
check('B→A 존재 & nameB(화)는 금 소리 없음 → fills=false (chartA 최소오행=금)', gtBtoA && gtBtoA.fills === false && gtBtoA.element === '금');

// ============================================================
// 6. 입력 검증
// ============================================================
check('nameA 1자(무효) → throw', (function () {
  try { NameReader.compatNames('김', '이서연', null, null); return false; } catch (e) { return true; }
})());
check('nameB 무효(영문 혼입) → throw', (function () {
  try { NameReader.compatNames('김민준', 'ab', null, null); return false; } catch (e) { return true; }
})());

// ============================================================
// 7. 기존 함수(analyze/analyzeHanja) 비파괴 확인 — 회귀
// ============================================================
var reg = NameReader.analyze('김민준', null);
check('회귀: analyze() 정상 동작 유지', reg && reg.overall && typeof reg.overall.score === 'number');

console.log('\n총 실패: ' + fails);
process.exit(fails > 0 ? 1 : 0);
