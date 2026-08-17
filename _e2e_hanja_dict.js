/**
 * 헤드리스 e2e — v1.10 한자 사전 화면 (#hanja-dict, 배포 대상 아님)
 *   node _e2e_hanja_dict.js [baseUrl]
 *
 * 검증: 메뉴/대시보드 "한자풀이" → 사전 화면 진입 / 이름 입력 없이 동작 /
 *       음·뜻·획수 검색 / 글자 선택 → 단독 풀이 카드(파자·부수·획수·기운) /
 *       忍 파자 표시 / 성씨 한자 본관 표시 / IME 입력칸 불가침 / 콘솔 에러 0
 * 주의: 서비스워커 캐시가 옛 파일을 물고 있을 수 있어 시작 시 캐시·SW를 전부 지운다.
 */
var PW = 'C:/Users/NHNE/AppData/Local/npm-cache/_npx/9833c18b2d85bc59/node_modules/playwright';
var { chromium } = require(PW);
var BASE = process.argv[2] || 'http://localhost:8123';
var CHROME = 'C:/Users/NHNE/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe';

var fails = 0;
function check(label, cond, extra) {
  if (cond) console.log('PASS ' + label);
  else { console.log('FAIL ' + label + (extra ? ' — ' + extra : '')); fails++; }
}

