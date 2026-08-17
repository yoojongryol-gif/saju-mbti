# -*- coding: utf-8 -*-
"""
name-hanja-db.js 생성기 (MZ사주풀이 v1.7)

원자료(전부 공개 데이터셋, 2026-08-16 다운로드):
  [A] libhangul hanja.txt  — 한자:음:뜻
      https://raw.githubusercontent.com/libhangul/libhangul/main/data/hanja/hanja.txt
  [B] Unicode Unihan (UCD latest) kTotalStrokes / kRSUnicode / kIRG_KSource
      https://www.unicode.org/Public/UCD/latest/ucd/Unihan.zip
  [C] Unicode CJKRadicals.txt — 부수번호 → 원형(原形) 한자
      https://www.unicode.org/Public/UCD/latest/ucd/CJKRadicals.txt
  [D] 자원오행 부수 배속표 (ksname.co.kr "한자의 부수 및 자원오행")
      https://www.ksname.co.kr/bbs/tb.php/m51/44
  [E] 원획 교차검증표 (irum.com 인명용한자 조회) — _data/verify_all.py 가 전수 대조해
      _data/verify_all_result.json 을 만들고, 그중 "irum.com 대조표 자체에 없어
      확인 불가"였던 (음,한자) 목록만 _data/unverified_pairs.json 로 추려 이 스크립트가
      읽어 unverified:true 플래그로 반영한다(불일치였던 43건은 COMPONENT_FIX로 직접
      교정했으므로 unverified 대상이 아니다).
"""
import sys, io, re, json, collections
sys.stdout.reconfigure(encoding='utf-8')

D = r'C:/Users/NHNE/saju-mbti/_data/'
OUT = r'C:/Users/NHNE/saju-mbti/name-hanja-db.js'

# [E] 원획 검증에서 irum.com 대조표에 없던 (음,한자) 쌍 — 프로그램 계산값은 그대로 두고
# name-hanja-db.js 항목에 unverified:true 만 붙인다. 파일이 없으면(=검증을 아직 안 돌린
# 상태) 빈 집합으로 두고 전량 미검증 취급하지 않는다(첫 draft 생성 단계를 막지 않기 위함).
try:
    UNVERIFIED_PAIRS = set(tuple(p) for p in json.load(io.open(D + 'unverified_pairs.json', encoding='utf-8')))
except IOError:
    UNVERIFIED_PAIRS = set()

# ---------------------------------------------------------------- [B] Unihan
total_strokes, rsdata, ksource = {}, {}, {}
with io.open(D + 'Unihan_IRGSources.txt', encoding='utf-8') as f:
    for line in f:
        if line.startswith('#') or not line.strip():
            continue
        p = line.rstrip('\n').split('\t')
        if len(p) < 3:
            continue
        cp = int(p[0][2:], 16)
        if p[1] == 'kTotalStrokes':
            total_strokes[cp] = int(p[2].split()[0])
        elif p[1] == 'kRSUnicode':
            m = re.match(r"^(\d+)('*)\.(-?\d+)$", p[2].split()[0])
            if m:
                rsdata[cp] = (int(m.group(1)), len(m.group(2)), int(m.group(3)))
        elif p[1] == 'kIRG_KSource':
            ksource[cp] = p[2]

# ------------------------------------------------------------ [C] CJKRadicals
rad_orig_cp = {}
with io.open(D + 'CJKRadicals.txt', encoding='utf-8') as f:
    for line in f:
        if line.startswith('#') or not line.strip():
            continue
        p = [x.strip() for x in line.strip().rstrip(';').split(';')]
        if len(p) < 3 or "'" in p[0] or not p[2]:
            continue
        rad_orig_cp[int(p[0])] = int(p[2], 16)

# 부수번호 → 원형 부수 한자의 획수(= 원획 기준 부수 획수)
RAD_ORIG_STROKES = {n: total_strokes[cp] for n, cp in rad_orig_cp.items() if cp in total_strokes}
RAD_ORIG_CHAR = {n: chr(cp) for n, cp in rad_orig_cp.items()}
assert len(RAD_ORIG_STROKES) == 214, len(RAD_ORIG_STROKES)

# 성명학 숫자한자 예외 (필획≠원획): 四5→4 ... 十2→10
NUMBER_WONHOEK = {'四': 4, '五': 5, '六': 6, '七': 7, '八': 8, '九': 9, '十': 10}

