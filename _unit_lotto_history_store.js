/**
 * node 유닛 테스트 (v1.11 로또 번호 일별 누적 기록 로직만, 배포 대상 아님)
 *   node _unit_lotto_history_store.js
 * index.html 안의 <script>window.LottoHistoryStore = ...</script> 블록을 그대로 추출해
 * (DOM 의존 없는 순수 localStorage 로직이라 브라우저 없이도 정확히 같은 코드가 돈다)
 * 가짜 localStorage 로 실행 — 저장/로드/하루 1줄 갱신/날짜 내림차순 정렬/365일 캡/
 * 프로필별 분리/localStorage 차단 폴백을 검증한다. (_unit_profile_store.js 와 동일 패턴)
 */
var fs = require('fs');
var path = require('path');
var vm = require('vm');

var fails = 0;
function check(label, cond, extra) {
  if (cond) console.log('PASS ' + label);
  else { console.log('FAIL ' + label + (extra !== undefined ? ' — ' + JSON.stringify(extra) : '')); fails++; }
}

function extractLottoHistoryStoreScript(html) {
  var marker = 'window.LottoHistoryStore = (function ()';
  var start = html.indexOf(marker);
  if (start === -1) throw new Error('LottoHistoryStore 스크립트를 index.html 에서 찾지 못했습니다.');
  var scriptOpenEnd = html.lastIndexOf('<script>', start);
  var codeStart = html.indexOf('>', scriptOpenEnd) + 1;
  var codeEnd = html.indexOf('</script>', start);
  return html.slice(codeStart, codeEnd);
}

function makeMemoryLocalStorage() {
  var store = {};
  return {
    getItem: function (k) { return Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null; },
    setItem: function (k, v) { store[k] = String(v); },
    removeItem: function (k) { delete store[k]; },
    _dump: function () { return store; }
  };
}

function makeBlockedLocalStorage() {
  return {
    getItem: function () { throw new Error('SecurityError: blocked (private mode)'); },
    setItem: function () { throw new Error('SecurityError: blocked (private mode)'); },
    removeItem: function () { throw new Error('SecurityError: blocked (private mode)'); }
  };
}

function loadLottoHistoryStore(localStorageImpl) {
  var html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  var code = extractLottoHistoryStoreScript(html);
  var sandbox = { window: {}, localStorage: localStorageImpl, Date: Date, Math: Math, Array: Array, JSON: JSON, Object: Object };
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox, { filename: 'LottoHistoryStore(extracted)' });
  return sandbox.window.LottoHistoryStore;
}

// ============================================================
// 1. 기본 저장/조회 — 날짜별로 쌓이고 최신이 먼저 온다
// ============================================================
(function () {
  var LH = loadLottoHistoryStore(makeMemoryLocalStorage());

  check('초기 상태: 기록 없음', LH.list('p1').length === 0);

  var ok1 = LH.record('p1', '2026-08-17', [1, 7, 13, 22, 31, 44]);
  check('첫 기록 저장 성공', ok1 === true);
  check('저장 후 1건', LH.list('p1').length === 1);

  LH.record('p1', '2026-08-18', [2, 8, 14, 23, 32, 45]);
  LH.record('p1', '2026-08-19', [3, 9, 15, 24, 33, 40]);
  var list1 = LH.list('p1');
  check('날짜 3건 누적', list1.length === 3, list1.length);
  check('날짜 내림차순(최신이 먼저)', list1[0].date === '2026-08-19' && list1[2].date === '2026-08-17', list1.map(function (r) { return r.date; }));
})();

// ============================================================
// 2. 하루 단위 정책 — 같은 날 재기록하면 갱신(1줄 유지), 날이 바뀌면 새 줄
// ============================================================
(function () {
  var LH = loadLottoHistoryStore(makeMemoryLocalStorage());

  LH.record('p1', '2026-08-19', [1, 2, 3, 4, 5, 6]);
  LH.record('p1', '2026-08-19', [10, 20, 30, 40, 41, 42]); // 같은 날 재기록 → 갱신
  var list1 = LH.list('p1');
  check('같은 날 재기록 → 여전히 1건(하루 1줄 유지)', list1.length === 1, list1.length);
  check('같은 날 재기록 → 번호가 최신 값으로 갱신됨', JSON.stringify(list1[0].numbers) === JSON.stringify([10, 20, 30, 40, 41, 42]), list1[0]);

  LH.record('p1', '2026-08-20', [7, 8, 9, 11, 12, 13]); // 날이 바뀜 → 새 줄
  var list2 = LH.list('p1');
  check('날이 바뀌면 새 줄로 쌓임(2건)', list2.length === 2, list2.length);
  check('새 날짜가 맨 위(최신)', list2[0].date === '2026-08-20');
})();

