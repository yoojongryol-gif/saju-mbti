/**
 * name-surname-db.js — MZ사주풀이 성씨·본관 한자 DB (v1.8)
 * ⚠ 이 파일은 _data/build_surname_db.js 가 _data/surname_research.json 에서 자동 생성한다.
 *   직접 수정하지 말 것. (생성일 2026-08-17)
 *
 * ── 원자료 출처(교차확인 2곳+, 상세 URL 120개는 _data/surname_research.json.sources 참조) ──
 *   위키백과 "한국의 성씨_목록"·"대한민국의_인구순_성씨_목록"·"한국의_성씨와_이름" +
 *   개별 성씨 문서(김_(성씨) 등 90여개) — 3중 이상 교차확인.
 *   두음법칙 변형(유/류·이/리·임/림·나/라·노/로·양/량·염/렴·여/려·육/륙)은 2007년 대법원
 *   개명 허용 판례 보도(한국일보·경북매일·부산일보·경기신문)로 교차확인.
 *   교차확인 실패 항목(예: 형씨邢, 강씨 일부 희귀 한자)은 리서치 단계에서 이미 생략했다.
 *
 * ── 뜻·원획 재사용 정책 ──
 *   name-hanja-db.js(HanjaDB)에 이미 있는 글자는 그 meaning/strokes/jawonElement를 그대로
 *   재사용한다(fromHanjaDB 필드 없으면 재사용, false면 아래 수동 산출).
 *   HanjaDB 미등재 글자(2건: 王·魯)는 name-hanja-db.js와 동일한 원획 산출 규약을 손으로
 *   적용했다 — 근거는 _data/build_surname_db.js의 MANUAL_HANJA 주석 참조.
 *
 * ── 커버리지 ──
 *   122개 단음절 + 복성 8종(남궁·황보·선우·독고·제갈·사공·서문·동방), 
 *   한자 항목(두음 미러 포함) 195건.
 *   목표(SPEC.md "250성+")에는 못 미친다 — "교차확인 안 되는 본관·한자는 수록 생략" 원칙을
 *   엄격 적용한 결과이며, 허구 데이터로 개수를 채우지 않았다(리서치 보고 참조).
 *
 * ── 필드 ──
 *   ch 한자 / reading 이 항목의 음 / meaning·strokes(원획)·jawonElement HanjaDB와 동형 /
 *   surname 이 한자가 속하는 성씨 표기(단성=reading과 동일, 복성이면 2음절 라벨 예:"남궁") /
 *   bongwans 본관 목록(문자열 배열) / note 두음·특이사항 메모(없으면 없음) /
 *   compoundOf 이 글자가 복성의 구성자로도 쓰이면 [{label,otherChar,otherReading,bongwans}] /
 *   compoundOnly 단성 용례 없이 복성에서만 쓰이는 글자면 true /
 *   aliasMirrorOf 두음법칙으로 다른 음절 항목을 복제한 것이면 원래 음절.
 */

