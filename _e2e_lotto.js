/**
 * 헤드리스 e2e (v1.4 오늘의운세 로또 번호, 배포 대상 아님)
 *   node _e2e_lotto.js [baseUrl]
 * 검증:
 *  - 토요일(2026-08-16, 실제 오늘)로 렌더 → 로또 섹션 미노출(정답)
 *  - 날짜 모킹으로 평일(2026-08-17 월요일) → 로또 섹션 노출, 공 6개, 고지문구
 *  - 콘솔 에러 0
 *  - v1.1(맞춤 추천 탭)/v1.2(이름풀이 탭)/v1.3(한자풀이) 회귀 확인
 * 주의: 서비스워커 캐시가 옛 파일을 물고 있을 수 있어 시작 시 캐시·SW를 전부 지운다.
 * 날짜 모킹은 페이즈별로 새 브라우저 컨텍스트를 열어 addInitScript 를 1회만 등록한다
 * (같은 컨텍스트에 재등록하면 이전 모킹이 누적 래핑되어 취약해짐).
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

async function freshPage(browser, isoDateTime) {
  var ctx = await browser.newContext();
  var page = await ctx.newPage();
  page.on('console', function (m) { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', function (e) { errors.push('pageerror: ' + e.message); });
  if (isoDateTime) await installDateMock(page, isoDateTime);

  // ---- 서비스워커/캐시 초기화(옛 파일 캐시 방지) ----
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

async function submitSelf(page, name) {
  await page.fill('#self-date', '1994-05-21');
  await page.selectOption('#self-time', '10:30');
  await page.selectOption('#self-mbti', 'INFP');
  if (name) await page.fill('#self-name', name);
  await page.click('#form-self button[type="submit"]');
  await page.waitForSelector('#screen-result.active', { timeout: 20000 });
}

(async function () {
  var browser = await chromium.launch({ executablePath: CHROME });

  // ============================================================
  // 1. 토요일(2026-08-16, 실제 오늘) — 로또 섹션 미노출이 정답
  // ============================================================
  var p1 = await freshPage(browser, '2026-08-16T09:00:00');
  var page1 = p1.page;

  var dateMax1 = await page1.evaluate(function () {
    var el = document.querySelector('#self-date');
    return el ? el.max : null;
  });
  check('날짜 모킹 적용: #self-date max = 2026-08-16 (토요일)', dateMax1 === '2026-08-16', 'actual ' + dateMax1);

  await submitSelf(page1, '김민준');
  var satDisplay = await page1.evaluate(function () {
    var el = document.getElementById('lotto-block');
    return el ? getComputedStyle(el).display : null;
  });
  check('토요일(2026-08-16): 로또 섹션 display=none (미노출)', satDisplay === 'none', 'actual ' + satDisplay);

  var satWeekday = await page1.evaluate(function () {
    return window.ContentDB._internal.lottoIsWeekday('2026-08-16');
  });
  check('ContentDB._internal.lottoIsWeekday(2026-08-16) === false (토요일)', satWeekday === false);

  await p1.ctx.close();

  // ============================================================
  // 2. 평일(2026-08-17, 월요일) — 로또 섹션 노출
  // ============================================================
  var p2 = await freshPage(browser, '2026-08-17T09:00:00');
  var page2 = p2.page;

  var dateMax2 = await page2.evaluate(function () {
    var el = document.querySelector('#self-date');
    return el ? el.max : null;
  });
  check('날짜 모킹 적용: #self-date max = 2026-08-17 (월요일)', dateMax2 === '2026-08-17', 'actual ' + dateMax2);

  await submitSelf(page2, '김민준');
  await page2.waitForSelector('#lotto-block', { timeout: 5000 });
  var monDisplay = await page2.evaluate(function () {
    return getComputedStyle(document.getElementById('lotto-block')).display;
  });
  check('평일(2026-08-17): 로또 섹션 display=block (노출)', monDisplay === 'block', 'actual ' + monDisplay);

  var ballCount = await page2.locator('#lotto-balls .lotto-ball').count();
  check('로또 공 6개 렌더', ballCount === 6, '실제 ' + ballCount);

  var ballNumbers = await page2.evaluate(function () {
    return Array.prototype.map.call(document.querySelectorAll('#lotto-balls .lotto-ball'), function (b) { return Number(b.textContent); });
  });
  var sorted = ballNumbers.every(function (n, i, arr) { return i === 0 || arr[i - 1] < n; });
  check('공 번호 오름차순 정렬', sorted, JSON.stringify(ballNumbers));
  var inRange = ballNumbers.every(function (n) { return n >= 1 && n <= 45; });
  check('공 번호 전부 1~45 범위', inRange, JSON.stringify(ballNumbers));
  var uniq = {}; var dup = false;
  ballNumbers.forEach(function (n) { if (uniq[n]) dup = true; uniq[n] = true; });
  check('공 번호 중복 없음', !dup, JSON.stringify(ballNumbers));

  // 공 색상 규칙 검증: 1-10 노랑 / 11-20 파랑 / 21-30 빨강 / 31-40 회색 / 41-45 초록
  var ballClassOk = await page2.evaluate(function () {
    var expect = function (n) {
      if (n <= 10) return 'b-yellow';
      if (n <= 20) return 'b-blue';
      if (n <= 30) return 'b-red';
      if (n <= 40) return 'b-gray';
      return 'b-green';
    };
    var balls = document.querySelectorAll('#lotto-balls .lotto-ball');
    for (var i = 0; i < balls.length; i++) {
      var n = Number(balls[i].textContent);
      if (!balls[i].classList.contains(expect(n))) return false;
    }
    return true;
  });
  check('공 색상이 실제 로또 공 색 규칙과 일치', ballClassOk);

  var lottoPara = await page2.textContent('#lotto-para');
  check('로또 para 1문장 존재', !!lottoPara && lottoPara.trim().length > 0 && lottoPara !== '-');

  var disclaimerText = await page2.evaluate(function () {
    var el = document.querySelector('.lotto-disclaimer');
    return el ? el.textContent.trim() : null;
  });
  check('고지문구 "재미로 보는 번호이며 당첨과 무관합니다." 노출', disclaimerText === '재미로 보는 번호이며 당첨과 무관합니다.', 'actual ' + disclaimerText);

  // 결정성: 같은 사람 같은 날 재조회해도 동일 번호
  // v1.6: 첫 조회 완료 시 프로필이 자동 저장되므로, 재접속(reload) 하면 폼이 아니라
  // 홈 대시보드가 뜨고 그 안에서 같은 로또 번호가 재계산되어 그대로 나타난다(재입력 불필요).
  await page2.reload({ waitUntil: 'load' });
  await page2.waitForTimeout(300);
  await page2.waitForSelector('#screen-dashboard.active', { timeout: 10000 });
  var ballNumbers2 = await page2.evaluate(function () {
    return Array.prototype.map.call(document.querySelectorAll('#dash-lotto-balls .lotto-ball'), function (b) { return Number(b.textContent); });
  });
  check('v1.6 홈 대시보드 재접속 → 동일 번호(결정성)', JSON.stringify(ballNumbers) === JSON.stringify(ballNumbers2),
    JSON.stringify(ballNumbers) + ' vs ' + JSON.stringify(ballNumbers2));

  // v1.6 대시보드 "사주 상세 리포트" 타일로 이동(해시 라우팅 확인 겸 이후 회귀 검증 준비)
  await page2.click('.dash-tile[data-route="result"][data-tab="total"]');
  await page2.waitForSelector('#screen-result.active', { timeout: 10000 });
  check('v1.6 타일 라우팅: #result 해시로 이동', await page2.evaluate(function () { return location.hash; }) === '#result');

  // ============================================================
  // 3. v1.1/v1.2/v1.3 회귀
  // ============================================================
  var recommendTabVisible = await page2.locator('.tab-btn[data-tab="recommend"]').count();
  check('v1.1 회귀: 맞춤 추천 탭 노출', recommendTabVisible === 1);

  var nameTabVisible = await page2.locator('.tab-btn[data-tab="name"]').count();
  check('v1.2 회귀: 이름 입력 시 이름풀이 탭 노출', nameTabVisible === 1);

  await page2.click('.tab-btn[data-tab="name"]');
  await page2.waitForSelector('#hanja-open-btn', { timeout: 8000 });
  check('v1.3 회귀: "한자로 더 보기" 버튼 노출', await page2.locator('#hanja-open-btn').count() === 1);

  await page2.click('#hanja-open-btn');
  await page2.waitForSelector('.hanja-picker', { timeout: 5000 });
  var sylCount = await page2.locator('.hanja-syl').count();
  check('v1.3 회귀: 음절 수만큼 선택 그룹 렌더 (3)', sylCount === 3, '실제 ' + sylCount);

  await p2.ctx.close();

  // ============================================================
  // 4. 콘솔 에러 0
  // ============================================================
  check('콘솔 에러 0건 (전체 페이즈 합산)', errors.length === 0, JSON.stringify(errors));

  await browser.close();

  console.log('');
  console.log(fails === 0 ? 'ALL PASS (e2e lotto)' : (fails + ' FAILED (e2e lotto)'));
  process.exit(fails === 0 ? 0 : 1);
})();
