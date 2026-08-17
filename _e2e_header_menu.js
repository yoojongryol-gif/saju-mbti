/**
 * 헤드리스 e2e (v1.6.1 상시 헤더 + ☰ 메뉴, 배포 대상 아님)
 *   node _e2e_header_menu.js [baseUrl]
 * 배경: 사장님 실검수 지적 "메뉴 버튼없어" — 기존엔 메뉴 타일이 홈 대시보드(프로필 저장 후에만
 * 표시)에 갇혀 있어 첫 방문자/미저장 사용자는 메뉴에 접근할 방법이 없었다.
 * 검증:
 *  ① 프로필 없음: ☰ 메뉴가 항상 열리고, 5개 타일 전부 탭 가능
 *     - 사주풀이/로또/궁합(사주 데이터 필요) → 결과로 못 가고 안내문구 + 입력폼으로 유도
 *     - 이름풀이/한자풀이(사주 비의존) → 프로필 없이 바로 진입, 실제 풀이 결과 렌더
 *     - MBTI 검사(사주 비의존) → 바로 진입
 *     - 새 사주 입력 → 입력폼(안내문구 없음)
 *  ② 프로필 있음: 동일 시나리오에서 사주 데이터 필요한 항목도 정상적으로 결과/궁합/로또로 이동
 *  ③ 뒤로가기 일관성: 메뉴 열기/닫기(백드롭 클릭, Esc) + 화면 전환 후 브라우저 뒤로가기
 *  ④ 결과/궁합결과 화면 "홈으로" 버튼 존재 및 동작
 *  ⑤ 콘솔 에러 0건
 * (v1.1~v1.6 회귀는 _e2e_dashboard.js/_e2e_lotto.js/_e2e_hanja.js/_e2e_name_compat.js 로 별도 확인됨)
 */
var PW = 'C:/Users/NHNE/AppData/Local/npm-cache/_npx/9833c18b2d85bc59/node_modules/playwright';
var { chromium } = require(PW);
var BASE = process.argv[2] || 'http://localhost:8123';
var CHROME = 'C:/Users/NHNE/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe';

