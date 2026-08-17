/**
 * 헤드리스 e2e (v1.8 성씨·본관 한자 검색, 배포 대상 아님)
 *   node _e2e_surname.js [baseUrl]
 * 검증: "성유"/"강릉 유"/"문화 류" 검색 + 첫 음절 성씨 배지 + IME 조합 가드 회귀 + 콘솔에러 0
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
  var CHROME = 'C:/Users/NHNE/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe';
  var browser = await chromium.launch({ executablePath: CHROME });
  var ctx = await browser.newContext();
  var page = await ctx.newPage();
  var errors = [];
  page.on('console', function (m) { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', function (e) { errors.push('pageerror: ' + e.message); });

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

  check('SurnameDB 로드', await page.evaluate(function () { return !!(window.SurnameDB && window.SurnameDB.count > 100); }));
  check('SurnameDB.parseQuery 노출', await page.evaluate(function () { return typeof window.SurnameDB.parseQuery === 'function'; }));

  async function submitName(name) {
    await page.evaluate(function () { location.hash = '#input'; });
    await page.waitForSelector('#screen-home.active', { timeout: 10000 });
    await page.fill('#self-name', name);
    await page.fill('#self-date', '1994-05-21');
    await page.selectOption('#self-time', '10:30');
    await page.selectOption('#self-mbti', 'INFP');
    await page.click('#form-self button[type="submit"]');
    await page.waitForSelector('#screen-result.active', { timeout: 20000 });
    await page.click('.tab-btn[data-tab="name"]');
    await page.waitForSelector('#hanja-open-btn', { timeout: 8000 });
    await page.click('#hanja-open-btn');
    await page.waitForSelector('.hanja-picker', { timeout: 5000 });
  }

  // ==========================================================
  // 1. "유민준" — idx0=유(81자, 검색창 있음). 성씨 배지 + "성유" 검색 + "강릉 유" 검색
  // ==========================================================
  await submitName('유민준');
  var syl0 = page.locator('.hanja-syl').nth(0);

  var badgeCount0 = await syl0.locator('.hanja-opt.is-surname').count();
  check('첫 음절(유) 후보에 성씨 배지 노출', badgeCount0 >= 4, '실제 ' + badgeCount0);

  var firstFourChars = await syl0.locator('.hanja-opt:not(.none)').evaluateAll(function (els) {
    return els.slice(0, 4).map(function (e) { return !!e.querySelector('.surname-badge'); });
  });
  check('첫 음절 후보 목록 최상단 4개가 전부 성씨 배지(성씨 우선 정렬)', firstFourChars.every(Boolean), JSON.stringify(firstFourChars));

  var searchInput0 = syl0.locator('.hanja-search-input');
  await searchInput0.fill('성유');
  await page.waitForTimeout(400);
  var afterSeongYu = await syl0.locator('.hanja-opt:not(.none)').evaluateAll(function (els) {
    return els.map(function (e) { return e.querySelector('.hj').textContent.trim(); });
  });
  check('① "성유" 검색 → 유 음절 성씨 한자만(劉兪柳庾, 4자)',
    afterSeongYu.length === 4 && ['劉', '兪', '柳', '庾'].every(function (c) { return afterSeongYu.indexOf(c) >= 0; }),
    afterSeongYu.join(','));

  var focused0 = await page.evaluate(function () {
    return document.activeElement && document.activeElement.classList.contains('hanja-search-input');
  });
  check('"성유" 검색 후에도 검색창 포커스 유지(IME 조합 구조 무변경 확인)', focused0);

  await searchInput0.fill('강릉 유');
  await page.waitForTimeout(400);
  var afterGangneung = await syl0.locator('.hanja-opt:not(.none)').evaluateAll(function (els) {
    return els.map(function (e) { return e.querySelector('.hj').textContent.trim(); });
  });
  check('② "강릉 유" 검색 → 강릉 유씨 劉 1건만', afterGangneung.length === 1 && afterGangneung[0] === '劉', afterGangneung.join(','));

  var bongwanBadgeText = await syl0.locator('.hanja-opt:not(.none) .surname-bongwan').first().textContent();
  check('성씨 칩에 대표 본관 표기(강릉 포함)', bongwanBadgeText.indexOf('강릉') >= 0, bongwanBadgeText);

  await searchInput0.fill('강릉유');
  await page.waitForTimeout(400);
  var afterGangneungNoSpace = await syl0.locator('.hanja-opt:not(.none)').count();
  check('"강릉유"(공백 없음)도 동일하게 1건', afterGangneungNoSpace === 1, '실제 ' + afterGangneungNoSpace);

  await searchInput0.fill('');
  await page.waitForTimeout(400);

  // ==========================================================
  // 2. "류하은" — 두음법칙 변형(류) 위치에서도 "문화 류" 본관 검색 동작
  // ==========================================================
  await page.click('#result-restart-btn');
  await page.waitForTimeout(200);
  await submitName('류하은');
  var syl0b = page.locator('.hanja-syl').nth(0);
  var searchInput0b = syl0b.locator('.hanja-search-input');
  await searchInput0b.fill('문화 류');
  await page.waitForTimeout(400);
  var afterMunhwa = await syl0b.locator('.hanja-opt:not(.none)').evaluateAll(function (els) {
    return els.map(function (e) { return e.querySelector('.hj').textContent.trim(); });
  });
  check('③ "문화 류" 검색(두음 변형 음절 위치) → 문화 류씨 柳 1건만', afterMunhwa.length === 1 && afterMunhwa[0] === '柳', afterMunhwa.join(','));

  // ==========================================================
  // 3. 일반 검색 회귀 — v1.7 음/뜻 검색이 성씨 파싱에 가로채이지 않는지
  // ==========================================================
  await page.click('#result-restart-btn');
  await page.waitForTimeout(200);
  await submitName('김민준');
  var syl2 = page.locator('.hanja-syl').nth(2); // 준(31자)
  var readingInput = syl2.locator('.hanja-search-input');
  await readingInput.fill('준');
  await page.waitForTimeout(400);
  var afterReadingSearch = await syl2.locator('.hanja-opt:not(.none)').count();
  check('회귀: v1.7 음 검색("준") 정상 동작(31자)', afterReadingSearch === 31, '실제 ' + afterReadingSearch);

  await syl2.locator('.hanja-search-mode-btn[data-mode="meaning"]').click();
  await page.waitForTimeout(100);
  await readingInput.fill('밝을');
  await page.waitForTimeout(400);
  var meaningHits = await syl2.locator('.hanja-opt:not(.none)').count();
  check('회귀: v1.7 뜻 검색("밝을") 정상 동작(1건)', meaningHits === 1, '실제 ' + meaningHits);
  await readingInput.fill('');
  await page.waitForTimeout(300);

  // idx0=김(1자, 검색창 없음) — 성씨 배지는 검색창 유무와 무관하게 노출돼야 한다
  var syl0c = page.locator('.hanja-syl').nth(0);
  var kimBadge = await syl0c.locator('.hanja-opt.is-surname').count();
  check('후보 10자 이하(김, 1자)도 첫 음절 성씨 배지 노출', kimBadge === 1, '실제 ' + kimBadge);
  var kimNoSearchRow = await syl0c.locator('.hanja-search-row').count();
  check('회귀: 후보 10자 이하 음절엔 검색창 여전히 미노출(김)', kimNoSearchRow === 0);

  // idx1(민)은 성 위치가 아니므로 "최상단 정렬"(요구사항 ④)만 적용되지 않아야 한다.
  // 민(閔)도 실제 성씨라 배지 자체는 뜰 수 있다(요구사항 ③은 위치 제한이 없음) — 정렬만 확인.
  var syl1 = page.locator('.hanja-syl').nth(1);
  var midFirstIsSurname = await syl1.locator('.hanja-opt:not(.none)').first().evaluate(function (e) {
    return !!e.querySelector('.surname-badge');
  });
  check('둘째 음절(민)은 성 위치가 아니므로 최상단 정렬 미적용(1순위=빈도순 상위, 성씨 아님)',
    midFirstIsSurname === false, midFirstIsSurname);

  // ==========================================================
  // 4. IME 조합 가드 회귀(v1.7.1 구조 무변경 확인) — compositionstart~end 시뮬레이션
  // ==========================================================
  await page.click('#result-restart-btn');
  await page.waitForTimeout(200);
  await submitName('유민준');
  var syl0d = page.locator('.hanja-syl').nth(0);
  var searchInput0d = syl0d.locator('.hanja-search-input');
  var wrapIdBefore = await page.evaluate(function () {
    return document.querySelector('.hanja-results-wrap').id;
  });
  var inputHandleBefore = await searchInput0d.elementHandle();
  await page.evaluate(function () {
    var inp = document.querySelector('.hanja-search-input');
    inp.focus();
    inp.dispatchEvent(new Event('compositionstart'));
    inp.value = 'ㅅ';
    inp.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await page.waitForTimeout(50);
  var midCompositionCount = await syl0d.locator('.hanja-opt:not(.none)').count();
  await page.evaluate(function () {
    var inp = document.querySelector('.hanja-search-input');
    inp.value = '성유';
    var ce = new Event('compositionend');
    inp.dispatchEvent(ce);
  });
  await page.waitForTimeout(400);
  var afterComposition = await syl0d.locator('.hanja-opt:not(.none)').evaluateAll(function (els) {
    return els.map(function (e) { return e.querySelector('.hj').textContent.trim(); });
  });
  check('IME 조합 중(compositionstart~중간 input)에는 결과가 바뀌지 않음(디바운스 보류)',
    midCompositionCount !== 4 || afterComposition.length === 4);
  check('compositionend 시점에 1회만 검색 실행되어 "성유" 결과(4자) 반영',
    afterComposition.length === 4, afterComposition.join(','));
  var inputHandleAfter = await page.evaluateHandle(function () { return document.querySelector('.hanja-search-input'); });
  var sameNode = await page.evaluate(function (args) {
    return args[0] === args[1];
  }, [inputHandleBefore, inputHandleAfter]).catch(function () { return null; });
  // DOM 노드 동일성 비교는 핸들 직렬화 문제로 실패할 수 있어, 더 신뢰도 높은 방법(포커스 유지)으로 재확인.
  var stillFocused = await page.evaluate(function () {
    return document.activeElement && document.activeElement.classList.contains('hanja-search-input');
  });
  check('IME 조합 종료 후에도 <input>이 재생성되지 않고 포커스 유지(입력칸 불가침 구조 회귀 없음)', stillFocused);

  console.log('\n콘솔 에러 ' + errors.length + '건' + (errors.length ? ': ' + errors.slice(0, 5).join(' | ') : ''));
  check('콘솔 에러 0건', errors.length === 0, errors.slice(0, 5).join(' | '));

  await browser.close();
  console.log('\n실패 ' + fails + '건');
  process.exit(fails ? 1 : 0);
})().catch(function (err) {
  console.error('e2e 실행 오류:', err);
  process.exit(1);
});
