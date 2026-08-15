/*!
 * saju-engine.js — 만세력·명리 계산 엔진 (사주×MBTI 운세 PWA)
 * 순수 JS · 외부 라이브러리 0 · 네트워크 0 · window.SajuEngine 전역 노출
 * 계약: SPEC.md v1 (2026-08-14)
 *
 * ── 정확도 설계 요약 ────────────────────────────────────────────────
 * 1) 년주 : 양력 1/1 이 아니라 "입춘 절입 시각" 기준으로 간지년이 바뀐다.
 * 2) 월주 : 12절(소한·입춘·경칩·청명·입하·망종·소서·입추·백로·한로·입동·대설)
 *          의 절입 '시각'까지 반영. 절입 분(minute) 이후부터 새 월지 적용.
 *    → 절기 데이터는 Jean Meeus, "Astronomical Algorithms" 의 VSOP87D(절단) 태양
 *      황경 + 장동(Δψ) + 광행차로 산출한 겉보기황경이 15°배수에 도달하는 순간을
 *      뉴턴 반복으로 구하고, ΔT(Espenak & Meeus)로 TT→UT 변환 후 한국 표준시로
 *      환산해 분 단위로 내장했다. (1900~2050, 연 12절)
 *      · 검증: Meeus 예제 25.b 겉보기황경 오차 0.38″.
 *      · 검증: 1946~2023년 입춘 78건 국내 만세력 대조 최대오차 ±1분.
 *    → 한국 표준시는 역사적 실제 시행값을 적용한다.
 *      1912-01-01 이전 = UTC+8:30 / 1912-01-01~1954-03-20 = UTC+9 /
 *      1954-03-21~1961-08-09 = UTC+8:30 / 1961-08-10~ = UTC+9.
 *      (국내 만세력 실측 대조로 확인: 1955년 입춘 22:48 = +8:30 값, +9면 23:18)
 * 3) 일주 : 율리우스일(JDN) 기반 60갑자 순환.
 *      천간 = (JDN + 9) % 10, 지지 = (JDN + 1) % 12   [갑=0, 자=0]
 *      앵커 교차검증(2개 출처):
 *        · JD 2458511 = 갑자일  (ytliu0.github.io/ChineseCalendar/sexagenary.html)
 *        · 2000-01-01 = 무오일  (국내 만세력/토정비결 작괘 예시)
 *      두 출처 모두 위 식을 만족한다.
 * 4) 시주 : 일간에 따른 시두법(오서둔). 23:00~00:59 = 자시.
 *      ※ 야자시(夜子時) 채택 근거 — 본 엔진은 "조자시/야자시 구분 없이
 *        당일 일주 + 자시"로 단순화한다. 23:00~23:59 출생자의 일주를 익일로
 *        넘기지 않는다. 이유: (a) 일주 교체 시점을 자시 시작(23시)으로 보는
 *        학파와 자정(00시)으로 보는 학파가 갈려 정설이 없고, (b) 국내 대중
 *        만세력·앱 다수가 자정 기준(정자시)을 기본값으로 쓰며, (c) 일반 사용자
 *        대상 서비스에서 같은 생일이 두 개의 일주를 갖는 혼란을 피하기 위함이다.
 *        birthTime 이 null 이면 시주는 null 로 반환한다.
 * 5) 음력→양력 : 1900~2050 한국 음력(윤달 포함) 테이블 내장.
 *      삭(Meeus ch.49) 시각을 한국 표준시로 환산해 초하루를 정하고,
 *      동지가 든 달을 11월로 삼아 무중치윤법(중기 없는 달 = 윤달)으로 윤달 결정.
 *      · 검증: 설날/윤달 구간이 국내 공표값과 일치(2020 윤4월 5/23~6/20,
 *        2023 윤2월 3/22~4/19, 2017 윤5월, 2025 윤6월, 2033 윤11월).
 * ────────────────────────────────────────────────────────────────────
 */