(function (global) {
  'use strict';

  var dueumAlias = {"유":"류","류":"유","이":"리","리":"이","임":"림","림":"임","나":"라","라":"나","노":"로","로":"노","양":"량","량":"양","염":"렴","렴":"염","여":"려","려":"여","육":"륙","륙":"육"};

  var bySyllable = {
    "갈": [
      {ch:"葛",reading:"갈",meaning:"칡",strokes:15,jawonElement:"목",surname:"갈",bongwans:["대구","남양","청주","성주","충주"],compoundOf:[{"label":"제갈","otherChar":"諸","otherReading":"제","bongwans":["남양","칠원","대구","남원","충주"]}]}
    ],
    "강": [
      {ch:"姜",reading:"강",meaning:"성씨",strokes:9,jawonElement:"토",surname:"강",bongwans:["진주","금천","경주","광주","나주","동복","배천","안동","전주","충주","해미"]},
      {ch:"康",reading:"강",meaning:"편안할",strokes:11,jawonElement:"목",surname:"강",bongwans:["곡산","신천","재령","영강","임실","진주","충주"]}
    ],
    "견": [
      {ch:"甄",reading:"견",meaning:"질그릇",strokes:14,jawonElement:null,surname:"견",bongwans:["황간","상주","전주","청양"]}
    ],
    "경": [
      {ch:"慶",reading:"경",meaning:"경사",strokes:15,jawonElement:"화",surname:"경",bongwans:["청주"]},
      {ch:"景",reading:"경",meaning:"볕",strokes:12,jawonElement:null,surname:"경",bongwans:["태인","해주"]}
    ],
    "계": [
      {ch:"桂",reading:"계",meaning:"계수나무",strokes:10,jawonElement:"목",surname:"계",bongwans:["수안"]}
    ],
    "고": [
      {ch:"高",reading:"고",meaning:"높을",strokes:10,jawonElement:"화",surname:"고",bongwans:["제주","횡성","장흥","개성","상당","연안","안동","고봉","김화","담양","옥구","용담","의령","토산"]},
      {ch:"孤",reading:"고",meaning:"외로울",strokes:8,jawonElement:"수",surname:"독고",bongwans:["남원"],compoundOf:[{"label":"독고","otherChar":"獨","otherReading":"독","bongwans":["남원"]}],compoundOnly:true}
    ],
    "공": [
      {ch:"孔",reading:"공",meaning:"구멍",strokes:4,jawonElement:"수",surname:"공",bongwans:["곡부"]},
      {ch:"公",reading:"공",meaning:"공변될",strokes:4,jawonElement:null,surname:"공",bongwans:["김포","문천"]},
      {ch:"空",reading:"공",meaning:"빌",strokes:8,jawonElement:"수",surname:"사공",bongwans:["효령(군위)"],compoundOf:[{"label":"사공","otherChar":"司","otherReading":"사","bongwans":["효령(군위)"]}],compoundOnly:true}
    ],
    "곽": [
      {ch:"郭",reading:"곽",meaning:"성곽",strokes:15,jawonElement:"토",surname:"곽",bongwans:["현풍","청주","선산","해미","봉산","청풍","포산"]}
    ],
    "구": [
      {ch:"具",reading:"구",meaning:"갖출",strokes:8,jawonElement:null,surname:"구",bongwans:["능성","창원","평해"]},
      {ch:"丘",reading:"구",meaning:"언덕",strokes:5,jawonElement:null,surname:"구",bongwans:["평해"]}
    ],
    "국": [
      {ch:"鞠",reading:"국",meaning:"기를",strokes:17,jawonElement:"금",surname:"국",bongwans:["담양","영광","복성","진주","대구","부령"]},
      {ch:"國",reading:"국",meaning:"나라",strokes:11,jawonElement:null,surname:"국",bongwans:["담양"]}
    ],
    "궁": [
      {ch:"宮",reading:"궁",meaning:"굴궐",strokes:10,jawonElement:null,surname:"남궁",bongwans:["함열"],compoundOf:[{"label":"남궁","otherChar":"南","otherReading":"남","bongwans":["함열"]}],compoundOnly:true}
    ],
    "권": [
      {ch:"權",reading:"권",meaning:"권세",strokes:22,jawonElement:"목",surname:"권",bongwans:["안동","예천"]}
    ],
    "금": [
      {ch:"琴",reading:"금",meaning:"거문고",strokes:13,jawonElement:"금",surname:"금",bongwans:["봉화","계양"]}
    ],
    "기": [
      {ch:"奇",reading:"기",meaning:"기이할",strokes:8,jawonElement:null,surname:"기",bongwans:["행주","경주","장성"]},
      {ch:"箕",reading:"기",meaning:"키",strokes:14,jawonElement:"목",surname:"기",bongwans:["행주","평양"]}
    ],
    "길": [
      {ch:"吉",reading:"길",meaning:"길할",strokes:6,jawonElement:null,surname:"길",bongwans:["해평(선산)"]}
    ],
    "김": [
      {ch:"金",reading:"김",meaning:"사람의 성",strokes:8,jawonElement:"금",surname:"김",bongwans:["김해","경주","광산","강릉","선산","연안","영산","순천","울산","의성","언양","삼척","나주","안동","상산","고령","전주","경산","진주","일선","청풍","곡산","水原(수원)"]}
    ],
    "나": [
      {ch:"羅",reading:"나",meaning:"새 그물",strokes:20,jawonElement:null,surname:"나",bongwans:["나주","금성","안정","군위","비안","수성"],note:"두음법칙상 '라'로도 등록/표기(census에서 나/라 별도 집계, 2007 대법원 판례 적용 실제 개명 575명)"}
    ],
    "남": [
      {ch:"南",reading:"남",meaning:"남녘",strokes:9,jawonElement:null,surname:"남",bongwans:["의령","영양","고성","남원","경주","고령","남양","남평","대전","밀양","보성","안동","진주","창녕","함안"],compoundOf:[{"label":"남궁","otherChar":"宮","otherReading":"궁","bongwans":["함열"]}]}
    ],
    "노": [
      {ch:"盧",reading:"노",meaning:"밥그릇",strokes:16,jawonElement:null,surname:"노",bongwans:["광주","교하","풍천","장연","안동","안강","연일","곡산"],note:"원래 발음 '로', 두음법칙상 '노'로 표기(2007 대법원 판례 대상)"},
      {ch:"魯",reading:"노",meaning:"노나라 로",strokes:15,jawonElement:null,surname:"노",bongwans:["함평","함풍","강화","광주"],fromHanjaDB:false},
      {ch:"路",reading:"노",meaning:"길",strokes:13,jawonElement:"토",surname:"노",bongwans:["개성"]}
    ],
    "당": [
      {ch:"唐",reading:"당",meaning:"당나라",strokes:10,jawonElement:null,surname:"당",bongwans:["밀양"]}
    ],
    "도": [
      {ch:"都",reading:"도",meaning:"도읍",strokes:16,jawonElement:"토",surname:"도",bongwans:["성주","경주","밀양","청주"]}
    ],
    "독": [
      {ch:"獨",reading:"독",meaning:"홀로",strokes:17,jawonElement:null,surname:"독고",bongwans:["남원"],compoundOf:[{"label":"독고","otherChar":"孤","otherReading":"고","bongwans":["남원"]}],compoundOnly:true}
    ],
    "동": [
      {ch:"董",reading:"동",meaning:"바로잡을",strokes:15,jawonElement:"목",surname:"동",bongwans:["광천","경주","안동","원주","전주","청주","충주","풍천","하동","황주"]},
      {ch:"東",reading:"동",meaning:"동녘",strokes:8,jawonElement:"목",surname:"동방",bongwans:["진주","청주"],compoundOf:[{"label":"동방","otherChar":"方","otherReading":"방","bongwans":["진주","청주"]}],compoundOnly:true}
    ],
    "두": [
      {ch:"杜",reading:"두",meaning:"막을",strokes:7,jawonElement:"목",surname:"두",bongwans:["두릉","만경"]}
    ],
    "라": [
      {ch:"羅",reading:"라",meaning:"새그물",strokes:20,jawonElement:null,surname:"라",bongwans:["금성","나주"],note:"羅씨의 두음법칙 원음 표기(나 항목과 동일 한자, dueumAliases 참고)"}
    ],
    "량": [
      {ch:"梁",reading:"량",meaning:"푸조나무",strokes:11,jawonElement:"목",surname:"량",bongwans:["제주","남원","충주","전주","나주","경주","임천","진주","청주","안동"],note:"두음법칙상 '량'으로도 등록/표기 가능(2007 대법원 판례)",aliasMirrorOf:"양"},
      {ch:"楊",reading:"량",meaning:"갯버들",strokes:13,jawonElement:"목",surname:"량",bongwans:["청주","안악","밀양","중화","남원","통주","대구","진주","충주"],aliasMirrorOf:"양"}
    ],
    "려": [
      {ch:"呂",reading:"려",meaning:"음률",strokes:7,jawonElement:null,surname:"려",bongwans:["함양","성주(성산)"],note:"두음법칙에 따라 '여' 또는 '려' 두 가지 음으로 실제 병기됨(직접 확인)",aliasMirrorOf:"여"},
      {ch:"余",reading:"려",meaning:"자기",strokes:7,jawonElement:"화",surname:"려",bongwans:["의령","하동"],aliasMirrorOf:"여"}
    ],
    "렴": [
      {ch:"廉",reading:"렴",meaning:"청렴할",strokes:13,jawonElement:"목",surname:"렴",bongwans:["파주","용담"],note:"두음법칙상 '렴'으로도 등록 가능(2007 대법원 판례)",aliasMirrorOf:"염"}
    ],
    "로": [
      {ch:"盧",reading:"로",meaning:"밥그릇",strokes:16,jawonElement:null,surname:"로",bongwans:["광주","교하","풍천","장연","안동","안강","연일","곡산"],note:"원래 발음 '로', 두음법칙상 '노'로 표기(2007 대법원 판례 대상)",aliasMirrorOf:"노"},
      {ch:"魯",reading:"로",meaning:"노나라 로",strokes:15,jawonElement:null,surname:"로",bongwans:["함평","함풍","강화","광주"],aliasMirrorOf:"노",fromHanjaDB:false},
      {ch:"路",reading:"로",meaning:"길",strokes:13,jawonElement:"토",surname:"로",bongwans:["개성"],aliasMirrorOf:"노"}
    ],
    "류": [
      {ch:"劉",reading:"류",meaning:"성",strokes:15,jawonElement:"금",surname:"류",bongwans:["강릉","거창","배천","연안","충주","성주","연백"],note:"두음법칙상 '류'로도 등록/표기",aliasMirrorOf:"유"},
      {ch:"兪",reading:"류",meaning:"그럴",strokes:9,jawonElement:null,surname:"류",bongwans:["기계","무안","강진","인동","고령","창원","장사"],aliasMirrorOf:"유"},
      {ch:"柳",reading:"류",meaning:"버들",strokes:9,jawonElement:"목",surname:"류",bongwans:["문화","전주","고흥","서산","선산","약목","영광","육창","정주","진주","진천","풍산","하동","하회"],note:"두음법칙상 '류'로도 등록/표기(2007년 이후 다수 개명, census에서 유/류 별도 집계)",aliasMirrorOf:"유"},
      {ch:"庾",reading:"류",meaning:"노적",strokes:12,jawonElement:"목",surname:"류",bongwans:["평산","무송"],aliasMirrorOf:"유"}
    ],
    "륙": [
      {ch:"陸",reading:"륙",meaning:"뭍",strokes:16,jawonElement:"토",surname:"륙",bongwans:["옥천"],note:"두음법칙상 '륙'으로도 표기 언급됨",aliasMirrorOf:"육"}
    ],
    "리": [
      {ch:"李",reading:"리",meaning:"오얏",strokes:7,jawonElement:"목",surname:"리",bongwans:["전주","경주","성주","광주","합천","연안","한산","전의","함평","영천","벽진","고성","성산","여주","인천"],note:"두음법칙상 '리'로도 등록 가능(2007 대법원 판례, 실제 개명 211명 확인)",aliasMirrorOf:"이"},
      {ch:"伊",reading:"리",meaning:"저",strokes:6,jawonElement:"화",surname:"리",bongwans:["충주","태원"],aliasMirrorOf:"이"},
      {ch:"異",reading:"리",meaning:"다를",strokes:12,jawonElement:null,surname:"리",bongwans:["밀양","청양"],aliasMirrorOf:"이"}
    ],
    "림": [
      {ch:"林",reading:"림",meaning:"수풀",strokes:8,jawonElement:"목",surname:"림",bongwans:["나주","평택","부안","예천","조양","은진","진천","울진","길안","전주","보성","경주","상산","선산","순창","안동","옥구","옥야","익산","장흥","충주","회진"],note:"두음법칙상 '림'으로도 등록 가능(2007 대법원 판례)",aliasMirrorOf:"임"},
      {ch:"任",reading:"림",meaning:"맡길",strokes:6,jawonElement:"화",surname:"림",bongwans:["풍천","장흥","관산","곡성","나주","안동","평택"],aliasMirrorOf:"임"}
    ],
    "마": [
      {ch:"馬",reading:"마",meaning:"말",strokes:10,jawonElement:"화",surname:"마",bongwans:["장흥","목천","개성","의성","장안"]},
      {ch:"麻",reading:"마",meaning:"삼",strokes:11,jawonElement:"목",surname:"마",bongwans:["상곡","영평"]}
    ],
    "만": [
      {ch:"萬",reading:"만",meaning:"일만",strokes:15,jawonElement:null,surname:"만",bongwans:["강화","강릉","전주"]}
    ],
    "맹": [
      {ch:"孟",reading:"맹",meaning:"맏",strokes:8,jawonElement:"수",surname:"맹",bongwans:["신창"]}
    ],
    "명": [
      {ch:"明",reading:"명",meaning:"밝을",strokes:8,jawonElement:null,surname:"명",bongwans:["연안","서촉"]}
    ],
    "목": [
      {ch:"睦",reading:"목",meaning:"화목할",strokes:13,jawonElement:"목",surname:"목",bongwans:["사천"]}
    ],
    "문": [
      {ch:"文",reading:"문",meaning:"무늬",strokes:4,jawonElement:"목",surname:"문",bongwans:["남평","강성","장연","정선","강릉","감천","개령","능성","보령","선산","안동","영산","하양"]},
      {ch:"門",reading:"문",meaning:"문",strokes:8,jawonElement:null,surname:"서문",bongwans:["안음"],compoundOf:[{"label":"서문","otherChar":"西","otherReading":"서","bongwans":["안음"]}],compoundOnly:true}
    ],
    "미": [
      {ch:"米",reading:"미",meaning:"쌀",strokes:6,jawonElement:"목",surname:"미",bongwans:["재령","방산","유성","송림"]}
    ],
    "민": [
      {ch:"閔",reading:"민",meaning:"성",strokes:12,jawonElement:null,surname:"민",bongwans:["여흥"]}
    ],
    "박": [
      {ch:"朴",reading:"박",meaning:"질박할",strokes:6,jawonElement:"목",surname:"박",bongwans:["밀양","고령","반남","함양","순천","죽산","충주","무안","경주","강릉","경산","광산","무령"]}
    ],
    "반": [
      {ch:"潘",reading:"반",meaning:"뜨물",strokes:16,jawonElement:"수",surname:"반",bongwans:["거제","광주","남평","결성","기성","요동"]},
      {ch:"班",reading:"반",meaning:"나눌",strokes:11,jawonElement:"금",surname:"반",bongwans:["광주"]}
    ],
    "방": [
      {ch:"方",reading:"방",meaning:"모",strokes:4,jawonElement:null,surname:"방",bongwans:["온양","군위","남양","무안","상주","수원"],compoundOf:[{"label":"동방","otherChar":"東","otherReading":"동","bongwans":["진주","청주"]}]},
      {ch:"房",reading:"방",meaning:"방",strokes:8,jawonElement:"목",surname:"방",bongwans:["남양"]}
    ],
    "배": [
      {ch:"裵",reading:"배",meaning:"성",strokes:14,jawonElement:"목",surname:"배",bongwans:["경주","성주","성산","분성","김해","대구","달성","흥해","곤양","곤산","함흥","화순","협계","남해"]}
    ],
    "백": [
      {ch:"白",reading:"백",meaning:"흰",strokes:5,jawonElement:null,surname:"백",bongwans:["수원","직산","남포","대흥","청도","부여","상당","신풍","적성","평산","임천","해미","태인","서천","선산","대구","남해"]}
    ],
    "범": [
      {ch:"范",reading:"범",meaning:"풀 이름",strokes:11,jawonElement:"목",surname:"범",bongwans:["금성"]},
      {ch:"凡",reading:"범",meaning:"무릇",strokes:3,jawonElement:null,surname:"범",bongwans:["안주"]}
    ],
    "변": [
      {ch:"卞",reading:"변",meaning:"성",strokes:4,jawonElement:null,surname:"변",bongwans:["초계","밀양","원주"]},
      {ch:"邊",reading:"변",meaning:"가",strokes:22,jawonElement:"토",surname:"변",bongwans:["장연","황주","원주"]}
    ],
    "보": [
      {ch:"甫",reading:"보",meaning:"클",strokes:7,jawonElement:"수",surname:"황보",bongwans:["영천","황주"],compoundOf:[{"label":"황보","otherChar":"皇","otherReading":"황","bongwans":["영천","황주"]}],compoundOnly:true}
    ],
    "복": [
      {ch:"卜",reading:"복",meaning:"점칠",strokes:2,jawonElement:null,surname:"복",bongwans:["면천","청양","구성"]}
    ],
    "봉": [
      {ch:"奉",reading:"봉",meaning:"받들",strokes:8,jawonElement:null,surname:"봉",bongwans:["하음"]},
      {ch:"鳳",reading:"봉",meaning:"봉새",strokes:14,jawonElement:"화",surname:"봉",bongwans:["경주"]}
    ],
    "빈": [
      {ch:"賓",reading:"빈",meaning:"손",strokes:14,jawonElement:"금",surname:"빈",bongwans:["대구(수성)"]},
      {ch:"彬",reading:"빈",meaning:"빛날",strokes:11,jawonElement:null,surname:"빈",bongwans:["담양","대구(달성)"]}
    ],
    "사": [
      {ch:"史",reading:"사",meaning:"역사",strokes:5,jawonElement:null,surname:"사",bongwans:["청주","거창","청송"]},
      {ch:"謝",reading:"사",meaning:"사례할",strokes:17,jawonElement:"금",surname:"사",bongwans:["한산"]},
      {ch:"舍",reading:"사",meaning:"집",strokes:8,jawonElement:null,surname:"사",bongwans:["태안","부평"]},
      {ch:"司",reading:"사",meaning:"맡을",strokes:5,jawonElement:null,surname:"사공",bongwans:["효령(군위)"],compoundOf:[{"label":"사공","otherChar":"空","otherReading":"공","bongwans":["효령(군위)"]}],compoundOnly:true}
    ],
    "상": [
      {ch:"尙",reading:"상",meaning:"오히려",strokes:8,jawonElement:null,surname:"상",bongwans:["목천"]}
    ],
    "서": [
      {ch:"徐",reading:"서",meaning:"천천할",strokes:10,jawonElement:"화",surname:"서",bongwans:["이천","달성","대구","장성","연산","남평","부여","평당","남양","당성","연안","전주","봉성","안동","울산","절강"]},
      {ch:"西",reading:"서",meaning:"서녘",strokes:6,jawonElement:null,surname:"서",bongwans:["충주"],compoundOf:[{"label":"서문","otherChar":"門","otherReading":"문","bongwans":["안음"]}]}
    ],
    "석": [
      {ch:"石",reading:"석",meaning:"돌",strokes:5,jawonElement:"금",surname:"석",bongwans:["충주","해주","광주","조주","홍주","성주","화원"]},
      {ch:"昔",reading:"석",meaning:"옛",strokes:8,jawonElement:null,surname:"석",bongwans:["경주(월성)"]}
    ],
    "선": [
      {ch:"宣",reading:"선",meaning:"베풀",strokes:9,jawonElement:null,surname:"선",bongwans:["보성"]},
      {ch:"鮮",reading:"선",meaning:"고울",strokes:17,jawonElement:"수",surname:"선우",bongwans:["태원"],compoundOf:[{"label":"선우","otherChar":"于","otherReading":"우","bongwans":["태원"]}],compoundOnly:true}
    ],
    "설": [
      {ch:"薛",reading:"설",meaning:"맑은대쑥",strokes:19,jawonElement:"목",surname:"설",bongwans:["경주","순창","개성"]},
      {ch:"偰",reading:"설",meaning:"맑을",strokes:11,jawonElement:"화",surname:"설",bongwans:["경주"]}
    ],
    "성": [
      {ch:"成",reading:"성",meaning:"이룰",strokes:7,jawonElement:null,surname:"성",bongwans:["창녕","강릉"]}
    ],
    "소": [
      {ch:"蘇",reading:"소",meaning:"차조기",strokes:22,jawonElement:"목",surname:"소",bongwans:["진주"]},
      {ch:"邵",reading:"소",meaning:"땅이름",strokes:12,jawonElement:"토",surname:"소",bongwans:["평산","진주"]}
    ],
    "손": [
      {ch:"孫",reading:"손",meaning:"손자",strokes:10,jawonElement:"수",surname:"손",bongwans:["밀양","경주","평해","일직","청주","구례","안협","나주","비안","대구","부령","안동","영천","월성"]}
    ],
    "송": [
      {ch:"宋",reading:"송",meaning:"송나라",strokes:7,jawonElement:null,surname:"송",bongwans:["여산","은진","진천","연안","야로","신평","남양","홍주","청주","용성","문경","서산","김해","덕산","태안","태인","철원","홍산","회덕"]}
    ],
    "승": [
      {ch:"承",reading:"승",meaning:"받들",strokes:8,jawonElement:"목",surname:"승",bongwans:["광산","연일"]},
      {ch:"昇",reading:"승",meaning:"해 돋을",strokes:8,jawonElement:null,surname:"승",bongwans:["금성","남주"]}
    ],
    "시": [
      {ch:"施",reading:"시",meaning:"베풀",strokes:9,jawonElement:null,surname:"시",bongwans:["절강","성주"]},
      {ch:"柴",reading:"시",meaning:"섶",strokes:9,jawonElement:"목",surname:"시",bongwans:["태인","김화","능향"]}
    ],
    "신": [
      {ch:"申",reading:"신",meaning:"펼",strokes:5,jawonElement:null,surname:"신",bongwans:["평산","고령","아주","삭녕","고창","울산","의성","진주","평창","조종","영월"]},
      {ch:"辛",reading:"신",meaning:"매울",strokes:7,jawonElement:"금",surname:"신",bongwans:["영산","영월","평창"]},
      {ch:"愼",reading:"신",meaning:"삼갈",strokes:14,jawonElement:"화",surname:"신",bongwans:["거창","진주"]}
    ],
    "심": [
      {ch:"沈",reading:"심",meaning:"성",strokes:8,jawonElement:"수",surname:"심",bongwans:["청송","삼척","풍산","부유"]}
    ],
    "안": [
      {ch:"安",reading:"안",meaning:"편안할",strokes:6,jawonElement:null,surname:"안",bongwans:["순흥","죽산","광주","탐진","안산","공주","태원","제천","주천","순천","수원","강진","당진","양산","창원","함안","죽주"]}
    ],
    "양": [
      {ch:"梁",reading:"양",meaning:"들보",strokes:11,jawonElement:"목",surname:"양",bongwans:["제주","남원","충주","전주","나주","경주","임천","진주","청주","안동"],note:"두음법칙상 '량'으로도 등록/표기 가능(2007 대법원 판례)"},
      {ch:"楊",reading:"양",meaning:"갯버들",strokes:13,jawonElement:"목",surname:"양",bongwans:["청주","안악","밀양","중화","남원","통주","대구","진주","충주"]}
    ],
    "어": [
      {ch:"魚",reading:"어",meaning:"물고기",strokes:11,jawonElement:"수",surname:"어",bongwans:["함종","충주","경흥"]}
    ],
    "엄": [
      {ch:"嚴",reading:"엄",meaning:"굳셀",strokes:20,jawonElement:null,surname:"엄",bongwans:["영월"]}
    ],
    "여": [
      {ch:"呂",reading:"여",meaning:"풍류",strokes:7,jawonElement:null,surname:"여",bongwans:["함양","성주(성산)"],note:"두음법칙에 따라 '여' 또는 '려' 두 가지 음으로 실제 병기됨(직접 확인)"},
      {ch:"余",reading:"여",meaning:"자기",strokes:7,jawonElement:"화",surname:"여",bongwans:["의령","하동"]}
    ],
    "연": [
      {ch:"延",reading:"연",meaning:"닿을",strokes:7,jawonElement:null,surname:"연",bongwans:["곡산","나주"]},
      {ch:"連",reading:"연",meaning:"이을",strokes:14,jawonElement:"토",surname:"연",bongwans:["나주","전주"]},
      {ch:"燕",reading:"연",meaning:"제비",strokes:16,jawonElement:"화",surname:"연",bongwans:["곡산","전주","정평"]}
    ],
    "염": [
      {ch:"廉",reading:"염",meaning:"맑을",strokes:13,jawonElement:"목",surname:"염",bongwans:["파주","용담"],note:"두음법칙상 '렴'으로도 등록 가능(2007 대법원 판례)"}
    ],
    "예": [
      {ch:"芮",reading:"예",meaning:"풀 뾰족뾰족할",strokes:10,jawonElement:"목",surname:"예",bongwans:["의흥"]}
    ],
    "오": [
      {ch:"吳",reading:"오",meaning:"큰소리 지를",strokes:7,jawonElement:null,surname:"오",bongwans:["해주","동복","보성","함양","군위","고창","나주","낙안","장흥","화순","함평","울산","흥양","평해","연일","영원","의성","두원","전주"]}
    ],
    "옥": [
      {ch:"玉",reading:"옥",meaning:"구슬",strokes:5,jawonElement:"금",surname:"옥",bongwans:["의령"]}
    ],
    "온": [
      {ch:"溫",reading:"온",meaning:"따뜻할",strokes:14,jawonElement:"수",surname:"온",bongwans:["금구","온양","전주"]}
    ],
    "옹": [
      {ch:"邕",reading:"옹",meaning:"사람이름",strokes:10,jawonElement:"토",surname:"옹",bongwans:["순창(옥천)"]},
      {ch:"雍",reading:"옹",meaning:"학교",strokes:13,jawonElement:"화",surname:"옹",bongwans:["파평"]}
    ],
    "왕": [
      {ch:"王",reading:"왕",meaning:"임금 왕",strokes:4,jawonElement:null,surname:"왕",bongwans:["개성","제남","강릉","해주","산동"],fromHanjaDB:false}
    ],
    "우": [
      {ch:"禹",reading:"우",meaning:"하우씨",strokes:9,jawonElement:null,surname:"우",bongwans:["단양"]},
      {ch:"于",reading:"우",meaning:"여기",strokes:3,jawonElement:null,surname:"우",bongwans:["목천"],compoundOf:[{"label":"선우","otherChar":"鮮","otherReading":"선","bongwans":["태원"]}]}
    ],
    "원": [
      {ch:"元",reading:"원",meaning:"으뜸",strokes:4,jawonElement:null,surname:"원",bongwans:["원주"]},
      {ch:"袁",reading:"원",meaning:"옷 치렁거릴",strokes:10,jawonElement:"목",surname:"원",bongwans:["비안"]}
    ],
    "위": [
      {ch:"魏",reading:"위",meaning:"위나라",strokes:18,jawonElement:"화",surname:"위",bongwans:["장흥"]},
      {ch:"韋",reading:"위",meaning:"다룬 가죽",strokes:9,jawonElement:"금",surname:"위",bongwans:["강화"]}
    ],
    "유": [
      {ch:"劉",reading:"유",meaning:"이길",strokes:15,jawonElement:"금",surname:"유",bongwans:["강릉","거창","배천","연안","충주","성주","연백"],note:"두음법칙상 '류'로도 등록/표기"},
      {ch:"兪",reading:"유",meaning:"그럴",strokes:9,jawonElement:null,surname:"유",bongwans:["기계","무안","강진","인동","고령","창원","장사"]},
      {ch:"柳",reading:"유",meaning:"버들",strokes:9,jawonElement:"목",surname:"유",bongwans:["문화","전주","고흥","서산","선산","약목","영광","육창","정주","진주","진천","풍산","하동","하회"],note:"두음법칙상 '류'로도 등록/표기(2007년 이후 다수 개명, census에서 유/류 별도 집계)"},
      {ch:"庾",reading:"유",meaning:"노적",strokes:12,jawonElement:"목",surname:"유",bongwans:["평산","무송"]}
    ],
    "육": [
      {ch:"陸",reading:"육",meaning:"뭍",strokes:16,jawonElement:"토",surname:"육",bongwans:["옥천"],note:"두음법칙상 '륙'으로도 표기 언급됨"}
    ],
    "윤": [
      {ch:"尹",reading:"윤",meaning:"다스릴",strokes:4,jawonElement:null,surname:"윤",bongwans:["파평","해남","칠원","해평","무송","경주","예천","영천","해주","양주","남원","함안","야성","덕산","신녕","서흥"]}
    ],
    "은": [
      {ch:"殷",reading:"은",meaning:"많을",strokes:10,jawonElement:"금",surname:"은",bongwans:["행주","태인","고부","고양"]}
    ],
    "이": [
      {ch:"李",reading:"이",meaning:"오얏",strokes:7,jawonElement:"목",surname:"이",bongwans:["전주","경주","성주","광주","합천","연안","한산","전의","함평","영천","벽진","고성","성산","여주","인천"],note:"두음법칙상 '리'로도 등록 가능(2007 대법원 판례, 실제 개명 211명 확인)"},
      {ch:"伊",reading:"이",meaning:"저",strokes:6,jawonElement:"화",surname:"이",bongwans:["충주","태원"]},
      {ch:"異",reading:"이",meaning:"다를",strokes:12,jawonElement:null,surname:"이",bongwans:["밀양","청양"]}
    ],
    "인": [
      {ch:"印",reading:"인",meaning:"도장",strokes:6,jawonElement:null,surname:"인",bongwans:["교동","연안"]}
    ],
    "임": [
      {ch:"林",reading:"임",meaning:"수풀",strokes:8,jawonElement:"목",surname:"임",bongwans:["나주","평택","부안","예천","조양","은진","진천","울진","길안","전주","보성","경주","상산","선산","순창","안동","옥구","옥야","익산","장흥","충주","회진"],note:"두음법칙상 '림'으로도 등록 가능(2007 대법원 판례)"},
      {ch:"任",reading:"임",meaning:"맡길",strokes:6,jawonElement:"화",surname:"임",bongwans:["풍천","장흥","관산","곡성","나주","안동","평택"]}
    ],
    "자": [
      {ch:"慈",reading:"자",meaning:"사랑할",strokes:14,jawonElement:"화",surname:"자",bongwans:["요양","해주","중원"]}
    ],
    "장": [
      {ch:"張",reading:"장",meaning:"베풀",strokes:11,jawonElement:null,surname:"장",bongwans:["인동","흥덕","흥성","안동","창녕","목천","결성","단양","구례","봉성","덕수","태원","순천","절강","광주","고성","교동","나주","남양","남원","단양","대구","덕천","동래","무안","밀양","부여","서산","순창","안성","연안","영월","예산","옥구","옥천","울진","인덕","장수","장연","장택","전주","정읍","제주","진안","진주","진천","창원","청송","청주","춘천","충주","평택","평양","풍덕","한양","함평","해주","흥양","흥해"]},
      {ch:"蔣",reading:"장",meaning:"줄",strokes:17,jawonElement:"목",surname:"장",bongwans:["아산"]},
      {ch:"章",reading:"장",meaning:"문채",strokes:11,jawonElement:"금",surname:"장",bongwans:["거창"]},
      {ch:"莊",reading:"장",meaning:"엄할",strokes:13,jawonElement:"목",surname:"장",bongwans:["금천","전주","장연"]}
    ],
    "전": [
      {ch:"全",reading:"전",meaning:"온전할",strokes:6,jawonElement:null,surname:"전",bongwans:["천안","정선","옥천","나주","전주(완산)","용궁","옥산","죽산","평강","경주","성주","감천","부여","함창","계림","황간","기장","팔거","강릉","거창","경산","대구","안동","완산","진안"]},
      {ch:"田",reading:"전",meaning:"밭",strokes:5,jawonElement:null,surname:"전",bongwans:["담양","영광","연안","남양","하음","경주","광평","울진","정선","천안","태산","평택"]},
      {ch:"錢",reading:"전",meaning:"돈",strokes:16,jawonElement:"금",surname:"전",bongwans:["문경","문희","관산","개경"]}
    ],
    "정": [
      {ch:"鄭",reading:"정",meaning:"나라이름",strokes:19,jawonElement:"토",surname:"정",bongwans:["동래","경주","연일","해주","진주","하동","초계","청주","온양","봉화","광주","나주","서산","함평","청산","영일","연일"]},
      {ch:"丁",reading:"정",meaning:"장정",strokes:2,jawonElement:null,surname:"정",bongwans:["나주","영광","창원","의성","압해"]},
      {ch:"程",reading:"정",meaning:"법",strokes:12,jawonElement:"목",surname:"정",bongwans:["하남"]}
    ],
    "제": [
      {ch:"諸",reading:"제",meaning:"모든",strokes:16,jawonElement:"금",surname:"제",bongwans:["칠원","의성","고성","보성","태원"],compoundOf:[{"label":"제갈","otherChar":"葛","otherReading":"갈","bongwans":["남양","칠원","대구","남원","충주"]}]}
    ],
    "조": [
      {ch:"趙",reading:"조",meaning:"조나라",strokes:14,jawonElement:"화",surname:"조",bongwans:["한양","함안","풍양","배천","옥천","평양","직산","횡성","순창","임천","양주","김제","영흥","신창","강진","진보"]},
      {ch:"曺",reading:"조",meaning:"성",strokes:10,jawonElement:null,surname:"조",bongwans:["창녕","가흥","능성","남평","영암","장흥","수성","안동","청도"]}
    ],
    "종": [
      {ch:"鍾",reading:"종",meaning:"술병",strokes:17,jawonElement:"금",surname:"종",bongwans:["영암","하음","강화","통진","두원","정의","풍덕"]},
      {ch:"宗",reading:"종",meaning:"마루",strokes:8,jawonElement:null,surname:"종",bongwans:["전주"]}
    ],
    "좌": [
      {ch:"左",reading:"좌",meaning:"왼",strokes:5,jawonElement:"화",surname:"좌",bongwans:["청주(제주)"]}
    ],
    "주": [
      {ch:"朱",reading:"주",meaning:"붉을",strokes:6,jawonElement:"목",surname:"주",bongwans:["신안","나주","능성","웅천","공주","전주","압해"]},
      {ch:"周",reading:"주",meaning:"두루",strokes:8,jawonElement:null,surname:"주",bongwans:["상주","초계","철원","함안","장흥","삼계","안의","신안","풍기"]}
    ],
    "지": [
      {ch:"池",reading:"지",meaning:"못",strokes:7,jawonElement:"수",surname:"지",bongwans:["충주","광주","청송","청주","단양"]},
      {ch:"智",reading:"지",meaning:"슬기",strokes:12,jawonElement:null,surname:"지",bongwans:["봉산"]}
    ],
    "진": [
      {ch:"陳",reading:"진",meaning:"묵을",strokes:16,jawonElement:"토",surname:"진",bongwans:["여양","삼척","강릉","나주","광동","남해","덕창","신광","복주","신광","임피","양산","양주"]},
      {ch:"秦",reading:"진",meaning:"벼 이름",strokes:10,jawonElement:"목",surname:"진",bongwans:["풍기","진주","남원","대원","삼척","영춘","용인"]},
      {ch:"晉",reading:"진",meaning:"나아갈",strokes:10,jawonElement:null,surname:"진",bongwans:["남원","삼척"]},
      {ch:"眞",reading:"진",meaning:"참",strokes:10,jawonElement:"목",surname:"진",bongwans:["서산"]}
    ],
    "차": [
      {ch:"車",reading:"차",meaning:"수레",strokes:7,jawonElement:"화",surname:"차",bongwans:["연안","남해","용성","평산"]}
    ],
    "채": [
      {ch:"蔡",reading:"채",meaning:"거북",strokes:17,jawonElement:"목",surname:"채",bongwans:["평강","인천","광주","음성"]},
      {ch:"采",reading:"채",meaning:"캘",strokes:8,jawonElement:null,surname:"채",bongwans:["여산"]}
    ],
    "천": [
      {ch:"千",reading:"천",meaning:"일천",strokes:3,jawonElement:null,surname:"천",bongwans:["영양"]},
      {ch:"天",reading:"천",meaning:"하늘",strokes:4,jawonElement:null,surname:"천",bongwans:["밀양","영양","연안","충주"]}
    ],
    "최": [
      {ch:"崔",reading:"최",meaning:"산 우뚝할",strokes:11,jawonElement:"토",surname:"최",bongwans:["경주","전주","해주","강릉","탐진","수성","삭녕","화순","강화","낭주","완산","동주","우봉","흥해","수원","통천","영흥","영천","충주","경산","월성","진주","화순"]}
    ],
    "추": [
      {ch:"秋",reading:"추",meaning:"가을",strokes:9,jawonElement:"목",surname:"추",bongwans:["추계","전주"]}
    ],
    "춘": [
      {ch:"椿",reading:"춘",meaning:"참죽나무",strokes:13,jawonElement:"목",surname:"춘",bongwans:["남양"]}
    ],
    "탁": [
      {ch:"卓",reading:"탁",meaning:"높을",strokes:8,jawonElement:null,surname:"탁",bongwans:["광산","광주"]}
    ],
    "태": [
      {ch:"太",reading:"태",meaning:"클",strokes:4,jawonElement:null,surname:"태",bongwans:["협계","영순","남원"]}
    ],
    "팽": [
      {ch:"彭",reading:"팽",meaning:"성씨",strokes:12,jawonElement:null,surname:"팽",bongwans:["용강","절강","남양","전주"]}
    ],
    "편": [
      {ch:"片",reading:"편",meaning:"조각",strokes:4,jawonElement:"목",surname:"편",bongwans:["절강","밀양"]}
    ],
    "평": [
      {ch:"平",reading:"평",meaning:"평탄할",strokes:5,jawonElement:"목",surname:"평",bongwans:["충주","가흥","인천","진주"]}
    ],
    "표": [
      {ch:"表",reading:"표",meaning:"겉",strokes:9,jawonElement:"목",surname:"표",bongwans:["신창","죽산","남양","동래","풍산"]}
    ],
    "피": [
      {ch:"皮",reading:"피",meaning:"가죽",strokes:5,jawonElement:null,surname:"피",bongwans:["홍천","단양","괴산"]}
    ],
    "하": [
      {ch:"河",reading:"하",meaning:"물",strokes:9,jawonElement:"수",surname:"하",bongwans:["진양(진주)","강화","청주"]},
      {ch:"賀",reading:"하",meaning:"축하할",strokes:12,jawonElement:"금",surname:"하",bongwans:["진주"]}
    ],
    "한": [
      {ch:"韓",reading:"한",meaning:"나라 이름",strokes:17,jawonElement:"금",surname:"한",bongwans:["청주","곡산","단주","평산","한양","안변","양주","홍산","대흥","부안","개성","함흥","금산","보성","남원","밀양"]}
    ],
    "함": [
      {ch:"咸",reading:"함",meaning:"모두",strokes:9,jawonElement:null,surname:"함",bongwans:["강릉","양근"]}
    ],
    "허": [
      {ch:"許",reading:"허",meaning:"허락할",strokes:11,jawonElement:"금",surname:"허",bongwans:["김해","양천","태인","하양","시산","전주"]}
    ],
    "현": [
      {ch:"玄",reading:"현",meaning:"검을",strokes:5,jawonElement:"수",surname:"현",bongwans:["연주"]}
    ],
    "홍": [
      {ch:"洪",reading:"홍",meaning:"큰물",strokes:10,jawonElement:"수",surname:"홍",bongwans:["남양","풍산","홍주","부계","의성","회인","개령","나주","남원","전주","풍천"]}
    ],
    "화": [
      {ch:"化",reading:"화",meaning:"될",strokes:4,jawonElement:null,surname:"화",bongwans:["진양(진주)","나주","복룡","여황"]}
    ],
    "황": [
      {ch:"黃",reading:"황",meaning:"누를",strokes:12,jawonElement:"토",surname:"황",bongwans:["창원","장수","평해","우주","회덕","상주","덕산","제안","황주","항주","경주","진주"]},
      {ch:"皇",reading:"황",meaning:"임금",strokes:9,jawonElement:null,surname:"황보",bongwans:["영천","황주"],compoundOf:[{"label":"황보","otherChar":"甫","otherReading":"보","bongwans":["영천","황주"]}],compoundOnly:true}
    ],
    "후": [
      {ch:"后",reading:"후",meaning:"임금",strokes:6,jawonElement:null,surname:"후",bongwans:["당인"]}
    ]
  };

  var compoundSurnames = {
    "남궁": {
      "chars": [
        "南",
        "宮"
      ],
      "readings": [
        "남",
        "궁"
      ],
      "bongwans": [
        "함열"
      ],
      "note": null
    },
    "황보": {
      "chars": [
        "皇",
        "甫"
      ],
      "readings": [
        "황",
        "보"
      ],
      "bongwans": [
        "영천",
        "황주"
      ],
      "note": null
    },
    "선우": {
      "chars": [
        "鮮",
        "于"
      ],
      "readings": [
        "선",
        "우"
      ],
      "bongwans": [
        "태원"
      ],
      "note": null
    },
    "독고": {
      "chars": [
        "獨",
        "孤"
      ],
      "readings": [
        "독",
        "고"
      ],
      "bongwans": [
        "남원"
      ],
      "note": null
    },
    "제갈": {
      "chars": [
        "諸",
        "葛"
      ],
      "readings": [
        "제",
        "갈"
      ],
      "bongwans": [
        "남양",
        "칠원",
        "대구",
        "남원",
        "충주"
      ],
      "note": null
    },
    "사공": {
      "chars": [
        "司",
        "空"
      ],
      "readings": [
        "사",
        "공"
      ],
      "bongwans": [
        "효령(군위)"
      ],
      "note": null
    },
    "서문": {
      "chars": [
        "西",
        "門"
      ],
      "readings": [
        "서",
        "문"
      ],
      "bongwans": [
        "안음"
      ],
      "note": null
    },
    "동방": {
      "chars": [
        "東",
        "方"
      ],
      "readings": [
        "동",
        "방"
      ],
      "bongwans": [
        "진주",
        "청주"
      ],
      "note": null
    }
  };

  function dueumVariants(syllable) {
    var out = [syllable];
    if (dueumAlias[syllable] && out.indexOf(dueumAlias[syllable]) === -1) out.push(dueumAlias[syllable]);
    return out;
  }

  function candidates(syllable) { return bySyllable[syllable] || []; }

  // 두음 변형까지 합친 "그 소리로 불리는 성씨 한자" 전체. 같은 한자가 두 음절 키에 각각
  // (미러 복제 또는 원래부터) 존재할 수 있어 ch 기준으로 합치고 본관 목록은 합집합으로 병합한다
  // (예: "나"/"라" 둘 다 羅 원본 항목이 있고 본관 목록이 서로 다른 부분집합이라 병합이 필요).
  function surnameCandidates(syllable) {
    var byCh = {};
    var order = [];
    dueumVariants(syllable).forEach(function (s) {
      (bySyllable[s] || []).forEach(function (e) {
        var cur = byCh[e.ch];
        if (!cur) {
          cur = { ch: e.ch, reading: syllable, meaning: e.meaning, strokes: e.strokes,
            jawonElement: e.jawonElement, surname: e.surname, bongwans: e.bongwans.slice(),
            note: e.note, compoundOf: e.compoundOf ? e.compoundOf.slice() : null, compoundOnly: e.compoundOnly };
          byCh[e.ch] = cur;
          order.push(cur);
        } else {
          e.bongwans.forEach(function (b) { if (cur.bongwans.indexOf(b) === -1) cur.bongwans.push(b); });
        }
      });
    });
    return order;
  }

  function isSurnameChar(ch, syllable) {
    return surnameCandidates(syllable).some(function (e) { return e.ch === ch; });
  }

  // 본관 표기 정규화: "水原(수원)" 같은 한자+괄호 병기는 괄호 안 한글만 취하고,
  // 공백 제거·트림만 한다(성씨 자체 두음은 dueumVariants에서 이미 처리).
  function normalizeBongwan(s) {
    var q = String(s == null ? '' : s).trim();
    var m = q.match(/^[^\s()]+\(([^)]+)\)$/);
    if (m) q = m[1];
    return q.replace(/\s+/g, '');
  }

  // 본관 정확 매칭(두음 변형 허용). syllable은 실제 화면에 고정된 음절(예: 이름의 첫 글자).
  function matchBongwan(bongwanQuery, syllable) {
    var q = normalizeBongwan(bongwanQuery);
    if (!q) return [];
    var out = [];
    surnameCandidates(syllable).forEach(function (e) {
      var hit = (e.bongwans || []).some(function (b) { return normalizeBongwan(b) === q; });
      if (!hit && e.compoundOf) {
        hit = e.compoundOf.some(function (c) { return (c.bongwans || []).some(function (b) { return normalizeBongwan(b) === q; }); });
      }
      if (hit) out.push(e);
    });
    return out;
  }

  // 자유 질의 파싱 — "성유"/"유 성씨"/"성씨 유" → {kind:'surname',target:'유'}
  //              "강릉 유"/"강릉유"        → {kind:'bongwan',bongwan:'강릉',target:'유'}
  // 매칭되는 패턴이 없으면 null(호출측은 기존 검색 로직으로 폴백).
  function parseQuery(raw) {
    var q = String(raw == null ? '' : raw).trim();
    if (!q) return null;
    var noSpace = q.replace(/\s+/g, '');
    var m;
    if ((m = noSpace.match(/^성씨(.+)$/))) return { kind: 'surname', target: m[1] };
    if ((m = noSpace.match(/^성(.+)$/))) return { kind: 'surname', target: m[1] };
    if ((m = noSpace.match(/^(.+)성씨$/))) return { kind: 'surname', target: m[1] };
    if (noSpace.length >= 2) {
      var last = noSpace.slice(-1);
      var rest = noSpace.slice(0, -1);
      if (bySyllable[last] || dueumAlias[last]) return { kind: 'bongwan', bongwan: rest, target: last };
    }
    return null;
  }

  global.SurnameDB = {
    version: '1.8',
    dueumAlias: dueumAlias,
    bySyllable: bySyllable,
    compoundSurnames: compoundSurnames,
    readings: Object.keys(bySyllable),
    candidates: candidates,
    dueumVariants: dueumVariants,
    surnameCandidates: surnameCandidates,
    isSurnameChar: isSurnameChar,
    normalizeBongwan: normalizeBongwan,
    matchBongwan: matchBongwan,
    parseQuery: parseQuery,
    count: 195
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = global.SurnameDB;
})(typeof window !== 'undefined' ? window : this);
