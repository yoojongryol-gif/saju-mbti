/**
 * _verify_hanja_deep.js — v1.9 한자 풀이 심화 유닛 테스트 (배포 대상 아님)
 *   node _verify_hanja_deep.js
 *
 * 검증 범위
 *   ① name-hanja-db.js 파자 사전 구조(components/radicals/radForms/stories/breakdown)
 *   ② NameReader.analyzeHanja 신규 필드(breakdown/yinYang/samwon) 구조 + 기존 필드 무회귀
 *   ③ 음양 배열 공식 케이스 (홀=양/짝=음, 순양·순음 판정)
 *   ④ 삼원오행 공식 케이스 (천격=성 획수, 인격=성+이름첫자, 지격=이름첫자+끝자,
 *      끝자리 1·2 목 / 3·4 화 / 5·6 토 / 7·8 금 / 9·0 수)
 *   ⑤ 결정성(같은 입력 = 같은 출력)
 *   ⑥ 어원 허구 금지 가드: 파자 서사에 등장하는 한자는 전부 실제 구성요소여야 한다
 */
global.window = global;
var HanjaDB = require('./name-hanja-db.js');
require('./name-reader.js');
var NameReader = global.NameReader;

var fails = 0, checks = 0;
function check(label, cond, extra) {
  checks++;
  if (cond) console.log('PASS ' + label);
  else { console.log('FAIL ' + label + (extra ? ' — ' + extra : '')); fails++; }
}

// ============================================================
// ① 파자 사전 구조
// ============================================================
check('HanjaDB 버전 1.9', HanjaDB.version === '1.9', HanjaDB.version);
check('components 사전 500개 이상', Object.keys(HanjaDB.components).length >= 500,
  String(Object.keys(HanjaDB.components).length));
check('radicals 사전 214 부수 전부', Object.keys(HanjaDB.radicals).length === 214,
  String(Object.keys(HanjaDB.radicals).length));
check('radicals 항목마다 번호·이름·카테고리·상징',
  Object.keys(HanjaDB.radicals).every(function (k) {
    var r = HanjaDB.radicals[k];
    return typeof r.n === 'number' && r.n >= 1 && r.n <= 214 && r.name && r.cat && r.sym;
  }));
check('부수 번호가 1~214 중복 없이 전부',
  (function () {
    var seen = {};
    Object.keys(HanjaDB.radicals).forEach(function (k) { seen[HanjaDB.radicals[k].n] = 1; });
    for (var i = 1; i <= 214; i++) if (!seen[i]) return false;
    return Object.keys(seen).length === 214;
  })());
check('큐레이션 서사 300자 이상', HanjaDB.storyCount >= 300, String(HanjaDB.storyCount));

// SPEC v1.9 예시: 忍 = 刃(칼날) + 心(마음)
var bIn = HanjaDB.breakdown('忍', '인');
check('忍 breakdown 해석 성공', bIn.resolved === true);
check('忍 IDS = ⿱刃心', bIn.ids === '⿱刃心', bIn.ids);
check('忍 구성요소 = 刃 + 心',
  bIn.parts.map(function (p) { return p.ch; }).join('') === '刃心');
check('忍 구성요소 뜻 = 칼날 / 마음',
  bIn.parts[0].meaning === '칼날' && bIn.parts[1].meaning === '마음',
  bIn.parts.map(function (p) { return p.meaning; }).join('/'));
check('忍 배치 = 위아래', bIn.layout === '위아래', bIn.layout);
check('心 구성요소에 부수 상징이 붙음',
  !!(bIn.parts[1].radical && bIn.parts[1].radical.n === 61 && bIn.parts[1].radical.sym));

// 변형부수는 원형으로 되돌려 읽는다 (珉의 王 → 玉 구슬)
var bMin = HanjaDB.breakdown('珉', '민');
check('珉의 王은 부수 원형 玉(구슬)로 읽음',
  bMin.parts[0].orig === '玉' && bMin.parts[0].meaning === '구슬',
  bMin.parts[0].orig + '/' + bMin.parts[0].meaning);
check('珉의 소리 구실 구성요소 = 民(민)', bMin.sound === '民', String(bMin.sound));

// 구성요소가 원자료에서 안 밝혀지면 파자 풀이를 내지 않는다
var bGold = HanjaDB.breakdown('金', '김');
check('金은 구성요소 미확인 → resolved=false', bGold.resolved === false);
check('金도 IDS 원본 자체는 보존', typeof bGold.ids === 'string' && bGold.ids.length > 1);