(async function () {
  var browser = await chromium.launch({ executablePath: CHROME });
  var ctx = await browser.newContext({ viewport: { width: 420, height: 900 } });
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
    try { localStorage.clear(); } catch (e) {}
  });
  await page.reload({ waitUntil: 'load' });
  await page.waitForTimeout(400);

  // ============================================================
  // ① 진입 — 프로필도 이름도 없는 상태에서 메뉴 "한자풀이"
  // ============================================================
  check('시작 시 저장 프로필 없음',
    await page.evaluate(function () { return !(window.ProfileStore && window.ProfileStore.getActive()); }));
  await page.click('#header-menu-btn');
  await page.waitForTimeout(350);
  await page.click('.menu-tile[data-menu="hanja"]');
  await page.waitForSelector('#screen-hanja-dict.active', { timeout: 8000 });
  check('메뉴 "한자풀이" → 사전 화면(#hanja-dict) 진입', true);
  check('해시가 #hanja-dict 로 갱신(뒤로가기 복원 가능)',
    (await page.evaluate(function () { return location.hash; })) === '#hanja-dict');
  check('이름 입력 필드를 요구하지 않음',
    await page.locator('#screen-hanja-dict input[type="text"]').count() === 1);
  check('검색 전에는 안내 문구만 노출(결과 칩 없음)',
    await page.locator('#dict-results .hanja-opt').count() === 0 &&
    await page.locator('#dict-results .dict-hint').count() === 1);
  check('상세 카드는 아직 비어 있음',
    (await page.evaluate(function () { return document.getElementById('dict-detail').innerHTML.trim(); })) === '');

  // 대시보드 타일 경로도 같은 화면으로 간다
  await page.evaluate(function () { location.hash = '#home'; });
  await page.waitForTimeout(400);
  await page.click('.dash-tile[data-route="hanja-dict"]');
  await page.waitForSelector('#screen-hanja-dict.active', { timeout: 8000 });
  check('대시보드 "한자 뜻풀이" 타일도 사전 화면으로', true);

  // ============================================================
  // ② 음(音) 검색 → 글자 선택 → 단독 풀이 카드
  // ============================================================
  await page.fill('#dict-search-input', '인');
  await page.waitForTimeout(400);
  var chips = await page.locator('#dict-results .hanja-opt').count();
  check('음 검색 "인" → 결과 칩 표시', chips > 5, '실제 ' + chips);
  check('결과 개수 표기 노출', await page.locator('#dict-results .dict-count').count() === 1);

  var inChip = page.locator('#dict-results .hanja-opt[data-dict-ch="忍"]');
  check('검색 결과에 忍 존재', await inChip.count() === 1);
  await inChip.click();
  await page.waitForTimeout(400);

  var card = await page.evaluate(function () {
    var d = document.getElementById('dict-detail');
    return {
      hero: d.querySelectorAll('.dict-hero').length,
      glyph: (d.querySelector('.dict-hero .g') || {}).textContent,
      meaning: (d.querySelector('.dict-hero .m') || {}).textContent,
      sub: (d.querySelector('.dict-hero .s') || {}).textContent,
      badges: Array.prototype.map.call(d.querySelectorAll('.dict-badge'),
        function (n) { return n.textContent.trim(); }),
      parts: Array.prototype.map.call(d.querySelectorAll('.hj-part .pc'),
        function (n) { return n.textContent.trim(); }).join(''),
      breakPara: (d.querySelector('.hj-break-para') || {}).textContent,
      radSym: (d.querySelector('.hj-rad-sym') || {}).textContent,
      titles: Array.prototype.map.call(d.querySelectorAll('.reco-section-title'),
        function (n) { return n.textContent.trim(); }),
      energy: (d.querySelector('.reco-section .tab-para') || {}).textContent,
      goBtn: d.querySelectorAll('#dict-go-name-btn').length,
      inCard: d.querySelectorAll('.card .dict-hero').length
    };
  });
  check('풀이 카드 렌더', card.hero === 1);
  check('글자·뜻·음 표시', card.glyph === '忍' && /참을\s*인/.test(card.meaning || ''),
    card.glyph + ' / ' + card.meaning);
  check('원획·필획 함께 표시', /원획\s*7획/.test(card.sub || '') && /필획\s*7획/.test(card.sub || ''),
    card.sub);
  check('자원오행·부수 배지 표시',
    card.badges.some(function (b) { return /자원오행/.test(b); }) &&
    card.badges.some(function (b) { return /부수/.test(b); }), card.badges.join(','));
  check('忍 파자 = 忍 + 刃 + 心', card.parts === '忍刃心', card.parts);
  check('파자 풀이 문장에 칼날/마음 등장',
    /칼날/.test(card.breakPara || '') && /마음/.test(card.breakPara || ''),
    String(card.breakPara).slice(0, 50));
  check('부수 상징 한 줄 표시', /마음 심/.test(card.radSym || ''), card.radSym);
  check('섹션 구성: 자형(파자) 풀이 + 이름에 쓸 때',
    card.titles.indexOf('자형(파자) 풀이') >= 0 && card.titles.indexOf('이름에 쓸 때') >= 0,
    card.titles.join(' | '));
  check('이름에 쓸 때의 기운 한 줄 표시',
    !!card.energy && card.energy.length > 20 && /자원오행|획/.test(card.energy),
    String(card.energy).slice(0, 40));
  check('"이 글자로 이름풀이 하러 가기" 링크 제공', card.goBtn === 1);
  check('풀이 카드가 한지(.card) 스코프 안에 있음(대비 확보)', card.inCard === 1);

  // ============================================================
  // ③ 성씨 한자 → 본관 정보 (v1.8 재사용)
  // ============================================================
  await page.fill('#dict-search-input', '김');
  await page.waitForTimeout(400);
  var kimChip = page.locator('#dict-results .hanja-opt[data-dict-ch="金"]');
  check('성씨 한자 金 검색됨', await kimChip.count() === 1);
  check('성씨 칩에 "성씨" 배지', await kimChip.locator('.surname-badge').count() === 1);
  await kimChip.click();
  await page.waitForTimeout(400);
  var sur = await page.evaluate(function () {
    var d = document.getElementById('dict-detail');
    return {
      titles: Array.prototype.map.call(d.querySelectorAll('.reco-section-title'),
        function (n) { return n.textContent.trim(); }),
      bongwan: (d.querySelector('.dict-bongwan') || {}).textContent,
      surBadge: Array.prototype.map.call(d.querySelectorAll('.dict-badge'),
        function (n) { return n.textContent.trim(); }).join(',')
    };
  });
  check('성씨 한자면 "성씨로 쓰일 때" 섹션 노출',
    sur.titles.indexOf('성씨로 쓰일 때') >= 0, sur.titles.join(' | '));
  check('본관 정보 표시(김해 포함)', /김해/.test(sur.bongwan || ''),
    String(sur.bongwan).slice(0, 60));
  check('성씨 한자 배지 표시', /성씨 한자/.test(sur.surBadge), sur.surBadge);

  // 성씨가 아닌 글자는 본관 섹션이 없다
  await page.fill('#dict-search-input', '인');
  await page.waitForTimeout(400);
  await page.locator('#dict-results .hanja-opt[data-dict-ch="忍"]').click();
  await page.waitForTimeout(350);
  check('성씨가 아닌 글자는 본관 섹션 없음',
    await page.evaluate(function () {
      return Array.prototype.map.call(
        document.querySelectorAll('#dict-detail .reco-section-title'),
        function (n) { return n.textContent.trim(); }).indexOf('성씨로 쓰일 때') === -1;
    }));

  // ============================================================
  // ④ 뜻 검색 · 획수 필터
  // ============================================================
  await page.click('.hanja-search-mode-btn[data-dict-mode="meaning"]');
  await page.fill('#dict-search-input', '밝을');
  await page.waitForTimeout(400);
  var meaningRows = await page.evaluate(function () {
    return Array.prototype.map.call(document.querySelectorAll('#dict-results .hanja-opt .mn'),
      function (n) { return n.textContent.trim(); });
  });
  check('뜻 검색 "밝을" → 결과 있음', meaningRows.length > 0, '실제 ' + meaningRows.length);
  check('뜻 검색 결과가 전부 "밝을" 포함',
    meaningRows.every(function (t) { return t.indexOf('밝을') >= 0; }),
    meaningRows.filter(function (t) { return t.indexOf('밝을') === -1; })[0]);

  await page.selectOption('#dict-search-strokes', '8');
  await page.waitForTimeout(400);
  var strokeRows = await page.evaluate(function () {
    return Array.prototype.map.call(document.querySelectorAll('#dict-results .hanja-opt .st'),
      function (n) { return n.textContent.trim(); });
  });
  check('획수 필터 8획 적용 시 결과 존재', strokeRows.length > 0, '실제 ' + strokeRows.length);
  check('획수 필터 결과가 전부 8획',
    strokeRows.every(function (t) { return t === '8획'; }), strokeRows.join(','));
  await page.selectOption('#dict-search-strokes', '');
  await page.waitForTimeout(300);

  // ============================================================
  // ⑤ v1.7.1 IME 원칙 — 검색 <input>이 재생성되지 않는다
  // ============================================================
  await page.click('.hanja-search-mode-btn[data-dict-mode="reading"]');
  await page.waitForTimeout(200);
  await page.evaluate(function () {
    window.__dictInputRef = document.getElementById('dict-search-input');
    window.__dictInputRef.dataset.imeProbe = 'keep';
  });
  await page.fill('#dict-search-input', '민');
  await page.waitForTimeout(450);
  await page.locator('#dict-results .hanja-opt').first().click();
  await page.waitForTimeout(400);
  var imeSafe = await page.evaluate(function () {
    var now = document.getElementById('dict-search-input');
    return {
      same: now === window.__dictInputRef,
      probe: now.dataset.imeProbe,
      value: now.value,
      focusable: document.activeElement !== null
    };
  });
  check('검색 결과 갱신·글자 선택 후에도 <input> 동일 노드 유지(IME 조합 불가침)',
    imeSafe.same === true && imeSafe.probe === 'keep',
    'same=' + imeSafe.same + ' probe=' + imeSafe.probe);
  check('검색어가 그대로 남아 있음', imeSafe.value === '민', imeSafe.value);

  // ============================================================
  // ⑥ 이름풀이 흐름은 그대로 (v1.10에서 분리만 하고 기존 흐름 무변경)
  // ============================================================
  await page.click('#dict-go-name-btn');
  await page.waitForSelector('#screen-name-standalone.active', { timeout: 8000 });
  check('"이름풀이 하러 가기" → 기존 이름풀이 단독 화면', true);
  await page.fill('#name-standalone-input', '김민준');
  await page.click('#form-name-standalone button[type="submit"]');
  await page.waitForSelector('#hanja-open-btn', { timeout: 8000 });
  check('이름풀이 흐름 유지: 결과 + "한자로 더 보기" 버튼 존재', true);

  await page.evaluate(function () { location.hash = '#hanja-dict'; });
  await page.waitForSelector('#screen-hanja-dict.active', { timeout: 8000 });
  check('사전 화면 재진입 시 이전 검색/선택 상태 복원',
    await page.locator('#dict-results .hanja-opt').count() > 0 &&
    await page.locator('#dict-detail .dict-hero').count() === 1);

  check('콘솔 에러 0건', errors.length === 0, errors.slice(0, 3).join(' / '));

  await browser.close();
  console.log('\n실패 ' + fails + '건');
  process.exit(fails ? 1 : 0);
})().catch(function (e) {
  console.error('E2E 실행 오류:', e);
  process.exit(2);
});
