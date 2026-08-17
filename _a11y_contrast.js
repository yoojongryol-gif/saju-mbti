/**
 * _a11y_contrast.js — WCAG 대비(contrast) 자동 스캔 (v1.9, 배포 대상 아님)
 *   node _a11y_contrast.js [baseUrl]
 *
 * 전 화면(홈 대시보드·입력·결과 5탭·한자 심화·궁합·메뉴시트)을 돌며 텍스트가 있는
 * 요소마다 실효 전경색/배경색을 구해 WCAG 2.1 대비비를 계산하고 4.5:1(대형 텍스트는
 * 3:1) 미달 요소를 목록화한다.
 *
 * 배경색 산출: 요소 자신의 background-color가 투명하면 조상으로 올라가며 불투명한
 * 색을 찾고, 도중의 반투명 레이어들을 아래에서 위로 알파 합성한다. background-image
 * (그라디언트/SVG)가 걸린 조상은 색을 알 수 없으므로 해당 요소는 'image-bg'로 표시해
 * 별도 목록에 둔다(자동 판정 불가 → 사람이 확인).
 */
var PW = 'C:/Users/NHNE/AppData/Local/npm-cache/_npx/9833c18b2d85bc59/node_modules/playwright';
var { chromium } = require(PW);
var BASE = process.argv[2] || 'http://localhost:8123';
var CHROME = 'C:/Users/NHNE/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe';

var SCAN = function () {
  function parseColor(s) {
    var m = String(s).match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    var p = m[1].split(',').map(function (x) { return parseFloat(x); });
    return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
  }
  function over(fg, bg) { // fg를 bg 위에 알파 합성
    var a = fg.a;
    return { r: fg.r * a + bg.r * (1 - a), g: fg.g * a + bg.g * (1 - a), b: fg.b * a + bg.b * (1 - a), a: 1 };
  }
  function lum(c) {
    function f(v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }
    return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b);
  }
  function ratio(a, b) {
    var l1 = lum(a), l2 = lum(b);
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  }
  function selectorOf(el) {
    var s = el.tagName.toLowerCase();
    if (el.id) return s + '#' + el.id;
    if (el.className && typeof el.className === 'string') s += '.' + el.className.trim().split(/\s+/).slice(0, 3).join('.');
    return s;
  }
  var out = [];
  var all = document.querySelectorAll('body *');
  for (var i = 0; i < all.length; i++) {
    var el = all[i];
    // 직접 자식 텍스트 노드가 있는 요소만 (컨테이너 중복 집계 방지)
    var text = '';
    for (var n = 0; n < el.childNodes.length; n++) {
      if (el.childNodes[n].nodeType === 3) text += el.childNodes[n].nodeValue;
    }
    text = text.replace(/\s+/g, ' ').trim();
    if (!text) continue;
    var rect = el.getBoundingClientRect();
    var cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none' || parseFloat(cs.opacity) === 0) continue;
    if (rect.width < 1 || rect.height < 1) continue;

    var fg = parseColor(cs.color);
    if (!fg) continue;

    // 배경: 위로 올라가며 레이어 수집.
    // background-image 가 그라디언트면 색 정지점들의 평균을 불투명 레이어로 친다
    // (금박 탭·야경 히어로 카드처럼 그라디언트 위에 글씨를 올린 곳을 바르게 판정하기 위함).
    // 그라디언트가 아닌 이미지(SVG 문양 등)는 색을 알 수 없어 imageBg 로 표시해 보류 처리.
    var layers = [], node = el, imageBg = false;
    while (node && node !== document.documentElement) {
      var s2 = getComputedStyle(node);
      var bi = s2.backgroundImage;
      var bc = parseColor(s2.backgroundColor);
      // layers 는 "위 → 아래" 순으로 쌓는다(합성 때 뒤에서부터 올린다).
      // 한 요소 안에서는 background-image 가 background-color 위에 그려지므로 먼저 넣는다.
      if (bi && bi !== 'none') {
        var stops = bi.match(/rgba?\([^)]+\)/g);
        if (/gradient/.test(bi) && stops && stops.length) {
          var acc = { r: 0, g: 0, b: 0, a: 0 }, used = 0;
          stops.forEach(function (s3) {
            var c3 = parseColor(s3);
            if (!c3) return;
            acc.r += c3.r; acc.g += c3.g; acc.b += c3.b; acc.a += c3.a; used++;
          });
          if (used) layers.push({ r: acc.r / used, g: acc.g / used, b: acc.b / used, a: acc.a / used });
          if (used && acc.a / used >= 0.99) break;
        } else {
          imageBg = true;
        }
      }
      if (bc && bc.a > 0) layers.push(bc);
      if (bc && bc.a >= 1) break;
      node = node.parentElement;
    }
    var base = { r: 255, g: 255, b: 255, a: 1 };
    var bs = parseColor(getComputedStyle(document.body).backgroundColor);
    if (bs && bs.a >= 1) base = bs;
    var bg = base;
    for (var k = layers.length - 1; k >= 0; k--) bg = over(layers[k], bg);

    var eff = fg.a < 1 ? over(fg, bg) : fg;
    var r = ratio(eff, bg);
    var fsize = parseFloat(cs.fontSize);
    var bold = parseInt(cs.fontWeight, 10) >= 700;
    var large = fsize >= 24 || (fsize >= 18.66 && bold);
    var need = large ? 3 : 4.5;
    if (r < need) {
      out.push({
        sel: selectorOf(el), text: text.slice(0, 34), ratio: Math.round(r * 100) / 100,
        need: need, color: cs.color, bg: 'rgb(' + Math.round(bg.r) + ',' + Math.round(bg.g) + ',' + Math.round(bg.b) + ')',
        fontSize: fsize, imageBg: imageBg
      });
    }
  }
  return out;
};

