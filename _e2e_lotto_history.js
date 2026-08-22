/**
 * 헤드리스 e2e (v1.11 로또 번호 일별 누적 기록 / v1.12 매일 노출 / v1.13 최소 5줄 소급 채움, 배포 대상 아님)
 *   node _e2e_lotto_history.js [baseUrl]
 * 검증:
 *  - 첫 조회일(A, 기록 0건 상태) → 오늘 번호 표시, "지난 번호" 목록이 소급 계산으로 즉시 5줄 채워짐
 *    (v1.13: MIN_HISTORY_ROWS=5, 소급 대상 5일 중 주말 날짜도 포함됨을 함께 확인)
 *  - 같은 날 재조회(새로고침) → localStorage 기록 건수가 그대로(중복 소급 없음), 번호 결정성 유지
 *  - 날짜가 다음 평일(B)로 바뀐 뒤 재방문 → 이미 5줄 이상이라 추가 소급 없이 기존 기록이 그대로 나타남
 *  - localStorage 키 네임스페이스가 기존 관례(mzsaju_*)를 따름 + 프로필 id로 스코프됨
 *  - v1.12: 토요일(2026-08-22) → 로또 섹션 노출 + localStorage 에 실제로 기록됨(노출+기록 동시 확인, 별도 컨텍스트)
 *  - 콘솔 에러 0
 */
var PW = 'C:/Users/NHNE/AppData/Local/npm-cache/_npx/9833c18b2d85bc59/node_modules/playwright';
var { chromium } = require(PW);
var BASE = process.argv[2] || 'http://localhost:8123';
var CHROME = 'C:/Users/NHNE/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe';

var fails = 0;
var errors = [];
function check(label, cond, extra) {
  if (cond) console.log('PASS ' + label);
  else { console.log('FAIL ' + label + (extra ? ' — ' + extra : '')); fails++; }
}

function installDateMock(page, isoDateTime) {
  return page.addInitScript(function (iso) {
    var RealDate = Date;
    var fixedMs = new RealDate(iso).getTime();
    function FakeDate() {
      if (arguments.length === 0) return new RealDate(fixedMs);
      var args = Array.prototype.slice.call(arguments);
      return new (Function.prototype.bind.apply(RealDate, [null].concat(args)))();
    }
    FakeDate.prototype = RealDate.prototype;
    FakeDate.now = function () { return fixedMs; };
    FakeDate.parse = RealDate.parse;
    FakeDate.UTC = RealDate.UTC;
    window.Date = FakeDate;
  }, isoDateTime);
}

