/**
 * 헤드리스 e2e (v1.5 궁합 이름풀이, 배포 대상 아님)
 *   node _e2e_name_compat.js [baseUrl]
 * 검증:
 *  - 이름 2개(본인+상대) 입력 → "이름 궁합" 섹션 노출(오행 관계+서로 주는 기운 2건+수리 조합+종합)
 *  - 이름 1개(한쪽만)만 입력 → 그쪽만 축약 표시, giveTake 카드 없음
 *  - 이름 0개(둘 다 미입력) → 섹션 자체 숨김
 *  - 콘솔 에러 0
 *  - v1.1~1.4 회귀(맞춤 추천 탭 / 이름풀이 탭 / 한자 더보기 버튼 / 토요일 로또 미노출)
 * 주의: 오늘(2026-08-16)은 실제로 토요일이라 로또 미노출이 정상 동작이다(날짜 모킹도 동일 날짜로 고정해 재현성 확보).
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
  await page.fill('#self-name', name || '');
  await page.click('#form-self button[type="submit"]');
  await page.waitForSelector('#screen-result.active', { timeout: 20000 });
}

async function submitPartner(page, name) {
  await page.click('#open-compat-btn');
  await page.waitForSelector('#screen-compat-form.active', { timeout: 10000 });
  await page.fill('#partner-date', '1996-03-02');
  await page.fill('#partner-name', name || '');
  await page.click('#form-partner button[type="submit"]');
  await page.waitForSelector('#screen-compat-result.active', { timeout: 20000 });
  await page.waitForTimeout(150);
}

(async function () {
  var browser = await chromium.launch({ executablePath: CHROME });

  // ============================================================
  // 1. 이름 2개(본인 "김민준" + 상대 "이서연") — 풀 궁합 섹션
  // ============================================================
  var p1 = await freshPage(browser, '2026-08-16T09:00:00');
  var page1 = p1.page;

  await submitSelf(page1, '김민준');

  // ---- v1.1~1.4 회귀(본인 결과 화면에서) ----
  check('v1.1 회귀: 맞춤 추천 탭 노출', await page1.locator('.tab-btn[data-tab="recommend"]').count() === 1);
  check('v1.2 회귀: 이름 입력 시 이름풀이 탭 노출', await page1.locator('.tab-btn[data-tab="name"]').count() === 1);
  var lottoDisplay = await page1.evaluate(function () {
    var el = document.getElementById('lotto-block');
    return el ? getComputedStyle(el).display : null;
  });
  check('v1.4 회귀: 토요일(2026-08-16) 로또 섹션 미노출', lottoDisplay === 'none', 'actual ' + lottoDisplay);
  await page1.click('.tab-btn[data-tab="name"]');
  await page1.waitForSelector('#hanja-open-btn', { timeout: 8000 });
  check('v1.3 회귀: "한자로 더 보기" 버튼 노출', await page1.locator('#hanja-open-btn').count() === 1);

  await submitPartner(page1, '이서연');

  var wrapDisplay1 = await page1.evaluate(function () {
    return getComputedStyle(document.getElementById('name-compat-wrap')).display;
  });
  check('이름 2개 입력: name-compat-wrap display=block', wrapDisplay1 === 'block', 'actual ' + wrapDisplay1);

  var sectionLabelText = await page1.evaluate(function () {
    var wrap = document.getElementById('name-compat-wrap');
    var lbl = wrap ? wrap.querySelector('.section-label') : null;
    return lbl ? lbl.textContent.trim() : null;
  });
  check('"이름 궁합" 섹션 라벨 노출', sectionLabelText === '이름 궁합', 'actual ' + sectionLabelText);

  var chipCount1 = await page1.locator('#name-compat-content .name-chip').count();
  check('이름 오행 관계 칩 2개(본인/상대)', chipCount1 === 2, '실제 ' + chipCount1);

  var giveTakeCardCount1 = await page1.locator('#name-compat-content .suri-card').count();
  check('서로 주는 기운 카드 2장(양방향, 둘 다 chart 보유)', giveTakeCardCount1 === 2, '실제 ' + giveTakeCardCount1);

  var overallScoreText1 = await page1.locator('#name-compat-content .name-overall-score').textContent();
  var scoreNum1 = Number((overallScoreText1 || '').trim());
  check('이름 궁합 종합 점수 0~100 렌더', scoreNum1 >= 0 && scoreNum1 <= 100, 'actual ' + overallScoreText1);

  var suriParaText1 = await page1.evaluate(function () {
    var titles = Array.prototype.slice.call(document.querySelectorAll('#name-compat-content .reco-section-title'));
    var t = titles.filter(function (el) { return el.textContent.indexOf('수리 조합') >= 0; })[0];
    return t ? t.parentElement.querySelector('.tab-para').textContent.trim() : null;
  });
  check('수리 조합 코멘트 문단 존재', !!suriParaText1 && suriParaText1.length > 0);

  check('기존 SajuEngine.compat 헤드라인 여전히 렌더(무변경 병기)',
    (await page1.textContent('#compat-headline')).trim().length > 0);

  // ============================================================
  // 2. 한쪽만 입력(상대방 이름 미입력) — 본인 쪽만 축약 표시
  // ============================================================
  await page1.click('#compat-result-back-btn');
  await page1.waitForSelector('#screen-result.active', { timeout: 10000 });
  await submitPartner(page1, ''); // 상대방 이름 비움 (본인 이름 "김민준"은 이전 제출값 유지)

  var wrapDisplay2 = await page1.evaluate(function () {
    return getComputedStyle(document.getElementById('name-compat-wrap')).display;
  });
  check('상대 이름 미입력: name-compat-wrap 여전히 block(본인 쪽 축약 표시)', wrapDisplay2 === 'block', 'actual ' + wrapDisplay2);

  var chipCount2 = await page1.locator('#name-compat-content .name-chip').count();
  check('축약 표시: 본인 이름 음절 수만큼 칩 렌더(3)', chipCount2 === 3, '실제 ' + chipCount2);

  var giveTakeCardCount2 = await page1.locator('#name-compat-content .suri-card').count();
  check('한쪽만 입력 시 서로 주는 기운 카드 없음', giveTakeCardCount2 === 0, '실제 ' + giveTakeCardCount2);

  var singleNoteText = await page1.evaluate(function () {
    return document.getElementById('name-compat-content').textContent;
  });
  check('축약 안내 문구("상대방 이름도 입력하시면") 노출', singleNoteText.indexOf('상대방 이름도 입력하시면') >= 0);

  await p1.ctx.close();

  // ============================================================
  // 3. 이름 0개(본인/상대 둘 다 미입력) — 섹션 자체 숨김
  // ============================================================
  var p2 = await freshPage(browser, '2026-08-16T09:00:00');
  var page2 = p2.page;

  await submitSelf(page2, ''); // 본인 이름 미입력
  check('본인 이름 미입력 시 이름풀이 탭 없음(회귀)', await page2.locator('.tab-btn[data-tab="name"]').count() === 0);

  await submitPartner(page2, ''); // 상대 이름도 미입력

  var wrapDisplay3 = await page2.evaluate(function () {
    return getComputedStyle(document.getElementById('name-compat-wrap')).display;
  });
  check('이름 0개 입력: name-compat-wrap display=none(섹션 없음)', wrapDisplay3 === 'none', 'actual ' + wrapDisplay3);

  var contentEmpty = await page2.evaluate(function () {
    return document.getElementById('name-compat-content').innerHTML.trim();
  });
  check('name-compat-content 비어있음', contentEmpty === '', 'actual length ' + contentEmpty.length);

  // 기존 궁합 결과(사주 궁합)는 여전히 정상 렌더되는지(무변경 병기 확인)
  check('이름 없어도 기존 궁합 헤드라인은 정상 렌더', (await page2.textContent('#compat-headline')).trim().length > 0);

  await p2.ctx.close();

  // ============================================================
  // 4. 콘솔 에러 0
  // ============================================================
  check('콘솔 에러 0건 (전체 페이즈 합산)', errors.length === 0, JSON.stringify(errors));

  await browser.close();

  console.log('');
  console.log(fails === 0 ? 'ALL PASS (e2e name compat)' : (fails + ' FAILED (e2e name compat)'));
  process.exit(fails === 0 ? 0 : 1);
})();
