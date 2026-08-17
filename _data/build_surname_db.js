/**
 * _data/build_surname_db.js — name-surname-db.js 생성 스크립트 (v1.8)
 *
 * 입력:
 *   - _data/surname_research.json  (리서치 원자료: 위키백과 등 공개문서 교차확인 결과)
 *   - name-hanja-db.js              (기존 인명한자 DB — 뜻·원획 재사용 원천, window.HanjaDB)
 *
 * 출력: name-surname-db.js (window.SurnameDB)
 *
 * 정책:
 *   - 성씨 한자가 name-hanja-db.js(HanjaDB)에 이미 있으면 그 뜻(meaning)·원획(strokes)·
 *     자원오행(jawonElement)을 그대로 재사용한다(같은 파이프라인 산출값이므로 재산출하지 않음).
 *   - HanjaDB에 없는 성씨 전용 글자는 MANUAL_HANJA에 근거를 남기고 직접 계산한다
 *     (name-hanja-db.js 헤더의 "원획 = 원형부수 획수 + kRSUnicode 나머지 획수" 규약과 동일 방식).
 *   - 교차확인 안 된 항목은 surname_research.json 단계에서 이미 생략됐다(리서치 원칙).
 *
 * 실행: node _data/build_surname_db.js
 */
'use strict';
var fs = require('fs');
var path = require('path');

var ROOT = path.join(__dirname, '..');
var research = JSON.parse(fs.readFileSync(path.join(ROOT, '_data/surname_research.json'), 'utf8'));

// HanjaDB 로드 (브라우저 전역 없이 노드에서 읽기용)
var hanjaSrc = fs.readFileSync(path.join(ROOT, 'name-hanja-db.js'), 'utf8');
var sandbox = {};
sandbox.window = sandbox;
(function (window) { // eslint-disable-line no-unused-vars
  eval(hanjaSrc); // eslint-disable-line no-eval
}).call(sandbox, sandbox);
var HanjaDB = sandbox.HanjaDB;
if (!HanjaDB) throw new Error('HanjaDB 로드 실패');

// HanjaDB에 없는 성씨 전용 한자 — 근거를 명시하고 직접 산출(name-hanja-db.js와 동일 규약).
var MANUAL_HANJA = {
  '왕|王': {
    meaning: '임금 왕', strokes: 4, jawonElement: null,
    note: 'HanjaDB(name-hanja-db.js) 미등재. 王은 원형 그 자체가 부수(강희자전 96번 王部)라 ' +
      '변형부수 보정이 필요 없어 원획=필획=4획. 상용 기초한자로 뜻·획수 모두 이견 없음(자원오행은 ' +
      '유파별 불일치 커 null 유지, name-hanja-db.js 정책과 동일).'
  },
  '노|魯': {
    meaning: '노나라 로', strokes: 15, jawonElement: null,
    note: 'HanjaDB 미등재. 원획 = 원형부수 魚(강희자전 195번, 원형 11획) + kRSUnicode 나머지 4획 = 15획 ' +
      '(name-hanja-db.js 헤더의 원획 산출 규약과 동일 방식, 사전 표기 15획과 일치 확인).'
  }
};

var COMPOUND_LABELS = ['남궁', '독고', '제갈', '사공', '서문', '동방', '선우', '황보'];

function resolveMeta(ch, reading) {
  var e = HanjaDB.lookup(ch, reading);
  if (e) {
    return { meaning: e.meaning, strokes: e.strokes, jawonElement: e.jawonElement || null, fromHanjaDB: true };
  }
  var manual = MANUAL_HANJA[reading + '|' + ch];
  if (manual) {
    return { meaning: manual.meaning, strokes: manual.strokes, jawonElement: manual.jawonElement, fromHanjaDB: false, manualNote: manual.note };
  }
  return null;
}

var dueumAlias = {};
(research.dueumAliases || []).forEach(function (pair) {
  dueumAlias[pair[0]] = pair[1];
  dueumAlias[pair[1]] = pair[0];
});

