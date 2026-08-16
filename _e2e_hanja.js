/**
 * 헤드리스 e2e (v1.3 한자 뜻풀이, 배포 대상 아님)
 *   node _e2e_hanja.js [baseUrl]
 * 검증: 한자 선택 플로우 완주 / "목록에 없음" 폴백 / 콘솔 에러 0
 * 주의: 서비스워커 캐시가 옛 파일을 물고 있을 수 있어 시작 시 캐시·SW를 전부 지운다.
 */
var PW = 'C:/Users/NHNE/AppData/Local/npm-cache/_npx/9833c18b2d85bc59/node_modules/playwright';
var { chromium } = require(PW);
var BASE = process.argv[2] || 'http://localhost:8123';

var fails = 0;
function check(label, cond, extra) {
  if (cond) console.log('PASS ' + label);
  else { console.log('FAIL ' + label + (extra ? ' — ' + extra : '')); fails++; }
}

(async function () {
  // 이 환경의 playwright 패키지가 기대하는 빌드가 없어 설치돼 있는 chromium을 직접 지정한다.
  var CHROME = 'C:/Users/NHNE/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe';
  var browser = await chromium.launch({ executablePath: CHROME });
  var ctx = await browser.newContext();
  var page = await ctx.newPage();
  var errors = [];
  page.on('console', function (m) { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', function (e) { errors.push('pageerror: ' + e.message); });

  // ---- 서비스워커/캐시 초기화 ----
  await page.goto(BASE + '/index.html', { waitUntil: 'domcontentloaded' });
  await page.evaluate(async function () {
    if (self.caches) { var ks = await caches.keys(); await Promise.all(ks.map(function (k) { return caches.delete(k); })); }
    if (navigator.serviceWorker) {
      var rs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(rs.map(function (r) { return r.unregister(); }));
    }
  });
  await page.reload({ waitUntil: 'load' });
  await page.waitForTimeout(400);

  check('HanjaDB 로드', await page.evaluate(function () { return !!(window.HanjaDB && window.HanjaDB.count > 500); }));
  check('analyzeHanja 노출', await page.evaluate(function () {
    return typeof (window.NameReader || {}).analyzeHanja === 'function';
  }));

  // ---- 입력 → 결과 ----
  async function submitName(name) {
    await page.fill('#self-name', name);
    await page.fill('#self-date', '1994-05-21');
    await page.selectOption('#self-time', '10:30');
    await page.selectOption('#self-mbti', 'INFP');
    await page.click('#form-self button[type="submit"]');
    await page.waitForSelector('#screen-result.active', { timeout: 20000 });
    await page.click('.tab-btn[data-tab="name"]');
    await page.waitForSelector('#hanja-open-btn', { timeout: 8000 });
  }

  await submitName('김민준');
  check('이름풀이 탭에 "한자로 더 보기" 버튼 노출', await page.locator('#hanja-open-btn').count() === 1);

  await page.click('#hanja-open-btn');
  await page.waitForSelector('.hanja-picker', { timeout: 5000 });
  var sylCount = await page.locator('.hanja-syl').count();
  check('음절 수만큼 선택 그룹 렌더 (3)', sylCount === 3, '실제 ' + sylCount);
  var noneCount = await page.locator('.hanja-opt.none').count();
  check('음절마다 "목록에 없음" 선택지 존재 (3)', noneCount === 3, '실제 ' + noneCount);
  var chipHasMeaning = await page.evaluate(function () {
    var b = document.querySelector('.hanja-opt:not(.none)');
    return !!(b && b.querySelector('.hj') && b.querySelector('.mn') && b.querySelector('.mn').textContent.trim());
  });
  check('후보 칩에 한자 + 뜻 미리보기 표시', chipHasMeaning);

  // ---- 전 음절 선택 → 결과 렌더 ----
  for (var i = 0; i < 3; i++) {
    await page.locator('.hanja-syl').nth(i).locator('.hanja-opt:not(.none)').first().click();
    await page.waitForTimeout(120);
  }
  await page.waitForSelector('.hanja-char-row', { timeout: 5000 });
  var sections = await page.evaluate(function () {
    var titles = Array.prototype.map.call(document.querySelectorAll('.reco-section-title'),
      function (n) { return n.textContent.trim(); });
    return titles;
  });
  check('뜻풀이 섹션 렌더', sections.indexOf('글자에 담긴 뜻') >= 0, sections.join(' | '));
  check('자원오행 사주보완 섹션 렌더', sections.indexOf('자원오행과 사주') >= 0);
  check('원획 수리 4격 섹션 렌더(한글 수리와 구분 표기)',
    sections.indexOf('원획 수리 4격 (한자 기준)') >= 0 && sections.indexOf('수리 4격 (원형이정)') >= 0);
  check('한자 종합 카드 렌더', sections.indexOf('한자 풀이 종합') >= 0);

  var suriCards = await page.locator('.suri-card').count();
  check('수리 카드 8장 (한글 4 + 한자 4)', suriCards === 8, '실제 ' + suriCards);
  var noteVisible = await page.locator('.suri-hanja-note').count();
  check('한글/한자 수리 구분 안내 문구 존재', noteVisible === 1);
  var meaningLen = await page.evaluate(function () {
    var secs = document.querySelectorAll('.reco-section');
    for (var i = 0; i < secs.length; i++) {
      var t = secs[i].querySelector('.reco-section-title');
      if (t && t.textContent.trim() === '글자에 담긴 뜻') {
        var p = secs[i].querySelector('.tab-para');
        return p ? p.textContent.trim() : '';
      }
    }
    return '';
  });
  check('뜻 조합 문단이 자연 문장(30자 이상)', meaningLen.length >= 30, meaningLen.slice(0, 40));
  check('뜻 문단에 템플릿 자리표시자 잔여 없음',
    meaningLen.indexOf('%') === -1 && meaningLen.indexOf('{') === -1);

  var cardCount = await page.locator('.hanja-card').count();
  check('글자 카드 3장', cardCount === 3, '실제 ' + cardCount);

  // ---- "목록에 없음" 폴백 ----
  await page.locator('.hanja-syl').nth(1).locator('.hanja-opt.none').click();
  await page.waitForTimeout(250);
  var afterNone = await page.evaluate(function () {
    var titles = Array.prototype.map.call(document.querySelectorAll('.reco-section-title'),
      function (n) { return n.textContent.trim(); });
    return {
      titles: titles,
      cards: document.querySelectorAll('.hanja-card').length,
      suri: document.querySelectorAll('.suri-card').length
    };
  });
  check('폴백: 원획 수리 4격 섹션 사라짐', afterNone.titles.indexOf('원획 수리 4격 (한자 기준)') === -1);
  check('폴백: 한글 수리 4격은 그대로 유지', afterNone.titles.indexOf('수리 4격 (원형이정)') >= 0 && afterNone.suri === 4);
  check('폴백: 고른 글자 2자만 카드로 표시', afterNone.cards === 2, '실제 ' + afterNone.cards);

  // ---- 전부 "목록에 없음" ----
  await page.locator('.hanja-syl').nth(0).locator('.hanja-opt.none').click();
  await page.waitForTimeout(120);
  await page.locator('.hanja-syl').nth(2).locator('.hanja-opt.none').click();
  await page.waitForTimeout(250);
  var allNone = await page.evaluate(function () {
    var hint = document.querySelector('.hanja-hint');
    return {
      hint: hint ? hint.textContent : '',
      cards: document.querySelectorAll('.hanja-card').length
    };
  });
  check('전부 미선택 시 안내 문구 표시', allNone.hint.indexOf('목록에 없음') >= 0, allNone.hint);
  check('전부 미선택 시 한자 결과 없음', allNone.cards === 0);

  // ---- 다시 고르기 ----
  await page.click('#hanja-reset-btn');
  await page.waitForTimeout(250);
  check('다시 고르기 후 선택 초기화',
    await page.locator('.hanja-opt.selected').count() === 0);

  // ---- 한자 후보가 드문 이름도 안전한지 ----
  await page.click('#result-restart-btn');
  await page.waitForTimeout(200);
  await submitName('길동이');
  await page.click('#hanja-open-btn');
  await page.waitForSelector('.hanja-picker', { timeout: 5000 });
  check('다른 이름도 선택 UI 정상 렌더', await page.locator('.hanja-syl').count() === 3);

  check('콘솔 에러 0건', errors.length === 0, errors.slice(0, 3).join(' / '));

  await browser.close();
  console.log('\n실패 ' + fails + '건');
  process.exit(fails ? 1 : 0);
})().catch(function (e) {
  console.error('E2E 실행 오류:', e);
  process.exit(2);
});