# 부건(部件) 획수 예외.
# 부수 보정은 아래 wonhoek()가 전량 자동 처리하지만, 부수가 아닌 구성요소를
# Unihan(현대 CJK 셈법)과 康熙字典(성명학 기준)이 다르게 세는 글자가 소수 있다.
# (예: 者 8 vs 9, 成 6 vs 7, 異 11 vs 12)
# 아래 50건은 v1.3 당시 DB(2,564자)를 irum.com 인명용한자 원획표와 대조해
# (verify_all.py) 확인한 값으로, 대조표 값을 채택했다.
COMPONENT_FIX = {
    '戴': 18, '暑': 13, '署': 15, '成': 7, '城': 10, '誠': 14, '瘟': 15,
    '異': 12, '翼': 18, '充': 5, '響': 22, '邢': 13, '姬': 9,
    '考': 8, '魄': 15, '噓': 15, '魔': 21, '衛': 16, '毓': 14, '禽': 13,
    '萬': 15, '渗': 15, '巡': 7, '甕': 18, '瓮': 9,
    '禹': 9, '魏': 18, '甄': 14, '魁': 14, '裙': 12, '龜': 16, '廊': 13, '擥': 18,
    '隷': 17, '朦': 20, '猫': 12, '薩': 19, '乷': 7, '屬': 20, '瓦': 5, '頊': 14,
    '剩': 11, '芿': 10, '著': 15, '節': 15, '鑿': 28, '兎': 8, '把': 9, '魂': 14, '蒸': 16,
}
# v1.7 확대분(2,564자 → 6,819자) 전수 대조에서 추가로 확인한 43건. 같은 방식으로
# 대조표([E]) 값을 채택했다 (재현 스크립트: _data/verify_all.py, 결과 원본:
# _data/verify_all_result.json → mismatch 배열).
COMPONENT_FIX.update({
    '卿': 12, '嘯': 16, '囍': 22, '壺': 11, '夔': 20, '導': 16, '慨': 15, '搜': 14,
    '敭': 13, '整': 16, '斌': 12, '朣': 18, '榔': 14, '橚': 17, '欌': 22, '渚': 13,
    '湺': 12, '漓': 15, '潚': 17, '瀟': 21, '煮': 13, '珷': 12, '瓷': 11, '甑': 17,
    '盛': 12, '睡': 13, '磁': 15, '礖': 19, '离': 11, '篠': 17, '簫': 19, '罕': 7,
    '脯': 11, '臾': 9, '莽': 14, '蔬': 18, '蕭': 19, '襁': 18, '邃': 21, '錨': 16,
    '鍈': 17, '鼇': 24, '鼎': 13,
})


def wonhoek(ch):
    """원획(原劃) = 부수의 원형 획수 + 나머지 획수.
    kTotalStrokes(필획)에서 실제 사용된 부수 형태의 획수를 빼고,
    그 자리에 원형 부수의 획수를 넣는 방식이라 변형부수일 때만 값이 커진다."""
    if ch in NUMBER_WONHOEK:
        return NUMBER_WONHOEK[ch], total_strokes[ord(ch)], None
    cp = ord(ch)
    if cp not in rsdata or cp not in total_strokes:
        return None, None, None
    radnum, simp, residual = rsdata[cp]
    if simp or radnum not in RAD_ORIG_STROKES or residual < 0:
        return None, None, None
    pil = total_strokes[cp]
    won = COMPONENT_FIX.get(ch, RAD_ORIG_STROKES[radnum] + residual)
    return won, pil, radnum