var fails = 0;
var errors = [];
function check(label, cond, extra) {
  if (cond) console.log('PASS ' + label);
  else { console.log('FAIL ' + label + (extra !== undefined ? ' — ' + extra : '')); fails++; }
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

async function freshPage(browser, isoDateTime) {
  var ctx = await browser.newContext();
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
  return { ctx: ctx, page: page };
}

async function activeScreenId(page) {
  return page.evaluate(function () {
    var el = document.querySelector('.screen.active');
    return el ? el.id : null;
  });
}

async function openMenu(page) {
  await page.click('#header-menu-btn');
  await page.waitForSelector('#menu-sheet.show', { timeout: 5000 });
}

async function submitSelf(page, opts) {
  opts = opts || {};
  await page.evaluate(function () { location.hash = '#input'; });
  await page.waitForSelector('#screen-home.active', { timeout: 10000 });
  await page.fill('#self-date', opts.birthDate || '1994-05-21');
  await page.selectOption('#self-time', opts.time || '10:30');
  await page.selectOption('#self-mbti', opts.mbti || 'INFP');
  if (opts.name) await page.fill('#self-name', opts.name);
  await page.click('#form-self button[type="submit"]');
  await page.waitForSelector('#screen-result.active', { timeout: 20000 });
}

(async function () {
  var browser = await chromium.launch({ executablePath: CHROME });

  // ============================================================
  // ① 프로필 없음 — ☰ 메뉴 전체 시나리오
  // ============================================================
  var p1 = await freshPage(browser, '2026-08-17T09:00:00');
  var page1 = p1.page;

  check('① 첫 진입: screen-dashboard(빈 상태) 활성', await activeScreenId(page1) === 'screen-dashboard');

  // ---- 헤더 브랜드 버튼(좌측) → 홈 이동, 어느 화면에서도 항상 노출 ----
  var brandVisible = await page1.evaluate(function () {
    return getComputedStyle(document.getElementById('header-home-btn')).display !== 'none';
  });
  check('① 상시 헤더 브랜드 버튼 노출', brandVisible);

  // ---- 사주풀이(사주 데이터 필요) → 결과로 못 가고 입력 유도 ----
  await openMenu(page1);
  await page1.click('.menu-tile[data-menu="total"]');
  await page1.waitForSelector('#screen-home.active', { timeout: 10000 });
  check('① [사주풀이] 프로필 없음 → screen-result 아닌 입력폼으로 이동', await activeScreenId(page1) === 'screen-home');
  var guidanceVisible1 = await page1.evaluate(function () {
    return getComputedStyle(document.getElementById('home-guidance-note')).display !== 'none';
  });
  check('① [사주풀이] 안내문구("입력하면 이용할 수 있어요") 노출', guidanceVisible1);
  var menuClosedAfterNav1 = await page1.evaluate(function () { return !document.getElementById('menu-sheet').classList.contains('show'); });
  check('① 메뉴 항목 탭 시 메뉴 자동 닫힘', menuClosedAfterNav1);

  // ---- 로또(사주 데이터 필요) → 동일 유도 ----
  await page1.evaluate(function () { location.hash = '#home'; });
  await page1.waitForSelector('#screen-dashboard.active', { timeout: 10000 });
  await openMenu(page1);
  await page1.click('.menu-tile[data-menu="lotto"]');
  await page1.waitForSelector('#screen-home.active', { timeout: 10000 });
  check('① [로또] 프로필 없음 → 입력폼으로 유도', await activeScreenId(page1) === 'screen-home');

  // ---- 궁합(사주 데이터 필요) → 동일 유도(궁합 입력폼으로 못 감) ----
  await page1.evaluate(function () { location.hash = '#home'; });
  await page1.waitForSelector('#screen-dashboard.active', { timeout: 10000 });
  await openMenu(page1);
  await page1.click('.menu-tile[data-menu="compat"]');
  await page1.waitForSelector('#screen-home.active', { timeout: 10000 });
  check('① [궁합] 프로필 없음 → 궁합폼이 아닌 입력폼으로 유도', await activeScreenId(page1) === 'screen-home');

  // ---- 이름풀이(사주 비의존) → 프로필 없이 바로 진입 + 실제 결과 렌더 ----
  await page1.evaluate(function () { location.hash = '#home'; });
  await page1.waitForSelector('#screen-dashboard.active', { timeout: 10000 });
  await openMenu(page1);
  await page1.click('.menu-tile[data-menu="name"]');
  await page1.waitForSelector('#screen-name-standalone.active', { timeout: 10000 });
  check('① [이름풀이] 프로필 없이 단독 화면 바로 진입', await activeScreenId(page1) === 'screen-name-standalone');

  await page1.fill('#name-standalone-input', '김민준');
  await page1.click('#form-name-standalone button[type="submit"]');
  await page1.waitForSelector('#name-standalone-result .name-overall-score', { timeout: 8000 });
  var standaloneScore = await page1.textContent('#name-standalone-result .name-overall-score');
  check('① [이름풀이] 결과 렌더(종합 점수 실텍스트)', !!standaloneScore && standaloneScore.trim().length > 0, standaloneScore);
  var hanjaMoreBtnVisible = await page1.locator('#name-standalone-result #hanja-open-btn').count();
  check('① [이름풀이] "한자로 더 보기" 버튼도 노출(단독 화면 공용 렌더 확인)', hanjaMoreBtnVisible === 1);

  // ---- 한자풀이(v1.10) → 이름과 무관한 독립 사전 화면으로 진입 ----
  await page1.evaluate(function () { location.hash = '#home'; });
  await page1.waitForSelector('#screen-dashboard.active', { timeout: 10000 });
  await openMenu(page1);
  await page1.click('.menu-tile[data-menu="hanja"]');
  await page1.waitForSelector('#screen-hanja-dict.active', { timeout: 10000 });
  check('① [한자풀이] 프로필·이름 없이 한자 사전 화면(#hanja-dict) 진입',
    await activeScreenId(page1) === 'screen-hanja-dict');
  check('① [한자풀이] 사전 화면은 검색창만 요구(이름 입력 없음)',
    await page1.locator('#dict-search-input').count() === 1);

  // ---- MBTI 검사(사주 비의존) → 바로 진입 ----
  await page1.evaluate(function () { location.hash = '#home'; });
  await page1.waitForSelector('#screen-dashboard.active', { timeout: 10000 });
  await openMenu(page1);
  await page1.click('.menu-list-item[data-menu="mbti"]');
  await page1.waitForSelector('#screen-quiz.active', { timeout: 10000 });
  check('① [MBTI 검사] 프로필 없이 바로 진입', await activeScreenId(page1) === 'screen-quiz');
  await page1.click('#quiz-cancel-btn');
  await page1.waitForSelector('#screen-home.active', { timeout: 10000 });

  // ---- 새 사주 입력 → 입력폼(안내문구 없음, 폼 비어있음) ----
  await page1.evaluate(function () { location.hash = '#home'; });
  await page1.waitForSelector('#screen-dashboard.active', { timeout: 10000 });
  await openMenu(page1);
  await page1.click('.menu-list-item[data-menu="new-input"]');
  await page1.waitForSelector('#screen-home.active', { timeout: 10000 });
  check('① [새 사주 입력] 입력폼으로 이동', await activeScreenId(page1) === 'screen-home');
  var guidanceHiddenForNewInput = await page1.evaluate(function () {
    return getComputedStyle(document.getElementById('home-guidance-note')).display === 'none';
  });
  check('① [새 사주 입력] 안내문구 없음(직접 진입, 유도 아님)', guidanceHiddenForNewInput);

  await p1.ctx.close();

  // ============================================================
  // ② 프로필 있음 — 사주 데이터 필요한 항목도 정상 이동
  // ============================================================
  var p2 = await freshPage(browser, '2026-08-17T09:00:00');
  var page2 = p2.page;
  await submitSelf(page2, { name: '이서연' });
  await page2.evaluate(function () { location.hash = '#home'; });
  await page2.waitForSelector('#screen-dashboard.active', { timeout: 10000 });

  await openMenu(page2);
  await page2.click('.menu-tile[data-menu="total"]');
  await page2.waitForSelector('#screen-result.active', { timeout: 10000 });
  check('② [사주풀이] 프로필 있음 → screen-result로 정상 이동', await activeScreenId(page2) === 'screen-result');

  await page2.evaluate(function () { location.hash = '#home'; });
  await page2.waitForSelector('#screen-dashboard.active', { timeout: 10000 });
  await openMenu(page2);
  await page2.click('.menu-tile[data-menu="compat"]');
  await page2.waitForSelector('#screen-compat-form.active', { timeout: 10000 });
  check('② [궁합] 프로필 있음 → 궁합 입력폼으로 정상 이동', await activeScreenId(page2) === 'screen-compat-form');

  await page2.evaluate(function () { location.hash = '#home'; });
  await page2.waitForSelector('#screen-dashboard.active', { timeout: 10000 });
  await openMenu(page2);
  await page2.click('.menu-tile[data-menu="lotto"]');
  await page2.waitForSelector('#screen-result.active', { timeout: 10000 });
  check('② [로또] 프로필 있음 → screen-result로 정상 이동', await activeScreenId(page2) === 'screen-result');

  // ============================================================
  // ③ 뒤로가기 / 메뉴 열고닫기 일관성
  // ============================================================
  await page2.evaluate(function () { location.hash = '#home'; });
  await page2.waitForSelector('#screen-dashboard.active', { timeout: 10000 });
  await openMenu(page2);
  await page2.click('#menu-backdrop');
  await page2.waitForTimeout(350);
  var menuHiddenAfterBackdrop = await page2.evaluate(function () { return document.getElementById('menu-sheet').hidden === true; });
  check('③ 백드롭 클릭 → 메뉴 닫힘', menuHiddenAfterBackdrop);

  await openMenu(page2);
  await page2.keyboard.press('Escape');
  await page2.waitForTimeout(350);
  var menuHiddenAfterEsc = await page2.evaluate(function () { return document.getElementById('menu-sheet').hidden === true; });
  check('③ Esc 키 → 메뉴 닫힘', menuHiddenAfterEsc);

  // 메뉴 열고닫기가 해시 히스토리에 영향 주지 않는지(뒤로가기 시 화면 전환 정상)
  var hashBeforeMenuOps = await page2.evaluate(function () { return location.hash; });
  await openMenu(page2);
  await page2.click('#menu-backdrop');
  await page2.waitForTimeout(350);
  var hashAfterMenuOps = await page2.evaluate(function () { return location.hash; });
  check('③ 메뉴 열기/닫기는 해시(히스토리)에 영향 없음', hashBeforeMenuOps === hashAfterMenuOps, hashBeforeMenuOps + ' vs ' + hashAfterMenuOps);

  await page2.click('.dash-tile[data-route="result"][data-tab="total"]');
  await page2.waitForSelector('#screen-result.active', { timeout: 10000 });
  await page2.goBack();
  await page2.waitForSelector('#screen-dashboard.active', { timeout: 10000 });
  check('③ 화면 전환 후 브라우저 뒤로가기 정상 동작', await activeScreenId(page2) === 'screen-dashboard');

  // ============================================================
  // ④ 결과/궁합결과 화면 "홈으로" 버튼
  // ============================================================
  await page2.click('.dash-tile[data-route="result"][data-tab="total"]');
  await page2.waitForSelector('#screen-result.active', { timeout: 10000 });
  var resultHomeBtnCount = await page2.locator('#result-home-btn').count();
  check('④ 결과 화면 "홈으로" 버튼 존재', resultHomeBtnCount === 1);
  await page2.click('#result-home-btn');
  await page2.waitForSelector('#screen-dashboard.active', { timeout: 10000 });
  check('④ "홈으로" 클릭 → 대시보드로 이동', await activeScreenId(page2) === 'screen-dashboard');

  await page2.click('.dash-tile[data-route="compat"]');
  await page2.waitForSelector('#screen-compat-form.active', { timeout: 10000 });
  await page2.fill('#partner-date', '1996-03-02');
  await page2.click('#form-partner button[type="submit"]');
  await page2.waitForSelector('#screen-compat-result.active', { timeout: 20000 });
  var compatHomeBtnCount = await page2.locator('#compat-result-home-btn').count();
  check('④ 궁합 결과 화면 "홈으로" 버튼 존재', compatHomeBtnCount === 1);
  await page2.click('#compat-result-home-btn');
  await page2.waitForSelector('#screen-dashboard.active', { timeout: 10000 });
  check('④ 궁합 결과 "홈으로" 클릭 → 대시보드로 이동', await activeScreenId(page2) === 'screen-dashboard');

  await p2.ctx.close();

  // ============================================================
  // ⑤ 콘솔 에러 0건(전체 페이즈 합산)
  // ============================================================
  check('콘솔 에러 0건 (전체 페이즈 합산)', errors.length === 0, JSON.stringify(errors));

  await browser.close();

  console.log('');
  console.log(fails === 0 ? 'ALL PASS (e2e header/menu)' : (fails + ' FAILED (e2e header/menu)'));
  process.exit(fails === 0 ? 0 : 1);
})();
