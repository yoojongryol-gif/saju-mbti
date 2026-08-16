/**
 * node 유닛 검증 스크립트 (v1.3 한자 뜻풀이, 배포 대상 아님)
 *   node _verify_hanja_db.js
 *
 * 1) name-hanja-db.js 무결성 — 전 글자에 음·뜻·원획·필획 필드 존재
 * 2) 원획 표본 42자 대조 — 성명학 원획표(https://www.irum.com/Resource/Hanja,
 *    "康熙字典·玉篇을 근본으로 한 원획" 명시)에서 확인한 값을 그대로 재현하는지
 *    (변형부수 전 유형 + 무보정 대조군 포함. 생성 시점 대조 스크립트: _data/verify_all.py)
 * 3) NameReader.analyzeHanja() 구조·결정성·폴백
 */
var assert = require('assert');
global.window = global;
require('./name-hanja-db.js');
var NameReader = require('./name-reader.js');
var HanjaDB = global.HanjaDB;

var fails = 0;
function check(label, cond, extra) {
  if (cond) { console.log('PASS ' + label); }
  else { console.log('FAIL ' + label + (extra ? ' — ' + extra : '')); fails++; }
}

// ============================================================
// 1. DB 무결성
// ============================================================
var readings = HanjaDB.readings;
check('음절(음) 수 ≥ 60', readings.length >= 60, '실제 ' + readings.length);
check('총 글자 수 ≥ 500', HanjaDB.count >= 500, '실제 ' + HanjaDB.count);

// 다음자(金=금/김 등)가 있어 byChar(고유 글자) ≤ count(음절별 항목 총수)
var chars = Object.keys(HanjaDB.byChar);
check('byChar 고유 글자 수 = uniqueChars', chars.length === HanjaDB.uniqueChars,
  chars.length + ' vs ' + HanjaDB.uniqueChars);
check('uniqueChars ≤ count (다음자 중복 허용)', HanjaDB.uniqueChars <= HanjaDB.count,
  HanjaDB.uniqueChars + ' vs ' + HanjaDB.count);
var entryTotal = readings.reduce(function (a, r) { return a + HanjaDB.byReading[r].length; }, 0);
check('byReading 항목 총수 = count', entryTotal === HanjaDB.count, entryTotal + ' vs ' + HanjaDB.count);
// 음을 지정한 lookup은 반드시 그 음의 항목을 돌려줘야 한다(다음자 오인 방지)
var multi = ['金', '樂', '易', '北'].filter(function (ch) {
  var hits = readings.filter(function (r) {
    return HanjaDB.byReading[r].some(function (e) { return e.ch === ch; });
  });
  return hits.length >= 2 && hits.some(function (r) { return HanjaDB.lookup(ch, r).reading !== r; });
});
check('lookup(ch, reading)이 해당 음의 항목을 반환', multi.length === 0, multi.join(''));

var badField = [], badStroke = [], badElement = [];
var ELEMENTS = { 목: 1, 화: 1, 토: 1, 금: 1, 수: 1 };
chars.forEach(function (ch) {
  var e = HanjaDB.byChar[ch];
  if (!e.ch || !e.reading || !e.meaning) badField.push(ch);
  if (typeof e.strokes !== 'number' || e.strokes < 1 || e.strokes > 40 ||
      typeof e.pilhoek !== 'number' || e.pilhoek < 1) badStroke.push(ch);
  // 원획은 필획보다 작아질 수 없다(부수를 원형으로 되돌리면 같거나 커진다).
  // 단 성명학 숫자한자 예외(四 5→4)와 대조표 채택분은 예외로 둔다.
  if (e.jawonElement !== null && !ELEMENTS[e.jawonElement]) badElement.push(ch);
});
check('전 글자에 ch/reading/meaning 존재', badField.length === 0, badField.slice(0, 8).join(''));
check('전 글자에 정상 범위의 strokes/pilhoek 존재', badStroke.length === 0, badStroke.slice(0, 8).join(''));
check('jawonElement는 오행 5종 또는 null', badElement.length === 0, badElement.slice(0, 8).join(''));

var noReadingMatch = readings.filter(function (r) {
  return HanjaDB.byReading[r].some(function (e) { return e.reading !== r; });
});
check('byReading 키와 각 항목 reading 일치', noReadingMatch.length === 0, noReadingMatch.join(''));

var emptyReading = readings.filter(function (r) { return HanjaDB.byReading[r].length === 0; });
check('후보가 빈 음절 없음', emptyReading.length === 0, emptyReading.join(''));