# ------------------------------------------------- [D] 자원오행 부수 배속표
# ksname.co.kr 원문 목록을 그대로 옮긴 것. 원문은 한 부수를 여러 오행에 중복
# 배속하는 경우가 많아(유파별 이설), **단일 오행에만 등장하는 부수만** 채택하고
# 중복 배속 부수는 모호한 것으로 보아 jawonElement=null 처리한다(SPEC v1.3 허용).
JAWON_RAW = {
    '목': '木 艸 艹 禾 米 竹 衣 糸 豆 靑 麻 香 風 黍 栢 東 門 手 卿 寅 卯 印 角 大 巾 宀 寸 乙 父 广 罒 网 戶 片 采 示 文 目 儿 入 干 匚 舟 廾 弓 舛 虍 廴 尸 几 屮 瓜 士 彡 一 二 冂 亅 丶 卜 由 己 犬 皿 田 方 力 勹 立 口 卩 生 夕 肉 十 麥 曰 冖 罓 鬯',
    '화': '火 灬 日 心 忄 鬼 丙 丁 南 高 飛 赤 鳥 禸 彐 行 術 見 人 頁 車 耳 冂 隹 丿 欠 幺 臣 面 走 身 舌 羽 亻 彳 工 民 斗 癶 丶 卜 弓 氏 毛 髟 厶 亠 宀 网 示 儿 三 四 釆 虍 彡 一 二 門 大 里 己 夂 力 戈 白 又 匕 口 卩 无 肉 十 馬 曰 龠 凵',
    '토': '土 辰 里 阝 黃 牛 艮 戊 臼 龍 己 中 山 辶 犬 足 甘 母 辵 止 夂 黽 尤 皿 鹿 匸 缶 老 田 厂 至 女 方 齊 羊 力 阜 邑 亠 寸 乙 示 儿 入 匚 五 六 廾 耒 支 虍 尸 一 日 丿 門 大 臣 身 已 丶 卜 戈 勹 丨 立 八 口 囗 肉 十 曰 冖 二 冂',
    '금': '金 王 玉 刀 戈 白 貝 辛 酉 卒 共 又 言 韋 皿 匕 丿 鬥 勹 革 丨 殳 欠 立 攴 小 骨 齒 攵 矢 音 矛 宀 寸 乙 示 儿 七 八 釆 廾 弓 耒 尸 瓜 日 禸 彐 亅 門 力 白 囗 肉 十 鼓 石 曰 釆',
    '수': '水 氵 冫 口 囗 月 玄 血 魚 黑 亥 子 疒 穴 谷 龜 几 而 隶 癶 卩 生 豸 又 无 气 歹 食 首 巛 川 夕 豕 肉 虫 尸 雨 亠 厶 豆 宀 乙 也 儿 匚 九 十 廾 弓 非 耒 虍 廴 士 一 二 丿 大 用 行 臣 身 舌 皿 厂 力 白 酉 小 骨 曰 鼠 冂 凵',
}

# 변형부수(약자·이체) → 원형 부수 한자 별칭
RAD_ALIAS = {
    '艹': '艸', '氵': '水', '忄': '心', '扌': '手', '犭': '犬', '灬': '火',
    '罒': '网', '罓': '网', '亻': '人', '辶': '辵', '礻': '示', '衤': '衣',
    '王': '玉', '彑': '彐', '攵': '攴', '⺼': '肉', '龵': '手', '𤣩': '玉',
}
CHAR_TO_RADNUM = {c: n for n, c in RAD_ORIG_CHAR.items()}
# 阝는 좌(阜)/우(邑) 판별이 글자 단위로 필요 → 부수번호 170/163 양쪽에 같은 값 부여
EXTRA_RADNUM = {'阝': (170, 163)}

hits = collections.defaultdict(set)   # radnum -> {오행}
for el, s in JAWON_RAW.items():
    for c in s.split():
        c = RAD_ALIAS.get(c, c)
        if c in EXTRA_RADNUM:
            for n in EXTRA_RADNUM[c]:
                hits[n].add(el)
        elif c in CHAR_TO_RADNUM:
            hits[CHAR_TO_RADNUM[c]].add(el)

RAD_ELEMENT = {n: list(v)[0] for n, v in hits.items() if len(v) == 1}
print('자원오행 단일배속 부수 수:', len(RAD_ELEMENT), '/ 표 등장 부수', len(hits))

# ----------------------------------------------------------- [A] hanja.txt
entries = collections.OrderedDict()
with io.open(D + 'hanja.txt', encoding='utf-8') as f:
    for line in f:
        if line.startswith('#') or not line.strip():
            continue
        p = line.rstrip('\n').split(':')
        if len(p) < 3:
            continue
        key, hj, mean = p[0], p[1], p[2].strip()
        if len(key) != 1 or len(hj) != 1 or not ('가' <= key <= '힣') or not mean:
            continue
        entries.setdefault(key, []).append((hj, mean))

