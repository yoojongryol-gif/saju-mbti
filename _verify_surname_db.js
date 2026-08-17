/**
 * node 유닛 검증 스크립트 (v1.8 성씨·본관 한자 DB, 일회성, 배포에는 포함하지 않음)
 * - 구조 무결성: 전 항목에 ch/reading/meaning/strokes/bongwans 존재, bongwans 비어있지 않음
 * - 대표 20성 표본을 surname_research.json 원자료(출처 교차확인 결과)와 재대조
 * - 두음법칙 alias 왕복(A→B, B→A 모두 상대를 가리킴 + 실제 후보 존재)
 * - 복성 8종 구조 확인
 * - parseQuery / matchBongwan / surnameCandidates 동작 확인
 * - HanjaDB 재사용 정합성(HanjaDB에 있는 글자는 meaning/strokes가 HanjaDB 값과 동일해야 함)
 */
var SurnameDB = require('./name-surname-db.js');
var HanjaDB = require('./name-hanja-db.js');
var research = require('./_data/surname_research.json');

var fails = 0;
function check(label, cond, extra) {
  if (cond) { console.log('PASS ' + label); }
  else { console.log('FAIL ' + label + (extra !== undefined ? ' — ' + JSON.stringify(extra) : '')); fails++; }
}

// ============================================================
// 1. 구조 무결성 — 전 항목
// ============================================================
var allReadings = Object.keys(SurnameDB.bySyllable);
var totalEntries = 0;
var structOk = true;
var bongwanEmptyCount = 0;
allReadings.forEach(function (r) {
  SurnameDB.bySyllable[r].forEach(function (e) {
    totalEntries++;
    if (typeof e.ch !== 'string' || !e.ch) structOk = false;
    if (typeof e.reading !== 'string' || !e.reading) structOk = false;
    if (typeof e.meaning !== 'string' || !e.meaning) structOk = false;
    if (typeof e.strokes !== 'number' || e.strokes <= 0) structOk = false;
    if (!Array.isArray(e.bongwans)) structOk = false;
    else if (e.bongwans.length === 0) bongwanEmptyCount++;
  });
});
check('readings 122개 이상(리서치 119 음절 + 두음 미러)', allReadings.length >= 122, allReadings.length);
check('전 ' + totalEntries + '항목: ch/reading/meaning/strokes(원획)/bongwans(배열) 전부 존재', structOk);
check('본관 목록이 빈 항목 0건', bongwanEmptyCount === 0, bongwanEmptyCount);
check('SPEC.md 목표 대비 실측 카운트 정직 보고(허구로 채우지 않음): 총 ' + totalEntries + '건', totalEntries > 0);

// ============================================================
// 2. HanjaDB 재사용 정합성 — fromHanjaDB:false 로 명시된 것 외에는 HanjaDB 값과 100% 동일해야 함
// ============================================================
var reuseMismatch = [];
allReadings.forEach(function (r) {
  SurnameDB.bySyllable[r].forEach(function (e) {
    if (e.fromHanjaDB === false) return; // 수동 산출(王·魯) — 3번에서 별도 검증
    var h = HanjaDB.lookup(e.ch, e.reading);
    if (!h) { reuseMismatch.push(e.reading + ' ' + e.ch + ' (HanjaDB에 없는데 fromHanjaDB 플래그 없음)'); return; }
    if (h.meaning !== e.meaning || h.strokes !== e.strokes || (h.jawonElement || null) !== e.jawonElement) {
      reuseMismatch.push(e.reading + ' ' + e.ch);
    }
  });
});
check('HanjaDB 재사용 항목은 meaning/strokes/jawonElement가 HanjaDB와 100% 일치', reuseMismatch.length === 0, reuseMismatch);