var bySyllable = {}; // reading(단음절) -> [entry]
var compoundSurnames = {}; // label(2음절) -> {chars, readings, bongwans, sourceNote}

function pushEntry(reading, entry) {
  if (!bySyllable[reading]) bySyllable[reading] = [];
  bySyllable[reading].push(entry);
}
function findEntry(reading, ch) {
  return (bySyllable[reading] || []).find(function (e) { return e.ch === ch; });
}

var skipped = [];

// 1) 단음절 성씨
research.surnames.forEach(function (s) {
  if (s.reading.length !== 1) return; // 복성은 2단계에서 처리
  s.hanja.forEach(function (h) {
    var meta = resolveMeta(h.ch, s.reading);
    if (!meta) { skipped.push(s.reading + ' ' + h.ch + ' (뜻·획수 산출 불가)'); return; }
    pushEntry(s.reading, {
      ch: h.ch,
      reading: s.reading,
      meaning: meta.meaning,
      strokes: meta.strokes,
      jawonElement: meta.jawonElement,
      surname: s.reading,
      bongwans: h.bongwans || [],
      note: h.note || null,
      compoundOf: null,
      compoundOnly: false,
      fromHanjaDB: meta.fromHanjaDB
    });
  });
});

// 2) 복성 (예: 남궁=南+宮)
research.surnames.forEach(function (s) {
  if (s.reading.length !== 2 || COMPOUND_LABELS.indexOf(s.reading) === -1) return;
  var label = s.reading;
  s.hanja.forEach(function (h) {
    if (h.ch.length !== 2) { skipped.push(label + ' ' + h.ch + ' (2자 한자 형식 아님)'); return; }
    var chars = [h.ch[0], h.ch[1]];
    var readings = [label[0], label[1]];
    var metas = [resolveMeta(chars[0], readings[0]), resolveMeta(chars[1], readings[1])];
    if (!metas[0] || !metas[1]) { skipped.push(label + ' ' + h.ch + ' (구성자 뜻·획수 산출 불가)'); return; }

    compoundSurnames[label] = {
      chars: chars, readings: readings, bongwans: h.bongwans || [],
      note: h.note || null
    };

    for (var i = 0; i < 2; i++) {
      var ch = chars[i], rd = readings[i], other = chars[1 - i], otherRd = readings[1 - i], meta = metas[i];
      var existing = findEntry(rd, ch);
      var compoundInfo = { label: label, otherChar: other, otherReading: otherRd, bongwans: h.bongwans || [] };
      if (existing) {
        if (!existing.compoundOf) existing.compoundOf = [];
        existing.compoundOf.push(compoundInfo);
      } else {
        pushEntry(rd, {
          ch: ch, reading: rd,
          meaning: meta.meaning, strokes: meta.strokes, jawonElement: meta.jawonElement,
          surname: label, bongwans: h.bongwans || [], note: h.note || null,
          compoundOf: [compoundInfo], compoundOnly: true, fromHanjaDB: meta.fromHanjaDB
        });
      }
    }
  });
});

// 3) 두음법칙 미러링 — 원래 음절에 등록된 성씨 한자를 대응 음절에도 복제(같은 글자, reading만 교체).
//    원본 스냅샷을 기준으로만 미러링해 재귀적으로 번지지 않게 한다.
var originalSyllables = Object.keys(bySyllable);
originalSyllables.forEach(function (syl) {
  var alias = dueumAlias[syl];
  if (!alias) return;
  var items = bySyllable[syl].slice();
  items.forEach(function (e) {
    if (findEntry(alias, e.ch)) return; // 이미 그 음절에 실존
    var mirrorMeta = resolveMeta(e.ch, alias) || { meaning: e.meaning, strokes: e.strokes, jawonElement: e.jawonElement };
    pushEntry(alias, {
      ch: e.ch, reading: alias,
      meaning: mirrorMeta.meaning, strokes: mirrorMeta.strokes, jawonElement: mirrorMeta.jawonElement,
      surname: e.compoundOnly ? e.surname : alias,
      bongwans: e.bongwans, note: e.note,
      compoundOf: e.compoundOf ? e.compoundOf.map(function (c) { return Object.assign({}, c); }) : null,
      compoundOnly: e.compoundOnly,
      fromHanjaDB: mirrorMeta.fromHanjaDB !== undefined ? mirrorMeta.fromHanjaDB : e.fromHanjaDB,
      aliasMirrorOf: syl
    });
  });
});