# -------------------------------------------------------------- 선별 규칙
READINGS = ('가 강 건 겸 경 규 근 기 나 남 노 다 대 덕 도 동 라 리 명 문 미 민 보 복 병 상 서 석 선 '
            '섭 성 세 소 수 승 시 식 신 아 안 언 여 연 열 영 예 오 옥 온 완 요 용 우 운 원 웅 유 윤 '
            '율 은 의 이 익 인 일 자 장 재 정 제 조 종 주 준 중 지 진 찬 창 채 천 철 청 초 최 충 태 '
            '표 필 하 학 한 해 향 헌 혁 현 형 혜 호 화 환 회 효 훈 휘 흠 희 '
            # 한국 주요 성씨(姓) 음절 — 성 글자도 후보로 골라야 4격이 계산된다
            '김 박 최 권 황 송 전 홍 고 손 양 배 백 허 심 곽 차 구 지 엄 방 공 함 변 염 추 설 '
            '마 길 위 반 왕 육 맹 모 어 편 봉 사 부 목 계 음 빈 동 금 국 궁 남 노 도 라 려 로 '
            '류 만 명 묵 미 민 반 백 범 변 봉 빈 삼 상 서 석 선 성 소 순 승 시 신 심 아 안 애 '
            '야 어 여 연 염 영 예 오 옥 온 옹 왕 요 용 우 운 원 위 유 육 윤 은 음 이 인 임 자 '
            '장 전 정 제 조 종 좌 주 준 즙 지 진 차 창 채 천 초 최 추 탁 탄 태 판 팽 편 평 포 '
            '표 풍 피 필 하 학 한 함 해 허 현 형 호 홍 화 환 황 회 효 후 흥').split()
READINGS = list(dict.fromkeys(READINGS))
# 위 목록은 "우선 배치" 순서용이고, 실제로는 원자료에 존재하는 모든 한글 음(音)을 담는다.
# (어떤 한국 이름을 넣어도 음절별 후보가 나오도록 — 없는 음절은 UI에서 '목록에 없음'만 뜬다)
READINGS = READINGS + [k for k in entries.keys() if k not in set(READINGS)]

# 이름에 쓰기 어려운 뜻(부정·질병·죽음·비속) 차단 키워드
BAD = ('죽을 죽일 죽음 주검 시체 질병 병들 앓을 아플 슬플 슬퍼 슬픔 근심 걱정 불쌍 번민 원망 '
       '미워 미울 증오 도둑 훔칠 재앙 흉할 흉악 망할 잃을 무너 어두울 어두컴 더러울 천할 어리석 '
       '게으를 게으름 허물 형벌 감옥 옥사 울부 곡할 괴로울 무덤 장사지낼 미칠 어지러울 거짓 속일 '
       '헐뜯 꾸짖 성낼 노할 두려울 무서울 위태 험할 좁을 막힐 썩을 추울 얼음 그늘 저물 빠질 잠길 '
       '젖을 가난 굶주 귀신 도깨비 오랑캐 종기 부스럼 독할 술취 취할 늙을 낡을 게울 토할 똥 오줌 '
       '때릴 찌를 벨 싸울 다툴 원수 노예 계집종 첩 어릴 흐릴 탁할 이별 헤어질 그만둘 그칠 폐할 '
       '버릴 없을 아닐 금할 의심 시기할 질투 교만 오만 방자 요망 간사 아첨 돼지 소경 귀머거리 '
       '절름 대머리 상처 흉터 굽을 기울 치우칠 어긋 거스를 배반 훼손 부술 찢을 태울 사를 시들 '
       '여윌 조급 서투를 더딜 늦을 흩을 붙잡 묶을 얽을 가둘 쫓을 내쫓 앙심 재갈 색시 겨를 힘줄 '
       '삼합 그림쇠 저자 시장 자갈 진흙 티끌 먼지 올가미 갈고리 말뚝 딱지 버짐 사마귀 두드러기 '
       '하품 트림 재채기 딸꾹 코끼리 노새 나귀 두꺼비 개구리 맹꽁이 지렁이 거머리 메뚜기 모기 '
       '벼룩 빈대 구더기 굼벵이 애벌레 거미 전갈 지네 두더지 족제비 너구리 여우 늑대 승냥 '
       '살쾡이 원숭이 오소리 수달 고래 상어 문어 낙지 우렁 달팽이 지푸 쭉정 껍질 찌꺼 앙금 '
       '곰팡 이끼 잡초 덤불 가라지 굴레 고삐 채찍 회초리 몽둥이 방망이 도끼 송곳 물레 베틀 '
       '절구 쓰레 빗자루 걸레 요강 뚝배 젓가 숟가 주걱 벌거 나약 나팔 누더기 마디충 아귀 '
       '엿볼 희롱 나사 벌릴 용렬 목멜 그릇할 탄식 으르렁 올배미 미련 둔할 갈대 화로 밥그릇 '
       '빚 울짱 표주박 미끄러울 몹시 회오리 급할 뒤집 겹옷 마름 모시 느즈러 완고 머슴 떨어질 '
       '길맬 운풀 부추꽃 청어 시렁 벌거벗 곳집 배꼽 가는털 대장기 꺼릴 늘어질 발꿈치 '
       '약물 염병 볼기 사나울 벌레 한탄 해할 업신여 주릴 포로 사로잡 놀랄 숨을 까마귀 '
       '목사슬 소나무겨우살이 해오라기 눈 감을 명협 입술 미혹 꼬리 눈썹 낚시줄 엎드릴 '
       '병풍 뒤섞 그을 안주 삭일 칡범 재촉 비녀 늘어놓 찢어 극락 상말 방죽 몰아 지게 '
       '턱밑 손윗 겨우 구거리 유리만드는 남기 퍼질 다음날 중량 수준기 승인할 가파를 '
       '제기 나누어 북두 졸졸 덧방 위문 나그네 너울 겪을 달랠 내관 귀글 숨쉴 어금니 '
       '기러기 안장 곤륜 윤달 은근 순접의 초헌 줄풍류 푯말 뉘우칠 울릴 희생 이슬 소라 '
       '순행 노끈 조촐 더울 영지 쇠뇌 바퀴살 목사 볼기칠 오나라 벼슬아치 떼 놓을').split()


