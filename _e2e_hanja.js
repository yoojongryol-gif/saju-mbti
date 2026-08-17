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
    // v1.6.1: #home은 프로필 유무와 무관하게 대시보드를 보여주므로, 입력 폼은 #input에서 연다.
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

  // ==========================================================
  // v1.7 한자 검색 (음/뜻/획수 3모드) — DB 확대로 음절당 10자를 넘는 경우가
  // 흔해져 검색 없이는 "제한적"이라는 지적을 받았던 부분. 독립된 이름으로 새로
  // 열어 위쪽 흐름(선택 → 결과 → 폴백 → 다시 고르기)과 상태가 섞이지 않게 한다.
  // ==========================================================
  await page.click('#result-restart-btn');
  await page.waitForTimeout(200);
  await submitName('김민준');
  await page.click('#hanja-open-btn');
  await page.waitForSelector('.hanja-picker', { timeout: 5000 });

  // idx0=김(후보 1자, 검색창 없음) / idx1=민(17자) / idx2=준(31자, 검색창 있음)
  var syl0SearchRow = await page.locator('.hanja-syl').nth(0).locator('.hanja-search-row').count();
  check('후보 10자 이하 음절엔 검색창 미노출(김)', syl0SearchRow === 0, '실제 ' + syl0SearchRow);
  var syl2SearchRow = await page.locator('.hanja-syl').nth(2).locator('.hanja-search-row').count();
  check('후보 10자 초과 음절엔 검색창 노출(준, 31자)', syl2SearchRow === 1);

  var syl2 = page.locator('.hanja-syl').nth(2);
  var defaultChips = await syl2.locator('.hanja-opt:not(.none)').count();
  check('기본 노출 = 빈도순 상위 10 + 더 보기 버튼', defaultChips === 10, '실제 ' + defaultChips);
  var moreBtnText = await syl2.locator('.hanja-more-btn').textContent();
  check('"더 보기" 버튼에 잔여 글자 수 표기(21자)', moreBtnText.indexOf('21') >= 0, moreBtnText);

  await syl2.locator('.hanja-more-btn').click();
  await page.waitForTimeout(150);
  var afterMore = await syl2.locator('.hanja-opt:not(.none)').count();
  check('"더 보기" 클릭 시 31자 전체 노출', afterMore === 31, '실제 ' + afterMore);

  // ① 음 검색 — 이 음절 자체를 입력하면(=이미 그 음으로 걸러진 목록이라) 전체가 다시 보인다
  var readingInput = syl2.locator('.hanja-search-input');
  await readingInput.fill('준');
  await page.waitForTimeout(400); // 200ms 디바운스 + 여유
  var afterReadingSearch = await syl2.locator('.hanja-opt:not(.none)').count();
  check('① 음 검색: "준" 입력 시 그 음의 전 한자(31자) 노출', afterReadingSearch === 31, '실제 ' + afterReadingSearch);
  var focusedIsSearch = await page.evaluate(function () {
    return document.activeElement && document.activeElement.classList.contains('hanja-search-input');
  });
  check('디바운스 재렌더 후에도 검색창 포커스 유지', focusedIsSearch);

  // ② 뜻 키워드 검색 — 모드를 "뜻"으로 바꾸고 "밝을" 검색 → 晙(밝을,11) 1건만 남아야 함
  await syl2.locator('.hanja-search-mode-btn[data-mode="meaning"]').click();
  await page.waitForTimeout(100);
  await readingInput.fill('밝을');
  await page.waitForTimeout(400);
  var meaningHits = await syl2.locator('.hanja-opt:not(.none)').count();
  check('② 뜻 검색: "밝을" → 1건(晙)만 노출', meaningHits === 1, '실제 ' + meaningHits);
  var meaningHitText = await syl2.locator('.hanja-opt:not(.none) .mn').first().textContent();
  check('뜻 검색 결과 뜻 문자열 부분일치 확인', meaningHitText.indexOf('밝을') >= 0, meaningHitText);

  // 검색어를 지우면 다시 기본 상위 10 노출로 돌아온다("더 보기"를 눌러둔 상태였으므로 31로 유지되는지 확인)
  await readingInput.fill('');
  await page.waitForTimeout(400);
  var afterClear = await syl2.locator('.hanja-opt:not(.none)').count();
  check('검색어 비우면 이전 노출 상태(더 보기 눌러둔 31자)로 복귀', afterClear === 31, '실제 ' + afterClear);

  // ③ 획수 필터 — 10획만: 峻/埈/准/隼 4건
  await syl2.locator('.hanja-search-strokes').selectOption('10');
  await page.waitForTimeout(150);
  var strokeHits = await syl2.locator('.hanja-opt:not(.none)').count();
  check('③ 획수 필터: 10획 → 4건', strokeHits === 4, '실제 ' + strokeHits);
  var strokeTexts = await syl2.locator('.hanja-opt:not(.none) .st').allTextContents();
  check('획수 필터 결과가 전부 10획', strokeTexts.every(function (t) { return t.indexOf('10획') >= 0; }), strokeTexts.join(','));

  // 검색 결과 칩도 기존 플로우 그대로 선택된다 (data-idx/data-ch/data-reading → 분석 실행)
  await syl2.locator('.hanja-opt:not(.none)').first().click();
  await page.waitForTimeout(200);
  var pickedFromSearch = await syl2.locator('.hanja-opt.selected').count();
  check('검색 결과 칩 선택도 기존 selected 표시로 반영', pickedFromSearch === 1, '실제 ' + pickedFromSearch);

  // "목록에 없음" 폴백은 검색 필터가 걸려 있어도 항상 노출된다
  var noneStillThere = await syl2.locator('.hanja-opt.none').count();
  check('검색 필터 중에도 "목록에 없음" 선택지 유지', noneStillThere === 1);

  await page.locator('.hanja-syl').nth(0).locator('.hanja-opt:not(.none)').first().click();
  await page.waitForTimeout(120);
  await page.locator('.hanja-syl').nth(1).locator('.hanja-opt:not(.none)').first().click();
  await page.waitForTimeout(200);
  var afterAllPicked = await page.evaluate(function () {
    return document.querySelectorAll('.hanja-card').length;
  });
  check('검색으로 고른 글자 포함 3자 모두 결과에 반영', afterAllPicked === 3, '실제 ' + afterAllPicked);

  check('콘솔 에러 0건', errors.length === 0, errors.slice(0, 3).join(' / '));

  await browser.close();
  console.log('\n실패 ' + fails + '건');
  process.exit(fails ? 1 : 0);
})().catch(function (e) {
  console.error('E2E 실행 오류:', e);
  process.exit(2);
});