(async function () {
  var browser = await chromium.launch({ executablePath: CHROME });
  var ctx = await browser.newContext({ viewport: { width: 420, height: 900 } });
  var page = await ctx.newPage();
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

  var seen = {}, total = 0, imageBgCount = 0;
  async function scan(label) {
    await page.waitForTimeout(300);
    var rows = await page.evaluate(SCAN);
    rows.forEach(function (r) {
      var key = r.sel + '|' + r.text;
      if (seen[key]) return;
      seen[key] = true;
      total++;
      if (r.imageBg) imageBgCount++;
      console.log((r.imageBg ? '~' : '!') + ' [' + label + '] ' + r.sel +
        '  ratio=' + r.ratio + ' (need ' + r.need + ')  color=' + r.color + ' on ' + r.bg +
        '  "' + r.text + '"');
    });
  }

  // ---- 입력 화면 ----
  await page.evaluate(function () { location.hash = '#input'; });
  await page.waitForSelector('#screen-home.active', { timeout: 10000 });
  await scan('입력');

  // ---- 메뉴 시트 ----
  await page.click('#header-menu-btn');
  await page.waitForTimeout(350);
  await scan('메뉴시트');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);

  // ---- 결과 5탭 ----
  await page.fill('#self-name', '김민준');
  await page.fill('#self-date', '1994-05-21');
  await page.selectOption('#self-time', '10:30');
  await page.selectOption('#self-mbti', 'INFP');
  await page.click('#form-self button[type="submit"]');
  await page.waitForSelector('#screen-result.active', { timeout: 20000 });
  var tabs = await page.$$eval('.tab-btn', function (bs) { return bs.map(function (b) { return b.dataset.tab; }); });
  for (var t = 0; t < tabs.length; t++) {
    await page.click('.tab-btn[data-tab="' + tabs[t] + '"]');
    await scan('결과:' + tabs[t]);
  }

  // ---- 한자 심화 화면 ----
  await page.click('.tab-btn[data-tab="name"]');
  await page.waitForSelector('#hanja-open-btn', { timeout: 8000 });
  await page.click('#hanja-open-btn');
  await page.waitForTimeout(400);
  await scan('한자선택');
  await page.evaluate(function () {
    document.querySelectorAll('.hanja-syl').forEach(function (syl) {
      var b = syl.querySelector('.hanja-opt:not(.none)');
      if (b) b.click();
    });
  });
  await page.waitForTimeout(300);
  var run = await page.$('.hanja-run-btn');
  if (run) { await run.click(); await page.waitForTimeout(600); }
  await scan('한자풀이');

  // ---- 홈 대시보드 ----
  await page.evaluate(function () { location.hash = '#home'; });
  await page.waitForTimeout(600);
  await scan('홈');

  // ---- 궁합 ----
  await page.evaluate(function () { location.hash = '#compat'; });
  await page.waitForTimeout(500);
  await scan('궁합폼');

  // ---- v1.10 한자 사전 (검색 결과 + 글자 단독 풀이 카드) ----
  await page.evaluate(function () { location.hash = '#hanja-dict'; });
  await page.waitForSelector('#screen-hanja-dict.active', { timeout: 8000 });
  await page.fill('#dict-search-input', '김');
  await page.waitForTimeout(450);
  await scan('한자사전:검색');
  var firstChip = page.locator('#dict-results .hanja-opt').first();
  if (await firstChip.count()) { await firstChip.click(); await page.waitForTimeout(400); }
  await scan('한자사전:풀이');

  console.log('\n대비 미달 요소: ' + total + '건 (그중 배경이미지 위라 자동판정 보류 ~표시: ' + imageBgCount + '건)');
  await browser.close();
  process.exit(total - imageBgCount > 0 ? 1 : 0);
})();
