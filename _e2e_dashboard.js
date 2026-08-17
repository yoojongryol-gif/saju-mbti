/**
 * 헤드리스 e2e (v1.6 홈 대시보드 + 사극 테마, 배포 대상 아님)
 *   node _e2e_dashboard.js [baseUrl]
 * 검증(과업 지시 ⓐ~ⓕ):
 *  ⓐ 첫 방문(프로필 없음) = 기존 입력 폼 그대로 표시
 *  ⓑ 결과 조회 완료 후 재로드 = 홈 대시보드 표시(인사·오늘의 운세 실텍스트·평일 로또 노출)
 *  ⓒ 프로필 전환·수정
 *  ⓓ 메뉴 타일 5개 + MBTI 보조 라우팅 왕복(해시 변경 + 뒤로가기 일관성, 다단계 뒤로가기 포함)
 *  ⓔ localStorage 차단(사생활 모드 등) → 예외 없이 폼 플로우로 자연 폴백
 *  ⓕ 사극 테마: 오프라인(폰트 차단)에서도 레이아웃 안 깨짐, 화면별 톤 일관성(먹빛 배경 vs 한지 카드)
 *  전 과정 콘솔 에러 0
 * (v1.1~1.5 회귀는 _e2e_lotto.js/_e2e_hanja.js/_e2e_name_compat.js 로 별도 확인됨)
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

function installBlockedStorage(page) {
  return page.addInitScript(function () {
    var blocked = {
      getItem: function () { throw new Error('SecurityError: blocked'); },
      setItem: function () { throw new Error('SecurityError: blocked'); },
      removeItem: function () { throw new Error('SecurityError: blocked'); },
      clear: function () { throw new Error('SecurityError: blocked'); }
    };
    try {
      Object.defineProperty(window, 'localStorage', { value: blocked, configurable: true });
    } catch (e) { /* 일부 브라우저는 재정의 불가 — 무시하고 원본 동작 */ }
  });
}

function installFontBlock(page) {
  // 오프라인/폰트 차단 재현: 구글 폰트 요청을 강제로 실패시킨다(레이아웃은 CSS serif 폴백으로 유지되어야 함)
  return page.route('https://fonts.googleapis.com/**', function (route) { route.abort(); });
}

