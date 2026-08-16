/**
 * node 유닛 검증 스크립트 (v1.4 로또 번호, 일회성, 배포에는 포함하지 않음)
 * - 결정성(같은 chart+날짜 = 같은 번호)
 * - 범위(1~45)·중복 없음·오름차순 정렬
 * - 요일별 show 판정(월/금/토/일)
 * - 가중 로직: 부족 오행 대역이 실제로 더 자주 뽑히는지 통계 표본(chart 20종)
 */
require('./content-db.js');
var ContentDB = global.ContentDB;
var assert = require('assert');

var fails = 0;
function check(label, cond, extra) {
  if (cond) { console.log('PASS ' + label); }
  else { console.log('FAIL ' + label + (extra ? ' — ' + extra : '')); fails++; }
}

function mkChart(dayMaster, elements, strength, seedTag) {
  var GAN = ['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계'];
  var JI = ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해'];
  // seedTag 로 필러를 살짝 변주해 chart 마다 다른 시드가 나오게 함
  function g(i) { return GAN[i % 10]; }
  function j(i) { return JI[i % 12]; }
  return {
    dayMaster: dayMaster,
    strength: strength || '중화',
    pillars: {
      year: { gan: g(seedTag), ji: j(seedTag) },
      month: { gan: g(seedTag + 2), ji: j(seedTag + 3) },
      day: { gan: dayMaster, ji: j(seedTag + 5) },
      hour: { gan: g(seedTag + 7), ji: j(seedTag + 8) }
    },
    specials: [],
    elements: elements
  };
}

// ============================================================
// 1. 결정성 + 범위/중복/정렬
// ============================================================

var chartA = mkChart('갑', { 목: 1, 화: 1, 토: 1, 금: 1, 수: 4 }, '신약', 1);

var r1 = ContentDB.lotto(chartA, '2026-08-17'); // 월요일
var r2 = ContentDB.lotto(chartA, '2026-08-17');
check('결정성: 동일 chart+날짜 → 동일 numbers', JSON.stringify(r1.numbers) === JSON.stringify(r2.numbers));
check('결정성: 동일 chart+날짜 → 동일 para', r1.para === r2.para);

var r3 = ContentDB.lotto(chartA, '2026-08-18'); // 화요일 (날짜만 다름)
check('날짜가 다르면 번호가 달라짐(최소 1개)', JSON.stringify(r1.numbers) !== JSON.stringify(r3.numbers));

for (var d = 17; d <= 21; d++) { // 8/17(월)~8/21(금)
  var rr = ContentDB.lotto(chartA, '2026-08-' + d);
  check('numbers 길이=6 (2026-08-' + d + ')', rr.numbers.length === 6);
  var uniq = {}; var dup = false;
  rr.numbers.forEach(function (n) { if (uniq[n]) dup = true; uniq[n] = true; });
  check('중복 없음 (2026-08-' + d + ')', !dup);
  var sorted = rr.numbers.every(function (n, i, arr) { return i === 0 || arr[i - 1] < n; });
  check('오름차순 정렬 (2026-08-' + d + ')', sorted);
  var inRange = rr.numbers.every(function (n) { return n >= 1 && n <= 45 && Number.isInteger(n); });
  check('범위 1~45 정수 (2026-08-' + d + ')', inRange);
  check('para 는 1문장(비어있지 않은 문자열) (2026-08-' + d + ')', typeof rr.para === 'string' && rr.para.length > 0);
}

// ============================================================
// 2. 요일별 show 판정 — 2026-08-17(월)/2026-08-21(금)/2026-08-15(토)/2026-08-16(일)
// ============================================================
check('월요일(2026-08-17) show=true', ContentDB.lotto(chartA, '2026-08-17').show === true);
check('금요일(2026-08-21) show=true', ContentDB.lotto(chartA, '2026-08-21').show === true);
check('토요일(2026-08-15) show=false', ContentDB.lotto(chartA, '2026-08-15').show === false);
check('일요일(2026-08-16) show=false', ContentDB.lotto(chartA, '2026-08-16').show === false);
// 요일 헬퍼 직접 검증(내부 노출)
check('_internal.lottoIsWeekday 월=true', ContentDB._internal.lottoIsWeekday('2026-08-17') === true);
check('_internal.lottoIsWeekday 토=false', ContentDB._internal.lottoIsWeekday('2026-08-15') === false);
check('_internal.lottoIsWeekday 일=false', ContentDB._internal.lottoIsWeekday('2026-08-16') === false);