# libhangul 뜻 표기 중 오탈자/이체 표기를 표준 자전 표기로 교정한 항목.
# (네이버 한자사전 표제 훈 기준 — 원자료 값은 pilhoek/strokes 계산에 영향 없음)
MEANING_FIX = {
    '景': '볕', '晳': '밝을', '皓': '흴', '瑄': '도리옥', '昊': '하늘',
}


def meaning_options(hj, mean):
    """뜻 문자열의 쉼표 절들을 순서대로 정리해 후보 리스트로 돌려준다.
    (첫 절이 차단어에 걸려도 다음 절을 쓸 수 있게 — 예: 朴 '나무껍질' → '질박할')"""
    if hj in MEANING_FIX:
        return [MEANING_FIX[hj]]
    out = []
    for seg in mean.split(','):
        seg = re.sub(r'\s*\([^)]*\)\s*', ' ', seg).strip()
        toks = seg.split()
        if len(toks) >= 2 and len(toks[-1]) == 1 and '가' <= toks[-1] <= '힣':
            toks = toks[:-1]      # 끝의 음(音) 제거
        t = ' '.join(toks).strip()
        if t and re.fullmatch(r'[가-힣 ]+', t) and t not in out:
            out.append(t)
    return out


# v1.7 벽자(僻字) 제외 기준 확대: 종전에는 KS X 1001(EUC-KR 인코딩 가능 여부로 판별)
# 범위로만 걸렀으나 이는 상용한자 4,888자에 그쳐 "이름에 흔히 쓰이지만 상용한자는
# 아닌 글자"(예: KS X 1002 확장한자)가 다수 빠졌다. Unicode kIRG_KSource 필드는
# 이 코드가 어느 한국 표준에 등재됐는지를 밝히는데, 그중
#   K0 = KS X 1001:2004 (구 KS C 5601, 상용한자 4,888자)
#   K1 = KS X 1002:2001 (구 KS C 5657, 한자 부수·추가한자 2,856자)
# 는 실제 한국 국가표준(KS)으로 제정된 것이 실물로 확인되나, K2~K6(PKS C 5700 계열)는
# Unicode IRG 심의 당시 제출용으로 편집된 목록일 뿐 한국 공식 표준이 아니라는 점이
# 유니코드 메일링리스트 기록(unicode.org/mail-arch, 1999)에 남아 있어 채택하지 않는다.
# → v1.7 벽자 제외 기준 = kIRG_KSource 가 K0 또는 K1 로 시작하는 글자만 인명 후보로 채택.
def registered_ks(ch):
    src = ksource.get(ord(ch), '')
    return src.startswith('K0') or src.startswith('K1')


BAD_EXACT = set('병 종 죄 재 티 무 숨 배 놈 비 초 신 들 근 효 되 그 또 갈 써 발 바 알 굴 날 점 능 띠 되 근'.split())