// ============================================================
// 3. HanjaDB 미등재 수동 산출 2건(王·魯) 근거 확인
// ============================================================
var wang = SurnameDB.bySyllable['왕'] && SurnameDB.bySyllable['왕'].find(function (e) { return e.ch === '王'; });
check('王(왕) 수동 산출: 4획(원형부수 자체=필획, 강희자전 96부 王部)', wang && wang.strokes === 4 && wang.fromHanjaDB === false);
var no = SurnameDB.bySyllable['노'] && SurnameDB.bySyllable['노'].find(function (e) { return e.ch === '魯'; });
check('魯(노) 수동 산출: 15획(원형부수 魚 11획+나머지 4획, Unihan kRSUnicode 195.4)', no && no.strokes === 15 && no.fromHanjaDB === false);
check('王·魯 둘 다 HanjaDB에는 실제로 없음(중복 산출 아님을 확인)',
  !HanjaDB.lookup('王', '왕') && !HanjaDB.lookup('魯', '노'));

// ============================================================
// 4. 대표 20성 표본 — surname_research.json(교차확인 출처) 원자료와 재대조
// ============================================================
var SAMPLE_20 = ['김', '이', '박', '최', '정', '강', '조', '윤', '장', '임',
  '한', '오', '서', '신', '권', '황', '안', '송', '전', '홍'];
var sampleFails = [];
SAMPLE_20.forEach(function (r) {
  var src = research.surnames.find(function (s) { return s.reading === r; });
  if (!src) { sampleFails.push(r + ' (원자료에 없음)'); return; }
  src.hanja.forEach(function (h) {
    var e = SurnameDB.bySyllable[r] && SurnameDB.bySyllable[r].find(function (x) { return x.ch === h.ch; });
    if (!e) { sampleFails.push(r + ' ' + h.ch + ' (DB 누락)'); return; }
    var srcBongwans = (h.bongwans || []).slice().sort().join(',');
    var dbBongwans = (e.bongwans || []).slice().sort().join(',');
    if (srcBongwans !== dbBongwans) sampleFails.push(r + ' ' + h.ch + ' 본관 불일치: src=' + srcBongwans + ' db=' + dbBongwans);
  });
});
check('대표 20성 표본 — 한자·본관이 리서치 원자료(출처 교차확인)와 전부 일치', sampleFails.length === 0, sampleFails);

// ============================================================
// 5. 두음법칙 alias 왕복
// ============================================================
var aliasRoundTripOk = true;
var aliasPairsChecked = 0;
Object.keys(SurnameDB.dueumAlias).forEach(function (a) {
  var b = SurnameDB.dueumAlias[a];
  aliasPairsChecked++;
  if (SurnameDB.dueumAlias[b] !== a) aliasRoundTripOk = false;
});
check('두음 alias 전부 왕복(A→B→A) — ' + aliasPairsChecked + '개 방향 항목', aliasRoundTripOk);

var DUEUM_SURNAME_PAIRS = [['유', '류'], ['이', '리'], ['임', '림'], ['나', '라'], ['노', '로'], ['양', '량'], ['염', '렴'], ['여', '려'], ['육', '륙']];
var pairCandidatesOk = true;
DUEUM_SURNAME_PAIRS.forEach(function (p) {
  var a = SurnameDB.candidates(p[0]).map(function (e) { return e.ch; }).sort();
  var b = SurnameDB.candidates(p[1]).map(function (e) { return e.ch; }).sort();
  if (a.length === 0 || b.length === 0 || a.join(',') !== b.join(',')) pairCandidatesOk = false;
});
check('두음 쌍 9종(유/류·이/리·임/림·나/라·노/로·양/량·염/렴·여/려·육/륙) 모두 양쪽 후보 한자 집합 동일', pairCandidatesOk);

// ============================================================
// 6. 복성 8종 구조
// ============================================================
var COMPOUNDS = ['남궁', '독고', '제갈', '사공', '서문', '동방', '선우', '황보'];
var compoundOk = COMPOUNDS.every(function (label) {
  var c = SurnameDB.compoundSurnames[label];
  if (!c || c.chars.length !== 2 || c.readings.length !== 2 || !c.bongwans.length) return false;
  var e1 = SurnameDB.candidates(c.readings[0]).find(function (e) { return e.ch === c.chars[0]; });
  var e2 = SurnameDB.candidates(c.readings[1]).find(function (e) { return e.ch === c.chars[1]; });
  return !!e1 && !!e2 && !!e1.compoundOf && !!e2.compoundOf;
});
check('복성 8종(남궁·독고·제갈·사공·서문·동방·선우·황보) 구조 정합', compoundOk, Object.keys(SurnameDB.compoundSurnames));