var readings = Object.keys(bySyllable).sort();
var totalHanjaEntries = 0;
readings.forEach(function (r) { totalHanjaEntries += bySyllable[r].length; });

console.log('음절(readings):', readings.length);
console.log('한자 항목(entries, 미러 포함):', totalHanjaEntries);
console.log('복성:', Object.keys(compoundSurnames).length, Object.keys(compoundSurnames).join(' '));
console.log('스킵:', skipped.length, skipped);

// ---- 코드 생성 ----
function jsStr(v) { return JSON.stringify(v); }
function entryToJs(e) {
  var parts = [
    'ch:' + jsStr(e.ch),
    'reading:' + jsStr(e.reading),
    'meaning:' + jsStr(e.meaning),
    'strokes:' + jsStr(e.strokes),
    'jawonElement:' + jsStr(e.jawonElement),
    'surname:' + jsStr(e.surname),
    'bongwans:' + jsStr(e.bongwans)
  ];
  if (e.note) parts.push('note:' + jsStr(e.note));
  if (e.compoundOf) parts.push('compoundOf:' + jsStr(e.compoundOf));
  if (e.compoundOnly) parts.push('compoundOnly:true');
  if (e.aliasMirrorOf) parts.push('aliasMirrorOf:' + jsStr(e.aliasMirrorOf));
  if (e.fromHanjaDB === false) parts.push('fromHanjaDB:false');
  return '{' + parts.join(',') + '}';
}