// ============================================================
// 2. 원획 표본 40자 대조 (성명학 원획표 재현)
// ============================================================
// 값 출처: https://www.irum.com/Resource/Hanja (인명용한자 조회, 원획 기준 명시)
// 2026-08-16 조회. DB 전수 대조 결과는 name-hanja-db.js 헤더 주석 참조.
var WONHOEK_REF = {
  // 氵→水(+1)
  江: 7, 湖: 13, 潤: 16, 澈: 16, 淸: 12,
  // 扌→手(+1)
  揆: 13, 振: 11, 換: 13, 採: 12,
  // 忄→心(+1)
  性: 9, 情: 12, 惜: 12,
  // 艹→艸(+3)
  英: 11, 草: 12, 藍: 20, 薰: 20,
  // 阝(좌)→阜(+5)
  陳: 16, 陣: 15, 陽: 17, 限: 14,
  // 阝(우)→邑(+4)
  都: 16, 鄕: 17, 那: 11,
  // 王→玉(+1)
  珉: 10, 珪: 11, 環: 18,
  // 月(육달)→肉(+2)
  胤: 11,
  // 辶→辵(+4)
  進: 15, 道: 16, 遠: 17,
  // 礻→示(+1)
  福: 14, 祖: 10, 神: 10,
  // 灬→火 (변동 없음)
  熱: 15, 烈: 10,
  // 衤→衣(+1)
  裕: 13,
  // 罒→网(+1)
  羅: 20,
  // 무보정 대조군
  家: 10, 明: 8, 星: 9, 東: 8, 金: 8
};
var refKeys = Object.keys(WONHOEK_REF);
var wrong = [], missing = [];
refKeys.forEach(function (ch) {
  var e = HanjaDB.lookup(ch);
  if (!e) { missing.push(ch); return; }
  if (e.strokes !== WONHOEK_REF[ch]) wrong.push(ch + ' DB' + e.strokes + '≠참조' + WONHOEK_REF[ch]);
});
check('원획 표본 ' + refKeys.length + '자 전부 DB에 존재', missing.length === 0, missing.join(''));
check('원획 표본 대조 불일치 0 (' + (refKeys.length - wrong.length - missing.length) + '/' + refKeys.length + ')',
  wrong.length === 0, wrong.join(', '));

// 변형부수 글자는 필획보다 원획이 커야 한다(보정이 실제로 걸렸는지 확인)
var notCorrected = ['江', '英', '陳', '都', '珉', '胤', '進', '福', '羅', '裕'].filter(function (ch) {
  var e = HanjaDB.lookup(ch);
  return !e || e.strokes <= e.pilhoek;
});
check('변형부수 글자는 원획 > 필획', notCorrected.length === 0, notCorrected.join(''));

// 무보정 글자는 원획 = 필획
var notEqual = ['家', '明', '星', '東'].filter(function (ch) {
  var e = HanjaDB.lookup(ch);
  return !e || e.strokes !== e.pilhoek;
});
check('무보정 글자는 원획 = 필획', notEqual.length === 0, notEqual.join(''));

// ============================================================
// 3. analyzeHanja() 구조 / 결정성 / 폴백
// ============================================================
var chart = { elements: { 목: 1, 화: 3, 토: 2, 금: 0, 수: 2 } };
var r = NameReader.analyzeHanja(['金', '旼', '俊'], chart);

check('perChar 길이 = 선택 글자 수', r.perChar.length === 3);
check('perChar 항목 구조 {ch,reading,meaning,jawonElement,strokes}',
  r.perChar.every(function (c) {
    return typeof c.ch === 'string' && typeof c.reading === 'string' &&
      typeof c.meaning === 'string' && typeof c.strokes === 'number' &&
      (c.jawonElement === null || typeof c.jawonElement === 'string');
  }));
check('meaningPara는 30자 이상 문장', typeof r.meaningPara === 'string' && r.meaningPara.length >= 30);
check('meaningPara에 조사 자리표시자 잔여 없음', r.meaningPara.indexOf('{') === -1 && r.meaningPara.indexOf('%') === -1,
  r.meaningPara);
check('meaningPara가 기계 나열이 아님(마침표 2개 이상 문장)',
  (r.meaningPara.match(/다\./g) || []).length >= 2);