async function attachPage(ctx, isoDateTime) {
  var page = await ctx.newPage();
  page.on('console', function (m) { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', function (e) { errors.push('pageerror: ' + e.message); });
  if (isoDateTime) await installDateMock(page, isoDateTime);
  await page.goto(BASE + '/index.html', { waitUntil: 'domcontentloaded' });
  await page.evaluate(async function () {
    if (self.caches) { var ks = await caches.keys(); await Promise.all(ks.map(function (k) { return caches.delete(k); })); }
    if (navigator.serviceWorker) {
      var rs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(rs.map(function (r) { return r.unregister(); }));
    }
  });
  await page.reload({ waitUntil: 'load' });
  await page.waitForTimeout(300);
  return page;
}

async function submitSelf(page, name) {
  await page.evaluate(function () { location.hash = '#input'; });
  await page.waitForSelector('#screen-home.active', { timeout: 10000 });
  await page.fill('#self-date', '1994-05-21');
  await page.selectOption('#self-time', '10:30');
  await page.selectOption('#self-mbti', 'INFP');
  if (name) await page.fill('#self-name', name);
  await page.click('#form-self button[type="submit"]');
  await page.waitForSelector('#screen-result.active', { timeout: 20000 });
}

(async function () {
  var browser = await chromium.launch({ executablePath: CHROME });
  // 같은 localStorage(프로필/기록)를 이어서 쓰기 위해 컨텍스트 하나를 날짜별로 재사용한다
  // (날짜 모킹은 새 페이지를 열 때마다 addInitScript 로 새로 건다).
  var ctx = await browser.newContext();

  // ============================================================
  // 1. 평일 A(2026-08-17, 월요일) 첫 조회, 기록 0건 상태 — 오늘 번호 표시 +
  //    v1.13: "지난 번호" 목록이 저장 기록 없이도 소급 계산으로 즉시 5줄 채워짐
  // ============================================================
  var pageA = await attachPage(ctx, '2026-08-17T09:00:00');
  await submitSelf(pageA, '김민준');

  var numbersA = await pageA.evaluate(function () {
    return Array.prototype.map.call(document.querySelectorAll('#lotto-balls .lotto-ball'), function (b) { return Number(b.textContent); });
  });
  check('A일차: 오늘 번호 6개 렌더', numbersA.length === 6, JSON.stringify(numbersA));

  var histA = await pageA.evaluate(function () {
    var wrap = document.getElementById('lotto-history-block');
    var rows = document.querySelectorAll('#lotto-history-list .lotto-history-row');
    return {
      display: wrap ? getComputedStyle(wrap).display : null,
      rows: Array.prototype.map.call(rows, function (r) {
        var date = r.querySelector('.lotto-history-date').textContent.trim();
        var nums = Array.prototype.map.call(r.querySelectorAll('.lotto-ball'), function (b) { return Number(b.textContent); });
        return { date: date, numbers: nums };
      })
    };
  });
  check('A일차: 지난 번호 섹션 노출(display=block)', histA.display === 'block', histA.display);
  // v1.13 핵심 케이스: 기록 0건 상태에서도 목록이 최소 5줄(MIN_HISTORY_ROWS)로 소급 채워진다.
  check('A일차(기록 0건 상태): 지난 번호 목록이 5줄로 소급 채워짐', histA.rows.length === 5, JSON.stringify(histA.rows));
  var histADates = histA.rows.map(function (r) { return r.date; });
  check('A일차: 소급 날짜가 어제부터 역순(8/16~8/12)', JSON.stringify(histADates) ===
    JSON.stringify(['2026-08-16', '2026-08-15', '2026-08-14', '2026-08-13', '2026-08-12']), JSON.stringify(histADates));
  check('A일차: 소급 대상에 오늘(8/17)은 없음', histADates.indexOf('2026-08-17') === -1, JSON.stringify(histADates));
  // v1.12(주 7일 매일 노출)와 맞물려, 소급 5일 중 주말(8/16 일, 8/15 토)도 정상 포함되는지 확인
  check('A일차: 소급 대상에 주말 날짜(8/16 일요일)도 포함됨', histADates.indexOf('2026-08-16') !== -1, JSON.stringify(histADates));
  check('A일차: 소급 대상에 주말 날짜(8/15 토요일)도 포함됨', histADates.indexOf('2026-08-15') !== -1, JSON.stringify(histADates));

  // localStorage 키 네임스페이스 + 스코프 확인
  var storeCheck = await pageA.evaluate(function () {
    var raw = localStorage.getItem('mzsaju_lotto_history_v1');
    var profRaw = localStorage.getItem('mzsaju_profiles_v1');
    var prof = profRaw ? JSON.parse(profRaw) : null;
    var activeId = prof && prof.activeId;
    var all = raw ? JSON.parse(raw) : null;
    return { hasKey: !!raw, activeId: activeId, entryForActive: all && activeId ? all[activeId] : null };
  });
  check('로컬 저장 키가 기존 관례(mzsaju_*)를 따름', storeCheck.hasKey === true);
  // v1.13: 소급분도 localStorage 에 저장되므로, 오늘 1건 + 소급 5건 = 6건이 저장된다.
  check('기록이 활성 프로필 id로 스코프됨(오늘 1건+소급 5건=6건)', !!storeCheck.activeId && Array.isArray(storeCheck.entryForActive) && storeCheck.entryForActive.length === 6,
    JSON.stringify(storeCheck));
  check('A일차 기록의 날짜가 2026-08-17(최신=오늘)', storeCheck.entryForActive && storeCheck.entryForActive[0].date === '2026-08-17', JSON.stringify(storeCheck.entryForActive));
  check('A일차 기록의 번호가 화면 번호와 일치', storeCheck.entryForActive && JSON.stringify(storeCheck.entryForActive[0].numbers) === JSON.stringify(numbersA),
    JSON.stringify(storeCheck.entryForActive));

  // ============================================================
  // 2. 같은 날(A) 재조회(새로고침) — 하루 1줄 유지 + 결정성
  // ============================================================
  await pageA.reload({ waitUntil: 'load' });
  await pageA.waitForTimeout(300);
  await pageA.waitForSelector('#screen-dashboard.active', { timeout: 10000 });

  var afterReloadCount = await pageA.evaluate(function () {
    var raw = localStorage.getItem('mzsaju_lotto_history_v1');
    var all = raw ? JSON.parse(raw) : {};
    var profRaw = localStorage.getItem('mzsaju_profiles_v1');
    var prof = profRaw ? JSON.parse(profRaw) : null;
    var activeId = prof && prof.activeId;
    return (all[activeId] || []).length;
  });
  // 재조회는 대시보드 화면(로또 이력 섹션 없음)이라 추가 소급이 일어나지 않는다 — 6건 그대로(중복 소급 없음, 오늘 기록은 하루 1줄 유지).
  check('같은 날 재조회 후에도 기록 건수 그대로(6건, 중복 소급 없음)', afterReloadCount === 6, afterReloadCount);

  var numbersA2 = await pageA.evaluate(function () {
    return Array.prototype.map.call(document.querySelectorAll('#dash-lotto-balls .lotto-ball'), function (b) { return Number(b.textContent); });
  });
  check('같은 날 재조회 → 동일 번호(결정성)', JSON.stringify(numbersA) === JSON.stringify(numbersA2), JSON.stringify(numbersA) + ' vs ' + JSON.stringify(numbersA2));

  await pageA.close();

  // ============================================================
  // 3. 다음 평일 B(2026-08-18, 화요일)로 날짜가 바뀐 뒤 재방문
  //    — 같은 컨텍스트(같은 localStorage)를 이어서 사용, 프로필은 이미 저장돼 있으므로 대시보드로 바로 진입
  //    이미 6건(≥5) 저장돼 있어 추가 소급 없이 기존 기록 그대로 나타나야 한다.
  // ============================================================
  var pageB = await attachPage(ctx, '2026-08-18T09:00:00');
  await pageB.waitForSelector('#screen-dashboard.active', { timeout: 10000 });

  var numbersB = await pageB.evaluate(function () {
    return Array.prototype.map.call(document.querySelectorAll('#dash-lotto-balls .lotto-ball'), function (b) { return Number(b.textContent); });
  });
  check('B일차: 오늘(B) 번호 6개 렌더(대시보드)', numbersB.length === 6, JSON.stringify(numbersB));
  check('B일차: A일차와 다른 번호(날짜가 시드에 반영됨)', JSON.stringify(numbersA) !== JSON.stringify(numbersB), JSON.stringify(numbersB));

  // 사주 상세(로또) 화면으로 이동해 "지난 번호" 목록 확인
  await pageB.click('.dash-tile[data-route="result"][data-scroll-lotto="1"]');
  await pageB.waitForSelector('#screen-result.active', { timeout: 10000 });

  var histB = await pageB.evaluate(function () {
    var rows = document.querySelectorAll('#lotto-history-list .lotto-history-row');
    return Array.prototype.map.call(rows, function (r) {
      var date = r.querySelector('.lotto-history-date').textContent.trim();
      var nums = Array.prototype.map.call(r.querySelectorAll('.lotto-ball'), function (b) { return Number(b.textContent); });
      return { date: date, numbers: nums };
    });
  });
  // 이미 6건(8/17~8/12)이 저장돼 5줄 기준을 넘으므로 추가 소급 없이 그대로 6건이 나타난다.
  check('B일차: 지난 번호 목록에 기존 6건(A일차 소급분 포함) 그대로 등장(추가 소급 없음)', histB.length === 6, JSON.stringify(histB));
  var histBDates = histB.map(function (r) { return r.date; });
  check('B일차: 지난 번호 목록이 8/17~8/12 내림차순', JSON.stringify(histBDates) ===
    JSON.stringify(['2026-08-17', '2026-08-16', '2026-08-15', '2026-08-14', '2026-08-13', '2026-08-12']), JSON.stringify(histBDates));
  check('B일차: 지난 번호 목록 맨 위(최신) 날짜 = 2026-08-17(A)', histB[0] && histB[0].date === '2026-08-17', JSON.stringify(histB));
  check('B일차: 지난 번호 목록의 번호 = A일차 번호와 일치', histB[0] && JSON.stringify(histB[0].numbers) === JSON.stringify(numbersA), JSON.stringify(histB));
  check('B일차: 지난 번호 목록에 오늘(B)은 없음(중복 표시 방지)', histB.every(function (r) { return r.date !== '2026-08-18'; }), JSON.stringify(histB));

  var storeCheckB = await pageB.evaluate(function () {
    var raw = localStorage.getItem('mzsaju_lotto_history_v1');
    var profRaw = localStorage.getItem('mzsaju_profiles_v1');
    var prof = profRaw ? JSON.parse(profRaw) : null;
    var activeId = prof && prof.activeId;
    var all = raw ? JSON.parse(raw) : {};
    return (all[activeId] || []).map(function (r) { return r.date; });
  });
  // 소급 6건(A일차) + B일차 오늘 기록 1건 = 7건
  check('B일차: localStorage 기록이 7건(A일차 소급 6건 + B일차 1건) 누적', storeCheckB.length === 7, JSON.stringify(storeCheckB));
  check('B일차: localStorage 기록이 내림차순(B가 먼저)', storeCheckB[0] === '2026-08-18' && storeCheckB[1] === '2026-08-17', JSON.stringify(storeCheckB));

  await pageB.close();

  // ============================================================
  // 4. v1.12: 토요일(2026-08-22) — 로또 섹션 노출 + 기록 동시 확인 (별도 컨텍스트, A/B와 무관한 새 프로필)
  // ============================================================
  var ctxSat = await browser.newContext();
  var pageSat = await attachPage(ctxSat, '2026-08-22T09:00:00');
  await submitSelf(pageSat, '박서준');

  var numbersSat = await pageSat.evaluate(function () {
    return Array.prototype.map.call(document.querySelectorAll('#lotto-balls .lotto-ball'), function (b) { return Number(b.textContent); });
  });
  check('토요일: 오늘 번호 6개 렌더(노출)', numbersSat.length === 6, JSON.stringify(numbersSat));

  var satDisplay = await pageSat.evaluate(function () {
    var el = document.getElementById('lotto-block');
    return el ? getComputedStyle(el).display : null;
  });
  check('토요일: 로또 섹션 display=block (v1.12: 매일 노출)', satDisplay === 'block', satDisplay);

  var satStoreCheck = await pageSat.evaluate(function () {
    var raw = localStorage.getItem('mzsaju_lotto_history_v1');
    var profRaw = localStorage.getItem('mzsaju_profiles_v1');
    var prof = profRaw ? JSON.parse(profRaw) : null;
    var activeId = prof && prof.activeId;
    var all = raw ? JSON.parse(raw) : {};
    return { entry: (all[activeId] || []) };
  });
  // v1.13: 기록 0건 상태에서 방문해도 소급 5건이 함께 저장되므로, 오늘 1건 + 소급 5건 = 6건.
  check('토요일: localStorage 에 실제로 기록됨(오늘 1건+소급 5건=6건)', satStoreCheck.entry.length === 6, JSON.stringify(satStoreCheck));
  check('토요일: 기록된 날짜 = 2026-08-22(최신=오늘)', satStoreCheck.entry[0] && satStoreCheck.entry[0].date === '2026-08-22', JSON.stringify(satStoreCheck));
  check('토요일: 기록된 번호가 화면 번호와 일치', satStoreCheck.entry[0] && JSON.stringify(satStoreCheck.entry[0].numbers) === JSON.stringify(numbersSat),
    JSON.stringify(satStoreCheck));

  await pageSat.close();
  await ctxSat.close();

  // ============================================================
  // 5. 콘솔 에러 0
  // ============================================================
  check('콘솔 에러 0건 (전체 페이즈 합산)', errors.length === 0, JSON.stringify(errors));

  await ctx.close();
  await browser.close();

  console.log('');
  console.log(fails === 0 ? 'ALL PASS (e2e lotto history)' : (fails + ' FAILED (e2e lotto history)'));
  process.exit(fails === 0 ? 0 : 1);
})();