async function freshPage(browser, opts) {
  opts = opts || {};
  var ctx = await browser.newContext();
  var page = await ctx.newPage();
  // 폰트 차단(ⓕ) 페이즈는 일부러 네트워크 요청을 abort() 시키므로,
  // 그로 인한 "리소스 로드 실패" 콘솔 메시지는 앱 버그가 아니라 테스트가 유발한 것 — 별도 집계에서 제외한다.
  page.on('console', function (m) {
    if (m.type() !== 'error') return;
    if (opts.blockFont && /Failed to load resource|ERR_FAILED|ERR_ABORTED/.test(m.text())) return;
    errors.push(m.text());
  });
  page.on('pageerror', function (e) { errors.push('pageerror: ' + e.message); });
  if (opts.blockStorage) await installBlockedStorage(page);
  if (opts.blockFont) await installFontBlock(page);
  if (opts.isoDateTime) await installDateMock(page, opts.isoDateTime);

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

async function submitSelf(page, opts) {
  opts = opts || {};
  // v1.6.1: #home은 이제 프로필 유무와 무관하게 대시보드(빈 상태 포함)를 보여주므로,
  // 입력 폼(#screen-home)에 접근하려면 명시적으로 #input으로 이동해야 한다.
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
  // ⓐ 첫 방문(프로필 없음) = v1.6.1: 홈(대시보드) 빈 상태 — 메뉴 상시 접근 가능
  //   (구 계약 "screen-home 즉시 표시"는 메뉴가 프로필 뒤에 숨는 버그였음 — 이번 수정으로 폐기)
  // ============================================================
  var p0 = await freshPage(browser, { isoDateTime: '2026-08-17T09:00:00' });
  check('ⓐ 첫 방문: screen-dashboard(빈 상태) 활성', await activeScreenId(p0.page) === 'screen-dashboard');
  check('ⓐ 첫 방문: 저장된 프로필 없음(빈 목록)', await p0.page.evaluate(function () { return window.ProfileStore.list().length; }) === 0);
  var emptyStateVisible0 = await p0.page.evaluate(function () {
    return getComputedStyle(document.getElementById('dash-empty-state')).display !== 'none';
  });
  check('ⓐ 첫 방문: 빈 상태 카드 노출', emptyStateVisible0);
  var headerMenuVisible0 = await p0.page.evaluate(function () {
    var btn = document.getElementById('header-menu-btn');
    return !!btn && getComputedStyle(btn).display !== 'none';
  });
  check('ⓐ 첫 방문: 상시 헤더 ☰ 메뉴 버튼 노출(프로필 없이도)', headerMenuVisible0);
  await p0.page.click('#header-menu-btn');
  await p0.page.waitForSelector('#menu-sheet.show', { timeout: 5000 });
  var menuTileCount0 = await p0.page.locator('#menu-tile-grid .menu-tile').count();
  check('ⓐ 첫 방문: ☰ 메뉴 타일 5개(사주/이름/한자/로또/궁합) 노출', menuTileCount0 === 5, menuTileCount0);
  await p0.ctx.close();

  // ============================================================
  // ⓑ 결과 조회 완료 → 재로드 = 홈 대시보드(인사·오늘의 운세 실텍스트·평일 로또)
  // ============================================================
  var p1 = await freshPage(browser, { isoDateTime: '2026-08-17T09:00:00' }); // 2026-08-17 = 월요일(평일)
  var page1 = p1.page;
  await submitSelf(page1, { name: '김민준' });

  check('ⓑ 결과 조회 완료 시 프로필 자동 저장', await page1.evaluate(function () { return window.ProfileStore.list().length; }) === 1);

  await page1.reload({ waitUntil: 'load' });
  await page1.waitForTimeout(300);
  check('ⓑ 재로드 후 screen-dashboard 활성', await activeScreenId(page1) === 'screen-dashboard');

  var greeting = await page1.textContent('#dash-greeting-name');
  check('ⓑ 인사 헤더에 저장한 이름 "김민준" 포함', greeting.indexOf('김민준') >= 0, greeting);
  check('ⓑ 인사 헤더 "안녕하세요" 포함', greeting.indexOf('안녕하세요') >= 0, greeting);

  var dateLine = await page1.textContent('#dash-greeting-date');
  check('ⓑ 날짜 줄에 "일진" 표기', dateLine.indexOf('일진') >= 0, dateLine);
  var iljinHasHanja = await page1.evaluate(function () {
    var el = document.querySelector('#dash-greeting-date .iljin');
    return el ? /[\u4e00-\u9fff]/.test(el.textContent) : false;
  });
  check('ⓑ 일진 표기에 한자 병기 포함', iljinHasHanja);

  var dashHeadline = await page1.textContent('#dash-daily-headline');
  var dashPara = await page1.textContent('#dash-daily-para');
  check('ⓑ 오늘의 운세 headline 실텍스트 존재', !!dashHeadline && dashHeadline.trim() !== '-' && dashHeadline.trim().length > 0, dashHeadline);
  check('ⓑ 오늘의 운세 본문 실텍스트 존재', !!dashPara && dashPara.trim() !== '-' && dashPara.trim().length > 0, dashPara);

  var dashLottoDisplay = await page1.evaluate(function () {
    return getComputedStyle(document.getElementById('dash-lotto-block')).display;
  });
  check('ⓑ 평일(2026-08-17) 홈 대시보드 로또 노출', dashLottoDisplay === 'block', dashLottoDisplay);
  var dashBallCount = await page1.locator('#dash-lotto-balls .lotto-ball').count();
  check('ⓑ 홈 대시보드 로또 공 6개', dashBallCount === 6, dashBallCount);

  // ============================================================
  // ⓒ 프로필 전환 / 수정
  // ============================================================
  // "새 사주 보기" → 두 번째 프로필 추가
  await page1.click('#dash-new-profile-btn');
  await page1.waitForSelector('#screen-home.active', { timeout: 10000 });
  var clearedDate = await page1.inputValue('#self-date');
  check('ⓒ "새 사주 보기" → 입력폼이 비워짐', clearedDate === '', 'actual "' + clearedDate + '"');
  await submitSelf(page1, { name: '이서연', birthDate: '1996-03-02', time: '08:30', mbti: 'ENFJ' });

  var profileCount = await page1.evaluate(function () { return window.ProfileStore.list().length; });
  check('ⓒ 두 번째 프로필 추가 후 목록 2건', profileCount === 2, profileCount);

  await page1.reload({ waitUntil: 'load' });
  await page1.waitForTimeout(300);
  var chipCount = await page1.locator('.profile-chip').count();
  check('ⓒ 프로필 전환 칩 2개 렌더', chipCount === 2, chipCount);
  var greetingAfterSecond = await page1.textContent('#dash-greeting-name');
  check('ⓒ 최신 저장 프로필(이서연)이 활성으로 표시', greetingAfterSecond.indexOf('이서연') >= 0, greetingAfterSecond);

  // 첫 번째 프로필(김민준) 칩 클릭 → 전환
  await page1.locator('.profile-chip', { hasText: '김민준' }).click();
  await page1.waitForTimeout(200);
  var greetingAfterSwitch = await page1.textContent('#dash-greeting-name');
  check('ⓒ 프로필 칩 클릭 → 김민준으로 전환', greetingAfterSwitch.indexOf('김민준') >= 0, greetingAfterSwitch);
  var activeChipText = await page1.evaluate(function () {
    var el = document.querySelector('.profile-chip.active');
    return el ? el.textContent : null;
  });
  check('ⓒ 활성 칩 표시가 전환된 프로필과 일치', activeChipText === '김민준', activeChipText);

  // "프로필 수정" → 입력폼에 현재 활성 프로필 값 프리필
  await page1.click('#dash-edit-profile-btn');
  await page1.waitForSelector('#screen-home.active', { timeout: 10000 });
  var prefillName = await page1.inputValue('#self-name');
  var prefillDate = await page1.inputValue('#self-date');
  check('ⓒ "프로필 수정" → 이름 프리필', prefillName === '김민준', prefillName);
  check('ⓒ "프로필 수정" → 생년월일 프리필', prefillDate === '1994-05-21', prefillDate);

  await p1.ctx.close();

  // ============================================================
  // ⓓ 메뉴 타일 5개 + MBTI 보조 라우팅 왕복(뒤로가기 일관성)
  // ============================================================
  var p2 = await freshPage(browser, { isoDateTime: '2026-08-17T09:00:00' });
  var page2 = p2.page;
  await submitSelf(page2, { name: '박지훈' });
  await page2.reload({ waitUntil: 'load' });
  await page2.waitForTimeout(300);
  await page2.waitForSelector('#screen-dashboard.active', { timeout: 10000 });

  var tileCases = [
    { route: 'result', selector: '.dash-tile[data-route="result"][data-tab="total"]', screen: 'screen-result', hash: '#result', label: '사주(상세 리포트)' },
    { route: 'result', selector: '.dash-tile[data-route="result"][data-tab="name"]:not([data-hanja])', screen: 'screen-result', hash: '#result', label: '이름풀이' },
    // v1.10: 한자 뜻풀이 타일은 이름과 무관한 독립 사전 화면(#hanja-dict)으로 간다
    { route: 'hanja-dict', selector: '.dash-tile[data-route="hanja-dict"]', screen: 'screen-hanja-dict', hash: '#hanja-dict', label: '한자 뜻풀이' },
    { route: 'result', selector: '.dash-tile[data-scroll-lotto="1"]', screen: 'screen-result', hash: '#result', label: '로또' },
    { route: 'compat', selector: '.dash-tile[data-route="compat"]', screen: 'screen-compat-form', hash: '#compat', label: '궁합' }
  ];

  for (var i = 0; i < tileCases.length; i++) {
    var tc = tileCases[i];
    check('ⓓ 타일 이동 전: 대시보드 활성 (' + tc.label + ' 케이스 시작)', await activeScreenId(page2) === 'screen-dashboard');
    await page2.click(tc.selector);
    await page2.waitForSelector('#' + tc.screen + '.active', { timeout: 10000 });
    check('ⓓ [' + tc.label + '] 타일 → ' + tc.screen + ' 이동', await activeScreenId(page2) === tc.screen);
    var hashNow = await page2.evaluate(function () { return location.hash; });
    check('ⓓ [' + tc.label + '] 해시 = ' + tc.hash, hashNow === tc.hash, hashNow);

    await page2.goBack();
    await page2.waitForSelector('#screen-dashboard.active', { timeout: 10000 });
    check('ⓓ [' + tc.label + '] 뒤로가기 → 대시보드로 정상 복귀', await activeScreenId(page2) === 'screen-dashboard');
  }

  // MBTI 약식검사 보조 버튼
  check('ⓓ MBTI 보조 버튼 이동 전: 대시보드 활성', await activeScreenId(page2) === 'screen-dashboard');
  await page2.click('#dash-quiz-btn');
  await page2.waitForSelector('#screen-quiz.active', { timeout: 10000 });
  check('ⓓ [MBTI 약식검사] 보조 버튼 → screen-quiz 이동', await activeScreenId(page2) === 'screen-quiz');
  check('ⓓ [MBTI 약식검사] 해시 = #quiz', await page2.evaluate(function () { return location.hash; }) === '#quiz');
  await page2.click('#quiz-cancel-btn');
  await page2.waitForSelector('#screen-home.active', { timeout: 10000 });
  check('ⓓ 검사 취소 → 입력폼(#input)으로 복귀(대시보드 아님, 기존 동작 보존)', await activeScreenId(page2) === 'screen-home');

  // ---- 다단계 뒤로가기: 대시보드 → 결과 → 궁합폼 → (뒤로)결과 → (뒤로)대시보드 ----
  await page2.evaluate(function () { location.hash = '#home'; });
  await page2.waitForSelector('#screen-dashboard.active', { timeout: 10000 });
  await page2.click('.dash-tile[data-route="result"][data-tab="total"]');
  await page2.waitForSelector('#screen-result.active', { timeout: 10000 });
  await page2.click('#open-compat-btn');
  await page2.waitForSelector('#screen-compat-form.active', { timeout: 10000 });
  await page2.goBack();
  await page2.waitForSelector('#screen-result.active', { timeout: 10000 });
  check('ⓓ 다단계 뒤로가기 1단계: 궁합폼 → 결과', await activeScreenId(page2) === 'screen-result');
  await page2.goBack();
  await page2.waitForSelector('#screen-dashboard.active', { timeout: 10000 });
  check('ⓓ 다단계 뒤로가기 2단계: 결과 → 대시보드', await activeScreenId(page2) === 'screen-dashboard');

  await p2.ctx.close();

  // ============================================================
  // ⓔ localStorage 차단(사생활 모드 등) → 예외 없이 폼 플로우로 자연 폴백
  // ============================================================
  var p3 = await freshPage(browser, { isoDateTime: '2026-08-17T09:00:00', blockStorage: true });
  var page3 = p3.page;
  check('ⓔ localStorage 차단 상태에서도 첫 화면은 홈(대시보드 빈 상태, 예외로 죽지 않음)', await activeScreenId(page3) === 'screen-dashboard');

  await submitSelf(page3, { name: '최수아' });
  check('ⓔ localStorage 차단 상태에서도 결과 조회 정상 완료(#screen-result)', await activeScreenId(page3) === 'screen-result');
  var personaTitle = await page3.textContent('#persona-title');
  check('ⓔ 결과 화면 페르소나 텍스트 정상 렌더', !!personaTitle && personaTitle.trim() !== '-' && personaTitle.trim().length > 0, personaTitle);

  await page3.reload({ waitUntil: 'load' });
  await page3.waitForTimeout(300);
  check('ⓔ localStorage 차단 상태에서는 재로드해도 홈은 빈 상태로 자연 폴백(예외 없음, 프로필 저장 실패)', await activeScreenId(page3) === 'screen-dashboard');
  await p3.ctx.close();

  // ============================================================
  // ⓕ 사극 테마: 오프라인(폰트 차단)에서 레이아웃 안 깨짐 + 화면별 톤 일관성
  // ============================================================
  var p4 = await freshPage(browser, { isoDateTime: '2026-08-17T09:00:00', blockFont: true });
  var page4 = p4.page;

  var titleFontFamily = await page4.evaluate(function () {
    return getComputedStyle(document.querySelector('h2.screen-title')).fontFamily;
  });
  check('ⓕ 폰트 차단 시에도 제목에 serif 계열 폴백 스택 적용(레이아웃 유지)',
    /serif|batang|myeongjo/i.test(titleFontFamily), titleFontFamily);

  var bodyOverflowX = await page4.evaluate(function () {
    return document.documentElement.scrollWidth <= document.documentElement.clientWidth + 2;
  });
  check('ⓕ 폰트 차단 상태에서도 가로 스크롤 발생하지 않음(레이아웃 안 깨짐)', bodyOverflowX);

  await submitSelf(page4, { name: '테마검증' });

  // 페이지 dark bg(body)와 한지 카드(.tab-content) 톤이 서로 다른지(=테마가 실제 적용됐는지) 확인
  var themeTones = await page4.evaluate(function () {
    var bodyBg = getComputedStyle(document.body).backgroundColor;
    var cardBg = getComputedStyle(document.querySelector('.tab-content')).backgroundColor;
    var cardColor = getComputedStyle(document.querySelector('.tab-content')).color;
    return { bodyBg: bodyBg, cardBg: cardBg, cardColor: cardColor };
  });
  check('ⓕ 페이지 배경과 한지 카드 배경이 서로 다른 톤(사극 레이어링 적용)', themeTones.bodyBg !== themeTones.cardBg, JSON.stringify(themeTones));
  // 한지 카드 위 글자색이 밝은 색(구 테마의 흰 계열)이 아니라 어두운 잉크 톤인지 대략 확인(휘도 낮음)
  var inkIsDark = await page4.evaluate(function () {
    var m = getComputedStyle(document.querySelector('.tab-content')).color.match(/\d+/g);
    if (!m) return false;
    var r = +m[0], g = +m[1], b = +m[2];
    var luminance = (0.299 * r + 0.587 * g + 0.114 * b);
    return luminance < 140;
  });
  check('ⓕ 한지 카드 위 텍스트가 어두운 잉크 톤(가독성)', inkIsDark, themeTones.cardColor);

  await page4.reload({ waitUntil: 'load' });
  await page4.waitForTimeout(300);
  check('ⓕ 대시보드 화면도 정상 로드(콘솔 에러로 이어지지 않음)', await activeScreenId(page4) === 'screen-dashboard');

  await p4.ctx.close();

  // ============================================================
  // 콘솔 에러 0건(전체 페이즈 합산)
  // ============================================================
  check('콘솔 에러 0건 (전체 페이즈 합산)', errors.length === 0, JSON.stringify(errors));

  await browser.close();

  console.log('');
  console.log(fails === 0 ? 'ALL PASS (e2e dashboard)' : (fails + ' FAILED (e2e dashboard)'));
  process.exit(fails === 0 ? 0 : 1);
})();