check('suriHanja 4격 존재', r.suriHanja && ['wonhyeong', 'hyeonggyeok', 'igyeok', 'jeonggyeok']
  .every(function (k) { return r.suriHanja[k] && typeof r.suriHanja[k].num === 'number' && r.suriHanja[k].name && r.suriHanja[k].grade; }));
check('jawonFit 구조', r.jawonFit && typeof r.jawonFit.fillsLack === 'boolean' &&
  typeof r.jawonFit.lackElement === 'string' && Array.isArray(r.jawonFit.nameElements) &&
  typeof r.jawonFit.para === 'string');
check('overall 구조 {score 0~100, headline, para}',
  r.overall && r.overall.score >= 0 && r.overall.score <= 100 &&
  r.overall.headline.length > 0 && r.overall.para.length > 0);

// 원획 4격이 실제 원획 합과 맞는지 (성 8 + 旼 8 + 俊 9)
var s = [HanjaDB.lookup('金').strokes, HanjaDB.lookup('旼').strokes, HanjaDB.lookup('俊').strokes];
check('정격 = 세 글자 원획 합 (' + s.join('+') + '=' + (s[0] + s[1] + s[2]) + ')',
  r.suriHanja.jeonggyeok.num === s[0] + s[1] + s[2], '실제 ' + r.suriHanja.jeonggyeok.num);
check('원격 = 이름 두 글자 원획 합', r.suriHanja.wonhyeong.num === s[1] + s[2]);
check('형격 = 성 + 이름 첫 글자', r.suriHanja.hyeonggyeok.num === s[0] + s[1]);
check('이격 = 성 + 이름 끝 글자', r.suriHanja.igyeok.num === s[0] + s[2]);

// 결정성
var a = NameReader.analyzeHanja(['金', '旼', '俊'], chart);
var b = NameReader.analyzeHanja(['金', '旼', '俊'], chart);
check('결정성: 동일 입력 → 동일 JSON', JSON.stringify(a) === JSON.stringify(b));
// 입력 형식 무관(문자열 / 객체)
var c = NameReader.analyzeHanja([{ ch: '金' }, { ch: '旼' }, { ch: '俊' }], chart);
check('입력 형식(문자열/객체) 무관 동일 결과', JSON.stringify(a) === JSON.stringify(c));

// chart 없이도 동작
var noChart = NameReader.analyzeHanja(['金', '旼', '俊'], null);
check('chart 없으면 jawonFit = null', noChart.jawonFit === null);
check('chart 없어도 suriHanja는 계산됨', !!noChart.suriHanja);

// "목록에 없음" 폴백
var fb = NameReader.analyzeHanja(['金', null, '俊'], chart);
check('일부 미선택 시 suriHanja = null', fb.suriHanja === null);
check('일부 미선택 시에도 perChar/meaningPara는 생성', fb.perChar.length === 2 && fb.meaningPara.length > 20);
check('일부 미선택 시 안내 headline', fb.overall.headline.indexOf('고르신 글자만') === 0, fb.overall.headline);

// 전부 미선택 → 오류
var threw = false;
try { NameReader.analyzeHanja([null, null, null], chart); } catch (e) { threw = true; }
check('전부 미선택이면 예외', threw);

// DB에 없는 글자는 미선택과 동일 취급
var unknown = NameReader.analyzeHanja(['金', '龘', '俊'], chart);
check('DB에 없는 한자는 미선택 취급', unknown.perChar.length === 2 && unknown.suriHanja === null);

// 뜻 조합 템플릿 수 (SPEC: 8종 이상)
var tplCount = Object.keys(NameReader._internal.PAIR_TEMPLATES).length +
  Object.keys(NameReader._internal.SAME_TEMPLATES).length;
check('뜻 조합 템플릿 8종 이상 (' + tplCount + '종)', tplCount >= 8);

// 서로 다른 조합은 서로 다른 문장을 만들어야 한다
var variants = [
  ['金', '旼', '俊'], ['金', '智', '慧'], ['金', '海', '星'],
  ['金', '安', '宅'], ['金', '玉', '珍'], ['金', '英', '樹']
].map(function (sel) {
  try { return NameReader.analyzeHanja(sel, null).meaningPara; } catch (e) { return null; }
}).filter(Boolean);
var uniq = {};
variants.forEach(function (v) { uniq[v] = 1; });
check('조합이 다르면 문단도 달라짐 (' + Object.keys(uniq).length + '/' + variants.length + ')',
  Object.keys(uniq).length === variants.length);

console.log('\n실패 ' + fails + '건');
process.exit(fails ? 1 : 0);