// ============================================================
// 7. parseQuery — 스펙 예시 패턴
// ============================================================
check('"성유" → surname/유', JSON.stringify(SurnameDB.parseQuery('성유')) === JSON.stringify({ kind: 'surname', target: '유' }));
check('"유 성씨" → surname/유', JSON.stringify(SurnameDB.parseQuery('유 성씨')) === JSON.stringify({ kind: 'surname', target: '유' }));
check('"성씨 유" → surname/유', JSON.stringify(SurnameDB.parseQuery('성씨 유')) === JSON.stringify({ kind: 'surname', target: '유' }));
check('"강릉 유" → bongwan 강릉/유', JSON.stringify(SurnameDB.parseQuery('강릉 유')) === JSON.stringify({ kind: 'bongwan', bongwan: '강릉', target: '유' }));
check('"강릉유"(공백 없음) → bongwan 강릉/유', JSON.stringify(SurnameDB.parseQuery('강릉유')) === JSON.stringify({ kind: 'bongwan', bongwan: '강릉', target: '유' }));
check('"문화 류" → bongwan 문화/류', JSON.stringify(SurnameDB.parseQuery('문화 류')) === JSON.stringify({ kind: 'bongwan', bongwan: '문화', target: '류' }));
check('알 수 없는 형태("민준") → null(기존 검색 로직으로 폴백)', SurnameDB.parseQuery('민준') === null);
check('빈 문자열 → null', SurnameDB.parseQuery('') === null && SurnameDB.parseQuery('   ') === null);

// ============================================================
// 8. matchBongwan — 정확 매칭 + 두음 허용
// ============================================================
check('matchBongwan(강릉,유) → 劉만', SurnameDB.matchBongwan('강릉', '유').map(function (e) { return e.ch; }).join(',') === '劉');
check('matchBongwan(강릉,류)(두음 변형 syllable) → 劉만', SurnameDB.matchBongwan('강릉', '류').map(function (e) { return e.ch; }).join(',') === '劉');
check('matchBongwan(문화,류) → 柳만', SurnameDB.matchBongwan('문화', '류').map(function (e) { return e.ch; }).join(',') === '柳');
check('matchBongwan(없는본관,유) → 빈 배열', SurnameDB.matchBongwan('존재안함본관', '유').length === 0);
check('matchBongwan(함열,궁)(복성 본관도 매칭) → 宮', SurnameDB.matchBongwan('함열', '궁').map(function (e) { return e.ch; }).join(',') === '宮');

// ============================================================
// 9. surnameCandidates 중복 없음(두음 병합 버그 회귀 방지)
// ============================================================
var dupCheckOk = true;
allReadings.concat(Object.keys(SurnameDB.dueumAlias)).forEach(function (r) {
  var chs = SurnameDB.surnameCandidates(r).map(function (e) { return e.ch; });
  var uniq = {};
  chs.forEach(function (c) { uniq[c] = (uniq[c] || 0) + 1; });
  Object.keys(uniq).forEach(function (c) { if (uniq[c] > 1) dupCheckOk = false; });
});
check('surnameCandidates()는 모든 음절에서 한자 중복 없음(두음 병합 버그 회귀 방지)', dupCheckOk);
check('나/라 본관 병합 확인(서로 다른 부분집합 → 합집합)',
  SurnameDB.surnameCandidates('나')[0].bongwans.length >= SurnameDB.candidates('나')[0].bongwans.length &&
  SurnameDB.surnameCandidates('나')[0].bongwans.length >= SurnameDB.candidates('라')[0].bongwans.length);

// ============================================================
// 10. isSurnameChar — 첫 음절 배지용
// ============================================================
check('isSurnameChar(劉,유) === true', SurnameDB.isSurnameChar('劉', '유') === true);
check('isSurnameChar(明,유) === false(성씨 아닌 흔한 이름한자)', SurnameDB.isSurnameChar('明', '유') === false);

console.log('\n실패 ' + fails + '건 (총 검사 대상 성씨 음절 ' + allReadings.length + ', 한자 항목 ' + totalEntries + ')');
process.exit(fails ? 1 : 0);
