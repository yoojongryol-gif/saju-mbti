/**
 * node 유닛 테스트 (v1.6 프로필 저장/로드 로직만, 배포 대상 아님)
 *   node _unit_profile_store.js
 * index.html 안의 <script>window.ProfileStore = ...</script> 블록을 그대로 추출해
 * (DOM 의존 없는 순수 localStorage 로직이라 브라우저 없이도 정확히 같은 코드가 돈다)
 * 가짜 localStorage 로 실행 — 저장/로드/중복방지/최대5개/활성전환/localStorage 차단 폴백을 검증한다.
 */
var fs = require('fs');
var path = require('path');
var vm = require('vm');

var fails = 0;
function check(label, cond, extra) {
  if (cond) console.log('PASS ' + label);
  else { console.log('FAIL ' + label + (extra !== undefined ? ' — ' + JSON.stringify(extra) : '')); fails++; }
}

function extractProfileStoreScript(html) {
  var marker = 'window.ProfileStore = (function ()';
  var start = html.indexOf(marker);
  if (start === -1) throw new Error('ProfileStore 스크립트를 index.html 에서 찾지 못했습니다.');
  var scriptOpenEnd = html.lastIndexOf('<script>', start) ;
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

function loadProfileStore(localStorageImpl) {
  var html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  var code = extractProfileStoreScript(html);
  var sandbox = { window: {}, localStorage: localStorageImpl, Date: Date, Math: Math, Array: Array, JSON: JSON, Object: Object };
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox, { filename: 'ProfileStore(extracted)' });
  return sandbox.window.ProfileStore;
}

// ============================================================
// 1. 정상 localStorage: 저장/로드/활성 프로필
// ============================================================
(function () {
  var PS = loadProfileStore(makeMemoryLocalStorage());

  check('초기 상태: 목록 비어있음', PS.list().length === 0);
  check('초기 상태: 활성 프로필 없음', PS.getActive() === null);

  var p1 = PS.upsert({ name: '김민준', birthDate: '1994-05-21', calendar: 'solar', lunarLeap: false, birthTime: '10:30', gender: 'M', mbti: 'INFP' });
  check('첫 저장 성공(엔트리 반환)', !!p1 && !!p1.id);
  check('저장 후 목록 1건', PS.list().length === 1, PS.list());
  check('저장 직후 활성 프로필 = 방금 저장한 것', PS.getActive() && PS.getActive().id === p1.id);

  // ---- 중복 입력 방지: 생년월일+시간+성별 동일 → 갱신(신규 추가 아님) ----
  var p1b = PS.upsert({ name: '김민준(수정)', birthDate: '1994-05-21', calendar: 'solar', lunarLeap: false, birthTime: '10:30', gender: 'M', mbti: 'ENFP' });
  check('동일 키(생년월일+시간+성별) 재저장 → 같은 id 유지(갱신)', p1b.id === p1.id, { before: p1.id, after: p1b.id });
  check('동일 키 재저장 → 목록 개수 그대로(1건)', PS.list().length === 1, PS.list().length);
  check('동일 키 재저장 → 필드 갱신 반영', PS.getActive().name === '김민준(수정)' && PS.getActive().mbti === 'ENFP');

  // ---- 시간이 다르면 별도 프로필 ----
  var p2 = PS.upsert({ name: '김민준', birthDate: '1994-05-21', calendar: 'solar', lunarLeap: false, birthTime: '12:30', gender: 'M', mbti: 'INFP' });
  check('시간이 다르면 새 프로필로 추가(2건)', PS.list().length === 2, PS.list().length);
  check('id 서로 다름', p2.id !== p1.id);

  // ---- 활성 전환 ----
  var switched = PS.setActive(p1.id);
  check('setActive 성공', switched === true);
  check('활성 프로필 전환 반영', PS.getActive().id === p1.id);
})();

// ============================================================
// 2. 최대 5개 캡 — 가장 오래된 프로필부터 정리(활성 프로필은 보호)
// ============================================================
(function () {
  var PS = loadProfileStore(makeMemoryLocalStorage());
  var ids = [];
  for (var i = 0; i < 5; i++) {
    var p = PS.upsert({ name: 'p' + i, birthDate: '199' + i + '-01-01', gender: 'M' });
    ids.push(p.id);
  }
  check('5개까지는 전부 유지', PS.list().length === 5, PS.list().length);

  // 활성 프로필(현재 5번째, 가장 최근)을 오래된 것처럼 만들 수 없으니,
  // 활성은 마지막 저장분(p4)이고 가장 오래된 건 p0 — p0가 정리되어야 한다.
  var p5 = PS.upsert({ name: 'p5', birthDate: '1995-06-06', gender: 'F' });
  check('6번째 저장 후에도 최대 5개 유지', PS.list().length === 5, PS.list().length);
  var remainingIds = PS.list().map(function (p) { return p.id; });
  check('가장 오래된 프로필(p0)이 정리됨', remainingIds.indexOf(ids[0]) === -1, remainingIds);
  check('새로 저장한 프로필(p5)은 남아있음', remainingIds.indexOf(p5.id) >= 0);
  check('활성 프로필은 새로 저장한 p5', PS.getActive().id === p5.id);
})();

// ============================================================
// 3. localStorage 접근 차단(사생활 모드 등) → 예외 없이 자연 폴백
// ============================================================
(function () {
  var PS = loadProfileStore(makeBlockedLocalStorage());
  var threw = false;
  var result;
  try {
    result = PS.upsert({ name: '테스트', birthDate: '2000-01-01', gender: 'F' });
  } catch (e) {
    threw = true;
  }
  check('차단된 localStorage에서 upsert()가 예외를 던지지 않음', !threw);
  check('차단된 localStorage에서 upsert() → null 반환(저장 실패 신호)', result === null, result);

  var loadThrew = false;
  var list;
  try { list = PS.list(); } catch (e) { loadThrew = true; }
  check('차단된 localStorage에서 list()가 예외를 던지지 않음', !loadThrew);
  check('차단된 localStorage에서 list() → 빈 배열(폼 플로우로 자연 폴백)', Array.isArray(list) && list.length === 0, list);

  var activeThrew = false;
  var active;
  try { active = PS.getActive(); } catch (e) { activeThrew = true; }
  check('차단된 localStorage에서 getActive()가 예외를 던지지 않음', !activeThrew);
  check('차단된 localStorage에서 getActive() → null', active === null, active);
})();

console.log('');
console.log(fails === 0 ? 'ALL PASS (unit: ProfileStore)' : (fails + ' FAILED (unit: ProfileStore)'));
process.exit(fails === 0 ? 0 : 1);