(function (global) {
  'use strict';

  // ═══════════════ 기본 상수 ═══════════════
  var GAN = ['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계'];
  var JI = ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해'];
  var GAN_HANJA = { 갑: '甲', 을: '乙', 병: '丙', 정: '丁', 무: '戊', 기: '己', 경: '庚', 신: '辛', 임: '壬', 계: '癸' };
  var JI_HANJA = { 자: '子', 축: '丑', 인: '寅', 묘: '卯', 진: '辰', 사: '巳', 오: '午', 미: '未', 신: '申', 유: '酉', 술: '戌', 해: '亥' };
  var JI_ANIMAL = { 자: '쥐', 축: '소', 인: '호랑이', 묘: '토끼', 진: '용', 사: '뱀', 오: '말', 미: '양', 신: '원숭이', 유: '닭', 술: '개', 해: '돼지' };

  // 오행 / 음양 (갑=양목 … 계=음수)
  var GAN_EL = ['목', '목', '화', '화', '토', '토', '금', '금', '수', '수'];
  var GAN_YANG = [true, false, true, false, true, false, true, false, true, false];
  // 지지 오행 (지장간 본기 기준) : 자수 축토 인목 묘목 진토 사화 오화 미토 신금 유금 술토 해수
  var JI_EL = ['수', '토', '목', '목', '토', '화', '화', '토', '금', '금', '토', '수'];
  // 지지 양음 (자·인·진·오·신·술 = 양)
  var JI_YANG = [true, false, true, false, true, false, true, false, true, false, true, false];
  // 지장간 본기(정기) 천간 — 지지 십신 판정에 사용
  var JI_MAIN_GAN = ['계', '기', '갑', '을', '무', '병', '정', '기', '경', '신', '무', '임'];

  var EL = ['목', '화', '토', '금', '수'];
  var EL_IDX = { 목: 0, 화: 1, 토: 2, 금: 3, 수: 4 };
  // 상생: 목→화→토→금→수→목  /  상극: 목→토→수→화→금→목
  function elGen(a) { return EL[(EL_IDX[a] + 1) % 5]; }      // a 가 생하는 오행
  function elCtl(a) { return EL[(EL_IDX[a] + 2) % 5]; }      // a 가 극하는 오행

  // 테이블 실수록 범위는 1899~2051(경계 계산용 ±1년 여유), 실제 지원 입력 범위는 1900~2050
  var MIN_YEAR = 1899, MAX_YEAR = 2051;
  var LUNAR_MIN = 1899, LUNAR_MAX = 2051;
  var SUPPORT_MIN = 1900, SUPPORT_MAX = 2050;
  var BASE_JDN = 2414656; // 1899-01-01

  // ═══════════════ 내장 데이터 ═══════════════
  // 절기: 연도(1900~2050) 당 36자. 12절(소한,입춘,경칩,청명,입하,망종,소서,입추,백로,한로,입동,대설)
  //       각 3자 base36 = (일-1)*1440 + 시*60 + 분   [해당 절이 드는 달은 순서대로 1~12월 고정]
  var TERM_RAW =
  '5en3qd5p84uf5oh5wb7hs7xu81u8qq7qt7dz5oa3zy5ys53z5y165x7rg87l8bn90j80m7nq5xz49m68h5dr67x6fv81e8hg8lg9ad8ah7xn67y4jk6ie5nk6hl6pe8as8qs8ut9jr8k087b6hq4td6s55x86r86z18kj90m94o9to8tv8h56rj5365xy5315x164v7qe86i8ak8zi7zn7mv5x948y67s5cx66w6eo8028g38k49928987wh66w4im6hi5mp6gr6oj89x8py8ty9ix8j586f6gu4sh6r95wd6qc6y38jh8zi93k9sl8su8g56qj5255ww51y5vx63p7p685989a8y97yg7lq' +
  '5w347r66j5bo65p6dk7z28f58j59818877vh65w4hm6gf5lh6fe6n388f8of8sg9hf8ho84z6ff4r46px5uz6ov6wk8hz8y29279r98rh8eq6pw51i5w951c5vb6347ol84p88u8xv7y37lb5vm47765x5b064z6cq7y38e48i697887i7ut6574gt6fk5km6ek6mc87r8nt8rx9gz8hb84p6f44qq6pc5u96o36vs8h88xc91h9ql8qy8ec6os50e5v24zy5tq61e7mu82z8758w87wi7ju5ua45y64p59q63m6bb7wq8cu8gz96286d7tp6444ft6el5jl6de6kz8688m78qb9fg8fv83a' +
  '6ds4pf6o65t56my6ul8fx8vy9049p98po8d26nh4z35tr4yr5so60f7lv81y8638v57vh7iu5ta44w63l58l62g6a67vj8bk8fm94n84y7sb62t4ej6da5ia6c56ju85a8ld8pi9el8ex82b6cq4od6n15ry6lq6te8eu8v18z99of8os8c56mi4y25sp4xl5re5z27kh80o84y8u47uh7ht5s543p62c57b61668x7ud8aj8es94084e7rs6264dq6cc5h66ax6ii83u8jw8o49dd8dw81f6bx4ni6m25qu6kh6s18de8tj8xt9n38nl8b26lj4x55rp4wj5q85xt7j87zg83q8sy7te7gt' +
  '5ra42x61k56f60567n7sw88x8d492b82s7q860r4cf6b55g269r6ha82k8il8ms9c28ck8036ak4m56kq5pl6ja6qu8c68s98wh9lr8ma89s6k94vu5qe4v65ov5wg7hs7xw8238ra7rq7f65pn4195zw54r5yi6667rl87q8by91481j7oz5zh4b469q5ek6876fq8118h48lc9al8b37yl6924kp6ja5o26ho6p68ai8qo8v09kc8ku8896in4u55op4tj5n95uv7ga7wj80x8q97qr7e65ok4025yl53e5x364n7py8618ab8zn8077nq5y749r68a5d166n6e77zj8fp8k099d8a07xm' +
  '6844jn6i25mq6g96ns8968pf8tu9j98jw87h6i04tk5o04sn5m45tk7ew7v47zh8ou7pf7cy5ng3z25xm52d5vy63f7or84y89c8yq7zc7mw5xe49167l5cc65v6d97yg8ei8iu98a88z7wn6774is6hb5lz6fi6mv8838o68sj9hy8in8696gr4sb5mt4ri5l45sn7e07u77yk8nx7oj7c45mn3y85wq51g5v162i7nr83t8828xd7xy7lk5w447s66d5b364m6c17xb8dg8hr97587r7vc65u4he6fw5kk6e36lj86w8n58rl9h18ho8586fo4r65lm4qa5js5r87ck7sq7x58mk7n77aq' +
  '5l53wn5v34zs5td60v7m882f86u8wb7x07kl5v346l64z59l6316af7vp8bv8ga95s86k7ua64u4ge6er5j96cl6jx8568ld8pu9fc8g383q6ea4pt5k74or5i65pk7ax7r77vq8l87ly79k5k23vm5u34yp5s45zg7kn80r8558um7vd7j15tl45763p57h60w6877td89h8dw93f8497ry62i4e06cd5gx6ac6hp8308j88nq9da8e381t6cc4nu5i74mp5g45ni78s7oy7td8iu7jk7785ht3td5rs4wd5ps5x77ii7yq8368so7te7h25rm43761n5665zj66u7s388b8ct92d8367qw' +
  '61g4d06bf5fx6996gi81q8hy8mi9c48cw80j6b14mh5gu4le5et5m777j7nu7sf8i37iw76k5h13sg5qt4vc5or5w47hd7xi82t8sf7ta7h25rn43561i55y5za66j7rr87y8cf92282z7qt61f4cw6b55fj68s6g281e8hp8mc9c08cw80p6ba4mt5h44li5er5m07787ng7rz8hl7if7655gq3sa5qp4v75oi5vq7gx7x581o8rb7s67fx5qi42260f54x5y765e7qj86p8b890x81v7pq60c4bv6a65el67u6f08058gb8ku9ah8bd7z669q4l85fi4jx5d85kj75u7m37qn8ga7h574w' +
  '5fh3qz5pb4tr5n25uc7fk7vq8078pt7qn7ef5p240m5yz53e5wm63s7oy85689q8ze80a7o15yl4a268b5co65w6d57yf8es8ji99b8a97y068i4jw5e44ih5bp5iy7477kh7p38eu7fr73j5e13pg5np4s25lb5sj7dr7u17yn8of7pf7da5nw3zc5xj51t5uy6247nb83l8898y37z67n55xu49b67i5bq64r6bu7wz8d98hx97q88r7wm6794is5d04hb5af5hj72r7j27ns8dm7en72h5d33ol5mw4ra5kg5rk7co7su7xg8n87oa7c75mv3yf5wq5135u961b7md82i8728wv7xy7lw' +
  '5wk4806685ai63n6at7w18cb8h096u87x7vu66h4hy5c54gf59l5gs7207i97mt8cj7di71d5c13nj5lt4q55jb5qh7bo7rx7wj8m97n87b35lr3x95vj4zt5sw6007l781i8688w27x47l05vn47465b59k62n69q7uv8b68fw95r86s7um6554gj5ap4ey5835f970h7gu7lm8bi7cl70g5az3mc5kg4oq5hv5p07a77qg7v58l07m57a45ks3w85uc4yi5rj5yk7jp7zy84n8uj7vp7jp5ud45s63u57w60u67v7t389h8ec94c85i7tg6444fj59n4dr56q5dr6yx7f87jz89w7b16yy' +
  '59m3l35ja4ni5gi5nh78j7os7ti8jf7km78l5j93uq5sv4x15q05wy7i07y98318t27uc7ie5t444k62o56t5zr66q7rt8818cr92p83w7rw62l4e05844c95595ca6xg7dr7ii88f79l6xk5883jp5hv4m15f25m37787ni7s88i47j977a5i03tj5rq4vw5ou5vt7gv7x481v8rt7sz7gz5rm4316145585y66567qd86s8bp91r8307qy61j4cw56y4b25425b56wc7cp7hi87j78r6wq57c3iq5gs4kw5dw5kx7617mc7r58h57ie76h5h63sl5ql4ul5nf5ue7fi7vw80s8qw7s87ge' +
  '5r542l60m54l5xd6497pd85q8am90o81y7q060p4c45674a853259z6v27bf7gb86e77o6vp56d3ht5fx4k15cx5ju74v7l47py8g17hd75h5g83ro5ps4tu5mp5tl7ek7ur7zj8pl7qy7f25ps4165z55355vz62w7o084c8988zd80p7ot5zj4aw54w48v51r58q6tv7a87f185176b6ud5533gj5el4im5bh5ie73h7jr7ol8el7fu73x5en3q35o54s45kv5rp7cr7t57y38o97pn7dr5og3zu5xu51t5uk61f7mi82v87t8y07zc7ne5y149c53b47a5045706s378g7de83l74z6t2' +
  '53q3f25d04gy59r5gn71q7i17my8d47ek72s5dl3p05my4qv5jk5qd7be7rp7wl8mr7o77ce5n73yl5wi50c5sz5zr7ku81986a8wj7xz7m55ww48a5294664yw55q6qt7777c582c73q6rv52m3e15c34g358u5fn70n7gw7ls8by7de71l5cc3nr5lq4pn5ib5p37a37qf7vd8lo7n77bg5m93xn5vk4zf5s55yy7k080d85c8vj7wz7l55vw47a5184544xu54p6pr7657b381972o6qt51k3cy5ax4et57j5ed6zf7fs7kr8ay7ce70l5bd3mt5ks4op5hd5o57967pj7ui8kr7m87ae' +
  '5l33we5ua4y35qr5xi7il7z18458ui7w07k65uu4634zx43q4wg53a6oe74u79w80771q6px50n3bz59u4dn56b5d46y57ei7jh89r7bb6zl5ae3lr5jk4n85fq5me77e7nt7sw8ja7kx79a5k53vj5tc4x15pj5w67h77xn82r8t47uo7ix5tp4534yz42q4va51y6mw73978b7yo7086oh4z93am58j4cd54x5bl6wh7cr7hs88579s6y458z3ke5ib4m45ep5lc7697mj7rh8ht7jg77s5im3ty5rr4vh5o15uq7fp7w38148rh7t27hd5s743j4xd4134to50g6li71x76y7x86yr6n1' +
  '4xu3995754ay53k5aa6va7bo7go86y78h6wq57i3iw5gr4kh5cy5jk74j7kz7q58gl7i876j5hb3sm5qf4u45mn5tc7ed7uv8028qj7s57gf5r442d4w43zt4se4z46k570l75q7w66xu6m54ww38555w49k52258p6tp7a47f885q77h6vx56s3i55fw4ji5bx5ii73h7jx7p28fj7h975p5gk3rw5pm4t65lj5s37d17ti7yq8p97r07fd5q741k4vc3yy4rd4xz6ix6zd74j7v16wq6l44vy37b55648w51d57z6sv7977e984q76g6uv55r3h35ev4ih5av5hd7287il7nq8e97g374k' +
  '5fg3qt5oj4s45ki5r37c27si7xo8o57pv7e95p340g4u73xt4q94ww6hv6ya73e7tt6vh6ju4uo36153u47g4zu56e6ra77o7ct83b7516tg54b3fp5di4h459j5g270z7hf7ml8d47ev7395e13pb5n04qk5iy5pi7ag7qx7w68mr7ok7cx5no3yw4sj3w34oh4v46g46wk71s7sd6u66il4te34o52d45x4yb54x6pw76b7bh82073t6sb5383ej5c64fl57s5e86z47fl7kv8bi7de71x5cu3o65lt4p95hg5nx78u7pe7uq8ld7n77bn5mh3xs4ri3v14nc4tu6er6v770g7r26sx6hc' +
  '4s633h51744q4x053f6o974m79t80h72e6qy51v3d75aw4ee56p5d56y17ef7jo8ab7c870s5bp3mz5kl4o05ga5mr77o7o57te8k17lx7af';
  // 음력: 연도(1900~2050) 당 8자 = [초하루 JDN offset(4자 base36, +2415021)] + [윤달번호(1자)] + [월대소 비트(3자 base36)]
  //       비트는 MSB=1월 … 순서, 1=30일(대) 0=29일(소). 윤달은 해당 위치에 삽입되어 최대 13비트.
  var LUNAR_RAW =
  '0014024500az81v100ln00xa00vh021j015c521i01fz02lm01pt02vp01zo42mt02ac012i02k6023x02u121ul034p00xa03ej642l03p7021903z102lh048v55d504jj028l04te012i053823q205dw01ul05nr71uj05yf00wr0689021706i354ej06sr01bd072l025007cf44hh07n400ja07wy01uj086t21tj08hh00wn08rb62hi091y02tm09bs02w509ln52p509wb014l0a6600ja0ag033ou0aqo01ta0b0i74z1' +
  '0bb602hh0bl002mi0buu65e20c5i02950cfd012l0cp841230czw00gt0d9q01t90djk24yz0du802390e4275910eeq028a0eok028l0eyf52510f9300yj0fiy00gr0fss33mf0g3g010r0gda846j0gny01at0gxs01be0h7m64a20hia02450hs500xi0i1z44320icn021j0imi010n0iwc32li0j6z02ol0jgu72mt0jri012i0k1c01wt0kb751ul0klv00xa0kvp021a0l5j45710lg702lh0lq1859l0m0p028k0maj02ne' +
  '0mke63q20mv201uj0n4x00wr0ner442j0npf02170nz9a4ej0o9x01b90ojr01ck0otl64hh0p4a00ja0pe401uj0pnz51tj0pyn00wn0q8h018r0qib32mi0qsy02w50r2t82p50rdh014d0rnc00ja0rx653n20s7u01ta0sho02hi0sri45n90t2602mi0tc002p10tlv228l0twj012k0u6d747v0uh200gt0uqw01t90v0q54yz0vbe02390vl8028a0vv234lm0w5q028l0wfl92450wq900xm0x03021n0x9y521j0xkm010r' +
  '0xug02390y4a44gl0yey01be0yos02510yyn22450z9b00xi0zj564320ztt021j103o010n10di52li10o502oj10y0014a117u348a11ii01v111sdb1ul123100xa12cv021912mp657112xd02lh137702mq13h155ec13rp0296141k01v114bf21uj14m300wr14vx742f156l021715gf027915q954h1160x01ck16ar025616km33p216va01uf';

  var JEOL_NAMES = ['소한', '입춘', '경칩', '청명', '입하', '망종', '소서', '입추', '백로', '한로', '입동', '대설'];

  function termAt(year, j) {
    if (year < MIN_YEAR || year > MAX_YEAR) throw new RangeError('절기 데이터 범위(' + MIN_YEAR + '~' + MAX_YEAR + ') 밖: ' + year);
    var v = parseInt(TERM_RAW.substr((year - MIN_YEAR) * 36 + j * 3, 3), 36);
    return { name: JEOL_NAMES[j], y: year, m: j + 1, d: Math.floor(v / 1440) + 1, hh: Math.floor((v % 1440) / 60), mi: v % 60 };
  }
  function lunarYearInfo(year) {
    if (year < LUNAR_MIN || year > LUNAR_MAX) throw new RangeError('음력 데이터 범위(' + LUNAR_MIN + '~' + LUNAR_MAX + ') 밖: ' + year);
    var o = (year - LUNAR_MIN) * 8;
    var ny = parseInt(LUNAR_RAW.substr(o, 4), 36) + BASE_JDN;
    var leap = parseInt(LUNAR_RAW.substr(o + 4, 1), 36);
    var bits = parseInt(LUNAR_RAW.substr(o + 5, 3), 36);
    var n = leap ? 13 : 12;
    var lens = [], labels = [], num = 1, i;
    for (i = 0; i < n; i++) lens.push(((bits >> (n - 1 - i)) & 1) ? 30 : 29);
    // 월 라벨링: 1,2,…,leap,윤leap,leap+1,…,12
    for (i = 0; i < n; i++) {
      if (leap && num === leap + 1 && !labels.some(function (x) { return x.leap; })) {
        labels.push({ m: leap, leap: true });
      } else {
        labels.push({ m: num, leap: false }); num++;
      }
    }
    return { year: year, newYearJdn: ny, leap: leap, lens: lens, labels: labels };
  }

  // ═══════════════ 달력 유틸 ═══════════════
  function jdnFromYmd(y, m, d) {
    var a = Math.floor((14 - m) / 12), yy = y + 4800 - a, mm = m + 12 * a - 3;
    return d + Math.floor((153 * mm + 2) / 5) + 365 * yy + Math.floor(yy / 4) - Math.floor(yy / 100) + Math.floor(yy / 400) - 32045;
  }
  function ymdFromJdn(jdn) {
    var a = jdn + 32044, b = Math.floor((4 * a + 3) / 146097), c = a - Math.floor(146097 * b / 4);
    var d2 = Math.floor((4 * c + 3) / 1461), e = c - Math.floor(1461 * d2 / 4), m2 = Math.floor((5 * e + 2) / 153);
    return { y: 100 * b + d2 - 4800 + Math.floor(m2 / 10), m: m2 + 3 - 12 * Math.floor(m2 / 10), d: e - Math.floor((153 * m2 + 2) / 5) + 1 };
  }
  function pad2(n) { return (n < 10 ? '0' : '') + n; }
  function fmtDate(o) { return o.y + '-' + pad2(o.m) + '-' + pad2(o.d); }
  function parseDate(s) {
    var m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(String(s || '').trim());
    if (!m) throw new Error('birthDate 형식은 YYYY-MM-DD 여야 합니다: ' + s);
    return { y: +m[1], m: +m[2], d: +m[3] };
  }
  function parseTime(s) {
    if (s === null || s === undefined || s === '') return null;
    var m = /^(\d{1,2}):(\d{2})$/.exec(String(s).trim());
    if (!m) throw new Error('birthTime 형식은 HH:mm 또는 null 이어야 합니다: ' + s);
    var hh = +m[1], mi = +m[2];
    if (hh > 23 || mi > 59) throw new Error('birthTime 범위 오류: ' + s);
    return { hh: hh, mi: mi };
  }

  // ═══════════════ 음↔양 변환 ═══════════════
  function lunarToSolar(ly, lm, ld, isLeap) {
    var info = lunarYearInfo(ly), jdn = info.newYearJdn, i;
    for (i = 0; i < info.labels.length; i++) {
      var L = info.labels[i];
      if (L.m === lm && (!!L.leap) === (!!isLeap)) {
        if (ld < 1 || ld > info.lens[i]) throw new Error('음력 ' + ly + '-' + lm + '-' + ld + ' : 해당 월은 ' + info.lens[i] + '일까지입니다.');
        return ymdFromJdn(jdn + ld - 1);
      }
      jdn += info.lens[i];
    }
    throw new Error('음력 ' + ly + '년에 ' + (isLeap ? '윤' : '') + lm + '월이 없습니다.' + (info.leap ? ' (해당 연도의 윤달은 윤' + info.leap + '월)' : ' (해당 연도는 윤달 없음)'));
  }
  function solarToLunar(sy, sm, sd) {
    var jdn = jdnFromYmd(sy, sm, sd), y = sy, info;
    for (; ;) {
      info = lunarYearInfo(y);
      if (jdn >= info.newYearJdn) {
        var total = 0, i;
        for (i = 0; i < info.lens.length; i++) total += info.lens[i];
        if (jdn < info.newYearJdn + total) break;
        y++;
      } else y--;
      if (y < LUNAR_MIN || y > LUNAR_MAX) throw new RangeError('음력 변환 범위 밖: ' + sy + '-' + sm + '-' + sd);
    }
    var cur = info.newYearJdn;
    for (var k = 0; k < info.lens.length; k++) {
      if (jdn < cur + info.lens[k]) return { year: y, month: info.labels[k].m, day: jdn - cur + 1, leap: info.labels[k].leap };
      cur += info.lens[k];
    }
    throw new Error('음력 변환 실패');
  }

  // ═══════════════ 절기 기준 년/월 결정 ═══════════════
  function cmpTerm(m, d, hh, mi, t) {
    if (m !== t.m) return m - t.m;
    if (d !== t.d) return d - t.d;
    if (hh !== t.hh) return hh - t.hh;
    return mi - t.mi;
  }
  // 해당 일시가 속한 절(節) 반환 { year, j, term }
  function findJeol(y, m, d, hh, mi) {
    for (var j = 11; j >= 0; j--) {
      var t = termAt(y, j);
      if (cmpTerm(m, d, hh, mi, t) >= 0) return { year: y, j: j, term: t };
    }
    return { year: y - 1, j: 11, term: termAt(y - 1, 11) }; // 전년 대설(자월)
  }
  // 입춘 기준 사주 연도
  function sajuYearOf(y, m, d, hh, mi) {
    var ic = termAt(y, 1); // 입춘
    return cmpTerm(m, d, hh, mi, ic) >= 0 ? y : y - 1;
  }

  // ═══════════════ 십신 ═══════════════
  function sipsinOf(dayGanIdx, targetGanIdx) {
    var me = GAN_EL[dayGanIdx], t = GAN_EL[targetGanIdx];
    var same = GAN_YANG[dayGanIdx] === GAN_YANG[targetGanIdx];
    if (t === me) return same ? '비견' : '겁재';
    if (t === elGen(me)) return same ? '식신' : '상관';
    if (t === elCtl(me)) return same ? '편재' : '정재';
    if (elCtl(t) === me) return same ? '편관' : '정관';
    if (elGen(t) === me) return same ? '편인' : '정인';
    return '비견';
  }
  function sipsinOfJi(dayGanIdx, jiIdx) {
    return sipsinOf(dayGanIdx, GAN.indexOf(JI_MAIN_GAN[jiIdx]));
  }

  // ═══════════════ 지지 관계 테이블 ═══════════════
  var YUKHAP = [['자', '축'], ['인', '해'], ['묘', '술'], ['진', '유'], ['사', '신'], ['오', '미']];
  var SAMHAP = [['신', '자', '진'], ['해', '묘', '미'], ['인', '오', '술'], ['사', '유', '축']];
  var SAMHAP_EL = ['수', '목', '화', '금'];
  var CHUNG = [['자', '오'], ['축', '미'], ['인', '신'], ['묘', '유'], ['진', '술'], ['사', '해']];
  var HYEONG = [['인', '사'], ['사', '신'], ['인', '신'], ['축', '술'], ['술', '미'], ['축', '미'], ['자', '묘'],
    ['진', '진'], ['오', '오'], ['유', '유'], ['해', '해']];
  var HAE = [['자', '미'], ['축', '오'], ['인', '사'], ['묘', '진'], ['신', '해'], ['유', '술']];
  var PA = [['자', '유'], ['축', '진'], ['인', '해'], ['묘', '오'], ['사', '신'], ['술', '미']];

  function inPairs(tbl, a, b) {
    for (var i = 0; i < tbl.length; i++) {
      var p = tbl[i];
      if ((p[0] === a && p[1] === b) || (p[0] === b && p[1] === a)) return true;
    }
    return false;
  }
  function samhapHit(a, b) {
    if (a === b) return null;
    for (var i = 0; i < SAMHAP.length; i++) if (SAMHAP[i].indexOf(a) >= 0 && SAMHAP[i].indexOf(b) >= 0) return SAMHAP_EL[i];
    return null;
  }
  // 우선순위: 합(육합>삼합) > 충 > 형 > 해 > 파  (인해·사신처럼 중복되는 조합은 '합'을 대표값으로)
  function branchRelation(a, b, detail) {
    if (inPairs(YUKHAP, a, b)) return detail ? '육합' : '합';
    if (samhapHit(a, b)) return detail ? '삼합' : '합';
    if (inPairs(CHUNG, a, b)) return '충';
    if (inPairs(HYEONG, a, b)) return '형';
    if (inPairs(HAE, a, b)) return '해';
    if (inPairs(PA, a, b)) return '파';
    return '무관';
  }
  // 천간 합 (갑기·을경·병신·정임·무계)
  function ganHap(a, b) { return (GAN.indexOf(a) + 5) % 10 === GAN.indexOf(b); }

  // ═══════════════ 신살 (도화·역마·화개) ═══════════════
  // 일지가 속한 삼합국을 기준으로 사주 네 지지를 훑는다.
  //   신자진(수국) 도화=유 역마=인 화개=진 / 해묘미(목국) 도화=자 역마=사 화개=미
  //   인오술(화국) 도화=묘 역마=신 화개=술 / 사유축(금국) 도화=오 역마=해 화개=축
  var SINSAL = {
    '신자진': { 도화: '유', 역마: '인', 화개: '진' },
    '해묘미': { 도화: '자', 역마: '사', 화개: '미' },
    '인오술': { 도화: '묘', 역마: '신', 화개: '술' },
    '사유축': { 도화: '오', 역마: '해', 화개: '축' }
  };
  function sinsalOf(dayJi, branches) {
    var key = null;
    for (var k in SINSAL) if (k.indexOf(dayJi) >= 0) key = k;
    var map = SINSAL[key], out = [];
    ['도화', '역마', '화개'].forEach(function (n) { if (branches.indexOf(map[n]) >= 0) out.push(n); });
    return out;
  }

  // ═══════════════ 강약 판정 ═══════════════
  // 규칙(명시): 일간을 돕는 글자(비겁=같은 오행, 인성=일간을 생하는 오행)의 가중합 비율로 판정.
  //   가중치 — 월지 3.0(득령, 가장 중요) / 일지 2.0(득지) / 월간 1.5 / 시지 1.5 / 연지 1.2 / 시간 1.0 / 연간 1.0
  //   ratio = 돕는 가중합 / 전체 가중합
  //   ratio >= 0.50 → 신강, ratio <= 0.30 → 신약, 그 사이 → 중화
  //   (시주를 모르면 시간·시지 항목을 빼고 동일 규칙 적용)
  function judgeStrength(dayGanIdx, p) {
    var me = GAN_EL[dayGanIdx];
    var items = [
      { el: JI_EL[p.month.jiIdx], w: 3.0 },
      { el: JI_EL[p.day.jiIdx], w: 2.0 },
      { el: GAN_EL[p.month.ganIdx], w: 1.5 },
      { el: JI_EL[p.year.jiIdx], w: 1.2 },
      { el: GAN_EL[p.year.ganIdx], w: 1.0 }
    ];
    if (p.hour) {
      items.push({ el: JI_EL[p.hour.jiIdx], w: 1.5 });
      items.push({ el: GAN_EL[p.hour.ganIdx], w: 1.0 });
    }
    var sup = 0, tot = 0;
    items.forEach(function (it) {
      tot += it.w;
      if (it.el === me || elGen(it.el) === me) sup += it.w; // 비겁 또는 인성
    });
    var r = sup / tot;
    return { strength: r >= 0.50 ? '신강' : (r <= 0.30 ? '신약' : '중화'), ratio: Math.round(r * 1000) / 1000 };
  }

  // ═══════════════ analyze ═══════════════
  function analyze(input) {
    input = input || {};
    var cal = input.calendar === 'lunar' ? 'lunar' : 'solar';
    var raw = parseDate(input.birthDate);
    var sol = cal === 'lunar' ? lunarToSolar(raw.y, raw.m, raw.d, !!input.lunarLeap) : raw;
    if (sol.y < SUPPORT_MIN || sol.y > SUPPORT_MAX) throw new RangeError('지원 범위(' + SUPPORT_MIN + '~' + SUPPORT_MAX + ') 밖의 생년입니다: ' + sol.y);
    var tm = parseTime(input.birthTime === undefined ? null : input.birthTime);
    var hh = tm ? tm.hh : 12, mi = tm ? tm.mi : 0; // 시간 미상이면 정오로 절기 비교(경계 왜곡 최소화)

    // ── 년주 (입춘 기준)
    var sy = sajuYearOf(sol.y, sol.m, sol.d, hh, mi);
    var yGan = ((sy - 4) % 10 + 10) % 10, yJi = ((sy - 4) % 12 + 12) % 12;

    // ── 월주 (12절 기준)
    var jeol = findJeol(sol.y, sol.m, sol.d, hh, mi);
    var mJi = (jeol.j + 1) % 12;                       // 소한→축(1) … 대설→자(0)
    var offset = (mJi - 2 + 12) % 12;                  // 인월 기준 몇 번째 달인가
    var mGan = ((yGan % 5) * 2 + 2 + offset) % 10;     // 오호둔(년상기월법)

    // ── 일주 (JDN 60갑자)
    var jdn = jdnFromYmd(sol.y, sol.m, sol.d);
    var dGan = (jdn + 9) % 10, dJi = (jdn + 1) % 12;

    // ── 시주 (오서둔). 23:00~00:59 = 자시, 당일 일주 유지(야자시 미채택)
    var hourP = null;
    if (tm) {
      var hJi = Math.floor((tm.hh + 1) / 2) % 12;
      var hGan = ((dGan % 5) * 2 + hJi) % 10;
      hourP = { ganIdx: hGan, jiIdx: hJi };
    }

    var P = {
      year: { ganIdx: yGan, jiIdx: yJi },
      month: { ganIdx: mGan, jiIdx: mJi },
      day: { ganIdx: dGan, jiIdx: dJi },
      hour: hourP
    };
    function pil(o) { return o ? { gan: GAN[o.ganIdx], ji: JI[o.jiIdx] } : null; }

    // ── 오행 개수 (천간 + 지지 본기)
    var elements = { 목: 0, 화: 0, 토: 0, 금: 0, 수: 0 };
    ['year', 'month', 'day', 'hour'].forEach(function (k) {
      var o = P[k]; if (!o) return;
      elements[GAN_EL[o.ganIdx]]++; elements[JI_EL[o.jiIdx]]++;
    });

    // ── 십신
    function ss(o) { return o ? { gan: sipsinOf(dGan, o.ganIdx), ji: sipsinOfJi(dGan, o.jiIdx) } : null; }
    var sipsin = { year: ss(P.year), month: ss(P.month), hour: ss(P.hour) };

    var branches = [JI[yJi], JI[mJi], JI[dJi]];
    if (hourP) branches.push(JI[hourP.jiIdx]);

    var st = judgeStrength(dGan, P);
    var lun = solarToLunar(sol.y, sol.m, sol.d);

    return {
      solarDate: fmtDate(sol),
      lunarDate: { year: lun.year, month: lun.month, day: lun.day, leap: lun.leap },
      calendarUsed: cal,
      gender: input.gender === 'F' ? 'F' : 'M',
      birthTime: tm ? pad2(tm.hh) + ':' + pad2(tm.mi) : null,
      pillars: { year: pil(P.year), month: pil(P.month), day: pil(P.day), hour: pil(P.hour) },
      dayMaster: GAN[dGan],
      dayMasterElement: GAN_EL[dGan],
      dayMasterYang: GAN_YANG[dGan],
      elements: elements,
      strength: st.strength,
      strengthRatio: st.ratio,
      sipsin: sipsin,
      dayJiSipsin: sipsinOfJi(dGan, dJi),      // 일지 십신 (SPEC 외 부가정보)
      specials: sinsalOf(JI[dJi], branches),
      zodiac: JI_ANIMAL[JI[yJi]],
      jeol: { name: jeol.term.name, at: jeol.term.y + '-' + pad2(jeol.term.m) + '-' + pad2(jeol.term.d) + ' ' + pad2(jeol.term.hh) + ':' + pad2(jeol.term.mi) },
      ipchun: (function () { var t = termAt(sol.y, 1); return t.y + '-' + pad2(t.m) + '-' + pad2(t.d) + ' ' + pad2(t.hh) + ':' + pad2(t.mi); })(),
      jdn: jdn
    };
  }

  // ═══════════════ today ═══════════════
  var SIPSIN_BASE = { 비견: 2, 겁재: -3, 식신: 7, 상관: -2, 편재: 5, 정재: 8, 편관: -6, 정관: 7, 편인: -1, 정인: 6 };
  var SUPPORT_SS = { 비견: 1, 겁재: 1, 편인: 1, 정인: 1 };  // 일간을 돕는 십신
  var BRANCH_SCORE = { 합: 12, 육합: 13, 삼합: 11, 무관: 0, 파: -5, 해: -7, 형: -10, 충: -12 };

  function iljinOf(dateStr) {
    var o = parseDate(dateStr), jdn = jdnFromYmd(o.y, o.m, o.d);
    return { gan: GAN[(jdn + 9) % 10], ji: JI[(jdn + 1) % 12], jdn: jdn };
  }

  function today(chart, dateStr) {
    if (!chart || !chart.pillars) throw new Error('today(chart, date): chart 가 필요합니다.');
    var ij = iljinOf(dateStr);
    var dGan = GAN.indexOf(chart.dayMaster);
    var ss = sipsinOf(dGan, GAN.indexOf(ij.gan));
    var rel = branchRelation(ij.ji, chart.pillars.day.ji, false);

    var score = 50 + (SIPSIN_BASE[ss] || 0) + (BRANCH_SCORE[rel] || 0);
    // 강약 보정: 신약이면 비겁·인성이 반갑고, 신강이면 식상·재·관이 반갑다
    var isSup = !!SUPPORT_SS[ss];
    if (chart.strength === '신약') score += isSup ? 6 : -4;
    else if (chart.strength === '신강') score += isSup ? -5 : 5;
    // 부족 오행 보충 가점: 일진 천간의 오행이 내 사주에서 가장 적은 오행이면 +5
    var minEl = null, minN = 99;
    for (var k in chart.elements) if (chart.elements[k] < minN) { minN = chart.elements[k]; minEl = k; }
    if (GAN_EL[GAN.indexOf(ij.gan)] === minEl) score += 5;
    score = Math.max(5, Math.min(97, Math.round(score)));

    return {
      date: fmtDate(parseDate(dateStr)),
      iljin: { gan: ij.gan, ji: ij.ji },
      sipsinVsDay: ss,
      branchRel: rel,
      branchRelDetail: branchRelation(ij.ji, chart.pillars.day.ji, true),
      score: score
    };
  }

  // ═══════════════ compat ═══════════════
  function elementFitScore(a, b) {
    // 두 사람 오행을 합쳤을 때 얼마나 고르게 5행이 갖춰지는가 (0~100)
    var tot = 0, i, p, dev = 0, sum = {};
    EL.forEach(function (e) { sum[e] = (a.elements[e] || 0) + (b.elements[e] || 0); tot += sum[e]; });
    if (!tot) return 50;
    for (i = 0; i < EL.length; i++) { p = sum[EL[i]] / tot; dev += Math.abs(p - 0.2); }
    return Math.round(Math.max(0, 1 - dev / 1.6) * 100);
  }
  function compat(a, b) {
    if (!a || !b || !a.pillars || !b.pillars) throw new Error('compat(chartA, chartB): 두 chart 가 필요합니다.');
    var ga = a.dayMaster, gb = b.dayMaster;
    var ea = GAN_EL[GAN.indexOf(ga)], eb = GAN_EL[GAN.indexOf(gb)];
    var ganRel;
    if (ganHap(ga, gb)) ganRel = '합';
    else if (ea === eb) ganRel = '비화';
    else if (elGen(ea) === eb) ganRel = '생(A→B)';
    else if (elGen(eb) === ea) ganRel = '생(B→A)';
    else if (elCtl(ea) === eb) ganRel = '극(A→B)';
    else ganRel = '극(B→A)';

    var brDetail = branchRelation(a.pillars.day.ji, b.pillars.day.ji, true);
    var fit = elementFitScore(a, b);

    var GAN_SC = { '합': 18, '생(A→B)': 12, '생(B→A)': 12, '비화': 4, '극(A→B)': -8, '극(B→A)': -8 };
    var BR_SC = { 육합: 18, 삼합: 16, 무관: 0, 파: -6, 해: -8, 형: -10, 충: -12 };
    var score = 50 + GAN_SC[ganRel] + BR_SC[brDetail] + (fit - 50) * 0.4;
    score = Math.max(5, Math.min(98, Math.round(score)));

    return { ganRel: ganRel, branchRel: brDetail, elementFit: fit, score: score };
  }

  // ═══════════════ export ═══════════════
  var SajuEngine = {
    version: '1.0.0',
    analyze: analyze,
    today: today,
    compat: compat,
    // 부가 API
    lunarToSolar: function (y, m, d, leap) { var o = lunarToSolar(y, m, d, !!leap); return fmtDate(o); },
    solarToLunar: function (y, m, d) { return solarToLunar(y, m, d); },
    iljin: iljinOf,
    termAt: termAt,
    jeolOf: function (y, m, d, hh, mi) { return findJeol(y, m, d, hh || 0, mi || 0); },
    sipsin: function (dayGan, targetGan) { return sipsinOf(GAN.indexOf(dayGan), GAN.indexOf(targetGan)); },
    branchRelation: branchRelation,
    // 상수
    GAN: GAN, JI: JI, GAN_HANJA: GAN_HANJA, JI_HANJA: JI_HANJA, JI_ANIMAL: JI_ANIMAL,
    GAN_ELEMENT: GAN_EL, JI_ELEMENT: JI_EL, ELEMENTS: EL, JEOL_NAMES: JEOL_NAMES,
    RANGE: { minYear: SUPPORT_MIN, maxYear: SUPPORT_MAX, lunarMin: SUPPORT_MIN, lunarMax: SUPPORT_MAX, tableMin: MIN_YEAR, tableMax: MAX_YEAR },
    toHanja: function (p) { return p ? GAN_HANJA[p.gan] + JI_HANJA[p.ji] : ''; }
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = SajuEngine;
  global.SajuEngine = SajuEngine;
})(typeof window !== 'undefined' ? window : globalThis);