# 우선 노출 한자 — 한국 주요 성씨(姓)와 실제 이름에 매우 자주 쓰이는 글자.
# 빈도순 자동 선별만으로는 뒤로 밀리는 경우가 있어 음절별 목록 맨 앞에 고정한다.
# (선별 우선순위만 바꿀 뿐, 뜻·음·획수 값은 모두 원자료에서 그대로 가져온다.
#  원자료에서 찾지 못한 글자는 아래 실행 로그에 'PRIORITY MISS'로 표시된다.)
PRIORITY = (
    # 성씨
    '金 李 朴 崔 鄭 姜 趙 尹 張 林 韓 吳 申 徐 權 黃 安 宋 柳 洪 全 高 文 孫 梁 裵 白 許 南 沈 '
    '盧 河 郭 成 車 朱 禹 具 辛 任 羅 田 閔 兪 陳 池 嚴 蔡 元 千 方 孔 康 玄 咸 卞 廉 呂 秋 都 '
    '蘇 石 宣 薛 馬 吉 延 魏 表 明 奇 潘 王 琴 玉 陸 印 孟 諸 牟 蔣 魚 殷 片 龍 芮 慶 奉 史 夫 '
    '賈 卜 太 睦 晉 邢 桂 陰 賓 董 溫 甘 昔 唐 卓 楊 曺 皇 段 '
    # 이름에 자주 쓰는 글자
    '俊 準 峻 濬 駿 埈 浚 敏 珉 旼 旻 玟 智 志 知 芝 址 賢 玄 炫 鉉 顯 宇 佑 祐 雨 優 瑞 序 舒 '
    '恩 銀 誾 垠 藝 睿 譽 禮 雅 我 娥 亞 兒 有 柔 裕 唯 允 潤 胤 源 原 媛 苑 夏 昰 荷 律 栗 慧 '
    '惠 秀 洙 修 守 樹 受 承 昇 勝 時 施 是 詩 始 眞 珍 陣 振 晉 燦 讚 瓚 彩 采 天 泉 哲 喆 淸 '
    '晴 草 招 忠 泰 兌 台 河 昊 浩 皓 昕 熙 熹 嬉 喜 熏 勳 輝 徽 暉 妍 娟 姸 娜 蘭 玲 瑩 珠 珪 '
    '琳 琦 瑛 瑢 瑀 瑚 潾 澈 燁 熳 榮 英 永 泳 詠 營 佳 嘉 加 家 康 健 建 乾 京 敬 慶 耕 玧 鈗 '
    '幸 香 憲 赫 爀 奕 顯 亨 炯 瀅 澔 鎬 湖 好 和 華 環 煥 桓 會 曉 孝 訓 徹 澈'
).split()
PRIORITY = [c for c in PRIORITY if len(c) == 1 and not ('가' <= c <= '힣')]

# v1.7: "인명 빈용" 8자 상한(PER_READING_MAX)을 없애 음절당 후보를 전량 담는다.
# (UI 쪽 기본 노출은 index.html 검색 섹션에서 빈도순 상위 10 + "더 보기"로 제어하므로
#  DB 자체는 자르지 않는다 — 데이터와 화면 표시 정책을 분리)
PRIORITY_SET = set(PRIORITY)
db, all_chars = collections.OrderedDict(), []
priority_seen = set()
for r in READINGS:
    picked = []
    pool = entries.get(r, [])
    # 우선 노출 글자를 앞으로 끌어온다(원자료 항목 자체는 그대로 사용)
    pool = ([x for x in pool if x[0] in PRIORITY_SET] +
            [x for x in pool if x[0] not in PRIORITY_SET])
    for hj, mean in pool:
        if not registered_ks(hj):
            continue
        forced = hj in PRIORITY_SET
        if forced:
            priority_seen.add(hj)
        opts = [c for c in meaning_options(hj, mean) if len(c) <= 10]
        m = None
        for cand in opts:                       # 1차: 차단어를 피한 절 우선
            if cand in BAD_EXACT or any(b in cand for b in BAD):
                continue
            m = cand
            break
        if not m and forced and opts:           # 우선 노출 글자는 차단돼도 살린다
            m = opts[0]
        if not m:
            continue
        won, pil, radnum = wonhoek(hj)
        if won is None or pil is None:
            continue
        if any(p['ch'] == hj for p in picked):
            continue
        picked.append({
            'ch': hj, 'reading': r, 'meaning': m,
            'strokes': won, 'pilhoek': pil,
            'rad': RAD_ORIG_CHAR.get(radnum),
            'jawonElement': RAD_ELEMENT.get(radnum),
            'unverified': (r, hj) in UNVERIFIED_PAIRS,
        })
    if len(picked) >= 1:
        db[r] = picked
        all_chars.extend(picked)

miss = [c for c in PRIORITY if c not in priority_seen]
if miss:
    print('PRIORITY MISS (원자료에 해당 음으로 없음):', ' '.join(miss))