// 순환 방지: 구성요소가 글자 자신으로 되돌아오면 접는다 (玉 = 王 + 丶, 王→玉)
check('玉은 구성요소가 자기 자신으로 되돌아와 접힘',
  HanjaDB.breakdown('玉', '옥').resolved === false);

// ============================================================
// ⑥ 어원 허구 금지 가드 — 서사의 한자는 전부 실제 구성요소여야 한다
// ============================================================
(function () {
  var bad = [];
  Object.keys(HanjaDB.stories).forEach(function (ch) {
    var b = HanjaDB.breakdown(ch);
    if (!b.resolved) { bad.push(ch + '(구성요소 미확인인데 서사 존재)'); return; }
    var allowed = {};
    allowed[ch] = 1;
    b.parts.forEach(function (p) {
      allowed[p.ch] = 1;
      if (p.orig) allowed[p.orig] = 1;
      if (HanjaDB.radForms[p.ch]) allowed[HanjaDB.radForms[p.ch]] = 1;
    });
    var stray = (HanjaDB.stories[ch].match(/[一-鿿]/g) || []).filter(function (h) {
      return !allowed[h];
    });
    if (stray.length) bad.push(ch + '→' + stray.join(''));
  });
  check('파자 서사 ' + HanjaDB.storyCount + '건 모두 실제 구성요소만 언급',
    bad.length === 0, bad.slice(0, 5).join(' / '));
})();

// ============================================================
// ② analyzeHanja 신규 필드 구조 + 기존 필드 무회귀
// ============================================================
var CHART = { elements: { 목: 1, 화: 3, 토: 2, 금: 0, 수: 2 } };
var r = NameReader.analyzeHanja([{ ch: '金', reading: '김' }, { ch: '仁', reading: '인' },
  { ch: '秀', reading: '수' }], CHART);

['perChar', 'meaningPara', 'jawonFit', 'suriHanja', 'overall'].forEach(function (k) {
  check('기존 필드 유지: ' + k, r[k] !== undefined);
});
['breakdown', 'yinYang', 'samwon'].forEach(function (k) {
  check('신규 필드 존재: ' + k, r[k] !== undefined && r[k] !== null);
});
check('breakdown 길이 = 선택 글자 수', r.breakdown.length === 3, String(r.breakdown.length));
check('breakdown 항목 구조',
  r.breakdown.every(function (b) {
    return typeof b.ch === 'string' && typeof b.para === 'string' && b.para.length > 10 &&
      Array.isArray(b.parts) && typeof b.resolved === 'boolean' &&
      ['story', 'phonetic', 'neutral', 'none'].indexOf(b.kind) >= 0;
  }));
check('yinYang 구조',
  Array.isArray(r.yinYang.marks) && r.yinYang.marks.length === 3 &&
  typeof r.yinYang.pattern === 'string' && typeof r.yinYang.para === 'string');
check('samwon 구조',
  r.samwon.cheon && r.samwon['in'] && r.samwon.ji && r.samwon.flow.length === 2);
check('suri 4격에 인생 시기 라벨 추가',
  ['wonhyeong', 'hyeonggyeok', 'igyeok', 'jeonggyeok'].every(function (k) {
    return r.suriHanja[k].period && r.suriHanja[k].periodLabel && r.suriHanja[k].periodPara;
  }));
check('suri 4격 기존 필드(num/grade/name/para) 유지',
  ['wonhyeong', 'hyeonggyeok', 'igyeok', 'jeonggyeok'].every(function (k) {
    var g = r.suriHanja[k];
    return typeof g.num === 'number' && g.grade && g.name && g.para;
  }));
check('jawonFit.charEffects 추가 + 기존 필드 유지',
  Array.isArray(r.jawonFit.charEffects) && r.jawonFit.charEffects.length >= 1 &&
  typeof r.jawonFit.fillsLack === 'boolean' && r.jawonFit.lackElement &&
  Array.isArray(r.jawonFit.nameElements) && r.jawonFit.verdict && r.jawonFit.para);

// 일부 음절 미선택(=원획 수리 불가) 시에도 파자는 나오고 음양/삼원은 접힌다
var rPartial = NameReader.analyzeHanja([{ ch: '金', reading: '김' }, null,
  { ch: '秀', reading: '수' }], CHART);
check('일부 미선택: breakdown 은 고른 글자만', rPartial.breakdown.length === 2);
check('일부 미선택: suriHanja/yinYang/samwon 은 null',
  rPartial.suriHanja === null && rPartial.yinYang === null && rPartial.samwon === null);