// ============================================================
// 3. 프로필별 분리 — 다른 프로필 기록에 영향 없음
// ============================================================
(function () {
  var LH = loadLottoHistoryStore(makeMemoryLocalStorage());
  LH.record('p1', '2026-08-19', [1, 2, 3, 4, 5, 6]);
  LH.record('p2', '2026-08-19', [11, 12, 13, 14, 15, 16]);
  check('p1 기록 1건', LH.list('p1').length === 1);
  check('p2 기록 1건', LH.list('p2').length === 1);
  check('p1 번호와 p2 번호가 서로 섞이지 않음', JSON.stringify(LH.list('p1')[0].numbers) !== JSON.stringify(LH.list('p2')[0].numbers));
  check('존재하지 않는 프로필은 빈 배열', LH.list('p999').length === 0);
})();

// ============================================================
// 4. 용량 관리 — 최근 365일 초과분은 오래된 것부터 정리
// ============================================================
(function () {
  var LH = loadLottoHistoryStore(makeMemoryLocalStorage());
  // 2025-01-01 부터 370일치를 순서대로 기록
  var base = new Date(Date.UTC(2025, 0, 1));
  var dates = [];
  for (var i = 0; i < 370; i++) {
    var d = new Date(base.getTime() + i * 86400000);
    var ds = d.getUTCFullYear() + '-' + String(d.getUTCMonth() + 1).padStart(2, '0') + '-' + String(d.getUTCDate()).padStart(2, '0');
    dates.push(ds);
    LH.record('p1', ds, [1, 2, 3, 4, 5, 6]);
  }
  var list1 = LH.list('p1');
  check('365일 캡 적용(370건 기록 후에도 365건만 유지)', list1.length === 365, list1.length);
  check('가장 최근 365일만 남고 가장 오래된 5일치는 정리됨', list1[list1.length - 1].date === dates[5], list1[list1.length - 1]);
  check('최신 날짜는 그대로 유지', list1[0].date === dates[369]);
})();

// ============================================================
// 5. localStorage 접근 차단(사생활 모드 등) → 예외 없이 자연 폴백
// ============================================================
(function () {
  var LH = loadLottoHistoryStore(makeBlockedLocalStorage());
  var threw = false;
  var result;
  try { result = LH.record('p1', '2026-08-19', [1, 2, 3, 4, 5, 6]); }
  catch (e) { threw = true; }
  check('차단된 localStorage에서 record()가 예외를 던지지 않음', !threw);
  check('차단된 localStorage에서 record() → false 반환(저장 실패 신호)', result === false, result);

  var listThrew = false;
  var list;
  try { list = LH.list('p1'); } catch (e) { listThrew = true; }
  check('차단된 localStorage에서 list()가 예외를 던지지 않음', !listThrew);
  check('차단된 localStorage에서 list() → 빈 배열(자연 폴백)', Array.isArray(list) && list.length === 0, list);
})();

// ============================================================
// 6. 잘못된 입력 방어
// ============================================================
(function () {
  var LH = loadLottoHistoryStore(makeMemoryLocalStorage());
  check('profileId 없으면 저장 실패(false)', LH.record(null, '2026-08-19', [1, 2, 3, 4, 5, 6]) === false);
  check('numbers 배열이 아니면 저장 실패(false)', LH.record('p1', '2026-08-19', null) === false);
  check('profileId 없으면 빈 배열', LH.list(null).length === 0);
})();

console.log('');
console.log(fails === 0 ? 'ALL PASS (unit: LottoHistoryStore)' : (fails + ' FAILED (unit: LottoHistoryStore)'));
process.exit(fails === 0 ? 0 : 1);