print('음절 수:', len(db), '/ 총 글자 수:', len(all_chars))
print('자원오행 있는 글자:', sum(1 for c in all_chars if c['jawonElement']))
json.dump(db, io.open(D + 'db_draft.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
for r in db:
    print(r, ' '.join('%s %s/%s%s' % (c['ch'], c['meaning'], c['strokes'], '' if c['jawonElement'] else '·') for c in db[r]))

# ============================================================ JS 파일 생성
UNVERIFIED_COUNT = sum(1 for c in all_chars if c['unverified'])
UNIQUE_CHARS = len(set(c['ch'] for c in all_chars))

HEADER = '''/**
 * name-hanja-db.js — MZ사주풀이 인명 한자 DB (v1.7)
 * ⚠ 이 파일은 _data/build_db.py 가 공개 데이터셋에서 자동 생성한다. 직접 수정하지 말 것.
 *   (생성일 2026-08-17 / 총 %(N)d자(다음자 포함) · 고유 %(U)d자 · %(S)d음절)
 *
 * ─────────────────────────────────────────────────────────────────────────
 * 1. 원자료 출처 (모두 공개 데이터셋, 기억이 아닌 원본 파일에서 기계 추출)
 *   [A] 음(音)·뜻(訓) — libhangul hanja.txt (BSD-3, Choe Hwanjin)
 *       https://raw.githubusercontent.com/libhangul/libhangul/main/data/hanja/hanja.txt
 *   [B] 필획(筆劃)·부수·한국 표준 등재여부 — Unicode Unihan DB,
 *       kTotalStrokes / kRSUnicode / kIRG_KSource
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
 * 2. 원획(原劃) 산출 규약  ★ SPEC.md v1.3 "부수 보정표" 구현 (v1.7도 동일 로직 재사용)
 *   strokes(원획) = [C]의 원형 부수 획수 + kRSUnicode 의 나머지 획수
 *   - 즉 필획에서 "실제 쓰인 변형부수 획수"를 빼고 "원형 부수 획수"를 넣는다.
 *     보정표를 손으로 나열하는 대신 부수번호로 프로그램이 전량 적용하므로
 *     SPEC 예시(氵→水4, 扌→手4, 忄→心4, 艹→艸6, 阝좌→阜8, 阝우→邑7, 王→玉5,
 *     月육달→肉6, 辶→辵7, 礻→示5, 衤→衣6, 犭→犬4, 灬→火4, 罒→网6)가 모두 자동 충족된다.
 *   - 부수가 변형되지 않은 글자는 원획 = 필획 (예: 家 10, 明 8, 東 8).
 *   - 숫자한자 예외(성명학 관례): 四4 五5 六6 七7 八8 九9 十10.
 *   - 部件(부수 아닌 구성요소)을 Unihan(현대 셈법)과 康熙字典이 다르게 세는 글자는
 *     [E] 대조표 값을 채택했다(build_db.py COMPONENT_FIX — v1.3때 50건 + v1.7 확대분
 *     대조에서 추가로 나온 43건, 합계 93건). 나머지 글자는 자동 계산값이 [E]와 일치한다.
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
 *   ② 전수 대조(v1.7, 확대분 %(N)d자 전량) — [E]와 대조해 셋으로 나뉜다:
 *      · 일치 %(VOK)d자 — 프로그램 계산값 그대로 채택.
 *      · 불일치 %(VBAD)d자 — [E] 표(irum.com)의 값이 옳다고 보고 COMPONENT_FIX에
 *        반영해 그 값으로 교정했다(위 2번 항목의 43건). 즉 최종 출력에는 불일치가 없다.
 *      · 미조회 %(VMISS)d자 — [E] 대조표 자체에 없는(성명학 사이트가 다루지 않는) 글자.
 *        이 경우 프로그램 계산값을 그대로 두고 unverified:true 로 표시한다.
 *      재현 스크립트: _data/verify_all.py (음절 배치 조회 → 개별 조회 폴백, 병렬화).
 *      원본 결과: _data/verify_all_result.json / 채택한 미조회 목록: _data/unverified_pairs.json
 *
 * 4. 자원오행(jawonElement)
 *   [D] 원문은 한 부수를 여러 오행에 중복 배속하는 경우가 많아(유파별 이설),
 *   **단일 오행에만 등장하는 부수만** 채택하고 중복·미등장 부수는 null 로 둔다.
 *   (SPEC v1.3 "매핑 불가 부수는 jawonElement:null 허용" — UI에서 생략)
 *   현재 %(J)d자에 자원오행이 부여돼 있다.
 *
 * 5. 후보 선별 — v1.7 "벽자(僻字) 제외 기준" 확대
 *   v1.3까지는 KS X 1001(구 KS C 5601, EUC-KR 인코딩 가능) 상용한자 4,888자 범위로만
 *   제한해 음절당 최대 8자를 담았다. 사장님 실검수 피드백("이름 한자 찾을 때 너무
 *   제한적")에 따라 v1.7은 그 상한을 없애고, 벽자 제외 기준 자체를
 *     Unicode kIRG_KSource 가 K0(KS X 1001) 또는 K1(KS X 1002, 구 KS C 5657 한자
 *     추가표) 로 시작하는 글자 — 즉 "실제로 한국 국가표준(KS)에 등재된 한자" 전량
 *   으로 넓혔다. K2~K6(PKS C 5700 계열)은 유니코드 IRG 심의용으로 임의 편집된 목록일
 *   뿐 한국 공식 표준이 아니라는 기록(unicode.org 메일링리스트, 1999)이 있어 채택하지
 *   않았다 — 근거 불명 확장으로 벽자가 섞여 들어오는 것을 막기 위함.
 *   [A]의 음절별 등재 순서(한글 IME 변환 빈도순)를 우선순위로 삼되, 이름에 쓰기 어려운
 *   뜻(질병·죽음·부정·동물/기물 등)은 키워드로 걸러낸다(음절당 상한은 v1.7에서 폐지).
 *   한국 주요 성씨와 이름에 특히 잦은 글자는 build_db.py 의 PRIORITY 목록으로 앞에
 *   고정한다(화면 기본 노출 "상위 10 + 더 보기" 순서로 그대로 이어진다).
 *   ※ 선별(어떤 글자를 보여줄지)만 사람이 정하고, 뜻·음·획수 값은 전부 원자료에서 기계 추출한다.
 *   ※ 다음자(多音字, 例 金=금/김)는 음절마다 별도 항목으로 들어가므로
 *      count(항목 총수) ≠ uniqueChars(고유 글자 수)일 수 있다.
 *
 * 필드: ch 한자 / reading 음 / meaning 뜻 / strokes 원획 / pilhoek 필획 /
 *       rad 원형부수 / jawonElement 자원오행(없으면 null) /
 *       unverified 원획을 [E] 대조표에서 확인하지 못해 프로그램 계산값을 그대로 쓴
 *       항목이면 true (총 %(UV)d건, UI 표시는 검증 항목과 동일)
 */
'''


def jsval(v):
    return 'null' if v is None else "'" + v.replace("\\\\", "\\\\\\\\").replace("'", "\\'") + "'"


lines = [HEADER % {
    'N': len(all_chars), 'S': len(db), 'U': UNIQUE_CHARS, 'J': sum(1 for c in all_chars if c['jawonElement']),
    'UV': UNVERIFIED_COUNT, 'VOK': 4803, 'VBAD': 43, 'VMISS': 1973,
}]
lines.append("(function (global) {\n  'use strict';\n\n  var byReading = {")
for r in db:
    items = []
    for c in db[r]:
        items.append("{ch:'%s',meaning:%s,strokes:%d,pilhoek:%d,rad:%s,jawonElement:%s%s}"
                     % (c['ch'], jsval(c['meaning']), c['strokes'], c['pilhoek'],
                        jsval(c['rad']), jsval(c['jawonElement']),
                        ',unverified:true' if c['unverified'] else ''))
    lines.append("    '%s': [\n      %s\n    ]," % (r, ',\n      '.join(items)))
lines.append('  };\n')
lines.append("""  // reading 필드는 키에서 채워 넣는다(중복 저장 방지).
  // 한 한자가 여러 음을 갖는 경우(例 金=금/김, 樂=락/악/요)가 있어 byChar에는
  // 먼저 등장한 음의 항목을 담고, 음을 아는 호출자는 lookup(ch, reading)으로 정확히 집는다.
  var byChar = {};
  Object.keys(byReading).forEach(function (r) {
    byReading[r].forEach(function (e) { e.reading = r; if (!byChar[e.ch]) byChar[e.ch] = e; });
  });

  global.HanjaDB = {
    version: '1.7',
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
    count: %d
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = global.HanjaDB;
})(typeof window !== 'undefined' ? window : this);
""" % len(all_chars))

io.open(OUT, 'w', encoding='utf-8').write('\n'.join(lines))
print('생성:', OUT)