var lines = [];
lines.push('/**');
lines.push(' * name-surname-db.js — MZ사주풀이 성씨·본관 한자 DB (v1.8)');
lines.push(' * ⚠ 이 파일은 _data/build_surname_db.js 가 _data/surname_research.json 에서 자동 생성한다.');
lines.push(' *   직접 수정하지 말 것. (생성일 ' + new Date().toISOString().slice(0, 10) + ')');
lines.push(' *');
lines.push(' * ── 원자료 출처(교차확인 2곳+, 상세 URL 120개는 _data/surname_research.json.sources 참조) ──');
lines.push(' *   위키백과 "한국의 성씨_목록"·"대한민국의_인구순_성씨_목록"·"한국의_성씨와_이름" +');
lines.push(' *   개별 성씨 문서(김_(성씨) 등 90여개) — 3중 이상 교차확인.');
lines.push(' *   두음법칙 변형(유/류·이/리·임/림·나/라·노/로·양/량·염/렴·여/려·육/륙)은 2007년 대법원');
lines.push(' *   개명 허용 판례 보도(한국일보·경북매일·부산일보·경기신문)로 교차확인.');
lines.push(' *   교차확인 실패 항목(예: 형씨邢, 강씨 일부 희귀 한자)은 리서치 단계에서 이미 생략했다.');
lines.push(' *');
lines.push(' * ── 뜻·원획 재사용 정책 ──');
lines.push(' *   name-hanja-db.js(HanjaDB)에 이미 있는 글자는 그 meaning/strokes/jawonElement를 그대로');
lines.push(' *   재사용한다(fromHanjaDB 필드 없으면 재사용, false면 아래 수동 산출).');
lines.push(' *   HanjaDB 미등재 글자(2건: 王·魯)는 name-hanja-db.js와 동일한 원획 산출 규약을 손으로');
lines.push(' *   적용했다 — 근거는 _data/build_surname_db.js의 MANUAL_HANJA 주석 참조.');
lines.push(' *');
lines.push(' * ── 커버리지 ──');
lines.push(' *   ' + readings.length + '개 단음절 + 복성 ' + Object.keys(compoundSurnames).length + '종(' + Object.keys(compoundSurnames).join('·') + '), ');
lines.push(' *   한자 항목(두음 미러 포함) ' + totalHanjaEntries + '건.');
lines.push(' *   목표(SPEC.md "250성+")에는 못 미친다 — "교차확인 안 되는 본관·한자는 수록 생략" 원칙을');
lines.push(' *   엄격 적용한 결과이며, 허구 데이터로 개수를 채우지 않았다(리서치 보고 참조).');
lines.push(' *');
lines.push(' * ── 필드 ──');
lines.push(' *   ch 한자 / reading 이 항목의 음 / meaning·strokes(원획)·jawonElement HanjaDB와 동형 /');
lines.push(' *   surname 이 한자가 속하는 성씨 표기(단성=reading과 동일, 복성이면 2음절 라벨 예:"남궁") /');
lines.push(' *   bongwans 본관 목록(문자열 배열) / note 두음·특이사항 메모(없으면 없음) /');
lines.push(' *   compoundOf 이 글자가 복성의 구성자로도 쓰이면 [{label,otherChar,otherReading,bongwans}] /');
lines.push(' *   compoundOnly 단성 용례 없이 복성에서만 쓰이는 글자면 true /');
lines.push(' *   aliasMirrorOf 두음법칙으로 다른 음절 항목을 복제한 것이면 원래 음절.');
lines.push(' */');
lines.push('');
lines.push("(function (global) {");
lines.push("  'use strict';");
lines.push('');
lines.push('  var dueumAlias = ' + jsStr(dueumAlias) + ';');
lines.push('');
lines.push('  var bySyllable = {');
readings.forEach(function (r, i) {
  var items = bySyllable[r].map(entryToJs).join(',\n      ');
  lines.push('    ' + jsStr(r) + ': [\n      ' + items + '\n    ]' + (i < readings.length - 1 ? ',' : ''));
});
lines.push('  };');
lines.push('');
lines.push('  var compoundSurnames = ' + JSON.stringify(compoundSurnames, null, 2).replace(/\n/g, '\n  ') + ';');
lines.push('');
lines.push([
  '  function dueumVariants(syllable) {',
  '    var out = [syllable];',
  '    if (dueumAlias[syllable] && out.indexOf(dueumAlias[syllable]) === -1) out.push(dueumAlias[syllable]);',
  '    return out;',
  '  }',
  '',
  '  function candidates(syllable) { return bySyllable[syllable] || []; }',
  '',
  '  // 두음 변형까지 합친 "그 소리로 불리는 성씨 한자" 전체. 같은 한자가 두 음절 키에 각각',
  '  // (미러 복제 또는 원래부터) 존재할 수 있어 ch 기준으로 합치고 본관 목록은 합집합으로 병합한다',
  '  // (예: "나"/"라" 둘 다 羅 원본 항목이 있고 본관 목록이 서로 다른 부분집합이라 병합이 필요).',
  '  function surnameCandidates(syllable) {',
  '    var byCh = {};',
  '    var order = [];',
  '    dueumVariants(syllable).forEach(function (s) {',
  '      (bySyllable[s] || []).forEach(function (e) {',
  '        var cur = byCh[e.ch];',
  '        if (!cur) {',
  '          cur = { ch: e.ch, reading: syllable, meaning: e.meaning, strokes: e.strokes,',
  '            jawonElement: e.jawonElement, surname: e.surname, bongwans: e.bongwans.slice(),',
  '            note: e.note, compoundOf: e.compoundOf ? e.compoundOf.slice() : null, compoundOnly: e.compoundOnly };',
  '          byCh[e.ch] = cur;',
  '          order.push(cur);',
  '        } else {',
  '          e.bongwans.forEach(function (b) { if (cur.bongwans.indexOf(b) === -1) cur.bongwans.push(b); });',
  '        }',
  '      });',
  '    });',
  '    return order;',
  '  }',
  '',
  '  function isSurnameChar(ch, syllable) {',
  '    return surnameCandidates(syllable).some(function (e) { return e.ch === ch; });',
  '  }',
  '',
  '  // 본관 표기 정규화: "水原(수원)" 같은 한자+괄호 병기는 괄호 안 한글만 취하고,',
  '  // 공백 제거·트림만 한다(성씨 자체 두음은 dueumVariants에서 이미 처리).',
  '  function normalizeBongwan(s) {',
  '    var q = String(s == null ? \'\' : s).trim();',
  '    var m = q.match(/^[^\\s()]+\\(([^)]+)\\)$/);',
  '    if (m) q = m[1];',
  '    return q.replace(/\\s+/g, \'\');',
  '  }',
  '',
  '  // 본관 정확 매칭(두음 변형 허용). syllable은 실제 화면에 고정된 음절(예: 이름의 첫 글자).',
  '  function matchBongwan(bongwanQuery, syllable) {',
  '    var q = normalizeBongwan(bongwanQuery);',
  '    if (!q) return [];',
  '    var out = [];',
  '    surnameCandidates(syllable).forEach(function (e) {',
  '      var hit = (e.bongwans || []).some(function (b) { return normalizeBongwan(b) === q; });',
  '      if (!hit && e.compoundOf) {',
  '        hit = e.compoundOf.some(function (c) { return (c.bongwans || []).some(function (b) { return normalizeBongwan(b) === q; }); });',
  '      }',
  '      if (hit) out.push(e);',
  '    });',
  '    return out;',
  '  }',
  '',
  '  // 자유 질의 파싱 — "성유"/"유 성씨"/"성씨 유" → {kind:\'surname\',target:\'유\'}',
  '  //              "강릉 유"/"강릉유"        → {kind:\'bongwan\',bongwan:\'강릉\',target:\'유\'}',
  '  // 매칭되는 패턴이 없으면 null(호출측은 기존 검색 로직으로 폴백).',
  '  function parseQuery(raw) {',
  '    var q = String(raw == null ? \'\' : raw).trim();',
  '    if (!q) return null;',
  '    var noSpace = q.replace(/\\s+/g, \'\');',
  '    var m;',
  '    if ((m = noSpace.match(/^성씨(.+)$/))) return { kind: \'surname\', target: m[1] };',
  '    if ((m = noSpace.match(/^성(.+)$/))) return { kind: \'surname\', target: m[1] };',
  '    if ((m = noSpace.match(/^(.+)성씨$/))) return { kind: \'surname\', target: m[1] };',
  '    if (noSpace.length >= 2) {',
  '      var last = noSpace.slice(-1);',
  '      var rest = noSpace.slice(0, -1);',
  '      if (bySyllable[last] || dueumAlias[last]) return { kind: \'bongwan\', bongwan: rest, target: last };',
  '    }',
  '    return null;',
  '  }',
  '',
  '  global.SurnameDB = {',
  '    version: \'1.8\',',
  '    dueumAlias: dueumAlias,',
  '    bySyllable: bySyllable,',
  '    compoundSurnames: compoundSurnames,',
  '    readings: Object.keys(bySyllable),',
  '    candidates: candidates,',
  '    dueumVariants: dueumVariants,',
  '    surnameCandidates: surnameCandidates,',
  '    isSurnameChar: isSurnameChar,',
  '    normalizeBongwan: normalizeBongwan,',
  '    matchBongwan: matchBongwan,',
  '    parseQuery: parseQuery,',
  '    count: ' + totalHanjaEntries,
  '  };',
  '  if (typeof module !== \'undefined\' && module.exports) module.exports = global.SurnameDB;',
  '})(typeof window !== \'undefined\' ? window : this);',
  ''
].join('\n'));

fs.writeFileSync(path.join(ROOT, 'name-surname-db.js'), lines.join('\n'));
console.log('name-surname-db.js 생성 완료.');