// chart 없이 호출해도 안전
var rNoChart = NameReader.analyzeHanja([{ ch: '金', reading: '김' }, { ch: '仁', reading: '인' }], null);
check('chart 없이도 동작(jawonFit=null, 나머지 유지)',
  rNoChart.jawonFit === null && rNoChart.breakdown.length === 2 && !!rNoChart.yinYang);

// ============================================================
// ③ 음양 배열 공식 케이스 6종
// ============================================================
// 규약: 획수 홀=양(●), 짝=음(○). 순양·순음은 조화 부족, 섞이면 조화.
var YY = [
  // [이름 한자, 기대 패턴, 기대 판정]
  [[{ ch: '金', reading: '김' }, { ch: '仁', reading: '인' }, { ch: '秀', reading: '수' }],
    '음음양', '음양 조화'],                                    // 8/4/7
  [[{ ch: '李', reading: '리' }, { ch: '志', reading: '지' }, { ch: '玄', reading: '현' }],
    '양양양', '순양(純陽)'],                                   // 7/7/5
  [[{ ch: '金', reading: '김' }, { ch: '明', reading: '명' }, { ch: '和', reading: '화' }],
    '음음음', '순음(純陰)'],                                   // 8/8/8
  [[{ ch: '朴', reading: '박' }, { ch: '仁', reading: '인' }],
    '음음', '순음(純陰)'],                                     // 6/4
  [[{ ch: '李', reading: '리' }, { ch: '明', reading: '명' }],
    '양음', '음양 조화'],                                      // 7/8
  // 4자(성1+이름3): 양이 음보다 2 이상 많으면 "한쪽으로 기운 조화"
  [[{ ch: '李', reading: '리' }, { ch: '志', reading: '지' }, { ch: '玄', reading: '현' },
    { ch: '明', reading: '명' }], '양양양음', '한쪽으로 기운 조화']   // 7/7/5/8
];
YY.forEach(function (c, i) {
  var out = NameReader.analyzeHanja(c[0], null).yinYang;
  var strokes = NameReader.analyzeHanja(c[0], null).perChar
    .map(function (e) { return e.strokes; }).join('/');
  check('음양 케이스 ' + (i + 1) + ' (' + strokes + '획) → ' + c[1] + ' / ' + c[2],
    out.pattern === c[1] && out.verdict === c[2],
    out.pattern + ' / ' + out.verdict);
});
check('음양 마크 기호는 홀=● 짝=○',
  NameReader.analyzeHanja(YY[0][0], null).yinYang.marks.every(function (m) {
    return (m.strokes % 2 === 1) === (m.sign === '●') && m.yin === (m.strokes % 2 === 0);
  }));