// ============================================================
// 3. 에러 케이스
// ============================================================
check('chart 없으면 throw', (function () { try { ContentDB.lotto(null, '2026-08-17'); return false; } catch (e) { return true; } })());
check('날짜 형식 오류면 throw', (function () { try { ContentDB.lotto(chartA, '2026/08/17'); return false; } catch (e) { return true; } })());

// ============================================================
// 4. 가중 로직 통계 검증 — chart 20종 × 평일 여러 날짜 표본, 부족 오행 대역이 더 자주 뽑히는지
//    LOTTO_BAND: 목1~9(9개)/화10~18(9개)/토19~27(9개)/금28~36(9개)/수37~45(9개) — 대역별 폭 동일(9)
// ============================================================
var LOTTO_BAND = { 목: [1, 9], 화: [10, 18], 토: [19, 27], 금: [28, 36], 수: [37, 45] };
function bandOf(n) {
  var els = ['목', '화', '토', '금', '수'];
  for (var i = 0; i < els.length; i++) {
    var b = LOTTO_BAND[els[i]];
    if (n >= b[0] && n <= b[1]) return els[i];
  }
  return null;
}

var ELEMENTS5 = ['목', '화', '토', '금', '수'];
var totalLackHits = 0, totalHits = 0;
var perElementLackFreq = {}; // 부족 오행일 때 그 대역이 뽑힌 비율 누적

function pad2(n) { return (n < 10 ? '0' : '') + n; }

for (var c = 0; c < 20; c++) {
  // 오행 중 하나만 크게 부족하게 설계 (weakestElement 가 명확히 그 오행을 고르도록)
  var lackEl = ELEMENTS5[c % 5];
  var elements = { 목: 3, 화: 3, 토: 3, 금: 3, 수: 3 };
  elements[lackEl] = 0; // 확실한 최소값
  var dm = ['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계'][c % 10];
  var monthNum = (c % 9) + 1; // 1~9월로 표본 날짜를 분산
  var chart = mkChart(dm, elements, '중화', c + 100);

  var lackBandHitCount = 0, totalNumbersDrawn = 0;
  for (var dd = 1; dd <= 28; dd++) {
    var dateStr = '2026-' + pad2(monthNum) + '-' + pad2(dd);
    var res = ContentDB.lotto(chart, dateStr);
    res.numbers.forEach(function (n) {
      totalNumbersDrawn++;
      if (bandOf(n) === lackEl) lackBandHitCount++;
    });
  }
  var freq = lackBandHitCount / totalNumbersDrawn; // 부족 오행 대역이 뽑힌 비율
  perElementLackFreq[lackEl] = (perElementLackFreq[lackEl] || []).concat([freq]);
  totalLackHits += lackBandHitCount;
  totalHits += totalNumbersDrawn;
}

var overallLackFreq = totalLackHits / totalHits;
var baselineFreq = 1 / 5; // 가중치 없으면 5개 대역 균등 → 20%
console.log('  부족 오행 대역 적중 비율(표본 20종 chart): ' + (overallLackFreq * 100).toFixed(1) + '% (기준선 균등 ' + (baselineFreq * 100).toFixed(1) + '%)');
check('가중 로직: 부족 오행 대역 적중 비율이 균등 기준선(20%)보다 유의하게 높음(>=26%)', overallLackFreq >= 0.26, overallLackFreq);

// ============================================================
// 5. 일진 오행 계산이 SajuEngine 의 JDN 공식과 일치하는지(가능하면) 교차검증
// ============================================================
try {
  var SajuEngine = require('./saju-engine.js');
  var testChart = mkChart('갑', { 목: 2, 화: 2, 토: 2, 금: 2, 수: 2 }, '중화', 1);
  var todayResult = SajuEngine.today(testChart, '2026-08-17');
  var GAN_ELEMENT = { 갑: '목', 을: '목', 병: '화', 정: '화', 무: '토', 기: '토', 경: '금', 신: '금', 임: '수', 계: '수' };
  var expectedIljinEl = GAN_ELEMENT[todayResult.iljin.gan];
  var actualIljinEl = ContentDB._internal.lottoIljinElement('2026-08-17');
  check('lottoIljinElement 이 SajuEngine.today() 의 일진 오행과 일치', expectedIljinEl === actualIljinEl,
    'expected ' + expectedIljinEl + ' actual ' + actualIljinEl);
} catch (e) {
  console.log('SKIP SajuEngine 교차검증(로드 실패): ' + e.message);
}

console.log('');
console.log(fails === 0 ? ('ALL PASS (lotto)') : (fails + ' FAILED (lotto)'));
process.exit(fails === 0 ? 0 : 1);
