/**
 * name-hanja-db.js — MZ사주풀이 인명 한자 DB (v1.3)
 * ⚠ 이 파일은 _data/build_db.py 가 공개 데이터셋에서 자동 생성한다. 직접 수정하지 말 것.
 *   (생성일 2026-08-16 / 총 2571자 · 470음절)
 *
 * ─────────────────────────────────────────────────────────────────────────
 * 1. 원자료 출처 (모두 공개 데이터셋, 기억이 아닌 원본 파일에서 기계 추출)
 *   [A] 음(音)·뜻(訓) — libhangul hanja.txt (BSD-3, Choe Hwanjin)
 *       https://raw.githubusercontent.com/libhangul/libhangul/main/data/hanja/hanja.txt
 *   [B] 필획(筆劃)·부수 — Unicode Unihan Database, kTotalStrokes / kRSUnicode
 *       https://www.unicode.org/Public/UCD/latest/ucd/Unihan.zip
 *   [C] 부수번호→원형(原形) 부수 한자 — Unicode CJKRadicals.txt
 *       https://www.unicode.org/Public/UCD/latest/ucd/CJKRadicals.txt
 *   [D] 자원오행 부수 배속표 — 한국성명학회 "한자의 부수 및 자원오행"
 *       https://www.ksname.co.kr/bbs/tb.php/m51/44
 *   [E] 원획 교차검증표 — 인터넷 한국작명연구원 인명용한자 조회
 *       https://www.irum.com/Resource/Hanja
 *       ("성명학에서 한자의 획수는 康熙字典과 玉篇을 근본으로 하여 원획으로 하여야 합니다")
 *
 * ─────────────────────────────────────────────────────────────────────────
 * 2. 원획(原劃) 산출 규약  ★ SPEC.md v1.3 "부수 보정표" 구현
 *   strokes(원획) = [C]의 원형 부수 획수 + kRSUnicode 의 나머지 획수
 *   - 즉 필획에서 "실제 쓰인 변형부수 획수"를 빼고 "원형 부수 획수"를 넣는다.
 *     보정표를 손으로 나열하는 대신 부수번호로 프로그램이 전량 적용하므로
 *     SPEC 예시(氵→水4, 扌→手4, 忄→心4, 艹→艸6, 阝좌→阜8, 阝우→邑7, 王→玉5,
 *     月육달→肉6, 辶→辵7, 礻→示5, 衤→衣6, 犭→犬4, 灬→火4, 罒→网6)가 모두 자동 충족된다.
 *   - 부수가 변형되지 않은 글자는 원획 = 필획 (예: 家 10, 明 8, 東 8).
 *   - 숫자한자 예외(성명학 관례): 四4 五5 六6 七7 八8 九9 十10.
 *   - 部件(부수 아닌 구성요소)을 Unihan(현대 셈법)과 康熙字典이 다르게 세는 50자
 *     (戴 暑 署 成 城 誠 瘟 異 翼 充 響 邢 姬 考 魄 噓 魔 衛 毓 禽 萬 渗 巡 甕 瓮 禹 魏
 *      甄 魁 裙 龜 廊 擥 隷 朦 猫 薩 乷 屬 瓦 頊 剩 芿 著 節 鑿 兎 把 魂 蒸)는
 *     [E] 대조표 값을 채택했다. 나머지 글자는 자동 계산값이 [E]와 그대로 일치한다.
 *
 * 3. 원획 교차검증 결과 (스크립트: _data/verify_wonhoek.py, _data/verify_all.py)
 *   ① 표본 42자 대조 — 42/42 일치 (불일치 0). 변형부수 전 유형 + 무보정 대조군:
 *      江7 湖13 潤16 澈16 淸12 (氵→水) / 揆13 振11 換13 採12 (扌→手) /
 *      性9 情12 惜12 (忄→心) / 英11 草12 藍20 薰20 (艹→艸) /
 *      陳16 陣15 陽17 限14 (阝좌→阜) / 都16 鄕17 那11 (阝우→邑) /
 *      珉10 珪11 環18 (王→玉) / 胤11 (月육달→肉) / 進15 道16 遠17 (辶→辵) /
 *      福14 祖10 神10 (礻→示) / 裕13 (衤→衣) / 熱15 烈10 (灬→火) / 羅20 (罒→网) /
 *      家10 明8 星9 東8 金8 (무보정 대조군)
 *      이 표본은 _verify_hanja_db.js 가 매 실행마다 재대조한다.
 *   ② 전수 대조 — DB 2571자 전량을 [E]와 대조: 2,564자 대조 성공 **불일치 0**,
 *      미조회 7자(彌 尹 卷 暖 亐 搭 琿 — 대조처 목록에 없는 글자).
 *      재현 스크립트: _data/verify_all.py (음절 조회 → 개별 조회 폴백)
 *
 * 4. 자원오행(jawonElement)
 *   [D] 원문은 한 부수를 여러 오행에 중복 배속하는 경우가 많아(유파별 이설),
 *   **단일 오행에만 등장하는 부수만** 채택하고 중복·미등장 부수는 null 로 둔다.
 *   (SPEC v1.3 "매핑 불가 부수는 jawonElement:null 허용" — UI에서 생략)
 *   현재 1878자에 자원오행이 부여돼 있다.
 *
 * 5. 후보 선별
 *   [A]의 음절별 등재 순서(한글 IME 변환 빈도순)를 우선순위로 삼되,
 *   KS X 1001 상용한자(EUC-KR 인코딩 가능) 범위로 제한하고, 이름에 쓰기 어려운 뜻
 *   (질병·죽음·부정·동물/기물 등)은 키워드로 걸러 음절당 최대 8자를 담는다.
 *   한국 주요 성씨와 이름에 특히 잦은 글자는 build_db.py 의 PRIORITY 목록으로 앞에 고정한다.
 *   ※ 선별(어떤 글자를 보여줄지)만 사람이 정하고, 뜻·음·획수 값은 전부 원자료에서 기계 추출한다.
 *   ※ 다음자(多音字, 例 金=금/김)는 음절마다 별도 항목으로 들어가므로
 *      count(항목 총수) ≠ uniqueChars(고유 글자 수)일 수 있다.
 *
 * 필드: ch 한자 / reading 음 / meaning 뜻 / strokes 원획 / pilhoek 필획 /
 *       rad 원형부수 / jawonElement 자원오행(없으면 null)
 */

(function (global) {
  'use strict';

  var byReading = {
    '가': [
      {ch:'家',meaning:'집',strokes:10,pilhoek:10,rad:'宀',jawonElement:null},
      {ch:'加',meaning:'더할',strokes:5,pilhoek:5,rad:'力',jawonElement:null},
      {ch:'佳',meaning:'아름다울',strokes:8,pilhoek:8,rad:'人',jawonElement:'화'},
      {ch:'賈',meaning:'값',strokes:13,pilhoek:13,rad:'貝',jawonElement:'금'},
      {ch:'嘉',meaning:'아름다울',strokes:14,pilhoek:14,rad:'口',jawonElement:null},
      {ch:'可',meaning:'옳을',strokes:5,pilhoek:5,rad:'口',jawonElement:null},
      {ch:'歌',meaning:'노래',strokes:14,pilhoek:14,rad:'欠',jawonElement:null},
      {ch:'價',meaning:'값',strokes:15,pilhoek:15,rad:'人',jawonElement:'화'}
    ],
    '강': [
      {ch:'康',meaning:'편안할',strokes:11,pilhoek:11,rad:'广',jawonElement:'목'},
      {ch:'姜',meaning:'성씨',strokes:9,pilhoek:9,rad:'女',jawonElement:'토'},
      {ch:'江',meaning:'가람',strokes:7,pilhoek:6,rad:'水',jawonElement:'수'},
      {ch:'强',meaning:'강할',strokes:12,pilhoek:12,rad:'弓',jawonElement:null},
      {ch:'講',meaning:'강론할',strokes:17,pilhoek:17,rad:'言',jawonElement:'금'},
      {ch:'降',meaning:'내릴',strokes:14,pilhoek:8,rad:'阜',jawonElement:'토'},
      {ch:'綱',meaning:'벼리',strokes:14,pilhoek:14,rad:'糸',jawonElement:'목'},
      {ch:'鋼',meaning:'쇠',strokes:16,pilhoek:16,rad:'金',jawonElement:'금'}
    ],
    '건': [
      {ch:'建',meaning:'세울',strokes:9,pilhoek:8,rad:'廴',jawonElement:null},
      {ch:'乾',meaning:'하늘',strokes:11,pilhoek:11,rad:'乙',jawonElement:null},
      {ch:'健',meaning:'굳셀',strokes:11,pilhoek:10,rad:'人',jawonElement:'화'},
      {ch:'件',meaning:'조건',strokes:6,pilhoek:6,rad:'人',jawonElement:'화'},
      {ch:'巾',meaning:'수건',strokes:3,pilhoek:3,rad:'巾',jawonElement:'목'},
      {ch:'鍵',meaning:'열쇠',strokes:17,pilhoek:16,rad:'金',jawonElement:'금'},
      {ch:'虔',meaning:'정성',strokes:10,pilhoek:10,rad:'虍',jawonElement:null},
      {ch:'愆',meaning:'어기어질',strokes:13,pilhoek:13,rad:'心',jawonElement:'화'}
    ],
    '겸': [
      {ch:'兼',meaning:'겸할',strokes:10,pilhoek:10,rad:'八',jawonElement:null},
      {ch:'謙',meaning:'사양할',strokes:17,pilhoek:17,rad:'言',jawonElement:'금'},
      {ch:'慊',meaning:'불만족하게 생각할',strokes:14,pilhoek:13,rad:'心',jawonElement:'화'},
      {ch:'箝',meaning:'족집개',strokes:14,pilhoek:14,rad:'竹',jawonElement:'목'},
      {ch:'鉗',meaning:'입 다물',strokes:13,pilhoek:13,rad:'金',jawonElement:'금'},
      {ch:'鎌',meaning:'낫',strokes:18,pilhoek:18,rad:'金',jawonElement:'금'}
    ],
    '경': [
      {ch:'京',meaning:'서울',strokes:8,pilhoek:8,rad:'亠',jawonElement:null},
      {ch:'敬',meaning:'공경할',strokes:13,pilhoek:12,rad:'攴',jawonElement:'금'},
      {ch:'慶',meaning:'경사',strokes:15,pilhoek:15,rad:'心',jawonElement:'화'},
      {ch:'耕',meaning:'밭갈',strokes:10,pilhoek:10,rad:'耒',jawonElement:null},
      {ch:'輕',meaning:'가벼울',strokes:14,pilhoek:14,rad:'車',jawonElement:'화'},
      {ch:'經',meaning:'경서',strokes:13,pilhoek:13,rad:'糸',jawonElement:'목'},
      {ch:'更',meaning:'고칠',strokes:7,pilhoek:7,rad:'曰',jawonElement:null},
      {ch:'景',meaning:'볕',strokes:12,pilhoek:12,rad:'日',jawonElement:null}
    ],
    '규': [
      {ch:'珪',meaning:'서옥',strokes:11,pilhoek:10,rad:'玉',jawonElement:'금'},
      {ch:'規',meaning:'법',strokes:11,pilhoek:11,rad:'見',jawonElement:'화'},
      {ch:'奎',meaning:'별',strokes:9,pilhoek:9,rad:'大',jawonElement:null},
      {ch:'圭',meaning:'서옥',strokes:6,pilhoek:6,rad:'土',jawonElement:'토'},
      {ch:'糾',meaning:'살필',strokes:8,pilhoek:8,rad:'糸',jawonElement:'목'},
      {ch:'叫',meaning:'부를',strokes:5,pilhoek:5,rad:'口',jawonElement:null},
      {ch:'揆',meaning:'헤아릴',strokes:13,pilhoek:12,rad:'手',jawonElement:'목'},
      {ch:'閨',meaning:'안방',strokes:14,pilhoek:14,rad:'門',jawonElement:null}
    ],
    '근': [
      {ch:'近',meaning:'가까울',strokes:11,pilhoek:7,rad:'辵',jawonElement:'토'},
      {ch:'根',meaning:'뿌리',strokes:10,pilhoek:10,rad:'木',jawonElement:'목'},
      {ch:'勤',meaning:'부지런할',strokes:13,pilhoek:13,rad:'力',jawonElement:null},
      {ch:'謹',meaning:'삼갈',strokes:18,pilhoek:18,rad:'言',jawonElement:'금'},
      {ch:'饉',meaning:'푸성귀흉년드는',strokes:20,pilhoek:19,rad:'食',jawonElement:'수'},
      {ch:'瑾',meaning:'붉은옥',strokes:16,pilhoek:15,rad:'玉',jawonElement:'금'},
      {ch:'槿',meaning:'무궁화',strokes:15,pilhoek:15,rad:'木',jawonElement:'목'},
      {ch:'覲',meaning:'뵈울',strokes:18,pilhoek:18,rad:'見',jawonElement:'화'}
    ],
    '기': [
      {ch:'奇',meaning:'기이할',strokes:8,pilhoek:8,rad:'大',jawonElement:null},
      {ch:'琦',meaning:'옥 이름',strokes:13,pilhoek:12,rad:'玉',jawonElement:'금'},
      {ch:'己',meaning:'자기',strokes:3,pilhoek:3,rad:'己',jawonElement:null},
      {ch:'記',meaning:'기록할',strokes:10,pilhoek:10,rad:'言',jawonElement:'금'},
      {ch:'氣',meaning:'기운',strokes:10,pilhoek:10,rad:'气',jawonElement:'수'},
      {ch:'技',meaning:'재주',strokes:8,pilhoek:7,rad:'手',jawonElement:'목'},
      {ch:'起',meaning:'일어날',strokes:10,pilhoek:10,rad:'走',jawonElement:'화'},
      {ch:'期',meaning:'기약할',strokes:12,pilhoek:12,rad:'月',jawonElement:'수'}
    ],
    '나': [
      {ch:'羅',meaning:'새 그물',strokes:20,pilhoek:19,rad:'网',jawonElement:null},
      {ch:'娜',meaning:'아리따울',strokes:10,pilhoek:9,rad:'女',jawonElement:'토'},
      {ch:'那',meaning:'어찌',strokes:11,pilhoek:6,rad:'邑',jawonElement:'토'},
      {ch:'奈',meaning:'어찌',strokes:8,pilhoek:8,rad:'大',jawonElement:null},
      {ch:'儺',meaning:'법도있는',strokes:21,pilhoek:21,rad:'人',jawonElement:'화'},
      {ch:'懦',meaning:'부드러울',strokes:18,pilhoek:17,rad:'心',jawonElement:'화'},
      {ch:'邏',meaning:'돌',strokes:26,pilhoek:22,rad:'辵',jawonElement:'토'},
      {ch:'喇',meaning:'라마교',strokes:12,pilhoek:12,rad:'口',jawonElement:null}
    ],
    '남': [
      {ch:'南',meaning:'남녘',strokes:9,pilhoek:9,rad:'十',jawonElement:null},
      {ch:'男',meaning:'사내',strokes:7,pilhoek:7,rad:'田',jawonElement:null},
      {ch:'藍',meaning:'쪽',strokes:20,pilhoek:17,rad:'艸',jawonElement:'목'},
      {ch:'楠',meaning:'녹나무',strokes:13,pilhoek:13,rad:'木',jawonElement:'목'},
      {ch:'枏',meaning:'녹나무',strokes:8,pilhoek:8,rad:'木',jawonElement:'목'},
      {ch:'湳',meaning:'강 이름',strokes:13,pilhoek:12,rad:'水',jawonElement:'수'}
    ],
    '노': [
      {ch:'盧',meaning:'밥그릇',strokes:16,pilhoek:16,rad:'皿',jawonElement:null},
      {ch:'老',meaning:'늙은이',strokes:6,pilhoek:6,rad:'老',jawonElement:'토'},
      {ch:'路',meaning:'길',strokes:13,pilhoek:13,rad:'足',jawonElement:'토'},
      {ch:'勞',meaning:'수고할',strokes:12,pilhoek:12,rad:'力',jawonElement:null},
      {ch:'努',meaning:'힘쓸',strokes:7,pilhoek:7,rad:'力',jawonElement:null},
      {ch:'爐',meaning:'화초',strokes:20,pilhoek:20,rad:'火',jawonElement:'화'},
      {ch:'駑',meaning:'노둔한 말',strokes:15,pilhoek:15,rad:'馬',jawonElement:'화'},
      {ch:'帑',meaning:'처자식',strokes:8,pilhoek:8,rad:'巾',jawonElement:'목'}
    ],
    '다': [
      {ch:'多',meaning:'많을',strokes:6,pilhoek:6,rad:'夕',jawonElement:null},
      {ch:'茶',meaning:'차풀',strokes:12,pilhoek:9,rad:'艸',jawonElement:'목'}
    ],
    '대': [
      {ch:'大',meaning:'클',strokes:3,pilhoek:3,rad:'大',jawonElement:null},
      {ch:'代',meaning:'대신할',strokes:5,pilhoek:5,rad:'人',jawonElement:'화'},
      {ch:'待',meaning:'기다릴',strokes:9,pilhoek:9,rad:'彳',jawonElement:'화'},
      {ch:'對',meaning:'마주볼',strokes:14,pilhoek:14,rad:'寸',jawonElement:null},
      {ch:'隊',meaning:'군대',strokes:17,pilhoek:11,rad:'阜',jawonElement:'토'},
      {ch:'貸',meaning:'빌릴',strokes:12,pilhoek:12,rad:'貝',jawonElement:'금'},
      {ch:'戴',meaning:'받들',strokes:18,pilhoek:17,rad:'戈',jawonElement:null},
      {ch:'垈',meaning:'터',strokes:8,pilhoek:8,rad:'土',jawonElement:'토'}
    ],
    '덕': [
      {ch:'德',meaning:'큰',strokes:15,pilhoek:15,rad:'彳',jawonElement:'화'},
      {ch:'悳',meaning:'덕',strokes:12,pilhoek:12,rad:'心',jawonElement:'화'}
    ],
    '도': [
      {ch:'都',meaning:'도읍',strokes:16,pilhoek:10,rad:'邑',jawonElement:'토'},
      {ch:'刀',meaning:'칼',strokes:2,pilhoek:2,rad:'刀',jawonElement:'금'},
      {ch:'道',meaning:'길',strokes:16,pilhoek:12,rad:'辵',jawonElement:'토'},
      {ch:'度',meaning:'법도',strokes:9,pilhoek:9,rad:'广',jawonElement:'목'},
      {ch:'圖',meaning:'그림',strokes:14,pilhoek:14,rad:'囗',jawonElement:null},
      {ch:'島',meaning:'섬',strokes:10,pilhoek:10,rad:'山',jawonElement:'토'},
      {ch:'到',meaning:'이를',strokes:8,pilhoek:8,rad:'刀',jawonElement:'금'},
      {ch:'徒',meaning:'무리',strokes:10,pilhoek:10,rad:'彳',jawonElement:'화'}
    ],
    '동': [
      {ch:'董',meaning:'바로잡을',strokes:15,pilhoek:12,rad:'艸',jawonElement:'목'},
      {ch:'同',meaning:'같을',strokes:6,pilhoek:6,rad:'口',jawonElement:null},
      {ch:'東',meaning:'동녘',strokes:8,pilhoek:8,rad:'木',jawonElement:'목'},
      {ch:'冬',meaning:'겨울',strokes:5,pilhoek:5,rad:'冫',jawonElement:'수'},
      {ch:'動',meaning:'움직일',strokes:11,pilhoek:11,rad:'力',jawonElement:null},
      {ch:'洞',meaning:'마을',strokes:10,pilhoek:9,rad:'水',jawonElement:'수'},
      {ch:'童',meaning:'아이',strokes:12,pilhoek:12,rad:'立',jawonElement:null},
      {ch:'銅',meaning:'구리',strokes:14,pilhoek:14,rad:'金',jawonElement:'금'}
    ],
    '라': [
      {ch:'羅',meaning:'새그물',strokes:20,pilhoek:19,rad:'网',jawonElement:null},
      {ch:'邏',meaning:'돌',strokes:26,pilhoek:22,rad:'辵',jawonElement:'토'}
    ],
    '리': [
      {ch:'李',meaning:'오얏',strokes:7,pilhoek:7,rad:'木',jawonElement:'목'},
      {ch:'里',meaning:'마을',strokes:7,pilhoek:7,rad:'里',jawonElement:null},
      {ch:'利',meaning:'날카로울',strokes:7,pilhoek:7,rad:'刀',jawonElement:'금'},
      {ch:'理',meaning:'다스릴',strokes:12,pilhoek:11,rad:'玉',jawonElement:'금'},
      {ch:'異',meaning:'다를',strokes:12,pilhoek:11,rad:'田',jawonElement:null},
      {ch:'吏',meaning:'관리',strokes:6,pilhoek:6,rad:'口',jawonElement:null},
      {ch:'離',meaning:'떠날',strokes:19,pilhoek:18,rad:'隹',jawonElement:'화'},
      {ch:'履',meaning:'밟을',strokes:15,pilhoek:15,rad:'尸',jawonElement:null}
    ],
    '명': [
      {ch:'明',meaning:'밝을',strokes:8,pilhoek:8,rad:'日',jawonElement:null},
      {ch:'命',meaning:'목숨',strokes:8,pilhoek:8,rad:'口',jawonElement:null},
      {ch:'名',meaning:'이름',strokes:6,pilhoek:6,rad:'口',jawonElement:null},
      {ch:'鳴',meaning:'울',strokes:14,pilhoek:14,rad:'鳥',jawonElement:'화'},
      {ch:'銘',meaning:'새길',strokes:14,pilhoek:14,rad:'金',jawonElement:'금'},
      {ch:'溟',meaning:'바다',strokes:14,pilhoek:13,rad:'水',jawonElement:'수'},
      {ch:'皿',meaning:'그릇',strokes:5,pilhoek:5,rad:'皿',jawonElement:null},
      {ch:'螟',meaning:'며루',strokes:16,pilhoek:16,rad:'虫',jawonElement:'수'}
    ],
    '문': [
      {ch:'文',meaning:'무늬',strokes:4,pilhoek:4,rad:'文',jawonElement:'목'},
      {ch:'門',meaning:'문',strokes:8,pilhoek:8,rad:'門',jawonElement:null},
      {ch:'問',meaning:'물을',strokes:11,pilhoek:11,rad:'口',jawonElement:null},
      {ch:'聞',meaning:'들을',strokes:14,pilhoek:14,rad:'耳',jawonElement:'화'},
      {ch:'紊',meaning:'얽힐',strokes:10,pilhoek:10,rad:'糸',jawonElement:'목'},
      {ch:'汶',meaning:'내 이름',strokes:8,pilhoek:7,rad:'水',jawonElement:'수'},
      {ch:'紋',meaning:'무늬',strokes:10,pilhoek:10,rad:'糸',jawonElement:'목'},
      {ch:'吻',meaning:'입가',strokes:7,pilhoek:7,rad:'口',jawonElement:null}
    ],
    '미': [
      {ch:'美',meaning:'아름다울',strokes:9,pilhoek:9,rad:'羊',jawonElement:'토'},
      {ch:'米',meaning:'쌀',strokes:6,pilhoek:6,rad:'米',jawonElement:'목'},
      {ch:'味',meaning:'맛',strokes:8,pilhoek:8,rad:'口',jawonElement:null},
      {ch:'尾',meaning:'등',strokes:7,pilhoek:7,rad:'尸',jawonElement:null},
      {ch:'微',meaning:'작을',strokes:13,pilhoek:13,rad:'彳',jawonElement:'화'},
      {ch:'迷',meaning:'전념할',strokes:13,pilhoek:9,rad:'辵',jawonElement:'토'},
      {ch:'眉',meaning:'노인',strokes:9,pilhoek:9,rad:'目',jawonElement:'목'},
      {ch:'彌',meaning:'두루',strokes:17,pilhoek:17,rad:'弓',jawonElement:null}
    ],
    '민': [
      {ch:'敏',meaning:'민첩할',strokes:11,pilhoek:11,rad:'攴',jawonElement:'금'},
      {ch:'閔',meaning:'성',strokes:12,pilhoek:12,rad:'門',jawonElement:null},
      {ch:'旻',meaning:'하늘',strokes:8,pilhoek:8,rad:'日',jawonElement:null},
      {ch:'旼',meaning:'온화할',strokes:8,pilhoek:8,rad:'日',jawonElement:null},
      {ch:'珉',meaning:'아름다운돌',strokes:10,pilhoek:9,rad:'玉',jawonElement:'금'},
      {ch:'玟',meaning:'옥돌',strokes:9,pilhoek:8,rad:'玉',jawonElement:'금'},
      {ch:'民',meaning:'백성',strokes:5,pilhoek:5,rad:'氏',jawonElement:'화'},
      {ch:'岷',meaning:'산이름',strokes:8,pilhoek:8,rad:'山',jawonElement:'토'}
    ],
    '보': [
      {ch:'步',meaning:'걸을',strokes:7,pilhoek:7,rad:'止',jawonElement:'토'},
      {ch:'保',meaning:'지킬',strokes:9,pilhoek:9,rad:'人',jawonElement:'화'},
      {ch:'報',meaning:'갚을',strokes:12,pilhoek:12,rad:'土',jawonElement:'토'},
      {ch:'寶',meaning:'보배',strokes:20,pilhoek:20,rad:'宀',jawonElement:null},
      {ch:'補',meaning:'도울',strokes:13,pilhoek:12,rad:'衣',jawonElement:'목'},
      {ch:'普',meaning:'널리',strokes:12,pilhoek:12,rad:'日',jawonElement:null},
      {ch:'譜',meaning:'계보',strokes:19,pilhoek:19,rad:'言',jawonElement:'금'},
      {ch:'輔',meaning:'도울',strokes:14,pilhoek:14,rad:'車',jawonElement:'화'}
    ],
    '복': [
      {ch:'卜',meaning:'점칠',strokes:2,pilhoek:2,rad:'卜',jawonElement:null},
      {ch:'福',meaning:'복',strokes:14,pilhoek:13,rad:'示',jawonElement:null},
      {ch:'服',meaning:'옷',strokes:8,pilhoek:8,rad:'月',jawonElement:'수'},
      {ch:'復',meaning:'돌아올',strokes:12,pilhoek:12,rad:'彳',jawonElement:'화'},
      {ch:'覆',meaning:'도리어',strokes:18,pilhoek:18,rad:'襾',jawonElement:null},
      {ch:'馥',meaning:'향기',strokes:18,pilhoek:18,rad:'香',jawonElement:'목'},
      {ch:'僕',meaning:'시중꾼',strokes:14,pilhoek:14,rad:'人',jawonElement:'화'},
      {ch:'撲',meaning:'닦을',strokes:16,pilhoek:15,rad:'手',jawonElement:'목'}
    ],
    '병': [
      {ch:'兵',meaning:'군사',strokes:7,pilhoek:7,rad:'八',jawonElement:null},
      {ch:'丙',meaning:'남녘',strokes:5,pilhoek:5,rad:'一',jawonElement:null},
      {ch:'竝',meaning:'아우를',strokes:10,pilhoek:10,rad:'立',jawonElement:null},
      {ch:'秉',meaning:'잡을',strokes:8,pilhoek:8,rad:'禾',jawonElement:'목'},
      {ch:'炳',meaning:'밝을',strokes:9,pilhoek:9,rad:'火',jawonElement:'화'},
      {ch:'柄',meaning:'자루',strokes:9,pilhoek:9,rad:'木',jawonElement:'목'},
      {ch:'倂',meaning:'아우를',strokes:10,pilhoek:10,rad:'人',jawonElement:'화'},
      {ch:'昺',meaning:'밝을',strokes:9,pilhoek:9,rad:'日',jawonElement:null}
    ],
    '상': [
      {ch:'上',meaning:'위',strokes:3,pilhoek:3,rad:'一',jawonElement:null},
      {ch:'相',meaning:'서로',strokes:9,pilhoek:9,rad:'目',jawonElement:'목'},
      {ch:'想',meaning:'생각할',strokes:13,pilhoek:13,rad:'心',jawonElement:'화'},
      {ch:'常',meaning:'항상',strokes:11,pilhoek:11,rad:'巾',jawonElement:'목'},
      {ch:'賞',meaning:'상줄',strokes:15,pilhoek:15,rad:'貝',jawonElement:'금'},
      {ch:'商',meaning:'헤아릴',strokes:11,pilhoek:11,rad:'口',jawonElement:null},
      {ch:'尙',meaning:'오히려',strokes:8,pilhoek:8,rad:'小',jawonElement:null},
      {ch:'喪',meaning:'상사',strokes:12,pilhoek:12,rad:'口',jawonElement:null}
    ],
    '서': [
      {ch:'序',meaning:'차례',strokes:7,pilhoek:7,rad:'广',jawonElement:'목'},
      {ch:'徐',meaning:'천천할',strokes:10,pilhoek:10,rad:'彳',jawonElement:'화'},
      {ch:'瑞',meaning:'상서',strokes:14,pilhoek:13,rad:'玉',jawonElement:'금'},
      {ch:'舒',meaning:'펼',strokes:12,pilhoek:12,rad:'舌',jawonElement:null},
      {ch:'西',meaning:'서녘',strokes:6,pilhoek:6,rad:'襾',jawonElement:null},
      {ch:'書',meaning:'쓸',strokes:10,pilhoek:10,rad:'曰',jawonElement:null},
      {ch:'庶',meaning:'여러',strokes:11,pilhoek:11,rad:'广',jawonElement:'목'},
      {ch:'署',meaning:'관청',strokes:15,pilhoek:13,rad:'网',jawonElement:null}
    ],
    '석': [
      {ch:'石',meaning:'돌',strokes:5,pilhoek:5,rad:'石',jawonElement:'금'},
      {ch:'昔',meaning:'옛',strokes:8,pilhoek:8,rad:'日',jawonElement:null},
      {ch:'夕',meaning:'저녁',strokes:3,pilhoek:3,rad:'夕',jawonElement:null},
      {ch:'席',meaning:'자리',strokes:10,pilhoek:10,rad:'巾',jawonElement:'목'},
      {ch:'惜',meaning:'아낄',strokes:12,pilhoek:11,rad:'心',jawonElement:'화'},
      {ch:'釋',meaning:'풀',strokes:20,pilhoek:20,rad:'釆',jawonElement:null},
      {ch:'析',meaning:'가를',strokes:8,pilhoek:8,rad:'木',jawonElement:'목'},
      {ch:'錫',meaning:'주석',strokes:16,pilhoek:16,rad:'金',jawonElement:'금'}
    ],
    '선': [
      {ch:'宣',meaning:'베풀',strokes:9,pilhoek:9,rad:'宀',jawonElement:null},
      {ch:'先',meaning:'먼저',strokes:6,pilhoek:6,rad:'儿',jawonElement:null},
      {ch:'仙',meaning:'신선',strokes:5,pilhoek:5,rad:'人',jawonElement:'화'},
      {ch:'善',meaning:'착할',strokes:12,pilhoek:12,rad:'口',jawonElement:null},
      {ch:'單',meaning:'고을이름',strokes:12,pilhoek:12,rad:'口',jawonElement:null},
      {ch:'線',meaning:'실',strokes:15,pilhoek:15,rad:'糸',jawonElement:'목'},
      {ch:'選',meaning:'가릴',strokes:19,pilhoek:15,rad:'辵',jawonElement:'토'},
      {ch:'鮮',meaning:'고울',strokes:17,pilhoek:17,rad:'魚',jawonElement:'수'}
    ],
    '섭': [
      {ch:'葉',meaning:'고을이름',strokes:15,pilhoek:12,rad:'艸',jawonElement:'목'},
      {ch:'涉',meaning:'물 건널',strokes:11,pilhoek:10,rad:'水',jawonElement:'수'},
      {ch:'攝',meaning:'끌',strokes:22,pilhoek:21,rad:'手',jawonElement:'목'},
      {ch:'燮',meaning:'불에 익힐',strokes:17,pilhoek:17,rad:'火',jawonElement:'화'}
    ],
    '성': [
      {ch:'成',meaning:'이룰',strokes:7,pilhoek:6,rad:'戈',jawonElement:null},
      {ch:'星',meaning:'별',strokes:9,pilhoek:9,rad:'日',jawonElement:null},
      {ch:'省',meaning:'살필',strokes:9,pilhoek:9,rad:'目',jawonElement:'목'},
      {ch:'性',meaning:'성품',strokes:9,pilhoek:8,rad:'心',jawonElement:'화'},
      {ch:'姓',meaning:'일가',strokes:8,pilhoek:8,rad:'女',jawonElement:'토'},
      {ch:'城',meaning:'보루',strokes:10,pilhoek:9,rad:'土',jawonElement:'토'},
      {ch:'誠',meaning:'미쁠',strokes:14,pilhoek:13,rad:'言',jawonElement:'금'},
      {ch:'聖',meaning:'성인',strokes:13,pilhoek:13,rad:'耳',jawonElement:'화'}
    ],
    '세': [
      {ch:'世',meaning:'세상',strokes:5,pilhoek:5,rad:'一',jawonElement:null},
      {ch:'說',meaning:'쉴',strokes:14,pilhoek:14,rad:'言',jawonElement:'금'},
      {ch:'歲',meaning:'해',strokes:13,pilhoek:13,rad:'止',jawonElement:'토'},
      {ch:'細',meaning:'가늘',strokes:11,pilhoek:11,rad:'糸',jawonElement:'목'},
      {ch:'洗',meaning:'씻을',strokes:10,pilhoek:9,rad:'水',jawonElement:'수'},
      {ch:'勢',meaning:'권세',strokes:13,pilhoek:13,rad:'力',jawonElement:null},
      {ch:'稅',meaning:'구실',strokes:12,pilhoek:12,rad:'禾',jawonElement:'목'},
      {ch:'貰',meaning:'빌릴',strokes:12,pilhoek:12,rad:'貝',jawonElement:'금'}
    ],
    '소': [
      {ch:'蘇',meaning:'차조기',strokes:22,pilhoek:19,rad:'艸',jawonElement:'목'},
      {ch:'小',meaning:'작을',strokes:3,pilhoek:3,rad:'小',jawonElement:null},
      {ch:'少',meaning:'적을',strokes:4,pilhoek:4,rad:'小',jawonElement:null},
      {ch:'所',meaning:'곳',strokes:8,pilhoek:8,rad:'戶',jawonElement:'목'},
      {ch:'笑',meaning:'웃음',strokes:10,pilhoek:10,rad:'竹',jawonElement:'목'},
      {ch:'消',meaning:'다할',strokes:11,pilhoek:10,rad:'水',jawonElement:'수'},
      {ch:'素',meaning:'흴',strokes:10,pilhoek:10,rad:'糸',jawonElement:'목'},
      {ch:'召',meaning:'부를',strokes:5,pilhoek:5,rad:'口',jawonElement:null}
    ],
    '수': [
      {ch:'守',meaning:'지킬',strokes:6,pilhoek:6,rad:'宀',jawonElement:null},
      {ch:'樹',meaning:'나무',strokes:16,pilhoek:16,rad:'木',jawonElement:'목'},
      {ch:'受',meaning:'이을',strokes:8,pilhoek:8,rad:'又',jawonElement:null},
      {ch:'修',meaning:'닦을',strokes:10,pilhoek:9,rad:'人',jawonElement:'화'},
      {ch:'秀',meaning:'빼어날',strokes:7,pilhoek:7,rad:'禾',jawonElement:'목'},
      {ch:'洙',meaning:'물가',strokes:10,pilhoek:9,rad:'水',jawonElement:'수'},
      {ch:'水',meaning:'물',strokes:4,pilhoek:4,rad:'水',jawonElement:'수'},
      {ch:'手',meaning:'손',strokes:4,pilhoek:4,rad:'手',jawonElement:'목'}
    ],
    '승': [
      {ch:'勝',meaning:'이길',strokes:12,pilhoek:12,rad:'力',jawonElement:null},
      {ch:'承',meaning:'받들',strokes:8,pilhoek:8,rad:'手',jawonElement:'목'},
      {ch:'昇',meaning:'해 돋을',strokes:8,pilhoek:8,rad:'日',jawonElement:null},
      {ch:'乘',meaning:'오를',strokes:10,pilhoek:10,rad:'丿',jawonElement:null},
      {ch:'僧',meaning:'중',strokes:14,pilhoek:14,rad:'人',jawonElement:'화'},
      {ch:'升',meaning:'오를',strokes:4,pilhoek:4,rad:'十',jawonElement:null},
      {ch:'繩',meaning:'법',strokes:19,pilhoek:19,rad:'糸',jawonElement:'목'},
      {ch:'丞',meaning:'이을',strokes:6,pilhoek:6,rad:'一',jawonElement:null}
    ],
    '시': [
      {ch:'時',meaning:'때',strokes:10,pilhoek:10,rad:'日',jawonElement:null},
      {ch:'始',meaning:'비로소',strokes:8,pilhoek:8,rad:'女',jawonElement:'토'},
      {ch:'詩',meaning:'풍류가락',strokes:13,pilhoek:13,rad:'言',jawonElement:'금'},
      {ch:'是',meaning:'이',strokes:9,pilhoek:9,rad:'日',jawonElement:null},
      {ch:'施',meaning:'베풀',strokes:9,pilhoek:9,rad:'方',jawonElement:null},
      {ch:'示',meaning:'보일',strokes:5,pilhoek:5,rad:'示',jawonElement:null},
      {ch:'市',meaning:'흥정할',strokes:5,pilhoek:5,rad:'巾',jawonElement:'목'},
      {ch:'視',meaning:'볼',strokes:12,pilhoek:11,rad:'示',jawonElement:null}
    ],
    '식': [
      {ch:'食',meaning:'밥',strokes:9,pilhoek:9,rad:'食',jawonElement:'수'},
      {ch:'式',meaning:'법',strokes:6,pilhoek:6,rad:'弋',jawonElement:null},
      {ch:'植',meaning:'심을',strokes:12,pilhoek:12,rad:'木',jawonElement:'목'},
      {ch:'息',meaning:'자식',strokes:10,pilhoek:10,rad:'心',jawonElement:'화'},
      {ch:'飾',meaning:'꾸밀',strokes:14,pilhoek:13,rad:'食',jawonElement:'수'},
      {ch:'湜',meaning:'물 맑을',strokes:13,pilhoek:12,rad:'水',jawonElement:'수'},
      {ch:'殖',meaning:'심을',strokes:12,pilhoek:12,rad:'歹',jawonElement:'수'},
      {ch:'軾',meaning:'수레 안에서 절할',strokes:13,pilhoek:13,rad:'車',jawonElement:'화'}
    ],
    '신': [
      {ch:'申',meaning:'펼',strokes:5,pilhoek:5,rad:'田',jawonElement:null},
      {ch:'辛',meaning:'매울',strokes:7,pilhoek:7,rad:'辛',jawonElement:'금'},
      {ch:'身',meaning:'몸',strokes:7,pilhoek:7,rad:'身',jawonElement:null},
      {ch:'信',meaning:'믿을',strokes:9,pilhoek:9,rad:'人',jawonElement:'화'},
      {ch:'臣',meaning:'신하',strokes:6,pilhoek:6,rad:'臣',jawonElement:null},
      {ch:'新',meaning:'새',strokes:13,pilhoek:13,rad:'斤',jawonElement:null},
      {ch:'神',meaning:'천신',strokes:10,pilhoek:9,rad:'示',jawonElement:null},
      {ch:'愼',meaning:'삼갈',strokes:14,pilhoek:13,rad:'心',jawonElement:'화'}
    ],
    '아': [
      {ch:'兒',meaning:'아이',strokes:8,pilhoek:8,rad:'儿',jawonElement:null},
      {ch:'我',meaning:'자기',strokes:7,pilhoek:7,rad:'戈',jawonElement:null},
      {ch:'雅',meaning:'아담할',strokes:12,pilhoek:12,rad:'隹',jawonElement:'화'},
      {ch:'亞',meaning:'버금',strokes:8,pilhoek:8,rad:'二',jawonElement:null},
      {ch:'娥',meaning:'예쁠',strokes:10,pilhoek:10,rad:'女',jawonElement:'토'},
      {ch:'餓',meaning:'굶을',strokes:16,pilhoek:15,rad:'食',jawonElement:'수'},
      {ch:'芽',meaning:'싹',strokes:10,pilhoek:7,rad:'艸',jawonElement:'목'},
      {ch:'牙',meaning:'대장 기',strokes:4,pilhoek:4,rad:'牙',jawonElement:null}
    ],
    '안': [
      {ch:'安',meaning:'편안할',strokes:6,pilhoek:6,rad:'宀',jawonElement:null},
      {ch:'案',meaning:'책상',strokes:10,pilhoek:10,rad:'木',jawonElement:'목'},
      {ch:'顔',meaning:'얼굴',strokes:18,pilhoek:18,rad:'頁',jawonElement:'화'},
      {ch:'岸',meaning:'물가 언덕',strokes:8,pilhoek:8,rad:'山',jawonElement:'토'},
      {ch:'按',meaning:'살필',strokes:10,pilhoek:9,rad:'手',jawonElement:'목'},
      {ch:'晏',meaning:'편안할',strokes:10,pilhoek:10,rad:'日',jawonElement:null},
      {ch:'鮟',meaning:'천징어',strokes:17,pilhoek:17,rad:'魚',jawonElement:'수'}
    ],
    '언': [
      {ch:'言',meaning:'말씀',strokes:7,pilhoek:7,rad:'言',jawonElement:'금'},
      {ch:'焉',meaning:'어찌',strokes:11,pilhoek:11,rad:'火',jawonElement:'화'},
      {ch:'彦',meaning:'선비',strokes:9,pilhoek:9,rad:'彡',jawonElement:null},
      {ch:'偃',meaning:'누울',strokes:11,pilhoek:11,rad:'人',jawonElement:'화'}
    ],
    '여': [
      {ch:'呂',meaning:'풍류',strokes:7,pilhoek:7,rad:'口',jawonElement:null},
      {ch:'女',meaning:'계집',strokes:3,pilhoek:3,rad:'女',jawonElement:'토'},
      {ch:'如',meaning:'같을',strokes:6,pilhoek:6,rad:'女',jawonElement:'토'},
      {ch:'餘',meaning:'남을',strokes:16,pilhoek:15,rad:'食',jawonElement:'수'},
      {ch:'與',meaning:'더불어',strokes:14,pilhoek:13,rad:'臼',jawonElement:'토'},
      {ch:'余',meaning:'자기',strokes:7,pilhoek:7,rad:'人',jawonElement:'화'},
      {ch:'汝',meaning:'물 이름',strokes:7,pilhoek:6,rad:'水',jawonElement:'수'},
      {ch:'旅',meaning:'베풀',strokes:10,pilhoek:10,rad:'方',jawonElement:null}
    ],
    '연': [
      {ch:'延',meaning:'닿을',strokes:7,pilhoek:6,rad:'廴',jawonElement:null},
      {ch:'姸',meaning:'고을',strokes:9,pilhoek:9,rad:'女',jawonElement:'토'},
      {ch:'娟',meaning:'어여쁠',strokes:10,pilhoek:10,rad:'女',jawonElement:'토'},
      {ch:'年',meaning:'해',strokes:6,pilhoek:6,rad:'干',jawonElement:'목'},
      {ch:'然',meaning:'그러할',strokes:12,pilhoek:12,rad:'火',jawonElement:'화'},
      {ch:'連',meaning:'이을',strokes:14,pilhoek:10,rad:'辵',jawonElement:'토'},
      {ch:'煙',meaning:'연기',strokes:13,pilhoek:13,rad:'火',jawonElement:'화'},
      {ch:'練',meaning:'이길',strokes:15,pilhoek:15,rad:'糸',jawonElement:'목'}
    ],
    '열': [
      {ch:'說',meaning:'기꺼울',strokes:14,pilhoek:14,rad:'言',jawonElement:'금'},
      {ch:'熱',meaning:'뜨거울',strokes:15,pilhoek:15,rad:'火',jawonElement:'화'},
      {ch:'列',meaning:'무리에 들어갈',strokes:6,pilhoek:6,rad:'刀',jawonElement:'금'},
      {ch:'悅',meaning:'즐거울',strokes:11,pilhoek:10,rad:'心',jawonElement:'화'},
      {ch:'烈',meaning:'불 활활 붙을',strokes:10,pilhoek:10,rad:'火',jawonElement:'화'},
      {ch:'劣',meaning:'못날',strokes:6,pilhoek:6,rad:'力',jawonElement:null},
      {ch:'裂',meaning:'비단 자투리',strokes:12,pilhoek:12,rad:'衣',jawonElement:'목'},
      {ch:'閱',meaning:'군대 점호할',strokes:15,pilhoek:15,rad:'門',jawonElement:null}
    ],
    '영': [
      {ch:'永',meaning:'길',strokes:5,pilhoek:5,rad:'水',jawonElement:'수'},
      {ch:'英',meaning:'꽃부리',strokes:11,pilhoek:8,rad:'艸',jawonElement:'목'},
      {ch:'榮',meaning:'오동나무',strokes:14,pilhoek:14,rad:'木',jawonElement:'목'},
      {ch:'營',meaning:'지을',strokes:17,pilhoek:16,rad:'火',jawonElement:'화'},
      {ch:'詠',meaning:'읊을',strokes:12,pilhoek:12,rad:'言',jawonElement:'금'},
      {ch:'泳',meaning:'헤엄칠',strokes:9,pilhoek:8,rad:'水',jawonElement:'수'},
      {ch:'瑛',meaning:'옥빛',strokes:14,pilhoek:12,rad:'玉',jawonElement:'금'},
      {ch:'玲',meaning:'옥소리 쟁그렁거릴',strokes:10,pilhoek:9,rad:'玉',jawonElement:'금'}
    ],
    '예': [
      {ch:'禮',meaning:'예도',strokes:18,pilhoek:17,rad:'示',jawonElement:null},
      {ch:'藝',meaning:'재주',strokes:21,pilhoek:18,rad:'艸',jawonElement:'목'},
      {ch:'譽',meaning:'칭찬할',strokes:21,pilhoek:20,rad:'言',jawonElement:'금'},
      {ch:'睿',meaning:'슬기로울',strokes:14,pilhoek:14,rad:'目',jawonElement:'목'},
      {ch:'芮',meaning:'풀 뾰족뾰족할',strokes:10,pilhoek:7,rad:'艸',jawonElement:'목'},
      {ch:'例',meaning:'본보기',strokes:8,pilhoek:8,rad:'人',jawonElement:'화'},
      {ch:'豫',meaning:'기쁠',strokes:16,pilhoek:15,rad:'豕',jawonElement:'수'},
      {ch:'銳',meaning:'날카로울',strokes:15,pilhoek:15,rad:'金',jawonElement:'금'}
    ],
    '오': [
      {ch:'吳',meaning:'큰소리 지를',strokes:7,pilhoek:7,rad:'口',jawonElement:null},
      {ch:'五',meaning:'다섯',strokes:5,pilhoek:4,rad:null,jawonElement:null},
      {ch:'午',meaning:'낮',strokes:4,pilhoek:4,rad:'十',jawonElement:null},
      {ch:'惡',meaning:'부끄러울',strokes:12,pilhoek:12,rad:'心',jawonElement:'화'},
      {ch:'吾',meaning:'자기',strokes:7,pilhoek:7,rad:'口',jawonElement:null},
      {ch:'烏',meaning:'검을',strokes:10,pilhoek:10,rad:'火',jawonElement:'화'},
      {ch:'悟',meaning:'깨우칠',strokes:11,pilhoek:10,rad:'心',jawonElement:'화'},
      {ch:'汚',meaning:'웅덩이',strokes:7,pilhoek:6,rad:'水',jawonElement:'수'}
    ],
    '옥': [
      {ch:'玉',meaning:'구슬',strokes:5,pilhoek:5,rad:'玉',jawonElement:'금'},
      {ch:'屋',meaning:'집',strokes:9,pilhoek:9,rad:'尸',jawonElement:null},
      {ch:'沃',meaning:'기름질',strokes:8,pilhoek:7,rad:'水',jawonElement:'수'},
      {ch:'鈺',meaning:'보배',strokes:13,pilhoek:13,rad:'金',jawonElement:'금'}
    ],
    '온': [
      {ch:'溫',meaning:'따뜻할',strokes:14,pilhoek:13,rad:'水',jawonElement:'수'},
      {ch:'穩',meaning:'편안할',strokes:19,pilhoek:19,rad:'禾',jawonElement:'목'},
      {ch:'蘊',meaning:'쌓일',strokes:22,pilhoek:19,rad:'艸',jawonElement:'목'},
      {ch:'縕',meaning:'묵은 솜',strokes:16,pilhoek:16,rad:'糸',jawonElement:'목'},
      {ch:'瘟',meaning:'온역',strokes:15,pilhoek:14,rad:'疒',jawonElement:'수'},
      {ch:'瑥',meaning:'사람이름',strokes:15,pilhoek:13,rad:'玉',jawonElement:'금'}
    ],
    '완': [
      {ch:'完',meaning:'완전할',strokes:7,pilhoek:7,rad:'宀',jawonElement:null},
      {ch:'莞',meaning:'빙그레 웃는 모양',strokes:13,pilhoek:10,rad:'艸',jawonElement:'목'},
      {ch:'頑',meaning:'완악할',strokes:13,pilhoek:13,rad:'頁',jawonElement:'화'},
      {ch:'宛',meaning:'어슴푸레할',strokes:8,pilhoek:8,rad:'宀',jawonElement:null},
      {ch:'婉',meaning:'순할',strokes:11,pilhoek:11,rad:'女',jawonElement:'토'},
      {ch:'阮',meaning:'성씨',strokes:12,pilhoek:6,rad:'阜',jawonElement:'토'},
      {ch:'琓',meaning:'구슬',strokes:12,pilhoek:11,rad:'玉',jawonElement:'금'},
      {ch:'玩',meaning:'보배',strokes:9,pilhoek:8,rad:'玉',jawonElement:'금'}
    ],
    '요': [
      {ch:'要',meaning:'구할',strokes:9,pilhoek:9,rad:'襾',jawonElement:null},
      {ch:'樂',meaning:'좋아할',strokes:15,pilhoek:15,rad:'木',jawonElement:'목'},
      {ch:'料',meaning:'말질할',strokes:10,pilhoek:10,rad:'斗',jawonElement:'화'},
      {ch:'了',meaning:'마칠',strokes:2,pilhoek:2,rad:'亅',jawonElement:null},
      {ch:'謠',meaning:'노래',strokes:17,pilhoek:17,rad:'言',jawonElement:'금'},
      {ch:'僚',meaning:'벗',strokes:14,pilhoek:14,rad:'人',jawonElement:'화'},
      {ch:'遙',meaning:'멀',strokes:17,pilhoek:13,rad:'辵',jawonElement:'토'},
      {ch:'陶',meaning:'화락할',strokes:16,pilhoek:10,rad:'阜',jawonElement:'토'}
    ],
    '용': [
      {ch:'龍',meaning:'용',strokes:16,pilhoek:16,rad:'龍',jawonElement:'토'},
      {ch:'瑢',meaning:'패옥소리',strokes:15,pilhoek:14,rad:'玉',jawonElement:'금'},
      {ch:'用',meaning:'쓸',strokes:5,pilhoek:5,rad:'用',jawonElement:'수'},
      {ch:'容',meaning:'얼굴',strokes:10,pilhoek:10,rad:'宀',jawonElement:null},
      {ch:'勇',meaning:'날랠',strokes:9,pilhoek:9,rad:'力',jawonElement:null},
      {ch:'庸',meaning:'쓸',strokes:11,pilhoek:11,rad:'广',jawonElement:'목'},
      {ch:'踊',meaning:'뛸',strokes:14,pilhoek:14,rad:'足',jawonElement:'토'},
      {ch:'鏞',meaning:'큰 쇠북',strokes:19,pilhoek:19,rad:'金',jawonElement:'금'}
    ],
    '우': [
      {ch:'雨',meaning:'비',strokes:8,pilhoek:8,rad:'雨',jawonElement:'수'},
      {ch:'宇',meaning:'집',strokes:6,pilhoek:6,rad:'宀',jawonElement:null},
      {ch:'優',meaning:'넉넉할',strokes:17,pilhoek:17,rad:'人',jawonElement:'화'},
      {ch:'佑',meaning:'도울',strokes:7,pilhoek:7,rad:'人',jawonElement:'화'},
      {ch:'祐',meaning:'도울',strokes:10,pilhoek:9,rad:'示',jawonElement:null},
      {ch:'禹',meaning:'하우씨',strokes:9,pilhoek:9,rad:'禸',jawonElement:null},
      {ch:'瑀',meaning:'옥돌',strokes:14,pilhoek:13,rad:'玉',jawonElement:'금'},
      {ch:'右',meaning:'오른쪽',strokes:5,pilhoek:5,rad:'口',jawonElement:null}
    ],
    '운': [
      {ch:'雲',meaning:'구름',strokes:12,pilhoek:12,rad:'雨',jawonElement:'수'},
      {ch:'運',meaning:'움직일',strokes:16,pilhoek:12,rad:'辵',jawonElement:'토'},
      {ch:'云',meaning:'이를',strokes:4,pilhoek:4,rad:'二',jawonElement:null},
      {ch:'韻',meaning:'울림',strokes:19,pilhoek:19,rad:'音',jawonElement:'금'},
      {ch:'芸',meaning:'향풀',strokes:10,pilhoek:7,rad:'艸',jawonElement:'목'},
      {ch:'暈',meaning:'무리',strokes:13,pilhoek:13,rad:'日',jawonElement:null},
      {ch:'隕',meaning:'곤란할',strokes:18,pilhoek:12,rad:'阜',jawonElement:'토'},
      {ch:'耘',meaning:'길 맬',strokes:10,pilhoek:10,rad:'耒',jawonElement:null}
    ],
    '원': [
      {ch:'元',meaning:'으뜸',strokes:4,pilhoek:4,rad:'儿',jawonElement:null},
      {ch:'原',meaning:'근본',strokes:10,pilhoek:10,rad:'厂',jawonElement:null},
      {ch:'源',meaning:'근원',strokes:14,pilhoek:13,rad:'水',jawonElement:'수'},
      {ch:'苑',meaning:'나랏동산',strokes:11,pilhoek:8,rad:'艸',jawonElement:'목'},
      {ch:'媛',meaning:'아리따운 여자',strokes:12,pilhoek:12,rad:'女',jawonElement:'토'},
      {ch:'遠',meaning:'멀',strokes:17,pilhoek:13,rad:'辵',jawonElement:'토'},
      {ch:'園',meaning:'동산',strokes:13,pilhoek:13,rad:'囗',jawonElement:null},
      {ch:'願',meaning:'하고자할',strokes:19,pilhoek:19,rad:'頁',jawonElement:'화'}
    ],
    '웅': [
      {ch:'雄',meaning:'수컷',strokes:12,pilhoek:12,rad:'隹',jawonElement:'화'},
      {ch:'熊',meaning:'곰',strokes:14,pilhoek:14,rad:'火',jawonElement:'화'}
    ],
    '유': [
      {ch:'有',meaning:'있을',strokes:6,pilhoek:6,rad:'月',jawonElement:'수'},
      {ch:'柳',meaning:'버들',strokes:9,pilhoek:9,rad:'木',jawonElement:'목'},
      {ch:'唯',meaning:'오직',strokes:11,pilhoek:11,rad:'口',jawonElement:null},
      {ch:'柔',meaning:'부드러울',strokes:9,pilhoek:9,rad:'木',jawonElement:'목'},
      {ch:'裕',meaning:'넉넉할',strokes:13,pilhoek:12,rad:'衣',jawonElement:'목'},
      {ch:'兪',meaning:'그럴',strokes:9,pilhoek:9,rad:'入',jawonElement:null},
      {ch:'流',meaning:'흐를',strokes:10,pilhoek:10,rad:'水',jawonElement:'수'},
      {ch:'由',meaning:'말미암을',strokes:5,pilhoek:5,rad:'田',jawonElement:null}
    ],
    '윤': [
      {ch:'尹',meaning:'다스릴',strokes:4,pilhoek:4,rad:'丿',jawonElement:null},
      {ch:'允',meaning:'미쁠',strokes:4,pilhoek:4,rad:'儿',jawonElement:null},
      {ch:'潤',meaning:'불을',strokes:16,pilhoek:15,rad:'水',jawonElement:'수'},
      {ch:'胤',meaning:'맏아들',strokes:11,pilhoek:9,rad:'肉',jawonElement:null},
      {ch:'鈗',meaning:'창',strokes:12,pilhoek:12,rad:'金',jawonElement:'금'},
      {ch:'玧',meaning:'귀막이 구슬',strokes:9,pilhoek:8,rad:'玉',jawonElement:'금'},
      {ch:'倫',meaning:'인륜',strokes:10,pilhoek:10,rad:'人',jawonElement:'화'},
      {ch:'輪',meaning:'바퀴',strokes:15,pilhoek:15,rad:'車',jawonElement:'화'}
    ],
    '율': [
      {ch:'律',meaning:'법',strokes:9,pilhoek:9,rad:'彳',jawonElement:'화'},
      {ch:'栗',meaning:'밤',strokes:10,pilhoek:10,rad:'木',jawonElement:'목'},
      {ch:'率',meaning:'헤아릴',strokes:11,pilhoek:11,rad:'玄',jawonElement:'수'},
      {ch:'慄',meaning:'쭈그릴',strokes:14,pilhoek:13,rad:'心',jawonElement:'화'},
      {ch:'聿',meaning:'마침내',strokes:6,pilhoek:6,rad:'聿',jawonElement:null}
    ],
    '은': [
      {ch:'銀',meaning:'은',strokes:14,pilhoek:14,rad:'金',jawonElement:'금'},
      {ch:'恩',meaning:'은혜',strokes:10,pilhoek:10,rad:'心',jawonElement:'화'},
      {ch:'殷',meaning:'많을',strokes:10,pilhoek:10,rad:'殳',jawonElement:'금'},
      {ch:'誾',meaning:'화평할',strokes:15,pilhoek:15,rad:'言',jawonElement:'금'},
      {ch:'垠',meaning:'언덕',strokes:9,pilhoek:9,rad:'土',jawonElement:'토'},
      {ch:'隱',meaning:'아낄',strokes:22,pilhoek:16,rad:'阜',jawonElement:'토'},
      {ch:'圻',meaning:'언덕',strokes:7,pilhoek:7,rad:'土',jawonElement:'토'},
      {ch:'慇',meaning:'공손할',strokes:14,pilhoek:14,rad:'心',jawonElement:'화'}
    ],
    '의': [
      {ch:'衣',meaning:'옷',strokes:6,pilhoek:6,rad:'衣',jawonElement:'목'},
      {ch:'意',meaning:'뜻',strokes:13,pilhoek:13,rad:'心',jawonElement:'화'},
      {ch:'義',meaning:'옳을',strokes:13,pilhoek:13,rad:'羊',jawonElement:'토'},
      {ch:'依',meaning:'의지할',strokes:8,pilhoek:8,rad:'人',jawonElement:'화'},
      {ch:'醫',meaning:'의원',strokes:18,pilhoek:18,rad:'酉',jawonElement:null},
      {ch:'矣',meaning:'어조사',strokes:7,pilhoek:7,rad:'矢',jawonElement:'금'},
      {ch:'議',meaning:'말할',strokes:20,pilhoek:20,rad:'言',jawonElement:'금'},
      {ch:'宜',meaning:'옳을',strokes:8,pilhoek:8,rad:'宀',jawonElement:null}
    ],
    '이': [
      {ch:'李',meaning:'오얏',strokes:7,pilhoek:7,rad:'木',jawonElement:'목'},
      {ch:'二',meaning:'두',strokes:2,pilhoek:2,rad:'二',jawonElement:null},
      {ch:'耳',meaning:'귀',strokes:6,pilhoek:6,rad:'耳',jawonElement:'화'},
      {ch:'里',meaning:'마을',strokes:7,pilhoek:7,rad:'里',jawonElement:null},
      {ch:'利',meaning:'날카로울',strokes:7,pilhoek:7,rad:'刀',jawonElement:'금'},
      {ch:'理',meaning:'다스릴',strokes:12,pilhoek:11,rad:'玉',jawonElement:'금'},
      {ch:'異',meaning:'다를',strokes:12,pilhoek:11,rad:'田',jawonElement:null},
      {ch:'以',meaning:'쓸',strokes:5,pilhoek:4,rad:'人',jawonElement:'화'}
    ],
    '익': [
      {ch:'益',meaning:'더할',strokes:10,pilhoek:10,rad:'皿',jawonElement:null},
      {ch:'翼',meaning:'날개',strokes:18,pilhoek:17,rad:'羽',jawonElement:'화'},
      {ch:'翊',meaning:'도울',strokes:11,pilhoek:11,rad:'羽',jawonElement:'화'},
      {ch:'溺',meaning:'약할',strokes:14,pilhoek:13,rad:'水',jawonElement:'수'},
      {ch:'匿',meaning:'숨길',strokes:11,pilhoek:10,rad:'匸',jawonElement:'토'},
      {ch:'謚',meaning:'웃을',strokes:17,pilhoek:17,rad:'言',jawonElement:'금'},
      {ch:'瀷',meaning:'강이름',strokes:21,pilhoek:20,rad:'水',jawonElement:'수'}
    ],
    '인': [
      {ch:'印',meaning:'도장',strokes:6,pilhoek:5,rad:'卩',jawonElement:null},
      {ch:'人',meaning:'사람',strokes:2,pilhoek:2,rad:'人',jawonElement:'화'},
      {ch:'仁',meaning:'어질',strokes:4,pilhoek:4,rad:'人',jawonElement:'화'},
      {ch:'因',meaning:'인할',strokes:6,pilhoek:6,rad:'囗',jawonElement:null},
      {ch:'引',meaning:'끌',strokes:4,pilhoek:4,rad:'弓',jawonElement:null},
      {ch:'寅',meaning:'세째지지',strokes:11,pilhoek:11,rad:'宀',jawonElement:null},
      {ch:'忍',meaning:'참을',strokes:7,pilhoek:7,rad:'心',jawonElement:'화'},
      {ch:'隣',meaning:'이웃',strokes:20,pilhoek:14,rad:'阜',jawonElement:'토'}
    ],
    '일': [
      {ch:'一',meaning:'한',strokes:1,pilhoek:1,rad:'一',jawonElement:null},
      {ch:'逸',meaning:'달아날',strokes:15,pilhoek:11,rad:'辵',jawonElement:'토'},
      {ch:'壹',meaning:'한',strokes:12,pilhoek:12,rad:'士',jawonElement:null},
      {ch:'鎰',meaning:'스물넉냥쭝',strokes:18,pilhoek:18,rad:'金',jawonElement:'금'},
      {ch:'佾',meaning:'춤',strokes:8,pilhoek:8,rad:'人',jawonElement:'화'},
      {ch:'溢',meaning:'넘칠',strokes:14,pilhoek:13,rad:'水',jawonElement:'수'},
      {ch:'佚',meaning:'편안할',strokes:7,pilhoek:7,rad:'人',jawonElement:'화'},
      {ch:'馹',meaning:'역말',strokes:14,pilhoek:14,rad:'馬',jawonElement:'화'}
    ],
    '자': [
      {ch:'子',meaning:'아들',strokes:3,pilhoek:3,rad:'子',jawonElement:'수'},
      {ch:'自',meaning:'스스로',strokes:6,pilhoek:6,rad:'自',jawonElement:null},
      {ch:'字',meaning:'글자',strokes:6,pilhoek:6,rad:'子',jawonElement:'수'},
      {ch:'慈',meaning:'사랑할',strokes:14,pilhoek:13,rad:'心',jawonElement:'화'},
      {ch:'資',meaning:'재물',strokes:13,pilhoek:13,rad:'貝',jawonElement:'금'},
      {ch:'姿',meaning:'맵시',strokes:9,pilhoek:9,rad:'女',jawonElement:'토'},
      {ch:'玆',meaning:'이',strokes:10,pilhoek:10,rad:'玄',jawonElement:'수'},
      {ch:'紫',meaning:'자주빛',strokes:11,pilhoek:12,rad:'糸',jawonElement:'목'}
    ],
    '장': [
      {ch:'張',meaning:'베풀',strokes:11,pilhoek:11,rad:'弓',jawonElement:null},
      {ch:'蔣',meaning:'줄',strokes:17,pilhoek:14,rad:'艸',jawonElement:'목'},
      {ch:'長',meaning:'길',strokes:8,pilhoek:8,rad:'長',jawonElement:null},
      {ch:'場',meaning:'마당',strokes:12,pilhoek:12,rad:'土',jawonElement:'토'},
      {ch:'將',meaning:'장차',strokes:11,pilhoek:11,rad:'寸',jawonElement:null},
      {ch:'章',meaning:'문채',strokes:11,pilhoek:11,rad:'音',jawonElement:'금'},
      {ch:'壯',meaning:'씩씩할',strokes:7,pilhoek:7,rad:'士',jawonElement:null},
      {ch:'狀',meaning:'모양 형상',strokes:8,pilhoek:8,rad:'犬',jawonElement:null}
    ],
    '재': [
      {ch:'在',meaning:'있을',strokes:6,pilhoek:6,rad:'土',jawonElement:'토'},
      {ch:'才',meaning:'재주',strokes:4,pilhoek:3,rad:'手',jawonElement:'목'},
      {ch:'材',meaning:'재목',strokes:7,pilhoek:7,rad:'木',jawonElement:'목'},
      {ch:'再',meaning:'두 번',strokes:6,pilhoek:6,rad:'冂',jawonElement:null},
      {ch:'財',meaning:'재물',strokes:10,pilhoek:10,rad:'貝',jawonElement:'금'},
      {ch:'哉',meaning:'비로소',strokes:9,pilhoek:9,rad:'口',jawonElement:null},
      {ch:'栽',meaning:'심을',strokes:10,pilhoek:10,rad:'木',jawonElement:'목'},
      {ch:'載',meaning:'실을',strokes:13,pilhoek:13,rad:'車',jawonElement:'화'}
    ],
    '정': [
      {ch:'鄭',meaning:'나라이름',strokes:19,pilhoek:14,rad:'邑',jawonElement:'토'},
      {ch:'正',meaning:'바를',strokes:5,pilhoek:5,rad:'止',jawonElement:'토'},
      {ch:'定',meaning:'정할',strokes:8,pilhoek:8,rad:'宀',jawonElement:null},
      {ch:'丁',meaning:'장정',strokes:2,pilhoek:2,rad:'一',jawonElement:null},
      {ch:'政',meaning:'정사',strokes:8,pilhoek:9,rad:'攴',jawonElement:'금'},
      {ch:'情',meaning:'뜻',strokes:12,pilhoek:11,rad:'心',jawonElement:'화'},
      {ch:'庭',meaning:'뜰',strokes:10,pilhoek:9,rad:'广',jawonElement:'목'},
      {ch:'停',meaning:'머무를',strokes:11,pilhoek:11,rad:'人',jawonElement:'화'}
    ],
    '제': [
      {ch:'諸',meaning:'모든',strokes:16,pilhoek:15,rad:'言',jawonElement:'금'},
      {ch:'弟',meaning:'아우',strokes:7,pilhoek:7,rad:'弓',jawonElement:null},
      {ch:'第',meaning:'집',strokes:11,pilhoek:11,rad:'竹',jawonElement:'목'},
      {ch:'題',meaning:'이마',strokes:18,pilhoek:18,rad:'頁',jawonElement:'화'},
      {ch:'祭',meaning:'제사',strokes:11,pilhoek:11,rad:'示',jawonElement:null},
      {ch:'除',meaning:'섬돌',strokes:15,pilhoek:9,rad:'阜',jawonElement:'토'},
      {ch:'帝',meaning:'임금',strokes:9,pilhoek:9,rad:'巾',jawonElement:'목'},
      {ch:'製',meaning:'만들',strokes:14,pilhoek:14,rad:'衣',jawonElement:'목'}
    ],
    '조': [
      {ch:'趙',meaning:'조나라',strokes:14,pilhoek:14,rad:'走',jawonElement:'화'},
      {ch:'曺',meaning:'성',strokes:10,pilhoek:10,rad:'曰',jawonElement:null},
      {ch:'朝',meaning:'아침',strokes:12,pilhoek:12,rad:'月',jawonElement:'수'},
      {ch:'祖',meaning:'조상',strokes:10,pilhoek:9,rad:'示',jawonElement:null},
      {ch:'助',meaning:'도울',strokes:7,pilhoek:7,rad:'力',jawonElement:null},
      {ch:'鳥',meaning:'새',strokes:11,pilhoek:11,rad:'鳥',jawonElement:'화'},
      {ch:'調',meaning:'고를',strokes:15,pilhoek:15,rad:'言',jawonElement:'금'},
      {ch:'造',meaning:'지을',strokes:14,pilhoek:10,rad:'辵',jawonElement:'토'}
    ],
    '종': [
      {ch:'終',meaning:'끝낼',strokes:11,pilhoek:11,rad:'糸',jawonElement:'목'},
      {ch:'宗',meaning:'마루',strokes:8,pilhoek:8,rad:'宀',jawonElement:null},
      {ch:'種',meaning:'씨',strokes:14,pilhoek:14,rad:'禾',jawonElement:'목'},
      {ch:'從',meaning:'좇을',strokes:11,pilhoek:11,rad:'彳',jawonElement:'화'},
      {ch:'鐘',meaning:'쇠북',strokes:20,pilhoek:20,rad:'金',jawonElement:'금'},
      {ch:'縱',meaning:'세로',strokes:17,pilhoek:17,rad:'糸',jawonElement:'목'},
      {ch:'琮',meaning:'옥홀',strokes:13,pilhoek:12,rad:'玉',jawonElement:'금'},
      {ch:'綜',meaning:'모을',strokes:14,pilhoek:14,rad:'糸',jawonElement:'목'}
    ],
    '주': [
      {ch:'朱',meaning:'붉을',strokes:6,pilhoek:6,rad:'木',jawonElement:'목'},
      {ch:'珠',meaning:'구슬',strokes:11,pilhoek:10,rad:'玉',jawonElement:'금'},
      {ch:'主',meaning:'주인',strokes:5,pilhoek:5,rad:'丶',jawonElement:null},
      {ch:'住',meaning:'살',strokes:7,pilhoek:7,rad:'人',jawonElement:'화'},
      {ch:'走',meaning:'달릴',strokes:7,pilhoek:7,rad:'走',jawonElement:'화'},
      {ch:'注',meaning:'물댈',strokes:9,pilhoek:8,rad:'水',jawonElement:'수'},
      {ch:'晝',meaning:'낮',strokes:11,pilhoek:11,rad:'日',jawonElement:null},
      {ch:'宙',meaning:'집',strokes:8,pilhoek:8,rad:'宀',jawonElement:null}
    ],
    '준': [
      {ch:'準',meaning:'법',strokes:14,pilhoek:13,rad:'水',jawonElement:'수'},
      {ch:'俊',meaning:'준걸',strokes:9,pilhoek:9,rad:'人',jawonElement:'화'},
      {ch:'浚',meaning:'깊을',strokes:11,pilhoek:10,rad:'水',jawonElement:'수'},
      {ch:'峻',meaning:'높을',strokes:10,pilhoek:10,rad:'山',jawonElement:'토'},
      {ch:'駿',meaning:'준마',strokes:17,pilhoek:17,rad:'馬',jawonElement:'화'},
      {ch:'埈',meaning:'높을',strokes:10,pilhoek:10,rad:'土',jawonElement:'토'},
      {ch:'濬',meaning:'칠',strokes:18,pilhoek:17,rad:'水',jawonElement:'수'},
      {ch:'遵',meaning:'좇을',strokes:19,pilhoek:15,rad:'辵',jawonElement:'토'}
    ],
    '중': [
      {ch:'中',meaning:'가운데',strokes:4,pilhoek:4,rad:'丨',jawonElement:null},
      {ch:'重',meaning:'무거울',strokes:9,pilhoek:9,rad:'里',jawonElement:null},
      {ch:'衆',meaning:'무리',strokes:12,pilhoek:12,rad:'血',jawonElement:'수'},
      {ch:'仲',meaning:'버금',strokes:6,pilhoek:6,rad:'人',jawonElement:'화'}
    ],
    '지': [
      {ch:'知',meaning:'알',strokes:8,pilhoek:8,rad:'矢',jawonElement:'금'},
      {ch:'志',meaning:'뜻',strokes:7,pilhoek:7,rad:'心',jawonElement:'화'},
      {ch:'智',meaning:'슬기',strokes:12,pilhoek:12,rad:'日',jawonElement:null},
      {ch:'池',meaning:'못',strokes:7,pilhoek:6,rad:'水',jawonElement:'수'},
      {ch:'址',meaning:'터',strokes:7,pilhoek:7,rad:'土',jawonElement:'토'},
      {ch:'芝',meaning:'지초',strokes:10,pilhoek:6,rad:'艸',jawonElement:'목'},
      {ch:'地',meaning:'땅',strokes:6,pilhoek:6,rad:'土',jawonElement:'토'},
      {ch:'至',meaning:'이를',strokes:6,pilhoek:6,rad:'至',jawonElement:'토'}
    ],
    '진': [
      {ch:'眞',meaning:'참',strokes:10,pilhoek:10,rad:'目',jawonElement:'목'},
      {ch:'陳',meaning:'묵을',strokes:16,pilhoek:10,rad:'阜',jawonElement:'토'},
      {ch:'振',meaning:'떨칠',strokes:11,pilhoek:10,rad:'手',jawonElement:'목'},
      {ch:'陣',meaning:'줄',strokes:15,pilhoek:9,rad:'阜',jawonElement:'토'},
      {ch:'珍',meaning:'보배',strokes:10,pilhoek:9,rad:'玉',jawonElement:'금'},
      {ch:'晉',meaning:'나아갈',strokes:10,pilhoek:10,rad:'日',jawonElement:null},
      {ch:'進',meaning:'나아갈',strokes:15,pilhoek:11,rad:'辵',jawonElement:'토'},
      {ch:'盡',meaning:'다할',strokes:14,pilhoek:14,rad:'皿',jawonElement:null}
    ],
    '찬': [
      {ch:'讚',meaning:'기릴',strokes:26,pilhoek:26,rad:'言',jawonElement:'금'},
      {ch:'瓚',meaning:'옥그릇',strokes:24,pilhoek:23,rad:'玉',jawonElement:'금'},
      {ch:'燦',meaning:'빛날',strokes:17,pilhoek:17,rad:'火',jawonElement:'화'},
      {ch:'贊',meaning:'도울',strokes:19,pilhoek:19,rad:'貝',jawonElement:'금'},
      {ch:'餐',meaning:'먹을',strokes:16,pilhoek:16,rad:'食',jawonElement:'수'},
      {ch:'鑽',meaning:'끌',strokes:27,pilhoek:27,rad:'金',jawonElement:'금'},
      {ch:'璨',meaning:'빛날',strokes:18,pilhoek:17,rad:'玉',jawonElement:'금'},
      {ch:'撰',meaning:'지을',strokes:16,pilhoek:15,rad:'手',jawonElement:'목'}
    ],
    '창': [
      {ch:'唱',meaning:'노래',strokes:11,pilhoek:11,rad:'口',jawonElement:null},
      {ch:'窓',meaning:'창',strokes:11,pilhoek:11,rad:'穴',jawonElement:'수'},
      {ch:'昌',meaning:'창성할',strokes:8,pilhoek:8,rad:'日',jawonElement:null},
      {ch:'創',meaning:'비롯할',strokes:12,pilhoek:12,rad:'刀',jawonElement:'금'},
      {ch:'蒼',meaning:'푸를',strokes:16,pilhoek:13,rad:'艸',jawonElement:'목'},
      {ch:'暢',meaning:'펼',strokes:14,pilhoek:14,rad:'日',jawonElement:null},
      {ch:'彰',meaning:'밝을',strokes:14,pilhoek:14,rad:'彡',jawonElement:null},
      {ch:'滄',meaning:'찰',strokes:14,pilhoek:13,rad:'水',jawonElement:'수'}
    ],
    '채': [
      {ch:'采',meaning:'캘',strokes:8,pilhoek:8,rad:'釆',jawonElement:null},
      {ch:'彩',meaning:'무늬',strokes:11,pilhoek:11,rad:'彡',jawonElement:null},
      {ch:'蔡',meaning:'거북',strokes:17,pilhoek:14,rad:'艸',jawonElement:'목'},
      {ch:'採',meaning:'캘',strokes:12,pilhoek:11,rad:'手',jawonElement:'목'},
      {ch:'菜',meaning:'나물',strokes:14,pilhoek:11,rad:'艸',jawonElement:'목'},
      {ch:'埰',meaning:'사패땅',strokes:11,pilhoek:11,rad:'土',jawonElement:'토'},
      {ch:'寨',meaning:'나무우리',strokes:14,pilhoek:14,rad:'宀',jawonElement:null},
      {ch:'綵',meaning:'비단',strokes:14,pilhoek:14,rad:'糸',jawonElement:'목'}
    ],
    '천': [
      {ch:'天',meaning:'하늘',strokes:4,pilhoek:4,rad:'大',jawonElement:null},
      {ch:'千',meaning:'일천',strokes:3,pilhoek:3,rad:'十',jawonElement:null},
      {ch:'泉',meaning:'샘',strokes:9,pilhoek:9,rad:'水',jawonElement:'수'},
      {ch:'川',meaning:'내',strokes:3,pilhoek:3,rad:'巛',jawonElement:'수'},
      {ch:'淺',meaning:'얕을',strokes:12,pilhoek:11,rad:'水',jawonElement:'수'},
      {ch:'遷',meaning:'옮길',strokes:19,pilhoek:15,rad:'辵',jawonElement:'토'},
      {ch:'薦',meaning:'천거할',strokes:19,pilhoek:16,rad:'艸',jawonElement:'목'},
      {ch:'踐',meaning:'밟을',strokes:15,pilhoek:15,rad:'足',jawonElement:'토'}
    ],
    '철': [
      {ch:'哲',meaning:'밝을',strokes:10,pilhoek:10,rad:'口',jawonElement:null},
      {ch:'徹',meaning:'통할',strokes:15,pilhoek:15,rad:'彳',jawonElement:'화'},
      {ch:'澈',meaning:'물 맑을',strokes:16,pilhoek:15,rad:'水',jawonElement:'수'},
      {ch:'喆',meaning:'밝을',strokes:12,pilhoek:12,rad:'口',jawonElement:null},
      {ch:'鐵',meaning:'쇠',strokes:21,pilhoek:21,rad:'金',jawonElement:'금'},
      {ch:'撤',meaning:'거둘',strokes:16,pilhoek:15,rad:'手',jawonElement:'목'},
      {ch:'轍',meaning:'바퀴 자국',strokes:19,pilhoek:19,rad:'車',jawonElement:'화'},
      {ch:'綴',meaning:'꿰맬',strokes:14,pilhoek:14,rad:'糸',jawonElement:'목'}
    ],
    '청': [
      {ch:'淸',meaning:'맑을',strokes:12,pilhoek:11,rad:'水',jawonElement:'수'},
      {ch:'晴',meaning:'갤',strokes:12,pilhoek:12,rad:'日',jawonElement:null},
      {ch:'靑',meaning:'푸를',strokes:8,pilhoek:8,rad:'靑',jawonElement:'목'},
      {ch:'請',meaning:'청할',strokes:15,pilhoek:15,rad:'言',jawonElement:'금'},
      {ch:'聽',meaning:'들을',strokes:22,pilhoek:22,rad:'耳',jawonElement:'화'},
      {ch:'廳',meaning:'관청',strokes:25,pilhoek:25,rad:'广',jawonElement:'목'},
      {ch:'菁',meaning:'초목무성한 모양',strokes:14,pilhoek:11,rad:'艸',jawonElement:'목'}
    ],
    '초': [
      {ch:'草',meaning:'풀',strokes:12,pilhoek:9,rad:'艸',jawonElement:'목'},
      {ch:'招',meaning:'부를',strokes:9,pilhoek:8,rad:'手',jawonElement:'목'},
      {ch:'初',meaning:'처음',strokes:7,pilhoek:7,rad:'刀',jawonElement:'금'},
      {ch:'超',meaning:'뛰어넘을',strokes:12,pilhoek:12,rad:'走',jawonElement:'화'},
      {ch:'礎',meaning:'주춧돌',strokes:18,pilhoek:18,rad:'石',jawonElement:'금'},
      {ch:'抄',meaning:'베낄',strokes:8,pilhoek:7,rad:'手',jawonElement:'목'},
      {ch:'肖',meaning:'닮을',strokes:9,pilhoek:7,rad:'肉',jawonElement:null},
      {ch:'秒',meaning:'시간 단위',strokes:9,pilhoek:9,rad:'禾',jawonElement:'목'}
    ],
    '최': [
      {ch:'崔',meaning:'산 우뚝할',strokes:11,pilhoek:11,rad:'山',jawonElement:'토'},
      {ch:'最',meaning:'가장',strokes:12,pilhoek:12,rad:'冂',jawonElement:null},
      {ch:'催',meaning:'핍박할',strokes:13,pilhoek:13,rad:'人',jawonElement:'화'}
    ],
    '충': [
      {ch:'忠',meaning:'충성',strokes:8,pilhoek:8,rad:'心',jawonElement:'화'},
      {ch:'充',meaning:'가득찰',strokes:5,pilhoek:6,rad:'儿',jawonElement:null},
      {ch:'蟲',meaning:'김 오를',strokes:18,pilhoek:18,rad:'虫',jawonElement:'수'},
      {ch:'衝',meaning:'충돌할',strokes:15,pilhoek:15,rad:'行',jawonElement:null},
      {ch:'衷',meaning:'가운데',strokes:10,pilhoek:10,rad:'衣',jawonElement:'목'},
      {ch:'沖',meaning:'깊을',strokes:8,pilhoek:7,rad:'水',jawonElement:'수'}
    ],
    '태': [
      {ch:'太',meaning:'클',strokes:4,pilhoek:4,rad:'大',jawonElement:null},
      {ch:'泰',meaning:'클',strokes:9,pilhoek:10,rad:'水',jawonElement:'수'},
      {ch:'台',meaning:'별',strokes:5,pilhoek:5,rad:'口',jawonElement:null},
      {ch:'兌',meaning:'기쁠',strokes:7,pilhoek:7,rad:'儿',jawonElement:null},
      {ch:'態',meaning:'모양',strokes:14,pilhoek:14,rad:'心',jawonElement:'화'},
      {ch:'殆',meaning:'가까이할',strokes:9,pilhoek:9,rad:'歹',jawonElement:'수'},
      {ch:'怠',meaning:'느릴',strokes:9,pilhoek:9,rad:'心',jawonElement:'화'},
      {ch:'胎',meaning:'아이 밸',strokes:11,pilhoek:9,rad:'肉',jawonElement:null}
    ],
    '표': [
      {ch:'表',meaning:'겉',strokes:9,pilhoek:8,rad:'衣',jawonElement:'목'},
      {ch:'標',meaning:'표시할',strokes:15,pilhoek:15,rad:'木',jawonElement:'목'},
      {ch:'票',meaning:'쪽지',strokes:11,pilhoek:11,rad:'示',jawonElement:null},
      {ch:'漂',meaning:'뜰',strokes:15,pilhoek:14,rad:'水',jawonElement:'수'},
      {ch:'豹',meaning:'표범',strokes:10,pilhoek:10,rad:'豸',jawonElement:'수'},
      {ch:'飄',meaning:'나부낄',strokes:20,pilhoek:20,rad:'風',jawonElement:'목'},
      {ch:'剽',meaning:'긁을',strokes:13,pilhoek:13,rad:'刀',jawonElement:'금'},
      {ch:'俵',meaning:'흩어질',strokes:10,pilhoek:10,rad:'人',jawonElement:'화'}
    ],
    '필': [
      {ch:'必',meaning:'반드시',strokes:5,pilhoek:5,rad:'心',jawonElement:'화'},
      {ch:'筆',meaning:'붓',strokes:12,pilhoek:12,rad:'竹',jawonElement:'목'},
      {ch:'匹',meaning:'짝',strokes:4,pilhoek:4,rad:'匸',jawonElement:'토'},
      {ch:'畢',meaning:'마칠',strokes:11,pilhoek:10,rad:'田',jawonElement:null},
      {ch:'弼',meaning:'도울',strokes:12,pilhoek:12,rad:'弓',jawonElement:null},
      {ch:'疋',meaning:'짝',strokes:5,pilhoek:5,rad:'疋',jawonElement:null},
      {ch:'苾',meaning:'향기날',strokes:11,pilhoek:8,rad:'艸',jawonElement:'목'},
      {ch:'珌',meaning:'칼 장식 옥',strokes:10,pilhoek:9,rad:'玉',jawonElement:'금'}
    ],
    '하': [
      {ch:'夏',meaning:'여름',strokes:10,pilhoek:10,rad:'夊',jawonElement:null},
      {ch:'河',meaning:'물',strokes:9,pilhoek:8,rad:'水',jawonElement:'수'},
      {ch:'荷',meaning:'연',strokes:13,pilhoek:10,rad:'艸',jawonElement:'목'},
      {ch:'昰',meaning:'여름',strokes:9,pilhoek:9,rad:'日',jawonElement:null},
      {ch:'下',meaning:'아래',strokes:3,pilhoek:3,rad:'一',jawonElement:null},
      {ch:'何',meaning:'어찌',strokes:7,pilhoek:7,rad:'人',jawonElement:'화'},
      {ch:'賀',meaning:'축하할',strokes:12,pilhoek:12,rad:'貝',jawonElement:'금'},
      {ch:'瑕',meaning:'옥의 티',strokes:14,pilhoek:13,rad:'玉',jawonElement:'금'}
    ],
    '학': [
      {ch:'學',meaning:'배울',strokes:16,pilhoek:16,rad:'子',jawonElement:'수'},
      {ch:'鶴',meaning:'두루미',strokes:21,pilhoek:21,rad:'鳥',jawonElement:'화'},
      {ch:'壑',meaning:'골짜기',strokes:17,pilhoek:17,rad:'土',jawonElement:'토'}
    ],
    '한': [
      {ch:'韓',meaning:'나라 이름',strokes:17,pilhoek:17,rad:'韋',jawonElement:'금'},
      {ch:'漢',meaning:'한수',strokes:15,pilhoek:14,rad:'水',jawonElement:'수'},
      {ch:'寒',meaning:'찰',strokes:12,pilhoek:12,rad:'宀',jawonElement:null},
      {ch:'限',meaning:'한정할',strokes:14,pilhoek:8,rad:'阜',jawonElement:'토'},
      {ch:'閑',meaning:'한가할',strokes:12,pilhoek:12,rad:'門',jawonElement:null},
      {ch:'恨',meaning:'한될',strokes:10,pilhoek:9,rad:'心',jawonElement:'화'},
      {ch:'旱',meaning:'가물',strokes:7,pilhoek:7,rad:'日',jawonElement:null},
      {ch:'汗',meaning:'땀',strokes:7,pilhoek:6,rad:'水',jawonElement:'수'}
    ],
    '해': [
      {ch:'海',meaning:'바다',strokes:11,pilhoek:10,rad:'水',jawonElement:'수'},
      {ch:'解',meaning:'쪼갤',strokes:13,pilhoek:13,rad:'角',jawonElement:'목'},
      {ch:'亥',meaning:'열 둘째 지지',strokes:6,pilhoek:6,rad:'亠',jawonElement:null},
      {ch:'該',meaning:'갖출',strokes:13,pilhoek:13,rad:'言',jawonElement:'금'},
      {ch:'奚',meaning:'어찌',strokes:10,pilhoek:10,rad:'大',jawonElement:null},
      {ch:'偕',meaning:'함께할',strokes:11,pilhoek:11,rad:'人',jawonElement:'화'},
      {ch:'骸',meaning:'뼈',strokes:16,pilhoek:15,rad:'骨',jawonElement:null},
      {ch:'諧',meaning:'조화할',strokes:16,pilhoek:16,rad:'言',jawonElement:'금'}
    ],
    '향': [
      {ch:'香',meaning:'향내',strokes:9,pilhoek:9,rad:'香',jawonElement:'목'},
      {ch:'向',meaning:'향할',strokes:6,pilhoek:6,rad:'口',jawonElement:null},
      {ch:'鄕',meaning:'시골',strokes:17,pilhoek:12,rad:'邑',jawonElement:'토'},
      {ch:'享',meaning:'드릴',strokes:8,pilhoek:8,rad:'亠',jawonElement:null},
      {ch:'響',meaning:'소리 마주칠',strokes:22,pilhoek:20,rad:'音',jawonElement:'금'},
      {ch:'饗',meaning:'잔치할',strokes:22,pilhoek:20,rad:'食',jawonElement:'수'},
      {ch:'嚮',meaning:'향할',strokes:19,pilhoek:17,rad:'口',jawonElement:null},
      {ch:'餉',meaning:'먹일',strokes:15,pilhoek:14,rad:'食',jawonElement:'수'}
    ],
    '헌': [
      {ch:'憲',meaning:'법',strokes:16,pilhoek:16,rad:'心',jawonElement:'화'},
      {ch:'獻',meaning:'바칠',strokes:20,pilhoek:20,rad:'犬',jawonElement:null},
      {ch:'軒',meaning:'껄껄 웃을',strokes:10,pilhoek:10,rad:'車',jawonElement:'화'},
      {ch:'櫶',meaning:'나무이름',strokes:20,pilhoek:20,rad:'木',jawonElement:'목'}
    ],
    '혁': [
      {ch:'赫',meaning:'불 이글이글할',strokes:14,pilhoek:14,rad:'赤',jawonElement:'화'},
      {ch:'爀',meaning:'불빛',strokes:18,pilhoek:18,rad:'火',jawonElement:'화'},
      {ch:'奕',meaning:'아름다울',strokes:9,pilhoek:9,rad:'大',jawonElement:null},
      {ch:'革',meaning:'가죽',strokes:9,pilhoek:9,rad:'革',jawonElement:'금'}
    ],
    '현': [
      {ch:'賢',meaning:'어질',strokes:15,pilhoek:15,rad:'貝',jawonElement:'금'},
      {ch:'顯',meaning:'나타날',strokes:23,pilhoek:23,rad:'頁',jawonElement:'화'},
      {ch:'玄',meaning:'검을',strokes:5,pilhoek:5,rad:'玄',jawonElement:'수'},
      {ch:'鉉',meaning:'솥귀',strokes:13,pilhoek:13,rad:'金',jawonElement:'금'},
      {ch:'炫',meaning:'밝을',strokes:9,pilhoek:9,rad:'火',jawonElement:'화'},
      {ch:'見',meaning:'나타날',strokes:7,pilhoek:7,rad:'見',jawonElement:'화'},
      {ch:'現',meaning:'나타날',strokes:12,pilhoek:11,rad:'玉',jawonElement:'금'},
      {ch:'縣',meaning:'매달릴',strokes:16,pilhoek:16,rad:'糸',jawonElement:'목'}
    ],
    '형': [
      {ch:'亨',meaning:'형통할',strokes:7,pilhoek:7,rad:'亠',jawonElement:null},
      {ch:'炯',meaning:'빛날',strokes:9,pilhoek:9,rad:'火',jawonElement:'화'},
      {ch:'邢',meaning:'나라 이름',strokes:13,pilhoek:6,rad:'邑',jawonElement:'토'},
      {ch:'瀅',meaning:'맑을',strokes:19,pilhoek:18,rad:'水',jawonElement:'수'},
      {ch:'瑩',meaning:'밝을',strokes:15,pilhoek:15,rad:'玉',jawonElement:'금'},
      {ch:'兄',meaning:'맏이',strokes:5,pilhoek:5,rad:'儿',jawonElement:null},
      {ch:'形',meaning:'모양',strokes:7,pilhoek:7,rad:'彡',jawonElement:null},
      {ch:'螢',meaning:'반딧불',strokes:16,pilhoek:16,rad:'虫',jawonElement:'수'}
    ],
    '혜': [
      {ch:'惠',meaning:'은혜',strokes:12,pilhoek:12,rad:'心',jawonElement:'화'},
      {ch:'慧',meaning:'슬기로울',strokes:15,pilhoek:15,rad:'心',jawonElement:'화'},
      {ch:'兮',meaning:'어조사',strokes:4,pilhoek:4,rad:'八',jawonElement:null},
      {ch:'醯',meaning:'위대로울',strokes:19,pilhoek:19,rad:'酉',jawonElement:null},
      {ch:'鞋',meaning:'가죽신',strokes:15,pilhoek:15,rad:'革',jawonElement:'금'},
      {ch:'蹊',meaning:'지름길',strokes:17,pilhoek:17,rad:'足',jawonElement:'토'},
      {ch:'蕙',meaning:'혜초',strokes:18,pilhoek:15,rad:'艸',jawonElement:'목'},
      {ch:'暳',meaning:'잔별',strokes:15,pilhoek:15,rad:'日',jawonElement:null}
    ],
    '호': [
      {ch:'好',meaning:'좋을',strokes:6,pilhoek:6,rad:'女',jawonElement:'토'},
      {ch:'湖',meaning:'호수',strokes:13,pilhoek:12,rad:'水',jawonElement:'수'},
      {ch:'浩',meaning:'클',strokes:11,pilhoek:10,rad:'水',jawonElement:'수'},
      {ch:'鎬',meaning:'호경',strokes:18,pilhoek:18,rad:'金',jawonElement:'금'},
      {ch:'皓',meaning:'흴',strokes:12,pilhoek:12,rad:'白',jawonElement:null},
      {ch:'昊',meaning:'하늘',strokes:8,pilhoek:8,rad:'日',jawonElement:null},
      {ch:'澔',meaning:'채색빛날',strokes:16,pilhoek:15,rad:'水',jawonElement:'수'},
      {ch:'瑚',meaning:'산호',strokes:14,pilhoek:13,rad:'玉',jawonElement:'금'}
    ],
    '화': [
      {ch:'和',meaning:'화할',strokes:8,pilhoek:8,rad:'口',jawonElement:null},
      {ch:'華',meaning:'꽃',strokes:14,pilhoek:10,rad:'艸',jawonElement:'목'},
      {ch:'火',meaning:'불',strokes:4,pilhoek:4,rad:'火',jawonElement:'화'},
      {ch:'花',meaning:'꽃',strokes:10,pilhoek:7,rad:'艸',jawonElement:'목'},
      {ch:'化',meaning:'될',strokes:4,pilhoek:4,rad:'匕',jawonElement:null},
      {ch:'話',meaning:'말할',strokes:13,pilhoek:13,rad:'言',jawonElement:'금'},
      {ch:'畵',meaning:'그림',strokes:13,pilhoek:13,rad:'田',jawonElement:null},
      {ch:'貨',meaning:'재화',strokes:11,pilhoek:11,rad:'貝',jawonElement:'금'}
    ],
    '환': [
      {ch:'環',meaning:'고리',strokes:18,pilhoek:17,rad:'玉',jawonElement:'금'},
      {ch:'煥',meaning:'불꽃',strokes:13,pilhoek:13,rad:'火',jawonElement:'화'},
      {ch:'桓',meaning:'굳셀',strokes:10,pilhoek:10,rad:'木',jawonElement:'목'},
      {ch:'歡',meaning:'기뻐할',strokes:22,pilhoek:21,rad:'欠',jawonElement:null},
      {ch:'還',meaning:'돌아올',strokes:20,pilhoek:16,rad:'辵',jawonElement:'토'},
      {ch:'換',meaning:'바꿀',strokes:13,pilhoek:12,rad:'手',jawonElement:'목'},
      {ch:'丸',meaning:'둥글',strokes:3,pilhoek:3,rad:'丶',jawonElement:null},
      {ch:'喚',meaning:'부를',strokes:12,pilhoek:12,rad:'口',jawonElement:null}
    ],
    '회': [
      {ch:'會',meaning:'모일',strokes:13,pilhoek:13,rad:'曰',jawonElement:null},
      {ch:'回',meaning:'돌',strokes:6,pilhoek:6,rad:'囗',jawonElement:null},
      {ch:'懷',meaning:'품을',strokes:20,pilhoek:19,rad:'心',jawonElement:'화'},
      {ch:'淮',meaning:'강 이름',strokes:12,pilhoek:11,rad:'水',jawonElement:'수'},
      {ch:'恢',meaning:'넓을',strokes:10,pilhoek:9,rad:'心',jawonElement:'화'},
      {ch:'廻',meaning:'돌',strokes:9,pilhoek:8,rad:'廴',jawonElement:null},
      {ch:'檜',meaning:'노송나무',strokes:17,pilhoek:17,rad:'木',jawonElement:'목'},
      {ch:'膾',meaning:'회',strokes:19,pilhoek:17,rad:'肉',jawonElement:null}
    ],
    '효': [
      {ch:'孝',meaning:'효도',strokes:7,pilhoek:7,rad:'子',jawonElement:'수'},
      {ch:'曉',meaning:'새벽',strokes:16,pilhoek:16,rad:'日',jawonElement:null},
      {ch:'效',meaning:'본받을',strokes:10,pilhoek:10,rad:'攴',jawonElement:'금'},
      {ch:'酵',meaning:'술괼',strokes:14,pilhoek:14,rad:'酉',jawonElement:null},
      {ch:'爻',meaning:'괘이름',strokes:4,pilhoek:4,rad:'爻',jawonElement:null},
      {ch:'嚆',meaning:'부르짖을',strokes:17,pilhoek:16,rad:'口',jawonElement:null},
      {ch:'梟',meaning:'올빼미',strokes:11,pilhoek:11,rad:'木',jawonElement:'목'},
      {ch:'淆',meaning:'흙탕칠',strokes:12,pilhoek:11,rad:'水',jawonElement:'수'}
    ],
    '훈': [
      {ch:'訓',meaning:'가르칠',strokes:10,pilhoek:10,rad:'言',jawonElement:'금'},
      {ch:'熏',meaning:'연기 낄',strokes:14,pilhoek:14,rad:'火',jawonElement:'화'},
      {ch:'勳',meaning:'공',strokes:16,pilhoek:16,rad:'力',jawonElement:null},
      {ch:'薰',meaning:'향불',strokes:20,pilhoek:17,rad:'艸',jawonElement:'목'},
      {ch:'暈',meaning:'무리',strokes:13,pilhoek:13,rad:'日',jawonElement:null},
      {ch:'勛',meaning:'공적',strokes:12,pilhoek:12,rad:'力',jawonElement:null},
      {ch:'焄',meaning:'향내',strokes:11,pilhoek:11,rad:'火',jawonElement:'화'},
      {ch:'燻',meaning:'연기 낄',strokes:18,pilhoek:18,rad:'火',jawonElement:'화'}
    ],
    '휘': [
      {ch:'輝',meaning:'빛날',strokes:15,pilhoek:15,rad:'車',jawonElement:'화'},
      {ch:'徽',meaning:'아름다울',strokes:17,pilhoek:17,rad:'彳',jawonElement:'화'},
      {ch:'暉',meaning:'빛',strokes:13,pilhoek:13,rad:'日',jawonElement:null},
      {ch:'揮',meaning:'휘두를',strokes:13,pilhoek:12,rad:'手',jawonElement:'목'},
      {ch:'諱',meaning:'피할',strokes:16,pilhoek:16,rad:'言',jawonElement:'금'},
      {ch:'彙',meaning:'무리',strokes:13,pilhoek:13,rad:'彐',jawonElement:null},
      {ch:'煇',meaning:'빛날',strokes:13,pilhoek:13,rad:'火',jawonElement:'화'}
    ],
    '흠': [
      {ch:'欽',meaning:'공경할',strokes:12,pilhoek:12,rad:'欠',jawonElement:null},
      {ch:'歆',meaning:'받을',strokes:13,pilhoek:13,rad:'欠',jawonElement:null}
    ],
    '희': [
      {ch:'喜',meaning:'기뻐할',strokes:12,pilhoek:12,rad:'口',jawonElement:null},
      {ch:'嬉',meaning:'즐길',strokes:15,pilhoek:15,rad:'女',jawonElement:'토'},
      {ch:'熙',meaning:'빛날',strokes:14,pilhoek:14,rad:'火',jawonElement:'화'},
      {ch:'熹',meaning:'성할',strokes:16,pilhoek:16,rad:'火',jawonElement:'화'},
      {ch:'希',meaning:'바랄',strokes:7,pilhoek:7,rad:'巾',jawonElement:'목'},
      {ch:'稀',meaning:'드물',strokes:12,pilhoek:12,rad:'禾',jawonElement:'목'},
      {ch:'羲',meaning:'복희',strokes:16,pilhoek:16,rad:'羊',jawonElement:'토'},
      {ch:'禧',meaning:'복',strokes:17,pilhoek:16,rad:'示',jawonElement:null}
    ],
    '김': [
      {ch:'金',meaning:'사람의 성',strokes:8,pilhoek:8,rad:'金',jawonElement:'금'}
    ],
    '박': [
      {ch:'朴',meaning:'질박할',strokes:6,pilhoek:6,rad:'木',jawonElement:'목'},
      {ch:'迫',meaning:'닥칠',strokes:12,pilhoek:8,rad:'辵',jawonElement:'토'},
      {ch:'博',meaning:'넓을',strokes:12,pilhoek:12,rad:'十',jawonElement:null},
      {ch:'泊',meaning:'머무를',strokes:9,pilhoek:8,rad:'水',jawonElement:'수'},
      {ch:'拍',meaning:'칠',strokes:9,pilhoek:8,rad:'手',jawonElement:'목'},
      {ch:'薄',meaning:'숲',strokes:19,pilhoek:16,rad:'艸',jawonElement:'목'},
      {ch:'駁',meaning:'얼룩말',strokes:14,pilhoek:14,rad:'馬',jawonElement:'화'},
      {ch:'舶',meaning:'큰배',strokes:11,pilhoek:11,rad:'舟',jawonElement:'목'}
    ],
    '권': [
      {ch:'權',meaning:'권세',strokes:22,pilhoek:21,rad:'木',jawonElement:'목'},
      {ch:'卷',meaning:'책',strokes:8,pilhoek:8,rad:'卩',jawonElement:null},
      {ch:'勸',meaning:'권할',strokes:20,pilhoek:19,rad:'力',jawonElement:null},
      {ch:'券',meaning:'엄쪽',strokes:8,pilhoek:8,rad:'刀',jawonElement:'금'},
      {ch:'拳',meaning:'주먹',strokes:10,pilhoek:10,rad:'手',jawonElement:'목'},
      {ch:'圈',meaning:'둥글',strokes:11,pilhoek:11,rad:'囗',jawonElement:null},
      {ch:'眷',meaning:'돌아볼',strokes:11,pilhoek:11,rad:'目',jawonElement:'목'},
      {ch:'捲',meaning:'거둘',strokes:12,pilhoek:11,rad:'手',jawonElement:'목'}
    ],
    '황': [
      {ch:'黃',meaning:'누를',strokes:12,pilhoek:12,rad:'黃',jawonElement:'토'},
      {ch:'皇',meaning:'임금',strokes:9,pilhoek:9,rad:'白',jawonElement:null},
      {ch:'況',meaning:'하물며',strokes:9,pilhoek:8,rad:'水',jawonElement:'수'},
      {ch:'荒',meaning:'거칠',strokes:12,pilhoek:9,rad:'艸',jawonElement:'목'},
      {ch:'滉',meaning:'물 깊고 넓을',strokes:14,pilhoek:13,rad:'水',jawonElement:'수'},
      {ch:'慌',meaning:'어렴풋할',strokes:14,pilhoek:12,rad:'心',jawonElement:'화'},
      {ch:'徨',meaning:'노닐',strokes:12,pilhoek:12,rad:'彳',jawonElement:'화'},
      {ch:'晃',meaning:'밝을',strokes:10,pilhoek:10,rad:'日',jawonElement:null}
    ],
    '송': [
      {ch:'宋',meaning:'송나라',strokes:7,pilhoek:7,rad:'宀',jawonElement:null},
      {ch:'送',meaning:'보낼',strokes:13,pilhoek:9,rad:'辵',jawonElement:'토'},
      {ch:'松',meaning:'소나무',strokes:8,pilhoek:8,rad:'木',jawonElement:'목'},
      {ch:'訟',meaning:'송사할',strokes:11,pilhoek:11,rad:'言',jawonElement:'금'},
      {ch:'誦',meaning:'풍유할',strokes:14,pilhoek:14,rad:'言',jawonElement:'금'},
      {ch:'頌',meaning:'기릴',strokes:13,pilhoek:13,rad:'頁',jawonElement:'화'},
      {ch:'悚',meaning:'송구할',strokes:11,pilhoek:10,rad:'心',jawonElement:'화'},
      {ch:'淞',meaning:'강이름',strokes:12,pilhoek:11,rad:'水',jawonElement:'수'}
    ],
    '전': [
      {ch:'田',meaning:'밭',strokes:5,pilhoek:5,rad:'田',jawonElement:null},
      {ch:'全',meaning:'온전할',strokes:6,pilhoek:6,rad:'入',jawonElement:null},
      {ch:'前',meaning:'앞',strokes:9,pilhoek:9,rad:'刀',jawonElement:'금'},
      {ch:'電',meaning:'번개',strokes:13,pilhoek:13,rad:'雨',jawonElement:'수'},
      {ch:'戰',meaning:'싸움',strokes:16,pilhoek:16,rad:'戈',jawonElement:null},
      {ch:'展',meaning:'펼칠',strokes:10,pilhoek:10,rad:'尸',jawonElement:null},
      {ch:'傳',meaning:'전할',strokes:13,pilhoek:13,rad:'人',jawonElement:'화'},
      {ch:'典',meaning:'책',strokes:8,pilhoek:8,rad:'八',jawonElement:null}
    ],
    '홍': [
      {ch:'洪',meaning:'큰물',strokes:10,pilhoek:9,rad:'水',jawonElement:'수'},
      {ch:'紅',meaning:'붉을',strokes:9,pilhoek:9,rad:'糸',jawonElement:'목'},
      {ch:'弘',meaning:'넓을',strokes:5,pilhoek:5,rad:'弓',jawonElement:null},
      {ch:'泓',meaning:'깊을',strokes:9,pilhoek:8,rad:'水',jawonElement:'수'},
      {ch:'虹',meaning:'무지개',strokes:9,pilhoek:9,rad:'虫',jawonElement:'수'},
      {ch:'哄',meaning:'떠들썩할',strokes:9,pilhoek:9,rad:'口',jawonElement:null},
      {ch:'烘',meaning:'횃불',strokes:10,pilhoek:10,rad:'火',jawonElement:'화'},
      {ch:'汞',meaning:'수은',strokes:7,pilhoek:7,rad:'水',jawonElement:'수'}
    ],
    '고': [
      {ch:'高',meaning:'높을',strokes:10,pilhoek:10,rad:'高',jawonElement:'화'},
      {ch:'賈',meaning:'장사',strokes:13,pilhoek:13,rad:'貝',jawonElement:'금'},
      {ch:'古',meaning:'옛',strokes:5,pilhoek:5,rad:'口',jawonElement:null},
      {ch:'告',meaning:'알릴',strokes:7,pilhoek:7,rad:'口',jawonElement:null},
      {ch:'苦',meaning:'쓸',strokes:11,pilhoek:8,rad:'艸',jawonElement:'목'},
      {ch:'固',meaning:'굳을',strokes:8,pilhoek:8,rad:'囗',jawonElement:null},
      {ch:'故',meaning:'옛',strokes:9,pilhoek:9,rad:'攴',jawonElement:'금'},
      {ch:'考',meaning:'상고할',strokes:8,pilhoek:6,rad:'老',jawonElement:'토'}
    ],
    '손': [
      {ch:'孫',meaning:'손자',strokes:10,pilhoek:10,rad:'子',jawonElement:'수'},
      {ch:'損',meaning:'덜',strokes:14,pilhoek:13,rad:'手',jawonElement:'목'},
      {ch:'遜',meaning:'순할',strokes:17,pilhoek:13,rad:'辵',jawonElement:'토'},
      {ch:'巽',meaning:'사양할',strokes:12,pilhoek:12,rad:'己',jawonElement:null},
      {ch:'飡',meaning:'삼킬',strokes:11,pilhoek:11,rad:'食',jawonElement:'수'},
      {ch:'蓀',meaning:'난초',strokes:16,pilhoek:13,rad:'艸',jawonElement:'목'}
    ],
    '양': [
      {ch:'梁',meaning:'들보',strokes:11,pilhoek:11,rad:'木',jawonElement:'목'},
      {ch:'楊',meaning:'갯버들',strokes:13,pilhoek:13,rad:'木',jawonElement:'목'},
      {ch:'羊',meaning:'양',strokes:6,pilhoek:6,rad:'羊',jawonElement:'토'},
      {ch:'兩',meaning:'두',strokes:8,pilhoek:8,rad:'入',jawonElement:null},
      {ch:'陽',meaning:'볕',strokes:17,pilhoek:11,rad:'阜',jawonElement:'토'},
      {ch:'洋',meaning:'큰 바다',strokes:10,pilhoek:9,rad:'水',jawonElement:'수'},
      {ch:'良',meaning:'어질',strokes:7,pilhoek:7,rad:'艮',jawonElement:'토'},
      {ch:'養',meaning:'기를',strokes:15,pilhoek:14,rad:'食',jawonElement:'수'}
    ],
    '배': [
      {ch:'裵',meaning:'성',strokes:14,pilhoek:14,rad:'衣',jawonElement:'목'},
      {ch:'北',meaning:'달아날',strokes:5,pilhoek:5,rad:'匕',jawonElement:null},
      {ch:'拜',meaning:'절',strokes:9,pilhoek:9,rad:'手',jawonElement:'목'},
      {ch:'杯',meaning:'잔',strokes:8,pilhoek:8,rad:'木',jawonElement:'목'},
      {ch:'輩',meaning:'무리',strokes:15,pilhoek:15,rad:'車',jawonElement:'화'},
      {ch:'背',meaning:'등',strokes:11,pilhoek:9,rad:'肉',jawonElement:null},
      {ch:'配',meaning:'아내',strokes:10,pilhoek:10,rad:'酉',jawonElement:null},
      {ch:'倍',meaning:'곱',strokes:10,pilhoek:10,rad:'人',jawonElement:'화'}
    ],
    '백': [
      {ch:'白',meaning:'흰',strokes:5,pilhoek:5,rad:'白',jawonElement:null},
      {ch:'百',meaning:'일백',strokes:6,pilhoek:6,rad:'白',jawonElement:null},
      {ch:'伯',meaning:'맏',strokes:7,pilhoek:7,rad:'人',jawonElement:'화'},
      {ch:'栢',meaning:'잣나무',strokes:10,pilhoek:10,rad:'木',jawonElement:'목'},
      {ch:'帛',meaning:'비단',strokes:8,pilhoek:8,rad:'巾',jawonElement:'목'},
      {ch:'魄',meaning:'넋',strokes:15,pilhoek:14,rad:'鬼',jawonElement:'화'},
      {ch:'柏',meaning:'나무 이름',strokes:9,pilhoek:9,rad:'木',jawonElement:'목'},
      {ch:'佰',meaning:'백사람의어른',strokes:8,pilhoek:8,rad:'人',jawonElement:'화'}
    ],
    '허': [
      {ch:'許',meaning:'허락할',strokes:11,pilhoek:11,rad:'言',jawonElement:'금'},
      {ch:'虛',meaning:'빌',strokes:12,pilhoek:12,rad:'虍',jawonElement:null},
      {ch:'墟',meaning:'옛 터',strokes:15,pilhoek:14,rad:'土',jawonElement:'토'},
      {ch:'噓',meaning:'불',strokes:15,pilhoek:15,rad:'口',jawonElement:null}
    ],
    '심': [
      {ch:'沈',meaning:'성',strokes:8,pilhoek:7,rad:'水',jawonElement:'수'},
      {ch:'心',meaning:'마음',strokes:4,pilhoek:4,rad:'心',jawonElement:'화'},
      {ch:'甚',meaning:'심할',strokes:9,pilhoek:9,rad:'甘',jawonElement:'토'},
      {ch:'深',meaning:'깊을',strokes:12,pilhoek:11,rad:'水',jawonElement:'수'},
      {ch:'尋',meaning:'찾을',strokes:12,pilhoek:12,rad:'寸',jawonElement:null},
      {ch:'審',meaning:'살필',strokes:15,pilhoek:15,rad:'宀',jawonElement:null},
      {ch:'瀋',meaning:'즙낼',strokes:19,pilhoek:18,rad:'水',jawonElement:'수'},
      {ch:'沁',meaning:'스며들',strokes:8,pilhoek:7,rad:'水',jawonElement:'수'}
    ],
    '곽': [
      {ch:'郭',meaning:'성곽',strokes:15,pilhoek:10,rad:'邑',jawonElement:'토'},
      {ch:'廓',meaning:'둘레',strokes:14,pilhoek:13,rad:'广',jawonElement:'목'},
      {ch:'槨',meaning:'덧널',strokes:15,pilhoek:14,rad:'木',jawonElement:'목'},
      {ch:'藿',meaning:'콩잎',strokes:22,pilhoek:19,rad:'艸',jawonElement:'목'}
    ],
    '차': [
      {ch:'車',meaning:'수레',strokes:7,pilhoek:7,rad:'車',jawonElement:'화'},
      {ch:'次',meaning:'버금',strokes:6,pilhoek:6,rad:'欠',jawonElement:null},
      {ch:'此',meaning:'이',strokes:6,pilhoek:6,rad:'止',jawonElement:'토'},
      {ch:'借',meaning:'빌',strokes:10,pilhoek:10,rad:'人',jawonElement:'화'},
      {ch:'差',meaning:'어길',strokes:10,pilhoek:9,rad:'工',jawonElement:'화'},
      {ch:'茶',meaning:'차',strokes:12,pilhoek:9,rad:'艸',jawonElement:'목'},
      {ch:'叉',meaning:'깍지낄',strokes:3,pilhoek:3,rad:'又',jawonElement:null},
      {ch:'遮',meaning:'막을',strokes:18,pilhoek:14,rad:'辵',jawonElement:'토'}
    ],
    '구': [
      {ch:'具',meaning:'갖출',strokes:8,pilhoek:8,rad:'八',jawonElement:null},
      {ch:'九',meaning:'아홉',strokes:9,pilhoek:2,rad:null,jawonElement:null},
      {ch:'口',meaning:'입',strokes:3,pilhoek:3,rad:'口',jawonElement:null},
      {ch:'求',meaning:'찾을',strokes:6,pilhoek:7,rad:'水',jawonElement:'수'},
      {ch:'句',meaning:'글귀절',strokes:5,pilhoek:5,rad:'口',jawonElement:null},
      {ch:'救',meaning:'구원할',strokes:11,pilhoek:11,rad:'攴',jawonElement:'금'},
      {ch:'究',meaning:'궁리할',strokes:7,pilhoek:7,rad:'穴',jawonElement:'수'},
      {ch:'久',meaning:'오랠',strokes:3,pilhoek:3,rad:'丿',jawonElement:null}
    ],
    '엄': [
      {ch:'嚴',meaning:'굳셀',strokes:20,pilhoek:19,rad:'口',jawonElement:null},
      {ch:'掩',meaning:'거둘',strokes:12,pilhoek:11,rad:'手',jawonElement:'목'},
      {ch:'奄',meaning:'문득',strokes:8,pilhoek:8,rad:'大',jawonElement:null},
      {ch:'儼',meaning:'공경할',strokes:22,pilhoek:21,rad:'人',jawonElement:'화'},
      {ch:'俺',meaning:'자기',strokes:10,pilhoek:10,rad:'人',jawonElement:'화'},
      {ch:'淹',meaning:'담글',strokes:12,pilhoek:11,rad:'水',jawonElement:'수'}
    ],
    '방': [
      {ch:'方',meaning:'모',strokes:4,pilhoek:4,rad:'方',jawonElement:null},
      {ch:'防',meaning:'둑',strokes:12,pilhoek:6,rad:'阜',jawonElement:'토'},
      {ch:'房',meaning:'방',strokes:8,pilhoek:8,rad:'戶',jawonElement:'목'},
      {ch:'訪',meaning:'찾을',strokes:11,pilhoek:11,rad:'言',jawonElement:'금'},
      {ch:'邦',meaning:'나라',strokes:11,pilhoek:6,rad:'邑',jawonElement:'토'},
      {ch:'妨',meaning:'거리낄',strokes:7,pilhoek:7,rad:'女',jawonElement:'토'},
      {ch:'芳',meaning:'꽃다울',strokes:10,pilhoek:7,rad:'艸',jawonElement:'목'},
      {ch:'傍',meaning:'곁',strokes:12,pilhoek:12,rad:'人',jawonElement:'화'}
    ],
    '공': [
      {ch:'孔',meaning:'구멍',strokes:4,pilhoek:4,rad:'子',jawonElement:'수'},
      {ch:'工',meaning:'장인',strokes:3,pilhoek:3,rad:'工',jawonElement:'화'},
      {ch:'公',meaning:'공변될',strokes:4,pilhoek:4,rad:'八',jawonElement:null},
      {ch:'功',meaning:'공',strokes:5,pilhoek:5,rad:'力',jawonElement:null},
      {ch:'空',meaning:'빌',strokes:8,pilhoek:8,rad:'穴',jawonElement:'수'},
      {ch:'共',meaning:'함께',strokes:6,pilhoek:6,rad:'八',jawonElement:null},
      {ch:'恭',meaning:'공손할',strokes:10,pilhoek:10,rad:'心',jawonElement:'화'},
      {ch:'供',meaning:'이바지할',strokes:8,pilhoek:8,rad:'人',jawonElement:'화'}
    ],
    '함': [
      {ch:'咸',meaning:'모두',strokes:9,pilhoek:9,rad:'口',jawonElement:null},
      {ch:'含',meaning:'머금을',strokes:7,pilhoek:7,rad:'口',jawonElement:null},
      {ch:'函',meaning:'상자',strokes:8,pilhoek:8,rad:'凵',jawonElement:null},
      {ch:'艦',meaning:'싸움배',strokes:20,pilhoek:20,rad:'舟',jawonElement:'목'},
      {ch:'喊',meaning:'소리',strokes:12,pilhoek:12,rad:'口',jawonElement:null},
      {ch:'緘',meaning:'봉할',strokes:15,pilhoek:15,rad:'糸',jawonElement:'목'},
      {ch:'檻',meaning:'우리',strokes:18,pilhoek:18,rad:'木',jawonElement:'목'},
      {ch:'鹹',meaning:'짤',strokes:20,pilhoek:20,rad:'鹵',jawonElement:null}
    ],
    '변': [
      {ch:'卞',meaning:'성',strokes:4,pilhoek:4,rad:'卜',jawonElement:null},
      {ch:'便',meaning:'문득',strokes:9,pilhoek:9,rad:'人',jawonElement:'화'},
      {ch:'變',meaning:'변할',strokes:23,pilhoek:23,rad:'言',jawonElement:'금'},
      {ch:'邊',meaning:'가',strokes:22,pilhoek:18,rad:'辵',jawonElement:'토'},
      {ch:'辯',meaning:'말잘할',strokes:21,pilhoek:21,rad:'辛',jawonElement:'금'},
      {ch:'辨',meaning:'분별할',strokes:16,pilhoek:16,rad:'辛',jawonElement:'금'},
      {ch:'弁',meaning:'고깔',strokes:5,pilhoek:5,rad:'廾',jawonElement:null},
      {ch:'騈',meaning:'나란히 할',strokes:18,pilhoek:18,rad:'馬',jawonElement:'화'}
    ],
    '염': [
      {ch:'廉',meaning:'맑을',strokes:13,pilhoek:13,rad:'广',jawonElement:'목'},
      {ch:'念',meaning:'생각할',strokes:8,pilhoek:8,rad:'心',jawonElement:'화'},
      {ch:'炎',meaning:'불꽃',strokes:8,pilhoek:8,rad:'火',jawonElement:'화'},
      {ch:'鹽',meaning:'소금',strokes:24,pilhoek:24,rad:'鹵',jawonElement:null},
      {ch:'染',meaning:'꼭두서니',strokes:9,pilhoek:9,rad:'木',jawonElement:'목'},
      {ch:'厭',meaning:'넉넉할',strokes:14,pilhoek:14,rad:'厂',jawonElement:null},
      {ch:'閻',meaning:'마을',strokes:16,pilhoek:16,rad:'門',jawonElement:null},
      {ch:'焰',meaning:'불당길',strokes:12,pilhoek:12,rad:'火',jawonElement:'화'}
    ],
    '추': [
      {ch:'秋',meaning:'가을',strokes:9,pilhoek:9,rad:'禾',jawonElement:'목'},
      {ch:'推',meaning:'옮길',strokes:12,pilhoek:11,rad:'手',jawonElement:'목'},
      {ch:'丑',meaning:'수갑',strokes:4,pilhoek:4,rad:'一',jawonElement:null},
      {ch:'追',meaning:'따를',strokes:13,pilhoek:9,rad:'辵',jawonElement:'토'},
      {ch:'抽',meaning:'뺄',strokes:9,pilhoek:8,rad:'手',jawonElement:'목'},
      {ch:'醜',meaning:'추할',strokes:17,pilhoek:16,rad:'酉',jawonElement:null},
      {ch:'趨',meaning:'달아날',strokes:17,pilhoek:17,rad:'走',jawonElement:'화'},
      {ch:'鄒',meaning:'추나라',strokes:17,pilhoek:12,rad:'邑',jawonElement:'토'}
    ],
    '설': [
      {ch:'薛',meaning:'맑은대쑥',strokes:19,pilhoek:16,rad:'艸',jawonElement:'목'},
      {ch:'說',meaning:'말씀',strokes:14,pilhoek:14,rad:'言',jawonElement:'금'},
      {ch:'設',meaning:'베풀',strokes:11,pilhoek:11,rad:'言',jawonElement:'금'},
      {ch:'舌',meaning:'혀',strokes:6,pilhoek:6,rad:'舌',jawonElement:null},
      {ch:'泄',meaning:'샐',strokes:9,pilhoek:8,rad:'水',jawonElement:'수'},
      {ch:'卨',meaning:'사람이름',strokes:11,pilhoek:10,rad:'卜',jawonElement:null},
      {ch:'屑',meaning:'가루',strokes:10,pilhoek:10,rad:'尸',jawonElement:null},
      {ch:'洩',meaning:'샐',strokes:10,pilhoek:9,rad:'水',jawonElement:'수'}
    ],
    '마': [
      {ch:'馬',meaning:'말',strokes:10,pilhoek:10,rad:'馬',jawonElement:'화'},
      {ch:'麻',meaning:'삼',strokes:11,pilhoek:11,rad:'麻',jawonElement:'목'},
      {ch:'魔',meaning:'마귀',strokes:21,pilhoek:20,rad:'鬼',jawonElement:'화'},
      {ch:'痲',meaning:'저릴',strokes:13,pilhoek:13,rad:'疒',jawonElement:'수'},
      {ch:'瑪',meaning:'마노',strokes:15,pilhoek:14,rad:'玉',jawonElement:'금'},
      {ch:'碼',meaning:'마노',strokes:15,pilhoek:15,rad:'石',jawonElement:'금'}
    ],
    '길': [
      {ch:'吉',meaning:'길할',strokes:6,pilhoek:6,rad:'口',jawonElement:null},
      {ch:'拮',meaning:'일할',strokes:10,pilhoek:9,rad:'手',jawonElement:'목'},
      {ch:'佶',meaning:'건장할',strokes:8,pilhoek:8,rad:'人',jawonElement:'화'},
      {ch:'桔',meaning:'도라지',strokes:10,pilhoek:10,rad:'木',jawonElement:'목'}
    ],
    '위': [
      {ch:'魏',meaning:'위나라',strokes:18,pilhoek:17,rad:'鬼',jawonElement:'화'},
      {ch:'位',meaning:'벼슬',strokes:7,pilhoek:7,rad:'人',jawonElement:'화'},
      {ch:'危',meaning:'상할',strokes:6,pilhoek:6,rad:'卩',jawonElement:null},
      {ch:'爲',meaning:'할',strokes:12,pilhoek:12,rad:'爪',jawonElement:null},
      {ch:'威',meaning:'위엄',strokes:9,pilhoek:9,rad:'女',jawonElement:'토'},
      {ch:'偉',meaning:'클',strokes:11,pilhoek:11,rad:'人',jawonElement:'화'},
      {ch:'謂',meaning:'고할',strokes:16,pilhoek:16,rad:'言',jawonElement:'금'},
      {ch:'衛',meaning:'호위할',strokes:16,pilhoek:15,rad:'行',jawonElement:null}
    ],
    '반': [
      {ch:'潘',meaning:'뜨물',strokes:16,pilhoek:15,rad:'水',jawonElement:'수'},
      {ch:'半',meaning:'반',strokes:5,pilhoek:5,rad:'十',jawonElement:null},
      {ch:'反',meaning:'돌이킬',strokes:4,pilhoek:4,rad:'又',jawonElement:null},
      {ch:'飯',meaning:'밥',strokes:13,pilhoek:12,rad:'食',jawonElement:'수'},
      {ch:'班',meaning:'나눌',strokes:11,pilhoek:10,rad:'玉',jawonElement:'금'},
      {ch:'般',meaning:'옮길',strokes:10,pilhoek:10,rad:'舟',jawonElement:'목'},
      {ch:'返',meaning:'돌이킬',strokes:11,pilhoek:7,rad:'辵',jawonElement:'토'},
      {ch:'伴',meaning:'짝',strokes:7,pilhoek:7,rad:'人',jawonElement:'화'}
    ],
    '왕': [
      {ch:'往',meaning:'옛',strokes:8,pilhoek:8,rad:'彳',jawonElement:'화'},
      {ch:'旺',meaning:'고울',strokes:8,pilhoek:8,rad:'日',jawonElement:null},
      {ch:'汪',meaning:'물 출렁출렁할',strokes:8,pilhoek:7,rad:'水',jawonElement:'수'},
      {ch:'枉',meaning:'원통할',strokes:8,pilhoek:8,rad:'木',jawonElement:'목'}
    ],
    '육': [
      {ch:'陸',meaning:'뭍',strokes:16,pilhoek:10,rad:'阜',jawonElement:'토'},
      {ch:'六',meaning:'여섯',strokes:6,pilhoek:4,rad:null,jawonElement:null},
      {ch:'肉',meaning:'고기',strokes:6,pilhoek:6,rad:'肉',jawonElement:null},
      {ch:'育',meaning:'기를',strokes:10,pilhoek:8,rad:'肉',jawonElement:null},
      {ch:'戮',meaning:'육시할',strokes:15,pilhoek:15,rad:'戈',jawonElement:null},
      {ch:'堉',meaning:'기름진 땅',strokes:11,pilhoek:11,rad:'土',jawonElement:'토'},
      {ch:'毓',meaning:'기를',strokes:14,pilhoek:14,rad:'毋',jawonElement:null}
    ],
    '맹': [
      {ch:'孟',meaning:'맏',strokes:8,pilhoek:8,rad:'子',jawonElement:'수'},
      {ch:'盟',meaning:'맹세할',strokes:13,pilhoek:13,rad:'皿',jawonElement:null},
      {ch:'萌',meaning:'싹',strokes:14,pilhoek:11,rad:'艸',jawonElement:'목'},
      {ch:'氓',meaning:'백성',strokes:8,pilhoek:8,rad:'氏',jawonElement:'화'}
    ],
    '모': [
      {ch:'牟',meaning:'소 우는 소리',strokes:6,pilhoek:6,rad:'牛',jawonElement:'토'},
      {ch:'母',meaning:'어미',strokes:5,pilhoek:5,rad:'毋',jawonElement:null},
      {ch:'毛',meaning:'털',strokes:4,pilhoek:4,rad:'毛',jawonElement:'화'},
      {ch:'慕',meaning:'그리워할',strokes:15,pilhoek:14,rad:'心',jawonElement:'화'},
      {ch:'募',meaning:'모을',strokes:13,pilhoek:12,rad:'力',jawonElement:null},
      {ch:'模',meaning:'법',strokes:15,pilhoek:14,rad:'木',jawonElement:'목'},
      {ch:'某',meaning:'아무',strokes:9,pilhoek:9,rad:'木',jawonElement:'목'},
      {ch:'謀',meaning:'꾀할',strokes:16,pilhoek:16,rad:'言',jawonElement:'금'}
    ],
    '어': [
      {ch:'魚',meaning:'물고기',strokes:11,pilhoek:11,rad:'魚',jawonElement:'수'},
      {ch:'語',meaning:'말씀',strokes:14,pilhoek:14,rad:'言',jawonElement:'금'},
      {ch:'漁',meaning:'물고기 잡을',strokes:15,pilhoek:14,rad:'水',jawonElement:'수'},
      {ch:'於',meaning:'방향의 어조사',strokes:8,pilhoek:8,rad:'方',jawonElement:null},
      {ch:'御',meaning:'거느릴',strokes:11,pilhoek:12,rad:'彳',jawonElement:'화'},
      {ch:'禦',meaning:'막을',strokes:16,pilhoek:17,rad:'示',jawonElement:null},
      {ch:'圄',meaning:'옥',strokes:10,pilhoek:10,rad:'囗',jawonElement:null},
      {ch:'瘀',meaning:'어혈질',strokes:13,pilhoek:13,rad:'疒',jawonElement:'수'}
    ],
    '편': [
      {ch:'片',meaning:'조각',strokes:4,pilhoek:4,rad:'片',jawonElement:'목'},
      {ch:'便',meaning:'편할',strokes:9,pilhoek:9,rad:'人',jawonElement:'화'},
      {ch:'篇',meaning:'책',strokes:15,pilhoek:15,rad:'竹',jawonElement:'목'},
      {ch:'遍',meaning:'두루',strokes:16,pilhoek:12,rad:'辵',jawonElement:'토'},
      {ch:'偏',meaning:'무리',strokes:11,pilhoek:11,rad:'人',jawonElement:'화'},
      {ch:'編',meaning:'책편',strokes:15,pilhoek:15,rad:'糸',jawonElement:'목'},
      {ch:'扁',meaning:'특별할',strokes:9,pilhoek:9,rad:'戶',jawonElement:'목'},
      {ch:'鞭',meaning:'태장',strokes:18,pilhoek:18,rad:'革',jawonElement:'금'}
    ],
    '봉': [
      {ch:'奉',meaning:'받들',strokes:8,pilhoek:8,rad:'大',jawonElement:null},
      {ch:'逢',meaning:'만날',strokes:14,pilhoek:10,rad:'辵',jawonElement:'토'},
      {ch:'封',meaning:'봉할',strokes:9,pilhoek:9,rad:'寸',jawonElement:null},
      {ch:'鳳',meaning:'봉새',strokes:14,pilhoek:14,rad:'鳥',jawonElement:'화'},
      {ch:'峯',meaning:'봉우리',strokes:10,pilhoek:10,rad:'山',jawonElement:'토'},
      {ch:'蜂',meaning:'벌',strokes:13,pilhoek:13,rad:'虫',jawonElement:'수'},
      {ch:'蓬',meaning:'쑥',strokes:17,pilhoek:13,rad:'艸',jawonElement:'목'},
      {ch:'俸',meaning:'녹',strokes:10,pilhoek:10,rad:'人',jawonElement:'화'}
    ],
    '사': [
      {ch:'史',meaning:'역사',strokes:5,pilhoek:5,rad:'口',jawonElement:null},
      {ch:'四',meaning:'넉',strokes:4,pilhoek:5,rad:null,jawonElement:null},
      {ch:'事',meaning:'일',strokes:8,pilhoek:8,rad:'亅',jawonElement:null},
      {ch:'食',meaning:'밥 먹일',strokes:9,pilhoek:9,rad:'食',jawonElement:'수'},
      {ch:'士',meaning:'선비',strokes:3,pilhoek:3,rad:'士',jawonElement:null},
      {ch:'思',meaning:'생각할',strokes:9,pilhoek:9,rad:'心',jawonElement:'화'},
      {ch:'使',meaning:'하여금',strokes:8,pilhoek:8,rad:'人',jawonElement:'화'},
      {ch:'私',meaning:'사사',strokes:7,pilhoek:7,rad:'禾',jawonElement:'목'}
    ],
    '부': [
      {ch:'夫',meaning:'지아비',strokes:4,pilhoek:4,rad:'大',jawonElement:null},
      {ch:'父',meaning:'아비',strokes:4,pilhoek:4,rad:'父',jawonElement:'목'},
      {ch:'部',meaning:'거느릴',strokes:15,pilhoek:10,rad:'邑',jawonElement:'토'},
      {ch:'富',meaning:'가멸',strokes:12,pilhoek:12,rad:'宀',jawonElement:null},
      {ch:'復',meaning:'다시',strokes:12,pilhoek:12,rad:'彳',jawonElement:'화'},
      {ch:'婦',meaning:'며느리',strokes:11,pilhoek:11,rad:'女',jawonElement:'토'},
      {ch:'浮',meaning:'뜰',strokes:11,pilhoek:10,rad:'水',jawonElement:'수'},
      {ch:'扶',meaning:'도울',strokes:8,pilhoek:7,rad:'手',jawonElement:'목'}
    ],
    '목': [
      {ch:'睦',meaning:'화목할',strokes:13,pilhoek:13,rad:'目',jawonElement:'목'},
      {ch:'木',meaning:'나무',strokes:4,pilhoek:4,rad:'木',jawonElement:'목'},
      {ch:'牧',meaning:'칠',strokes:8,pilhoek:8,rad:'牛',jawonElement:'토'},
      {ch:'穆',meaning:'화목할',strokes:16,pilhoek:16,rad:'禾',jawonElement:'목'},
      {ch:'鶩',meaning:'집오리',strokes:20,pilhoek:20,rad:'鳥',jawonElement:'화'}
    ],
    '계': [
      {ch:'桂',meaning:'계수나무',strokes:10,pilhoek:10,rad:'木',jawonElement:'목'},
      {ch:'計',meaning:'꾀',strokes:9,pilhoek:9,rad:'言',jawonElement:'금'},
      {ch:'界',meaning:'지경',strokes:9,pilhoek:9,rad:'田',jawonElement:null},
      {ch:'癸',meaning:'열째 천간',strokes:9,pilhoek:9,rad:'癶',jawonElement:null},
      {ch:'溪',meaning:'시내',strokes:14,pilhoek:13,rad:'水',jawonElement:'수'},
      {ch:'季',meaning:'끝',strokes:8,pilhoek:8,rad:'子',jawonElement:'수'},
      {ch:'鷄',meaning:'닭',strokes:21,pilhoek:21,rad:'鳥',jawonElement:'화'},
      {ch:'啓',meaning:'열',strokes:11,pilhoek:11,rad:'口',jawonElement:null}
    ],
    '음': [
      {ch:'陰',meaning:'음기',strokes:16,pilhoek:10,rad:'阜',jawonElement:'토'},
      {ch:'音',meaning:'소리',strokes:9,pilhoek:9,rad:'音',jawonElement:'금'},
      {ch:'飮',meaning:'마실',strokes:13,pilhoek:13,rad:'食',jawonElement:'수'},
      {ch:'吟',meaning:'읊을',strokes:7,pilhoek:7,rad:'口',jawonElement:null},
      {ch:'淫',meaning:'방탕할',strokes:12,pilhoek:11,rad:'水',jawonElement:'수'},
      {ch:'蔭',meaning:'덮을',strokes:17,pilhoek:13,rad:'艸',jawonElement:'목'}
    ],
    '빈': [
      {ch:'賓',meaning:'손',strokes:14,pilhoek:14,rad:'貝',jawonElement:'금'},
      {ch:'頻',meaning:'자주',strokes:16,pilhoek:16,rad:'頁',jawonElement:'화'},
      {ch:'彬',meaning:'빛날',strokes:11,pilhoek:11,rad:'彡',jawonElement:null},
      {ch:'嬪',meaning:'아내',strokes:17,pilhoek:17,rad:'女',jawonElement:'토'},
      {ch:'殯',meaning:'염할',strokes:18,pilhoek:18,rad:'歹',jawonElement:'수'},
      {ch:'濱',meaning:'물가',strokes:18,pilhoek:17,rad:'水',jawonElement:'수'},
      {ch:'嚬',meaning:'찡그릴',strokes:19,pilhoek:19,rad:'口',jawonElement:null},
      {ch:'瀕',meaning:'물가',strokes:20,pilhoek:19,rad:'水',jawonElement:'수'}
    ],
    '금': [
      {ch:'金',meaning:'성',strokes:8,pilhoek:8,rad:'金',jawonElement:'금'},
      {ch:'琴',meaning:'거문고',strokes:13,pilhoek:12,rad:'玉',jawonElement:'금'},
      {ch:'今',meaning:'이제',strokes:4,pilhoek:4,rad:'人',jawonElement:'화'},
      {ch:'錦',meaning:'비단',strokes:16,pilhoek:16,rad:'金',jawonElement:'금'},
      {ch:'禽',meaning:'날짐승',strokes:13,pilhoek:12,rad:'禸',jawonElement:null},
      {ch:'襟',meaning:'옷깃',strokes:19,pilhoek:18,rad:'衣',jawonElement:'목'},
      {ch:'衾',meaning:'이불',strokes:10,pilhoek:10,rad:'衣',jawonElement:'목'},
      {ch:'衿',meaning:'옷깃',strokes:10,pilhoek:9,rad:'衣',jawonElement:'목'}
    ],
    '국': [
      {ch:'國',meaning:'나라',strokes:11,pilhoek:11,rad:'囗',jawonElement:null},
      {ch:'局',meaning:'부분',strokes:7,pilhoek:7,rad:'尸',jawonElement:null},
      {ch:'菊',meaning:'국화',strokes:14,pilhoek:11,rad:'艸',jawonElement:'목'},
      {ch:'鞠',meaning:'기를',strokes:17,pilhoek:17,rad:'革',jawonElement:'금'},
      {ch:'鞫',meaning:'문초받을',strokes:18,pilhoek:18,rad:'革',jawonElement:'금'},
      {ch:'麴',meaning:'누룩',strokes:19,pilhoek:19,rad:'麥',jawonElement:'목'}
    ],
    '궁': [
      {ch:'弓',meaning:'활',strokes:3,pilhoek:3,rad:'弓',jawonElement:null},
      {ch:'宮',meaning:'굴궐',strokes:10,pilhoek:10,rad:'宀',jawonElement:null},
      {ch:'窮',meaning:'다할',strokes:15,pilhoek:15,rad:'穴',jawonElement:'수'},
      {ch:'躬',meaning:'몸',strokes:10,pilhoek:10,rad:'身',jawonElement:null},
      {ch:'穹',meaning:'높을',strokes:8,pilhoek:8,rad:'穴',jawonElement:'수'},
      {ch:'芎',meaning:'궁궁이',strokes:9,pilhoek:6,rad:'艸',jawonElement:'목'}
    ],
    '려': [
      {ch:'呂',meaning:'음률',strokes:7,pilhoek:7,rad:'口',jawonElement:null},
      {ch:'旅',meaning:'군사',strokes:10,pilhoek:10,rad:'方',jawonElement:null},
      {ch:'慮',meaning:'생각할',strokes:15,pilhoek:15,rad:'心',jawonElement:'화'},
      {ch:'麗',meaning:'고울',strokes:19,pilhoek:19,rad:'鹿',jawonElement:'토'},
      {ch:'勵',meaning:'힘쓸',strokes:17,pilhoek:16,rad:'力',jawonElement:null},
      {ch:'廬',meaning:'오두막집',strokes:19,pilhoek:19,rad:'广',jawonElement:'목'},
      {ch:'礪',meaning:'거친 숫돌',strokes:20,pilhoek:19,rad:'石',jawonElement:'금'},
      {ch:'驪',meaning:'가라말',strokes:29,pilhoek:29,rad:'馬',jawonElement:'화'}
    ],
    '로': [
      {ch:'盧',meaning:'밥그릇',strokes:16,pilhoek:16,rad:'皿',jawonElement:null},
      {ch:'老',meaning:'늙은이',strokes:6,pilhoek:6,rad:'老',jawonElement:'토'},
      {ch:'路',meaning:'길',strokes:13,pilhoek:13,rad:'足',jawonElement:'토'},
      {ch:'勞',meaning:'일할',strokes:12,pilhoek:12,rad:'力',jawonElement:null},
      {ch:'怒',meaning:'성냉',strokes:9,pilhoek:9,rad:'心',jawonElement:'화'},
      {ch:'爐',meaning:'화초',strokes:20,pilhoek:20,rad:'火',jawonElement:'화'},
      {ch:'撈',meaning:'잡을',strokes:16,pilhoek:15,rad:'手',jawonElement:'목'},
      {ch:'輅',meaning:'수레',strokes:13,pilhoek:13,rad:'車',jawonElement:'화'}
    ],
    '류': [
      {ch:'柳',meaning:'버들',strokes:9,pilhoek:9,rad:'木',jawonElement:'목'},
      {ch:'流',meaning:'흐를',strokes:10,pilhoek:10,rad:'水',jawonElement:'수'},
      {ch:'留',meaning:'머무를',strokes:10,pilhoek:10,rad:'田',jawonElement:null},
      {ch:'類',meaning:'무리',strokes:19,pilhoek:19,rad:'頁',jawonElement:'화'},
      {ch:'劉',meaning:'성',strokes:15,pilhoek:15,rad:'刀',jawonElement:'금'},
      {ch:'謬',meaning:'그릇될',strokes:18,pilhoek:18,rad:'言',jawonElement:'금'},
      {ch:'溜',meaning:'증류수',strokes:14,pilhoek:13,rad:'水',jawonElement:'수'},
      {ch:'琉',meaning:'유리',strokes:11,pilhoek:11,rad:'玉',jawonElement:'금'}
    ],
    '만': [
      {ch:'萬',meaning:'일만',strokes:15,pilhoek:12,rad:'禸',jawonElement:null},
      {ch:'滿',meaning:'찰',strokes:15,pilhoek:14,rad:'水',jawonElement:'수'},
      {ch:'慢',meaning:'거만할',strokes:15,pilhoek:14,rad:'心',jawonElement:'화'},
      {ch:'漫',meaning:'질펀할',strokes:15,pilhoek:14,rad:'水',jawonElement:'수'},
      {ch:'灣',meaning:'물굽이',strokes:26,pilhoek:25,rad:'水',jawonElement:'수'},
      {ch:'娩',meaning:'해산할',strokes:10,pilhoek:10,rad:'女',jawonElement:'토'},
      {ch:'挽',meaning:'당길',strokes:11,pilhoek:10,rad:'手',jawonElement:'목'},
      {ch:'蔓',meaning:'덩굴',strokes:17,pilhoek:14,rad:'艸',jawonElement:'목'}
    ],
    '묵': [
      {ch:'墨',meaning:'먹',strokes:15,pilhoek:15,rad:'黑',jawonElement:'수'},
      {ch:'默',meaning:'묵묵할',strokes:16,pilhoek:16,rad:'黑',jawonElement:'수'}
    ],
    '범': [
      {ch:'凡',meaning:'무릇',strokes:3,pilhoek:3,rad:'几',jawonElement:null},
      {ch:'犯',meaning:'범할',strokes:6,pilhoek:5,rad:'犬',jawonElement:null},
      {ch:'範',meaning:'법',strokes:15,pilhoek:15,rad:'竹',jawonElement:'목'},
      {ch:'范',meaning:'풀 이름',strokes:11,pilhoek:9,rad:'艸',jawonElement:'목'},
      {ch:'汎',meaning:'뜰',strokes:7,pilhoek:6,rad:'水',jawonElement:'수'},
      {ch:'泛',meaning:'뜰',strokes:9,pilhoek:7,rad:'水',jawonElement:'수'},
      {ch:'帆',meaning:'돛',strokes:6,pilhoek:6,rad:'巾',jawonElement:'목'},
      {ch:'梵',meaning:'범어',strokes:11,pilhoek:11,rad:'木',jawonElement:'목'}
    ],
    '삼': [
      {ch:'三',meaning:'석',strokes:3,pilhoek:3,rad:'一',jawonElement:null},
      {ch:'參',meaning:'석',strokes:11,pilhoek:11,rad:'厶',jawonElement:null},
      {ch:'蔘',meaning:'인삼',strokes:17,pilhoek:14,rad:'艸',jawonElement:'목'},
      {ch:'森',meaning:'나무빽빽할',strokes:12,pilhoek:12,rad:'木',jawonElement:'목'},
      {ch:'渗',meaning:'거를',strokes:15,pilhoek:11,rad:'水',jawonElement:'수'},
      {ch:'衫',meaning:'적삼',strokes:9,pilhoek:8,rad:'衣',jawonElement:'목'},
      {ch:'杉',meaning:'삼나무',strokes:7,pilhoek:7,rad:'木',jawonElement:'목'}
    ],
    '순': [
      {ch:'順',meaning:'좇을',strokes:12,pilhoek:12,rad:'頁',jawonElement:'화'},
      {ch:'純',meaning:'실',strokes:10,pilhoek:10,rad:'糸',jawonElement:'목'},
      {ch:'巡',meaning:'돌',strokes:7,pilhoek:6,rad:'辵',jawonElement:'토'},
      {ch:'循',meaning:'좇을',strokes:12,pilhoek:12,rad:'彳',jawonElement:'화'},
      {ch:'旬',meaning:'열흘',strokes:6,pilhoek:6,rad:'日',jawonElement:null},
      {ch:'殉',meaning:'구할',strokes:10,pilhoek:10,rad:'歹',jawonElement:'수'},
      {ch:'瞬',meaning:'잠깐',strokes:17,pilhoek:17,rad:'目',jawonElement:'목'},
      {ch:'舜',meaning:'순임금',strokes:12,pilhoek:12,rad:'舛',jawonElement:'목'}
    ],
    '애': [
      {ch:'愛',meaning:'사랑',strokes:13,pilhoek:13,rad:'心',jawonElement:'화'},
      {ch:'哀',meaning:'가여울',strokes:9,pilhoek:9,rad:'口',jawonElement:null},
      {ch:'涯',meaning:'물가',strokes:12,pilhoek:11,rad:'水',jawonElement:'수'},
      {ch:'埃',meaning:'속세',strokes:10,pilhoek:10,rad:'土',jawonElement:'토'},
      {ch:'艾',meaning:'쑥',strokes:8,pilhoek:5,rad:'艸',jawonElement:'목'},
      {ch:'喝',meaning:'목 쉴',strokes:12,pilhoek:12,rad:'口',jawonElement:null},
      {ch:'崖',meaning:'낭떠러지',strokes:11,pilhoek:11,rad:'山',jawonElement:'토'},
      {ch:'靄',meaning:'아지랭이',strokes:24,pilhoek:24,rad:'雨',jawonElement:'수'}
    ],
    '야': [
      {ch:'夜',meaning:'밤',strokes:8,pilhoek:8,rad:'夕',jawonElement:null},
      {ch:'野',meaning:'들판',strokes:11,pilhoek:11,rad:'里',jawonElement:null},
      {ch:'也',meaning:'단정의 어조사',strokes:3,pilhoek:3,rad:'乙',jawonElement:null},
      {ch:'若',meaning:'땅이름',strokes:11,pilhoek:8,rad:'艸',jawonElement:'목'},
      {ch:'耶',meaning:'의문의 어조야',strokes:9,pilhoek:8,rad:'耳',jawonElement:'화'},
      {ch:'惹',meaning:'끌릴',strokes:13,pilhoek:12,rad:'心',jawonElement:'화'},
      {ch:'倻',meaning:'땅이름',strokes:11,pilhoek:10,rad:'人',jawonElement:'화'},
      {ch:'椰',meaning:'야자나무',strokes:13,pilhoek:12,rad:'木',jawonElement:'목'}
    ],
    '옹': [
      {ch:'翁',meaning:'늙은이',strokes:10,pilhoek:10,rad:'羽',jawonElement:'화'},
      {ch:'擁',meaning:'안을',strokes:17,pilhoek:16,rad:'手',jawonElement:'목'},
      {ch:'雍',meaning:'학교',strokes:13,pilhoek:13,rad:'隹',jawonElement:'화'},
      {ch:'壅',meaning:'막을',strokes:16,pilhoek:16,rad:'土',jawonElement:'토'},
      {ch:'甕',meaning:'항아리',strokes:18,pilhoek:17,rad:'瓦',jawonElement:null},
      {ch:'邕',meaning:'사람이름',strokes:10,pilhoek:10,rad:'邑',jawonElement:'토'},
      {ch:'瓮',meaning:'항아리',strokes:9,pilhoek:8,rad:'瓦',jawonElement:null},
      {ch:'饔',meaning:'아침밥',strokes:22,pilhoek:22,rad:'食',jawonElement:'수'}
    ],
    '임': [
      {ch:'林',meaning:'수풀',strokes:8,pilhoek:8,rad:'木',jawonElement:'목'},
      {ch:'任',meaning:'맡길',strokes:6,pilhoek:6,rad:'人',jawonElement:'화'},
      {ch:'壬',meaning:'아홉째천간',strokes:4,pilhoek:4,rad:'士',jawonElement:null},
      {ch:'臨',meaning:'임할',strokes:17,pilhoek:17,rad:'臣',jawonElement:null},
      {ch:'賃',meaning:'품팔이',strokes:13,pilhoek:13,rad:'貝',jawonElement:'금'},
      {ch:'姙',meaning:'아이밸',strokes:9,pilhoek:9,rad:'女',jawonElement:'토'},
      {ch:'淋',meaning:'지적지적할',strokes:12,pilhoek:11,rad:'水',jawonElement:'수'},
      {ch:'稔',meaning:'곡식익을',strokes:13,pilhoek:13,rad:'禾',jawonElement:'목'}
    ],
    '좌': [
      {ch:'左',meaning:'왼',strokes:5,pilhoek:5,rad:'工',jawonElement:'화'},
      {ch:'坐',meaning:'앉을',strokes:7,pilhoek:7,rad:'土',jawonElement:'토'},
      {ch:'佐',meaning:'도울',strokes:7,pilhoek:7,rad:'人',jawonElement:'화'},
      {ch:'座',meaning:'자리',strokes:10,pilhoek:10,rad:'广',jawonElement:'목'},
      {ch:'挫',meaning:'꺽을',strokes:11,pilhoek:10,rad:'手',jawonElement:'목'}
    ],
    '즙': [
      {ch:'汁',meaning:'즙',strokes:6,pilhoek:5,rad:'水',jawonElement:'수'},
      {ch:'葺',meaning:'지붕일',strokes:15,pilhoek:12,rad:'艸',jawonElement:'목'},
      {ch:'楫',meaning:'노',strokes:13,pilhoek:13,rad:'木',jawonElement:'목'}
    ],
    '탁': [
      {ch:'卓',meaning:'높을',strokes:8,pilhoek:8,rad:'十',jawonElement:null},
      {ch:'度',meaning:'꾀할',strokes:9,pilhoek:9,rad:'广',jawonElement:'목'},
      {ch:'濁',meaning:'물이름',strokes:17,pilhoek:16,rad:'水',jawonElement:'수'},
      {ch:'拓',meaning:'물리칠',strokes:9,pilhoek:8,rad:'手',jawonElement:'목'},
      {ch:'托',meaning:'밀칠',strokes:7,pilhoek:6,rad:'手',jawonElement:'목'},
      {ch:'濯',meaning:'씻을',strokes:18,pilhoek:17,rad:'水',jawonElement:'수'},
      {ch:'託',meaning:'맡길',strokes:10,pilhoek:10,rad:'言',jawonElement:'금'},
      {ch:'琢',meaning:'옥 쪼을',strokes:13,pilhoek:12,rad:'玉',jawonElement:'금'}
    ],
    '탄': [
      {ch:'歎',meaning:'아름답다 할',strokes:15,pilhoek:15,rad:'欠',jawonElement:null},
      {ch:'彈',meaning:'쏠',strokes:15,pilhoek:15,rad:'弓',jawonElement:null},
      {ch:'炭',meaning:'숯',strokes:9,pilhoek:9,rad:'火',jawonElement:'화'},
      {ch:'誕',meaning:'기를',strokes:14,pilhoek:13,rad:'言',jawonElement:'금'},
      {ch:'灘',meaning:'여울',strokes:23,pilhoek:22,rad:'水',jawonElement:'수'},
      {ch:'綻',meaning:'옷 터질',strokes:14,pilhoek:14,rad:'糸',jawonElement:'목'},
      {ch:'憚',meaning:'수고로울',strokes:16,pilhoek:15,rad:'心',jawonElement:'화'},
      {ch:'呑',meaning:'삼킬',strokes:7,pilhoek:7,rad:'口',jawonElement:null}
    ],
    '판': [
      {ch:'判',meaning:'판단할',strokes:7,pilhoek:7,rad:'刀',jawonElement:'금'},
      {ch:'板',meaning:'널조각',strokes:8,pilhoek:8,rad:'木',jawonElement:'목'},
      {ch:'版',meaning:'조각',strokes:8,pilhoek:8,rad:'片',jawonElement:'목'},
      {ch:'販',meaning:'장사',strokes:11,pilhoek:11,rad:'貝',jawonElement:'금'},
      {ch:'阪',meaning:'산비탈',strokes:12,pilhoek:6,rad:'阜',jawonElement:'토'},
      {ch:'辦',meaning:'힘들일',strokes:16,pilhoek:16,rad:'辛',jawonElement:'금'},
      {ch:'坂',meaning:'언덕',strokes:7,pilhoek:7,rad:'土',jawonElement:'토'},
      {ch:'瓣',meaning:'외씨',strokes:19,pilhoek:19,rad:'瓜',jawonElement:null}
    ],
    '팽': [
      {ch:'彭',meaning:'성씨',strokes:12,pilhoek:12,rad:'彡',jawonElement:null},
      {ch:'膨',meaning:'배 불룩할',strokes:18,pilhoek:16,rad:'肉',jawonElement:null},
      {ch:'澎',meaning:'물소리',strokes:16,pilhoek:15,rad:'水',jawonElement:'수'},
      {ch:'烹',meaning:'삶을',strokes:11,pilhoek:11,rad:'火',jawonElement:'화'}
    ],
    '평': [
      {ch:'平',meaning:'평탄할',strokes:5,pilhoek:5,rad:'干',jawonElement:'목'},
      {ch:'評',meaning:'평론할',strokes:12,pilhoek:12,rad:'言',jawonElement:'금'},
      {ch:'坪',meaning:'벌판',strokes:8,pilhoek:8,rad:'土',jawonElement:'토'},
      {ch:'萍',meaning:'머구리밥',strokes:14,pilhoek:11,rad:'艸',jawonElement:'목'},
      {ch:'枰',meaning:'장기판',strokes:9,pilhoek:9,rad:'木',jawonElement:'목'}
    ],
    '포': [
      {ch:'布',meaning:'베',strokes:5,pilhoek:5,rad:'巾',jawonElement:'목'},
      {ch:'抱',meaning:'안을',strokes:9,pilhoek:8,rad:'手',jawonElement:'목'},
      {ch:'暴',meaning:'맨손으로 칠',strokes:15,pilhoek:15,rad:'日',jawonElement:null},
      {ch:'浦',meaning:'물가',strokes:11,pilhoek:10,rad:'水',jawonElement:'수'},
      {ch:'胞',meaning:'태보',strokes:11,pilhoek:9,rad:'肉',jawonElement:null},
      {ch:'包',meaning:'꾸릴',strokes:5,pilhoek:5,rad:'勹',jawonElement:null},
      {ch:'飽',meaning:'배부를',strokes:14,pilhoek:13,rad:'食',jawonElement:'수'},
      {ch:'砲',meaning:'큰 대포',strokes:10,pilhoek:10,rad:'石',jawonElement:'금'}
    ],
    '풍': [
      {ch:'風',meaning:'바람',strokes:9,pilhoek:9,rad:'風',jawonElement:'목'},
      {ch:'豊',meaning:'풍년',strokes:13,pilhoek:13,rad:'豆',jawonElement:null},
      {ch:'楓',meaning:'단풍나무',strokes:13,pilhoek:13,rad:'木',jawonElement:'목'},
      {ch:'諷',meaning:'비유로 간할',strokes:16,pilhoek:16,rad:'言',jawonElement:'금'},
      {ch:'馮',meaning:'벼슬이름',strokes:12,pilhoek:12,rad:'馬',jawonElement:'화'}
    ],
    '피': [
      {ch:'皮',meaning:'가죽',strokes:5,pilhoek:5,rad:'皮',jawonElement:null},
      {ch:'彼',meaning:'저',strokes:8,pilhoek:8,rad:'彳',jawonElement:'화'},
      {ch:'被',meaning:'이불',strokes:11,pilhoek:10,rad:'衣',jawonElement:'목'},
      {ch:'避',meaning:'어길',strokes:20,pilhoek:16,rad:'辵',jawonElement:'토'},
      {ch:'疲',meaning:'피곤할',strokes:10,pilhoek:10,rad:'疒',jawonElement:'수'},
      {ch:'披',meaning:'헤칠',strokes:9,pilhoek:8,rad:'手',jawonElement:'목'}
    ],
    '후': [
      {ch:'後',meaning:'뒤',strokes:9,pilhoek:9,rad:'彳',jawonElement:'화'},
      {ch:'厚',meaning:'두터울',strokes:9,pilhoek:9,rad:'厂',jawonElement:null},
      {ch:'侯',meaning:'과녁',strokes:9,pilhoek:9,rad:'人',jawonElement:'화'},
      {ch:'后',meaning:'임금',strokes:6,pilhoek:6,rad:'口',jawonElement:null},
      {ch:'候',meaning:'물을',strokes:10,pilhoek:10,rad:'人',jawonElement:'화'},
      {ch:'喉',meaning:'목구멍',strokes:12,pilhoek:12,rad:'口',jawonElement:null},
      {ch:'吼',meaning:'울',strokes:7,pilhoek:7,rad:'口',jawonElement:null},
      {ch:'朽',meaning:'섞을',strokes:6,pilhoek:6,rad:'木',jawonElement:'목'}
    ],
    '흥': [
      {ch:'興',meaning:'일',strokes:15,pilhoek:16,rad:'臼',jawonElement:'토'}
    ],
    '각': [
      {ch:'各',meaning:'각각',strokes:6,pilhoek:6,rad:'口',jawonElement:null},
      {ch:'角',meaning:'뿔',strokes:7,pilhoek:7,rad:'角',jawonElement:'목'},
      {ch:'脚',meaning:'다리',strokes:13,pilhoek:11,rad:'肉',jawonElement:null},
      {ch:'覺',meaning:'깨달을',strokes:20,pilhoek:20,rad:'見',jawonElement:'화'},
      {ch:'閣',meaning:'문설주',strokes:14,pilhoek:14,rad:'門',jawonElement:null},
      {ch:'刻',meaning:'새길',strokes:8,pilhoek:8,rad:'刀',jawonElement:'금'},
      {ch:'却',meaning:'물리칠',strokes:7,pilhoek:7,rad:'卩',jawonElement:null},
      {ch:'珏',meaning:'쌍옥',strokes:10,pilhoek:9,rad:'玉',jawonElement:'금'}
    ],
    '간': [
      {ch:'乾',meaning:'마를',strokes:11,pilhoek:11,rad:'乙',jawonElement:null},
      {ch:'間',meaning:'틈',strokes:12,pilhoek:12,rad:'門',jawonElement:null},
      {ch:'干',meaning:'방패',strokes:3,pilhoek:3,rad:'干',jawonElement:'목'},
      {ch:'看',meaning:'볼',strokes:9,pilhoek:9,rad:'目',jawonElement:'목'},
      {ch:'幹',meaning:'줄기',strokes:13,pilhoek:13,rad:'干',jawonElement:'목'},
      {ch:'刊',meaning:'책 펴낼',strokes:5,pilhoek:5,rad:'刀',jawonElement:'금'},
      {ch:'肝',meaning:'간',strokes:9,pilhoek:7,rad:'肉',jawonElement:null},
      {ch:'簡',meaning:'대쪽',strokes:18,pilhoek:18,rad:'竹',jawonElement:'목'}
    ],
    '갈': [
      {ch:'渴',meaning:'목마를',strokes:13,pilhoek:12,rad:'水',jawonElement:'수'},
      {ch:'葛',meaning:'칡',strokes:15,pilhoek:12,rad:'艸',jawonElement:'목'},
      {ch:'鞨',meaning:'말갈나라',strokes:18,pilhoek:18,rad:'革',jawonElement:'금'},
      {ch:'竭',meaning:'다할',strokes:14,pilhoek:14,rad:'立',jawonElement:null},
      {ch:'喝',meaning:'성낸 소리',strokes:12,pilhoek:12,rad:'口',jawonElement:null},
      {ch:'褐',meaning:'털베',strokes:15,pilhoek:14,rad:'衣',jawonElement:'목'},
      {ch:'曷',meaning:'어찌',strokes:9,pilhoek:9,rad:'曰',jawonElement:null},
      {ch:'碣',meaning:'우뚝선 돌',strokes:14,pilhoek:14,rad:'石',jawonElement:'금'}
    ],
    '감': [
      {ch:'甘',meaning:'달',strokes:5,pilhoek:5,rad:'甘',jawonElement:'토'},
      {ch:'感',meaning:'감동할',strokes:13,pilhoek:13,rad:'心',jawonElement:'화'},
      {ch:'減',meaning:'덜',strokes:13,pilhoek:12,rad:'水',jawonElement:'수'},
      {ch:'敢',meaning:'감히',strokes:12,pilhoek:11,rad:'攴',jawonElement:'금'},
      {ch:'監',meaning:'거느릴',strokes:14,pilhoek:14,rad:'皿',jawonElement:null},
      {ch:'鑑',meaning:'거울',strokes:22,pilhoek:22,rad:'金',jawonElement:'금'},
      {ch:'憾',meaning:'섭섭할',strokes:17,pilhoek:16,rad:'心',jawonElement:'화'},
      {ch:'邯',meaning:'조나라 서울',strokes:12,pilhoek:7,rad:'邑',jawonElement:'토'}
    ],
    '갑': [
      {ch:'甲',meaning:'갑옷',strokes:5,pilhoek:5,rad:'田',jawonElement:null},
      {ch:'閘',meaning:'문 빗장',strokes:13,pilhoek:13,rad:'門',jawonElement:null},
      {ch:'岬',meaning:'산 허구리',strokes:8,pilhoek:8,rad:'山',jawonElement:'토'},
      {ch:'鉀',meaning:'갑옷',strokes:13,pilhoek:13,rad:'金',jawonElement:'금'},
      {ch:'匣',meaning:'궤',strokes:7,pilhoek:7,rad:'匚',jawonElement:null},
      {ch:'胛',meaning:'어깻죽지',strokes:11,pilhoek:9,rad:'肉',jawonElement:null}
    ],
    '개': [
      {ch:'改',meaning:'고칠',strokes:7,pilhoek:7,rad:'攴',jawonElement:'금'},
      {ch:'開',meaning:'열',strokes:12,pilhoek:12,rad:'門',jawonElement:null},
      {ch:'個',meaning:'낱',strokes:10,pilhoek:10,rad:'人',jawonElement:'화'},
      {ch:'皆',meaning:'모두',strokes:9,pilhoek:9,rad:'白',jawonElement:null},
      {ch:'豈',meaning:'승전악',strokes:10,pilhoek:10,rad:'豆',jawonElement:null},
      {ch:'槪',meaning:'평두목',strokes:15,pilhoek:15,rad:'木',jawonElement:'목'},
      {ch:'介',meaning:'낄',strokes:4,pilhoek:4,rad:'人',jawonElement:'화'},
      {ch:'蓋',meaning:'뚜껑',strokes:16,pilhoek:13,rad:'艸',jawonElement:'목'}
    ],
    '객': [
      {ch:'客',meaning:'손님',strokes:9,pilhoek:9,rad:'宀',jawonElement:null},
      {ch:'喀',meaning:'기침할',strokes:12,pilhoek:12,rad:'口',jawonElement:null}
    ],
    '갱': [
      {ch:'更',meaning:'다시',strokes:7,pilhoek:7,rad:'曰',jawonElement:null},
      {ch:'坑',meaning:'묻을',strokes:7,pilhoek:7,rad:'土',jawonElement:'토'},
      {ch:'羹',meaning:'국',strokes:19,pilhoek:19,rad:'羊',jawonElement:'토'},
      {ch:'粳',meaning:'메벼',strokes:13,pilhoek:13,rad:'米',jawonElement:'목'}
    ],
    '갹': [
      {ch:'醵',meaning:'술추렴',strokes:20,pilhoek:20,rad:'酉',jawonElement:null}
    ],
    '거': [
      {ch:'車',meaning:'수레',strokes:7,pilhoek:7,rad:'車',jawonElement:'화'},
      {ch:'去',meaning:'오래될',strokes:5,pilhoek:5,rad:'厶',jawonElement:null},
      {ch:'居',meaning:'살',strokes:8,pilhoek:8,rad:'尸',jawonElement:null},
      {ch:'巨',meaning:'클',strokes:5,pilhoek:4,rad:'工',jawonElement:'화'},
      {ch:'擧',meaning:'받들',strokes:18,pilhoek:17,rad:'手',jawonElement:'목'},
      {ch:'拒',meaning:'막을',strokes:9,pilhoek:7,rad:'手',jawonElement:'목'},
      {ch:'距',meaning:'며느리 발톱',strokes:12,pilhoek:11,rad:'足',jawonElement:'토'},
      {ch:'據',meaning:'의지할',strokes:17,pilhoek:16,rad:'手',jawonElement:'목'}
    ],
    '걸': [
      {ch:'傑',meaning:'호걸',strokes:12,pilhoek:12,rad:'人',jawonElement:'화'},
      {ch:'乞',meaning:'구걸할',strokes:3,pilhoek:3,rad:'乙',jawonElement:null},
      {ch:'杰',meaning:'준걸',strokes:8,pilhoek:8,rad:'木',jawonElement:'목'},
      {ch:'桀',meaning:'홰',strokes:10,pilhoek:10,rad:'木',jawonElement:'목'},
      {ch:'偈',meaning:'힘 빼두를',strokes:11,pilhoek:11,rad:'人',jawonElement:'화'}
    ],
    '검': [
      {ch:'檢',meaning:'교정할',strokes:17,pilhoek:17,rad:'木',jawonElement:'목'},
      {ch:'儉',meaning:'검소할',strokes:15,pilhoek:15,rad:'人',jawonElement:'화'},
      {ch:'劍',meaning:'칼',strokes:15,pilhoek:15,rad:'刀',jawonElement:'금'},
      {ch:'劒',meaning:'칼',strokes:16,pilhoek:16,rad:'刀',jawonElement:'금'},
      {ch:'黔',meaning:'검을',strokes:16,pilhoek:16,rad:'黑',jawonElement:'수'},
      {ch:'鈐',meaning:'자물쇠',strokes:12,pilhoek:12,rad:'金',jawonElement:'금'}
    ],
    '겁': [
      {ch:'怯',meaning:'무서워할',strokes:9,pilhoek:8,rad:'心',jawonElement:'화'},
      {ch:'劫',meaning:'위협할',strokes:7,pilhoek:7,rad:'力',jawonElement:null},
      {ch:'迲',meaning:'자내',strokes:12,pilhoek:8,rad:'辵',jawonElement:'토'}
    ],
    '게': [
      {ch:'揭',meaning:'높이 들',strokes:13,pilhoek:12,rad:'手',jawonElement:'목'},
      {ch:'憩',meaning:'쉴',strokes:16,pilhoek:16,rad:'心',jawonElement:'화'},
      {ch:'偈',meaning:'쉴',strokes:11,pilhoek:11,rad:'人',jawonElement:'화'}
    ],
    '격': [
      {ch:'格',meaning:'이를',strokes:10,pilhoek:10,rad:'木',jawonElement:'목'},
      {ch:'激',meaning:'물결 부딪혀 흐를',strokes:17,pilhoek:16,rad:'水',jawonElement:'수'},
      {ch:'擊',meaning:'칠',strokes:17,pilhoek:17,rad:'手',jawonElement:'목'},
      {ch:'隔',meaning:'막을',strokes:18,pilhoek:12,rad:'阜',jawonElement:'토'},
      {ch:'檄',meaning:'격서',strokes:17,pilhoek:17,rad:'木',jawonElement:'목'},
      {ch:'膈',meaning:'명치',strokes:16,pilhoek:14,rad:'肉',jawonElement:null},
      {ch:'覡',meaning:'박수',strokes:14,pilhoek:14,rad:'見',jawonElement:'화'}
    ],
    '견': [
      {ch:'見',meaning:'볼',strokes:7,pilhoek:7,rad:'見',jawonElement:'화'},
      {ch:'犬',meaning:'큰 개',strokes:4,pilhoek:4,rad:'犬',jawonElement:null},
      {ch:'堅',meaning:'굳을',strokes:11,pilhoek:11,rad:'土',jawonElement:'토'},
      {ch:'遣',meaning:'보낼',strokes:17,pilhoek:13,rad:'辵',jawonElement:'토'},
      {ch:'牽',meaning:'당길',strokes:11,pilhoek:11,rad:'牛',jawonElement:'토'},
      {ch:'肩',meaning:'어깨',strokes:10,pilhoek:8,rad:'肉',jawonElement:null},
      {ch:'絹',meaning:'비단',strokes:13,pilhoek:13,rad:'糸',jawonElement:'목'},
      {ch:'甄',meaning:'질그릇',strokes:14,pilhoek:13,rad:'瓦',jawonElement:null}
    ],
    '결': [
      {ch:'結',meaning:'맺을',strokes:12,pilhoek:12,rad:'糸',jawonElement:'목'},
      {ch:'決',meaning:'결단할',strokes:8,pilhoek:7,rad:'水',jawonElement:'수'},
      {ch:'潔',meaning:'맑을',strokes:16,pilhoek:15,rad:'水',jawonElement:'수'},
      {ch:'缺',meaning:'이지러질',strokes:10,pilhoek:10,rad:'缶',jawonElement:'토'},
      {ch:'訣',meaning:'열결할',strokes:11,pilhoek:11,rad:'言',jawonElement:'금'},
      {ch:'拮',meaning:'길거할',strokes:10,pilhoek:9,rad:'手',jawonElement:'목'},
      {ch:'抉',meaning:'긁을',strokes:8,pilhoek:7,rad:'手',jawonElement:'목'}
    ],
    '곡': [
      {ch:'谷',meaning:'골짜기',strokes:7,pilhoek:7,rad:'谷',jawonElement:'수'},
      {ch:'穀',meaning:'곡식',strokes:15,pilhoek:15,rad:'禾',jawonElement:'목'},
      {ch:'哭',meaning:'울',strokes:10,pilhoek:10,rad:'口',jawonElement:null},
      {ch:'鵠',meaning:'고니',strokes:18,pilhoek:18,rad:'鳥',jawonElement:'화'},
      {ch:'梏',meaning:'쇠고랑',strokes:11,pilhoek:11,rad:'木',jawonElement:'목'},
      {ch:'斛',meaning:'휘',strokes:11,pilhoek:11,rad:'斗',jawonElement:'화'}
    ],
    '곤': [
      {ch:'困',meaning:'곤할',strokes:7,pilhoek:7,rad:'囗',jawonElement:null},
      {ch:'坤',meaning:'땅',strokes:8,pilhoek:8,rad:'土',jawonElement:'토'},
      {ch:'昆',meaning:'형',strokes:8,pilhoek:8,rad:'日',jawonElement:null},
      {ch:'棍',meaning:'곤장',strokes:12,pilhoek:12,rad:'木',jawonElement:'목'},
      {ch:'袞',meaning:'곤룡포',strokes:11,pilhoek:11,rad:'衣',jawonElement:'목'},
      {ch:'崑',meaning:'산이름',strokes:11,pilhoek:11,rad:'山',jawonElement:'토'},
      {ch:'梱',meaning:'문지방',strokes:11,pilhoek:11,rad:'木',jawonElement:'목'},
      {ch:'鯤',meaning:'준마 이름',strokes:19,pilhoek:19,rad:'魚',jawonElement:'수'}
    ],
    '골': [
      {ch:'骨',meaning:'뼈',strokes:10,pilhoek:10,rad:'骨',jawonElement:null},
      {ch:'汨',meaning:'골몰할',strokes:8,pilhoek:7,rad:'水',jawonElement:'수'}
    ],
    '곶': [
      {ch:'串',meaning:'땅이름',strokes:7,pilhoek:7,rad:'丨',jawonElement:null}
    ],
    '과': [
      {ch:'果',meaning:'실과',strokes:8,pilhoek:8,rad:'木',jawonElement:'목'},
      {ch:'過',meaning:'지날',strokes:16,pilhoek:11,rad:'辵',jawonElement:'토'},
      {ch:'科',meaning:'과정',strokes:9,pilhoek:9,rad:'禾',jawonElement:'목'},
      {ch:'課',meaning:'매길',strokes:15,pilhoek:15,rad:'言',jawonElement:'금'},
      {ch:'寡',meaning:'적을',strokes:14,pilhoek:14,rad:'宀',jawonElement:null},
      {ch:'誇',meaning:'자랑할',strokes:13,pilhoek:13,rad:'言',jawonElement:'금'},
      {ch:'瓜',meaning:'오이',strokes:5,pilhoek:5,rad:'瓜',jawonElement:null},
      {ch:'戈',meaning:'창',strokes:4,pilhoek:4,rad:'戈',jawonElement:null}
    ],
    '관': [
      {ch:'官',meaning:'벼슬',strokes:8,pilhoek:8,rad:'宀',jawonElement:null},
      {ch:'觀',meaning:'볼',strokes:25,pilhoek:24,rad:'見',jawonElement:'화'},
      {ch:'關',meaning:'빗장',strokes:19,pilhoek:19,rad:'門',jawonElement:null},
      {ch:'館',meaning:'객사',strokes:17,pilhoek:16,rad:'食',jawonElement:'수'},
      {ch:'管',meaning:'피리',strokes:14,pilhoek:14,rad:'竹',jawonElement:'목'},
      {ch:'冠',meaning:'갓',strokes:9,pilhoek:9,rad:'冖',jawonElement:null},
      {ch:'寬',meaning:'너그러울',strokes:15,pilhoek:14,rad:'宀',jawonElement:null},
      {ch:'貫',meaning:'꿸',strokes:11,pilhoek:11,rad:'貝',jawonElement:'금'}
    ],
    '괄': [
      {ch:'括',meaning:'헤아릴',strokes:10,pilhoek:9,rad:'手',jawonElement:'목'},
      {ch:'檜',meaning:'전나무',strokes:17,pilhoek:17,rad:'木',jawonElement:'목'},
      {ch:'刮',meaning:'깍을',strokes:8,pilhoek:8,rad:'刀',jawonElement:'금'},
      {ch:'适',meaning:'빠를',strokes:13,pilhoek:9,rad:'辵',jawonElement:'토'},
      {ch:'恝',meaning:'깜짝',strokes:10,pilhoek:10,rad:'心',jawonElement:'화'}
    ],
    '광': [
      {ch:'光',meaning:'빛',strokes:6,pilhoek:6,rad:'儿',jawonElement:null},
      {ch:'廣',meaning:'넓을',strokes:15,pilhoek:14,rad:'广',jawonElement:'목'},
      {ch:'狂',meaning:'미질',strokes:8,pilhoek:7,rad:'犬',jawonElement:null},
      {ch:'鑛',meaning:'쇳돌',strokes:23,pilhoek:22,rad:'金',jawonElement:'금'},
      {ch:'匡',meaning:'바룰',strokes:6,pilhoek:6,rad:'匚',jawonElement:null},
      {ch:'曠',meaning:'밝을',strokes:19,pilhoek:18,rad:'日',jawonElement:null},
      {ch:'壙',meaning:'광',strokes:18,pilhoek:17,rad:'土',jawonElement:'토'},
      {ch:'胱',meaning:'방광',strokes:12,pilhoek:10,rad:'肉',jawonElement:null}
    ],
    '괘': [
      {ch:'掛',meaning:'걸',strokes:12,pilhoek:11,rad:'手',jawonElement:'목'},
      {ch:'卦',meaning:'걸',strokes:8,pilhoek:8,rad:'卜',jawonElement:null},
      {ch:'罫',meaning:'줄',strokes:14,pilhoek:13,rad:'网',jawonElement:null}
    ],
    '괴': [
      {ch:'怪',meaning:'기이할',strokes:9,pilhoek:8,rad:'心',jawonElement:'화'},
      {ch:'愧',meaning:'부끄러워할',strokes:14,pilhoek:12,rad:'心',jawonElement:'화'},
      {ch:'塊',meaning:'흙덩이',strokes:13,pilhoek:12,rad:'土',jawonElement:'토'},
      {ch:'槐',meaning:'홰나무',strokes:14,pilhoek:13,rad:'木',jawonElement:'목'},
      {ch:'傀',meaning:'클',strokes:12,pilhoek:11,rad:'人',jawonElement:'화'},
      {ch:'乖',meaning:'어그러질',strokes:8,pilhoek:8,rad:'丿',jawonElement:null},
      {ch:'魁',meaning:'으뜸',strokes:14,pilhoek:13,rad:'鬼',jawonElement:'화'}
    ],
    '굉': [
      {ch:'宏',meaning:'클',strokes:7,pilhoek:7,rad:'宀',jawonElement:null},
      {ch:'肱',meaning:'팔뚝',strokes:10,pilhoek:8,rad:'肉',jawonElement:null},
      {ch:'紘',meaning:'갓끈',strokes:10,pilhoek:10,rad:'糸',jawonElement:'목'}
    ],
    '교': [
      {ch:'校',meaning:'학교',strokes:10,pilhoek:10,rad:'木',jawonElement:'목'},
      {ch:'交',meaning:'사귈',strokes:6,pilhoek:6,rad:'亠',jawonElement:null},
      {ch:'敎',meaning:'가르침',strokes:11,pilhoek:11,rad:'攴',jawonElement:'금'},
      {ch:'橋',meaning:'다리',strokes:16,pilhoek:16,rad:'木',jawonElement:'목'},
      {ch:'巧',meaning:'공교할',strokes:5,pilhoek:5,rad:'工',jawonElement:'화'},
      {ch:'較',meaning:'견줄',strokes:13,pilhoek:13,rad:'車',jawonElement:'화'},
      {ch:'郊',meaning:'성 밖',strokes:13,pilhoek:8,rad:'邑',jawonElement:'토'},
      {ch:'矯',meaning:'바로잡을',strokes:17,pilhoek:17,rad:'矢',jawonElement:'금'}
    ],
    '군': [
      {ch:'軍',meaning:'군사',strokes:9,pilhoek:9,rad:'車',jawonElement:'화'},
      {ch:'君',meaning:'임금',strokes:7,pilhoek:7,rad:'口',jawonElement:null},
      {ch:'郡',meaning:'고을',strokes:14,pilhoek:9,rad:'邑',jawonElement:'토'},
      {ch:'群',meaning:'무리',strokes:13,pilhoek:13,rad:'羊',jawonElement:'토'},
      {ch:'窘',meaning:'군색할',strokes:12,pilhoek:12,rad:'穴',jawonElement:'수'},
      {ch:'裙',meaning:'치마',strokes:12,pilhoek:12,rad:'衣',jawonElement:'목'}
    ],
    '굴': [
      {ch:'窟',meaning:'구멍',strokes:13,pilhoek:13,rad:'穴',jawonElement:'수'},
      {ch:'掘',meaning:'팔',strokes:12,pilhoek:11,rad:'手',jawonElement:'목'},
      {ch:'堀',meaning:'굴뚝',strokes:11,pilhoek:11,rad:'土',jawonElement:'토'}
    ],
    '궐': [
      {ch:'闕',meaning:'대궐',strokes:18,pilhoek:18,rad:'門',jawonElement:null},
      {ch:'蹶',meaning:'쓰러질',strokes:19,pilhoek:19,rad:'足',jawonElement:'토'},
      {ch:'蕨',meaning:'고사리',strokes:18,pilhoek:15,rad:'艸',jawonElement:'목'},
      {ch:'獗',meaning:'뛰놀',strokes:16,pilhoek:15,rad:'犬',jawonElement:null}
    ],
    '궤': [
      {ch:'軌',meaning:'수레바퀴 사이',strokes:9,pilhoek:9,rad:'車',jawonElement:'화'},
      {ch:'蹶',meaning:'급히걸을',strokes:19,pilhoek:19,rad:'足',jawonElement:'토'},
      {ch:'潰',meaning:'흩어질',strokes:16,pilhoek:15,rad:'水',jawonElement:'수'},
      {ch:'机',meaning:'느티나무',strokes:6,pilhoek:6,rad:'木',jawonElement:'목'},
      {ch:'櫃',meaning:'상자',strokes:18,pilhoek:18,rad:'木',jawonElement:'목'},
      {ch:'饋',meaning:'먹일',strokes:21,pilhoek:20,rad:'食',jawonElement:'수'}
    ],
    '귀': [
      {ch:'貴',meaning:'높을',strokes:12,pilhoek:12,rad:'貝',jawonElement:'금'},
      {ch:'句',meaning:'글귀',strokes:5,pilhoek:5,rad:'口',jawonElement:null},
      {ch:'歸',meaning:'돌아올',strokes:18,pilhoek:18,rad:'止',jawonElement:'토'},
      {ch:'龜',meaning:'거북',strokes:16,pilhoek:17,rad:'龜',jawonElement:'수'},
      {ch:'晷',meaning:'시각',strokes:12,pilhoek:12,rad:'日',jawonElement:null}
    ],
    '균': [
      {ch:'均',meaning:'고를',strokes:7,pilhoek:7,rad:'土',jawonElement:'토'},
      {ch:'菌',meaning:'버섯',strokes:14,pilhoek:11,rad:'艸',jawonElement:'목'},
      {ch:'龜',meaning:'틀',strokes:16,pilhoek:17,rad:'龜',jawonElement:'수'},
      {ch:'鈞',meaning:'서른 근',strokes:12,pilhoek:12,rad:'金',jawonElement:'금'},
      {ch:'筠',meaning:'속빈 대',strokes:13,pilhoek:13,rad:'竹',jawonElement:'목'},
      {ch:'勻',meaning:'고를',strokes:4,pilhoek:4,rad:'勹',jawonElement:null},
      {ch:'畇',meaning:'밭개간할',strokes:9,pilhoek:9,rad:'田',jawonElement:null}
    ],
    '귤': [
      {ch:'橘',meaning:'귤나무',strokes:16,pilhoek:16,rad:'木',jawonElement:'목'}
    ],
    '극': [
      {ch:'極',meaning:'가운데',strokes:13,pilhoek:12,rad:'木',jawonElement:'목'},
      {ch:'克',meaning:'이길',strokes:7,pilhoek:7,rad:'儿',jawonElement:null},
      {ch:'劇',meaning:'심할',strokes:15,pilhoek:15,rad:'刀',jawonElement:'금'},
      {ch:'隙',meaning:'틈',strokes:18,pilhoek:12,rad:'阜',jawonElement:'토'},
      {ch:'棘',meaning:'가시나무',strokes:12,pilhoek:12,rad:'木',jawonElement:'목'},
      {ch:'戟',meaning:'갈래진 창',strokes:12,pilhoek:12,rad:'戈',jawonElement:null},
      {ch:'剋',meaning:'깍일',strokes:9,pilhoek:9,rad:'刀',jawonElement:'금'}
    ],
    '글': [
      {ch:'契',meaning:'부족 이름',strokes:9,pilhoek:9,rad:'大',jawonElement:null}
    ],
    '급': [
      {ch:'給',meaning:'넉넉할',strokes:12,pilhoek:12,rad:'糸',jawonElement:'목'},
      {ch:'級',meaning:'등급',strokes:10,pilhoek:9,rad:'糸',jawonElement:'목'},
      {ch:'汲',meaning:'길을',strokes:8,pilhoek:6,rad:'水',jawonElement:'수'},
      {ch:'伋',meaning:'생각할',strokes:6,pilhoek:5,rad:'人',jawonElement:'화'}
    ],
    '긍': [
      {ch:'肯',meaning:'옳이 여길',strokes:10,pilhoek:8,rad:'肉',jawonElement:null},
      {ch:'兢',meaning:'삼갈',strokes:14,pilhoek:14,rad:'儿',jawonElement:null},
      {ch:'矜',meaning:'자랑할',strokes:9,pilhoek:9,rad:'矛',jawonElement:'금'},
      {ch:'亘',meaning:'뻗칠',strokes:6,pilhoek:6,rad:'二',jawonElement:null}
    ],
    '긴': [
      {ch:'緊',meaning:'굳게 얽힐',strokes:14,pilhoek:14,rad:'糸',jawonElement:'목'}
    ],
    '끽': [
      {ch:'喫',meaning:'마실',strokes:12,pilhoek:12,rad:'口',jawonElement:null}
    ],
    '낙': [
      {ch:'樂',meaning:'즐길',strokes:15,pilhoek:15,rad:'木',jawonElement:'목'},
      {ch:'諾',meaning:'대답할',strokes:16,pilhoek:15,rad:'言',jawonElement:'금'},
      {ch:'洛',meaning:'강 이름',strokes:10,pilhoek:9,rad:'水',jawonElement:'수'},
      {ch:'駱',meaning:'낙타',strokes:16,pilhoek:16,rad:'馬',jawonElement:'화'},
      {ch:'烙',meaning:'지질',strokes:10,pilhoek:10,rad:'火',jawonElement:'화'},
      {ch:'酪',meaning:'타락',strokes:13,pilhoek:13,rad:'酉',jawonElement:null},
      {ch:'珞',meaning:'구슬 목걸이',strokes:11,pilhoek:10,rad:'玉',jawonElement:'금'}
    ],
    '난': [
      {ch:'蘭',meaning:'난초',strokes:23,pilhoek:20,rad:'艸',jawonElement:'목'},
      {ch:'難',meaning:'어려울',strokes:19,pilhoek:19,rad:'隹',jawonElement:'화'},
      {ch:'暖',meaning:'따뜻할',strokes:13,pilhoek:13,rad:'日',jawonElement:null},
      {ch:'欄',meaning:'난간',strokes:21,pilhoek:21,rad:'木',jawonElement:'목'},
      {ch:'爛',meaning:'문드러질',strokes:21,pilhoek:21,rad:'火',jawonElement:'화'},
      {ch:'鸞',meaning:'난새',strokes:30,pilhoek:30,rad:'鳥',jawonElement:'화'},
      {ch:'煖',meaning:'따뜻할',strokes:13,pilhoek:13,rad:'火',jawonElement:'화'}
    ],
    '날': [
      {ch:'捺',meaning:'누를',strokes:12,pilhoek:11,rad:'手',jawonElement:'목'},
      {ch:'捏',meaning:'이길',strokes:11,pilhoek:10,rad:'手',jawonElement:'목'}
    ],
    '납': [
      {ch:'納',meaning:'바칠',strokes:10,pilhoek:10,rad:'糸',jawonElement:'목'},
      {ch:'拉',meaning:'꺽을',strokes:9,pilhoek:8,rad:'手',jawonElement:'목'},
      {ch:'臘',meaning:'납향',strokes:21,pilhoek:19,rad:'肉',jawonElement:null},
      {ch:'蠟',meaning:'밀',strokes:21,pilhoek:21,rad:'虫',jawonElement:'수'},
      {ch:'衲',meaning:'장삼',strokes:10,pilhoek:9,rad:'衣',jawonElement:'목'}
    ],
    '낭': [
      {ch:'浪',meaning:'물결',strokes:11,pilhoek:10,rad:'水',jawonElement:'수'},
      {ch:'娘',meaning:'아가씨',strokes:10,pilhoek:10,rad:'女',jawonElement:'토'},
      {ch:'廊',meaning:'복도',strokes:13,pilhoek:11,rad:'广',jawonElement:'목'},
      {ch:'狼',meaning:'이리',strokes:11,pilhoek:10,rad:'犬',jawonElement:null},
      {ch:'囊',meaning:'주머니',strokes:22,pilhoek:22,rad:'口',jawonElement:null},
      {ch:'朗',meaning:'밝을',strokes:11,pilhoek:10,rad:'月',jawonElement:'수'}
    ],
    '내': [
      {ch:'內',meaning:'안',strokes:4,pilhoek:4,rad:'入',jawonElement:null},
      {ch:'來',meaning:'올',strokes:8,pilhoek:8,rad:'人',jawonElement:'화'},
      {ch:'乃',meaning:'이에',strokes:2,pilhoek:2,rad:'丿',jawonElement:null},
      {ch:'耐',meaning:'견딜',strokes:9,pilhoek:9,rad:'而',jawonElement:'수'},
      {ch:'奈',meaning:'어찌',strokes:8,pilhoek:8,rad:'大',jawonElement:null},
      {ch:'柰',meaning:'능금나무',strokes:9,pilhoek:9,rad:'木',jawonElement:'목'}
    ],
    '냉': [
      {ch:'冷',meaning:'차가울',strokes:7,pilhoek:7,rad:'冫',jawonElement:'수'}
    ],
    '녀': [
      {ch:'女',meaning:'계집',strokes:3,pilhoek:3,rad:'女',jawonElement:'토'}
    ],
    '년': [
      {ch:'年',meaning:'해',strokes:6,pilhoek:6,rad:'干',jawonElement:'목'},
      {ch:'撚',meaning:'비틀',strokes:16,pilhoek:15,rad:'手',jawonElement:'목'},
      {ch:'秊',meaning:'해',strokes:8,pilhoek:8,rad:'禾',jawonElement:'목'}
    ],
    '념': [
      {ch:'念',meaning:'생각',strokes:8,pilhoek:8,rad:'心',jawonElement:'화'},
      {ch:'恬',meaning:'편안할',strokes:10,pilhoek:9,rad:'心',jawonElement:'화'},
      {ch:'拈',meaning:'집을',strokes:9,pilhoek:8,rad:'手',jawonElement:'목'},
      {ch:'捻',meaning:'비틀',strokes:12,pilhoek:11,rad:'手',jawonElement:'목'}
    ],
    '녕': [
      {ch:'寧',meaning:'편안할',strokes:14,pilhoek:14,rad:'宀',jawonElement:null},
      {ch:'寗',meaning:'편안할',strokes:13,pilhoek:13,rad:'宀',jawonElement:null}
    ],
    '녹': [
      {ch:'綠',meaning:'초록빛',strokes:14,pilhoek:14,rad:'糸',jawonElement:'목'},
      {ch:'錄',meaning:'기록할',strokes:16,pilhoek:16,rad:'金',jawonElement:'금'},
      {ch:'祿',meaning:'행복',strokes:13,pilhoek:12,rad:'示',jawonElement:null},
      {ch:'鹿',meaning:'사슴',strokes:11,pilhoek:11,rad:'鹿',jawonElement:'토'},
      {ch:'碌',meaning:'푸른 빛',strokes:13,pilhoek:13,rad:'石',jawonElement:'금'},
      {ch:'菉',meaning:'조개풀',strokes:14,pilhoek:11,rad:'艸',jawonElement:'목'}
    ],
    '논': [
      {ch:'論',meaning:'말할',strokes:15,pilhoek:15,rad:'言',jawonElement:'금'}
    ],
    '농': [
      {ch:'農',meaning:'농사',strokes:13,pilhoek:13,rad:'辰',jawonElement:'토'},
      {ch:'籠',meaning:'대그릇',strokes:22,pilhoek:22,rad:'竹',jawonElement:'목'},
      {ch:'濃',meaning:'짙을',strokes:17,pilhoek:16,rad:'水',jawonElement:'수'},
      {ch:'膿',meaning:'고름',strokes:19,pilhoek:17,rad:'肉',jawonElement:null},
      {ch:'壟',meaning:'밭두둑',strokes:19,pilhoek:19,rad:'土',jawonElement:'토'}
    ],
    '뇌': [
      {ch:'雷',meaning:'우뢰',strokes:13,pilhoek:13,rad:'雨',jawonElement:'수'},
      {ch:'腦',meaning:'머리',strokes:15,pilhoek:13,rad:'肉',jawonElement:null},
      {ch:'惱',meaning:'괴로워할',strokes:13,pilhoek:12,rad:'心',jawonElement:'화'},
      {ch:'賂',meaning:'뇌물',strokes:13,pilhoek:13,rad:'貝',jawonElement:'금'},
      {ch:'牢',meaning:'가축우리',strokes:7,pilhoek:7,rad:'牛',jawonElement:'토'},
      {ch:'磊',meaning:'돌무더기',strokes:15,pilhoek:15,rad:'石',jawonElement:'금'}
    ],
    '뇨': [
      {ch:'溺',meaning:'우줌눌',strokes:14,pilhoek:13,rad:'水',jawonElement:'수'},
      {ch:'鬧',meaning:'시끄러울',strokes:15,pilhoek:15,rad:'鬥',jawonElement:'금'}
    ],
    '누': [
      {ch:'樓',meaning:'다락',strokes:15,pilhoek:15,rad:'木',jawonElement:'목'},
      {ch:'漏',meaning:'샐',strokes:15,pilhoek:14,rad:'水',jawonElement:'수'},
      {ch:'累',meaning:'포갤',strokes:11,pilhoek:11,rad:'糸',jawonElement:'목'},
      {ch:'屢',meaning:'창',strokes:14,pilhoek:14,rad:'尸',jawonElement:null},
      {ch:'陋',meaning:'줍을',strokes:14,pilhoek:8,rad:'阜',jawonElement:'토'},
      {ch:'壘',meaning:'진',strokes:18,pilhoek:18,rad:'土',jawonElement:'토'},
      {ch:'縷',meaning:'자세할',strokes:17,pilhoek:17,rad:'糸',jawonElement:'목'}
    ],
    '눈': [
      {ch:'嫩',meaning:'언약할',strokes:14,pilhoek:14,rad:'女',jawonElement:'토'}
    ],
    '눌': [
      {ch:'訥',meaning:'말 더듬거릴',strokes:11,pilhoek:11,rad:'言',jawonElement:'금'}
    ],
    '뉴': [
      {ch:'紐',meaning:'잡색비단',strokes:10,pilhoek:10,rad:'糸',jawonElement:'목'},
      {ch:'杻',meaning:'옷 부드러울',strokes:8,pilhoek:8,rad:'木',jawonElement:'목'}
    ],
    '늑': [
      {ch:'肋',meaning:'갈비대',strokes:8,pilhoek:6,rad:'肉',jawonElement:null}
    ],
    '늠': [
      {ch:'凜',meaning:'찰',strokes:15,pilhoek:15,rad:'冫',jawonElement:'수'}
    ],
    '능': [
      {ch:'能',meaning:'능할',strokes:12,pilhoek:10,rad:'肉',jawonElement:null},
      {ch:'陵',meaning:'큰언덕',strokes:16,pilhoek:10,rad:'阜',jawonElement:'토'},
      {ch:'凌',meaning:'능가할',strokes:10,pilhoek:10,rad:'冫',jawonElement:'수'},
      {ch:'綾',meaning:'무늬 놓은 비단',strokes:14,pilhoek:14,rad:'糸',jawonElement:'목'},
      {ch:'稜',meaning:'모질',strokes:13,pilhoek:13,rad:'禾',jawonElement:'목'}
    ],
    '니': [
      {ch:'尼',meaning:'여승',strokes:5,pilhoek:5,rad:'尸',jawonElement:null}
    ],
    '단': [
      {ch:'段',meaning:'층계',strokes:9,pilhoek:9,rad:'殳',jawonElement:'금'},
      {ch:'單',meaning:'홀로',strokes:12,pilhoek:12,rad:'口',jawonElement:null},
      {ch:'短',meaning:'짧을',strokes:12,pilhoek:12,rad:'矢',jawonElement:'금'},
      {ch:'端',meaning:'끝',strokes:14,pilhoek:14,rad:'立',jawonElement:null},
      {ch:'但',meaning:'다만',strokes:7,pilhoek:7,rad:'人',jawonElement:'화'},
      {ch:'丹',meaning:'붉을',strokes:4,pilhoek:4,rad:'丶',jawonElement:null},
      {ch:'斷',meaning:'끊을',strokes:18,pilhoek:18,rad:'斤',jawonElement:null},
      {ch:'團',meaning:'둥글',strokes:14,pilhoek:14,rad:'囗',jawonElement:null}
    ],
    '달': [
      {ch:'達',meaning:'통달할',strokes:16,pilhoek:12,rad:'辵',jawonElement:'토'},
      {ch:'撻',meaning:'매질할',strokes:17,pilhoek:15,rad:'手',jawonElement:'목'},
      {ch:'疸',meaning:'황달',strokes:10,pilhoek:10,rad:'疒',jawonElement:'수'}
    ],
    '담': [
      {ch:'談',meaning:'말씀',strokes:15,pilhoek:15,rad:'言',jawonElement:'금'},
      {ch:'擔',meaning:'질',strokes:17,pilhoek:16,rad:'手',jawonElement:'목'},
      {ch:'淡',meaning:'물모양',strokes:12,pilhoek:11,rad:'水',jawonElement:'수'},
      {ch:'潭',meaning:'깊을',strokes:16,pilhoek:15,rad:'水',jawonElement:'수'},
      {ch:'膽',meaning:'쓸개',strokes:19,pilhoek:17,rad:'肉',jawonElement:null},
      {ch:'譚',meaning:'클',strokes:19,pilhoek:19,rad:'言',jawonElement:'금'},
      {ch:'痰',meaning:'가래',strokes:13,pilhoek:13,rad:'疒',jawonElement:'수'},
      {ch:'澹',meaning:'맑을',strokes:17,pilhoek:16,rad:'水',jawonElement:'수'}
    ],
    '답': [
      {ch:'答',meaning:'대답',strokes:12,pilhoek:12,rad:'竹',jawonElement:'목'},
      {ch:'踏',meaning:'떨어지는 소리',strokes:15,pilhoek:15,rad:'足',jawonElement:'토'},
      {ch:'畓',meaning:'논',strokes:9,pilhoek:9,rad:'田',jawonElement:null},
      {ch:'遝',meaning:'가다가설',strokes:17,pilhoek:13,rad:'辵',jawonElement:'토'},
      {ch:'沓',meaning:'거듭',strokes:8,pilhoek:8,rad:'水',jawonElement:'수'}
    ],
    '당': [
      {ch:'唐',meaning:'당나라',strokes:10,pilhoek:10,rad:'口',jawonElement:null},
      {ch:'堂',meaning:'집',strokes:11,pilhoek:11,rad:'土',jawonElement:'토'},
      {ch:'當',meaning:'마땅할',strokes:13,pilhoek:13,rad:'田',jawonElement:null},
      {ch:'黨',meaning:'무리',strokes:20,pilhoek:20,rad:'黑',jawonElement:'수'},
      {ch:'糖',meaning:'엿',strokes:16,pilhoek:16,rad:'米',jawonElement:'목'},
      {ch:'塘',meaning:'연못',strokes:13,pilhoek:13,rad:'土',jawonElement:'토'},
      {ch:'撞',meaning:'두드릴',strokes:16,pilhoek:15,rad:'手',jawonElement:'목'},
      {ch:'棠',meaning:'아가위',strokes:12,pilhoek:12,rad:'木',jawonElement:'목'}
    ],
    '댁': [
      {ch:'宅',meaning:'집',strokes:6,pilhoek:6,rad:'宀',jawonElement:null}
    ],
    '독': [
      {ch:'讀',meaning:'읽을',strokes:22,pilhoek:22,rad:'言',jawonElement:'금'},
      {ch:'獨',meaning:'홀로',strokes:17,pilhoek:16,rad:'犬',jawonElement:null},
      {ch:'毒',meaning:'독',strokes:8,pilhoek:9,rad:'毋',jawonElement:null},
      {ch:'篤',meaning:'도타울',strokes:16,pilhoek:16,rad:'竹',jawonElement:'목'},
      {ch:'瀆',meaning:'도랑',strokes:19,pilhoek:18,rad:'水',jawonElement:'수'},
      {ch:'禿',meaning:'벗어진',strokes:7,pilhoek:7,rad:'禾',jawonElement:'목'},
      {ch:'牘',meaning:'편지',strokes:19,pilhoek:19,rad:'片',jawonElement:'목'},
      {ch:'犢',meaning:'송아지',strokes:19,pilhoek:19,rad:'牛',jawonElement:'토'}
    ],
    '돈': [
      {ch:'敦',meaning:'도타울',strokes:12,pilhoek:12,rad:'攴',jawonElement:'금'},
      {ch:'頓',meaning:'조아릴',strokes:13,pilhoek:13,rad:'頁',jawonElement:'화'},
      {ch:'惇',meaning:'두터울',strokes:12,pilhoek:11,rad:'心',jawonElement:'화'},
      {ch:'沌',meaning:'기름 덩어리',strokes:8,pilhoek:7,rad:'水',jawonElement:'수'},
      {ch:'燉',meaning:'불 성할',strokes:16,pilhoek:16,rad:'火',jawonElement:'화'},
      {ch:'旽',meaning:'늘 돋을',strokes:8,pilhoek:8,rad:'日',jawonElement:null},
      {ch:'暾',meaning:'아침해',strokes:16,pilhoek:16,rad:'日',jawonElement:null},
      {ch:'墩',meaning:'돈대',strokes:15,pilhoek:15,rad:'土',jawonElement:'토'}
    ],
    '돌': [
      {ch:'突',meaning:'부딪칠',strokes:9,pilhoek:9,rad:'穴',jawonElement:'수'},
      {ch:'乭',meaning:'이름',strokes:6,pilhoek:6,rad:'乙',jawonElement:null}
    ],
    '두': [
      {ch:'頭',meaning:'머리',strokes:16,pilhoek:16,rad:'頁',jawonElement:'화'},
      {ch:'讀',meaning:'구절',strokes:22,pilhoek:22,rad:'言',jawonElement:'금'},
      {ch:'斗',meaning:'말',strokes:4,pilhoek:4,rad:'斗',jawonElement:'화'},
      {ch:'豆',meaning:'콩',strokes:7,pilhoek:7,rad:'豆',jawonElement:null},
      {ch:'杜',meaning:'막을',strokes:7,pilhoek:7,rad:'木',jawonElement:'목'},
      {ch:'兜',meaning:'투구',strokes:11,pilhoek:11,rad:'儿',jawonElement:null},
      {ch:'痘',meaning:'마마',strokes:12,pilhoek:12,rad:'疒',jawonElement:'수'},
      {ch:'竇',meaning:'구멍',strokes:20,pilhoek:20,rad:'穴',jawonElement:'수'}
    ],
    '둔': [
      {ch:'鈍',meaning:'무딜',strokes:12,pilhoek:12,rad:'金',jawonElement:'금'},
      {ch:'屯',meaning:'진칠',strokes:4,pilhoek:4,rad:'屮',jawonElement:'목'},
      {ch:'遁',meaning:'달아날',strokes:16,pilhoek:12,rad:'辵',jawonElement:'토'},
      {ch:'芚',meaning:'채소 이름',strokes:10,pilhoek:7,rad:'艸',jawonElement:'목'},
      {ch:'遯',meaning:'달아날',strokes:18,pilhoek:14,rad:'辵',jawonElement:'토'}
    ],
    '득': [
      {ch:'得',meaning:'얻을',strokes:11,pilhoek:11,rad:'彳',jawonElement:'화'}
    ],
    '등': [
      {ch:'等',meaning:'가지런할',strokes:12,pilhoek:12,rad:'竹',jawonElement:'목'},
      {ch:'登',meaning:'오를',strokes:12,pilhoek:12,rad:'癶',jawonElement:null},
      {ch:'燈',meaning:'등잔',strokes:16,pilhoek:16,rad:'火',jawonElement:'화'},
      {ch:'騰',meaning:'오를',strokes:20,pilhoek:20,rad:'馬',jawonElement:'화'},
      {ch:'藤',meaning:'등나무',strokes:21,pilhoek:18,rad:'艸',jawonElement:'목'},
      {ch:'鄧',meaning:'나라 이름',strokes:19,pilhoek:14,rad:'邑',jawonElement:'토'},
      {ch:'嶝',meaning:'고개',strokes:15,pilhoek:15,rad:'山',jawonElement:'토'},
      {ch:'謄',meaning:'베낄',strokes:17,pilhoek:17,rad:'言',jawonElement:'금'}
    ],
    '락': [
      {ch:'樂',meaning:'즐거울',strokes:15,pilhoek:15,rad:'木',jawonElement:'목'},
      {ch:'諾',meaning:'대답할',strokes:16,pilhoek:15,rad:'言',jawonElement:'금'},
      {ch:'絡',meaning:'헌솜',strokes:12,pilhoek:12,rad:'糸',jawonElement:'목'},
      {ch:'洛',meaning:'강이름',strokes:10,pilhoek:9,rad:'水',jawonElement:'수'},
      {ch:'駱',meaning:'낙타',strokes:16,pilhoek:16,rad:'馬',jawonElement:'화'},
      {ch:'烙',meaning:'지질',strokes:10,pilhoek:10,rad:'火',jawonElement:'화'},
      {ch:'酪',meaning:'진한 유즙',strokes:13,pilhoek:13,rad:'酉',jawonElement:null},
      {ch:'珞',meaning:'구슬 목걸이',strokes:11,pilhoek:10,rad:'玉',jawonElement:'금'}
    ],
    '란': [
      {ch:'蘭',meaning:'난초',strokes:23,pilhoek:20,rad:'艸',jawonElement:'목'},
      {ch:'丹',meaning:'붉을',strokes:4,pilhoek:4,rad:'丶',jawonElement:null},
      {ch:'欄',meaning:'난간',strokes:21,pilhoek:21,rad:'木',jawonElement:'목'},
      {ch:'爛',meaning:'문드러질',strokes:21,pilhoek:21,rad:'火',jawonElement:'화'},
      {ch:'鸞',meaning:'난새',strokes:30,pilhoek:30,rad:'鳥',jawonElement:'화'},
      {ch:'瀾',meaning:'물결',strokes:21,pilhoek:20,rad:'水',jawonElement:'수'},
      {ch:'欒',meaning:'나무 이름',strokes:23,pilhoek:23,rad:'木',jawonElement:'목'}
    ],
    '랄': [
      {ch:'剌',meaning:'어그러질',strokes:9,pilhoek:9,rad:'刀',jawonElement:'금'},
      {ch:'辣',meaning:'매울',strokes:14,pilhoek:14,rad:'辛',jawonElement:'금'},
      {ch:'喇',meaning:'말굽히할',strokes:12,pilhoek:12,rad:'口',jawonElement:null}
    ],
    '람': [
      {ch:'覽',meaning:'볼',strokes:21,pilhoek:21,rad:'見',jawonElement:'화'},
      {ch:'藍',meaning:'쪽',strokes:20,pilhoek:17,rad:'艸',jawonElement:'목'},
      {ch:'籃',meaning:'바구니',strokes:20,pilhoek:20,rad:'竹',jawonElement:'목'},
      {ch:'攬',meaning:'잡을',strokes:25,pilhoek:24,rad:'手',jawonElement:'목'},
      {ch:'纜',meaning:'닻줄',strokes:27,pilhoek:27,rad:'糸',jawonElement:'목'},
      {ch:'欖',meaning:'감람나무',strokes:25,pilhoek:25,rad:'木',jawonElement:'목'},
      {ch:'擥',meaning:'잡아다릴',strokes:18,pilhoek:18,rad:'手',jawonElement:'목'}
    ],
    '랍': [
      {ch:'拉',meaning:'꺽을',strokes:9,pilhoek:8,rad:'手',jawonElement:'목'},
      {ch:'臘',meaning:'납향',strokes:21,pilhoek:19,rad:'肉',jawonElement:null},
      {ch:'蠟',meaning:'밀',strokes:21,pilhoek:21,rad:'虫',jawonElement:'수'}
    ],
    '랑': [
      {ch:'郞',meaning:'사나이',strokes:14,pilhoek:9,rad:'邑',jawonElement:'토'},
      {ch:'浪',meaning:'물결',strokes:11,pilhoek:10,rad:'水',jawonElement:'수'},
      {ch:'廊',meaning:'복도',strokes:13,pilhoek:11,rad:'广',jawonElement:'목'},
      {ch:'狼',meaning:'이리',strokes:11,pilhoek:10,rad:'犬',jawonElement:null},
      {ch:'朗',meaning:'밝을',strokes:11,pilhoek:10,rad:'月',jawonElement:'수'},
      {ch:'琅',meaning:'옥 이름',strokes:12,pilhoek:11,rad:'玉',jawonElement:'금'},
      {ch:'螂',meaning:'버마재비',strokes:16,pilhoek:14,rad:'虫',jawonElement:'수'},
      {ch:'瑯',meaning:'고을 이름',strokes:15,pilhoek:12,rad:'玉',jawonElement:'금'}
    ],
    '래': [
      {ch:'來',meaning:'올',strokes:8,pilhoek:8,rad:'人',jawonElement:'화'},
      {ch:'萊',meaning:'명아주',strokes:14,pilhoek:11,rad:'艸',jawonElement:'목'},
      {ch:'崍',meaning:'산 이름',strokes:11,pilhoek:11,rad:'山',jawonElement:'토'},
      {ch:'徠',meaning:'올',strokes:11,pilhoek:11,rad:'彳',jawonElement:'화'}
    ],
    '랭': [
      {ch:'冷',meaning:'찰',strokes:7,pilhoek:7,rad:'冫',jawonElement:'수'}
    ],
    '략': [
      {ch:'略',meaning:'다스릴',strokes:11,pilhoek:11,rad:'田',jawonElement:null},
      {ch:'掠',meaning:'노략질할',strokes:12,pilhoek:11,rad:'手',jawonElement:'목'}
    ],
    '량': [
      {ch:'梁',meaning:'푸조나무',strokes:11,pilhoek:11,rad:'木',jawonElement:'목'},
      {ch:'兩',meaning:'두',strokes:8,pilhoek:8,rad:'入',jawonElement:null},
      {ch:'良',meaning:'좋을',strokes:7,pilhoek:7,rad:'艮',jawonElement:'토'},
      {ch:'量',meaning:'헤아릴',strokes:12,pilhoek:12,rad:'里',jawonElement:null},
      {ch:'凉',meaning:'서늘할',strokes:10,pilhoek:10,rad:'冫',jawonElement:'수'},
      {ch:'糧',meaning:'양식',strokes:18,pilhoek:18,rad:'米',jawonElement:'목'},
      {ch:'諒',meaning:'믿을',strokes:15,pilhoek:15,rad:'言',jawonElement:'금'},
      {ch:'亮',meaning:'밝을',strokes:9,pilhoek:9,rad:'亠',jawonElement:null}
    ],
    '력': [
      {ch:'力',meaning:'힘',strokes:2,pilhoek:2,rad:'力',jawonElement:null},
      {ch:'歷',meaning:'지낼',strokes:16,pilhoek:16,rad:'止',jawonElement:'토'},
      {ch:'曆',meaning:'책력',strokes:16,pilhoek:16,rad:'日',jawonElement:null},
      {ch:'瀝',meaning:'거를',strokes:20,pilhoek:19,rad:'水',jawonElement:'수'},
      {ch:'礫',meaning:'조약돌',strokes:20,pilhoek:20,rad:'石',jawonElement:'금'},
      {ch:'轢',meaning:'삐걱거릴',strokes:22,pilhoek:22,rad:'車',jawonElement:'화'},
      {ch:'靂',meaning:'벼락',strokes:24,pilhoek:24,rad:'雨',jawonElement:'수'}
    ],
    '련': [
      {ch:'連',meaning:'잇닿을',strokes:14,pilhoek:10,rad:'辵',jawonElement:'토'},
      {ch:'練',meaning:'익힐',strokes:15,pilhoek:15,rad:'糸',jawonElement:'목'},
      {ch:'鍊',meaning:'불릴',strokes:17,pilhoek:17,rad:'金',jawonElement:'금'},
      {ch:'憐',meaning:'가련할',strokes:16,pilhoek:15,rad:'心',jawonElement:'화'},
      {ch:'戀',meaning:'사모할',strokes:23,pilhoek:23,rad:'心',jawonElement:'화'},
      {ch:'聯',meaning:'잇달',strokes:17,pilhoek:17,rad:'耳',jawonElement:'화'},
      {ch:'蓮',meaning:'연밥',strokes:17,pilhoek:13,rad:'艸',jawonElement:'목'},
      {ch:'漣',meaning:'물놀이',strokes:15,pilhoek:13,rad:'水',jawonElement:'수'}
    ],
    '렬': [
      {ch:'列',meaning:'줄',strokes:6,pilhoek:6,rad:'刀',jawonElement:'금'},
      {ch:'烈',meaning:'세찰',strokes:10,pilhoek:10,rad:'火',jawonElement:'화'},
      {ch:'劣',meaning:'못할',strokes:6,pilhoek:6,rad:'力',jawonElement:null},
      {ch:'冽',meaning:'찰',strokes:8,pilhoek:8,rad:'冫',jawonElement:'수'},
      {ch:'洌',meaning:'맑을',strokes:10,pilhoek:9,rad:'水',jawonElement:'수'}
    ],
    '렴': [
      {ch:'廉',meaning:'청렴할',strokes:13,pilhoek:13,rad:'广',jawonElement:'목'},
      {ch:'濂',meaning:'내 이름',strokes:17,pilhoek:16,rad:'水',jawonElement:'수'},
      {ch:'斂',meaning:'거둘',strokes:17,pilhoek:17,rad:'攴',jawonElement:'금'},
      {ch:'殮',meaning:'염할',strokes:17,pilhoek:17,rad:'歹',jawonElement:'수'}
    ],
    '렵': [
      {ch:'獵',meaning:'사냥',strokes:19,pilhoek:18,rad:'犬',jawonElement:null}
    ],
    '령': [
      {ch:'玲',meaning:'옥이름',strokes:10,pilhoek:9,rad:'玉',jawonElement:'금'},
      {ch:'令',meaning:'명령',strokes:5,pilhoek:5,rad:'人',jawonElement:'화'},
      {ch:'領',meaning:'옷깃',strokes:14,pilhoek:14,rad:'頁',jawonElement:'화'},
      {ch:'寧',meaning:'편안할',strokes:14,pilhoek:14,rad:'宀',jawonElement:null},
      {ch:'靈',meaning:'신령',strokes:24,pilhoek:24,rad:'雨',jawonElement:'수'},
      {ch:'嶺',meaning:'산고개',strokes:17,pilhoek:17,rad:'山',jawonElement:'토'},
      {ch:'零',meaning:'조용히 오는 비',strokes:13,pilhoek:13,rad:'雨',jawonElement:'수'},
      {ch:'鈴',meaning:'방울',strokes:13,pilhoek:13,rad:'金',jawonElement:'금'}
    ],
    '례': [
      {ch:'禮',meaning:'예도',strokes:18,pilhoek:17,rad:'示',jawonElement:null},
      {ch:'例',meaning:'법식',strokes:8,pilhoek:8,rad:'人',jawonElement:'화'},
      {ch:'隷',meaning:'붙을',strokes:17,pilhoek:16,rad:'隶',jawonElement:'수'},
      {ch:'醴',meaning:'단술',strokes:20,pilhoek:20,rad:'酉',jawonElement:null},
      {ch:'澧',meaning:'강 이름',strokes:17,pilhoek:16,rad:'水',jawonElement:'수'}
    ],
    '록': [
      {ch:'綠',meaning:'초록빛',strokes:14,pilhoek:14,rad:'糸',jawonElement:'목'},
      {ch:'錄',meaning:'기록할',strokes:16,pilhoek:16,rad:'金',jawonElement:'금'},
      {ch:'祿',meaning:'복',strokes:13,pilhoek:12,rad:'示',jawonElement:null},
      {ch:'鹿',meaning:'사슴',strokes:11,pilhoek:11,rad:'鹿',jawonElement:'토'},
      {ch:'麓',meaning:'신기슭',strokes:19,pilhoek:19,rad:'鹿',jawonElement:'토'},
      {ch:'碌',meaning:'돌 모양',strokes:13,pilhoek:13,rad:'石',jawonElement:'금'},
      {ch:'菉',meaning:'조개풀',strokes:14,pilhoek:11,rad:'艸',jawonElement:'목'}
    ],
    '론': [
      {ch:'論',meaning:'말할',strokes:15,pilhoek:15,rad:'言',jawonElement:'금'}
    ],
    '롱': [
      {ch:'籠',meaning:'대그릇',strokes:22,pilhoek:22,rad:'竹',jawonElement:'목'},
      {ch:'壟',meaning:'언덕',strokes:19,pilhoek:19,rad:'土',jawonElement:'토'},
      {ch:'瓏',meaning:'환할',strokes:21,pilhoek:20,rad:'玉',jawonElement:'금'},
      {ch:'朧',meaning:'흐릿할',strokes:20,pilhoek:20,rad:'月',jawonElement:'수'},
      {ch:'瀧',meaning:'적실',strokes:20,pilhoek:19,rad:'水',jawonElement:'수'}
    ],
    '뢰': [
      {ch:'雷',meaning:'우뢰',strokes:13,pilhoek:13,rad:'雨',jawonElement:'수'},
      {ch:'賴',meaning:'힘 입을',strokes:16,pilhoek:16,rad:'貝',jawonElement:'금'},
      {ch:'賂',meaning:'뇌물 줄',strokes:13,pilhoek:13,rad:'貝',jawonElement:'금'},
      {ch:'儡',meaning:'영락할',strokes:17,pilhoek:17,rad:'人',jawonElement:'화'},
      {ch:'牢',meaning:'우리',strokes:7,pilhoek:7,rad:'牛',jawonElement:'토'},
      {ch:'磊',meaning:'돌무더기',strokes:15,pilhoek:15,rad:'石',jawonElement:'금'},
      {ch:'賚',meaning:'줄',strokes:15,pilhoek:15,rad:'貝',jawonElement:'금'},
      {ch:'瀨',meaning:'여울',strokes:20,pilhoek:19,rad:'水',jawonElement:'수'}
    ],
    '료': [
      {ch:'料',meaning:'되질할',strokes:10,pilhoek:10,rad:'斗',jawonElement:'화'},
      {ch:'了',meaning:'마칠',strokes:2,pilhoek:2,rad:'亅',jawonElement:null},
      {ch:'僚',meaning:'동료',strokes:14,pilhoek:14,rad:'人',jawonElement:'화'},
      {ch:'遼',meaning:'멀',strokes:19,pilhoek:15,rad:'辵',jawonElement:'토'},
      {ch:'療',meaning:'병고칠',strokes:17,pilhoek:17,rad:'疒',jawonElement:'수'},
      {ch:'聊',meaning:'귀 울',strokes:11,pilhoek:11,rad:'耳',jawonElement:'화'},
      {ch:'寮',meaning:'벼슬아쳐',strokes:15,pilhoek:15,rad:'宀',jawonElement:null},
      {ch:'燎',meaning:'화톳불',strokes:16,pilhoek:16,rad:'火',jawonElement:'화'}
    ],
    '룡': [
      {ch:'龍',meaning:'용',strokes:16,pilhoek:16,rad:'龍',jawonElement:'토'}
    ],
    '루': [
      {ch:'樓',meaning:'다락',strokes:15,pilhoek:15,rad:'木',jawonElement:'목'},
      {ch:'漏',meaning:'샐',strokes:15,pilhoek:14,rad:'水',jawonElement:'수'},
      {ch:'屢',meaning:'창',strokes:14,pilhoek:14,rad:'尸',jawonElement:null},
      {ch:'陋',meaning:'줍을',strokes:14,pilhoek:8,rad:'阜',jawonElement:'토'},
      {ch:'壘',meaning:'진',strokes:18,pilhoek:18,rad:'土',jawonElement:'토'},
      {ch:'縷',meaning:'실',strokes:17,pilhoek:17,rad:'糸',jawonElement:'목'},
      {ch:'婁',meaning:'별 이름',strokes:11,pilhoek:11,rad:'女',jawonElement:'토'},
      {ch:'鏤',meaning:'새길',strokes:19,pilhoek:19,rad:'金',jawonElement:'금'}
    ],
    '륙': [
      {ch:'陸',meaning:'뭍',strokes:16,pilhoek:10,rad:'阜',jawonElement:'토'},
      {ch:'六',meaning:'여섯',strokes:6,pilhoek:4,rad:null,jawonElement:null}
    ],
    '륜': [
      {ch:'倫',meaning:'인륜',strokes:10,pilhoek:10,rad:'人',jawonElement:'화'},
      {ch:'輪',meaning:'바퀴',strokes:15,pilhoek:15,rad:'車',jawonElement:'화'},
      {ch:'崙',meaning:'산 이름',strokes:11,pilhoek:11,rad:'山',jawonElement:'토'},
      {ch:'綸',meaning:'낚싯줄',strokes:14,pilhoek:14,rad:'糸',jawonElement:'목'},
      {ch:'淪',meaning:'물놀이',strokes:12,pilhoek:11,rad:'水',jawonElement:'수'},
      {ch:'侖',meaning:'둥글',strokes:8,pilhoek:8,rad:'人',jawonElement:'화'}
    ],
    '률': [
      {ch:'律',meaning:'법',strokes:9,pilhoek:9,rad:'彳',jawonElement:'화'},
      {ch:'栗',meaning:'밤나무',strokes:10,pilhoek:10,rad:'木',jawonElement:'목'},
      {ch:'率',meaning:'헤아릴',strokes:11,pilhoek:11,rad:'玄',jawonElement:'수'},
      {ch:'慄',meaning:'두려워할',strokes:14,pilhoek:13,rad:'心',jawonElement:'화'}
    ],
    '륭': [
      {ch:'隆',meaning:'클',strokes:17,pilhoek:11,rad:'阜',jawonElement:'토'}
    ],
    '륵': [
      {ch:'肋',meaning:'갈비',strokes:8,pilhoek:6,rad:'肉',jawonElement:null}
    ],
    '름': [
      {ch:'凜',meaning:'찰',strokes:15,pilhoek:15,rad:'冫',jawonElement:'수'}
    ],
    '릉': [
      {ch:'陵',meaning:'큰 언덕',strokes:16,pilhoek:10,rad:'阜',jawonElement:'토'},
      {ch:'楞',meaning:'모',strokes:13,pilhoek:13,rad:'木',jawonElement:'목'},
      {ch:'凌',meaning:'능가할',strokes:10,pilhoek:10,rad:'冫',jawonElement:'수'},
      {ch:'綾',meaning:'비단',strokes:14,pilhoek:14,rad:'糸',jawonElement:'목'},
      {ch:'稜',meaning:'모',strokes:13,pilhoek:13,rad:'禾',jawonElement:'목'}
    ],
    '린': [
      {ch:'潾',meaning:'맑을',strokes:16,pilhoek:15,rad:'水',jawonElement:'수'},
      {ch:'隣',meaning:'이웃',strokes:20,pilhoek:14,rad:'阜',jawonElement:'토'},
      {ch:'麟',meaning:'기린',strokes:23,pilhoek:23,rad:'鹿',jawonElement:'토'},
      {ch:'鱗',meaning:'비늘',strokes:23,pilhoek:23,rad:'魚',jawonElement:'수'},
      {ch:'吝',meaning:'아낄',strokes:7,pilhoek:7,rad:'口',jawonElement:null},
      {ch:'躪',meaning:'짓밟을',strokes:27,pilhoek:26,rad:'足',jawonElement:'토'},
      {ch:'燐',meaning:'반딧불',strokes:16,pilhoek:16,rad:'火',jawonElement:'화'},
      {ch:'璘',meaning:'옥빛',strokes:17,pilhoek:16,rad:'玉',jawonElement:'금'}
    ],
    '림': [
      {ch:'林',meaning:'수풀',strokes:8,pilhoek:8,rad:'木',jawonElement:'목'},
      {ch:'琳',meaning:'아름다운 옥',strokes:13,pilhoek:12,rad:'玉',jawonElement:'금'},
      {ch:'臨',meaning:'임할',strokes:17,pilhoek:17,rad:'臣',jawonElement:null},
      {ch:'淋',meaning:'물뿌릴',strokes:12,pilhoek:11,rad:'水',jawonElement:'수'},
      {ch:'霖',meaning:'장마',strokes:16,pilhoek:16,rad:'雨',jawonElement:'수'}
    ],
    '립': [
      {ch:'立',meaning:'설',strokes:5,pilhoek:5,rad:'立',jawonElement:null},
      {ch:'笠',meaning:'우리',strokes:11,pilhoek:11,rad:'竹',jawonElement:'목'},
      {ch:'粒',meaning:'쌀알',strokes:11,pilhoek:11,rad:'米',jawonElement:'목'},
      {ch:'砬',meaning:'돌 소리',strokes:10,pilhoek:10,rad:'石',jawonElement:'금'}
    ],
    '막': [
      {ch:'莫',meaning:'말',strokes:13,pilhoek:10,rad:'艸',jawonElement:'목'},
      {ch:'幕',meaning:'막',strokes:14,pilhoek:13,rad:'巾',jawonElement:'목'},
      {ch:'漠',meaning:'사막',strokes:15,pilhoek:13,rad:'水',jawonElement:'수'},
      {ch:'膜',meaning:'막',strokes:17,pilhoek:14,rad:'肉',jawonElement:null},
      {ch:'寞',meaning:'쓸쓸할',strokes:14,pilhoek:13,rad:'宀',jawonElement:null},
      {ch:'邈',meaning:'멀',strokes:21,pilhoek:17,rad:'辵',jawonElement:'토'}
    ],
    '말': [
      {ch:'末',meaning:'끝',strokes:5,pilhoek:5,rad:'木',jawonElement:'목'},
      {ch:'靺',meaning:'버선',strokes:14,pilhoek:14,rad:'革',jawonElement:'금'},
      {ch:'抹',meaning:'바랄',strokes:9,pilhoek:8,rad:'手',jawonElement:'목'},
      {ch:'襪',meaning:'버선',strokes:21,pilhoek:19,rad:'衣',jawonElement:'목'},
      {ch:'沫',meaning:'거품',strokes:9,pilhoek:8,rad:'水',jawonElement:'수'},
      {ch:'唜',meaning:'끝',strokes:10,pilhoek:10,rad:'口',jawonElement:null},
      {ch:'茉',meaning:'말리',strokes:11,pilhoek:8,rad:'艸',jawonElement:'목'}
    ],
    '망': [
      {ch:'望',meaning:'바랄',strokes:11,pilhoek:11,rad:'月',jawonElement:'수'},
      {ch:'忘',meaning:'잊을',strokes:7,pilhoek:7,rad:'心',jawonElement:'화'},
      {ch:'忙',meaning:'바쁠',strokes:7,pilhoek:6,rad:'心',jawonElement:'화'},
      {ch:'妄',meaning:'망령될',strokes:6,pilhoek:6,rad:'女',jawonElement:'토'},
      {ch:'罔',meaning:'그물',strokes:9,pilhoek:8,rad:'网',jawonElement:null},
      {ch:'茫',meaning:'아득할',strokes:12,pilhoek:9,rad:'艸',jawonElement:'목'},
      {ch:'網',meaning:'그물',strokes:14,pilhoek:14,rad:'糸',jawonElement:'목'},
      {ch:'芒',meaning:'까끄라기',strokes:9,pilhoek:6,rad:'艸',jawonElement:'목'}
    ],
    '매': [
      {ch:'賣',meaning:'팔',strokes:15,pilhoek:15,rad:'貝',jawonElement:'금'},
      {ch:'買',meaning:'살',strokes:12,pilhoek:12,rad:'貝',jawonElement:'금'},
      {ch:'每',meaning:'매양',strokes:7,pilhoek:7,rad:'毋',jawonElement:null},
      {ch:'妹',meaning:'누이',strokes:8,pilhoek:8,rad:'女',jawonElement:'토'},
      {ch:'梅',meaning:'매화나무',strokes:11,pilhoek:11,rad:'木',jawonElement:'목'},
      {ch:'媒',meaning:'중매',strokes:12,pilhoek:12,rad:'女',jawonElement:'토'},
      {ch:'埋',meaning:'묻을',strokes:10,pilhoek:10,rad:'土',jawonElement:'토'},
      {ch:'枚',meaning:'줄기',strokes:8,pilhoek:8,rad:'木',jawonElement:'목'}
    ],
    '맥': [
      {ch:'麥',meaning:'보리',strokes:11,pilhoek:11,rad:'麥',jawonElement:'목'},
      {ch:'脈',meaning:'맥',strokes:12,pilhoek:10,rad:'肉',jawonElement:null},
      {ch:'貊',meaning:'북방 종족',strokes:13,pilhoek:13,rad:'豸',jawonElement:'수'},
      {ch:'陌',meaning:'두렁',strokes:14,pilhoek:8,rad:'阜',jawonElement:'토'},
      {ch:'驀',meaning:'말탈',strokes:21,pilhoek:20,rad:'馬',jawonElement:'화'}
    ],
    '멱': [
      {ch:'覓',meaning:'찾을',strokes:11,pilhoek:11,rad:'見',jawonElement:'화'},
      {ch:'汨',meaning:'물이름',strokes:8,pilhoek:7,rad:'水',jawonElement:'수'},
      {ch:'冪',meaning:'덮을',strokes:16,pilhoek:15,rad:'冖',jawonElement:null}
    ],
    '면': [
      {ch:'面',meaning:'낯',strokes:9,pilhoek:9,rad:'面',jawonElement:'화'},
      {ch:'免',meaning:'면할',strokes:7,pilhoek:7,rad:'儿',jawonElement:null},
      {ch:'勉',meaning:'힘쓸',strokes:9,pilhoek:9,rad:'力',jawonElement:null},
      {ch:'眠',meaning:'잠잘',strokes:10,pilhoek:10,rad:'目',jawonElement:'목'},
      {ch:'綿',meaning:'이어질',strokes:14,pilhoek:14,rad:'糸',jawonElement:'목'},
      {ch:'冕',meaning:'면류관',strokes:11,pilhoek:11,rad:'冂',jawonElement:null},
      {ch:'沔',meaning:'물 흐를',strokes:8,pilhoek:7,rad:'水',jawonElement:'수'},
      {ch:'緬',meaning:'가는 실',strokes:15,pilhoek:15,rad:'糸',jawonElement:'목'}
    ],
    '멸': [
      {ch:'滅',meaning:'멸할',strokes:14,pilhoek:13,rad:'水',jawonElement:'수'}
    ],
    '몌': [
      {ch:'袂',meaning:'소매',strokes:10,pilhoek:9,rad:'衣',jawonElement:'목'}
    ],
    '몰': [
      {ch:'沒',meaning:'가라 앉을',strokes:8,pilhoek:7,rad:'水',jawonElement:'수'}
    ],
    '몽': [
      {ch:'夢',meaning:'꿈',strokes:14,pilhoek:13,rad:'夕',jawonElement:null},
      {ch:'蒙',meaning:'입을',strokes:16,pilhoek:13,rad:'艸',jawonElement:'목'},
      {ch:'朦',meaning:'풍부할',strokes:20,pilhoek:17,rad:'月',jawonElement:'수'}
    ],
    '묘': [
      {ch:'卯',meaning:'토끼',strokes:5,pilhoek:5,rad:'卩',jawonElement:null},
      {ch:'妙',meaning:'묘할',strokes:7,pilhoek:7,rad:'女',jawonElement:'토'},
      {ch:'廟',meaning:'사당',strokes:15,pilhoek:15,rad:'广',jawonElement:'목'},
      {ch:'秒',meaning:'까끄라기',strokes:9,pilhoek:9,rad:'禾',jawonElement:'목'},
      {ch:'苗',meaning:'모',strokes:11,pilhoek:8,rad:'艸',jawonElement:'목'},
      {ch:'猫',meaning:'고양이',strokes:12,pilhoek:11,rad:'犬',jawonElement:null},
      {ch:'昴',meaning:'별자리 이름',strokes:9,pilhoek:9,rad:'日',jawonElement:null},
      {ch:'描',meaning:'그릴',strokes:13,pilhoek:11,rad:'手',jawonElement:'목'}
    ],
    '무': [
      {ch:'武',meaning:'굳셀',strokes:8,pilhoek:8,rad:'止',jawonElement:'토'},
      {ch:'務',meaning:'일',strokes:11,pilhoek:10,rad:'力',jawonElement:null},
      {ch:'戊',meaning:'다섯째 천간',strokes:5,pilhoek:5,rad:'戈',jawonElement:null},
      {ch:'茂',meaning:'우거질',strokes:11,pilhoek:8,rad:'艸',jawonElement:'목'},
      {ch:'舞',meaning:'춤출',strokes:14,pilhoek:14,rad:'舛',jawonElement:'목'},
      {ch:'貿',meaning:'바꿀',strokes:12,pilhoek:12,rad:'貝',jawonElement:'금'},
      {ch:'霧',meaning:'안개',strokes:19,pilhoek:18,rad:'雨',jawonElement:'수'},
      {ch:'誣',meaning:'무고할',strokes:14,pilhoek:14,rad:'言',jawonElement:'금'}
    ],
    '물': [
      {ch:'物',meaning:'만물',strokes:8,pilhoek:8,rad:'牛',jawonElement:'토'},
      {ch:'勿',meaning:'말',strokes:4,pilhoek:4,rad:'勹',jawonElement:null},
      {ch:'沕',meaning:'아득할',strokes:8,pilhoek:7,rad:'水',jawonElement:'수'}
    ],
    '밀': [
      {ch:'密',meaning:'빽빽할',strokes:11,pilhoek:11,rad:'宀',jawonElement:null},
      {ch:'蜜',meaning:'꿀',strokes:14,pilhoek:14,rad:'虫',jawonElement:'수'},
      {ch:'謐',meaning:'고요할',strokes:17,pilhoek:17,rad:'言',jawonElement:'금'}
    ],
    '발': [
      {ch:'發',meaning:'쏠',strokes:12,pilhoek:12,rad:'癶',jawonElement:null},
      {ch:'髮',meaning:'터럭',strokes:15,pilhoek:15,rad:'髟',jawonElement:'화'},
      {ch:'拔',meaning:'뺄',strokes:9,pilhoek:8,rad:'手',jawonElement:'목'},
      {ch:'跋',meaning:'밟을',strokes:12,pilhoek:12,rad:'足',jawonElement:'토'},
      {ch:'鉢',meaning:'바리때',strokes:13,pilhoek:13,rad:'金',jawonElement:'금'},
      {ch:'潑',meaning:'뿌릴',strokes:16,pilhoek:15,rad:'水',jawonElement:'수'},
      {ch:'渤',meaning:'바다이름',strokes:13,pilhoek:12,rad:'水',jawonElement:'수'},
      {ch:'撥',meaning:'다스릴',strokes:16,pilhoek:15,rad:'手',jawonElement:'목'}
    ],
    '번': [
      {ch:'番',meaning:'갈마들',strokes:12,pilhoek:12,rad:'田',jawonElement:null},
      {ch:'煩',meaning:'괴로워할',strokes:13,pilhoek:13,rad:'火',jawonElement:'화'},
      {ch:'繁',meaning:'많을',strokes:17,pilhoek:17,rad:'糸',jawonElement:'목'},
      {ch:'飜',meaning:'뒤칠',strokes:21,pilhoek:21,rad:'飛',jawonElement:'화'},
      {ch:'磻',meaning:'강이름',strokes:17,pilhoek:17,rad:'石',jawonElement:'금'},
      {ch:'蕃',meaning:'우거질',strokes:18,pilhoek:15,rad:'艸',jawonElement:'목'},
      {ch:'藩',meaning:'덮을',strokes:21,pilhoek:18,rad:'艸',jawonElement:'목'},
      {ch:'燔',meaning:'구울',strokes:16,pilhoek:16,rad:'火',jawonElement:'화'}
    ],
    '벌': [
      {ch:'伐',meaning:'칠',strokes:6,pilhoek:6,rad:'人',jawonElement:'화'},
      {ch:'罰',meaning:'벌줄',strokes:15,pilhoek:14,rad:'网',jawonElement:null},
      {ch:'閥',meaning:'공훈',strokes:14,pilhoek:14,rad:'門',jawonElement:null}
    ],
    '법': [
      {ch:'法',meaning:'법',strokes:9,pilhoek:8,rad:'水',jawonElement:'수'},
      {ch:'琺',meaning:'법랑',strokes:13,pilhoek:12,rad:'玉',jawonElement:'금'}
    ],
    '벽': [
      {ch:'壁',meaning:'벽',strokes:16,pilhoek:16,rad:'土',jawonElement:'토'},
      {ch:'碧',meaning:'푸를',strokes:14,pilhoek:14,rad:'石',jawonElement:'금'},
      {ch:'僻',meaning:'후미질',strokes:15,pilhoek:15,rad:'人',jawonElement:'화'},
      {ch:'闢',meaning:'열',strokes:21,pilhoek:21,rad:'門',jawonElement:null},
      {ch:'璧',meaning:'동근 옥',strokes:18,pilhoek:18,rad:'玉',jawonElement:'금'},
      {ch:'癖',meaning:'적취',strokes:18,pilhoek:18,rad:'疒',jawonElement:'수'},
      {ch:'劈',meaning:'쪼갤',strokes:15,pilhoek:15,rad:'刀',jawonElement:'금'},
      {ch:'擘',meaning:'엄지손가락',strokes:17,pilhoek:17,rad:'手',jawonElement:'목'}
    ],
    '별': [
      {ch:'別',meaning:'나눌',strokes:7,pilhoek:7,rad:'刀',jawonElement:'금'},
      {ch:'瞥',meaning:'언뜻 볼',strokes:17,pilhoek:16,rad:'目',jawonElement:'목'},
      {ch:'鱉',meaning:'자라',strokes:23,pilhoek:22,rad:'魚',jawonElement:'수'},
      {ch:'鼈',meaning:'자라',strokes:25,pilhoek:24,rad:'黽',jawonElement:'토'}
    ],
    '본': [
      {ch:'本',meaning:'밑',strokes:5,pilhoek:5,rad:'木',jawonElement:'목'}
    ],
    '볼': [
      {ch:'乶',meaning:'땅이름',strokes:8,pilhoek:8,rad:'乙',jawonElement:null}
    ],
    '북': [
      {ch:'北',meaning:'북녘',strokes:5,pilhoek:5,rad:'匕',jawonElement:null}
    ],
    '분': [
      {ch:'分',meaning:'나눌',strokes:4,pilhoek:4,rad:'刀',jawonElement:'금'},
      {ch:'憤',meaning:'결낼',strokes:16,pilhoek:15,rad:'心',jawonElement:'화'},
      {ch:'奮',meaning:'떨칠',strokes:16,pilhoek:16,rad:'大',jawonElement:null},
      {ch:'粉',meaning:'가루',strokes:10,pilhoek:10,rad:'米',jawonElement:'목'},
      {ch:'紛',meaning:'어지러워질',strokes:10,pilhoek:10,rad:'糸',jawonElement:'목'},
      {ch:'奔',meaning:'달릴',strokes:8,pilhoek:8,rad:'大',jawonElement:null},
      {ch:'頒',meaning:'큰 머리',strokes:13,pilhoek:13,rad:'頁',jawonElement:'화'},
      {ch:'芬',meaning:'향기로울',strokes:10,pilhoek:7,rad:'艸',jawonElement:'목'}
    ],
    '불': [
      {ch:'佛',meaning:'부처',strokes:7,pilhoek:7,rad:'人',jawonElement:'화'},
      {ch:'拂',meaning:'떨',strokes:9,pilhoek:8,rad:'手',jawonElement:'목'},
      {ch:'弗',meaning:'말',strokes:5,pilhoek:5,rad:'弓',jawonElement:null},
      {ch:'彿',meaning:'비슷할',strokes:8,pilhoek:8,rad:'彳',jawonElement:'화'}
    ],
    '붕': [
      {ch:'朋',meaning:'벗',strokes:8,pilhoek:8,rad:'月',jawonElement:'수'},
      {ch:'鵬',meaning:'대붕새',strokes:19,pilhoek:19,rad:'鳥',jawonElement:'화'},
      {ch:'棚',meaning:'사다리',strokes:12,pilhoek:12,rad:'木',jawonElement:'목'},
      {ch:'硼',meaning:'붕산',strokes:13,pilhoek:13,rad:'石',jawonElement:'금'}
    ],
    '비': [
      {ch:'鼻',meaning:'코',strokes:14,pilhoek:14,rad:'鼻',jawonElement:null},
      {ch:'備',meaning:'깆출',strokes:12,pilhoek:12,rad:'人',jawonElement:'화'},
      {ch:'比',meaning:'견줄',strokes:4,pilhoek:4,rad:'比',jawonElement:null},
      {ch:'秘',meaning:'숨길',strokes:10,pilhoek:10,rad:'禾',jawonElement:'목'},
      {ch:'費',meaning:'쓸',strokes:12,pilhoek:12,rad:'貝',jawonElement:'금'},
      {ch:'妃',meaning:'왕비',strokes:6,pilhoek:6,rad:'女',jawonElement:'토'},
      {ch:'卑',meaning:'낮을',strokes:8,pilhoek:8,rad:'十',jawonElement:null},
      {ch:'碑',meaning:'돌기둥',strokes:13,pilhoek:13,rad:'石',jawonElement:'금'}
    ],
    '빙': [
      {ch:'聘',meaning:'찾아가다',strokes:13,pilhoek:13,rad:'耳',jawonElement:'화'},
      {ch:'憑',meaning:'기대다',strokes:16,pilhoek:16,rad:'心',jawonElement:'화'},
      {ch:'騁',meaning:'달리다',strokes:17,pilhoek:17,rad:'馬',jawonElement:'화'}
    ],
    '삭': [
      {ch:'數',meaning:'자주',strokes:15,pilhoek:15,rad:'攴',jawonElement:'금'},
      {ch:'削',meaning:'깎을',strokes:9,pilhoek:9,rad:'刀',jawonElement:'금'},
      {ch:'索',meaning:'동아줄',strokes:10,pilhoek:10,rad:'糸',jawonElement:'목'},
      {ch:'朔',meaning:'초하루',strokes:10,pilhoek:10,rad:'月',jawonElement:'수'}
    ],
    '산': [
      {ch:'山',meaning:'뫼',strokes:3,pilhoek:3,rad:'山',jawonElement:'토'},
      {ch:'産',meaning:'낳을',strokes:11,pilhoek:11,rad:'生',jawonElement:null},
      {ch:'散',meaning:'흩어질',strokes:12,pilhoek:12,rad:'攴',jawonElement:'금'},
      {ch:'算',meaning:'셀',strokes:14,pilhoek:14,rad:'竹',jawonElement:'목'},
      {ch:'傘',meaning:'우산',strokes:12,pilhoek:12,rad:'人',jawonElement:'화'},
      {ch:'刪',meaning:'깎을',strokes:7,pilhoek:7,rad:'刀',jawonElement:'금'},
      {ch:'珊',meaning:'산호',strokes:10,pilhoek:9,rad:'玉',jawonElement:'금'},
      {ch:'疝',meaning:'산증',strokes:8,pilhoek:8,rad:'疒',jawonElement:'수'}
    ],
    '살': [
      {ch:'蔡',meaning:'내칠',strokes:17,pilhoek:14,rad:'艸',jawonElement:'목'},
      {ch:'薩',meaning:'보살',strokes:19,pilhoek:16,rad:'艸',jawonElement:'목'},
      {ch:'撒',meaning:'뿌릴',strokes:16,pilhoek:15,rad:'手',jawonElement:'목'},
      {ch:'乷',meaning:'음역자',strokes:7,pilhoek:8,rad:'乙',jawonElement:null}
    ],
    '삽': [
      {ch:'揷',meaning:'꽂을',strokes:13,pilhoek:12,rad:'手',jawonElement:'목'},
      {ch:'澁',meaning:'떫을',strokes:16,pilhoek:15,rad:'水',jawonElement:'수'},
      {ch:'颯',meaning:'바람소리',strokes:14,pilhoek:14,rad:'風',jawonElement:'목'},
      {ch:'鈒',meaning:'창',strokes:12,pilhoek:11,rad:'金',jawonElement:'금'}
    ],
    '새': [
      {ch:'塞',meaning:'변방',strokes:13,pilhoek:13,rad:'土',jawonElement:'토'},
      {ch:'璽',meaning:'도장',strokes:19,pilhoek:19,rad:'玉',jawonElement:'금'},
      {ch:'賽',meaning:'굿할',strokes:17,pilhoek:17,rad:'貝',jawonElement:'금'}
    ],
    '색': [
      {ch:'色',meaning:'빛',strokes:6,pilhoek:6,rad:'色',jawonElement:null},
      {ch:'塞',meaning:'변망',strokes:13,pilhoek:13,rad:'土',jawonElement:'토'},
      {ch:'索',meaning:'찾을',strokes:10,pilhoek:10,rad:'糸',jawonElement:'목'},
      {ch:'嗇',meaning:'아낄',strokes:13,pilhoek:13,rad:'口',jawonElement:null},
      {ch:'薔',meaning:'아낄',strokes:19,pilhoek:16,rad:'艸',jawonElement:'목'},
      {ch:'穡',meaning:'거둘',strokes:18,pilhoek:18,rad:'禾',jawonElement:'목'}
    ],
    '생': [
      {ch:'省',meaning:'덜',strokes:9,pilhoek:9,rad:'目',jawonElement:'목'},
      {ch:'甥',meaning:'생질',strokes:12,pilhoek:12,rad:'生',jawonElement:null},
      {ch:'笙',meaning:'생황',strokes:11,pilhoek:11,rad:'竹',jawonElement:'목'}
    ],
    '섬': [
      {ch:'暹',meaning:'해돋을',strokes:16,pilhoek:15,rad:'日',jawonElement:null},
      {ch:'纖',meaning:'가늘',strokes:23,pilhoek:23,rad:'糸',jawonElement:'목'},
      {ch:'陝',meaning:'고을이름',strokes:15,pilhoek:9,rad:'阜',jawonElement:'토'},
      {ch:'殲',meaning:'멸할',strokes:21,pilhoek:21,rad:'歹',jawonElement:'수'},
      {ch:'閃',meaning:'번쩍할',strokes:10,pilhoek:10,rad:'門',jawonElement:null},
      {ch:'贍',meaning:'넉넉할',strokes:20,pilhoek:20,rad:'貝',jawonElement:'금'},
      {ch:'剡',meaning:'날카로울',strokes:10,pilhoek:10,rad:'刀',jawonElement:'금'}
    ],
    '속': [
      {ch:'速',meaning:'빠를',strokes:14,pilhoek:10,rad:'辵',jawonElement:'토'},
      {ch:'俗',meaning:'익을',strokes:9,pilhoek:9,rad:'人',jawonElement:'화'},
      {ch:'續',meaning:'이을',strokes:21,pilhoek:21,rad:'糸',jawonElement:'목'},
      {ch:'束',meaning:'단나무',strokes:7,pilhoek:7,rad:'木',jawonElement:'목'},
      {ch:'屬',meaning:'무리',strokes:20,pilhoek:21,rad:'尸',jawonElement:null},
      {ch:'粟',meaning:'좁쌀',strokes:12,pilhoek:12,rad:'米',jawonElement:'목'},
      {ch:'贖',meaning:'속바칠',strokes:22,pilhoek:22,rad:'貝',jawonElement:'금'},
      {ch:'涑',meaning:'빨',strokes:11,pilhoek:10,rad:'水',jawonElement:'수'}
    ],
    '솔': [
      {ch:'率',meaning:'거느릴',strokes:11,pilhoek:11,rad:'玄',jawonElement:'수'}
    ],
    '쇄': [
      {ch:'殺',meaning:'내릴',strokes:11,pilhoek:10,rad:'殳',jawonElement:'금'},
      {ch:'刷',meaning:'긁을',strokes:8,pilhoek:8,rad:'刀',jawonElement:'금'},
      {ch:'鎖',meaning:'자물쇠',strokes:18,pilhoek:18,rad:'金',jawonElement:'금'},
      {ch:'灑',meaning:'뿌릴',strokes:23,pilhoek:22,rad:'水',jawonElement:'수'},
      {ch:'碎',meaning:'잘',strokes:13,pilhoek:13,rad:'石',jawonElement:'금'}
    ],
    '쇠': [
      {ch:'衰',meaning:'쇠할',strokes:10,pilhoek:10,rad:'衣',jawonElement:'목'},
      {ch:'釗',meaning:'쇠',strokes:10,pilhoek:10,rad:'金',jawonElement:'금'}
    ],
    '숙': [
      {ch:'宿',meaning:'잘',strokes:11,pilhoek:11,rad:'宀',jawonElement:null},
      {ch:'叔',meaning:'아재비',strokes:8,pilhoek:8,rad:'又',jawonElement:null},
      {ch:'淑',meaning:'맑을',strokes:12,pilhoek:11,rad:'水',jawonElement:'수'},
      {ch:'孰',meaning:'누구',strokes:11,pilhoek:11,rad:'子',jawonElement:'수'},
      {ch:'熟',meaning:'익힐',strokes:15,pilhoek:15,rad:'火',jawonElement:'화'},
      {ch:'肅',meaning:'공손할',strokes:13,pilhoek:13,rad:'聿',jawonElement:null},
      {ch:'夙',meaning:'이를',strokes:6,pilhoek:6,rad:'夕',jawonElement:null},
      {ch:'菽',meaning:'콩',strokes:14,pilhoek:11,rad:'艸',jawonElement:'목'}
    ],
    '술': [
      {ch:'戌',meaning:'개',strokes:6,pilhoek:6,rad:'戈',jawonElement:null},
      {ch:'述',meaning:'이을',strokes:12,pilhoek:8,rad:'辵',jawonElement:'토'},
      {ch:'術',meaning:'재주',strokes:11,pilhoek:11,rad:'行',jawonElement:null},
      {ch:'鉥',meaning:'돗바늘',strokes:13,pilhoek:13,rad:'金',jawonElement:'금'}
    ],
    '숭': [
      {ch:'崇',meaning:'높을',strokes:11,pilhoek:11,rad:'山',jawonElement:'토'},
      {ch:'嵩',meaning:'높을',strokes:13,pilhoek:13,rad:'山',jawonElement:'토'},
      {ch:'崧',meaning:'산 불끈 솟을',strokes:11,pilhoek:11,rad:'山',jawonElement:'토'}
    ],
    '슬': [
      {ch:'瑟',meaning:'비파',strokes:14,pilhoek:13,rad:'玉',jawonElement:'금'},
      {ch:'膝',meaning:'무릎',strokes:17,pilhoek:15,rad:'肉',jawonElement:null},
      {ch:'蝨',meaning:'이',strokes:15,pilhoek:15,rad:'虫',jawonElement:'수'}
    ],
    '습': [
      {ch:'習',meaning:'익힐',strokes:11,pilhoek:11,rad:'羽',jawonElement:'화'},
      {ch:'拾',meaning:'주울',strokes:10,pilhoek:9,rad:'手',jawonElement:'목'},
      {ch:'襲',meaning:'옷 덧입을',strokes:22,pilhoek:22,rad:'衣',jawonElement:'목'},
      {ch:'濕',meaning:'소 귀 벌룩거릴',strokes:18,pilhoek:17,rad:'水',jawonElement:'수'},
      {ch:'褶',meaning:'슬갑',strokes:17,pilhoek:16,rad:'衣',jawonElement:'목'}
    ],
    '실': [
      {ch:'室',meaning:'집',strokes:9,pilhoek:9,rad:'宀',jawonElement:null},
      {ch:'失',meaning:'그르칠',strokes:5,pilhoek:5,rad:'大',jawonElement:null},
      {ch:'實',meaning:'열매',strokes:14,pilhoek:14,rad:'宀',jawonElement:null},
      {ch:'悉',meaning:'모두',strokes:11,pilhoek:11,rad:'心',jawonElement:'화'}
    ],
    '십': [
      {ch:'十',meaning:'열',strokes:10,pilhoek:2,rad:null,jawonElement:null},
      {ch:'拾',meaning:'주울',strokes:10,pilhoek:9,rad:'手',jawonElement:'목'},
      {ch:'什',meaning:'열 사람',strokes:4,pilhoek:4,rad:'人',jawonElement:'화'}
    ],
    '쌍': [
      {ch:'雙',meaning:'짝',strokes:18,pilhoek:18,rad:'隹',jawonElement:'화'}
    ],
    '씨': [
      {ch:'氏',meaning:'성',strokes:4,pilhoek:4,rad:'氏',jawonElement:'화'}
    ],
    '악': [
      {ch:'樂',meaning:'풍류',strokes:15,pilhoek:15,rad:'木',jawonElement:'목'},
      {ch:'惡',meaning:'나쁠',strokes:12,pilhoek:12,rad:'心',jawonElement:'화'},
      {ch:'岳',meaning:'큰 산',strokes:8,pilhoek:8,rad:'山',jawonElement:'토'},
      {ch:'握',meaning:'잡을',strokes:13,pilhoek:12,rad:'手',jawonElement:'목'},
      {ch:'愕',meaning:'억지부릴',strokes:13,pilhoek:12,rad:'心',jawonElement:'화'},
      {ch:'堊',meaning:'흰 흙',strokes:11,pilhoek:11,rad:'土',jawonElement:'토'},
      {ch:'顎',meaning:'턱',strokes:18,pilhoek:18,rad:'頁',jawonElement:'화'},
      {ch:'嶽',meaning:'높은 산',strokes:17,pilhoek:17,rad:'山',jawonElement:'토'}
    ],
    '알': [
      {ch:'謁',meaning:'아뢸',strokes:16,pilhoek:16,rad:'言',jawonElement:'금'},
      {ch:'閼',meaning:'막을',strokes:16,pilhoek:16,rad:'門',jawonElement:null},
      {ch:'軋',meaning:'수레 삐걱거릴',strokes:8,pilhoek:8,rad:'車',jawonElement:'화'},
      {ch:'斡',meaning:'돌릴',strokes:14,pilhoek:14,rad:'斗',jawonElement:'화'}
    ],
    '암': [
      {ch:'暗',meaning:'몰래',strokes:13,pilhoek:13,rad:'日',jawonElement:null},
      {ch:'巖',meaning:'바위',strokes:23,pilhoek:22,rad:'山',jawonElement:'토'},
      {ch:'癌',meaning:'종양',strokes:17,pilhoek:17,rad:'疒',jawonElement:'수'},
      {ch:'庵',meaning:'초막',strokes:11,pilhoek:11,rad:'广',jawonElement:'목'},
      {ch:'闇',meaning:'망루',strokes:17,pilhoek:17,rad:'門',jawonElement:null},
      {ch:'岩',meaning:'바위',strokes:8,pilhoek:8,rad:'山',jawonElement:'토'},
      {ch:'菴',meaning:'암자',strokes:14,pilhoek:11,rad:'艸',jawonElement:'목'},
      {ch:'唵',meaning:'머금을',strokes:11,pilhoek:11,rad:'口',jawonElement:null}
    ],
    '압': [
      {ch:'壓',meaning:'누를',strokes:17,pilhoek:17,rad:'土',jawonElement:'토'},
      {ch:'押',meaning:'수결 둘',strokes:9,pilhoek:8,rad:'手',jawonElement:'목'},
      {ch:'鴨',meaning:'오리',strokes:16,pilhoek:16,rad:'鳥',jawonElement:'화'},
      {ch:'狎',meaning:'친근할',strokes:9,pilhoek:8,rad:'犬',jawonElement:null}
    ],
    '앙': [
      {ch:'仰',meaning:'우러를',strokes:6,pilhoek:6,rad:'人',jawonElement:'화'},
      {ch:'央',meaning:'가운데',strokes:5,pilhoek:5,rad:'大',jawonElement:null},
      {ch:'昻',meaning:'오를',strokes:9,pilhoek:9,rad:'日',jawonElement:null},
      {ch:'鴦',meaning:'암원앙새',strokes:16,pilhoek:16,rad:'鳥',jawonElement:'화'},
      {ch:'秧',meaning:'모',strokes:10,pilhoek:10,rad:'禾',jawonElement:'목'}
    ],
    '액': [
      {ch:'額',meaning:'이마',strokes:18,pilhoek:18,rad:'頁',jawonElement:'화'},
      {ch:'液',meaning:'즙',strokes:12,pilhoek:11,rad:'水',jawonElement:'수'},
      {ch:'腋',meaning:'겨드랑이',strokes:14,pilhoek:12,rad:'肉',jawonElement:null},
      {ch:'扼',meaning:'움켜쥘',strokes:8,pilhoek:7,rad:'手',jawonElement:'목'},
      {ch:'縊',meaning:'목 맬',strokes:16,pilhoek:16,rad:'糸',jawonElement:'목'},
      {ch:'掖',meaning:'겨드랑이에 낄',strokes:12,pilhoek:11,rad:'手',jawonElement:'목'}
    ],
    '앵': [
      {ch:'櫻',meaning:'앵두나무',strokes:21,pilhoek:21,rad:'木',jawonElement:'목'},
      {ch:'鸚',meaning:'앵무새',strokes:28,pilhoek:28,rad:'鳥',jawonElement:'화'},
      {ch:'罌',meaning:'술병',strokes:20,pilhoek:20,rad:'缶',jawonElement:'토'}
    ],
    '약': [
      {ch:'弱',meaning:'약할',strokes:10,pilhoek:10,rad:'弓',jawonElement:null},
      {ch:'藥',meaning:'약',strokes:21,pilhoek:18,rad:'艸',jawonElement:'목'},
      {ch:'約',meaning:'대략',strokes:9,pilhoek:9,rad:'糸',jawonElement:'목'},
      {ch:'若',meaning:'같을',strokes:11,pilhoek:8,rad:'艸',jawonElement:'목'},
      {ch:'略',meaning:'간략할',strokes:11,pilhoek:11,rad:'田',jawonElement:null},
      {ch:'躍',meaning:'뛸',strokes:21,pilhoek:21,rad:'足',jawonElement:'토'},
      {ch:'掠',meaning:'노략질할',strokes:12,pilhoek:11,rad:'手',jawonElement:'목'},
      {ch:'葯',meaning:'꽃밥',strokes:15,pilhoek:12,rad:'艸',jawonElement:'목'}
    ],
    '억': [
      {ch:'億',meaning:'억',strokes:15,pilhoek:15,rad:'人',jawonElement:'화'},
      {ch:'憶',meaning:'생각',strokes:17,pilhoek:16,rad:'心',jawonElement:'화'},
      {ch:'抑',meaning:'누를',strokes:8,pilhoek:7,rad:'手',jawonElement:'목'},
      {ch:'臆',meaning:'가슴',strokes:19,pilhoek:17,rad:'肉',jawonElement:null},
      {ch:'檍',meaning:'참죽나무',strokes:17,pilhoek:17,rad:'木',jawonElement:'목'}
    ],
    '얼': [
      {ch:'蘖',meaning:'그루터기',strokes:23,pilhoek:20,rad:'艸',jawonElement:'목'},
      {ch:'孼',meaning:'요물',strokes:19,pilhoek:19,rad:'子',jawonElement:'수'}
    ],
    '업': [
      {ch:'業',meaning:'일',strokes:13,pilhoek:13,rad:'木',jawonElement:'목'},
      {ch:'嶪',meaning:'산이 높고 웅장할',strokes:16,pilhoek:16,rad:'山',jawonElement:'토'}
    ],
    '엔': [
      {ch:'円',meaning:'일본화폐단위',strokes:4,pilhoek:4,rad:'冂',jawonElement:null}
    ],
    '역': [
      {ch:'力',meaning:'힘',strokes:2,pilhoek:2,rad:'力',jawonElement:null},
      {ch:'亦',meaning:'모두',strokes:6,pilhoek:6,rad:'亠',jawonElement:null},
      {ch:'易',meaning:'바꿀',strokes:8,pilhoek:8,rad:'日',jawonElement:null},
      {ch:'歷',meaning:'지낼',strokes:16,pilhoek:16,rad:'止',jawonElement:'토'},
      {ch:'役',meaning:'부릴',strokes:7,pilhoek:7,rad:'彳',jawonElement:'화'},
      {ch:'驛',meaning:'잇닿을',strokes:23,pilhoek:23,rad:'馬',jawonElement:'화'},
      {ch:'譯',meaning:'통변할',strokes:20,pilhoek:20,rad:'言',jawonElement:'금'},
      {ch:'曆',meaning:'셀',strokes:16,pilhoek:16,rad:'日',jawonElement:null}
    ],
    '엽': [
      {ch:'燁',meaning:'불 이글글할',strokes:16,pilhoek:14,rad:'火',jawonElement:'화'},
      {ch:'葉',meaning:'잎',strokes:15,pilhoek:12,rad:'艸',jawonElement:'목'},
      {ch:'獵',meaning:'사냥할',strokes:19,pilhoek:18,rad:'犬',jawonElement:null},
      {ch:'曄',meaning:'빛날',strokes:16,pilhoek:14,rad:'日',jawonElement:null}
    ],
    '올': [
      {ch:'兀',meaning:'우뚝할',strokes:3,pilhoek:3,rad:'儿',jawonElement:null}
    ],
    '와': [
      {ch:'臥',meaning:'누울',strokes:8,pilhoek:8,rad:'臣',jawonElement:null},
      {ch:'瓦',meaning:'질그릇',strokes:5,pilhoek:4,rad:'瓦',jawonElement:null},
      {ch:'渦',meaning:'소용돌이',strokes:13,pilhoek:11,rad:'水',jawonElement:'수'},
      {ch:'窩',meaning:'움집',strokes:14,pilhoek:13,rad:'穴',jawonElement:'수'},
      {ch:'窪',meaning:'도랑',strokes:14,pilhoek:14,rad:'穴',jawonElement:'수'}
    ],
    '왈': [
      {ch:'曰',meaning:'가로되',strokes:4,pilhoek:4,rad:'曰',jawonElement:null}
    ],
    '왜': [
      {ch:'倭',meaning:'나라이름',strokes:10,pilhoek:10,rad:'人',jawonElement:'화'},
      {ch:'矮',meaning:'난장이',strokes:13,pilhoek:13,rad:'矢',jawonElement:'금'},
      {ch:'娃',meaning:'어여쁜 계집',strokes:9,pilhoek:9,rad:'女',jawonElement:'토'},
      {ch:'歪',meaning:'비뚤',strokes:9,pilhoek:9,rad:'止',jawonElement:'토'}
    ],
    '외': [
      {ch:'外',meaning:'바깥',strokes:5,pilhoek:5,rad:'夕',jawonElement:null},
      {ch:'畏',meaning:'겁낼',strokes:9,pilhoek:9,rad:'田',jawonElement:null},
      {ch:'猥',meaning:'섞일',strokes:13,pilhoek:12,rad:'犬',jawonElement:null},
      {ch:'巍',meaning:'높을',strokes:21,pilhoek:20,rad:'山',jawonElement:'토'},
      {ch:'嵬',meaning:'산 뾰족할',strokes:13,pilhoek:12,rad:'山',jawonElement:'토'}
    ],
    '욕': [
      {ch:'欲',meaning:'욕심낼',strokes:11,pilhoek:11,rad:'欠',jawonElement:null},
      {ch:'浴',meaning:'깨끗이할',strokes:11,pilhoek:10,rad:'水',jawonElement:'수'},
      {ch:'辱',meaning:'욕될',strokes:10,pilhoek:10,rad:'辰',jawonElement:'토'},
      {ch:'慾',meaning:'욕심낼',strokes:15,pilhoek:15,rad:'心',jawonElement:'화'},
      {ch:'褥',meaning:'요',strokes:16,pilhoek:15,rad:'衣',jawonElement:'목'},
      {ch:'縟',meaning:'꾸밀',strokes:16,pilhoek:16,rad:'糸',jawonElement:'목'}
    ],
    '욱': [
      {ch:'旭',meaning:'빛날',strokes:6,pilhoek:6,rad:'日',jawonElement:null},
      {ch:'郁',meaning:'문채날',strokes:13,pilhoek:8,rad:'邑',jawonElement:'토'},
      {ch:'煜',meaning:'비칠',strokes:13,pilhoek:13,rad:'火',jawonElement:'화'},
      {ch:'頊',meaning:'머리 굽실거릴',strokes:14,pilhoek:13,rad:'頁',jawonElement:'화'},
      {ch:'昱',meaning:'햇빛 밝을',strokes:9,pilhoek:9,rad:'日',jawonElement:null},
      {ch:'勖',meaning:'힘쓸',strokes:11,pilhoek:11,rad:'力',jawonElement:null},
      {ch:'彧',meaning:'빛날',strokes:10,pilhoek:10,rad:'彡',jawonElement:null},
      {ch:'栯',meaning:'산앵두',strokes:10,pilhoek:10,rad:'木',jawonElement:'목'}
    ],
    '울': [
      {ch:'鬱',meaning:'향기로운 풀',strokes:29,pilhoek:29,rad:'鬯',jawonElement:'목'},
      {ch:'蔚',meaning:'고을이름',strokes:17,pilhoek:14,rad:'艸',jawonElement:'목'},
      {ch:'亐',meaning:'땅이름',strokes:3,pilhoek:3,rad:'一',jawonElement:null}
    ],
    '월': [
      {ch:'月',meaning:'달',strokes:4,pilhoek:4,rad:'月',jawonElement:'수'},
      {ch:'越',meaning:'넘을',strokes:12,pilhoek:12,rad:'走',jawonElement:'화'}
    ],
    '융': [
      {ch:'隆',meaning:'성할',strokes:17,pilhoek:11,rad:'阜',jawonElement:'토'},
      {ch:'融',meaning:'부드러울',strokes:16,pilhoek:16,rad:'虫',jawonElement:'수'},
      {ch:'戎',meaning:'병장기',strokes:6,pilhoek:6,rad:'戈',jawonElement:null},
      {ch:'絨',meaning:'삶은 실',strokes:12,pilhoek:12,rad:'糸',jawonElement:'목'},
      {ch:'瀜',meaning:'물 깊을',strokes:20,pilhoek:19,rad:'水',jawonElement:'수'}
    ],
    '을': [
      {ch:'乙',meaning:'새',strokes:1,pilhoek:1,rad:'乙',jawonElement:null}
    ],
    '읍': [
      {ch:'邑',meaning:'고을',strokes:7,pilhoek:7,rad:'邑',jawonElement:'토'},
      {ch:'泣',meaning:'부글부글 끓는 소리',strokes:9,pilhoek:8,rad:'水',jawonElement:'수'},
      {ch:'揖',meaning:'읍할',strokes:13,pilhoek:12,rad:'手',jawonElement:'목'}
    ],
    '응': [
      {ch:'應',meaning:'응당',strokes:17,pilhoek:17,rad:'心',jawonElement:'화'},
      {ch:'凝',meaning:'엉길',strokes:16,pilhoek:16,rad:'冫',jawonElement:'수'},
      {ch:'鷹',meaning:'매',strokes:24,pilhoek:24,rad:'鳥',jawonElement:'화'},
      {ch:'膺',meaning:'가슴',strokes:19,pilhoek:17,rad:'肉',jawonElement:null}
    ],
    '입': [
      {ch:'立',meaning:'설',strokes:5,pilhoek:5,rad:'立',jawonElement:null},
      {ch:'笠',meaning:'우리',strokes:11,pilhoek:11,rad:'竹',jawonElement:'목'},
      {ch:'粒',meaning:'쌀알',strokes:11,pilhoek:11,rad:'米',jawonElement:'목'},
      {ch:'卄',meaning:'스물',strokes:3,pilhoek:3,rad:'一',jawonElement:null}
    ],
    '잉': [
      {ch:'剩',meaning:'남을',strokes:11,pilhoek:12,rad:'刀',jawonElement:'금'},
      {ch:'孕',meaning:'아이밸',strokes:5,pilhoek:5,rad:'子',jawonElement:'수'},
      {ch:'仍',meaning:'인할',strokes:4,pilhoek:4,rad:'人',jawonElement:'화'},
      {ch:'芿',meaning:'새풀싹',strokes:10,pilhoek:7,rad:'艸',jawonElement:'목'}
    ],
    '작': [
      {ch:'作',meaning:'지을',strokes:7,pilhoek:7,rad:'人',jawonElement:'화'},
      {ch:'昨',meaning:'어제',strokes:9,pilhoek:9,rad:'日',jawonElement:null},
      {ch:'爵',meaning:'벼슬',strokes:18,pilhoek:17,rad:'爪',jawonElement:null},
      {ch:'酌',meaning:'따를',strokes:10,pilhoek:10,rad:'酉',jawonElement:null},
      {ch:'杓',meaning:'구기',strokes:7,pilhoek:7,rad:'木',jawonElement:'목'},
      {ch:'灼',meaning:'구을',strokes:7,pilhoek:7,rad:'火',jawonElement:'화'},
      {ch:'雀',meaning:'참새',strokes:11,pilhoek:11,rad:'隹',jawonElement:'화'},
      {ch:'鵲',meaning:'까치',strokes:19,pilhoek:19,rad:'鳥',jawonElement:'화'}
    ],
    '잔': [
      {ch:'殘',meaning:'해칠',strokes:12,pilhoek:12,rad:'歹',jawonElement:'수'},
      {ch:'盞',meaning:'작은 술잔',strokes:13,pilhoek:13,rad:'皿',jawonElement:null},
      {ch:'棧',meaning:'잔교',strokes:12,pilhoek:12,rad:'木',jawonElement:'목'},
      {ch:'孱',meaning:'잔약할',strokes:12,pilhoek:12,rad:'子',jawonElement:'수'}
    ],
    '잠': [
      {ch:'暫',meaning:'잠시',strokes:15,pilhoek:15,rad:'日',jawonElement:null},
      {ch:'蠶',meaning:'누에',strokes:24,pilhoek:24,rad:'虫',jawonElement:'수'},
      {ch:'箴',meaning:'바늘',strokes:15,pilhoek:15,rad:'竹',jawonElement:'목'},
      {ch:'岑',meaning:'봉우리',strokes:7,pilhoek:7,rad:'山',jawonElement:'토'}
    ],
    '잡': [
      {ch:'雜',meaning:'섞일',strokes:18,pilhoek:18,rad:'隹',jawonElement:'화'}
    ],
    '쟁': [
      {ch:'爭',meaning:'다스릴',strokes:8,pilhoek:8,rad:'爪',jawonElement:null},
      {ch:'錚',meaning:'쇳소리 쟁그렁거릴',strokes:16,pilhoek:14,rad:'金',jawonElement:'금'},
      {ch:'諍',meaning:'간할',strokes:15,pilhoek:13,rad:'言',jawonElement:'금'},
      {ch:'箏',meaning:'쟁',strokes:14,pilhoek:14,rad:'竹',jawonElement:'목'}
    ],
    '저': [
      {ch:'低',meaning:'낮을',strokes:7,pilhoek:7,rad:'人',jawonElement:'화'},
      {ch:'貯',meaning:'쌓을',strokes:12,pilhoek:12,rad:'貝',jawonElement:'금'},
      {ch:'著',meaning:'나타날',strokes:15,pilhoek:11,rad:'艸',jawonElement:'목'},
      {ch:'底',meaning:'밑',strokes:8,pilhoek:8,rad:'广',jawonElement:'목'},
      {ch:'抵',meaning:'밀칠',strokes:9,pilhoek:8,rad:'手',jawonElement:'목'},
      {ch:'沮',meaning:'막을',strokes:9,pilhoek:8,rad:'水',jawonElement:'수'},
      {ch:'躇',meaning:'머뭇거릴',strokes:20,pilhoek:18,rad:'足',jawonElement:'토'},
      {ch:'邸',meaning:'사처',strokes:12,pilhoek:7,rad:'邑',jawonElement:'토'}
    ],
    '적': [
      {ch:'赤',meaning:'붉을',strokes:7,pilhoek:7,rad:'赤',jawonElement:'화'},
      {ch:'的',meaning:'과녁',strokes:8,pilhoek:8,rad:'白',jawonElement:null},
      {ch:'敵',meaning:'대적할',strokes:15,pilhoek:15,rad:'攴',jawonElement:'금'},
      {ch:'適',meaning:'맞갖을',strokes:18,pilhoek:14,rad:'辵',jawonElement:'토'},
      {ch:'賊',meaning:'도적',strokes:13,pilhoek:13,rad:'貝',jawonElement:'금'},
      {ch:'積',meaning:'포갤',strokes:16,pilhoek:16,rad:'禾',jawonElement:'목'},
      {ch:'籍',meaning:'문서',strokes:20,pilhoek:20,rad:'竹',jawonElement:'목'},
      {ch:'跡',meaning:'자취',strokes:13,pilhoek:13,rad:'足',jawonElement:'토'}
    ],
    '절': [
      {ch:'節',meaning:'마디',strokes:15,pilhoek:13,rad:'竹',jawonElement:'목'},
      {ch:'絶',meaning:'끊을',strokes:12,pilhoek:12,rad:'糸',jawonElement:'목'},
      {ch:'切',meaning:'끊을',strokes:4,pilhoek:4,rad:'刀',jawonElement:'금'},
      {ch:'折',meaning:'꺾을',strokes:8,pilhoek:7,rad:'手',jawonElement:'목'},
      {ch:'竊',meaning:'얕을',strokes:22,pilhoek:22,rad:'穴',jawonElement:'수'},
      {ch:'截',meaning:'끊을',strokes:14,pilhoek:14,rad:'戈',jawonElement:null},
      {ch:'浙',meaning:'쌀 씻을',strokes:11,pilhoek:10,rad:'水',jawonElement:'수'},
      {ch:'癤',meaning:'멍울',strokes:20,pilhoek:18,rad:'疒',jawonElement:'수'}
    ],
    '점': [
      {ch:'店',meaning:'가게',strokes:8,pilhoek:8,rad:'广',jawonElement:'목'},
      {ch:'點',meaning:'뭉갤',strokes:17,pilhoek:17,rad:'黑',jawonElement:'수'},
      {ch:'占',meaning:'점칠',strokes:5,pilhoek:5,rad:'卜',jawonElement:null},
      {ch:'漸',meaning:'번질',strokes:15,pilhoek:14,rad:'水',jawonElement:'수'},
      {ch:'粘',meaning:'붙일',strokes:11,pilhoek:11,rad:'米',jawonElement:'목'},
      {ch:'霑',meaning:'비 지정거릴',strokes:16,pilhoek:16,rad:'雨',jawonElement:'수'},
      {ch:'点',meaning:'검은 점',strokes:9,pilhoek:9,rad:'火',jawonElement:'화'},
      {ch:'岾',meaning:'고개',strokes:8,pilhoek:8,rad:'山',jawonElement:'토'}
    ],
    '접': [
      {ch:'接',meaning:'사귈',strokes:12,pilhoek:11,rad:'手',jawonElement:'목'},
      {ch:'蝶',meaning:'들나비',strokes:15,pilhoek:15,rad:'虫',jawonElement:'수'},
      {ch:'渫',meaning:'물결 출렁출렁할',strokes:13,pilhoek:12,rad:'水',jawonElement:'수'},
      {ch:'摺',meaning:'접을',strokes:15,pilhoek:14,rad:'手',jawonElement:'목'}
    ],
    '족': [
      {ch:'族',meaning:'겨레',strokes:11,pilhoek:11,rad:'方',jawonElement:null},
      {ch:'簇',meaning:'모일',strokes:17,pilhoek:17,rad:'竹',jawonElement:'목'},
      {ch:'鏃',meaning:'화살촉',strokes:19,pilhoek:19,rad:'金',jawonElement:'금'}
    ],
    '존': [
      {ch:'存',meaning:'있을',strokes:6,pilhoek:6,rad:'子',jawonElement:'수'},
      {ch:'尊',meaning:'존귀할',strokes:12,pilhoek:12,rad:'寸',jawonElement:null}
    ],
    '졸': [
      {ch:'卒',meaning:'군사',strokes:8,pilhoek:8,rad:'十',jawonElement:null},
      {ch:'拙',meaning:'서툴',strokes:9,pilhoek:8,rad:'手',jawonElement:'목'},
      {ch:'猝',meaning:'갑자기',strokes:12,pilhoek:11,rad:'犬',jawonElement:null}
    ],
    '죽': [
      {ch:'竹',meaning:'대',strokes:6,pilhoek:6,rad:'竹',jawonElement:'목'},
      {ch:'粥',meaning:'죽',strokes:12,pilhoek:12,rad:'米',jawonElement:'목'}
    ],
    '줄': [
      {ch:'茁',meaning:'풀 처음 나는 모양',strokes:11,pilhoek:8,rad:'艸',jawonElement:'목'}
    ],
    '즉': [
      {ch:'卽',meaning:'곧',strokes:9,pilhoek:9,rad:'卩',jawonElement:null}
    ],
    '즐': [
      {ch:'櫛',meaning:'빗',strokes:19,pilhoek:17,rad:'木',jawonElement:'목'}
    ],
    '증': [
      {ch:'曾',meaning:'일찍',strokes:12,pilhoek:12,rad:'曰',jawonElement:null},
      {ch:'增',meaning:'불을',strokes:15,pilhoek:15,rad:'土',jawonElement:'토'},
      {ch:'證',meaning:'증거',strokes:19,pilhoek:19,rad:'言',jawonElement:'금'},
      {ch:'贈',meaning:'보낼',strokes:19,pilhoek:19,rad:'貝',jawonElement:'금'},
      {ch:'症',meaning:'증세',strokes:10,pilhoek:10,rad:'疒',jawonElement:'수'},
      {ch:'蒸',meaning:'찔',strokes:16,pilhoek:13,rad:'火',jawonElement:'화'},
      {ch:'拯',meaning:'건질',strokes:10,pilhoek:9,rad:'手',jawonElement:'목'},
      {ch:'烝',meaning:'김 오를',strokes:10,pilhoek:10,rad:'火',jawonElement:'화'}
    ],
    '직': [
      {ch:'直',meaning:'곧을',strokes:8,pilhoek:8,rad:'目',jawonElement:'목'},
      {ch:'職',meaning:'벼슬',strokes:18,pilhoek:18,rad:'耳',jawonElement:'화'},
      {ch:'織',meaning:'짤',strokes:18,pilhoek:18,rad:'糸',jawonElement:'목'},
      {ch:'稷',meaning:'기장',strokes:15,pilhoek:15,rad:'禾',jawonElement:'목'},
      {ch:'稙',meaning:'올벼',strokes:13,pilhoek:13,rad:'禾',jawonElement:'목'}
    ],
    '질': [
      {ch:'質',meaning:'바탕',strokes:15,pilhoek:15,rad:'貝',jawonElement:'금'},
      {ch:'秩',meaning:'차례',strokes:10,pilhoek:10,rad:'禾',jawonElement:'목'},
      {ch:'姪',meaning:'조카',strokes:9,pilhoek:9,rad:'女',jawonElement:'토'},
      {ch:'迭',meaning:'갈마들',strokes:12,pilhoek:8,rad:'辵',jawonElement:'토'},
      {ch:'跌',meaning:'넘어질',strokes:12,pilhoek:12,rad:'足',jawonElement:'토'},
      {ch:'窒',meaning:'막을',strokes:11,pilhoek:11,rad:'穴',jawonElement:'수'},
      {ch:'帙',meaning:'책갑',strokes:8,pilhoek:8,rad:'巾',jawonElement:'목'},
      {ch:'桎',meaning:'차꼬',strokes:10,pilhoek:10,rad:'木',jawonElement:'목'}
    ],
    '짐': [
      {ch:'朕',meaning:'나',strokes:10,pilhoek:10,rad:'月',jawonElement:'수'},
      {ch:'斟',meaning:'술 따를',strokes:13,pilhoek:13,rad:'斗',jawonElement:'화'}
    ],
    '집': [
      {ch:'集',meaning:'모일',strokes:12,pilhoek:12,rad:'隹',jawonElement:'화'},
      {ch:'執',meaning:'잡을',strokes:11,pilhoek:11,rad:'土',jawonElement:'토'},
      {ch:'輯',meaning:'모을',strokes:16,pilhoek:16,rad:'車',jawonElement:'화'},
      {ch:'什',meaning:'세간',strokes:4,pilhoek:4,rad:'人',jawonElement:'화'},
      {ch:'緝',meaning:'낳을',strokes:15,pilhoek:15,rad:'糸',jawonElement:'목'},
      {ch:'潗',meaning:'샘솟을',strokes:16,pilhoek:15,rad:'水',jawonElement:'수'},
      {ch:'鏶',meaning:'판금',strokes:20,pilhoek:20,rad:'金',jawonElement:'금'}
    ],
    '징': [
      {ch:'徵',meaning:'부를',strokes:15,pilhoek:15,rad:'彳',jawonElement:'화'},
      {ch:'懲',meaning:'혼날',strokes:19,pilhoek:19,rad:'心',jawonElement:'화'},
      {ch:'澄',meaning:'맑을',strokes:16,pilhoek:15,rad:'水',jawonElement:'수'}
    ],
    '착': [
      {ch:'着',meaning:'붙을',strokes:12,pilhoek:11,rad:'目',jawonElement:'목'},
      {ch:'著',meaning:'분명할',strokes:15,pilhoek:11,rad:'艸',jawonElement:'목'},
      {ch:'捉',meaning:'잡을',strokes:11,pilhoek:10,rad:'手',jawonElement:'목'},
      {ch:'錯',meaning:'섞일',strokes:16,pilhoek:16,rad:'金',jawonElement:'금'},
      {ch:'躇',meaning:'머뭇거릴',strokes:20,pilhoek:18,rad:'足',jawonElement:'토'},
      {ch:'搾',meaning:'짤',strokes:14,pilhoek:13,rad:'手',jawonElement:'목'},
      {ch:'鑿',meaning:'뚫을',strokes:28,pilhoek:28,rad:'金',jawonElement:'금'},
      {ch:'窄',meaning:'끼일',strokes:10,pilhoek:10,rad:'穴',jawonElement:'수'}
    ],
    '찰': [
      {ch:'察',meaning:'살필',strokes:14,pilhoek:14,rad:'宀',jawonElement:null},
      {ch:'刹',meaning:'절',strokes:8,pilhoek:8,rad:'刀',jawonElement:'금'},
      {ch:'札',meaning:'패',strokes:5,pilhoek:5,rad:'木',jawonElement:'목'},
      {ch:'擦',meaning:'뿌릴',strokes:18,pilhoek:17,rad:'手',jawonElement:'목'}
    ],
    '참': [
      {ch:'參',meaning:'간여할',strokes:11,pilhoek:11,rad:'厶',jawonElement:null},
      {ch:'慘',meaning:'참혹할',strokes:15,pilhoek:14,rad:'心',jawonElement:'화'},
      {ch:'慙',meaning:'부끄러울',strokes:15,pilhoek:15,rad:'心',jawonElement:'화'},
      {ch:'站',meaning:'우두커니 설',strokes:10,pilhoek:10,rad:'立',jawonElement:null},
      {ch:'讒',meaning:'참소할',strokes:24,pilhoek:24,rad:'言',jawonElement:'금'},
      {ch:'僭',meaning:'참람할',strokes:14,pilhoek:14,rad:'人',jawonElement:'화'},
      {ch:'讖',meaning:'참서',strokes:24,pilhoek:24,rad:'言',jawonElement:'금'},
      {ch:'塹',meaning:'구덩이',strokes:14,pilhoek:14,rad:'土',jawonElement:'토'}
    ],
    '책': [
      {ch:'冊',meaning:'책',strokes:5,pilhoek:5,rad:'冂',jawonElement:null},
      {ch:'策',meaning:'꾀',strokes:12,pilhoek:12,rad:'竹',jawonElement:'목'},
      {ch:'柵',meaning:'우리',strokes:9,pilhoek:9,rad:'木',jawonElement:'목'},
      {ch:'翟',meaning:'꿩',strokes:14,pilhoek:14,rad:'羽',jawonElement:'화'}
    ],
    '처': [
      {ch:'處',meaning:'살',strokes:11,pilhoek:11,rad:'虍',jawonElement:null},
      {ch:'妻',meaning:'아내',strokes:8,pilhoek:8,rad:'女',jawonElement:'토'},
      {ch:'凄',meaning:'쓸쓸할',strokes:10,pilhoek:10,rad:'冫',jawonElement:'수'}
    ],
    '척': [
      {ch:'尺',meaning:'자',strokes:4,pilhoek:4,rad:'尸',jawonElement:null},
      {ch:'拓',meaning:'주울',strokes:9,pilhoek:8,rad:'手',jawonElement:'목'},
      {ch:'斥',meaning:'물리칠',strokes:5,pilhoek:5,rad:'斤',jawonElement:null},
      {ch:'戚',meaning:'겨레',strokes:11,pilhoek:11,rad:'戈',jawonElement:null},
      {ch:'隻',meaning:'새 한 마리',strokes:10,pilhoek:10,rad:'隹',jawonElement:'화'},
      {ch:'陟',meaning:'오를',strokes:15,pilhoek:9,rad:'阜',jawonElement:'토'},
      {ch:'滌',meaning:'씻을',strokes:15,pilhoek:13,rad:'水',jawonElement:'수'},
      {ch:'擲',meaning:'던질',strokes:19,pilhoek:17,rad:'手',jawonElement:'목'}
    ],
    '첨': [
      {ch:'添',meaning:'더할',strokes:12,pilhoek:11,rad:'水',jawonElement:'수'},
      {ch:'尖',meaning:'뾰족할',strokes:6,pilhoek:6,rad:'小',jawonElement:null},
      {ch:'瞻',meaning:'볼',strokes:18,pilhoek:18,rad:'目',jawonElement:'목'},
      {ch:'僉',meaning:'다',strokes:13,pilhoek:13,rad:'人',jawonElement:'화'},
      {ch:'籤',meaning:'제비',strokes:23,pilhoek:23,rad:'竹',jawonElement:'목'},
      {ch:'沾',meaning:'더할',strokes:9,pilhoek:8,rad:'水',jawonElement:'수'},
      {ch:'詹',meaning:'이를',strokes:13,pilhoek:13,rad:'言',jawonElement:'금'},
      {ch:'簽',meaning:'농',strokes:19,pilhoek:19,rad:'竹',jawonElement:'목'}
    ],
    '첩': [
      {ch:'諜',meaning:'염탐할',strokes:16,pilhoek:16,rad:'言',jawonElement:'금'},
      {ch:'帖',meaning:'표제',strokes:8,pilhoek:8,rad:'巾',jawonElement:'목'},
      {ch:'牒',meaning:'글씨판',strokes:13,pilhoek:13,rad:'片',jawonElement:'목'},
      {ch:'疊',meaning:'거듭',strokes:22,pilhoek:22,rad:'田',jawonElement:null},
      {ch:'貼',meaning:'붙을',strokes:12,pilhoek:12,rad:'貝',jawonElement:'금'},
      {ch:'捷',meaning:'이길',strokes:12,pilhoek:11,rad:'手',jawonElement:'목'},
      {ch:'輒',meaning:'문득',strokes:14,pilhoek:14,rad:'車',jawonElement:'화'},
      {ch:'堞',meaning:'성가퀴',strokes:12,pilhoek:12,rad:'土',jawonElement:'토'}
    ],
    '체': [
      {ch:'體',meaning:'몸',strokes:23,pilhoek:22,rad:'骨',jawonElement:null},
      {ch:'切',meaning:'자를',strokes:4,pilhoek:4,rad:'刀',jawonElement:'금'},
      {ch:'遞',meaning:'갈마들',strokes:17,pilhoek:13,rad:'辵',jawonElement:'토'},
      {ch:'滯',meaning:'쌓일',strokes:15,pilhoek:14,rad:'水',jawonElement:'수'},
      {ch:'替',meaning:'바꿀',strokes:12,pilhoek:12,rad:'曰',jawonElement:null},
      {ch:'締',meaning:'맺을',strokes:15,pilhoek:15,rad:'糸',jawonElement:'목'},
      {ch:'綴',meaning:'꿰멜',strokes:14,pilhoek:14,rad:'糸',jawonElement:'목'},
      {ch:'諦',meaning:'살필',strokes:16,pilhoek:16,rad:'言',jawonElement:'금'}
    ],
    '촉': [
      {ch:'觸',meaning:'받을',strokes:20,pilhoek:20,rad:'角',jawonElement:'목'},
      {ch:'屬',meaning:'이을',strokes:20,pilhoek:21,rad:'尸',jawonElement:null},
      {ch:'燭',meaning:'촛불',strokes:17,pilhoek:17,rad:'火',jawonElement:'화'},
      {ch:'促',meaning:'핍박할',strokes:9,pilhoek:9,rad:'人',jawonElement:'화'},
      {ch:'蜀',meaning:'큰 닭',strokes:13,pilhoek:13,rad:'虫',jawonElement:'수'},
      {ch:'矗',meaning:'곧을',strokes:24,pilhoek:24,rad:'目',jawonElement:'목'}
    ],
    '촌': [
      {ch:'寸',meaning:'치',strokes:3,pilhoek:3,rad:'寸',jawonElement:null},
      {ch:'村',meaning:'마을',strokes:7,pilhoek:7,rad:'木',jawonElement:'목'},
      {ch:'忖',meaning:'헤아릴',strokes:7,pilhoek:6,rad:'心',jawonElement:'화'},
      {ch:'邨',meaning:'마을',strokes:11,pilhoek:6,rad:'邑',jawonElement:'토'}
    ],
    '총': [
      {ch:'總',meaning:'꿰맬',strokes:17,pilhoek:17,rad:'糸',jawonElement:'목'},
      {ch:'聰',meaning:'귀 밝을',strokes:17,pilhoek:17,rad:'耳',jawonElement:'화'},
      {ch:'銃',meaning:'총',strokes:14,pilhoek:14,rad:'金',jawonElement:'금'},
      {ch:'寵',meaning:'사랑할',strokes:19,pilhoek:19,rad:'宀',jawonElement:null},
      {ch:'叢',meaning:'떨기',strokes:18,pilhoek:18,rad:'又',jawonElement:null},
      {ch:'摠',meaning:'거느릴',strokes:15,pilhoek:14,rad:'手',jawonElement:'목'},
      {ch:'悤',meaning:'바쁠',strokes:11,pilhoek:11,rad:'心',jawonElement:'화'},
      {ch:'蔥',meaning:'파',strokes:17,pilhoek:14,rad:'艸',jawonElement:'목'}
    ],
    '촬': [
      {ch:'撮',meaning:'머리 끄덩이 잡을',strokes:16,pilhoek:15,rad:'手',jawonElement:'목'}
    ],
    '축': [
      {ch:'祝',meaning:'빌',strokes:10,pilhoek:9,rad:'示',jawonElement:null},
      {ch:'丑',meaning:'소',strokes:4,pilhoek:4,rad:'一',jawonElement:null},
      {ch:'築',meaning:'다질',strokes:16,pilhoek:16,rad:'竹',jawonElement:'목'},
      {ch:'逐',meaning:'물리칠',strokes:14,pilhoek:10,rad:'辵',jawonElement:'토'},
      {ch:'縮',meaning:'줄어들',strokes:17,pilhoek:17,rad:'糸',jawonElement:'목'},
      {ch:'畜',meaning:'가축',strokes:10,pilhoek:10,rad:'田',jawonElement:null},
      {ch:'蓄',meaning:'쌓을',strokes:16,pilhoek:13,rad:'艸',jawonElement:'목'},
      {ch:'軸',meaning:'바디집',strokes:12,pilhoek:12,rad:'車',jawonElement:'화'}
    ],
    '춘': [
      {ch:'春',meaning:'봄',strokes:9,pilhoek:9,rad:'日',jawonElement:null},
      {ch:'椿',meaning:'참죽나무',strokes:13,pilhoek:13,rad:'木',jawonElement:'목'},
      {ch:'瑃',meaning:'옥이름',strokes:14,pilhoek:13,rad:'玉',jawonElement:'금'}
    ],
    '출': [
      {ch:'出',meaning:'보일',strokes:5,pilhoek:5,rad:'凵',jawonElement:null},
      {ch:'黜',meaning:'내칠',strokes:17,pilhoek:17,rad:'黑',jawonElement:'수'},
      {ch:'朮',meaning:'삽주뿌리',strokes:5,pilhoek:5,rad:'木',jawonElement:'목'}
    ],
    '췌': [
      {ch:'悴',meaning:'파리할',strokes:12,pilhoek:11,rad:'心',jawonElement:'화'},
      {ch:'萃',meaning:'모을',strokes:14,pilhoek:11,rad:'艸',jawonElement:'목'},
      {ch:'贅',meaning:'붙일',strokes:18,pilhoek:17,rad:'貝',jawonElement:'금'},
      {ch:'膵',meaning:'지라',strokes:18,pilhoek:15,rad:'肉',jawonElement:null}
    ],
    '취': [
      {ch:'取',meaning:'거둘',strokes:8,pilhoek:8,rad:'又',jawonElement:null},
      {ch:'就',meaning:'좇을',strokes:12,pilhoek:12,rad:'尢',jawonElement:null},
      {ch:'吹',meaning:'불',strokes:7,pilhoek:7,rad:'口',jawonElement:null},
      {ch:'趣',meaning:'추창할',strokes:15,pilhoek:15,rad:'走',jawonElement:'화'},
      {ch:'臭',meaning:'냄새',strokes:10,pilhoek:10,rad:'自',jawonElement:null},
      {ch:'醉',meaning:'궤란할',strokes:15,pilhoek:15,rad:'酉',jawonElement:null},
      {ch:'聚',meaning:'모을',strokes:14,pilhoek:14,rad:'耳',jawonElement:'화'},
      {ch:'炊',meaning:'불 지필',strokes:8,pilhoek:8,rad:'火',jawonElement:'화'}
    ],
    '측': [
      {ch:'測',meaning:'측량할',strokes:13,pilhoek:12,rad:'水',jawonElement:'수'},
      {ch:'側',meaning:'곁',strokes:11,pilhoek:11,rad:'人',jawonElement:'화'},
      {ch:'惻',meaning:'감창할',strokes:13,pilhoek:12,rad:'心',jawonElement:'화'},
      {ch:'仄',meaning:'성조',strokes:4,pilhoek:4,rad:'人',jawonElement:'화'},
      {ch:'厠',meaning:'뒷간',strokes:11,pilhoek:11,rad:'厂',jawonElement:null}
    ],
    '층': [
      {ch:'層',meaning:'겹',strokes:15,pilhoek:15,rad:'尸',jawonElement:null}
    ],
    '치': [
      {ch:'治',meaning:'다스릴',strokes:9,pilhoek:8,rad:'水',jawonElement:'수'},
      {ch:'致',meaning:'이를',strokes:9,pilhoek:10,rad:'至',jawonElement:'토'},
      {ch:'齒',meaning:'이',strokes:15,pilhoek:15,rad:'齒',jawonElement:'금'},
      {ch:'置',meaning:'베풀',strokes:14,pilhoek:13,rad:'网',jawonElement:null},
      {ch:'恥',meaning:'부끄럼',strokes:10,pilhoek:10,rad:'心',jawonElement:'화'},
      {ch:'値',meaning:'값',strokes:10,pilhoek:10,rad:'人',jawonElement:'화'},
      {ch:'徵',meaning:'치성',strokes:15,pilhoek:15,rad:'彳',jawonElement:'화'},
      {ch:'雉',meaning:'꿩',strokes:13,pilhoek:13,rad:'隹',jawonElement:'화'}
    ],
    '칙': [
      {ch:'則',meaning:'법칙',strokes:9,pilhoek:9,rad:'刀',jawonElement:'금'},
      {ch:'勅',meaning:'신칙할',strokes:9,pilhoek:9,rad:'力',jawonElement:null},
      {ch:'飭',meaning:'갖출',strokes:13,pilhoek:12,rad:'食',jawonElement:'수'}
    ],
    '친': [
      {ch:'親',meaning:'사랑할',strokes:16,pilhoek:16,rad:'見',jawonElement:'화'}
    ],
    '칠': [
      {ch:'七',meaning:'일곱',strokes:7,pilhoek:2,rad:null,jawonElement:null},
      {ch:'漆',meaning:'옻나무',strokes:15,pilhoek:14,rad:'水',jawonElement:'수'},
      {ch:'柒',meaning:'옻칠할',strokes:9,pilhoek:9,rad:'木',jawonElement:'목'}
    ],
    '침': [
      {ch:'沈',meaning:'장마물',strokes:8,pilhoek:7,rad:'水',jawonElement:'수'},
      {ch:'針',meaning:'바늘',strokes:10,pilhoek:10,rad:'金',jawonElement:'금'},
      {ch:'侵',meaning:'범할',strokes:9,pilhoek:9,rad:'人',jawonElement:'화'},
      {ch:'寢',meaning:'잠잘',strokes:14,pilhoek:14,rad:'宀',jawonElement:null},
      {ch:'浸',meaning:'적실',strokes:11,pilhoek:10,rad:'水',jawonElement:'수'},
      {ch:'枕',meaning:'베개',strokes:8,pilhoek:8,rad:'木',jawonElement:'목'},
      {ch:'鍼',meaning:'바늘',strokes:17,pilhoek:17,rad:'金',jawonElement:'금'},
      {ch:'砧',meaning:'방칫돌',strokes:10,pilhoek:10,rad:'石',jawonElement:'금'}
    ],
    '칩': [
      {ch:'蟄',meaning:'우물거릴',strokes:17,pilhoek:17,rad:'虫',jawonElement:'수'}
    ],
    '칭': [
      {ch:'稱',meaning:'저울질할',strokes:14,pilhoek:14,rad:'禾',jawonElement:'목'},
      {ch:'秤',meaning:'저울',strokes:10,pilhoek:10,rad:'禾',jawonElement:'목'}
    ],
    '쾌': [
      {ch:'快',meaning:'기분이 좋을',strokes:8,pilhoek:7,rad:'心',jawonElement:'화'},
      {ch:'獪',meaning:'간교할',strokes:17,pilhoek:16,rad:'犬',jawonElement:null}
    ],
    '타': [
      {ch:'他',meaning:'다를',strokes:5,pilhoek:5,rad:'人',jawonElement:'화'},
      {ch:'打',meaning:'칠',strokes:6,pilhoek:5,rad:'手',jawonElement:'목'},
      {ch:'妥',meaning:'편안할',strokes:7,pilhoek:7,rad:'女',jawonElement:'토'},
      {ch:'墮',meaning:'상투',strokes:15,pilhoek:14,rad:'土',jawonElement:'토'},
      {ch:'惰',meaning:'태만할',strokes:13,pilhoek:12,rad:'心',jawonElement:'화'},
      {ch:'唾',meaning:'침',strokes:11,pilhoek:11,rad:'口',jawonElement:null},
      {ch:'陀',meaning:'비탈',strokes:13,pilhoek:7,rad:'阜',jawonElement:'토'},
      {ch:'駝',meaning:'약대',strokes:15,pilhoek:15,rad:'馬',jawonElement:'화'}
    ],
    '탈': [
      {ch:'脫',meaning:'벗어날',strokes:13,pilhoek:11,rad:'肉',jawonElement:null},
      {ch:'奪',meaning:'빼앗을',strokes:14,pilhoek:14,rad:'大',jawonElement:null}
    ],
    '탐': [
      {ch:'探',meaning:'더듬을',strokes:12,pilhoek:11,rad:'手',jawonElement:'목'},
      {ch:'貪',meaning:'탐할',strokes:11,pilhoek:11,rad:'貝',jawonElement:'금'},
      {ch:'耽',meaning:'즐길',strokes:10,pilhoek:10,rad:'耳',jawonElement:'화'},
      {ch:'眈',meaning:'노려볼',strokes:9,pilhoek:9,rad:'目',jawonElement:'목'}
    ],
    '탑': [
      {ch:'塔',meaning:'탑',strokes:13,pilhoek:12,rad:'土',jawonElement:'토'},
      {ch:'搭',meaning:'모뜰',strokes:14,pilhoek:12,rad:'手',jawonElement:'목'},
      {ch:'榻',meaning:'평상',strokes:14,pilhoek:14,rad:'木',jawonElement:'목'}
    ],
    '탕': [
      {ch:'糖',meaning:'엿',strokes:16,pilhoek:16,rad:'米',jawonElement:'목'},
      {ch:'湯',meaning:'물 끓일',strokes:13,pilhoek:12,rad:'水',jawonElement:'수'},
      {ch:'蕩',meaning:'넓고 클',strokes:18,pilhoek:15,rad:'艸',jawonElement:'목'},
      {ch:'宕',meaning:'골집',strokes:8,pilhoek:8,rad:'宀',jawonElement:null},
      {ch:'帑',meaning:'처자식',strokes:8,pilhoek:8,rad:'巾',jawonElement:'목'}
    ],
    '택': [
      {ch:'宅',meaning:'집',strokes:6,pilhoek:6,rad:'宀',jawonElement:null},
      {ch:'擇',meaning:'가릴',strokes:17,pilhoek:16,rad:'手',jawonElement:'목'},
      {ch:'澤',meaning:'못',strokes:17,pilhoek:16,rad:'水',jawonElement:'수'}
    ],
    '탱': [
      {ch:'撑',meaning:'버틸',strokes:16,pilhoek:15,rad:'手',jawonElement:'목'}
    ],
    '터': [
      {ch:'攄',meaning:'펼칠',strokes:19,pilhoek:18,rad:'手',jawonElement:'목'}
    ],
    '토': [
      {ch:'土',meaning:'흙',strokes:3,pilhoek:3,rad:'土',jawonElement:'토'},
      {ch:'討',meaning:'다스릴',strokes:10,pilhoek:10,rad:'言',jawonElement:'금'},
      {ch:'吐',meaning:'나올',strokes:6,pilhoek:6,rad:'口',jawonElement:null},
      {ch:'兎',meaning:'토끼',strokes:8,pilhoek:7,rad:'儿',jawonElement:null}
    ],
    '통': [
      {ch:'通',meaning:'뚫릴',strokes:14,pilhoek:10,rad:'辵',jawonElement:'토'},
      {ch:'洞',meaning:'구렁',strokes:10,pilhoek:9,rad:'水',jawonElement:'수'},
      {ch:'統',meaning:'거느릴',strokes:12,pilhoek:12,rad:'糸',jawonElement:'목'},
      {ch:'痛',meaning:'상할',strokes:12,pilhoek:12,rad:'疒',jawonElement:'수'},
      {ch:'慟',meaning:'서러울',strokes:15,pilhoek:14,rad:'心',jawonElement:'화'},
      {ch:'筒',meaning:'사통대',strokes:12,pilhoek:12,rad:'竹',jawonElement:'목'},
      {ch:'桶',meaning:'엿되들이 통',strokes:11,pilhoek:11,rad:'木',jawonElement:'목'}
    ],
    '퇴': [
      {ch:'退',meaning:'물러갈',strokes:13,pilhoek:9,rad:'辵',jawonElement:'토'},
      {ch:'頹',meaning:'사나운 바람',strokes:16,pilhoek:16,rad:'頁',jawonElement:'화'},
      {ch:'堆',meaning:'언덕',strokes:11,pilhoek:11,rad:'土',jawonElement:'토'},
      {ch:'槌',meaning:'너스레',strokes:14,pilhoek:13,rad:'木',jawonElement:'목'},
      {ch:'腿',meaning:'넓적다리',strokes:16,pilhoek:13,rad:'肉',jawonElement:null},
      {ch:'鎚',meaning:'옥 다듬을',strokes:18,pilhoek:17,rad:'金',jawonElement:'금'},
      {ch:'褪',meaning:'옷 벗을',strokes:16,pilhoek:14,rad:'衣',jawonElement:'목'}
    ],
    '투': [
      {ch:'投',meaning:'던질',strokes:8,pilhoek:7,rad:'手',jawonElement:'목'},
      {ch:'鬪',meaning:'싸움',strokes:20,pilhoek:20,rad:'鬥',jawonElement:'금'},
      {ch:'透',meaning:'통할',strokes:14,pilhoek:10,rad:'辵',jawonElement:'토'},
      {ch:'套',meaning:'전례',strokes:10,pilhoek:10,rad:'大',jawonElement:null},
      {ch:'妬',meaning:'투기할',strokes:8,pilhoek:8,rad:'女',jawonElement:'토'},
      {ch:'偸',meaning:'엷을',strokes:11,pilhoek:11,rad:'人',jawonElement:'화'}
    ],
    '특': [
      {ch:'特',meaning:'우뚝할',strokes:10,pilhoek:10,rad:'牛',jawonElement:'토'},
      {ch:'慝',meaning:'간악할',strokes:15,pilhoek:14,rad:'心',jawonElement:'화'}
    ],
    '파': [
      {ch:'破',meaning:'깨뜨릴',strokes:10,pilhoek:10,rad:'石',jawonElement:'금'},
      {ch:'波',meaning:'물결',strokes:9,pilhoek:8,rad:'水',jawonElement:'수'},
      {ch:'罷',meaning:'파할',strokes:16,pilhoek:15,rad:'网',jawonElement:null},
      {ch:'播',meaning:'심을',strokes:16,pilhoek:15,rad:'手',jawonElement:'목'},
      {ch:'派',meaning:'물 갈래',strokes:10,pilhoek:9,rad:'水',jawonElement:'수'},
      {ch:'頗',meaning:'비뚤어질',strokes:14,pilhoek:14,rad:'頁',jawonElement:'화'},
      {ch:'把',meaning:'잡을',strokes:9,pilhoek:7,rad:'手',jawonElement:'목'},
      {ch:'坡',meaning:'언덕',strokes:8,pilhoek:8,rad:'土',jawonElement:'토'}
    ],
    '팔': [
      {ch:'八',meaning:'여덟',strokes:8,pilhoek:2,rad:null,jawonElement:null},
      {ch:'捌',meaning:'깨뜨릴',strokes:11,pilhoek:10,rad:'手',jawonElement:'목'}
    ],
    '패': [
      {ch:'貝',meaning:'조개',strokes:7,pilhoek:7,rad:'貝',jawonElement:'금'},
      {ch:'敗',meaning:'헐어질',strokes:11,pilhoek:11,rad:'攴',jawonElement:'금'},
      {ch:'牌',meaning:'방 붙일',strokes:12,pilhoek:12,rad:'片',jawonElement:'목'},
      {ch:'悖',meaning:'거슬릴',strokes:11,pilhoek:10,rad:'心',jawonElement:'화'},
      {ch:'覇',meaning:'두목',strokes:19,pilhoek:19,rad:'襾',jawonElement:null},
      {ch:'佩',meaning:'패옥',strokes:8,pilhoek:8,rad:'人',jawonElement:'화'},
      {ch:'沛',meaning:'둥둥 뜰',strokes:8,pilhoek:7,rad:'水',jawonElement:'수'},
      {ch:'稗',meaning:'돌피',strokes:13,pilhoek:13,rad:'禾',jawonElement:'목'}
    ],
    '퍅': [
      {ch:'愎',meaning:'고집할',strokes:13,pilhoek:12,rad:'心',jawonElement:'화'}
    ],
    '폄': [
      {ch:'貶',meaning:'덜릴',strokes:12,pilhoek:11,rad:'貝',jawonElement:'금'}
    ],
    '폐': [
      {ch:'閉',meaning:'닫을',strokes:11,pilhoek:11,rad:'門',jawonElement:null},
      {ch:'廢',meaning:'내칠',strokes:15,pilhoek:15,rad:'广',jawonElement:'목'},
      {ch:'肺',meaning:'허파',strokes:10,pilhoek:8,rad:'肉',jawonElement:null},
      {ch:'弊',meaning:'해질',strokes:15,pilhoek:14,rad:'廾',jawonElement:null},
      {ch:'蔽',meaning:'가리울',strokes:18,pilhoek:14,rad:'艸',jawonElement:'목'},
      {ch:'幣',meaning:'폐백',strokes:15,pilhoek:14,rad:'巾',jawonElement:'목'},
      {ch:'陛',meaning:'대궐 섬돌',strokes:15,pilhoek:9,rad:'阜',jawonElement:'토'},
      {ch:'斃',meaning:'엎드러질',strokes:18,pilhoek:17,rad:'攴',jawonElement:'금'}
    ],
    '폭': [
      {ch:'暴',meaning:'햇빛 쪼일',strokes:15,pilhoek:15,rad:'日',jawonElement:null},
      {ch:'爆',meaning:'불터질',strokes:19,pilhoek:19,rad:'火',jawonElement:'화'},
      {ch:'幅',meaning:'폭',strokes:12,pilhoek:12,rad:'巾',jawonElement:'목'},
      {ch:'瀑',meaning:'폭포수',strokes:19,pilhoek:18,rad:'水',jawonElement:'수'},
      {ch:'曝',meaning:'햇볕에 말릴',strokes:19,pilhoek:19,rad:'日',jawonElement:null}
    ],
    '품': [
      {ch:'品',meaning:'뭇',strokes:9,pilhoek:9,rad:'口',jawonElement:null},
      {ch:'稟',meaning:'여쭐',strokes:13,pilhoek:13,rad:'禾',jawonElement:'목'}
    ],
    '핍': [
      {ch:'乏',meaning:'옹색할',strokes:5,pilhoek:4,rad:'丿',jawonElement:null},
      {ch:'逼',meaning:'가까울',strokes:16,pilhoek:12,rad:'辵',jawonElement:'토'}
    ],
    '할': [
      {ch:'轄',meaning:'다스릴',strokes:17,pilhoek:17,rad:'車',jawonElement:'화'}
    ],
    '합': [
      {ch:'合',meaning:'합할',strokes:6,pilhoek:6,rad:'口',jawonElement:null},
      {ch:'陜',meaning:'고을이름',strokes:15,pilhoek:9,rad:'阜',jawonElement:'토'},
      {ch:'蛤',meaning:'조개',strokes:12,pilhoek:12,rad:'虫',jawonElement:'수'},
      {ch:'盒',meaning:'소반 뚜껑',strokes:11,pilhoek:11,rad:'皿',jawonElement:null},
      {ch:'閤',meaning:'도장',strokes:14,pilhoek:14,rad:'門',jawonElement:null},
      {ch:'哈',meaning:'한 모금',strokes:9,pilhoek:9,rad:'口',jawonElement:null},
      {ch:'闔',meaning:'문짝',strokes:18,pilhoek:18,rad:'門',jawonElement:null}
    ],
    '항': [
      {ch:'行',meaning:'항렬',strokes:6,pilhoek:6,rad:'行',jawonElement:null},
      {ch:'恒',meaning:'늘',strokes:10,pilhoek:9,rad:'心',jawonElement:'화'},
      {ch:'降',meaning:'항복할',strokes:14,pilhoek:8,rad:'阜',jawonElement:'토'},
      {ch:'項',meaning:'목덜미',strokes:12,pilhoek:12,rad:'頁',jawonElement:'화'},
      {ch:'抗',meaning:'막을',strokes:8,pilhoek:7,rad:'手',jawonElement:'목'},
      {ch:'巷',meaning:'거리',strokes:9,pilhoek:9,rad:'己',jawonElement:null},
      {ch:'港',meaning:'물 갈라질',strokes:13,pilhoek:12,rad:'水',jawonElement:'수'},
      {ch:'航',meaning:'쌍배',strokes:10,pilhoek:10,rad:'舟',jawonElement:'목'}
    ],
    '핵': [
      {ch:'核',meaning:'실과',strokes:10,pilhoek:10,rad:'木',jawonElement:'목'},
      {ch:'劾',meaning:'캐물을',strokes:8,pilhoek:8,rad:'力',jawonElement:null}
    ],
    '행': [
      {ch:'幸',meaning:'다행할',strokes:8,pilhoek:8,rad:'干',jawonElement:'목'},
      {ch:'行',meaning:'다닐',strokes:6,pilhoek:6,rad:'行',jawonElement:null},
      {ch:'杏',meaning:'살구',strokes:7,pilhoek:7,rad:'木',jawonElement:'목'},
      {ch:'倖',meaning:'요행',strokes:10,pilhoek:10,rad:'人',jawonElement:'화'},
      {ch:'荇',meaning:'조아기',strokes:12,pilhoek:9,rad:'艸',jawonElement:'목'}
    ],
    '헐': [
      {ch:'歇',meaning:'쉴',strokes:13,pilhoek:13,rad:'欠',jawonElement:null}
    ],
    '험': [
      {ch:'險',meaning:'험난할',strokes:21,pilhoek:15,rad:'阜',jawonElement:'토'},
      {ch:'驗',meaning:'보람',strokes:23,pilhoek:23,rad:'馬',jawonElement:'화'}
    ],
    '혈': [
      {ch:'血',meaning:'피',strokes:6,pilhoek:6,rad:'血',jawonElement:'수'},
      {ch:'穴',meaning:'움',strokes:5,pilhoek:5,rad:'穴',jawonElement:'수'},
      {ch:'孑',meaning:'외로울',strokes:3,pilhoek:3,rad:'子',jawonElement:'수'},
      {ch:'頁',meaning:'머리',strokes:9,pilhoek:9,rad:'頁',jawonElement:'화'}
    ],
    '혐': [
      {ch:'嫌',meaning:'싫어할',strokes:13,pilhoek:13,rad:'女',jawonElement:'토'}
    ],
    '협': [
      {ch:'協',meaning:'조화할',strokes:8,pilhoek:8,rad:'十',jawonElement:null},
      {ch:'脅',meaning:'갈빗대',strokes:12,pilhoek:10,rad:'肉',jawonElement:null},
      {ch:'峽',meaning:'물 낀 두메',strokes:10,pilhoek:10,rad:'山',jawonElement:'토'},
      {ch:'挾',meaning:'낄',strokes:11,pilhoek:10,rad:'手',jawonElement:'목'},
      {ch:'俠',meaning:'의기',strokes:9,pilhoek:9,rad:'人',jawonElement:'화'},
      {ch:'頰',meaning:'뺨',strokes:16,pilhoek:16,rad:'頁',jawonElement:'화'},
      {ch:'夾',meaning:'곁',strokes:7,pilhoek:7,rad:'大',jawonElement:null},
      {ch:'浹',meaning:'사무칠',strokes:11,pilhoek:10,rad:'水',jawonElement:'수'}
    ],
    '혹': [
      {ch:'或',meaning:'혹',strokes:8,pilhoek:8,rad:'戈',jawonElement:null},
      {ch:'鵠',meaning:'고니',strokes:18,pilhoek:18,rad:'鳥',jawonElement:'화'}
    ],
    '혼': [
      {ch:'混',meaning:'섞을',strokes:12,pilhoek:11,rad:'水',jawonElement:'수'},
      {ch:'婚',meaning:'혼인할',strokes:11,pilhoek:11,rad:'女',jawonElement:'토'},
      {ch:'魂',meaning:'넋',strokes:14,pilhoek:13,rad:'鬼',jawonElement:'화'},
      {ch:'琿',meaning:'아름다운옥',strokes:14,pilhoek:13,rad:'玉',jawonElement:'금'}
    ],
    '홀': [
      {ch:'忽',meaning:'소흘히 할',strokes:8,pilhoek:8,rad:'心',jawonElement:'화'},
      {ch:'笏',meaning:'홀',strokes:10,pilhoek:10,rad:'竹',jawonElement:'목'},
      {ch:'惚',meaning:'황홀할',strokes:12,pilhoek:11,rad:'心',jawonElement:'화'}
    ],
    '확': [
      {ch:'確',meaning:'굳을',strokes:15,pilhoek:15,rad:'石',jawonElement:'금'},
      {ch:'擴',meaning:'넓힐',strokes:19,pilhoek:17,rad:'手',jawonElement:'목'},
      {ch:'穫',meaning:'곡식거둘',strokes:19,pilhoek:18,rad:'禾',jawonElement:'목'},
      {ch:'廓',meaning:'둘레',strokes:14,pilhoek:13,rad:'广',jawonElement:'목'},
      {ch:'攫',meaning:'움킬',strokes:24,pilhoek:23,rad:'手',jawonElement:'목'},
      {ch:'碻',meaning:'굳을',strokes:15,pilhoek:15,rad:'石',jawonElement:'금'}
    ],
    '활': [
      {ch:'活',meaning:'살',strokes:10,pilhoek:9,rad:'水',jawonElement:'수'},
      {ch:'闊',meaning:'트일',strokes:17,pilhoek:17,rad:'門',jawonElement:null},
      {ch:'猾',meaning:'교활할',strokes:14,pilhoek:12,rad:'犬',jawonElement:null},
      {ch:'豁',meaning:'뚫린 골',strokes:17,pilhoek:17,rad:'谷',jawonElement:'수'}
    ],
    '획': [
      {ch:'獲',meaning:'얻을',strokes:18,pilhoek:16,rad:'犬',jawonElement:null},
      {ch:'劃',meaning:'쪼갤',strokes:14,pilhoek:14,rad:'刀',jawonElement:'금'}
    ],
    '횡': [
      {ch:'橫',meaning:'가로',strokes:16,pilhoek:16,rad:'木',jawonElement:'목'},
      {ch:'薨',meaning:'많을',strokes:19,pilhoek:16,rad:'艸',jawonElement:'목'},
      {ch:'宖',meaning:'평안할',strokes:8,pilhoek:8,rad:'宀',jawonElement:null},
      {ch:'鐄',meaning:'큰 종',strokes:20,pilhoek:19,rad:'金',jawonElement:'금'}
    ],
    '훤': [
      {ch:'喧',meaning:'의젓할',strokes:12,pilhoek:12,rad:'口',jawonElement:null},
      {ch:'萱',meaning:'원추리',strokes:15,pilhoek:12,rad:'艸',jawonElement:'목'},
      {ch:'暄',meaning:'따뜻할',strokes:13,pilhoek:13,rad:'日',jawonElement:null},
      {ch:'煊',meaning:'따뜻할',strokes:13,pilhoek:13,rad:'火',jawonElement:'화'}
    ],
    '훼': [
      {ch:'毁',meaning:'헐',strokes:13,pilhoek:13,rad:'殳',jawonElement:'금'},
      {ch:'喙',meaning:'부리',strokes:12,pilhoek:12,rad:'口',jawonElement:null},
      {ch:'卉',meaning:'풀',strokes:5,pilhoek:5,rad:'十',jawonElement:null}
    ],
    '휴': [
      {ch:'休',meaning:'쉴',strokes:6,pilhoek:6,rad:'人',jawonElement:'화'},
      {ch:'携',meaning:'끌',strokes:14,pilhoek:13,rad:'手',jawonElement:'목'},
      {ch:'烋',meaning:'경사로울',strokes:10,pilhoek:10,rad:'火',jawonElement:'화'},
      {ch:'虧',meaning:'이지러질',strokes:17,pilhoek:17,rad:'虍',jawonElement:null},
      {ch:'畦',meaning:'밭두둑',strokes:11,pilhoek:11,rad:'田',jawonElement:null}
    ],
    '휵': [
      {ch:'畜',meaning:'기를',strokes:10,pilhoek:10,rad:'田',jawonElement:null}
    ],
    '휼': [
      {ch:'恤',meaning:'구휼할',strokes:10,pilhoek:9,rad:'心',jawonElement:'화'},
      {ch:'鷸',meaning:'황새',strokes:23,pilhoek:23,rad:'鳥',jawonElement:'화'}
    ],
    '흉': [
      {ch:'胸',meaning:'가슴',strokes:12,pilhoek:10,rad:'肉',jawonElement:null},
      {ch:'匈',meaning:'가슴',strokes:6,pilhoek:6,rad:'勹',jawonElement:null},
      {ch:'兇',meaning:'나쁜',strokes:6,pilhoek:6,rad:'儿',jawonElement:null},
      {ch:'洶',meaning:'물살세찰',strokes:10,pilhoek:9,rad:'水',jawonElement:'수'}
    ],
    '흑': [
      {ch:'黑',meaning:'검을',strokes:12,pilhoek:12,rad:'黑',jawonElement:'수'}
    ],
    '흔': [
      {ch:'昕',meaning:'아침',strokes:8,pilhoek:8,rad:'日',jawonElement:null},
      {ch:'欣',meaning:'기뻐할',strokes:8,pilhoek:8,rad:'欠',jawonElement:null},
      {ch:'炘',meaning:'화끈거릴',strokes:8,pilhoek:8,rad:'火',jawonElement:'화'}
    ],
    '흘': [
      {ch:'訖',meaning:'이를',strokes:10,pilhoek:10,rad:'言',jawonElement:'금'},
      {ch:'吃',meaning:'말더듬을',strokes:6,pilhoek:6,rad:'口',jawonElement:null},
      {ch:'屹',meaning:'산 우뚝솟을',strokes:6,pilhoek:6,rad:'山',jawonElement:'토'},
      {ch:'紇',meaning:'질 낮은 명주실',strokes:9,pilhoek:9,rad:'糸',jawonElement:'목'}
    ],
    '흡': [
      {ch:'吸',meaning:'숨 들이쉴',strokes:7,pilhoek:6,rad:'口',jawonElement:null},
      {ch:'洽',meaning:'윤태하게 할',strokes:10,pilhoek:9,rad:'水',jawonElement:'수'},
      {ch:'恰',meaning:'마치',strokes:10,pilhoek:9,rad:'心',jawonElement:'화'},
      {ch:'翕',meaning:'합할',strokes:12,pilhoek:12,rad:'羽',jawonElement:'화'}
    ],
    '힐': [
      {ch:'詰',meaning:'물을',strokes:13,pilhoek:13,rad:'言',jawonElement:'금'}
    ],
  };

  // reading 필드는 키에서 채워 넣는다(중복 저장 방지).
  // 한 한자가 여러 음을 갖는 경우(例 金=금/김, 樂=락/악/요)가 있어 byChar에는
  // 먼저 등장한 음의 항목을 담고, 음을 아는 호출자는 lookup(ch, reading)으로 정확히 집는다.
  var byChar = {};
  Object.keys(byReading).forEach(function (r) {
    byReading[r].forEach(function (e) { e.reading = r; if (!byChar[e.ch]) byChar[e.ch] = e; });
  });

  global.HanjaDB = {
    version: '1.3',
    byReading: byReading,
    byChar: byChar,
    readings: Object.keys(byReading),
    /** 음절(한글 1자)에 대응하는 한자 후보 배열. 없으면 [] */
    candidates: function (syllable) { return byReading[syllable] || []; },
    /** 한자 1자 → 항목. reading을 주면 그 음의 항목을 우선 찾는다. 없으면 null */
    lookup: function (ch, reading) {
      if (reading && byReading[reading]) {
        for (var i = 0; i < byReading[reading].length; i++) {
          if (byReading[reading][i].ch === ch) return byReading[reading][i];
        }
      }
      return byChar[ch] || null;
    },
    /** 서로 다른 한자 글자 수(다음자 중복 제외) */
    uniqueChars: Object.keys(byChar).length,
    count: 2571
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = global.HanjaDB;
})(typeof window !== 'undefined' ? window : this);