// ============================================================
// ④ 삼원오행 공식 케이스 6종
// ============================================================
// 천격=성 원획 / 인격=성+이름첫자 / 지격=이름첫자+끝자
// 끝자리 1·2 목, 3·4 화, 5·6 토, 7·8 금, 9·0 수
function samwonOf(sel) { return NameReader.analyzeHanja(sel, null).samwon; }
var SW = [
  // 金(8) 仁(4) 秀(7) → 천 8=금, 인 12=목, 지 11=목
  [[{ ch: '金', reading: '김' }, { ch: '仁', reading: '인' }, { ch: '秀', reading: '수' }],
    [8, '금'], [12, '목'], [11, '목']],
  // 李(7) 明(8) 和(8) → 천 7=금, 인 15=토, 지 16=토
  [[{ ch: '李', reading: '리' }, { ch: '明', reading: '명' }, { ch: '和', reading: '화' }],
    [7, '금'], [15, '토'], [16, '토']],
  // 朴(6) 志(7) 玄(5) → 천 6=토, 인 13=화, 지 12=목
  [[{ ch: '朴', reading: '박' }, { ch: '志', reading: '지' }, { ch: '玄', reading: '현' }],
    [6, '토'], [13, '화'], [12, '목']],
  // 이름 1자: 金(8) 秀(7) → 천 8=금, 인 15=토, 지 7=금
  [[{ ch: '金', reading: '김' }, { ch: '秀', reading: '수' }],
    [8, '금'], [15, '토'], [7, '금']],
  // 明(8) 明(8) 明(8) → 천 8=금, 인 16=토, 지 16=토
  [[{ ch: '明', reading: '명' }, { ch: '明', reading: '명' }, { ch: '明', reading: '명' }],
    [8, '금'], [16, '토'], [16, '토']],
  // 이름 3자: 李(7) 志(7) 明(8) 秀(7) → 천 7=금, 인 14=화, 지 첫7+끝7=14=화
  [[{ ch: '李', reading: '리' }, { ch: '志', reading: '지' }, { ch: '明', reading: '명' },
    { ch: '秀', reading: '수' }], [7, '금'], [14, '화'], [14, '화']]
];
SW.forEach(function (c, i) {
  var s = samwonOf(c[0]);
  var ok = s.cheon.num === c[1][0] && s.cheon.element === c[1][1] &&
    s['in'].num === c[2][0] && s['in'].element === c[2][1] &&
    s.ji.num === c[3][0] && s.ji.element === c[3][1];
  check('삼원 케이스 ' + (i + 1) + ' → 천' + c[1][0] + c[1][1] + ' 인' + c[2][0] + c[2][1] +
    ' 지' + c[3][0] + c[3][1], ok,
    s.cheon.num + s.cheon.element + '/' + s['in'].num + s['in'].element + '/' +
    s.ji.num + s.ji.element);
});
// 수→오행 변환표 전수 확인
(function () {
  var table = { 1: '목', 2: '목', 3: '화', 4: '화', 5: '토', 6: '토',
    7: '금', 8: '금', 9: '수', 10: '수', 11: '목', 20: '수', 21: '목', 30: '수' };
  var bad = [];
  // 천격은 성(姓) 원획이므로, 성 자리에 획수를 지정한 "DB에 없는 글자"를 넣어 확인한다.
  // (DB에 있는 글자를 쓰면 normalizeSelection이 DB 값으로 덮어써서 획수를 못 정한다)
  var FAKE = 'Ω';
  if (HanjaDB.lookup(FAKE)) throw new Error('테스트용 가짜 글자가 DB에 실재합니다');
  Object.keys(table).forEach(function (n) {
    var s = NameReader.analyzeHanja([{ ch: FAKE, reading: '가', strokes: Number(n), meaning: '테스트' },
      { ch: '仁', reading: '인' }], null).samwon;
    if (s.cheon.element !== table[n]) bad.push(n + '→' + s.cheon.element + '(기대 ' + table[n] + ')');
  });
  check('수리→오행 변환표 (1·2목 3·4화 5·6토 7·8금 9·0수, 10 단위 버림)',
    bad.length === 0, bad.join(' '));
})();
check('삼원 흐름 관계가 상생/상극/비화 중 하나',
  samwonOf(SW[0][0]).flow.every(function (f) {
    return ['상생', '상극', '비화'].indexOf(f.rel) >= 0;
  }));

// ============================================================
// ⑤ 결정성
// ============================================================
(function () {
  var sel = [{ ch: '金', reading: '김' }, { ch: '仁', reading: '인' }, { ch: '秀', reading: '수' }];
  var a = JSON.stringify(NameReader.analyzeHanja(sel, CHART));
  var b = JSON.stringify(NameReader.analyzeHanja(sel, CHART));
  var c = JSON.stringify(NameReader.analyzeHanja(sel, CHART));
  check('같은 입력 3회 호출 = 완전히 같은 출력', a === b && b === c);
  var d = JSON.stringify(NameReader.analyzeHanja(
    [{ ch: '李', reading: '리' }, { ch: '仁', reading: '인' }, { ch: '秀', reading: '수' }], CHART));
  check('입력이 다르면 출력도 다름', a !== d);
})();

// 문장 위생: 자리표시자·미치환 템플릿이 남지 않았는지
(function () {
  var texts = [];
  r.breakdown.forEach(function (b) { texts.push(b.para); });
  texts.push(r.yinYang.para, r.samwon.para, r.meaningPara, r.overall.para);
  r.jawonFit.charEffects.forEach(function (e) { texts.push(e.para); });
  ['wonhyeong', 'hyeonggyeok', 'igyeok', 'jeonggyeok'].forEach(function (k) {
    texts.push(r.suriHanja[k].periodPara);
  });
  var bad = texts.filter(function (t) {
    return !t || /[{}%]|undefined|null|NaN/.test(t) || t.length < 15;
  });
  check('풀이 문장에 자리표시자·undefined 잔여 없음', bad.length === 0, bad.slice(0, 2).join(' | '));
  check('풀이 문장이 모두 존댓말(…다/…요)로 끝남',
    texts.every(function (t) { return /(니다|습니다|겠습니다|좋겠습니다|입니다)\.?$/.test(t.trim()); }),
    texts.filter(function (t) { return !/(니다|습니다|입니다)\.?$/.test(t.trim()); })[0]);
})();

console.log('\n검사 ' + checks + '건 / 실패 ' + fails + '건');
process.exit(fails ? 1 : 0);
