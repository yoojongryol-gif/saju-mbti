# -*- coding: utf-8 -*-
"""
ids_lib.py — 파자(자형 분해) 공통 라이브러리 (MZ사주풀이 v1.9)

원자료(공개 데이터셋):
  [F] CJKVI IDS Database — 한자의 자형 구성(Ideographic Description Sequence)
      https://raw.githubusercontent.com/cjkvi/cjkvi-ids/master/ids.txt
      (CHISE IDS Database 기반, (c) 2014-2017 CJKVI Database)
  [A] libhangul hanja.txt — 구성요소 글자의 뜻·음
      https://raw.githubusercontent.com/libhangul/libhangul/main/data/hanja/hanja.txt
  [C] Unicode CJKRadicals.txt — 변형부수(氵·扌…) → 원형부수(水·手…) 대응

※ 이 파일은 "데이터를 읽고 결합"하기만 한다. 어원 서술(무엇이 무엇을 본떴다 등)은
  여기서 만들지 않는다 — 서사는 build_db.py 의 CURATED_STORY 에만 있고, 그마저도
  구성요소가 IDS 데이터와 일치하는지 빌드 때 전량 대조한다.
"""
import io, re, collections

# 표의문자 기술 문자(IDC, U+2FF0..U+2FFB)와 각 연산자의 피연산자 개수
IDC_ARITY = {
    '⿰': 2, '⿱': 2, '⿲': 3, '⿳': 3, '⿴': 2, '⿵': 2,
    '⿶': 2, '⿷': 2, '⿸': 2, '⿹': 2, '⿺': 2, '⿻': 2,
}


def load_ids(path):
    """ids.txt → {글자: IDS문자열}.

    한 줄에 IDS 후보가 여러 개일 수 있고 각 후보 뒤에 자원(字源) 지역 태그
    ([GTJKV] 등)가 붙는다. 한국 자형([K] 포함)을 우선 채택하고, 없으면 태그 없는
    첫 후보(=전 지역 공통)를 쓴다. &CDP-xxxx; 같은 사설 엔티티가 섞인 후보는
    표시할 수 없는 글자라 건너뛴다.
    """
    out = {}
    with io.open(path, encoding='utf-8') as f:
        for line in f:
            if line.startswith('#') or not line.strip():
                continue
            p = line.rstrip('\n').split('\t')
            if len(p) < 3 or len(p[1]) != 1:
                continue
            ch = p[1]
            plain, korean = None, None
            for field in p[2:]:
                m = re.match(r'^([^\[\]]+)(?:\[([A-Z]+)\])?$', field.strip())
                if not m:
                    continue
                body, tag = m.group(1), m.group(2)
                if '&' in body or '?' in body or '*' in body:
                    continue
                if tag is None and plain is None:
                    plain = body
                if tag and 'K' in tag and korean is None:
                    korean = body
            pick = korean or plain
            if pick:
                out[ch] = pick
    return out


def load_hanja_meanings(path):
    """hanja.txt → ({글자: 대표 뜻}, {글자: 음들(문자열)}).

    같은 글자가 여러 음으로 등재되면 먼저 나온 음의 뜻을 대표로 삼고, 음은 모두
    모아 둔다(다음자 판별·형성자 소리 판정에 쓴다).
    """
    mean, reads = {}, collections.defaultdict(str)
    with io.open(path, encoding='utf-8') as f:
        for line in f:
            if line.startswith('#') or not line.strip():
                continue
            p = line.rstrip('\n').split(':')
            if len(p) < 3:
                continue
            key, hj, m = p[0], p[1], p[2].strip()
            if len(key) != 1 or len(hj) != 1 or not ('가' <= key <= '힣') or not m:
                continue
            if key not in reads[hj]:
                reads[hj] += key
            if hj not in mean:
                mean[hj] = m
    return mean, dict(reads)


def load_radical_variants(path):
    """CJKRadicals.txt → ({변형/부수블록 글자: 원형 부수 글자}, {부수번호: 원형 글자}).

    예) 85' ; 6C35(氵) ; 6C34(水)  →  氵 → 水
        康熙부수 블록(U+2F00~)·CJK부수보충 블록(U+2E80~) 글자도 같은 방식으로 원형에 잇는다.
    """
    variant, orig = {}, {}
    with io.open(path, encoding='utf-8') as f:
        for line in f:
            if line.startswith('#') or not line.strip():
                continue
            p = [x.strip() for x in line.strip().rstrip(';').split(';')]
            if len(p) < 3 or not p[2]:
                continue
            num = int(p[0].rstrip("'"))
            form = chr(int(p[1], 16)) if p[1] else None
            o = chr(int(p[2], 16))
            if "'" not in p[0]:
                orig[num] = o
            if form and form != o:
                variant[form] = o
    return variant, orig


def load_rs_and_variants(irg_path, var_path):
    """Unihan → ({글자: (부수번호, 나머지획수)}, {글자: 의미변체 대상글자}).

    구성요소 글자가 hanja.txt 에 없을 때 "이 조각이 어느 부수의 변형인가"를
    데이터로 판정하기 위한 것이다.
      · kRSUnicode 의 나머지 획수가 0 이하면 그 글자 자체가 부수 N의 한 형태다
        (例 扌 64.0, 𧾷 157.0, 王 96.-1 — 음수는 원형보다 획이 준 변형).
      · kSemanticVariant/kZVariant 는 같은 뜻으로 통용되는 글자를 가리킨다.
    """
    rs, var = {}, {}
    with io.open(irg_path, encoding='utf-8') as f:
        for line in f:
            if line.startswith('#') or not line.strip():
                continue
            p = line.rstrip('\n').split('\t')
            if len(p) < 3 or p[1] != 'kRSUnicode':
                continue
            m = re.match(r"^(\d+)('*)\.(-?\d+)$", p[2].split()[0])
            if m:
                rs[chr(int(p[0][2:], 16))] = (int(m.group(1)), int(m.group(3)))
    with io.open(var_path, encoding='utf-8') as f:
        for line in f:
            if line.startswith('#') or not line.strip():
                continue
            p = line.rstrip('\n').split('\t')
            if len(p) < 3 or p[1] not in ('kSemanticVariant', 'kZVariant'):
                continue
            src = chr(int(p[0][2:], 16))
            tgt = p[2].split()[0].split('<')[0]
            if tgt.startswith('U+') and src not in var:
                var[src] = chr(int(tgt[2:], 16))
    return rs, var


def parse_ids(s):
    """IDS 문자열 → 트리. 리프는 str(1글자), 마디는 (연산자, [자식…])."""
    pos = [0]

    def node():
        if pos[0] >= len(s):
            return None
        c = s[pos[0]]
        pos[0] += 1
        if c in IDC_ARITY:
            kids = []
            for _ in range(IDC_ARITY[c]):
                k = node()
                if k is None:
                    return None
                kids.append(k)
            return (c, kids)
        return c

    t = node()
    return t if pos[0] == len(s) else None


def leaves(tree):
    """트리의 원자 구성요소(리프)를 좌→우 순서로."""
    if tree is None:
        return []
    if isinstance(tree, str):
        return [tree]
    out = []
    for k in tree[1]:
        out.extend(leaves(k))
    return out


def resolve_component(c, ctx):
    """구성요소 글자 하나 → (표시글자, 뜻, 음, 원형글자|None). 확인 못 하면 None.

    판정 순서(전부 원자료 기반, 사람의 어원 해석 없음):
      ① CJKRadicals.txt 의 변형부수 대응 (氵→水, 艹→艸 …)
      ② Unihan kRSUnicode 의 나머지 획수가 0 이하 → 그 글자는 부수 N의 한 형태
         (扌→手, 𧾷→足, 王→玉 …)
         단 글자 자신이 그 부수의 원형이면(月·人·水 등) 건너뛰고 ③으로.
      ③ libhangul hanja.txt 의 뜻·음 그대로
      ④ Unihan kSemanticVariant / kZVariant 가 가리키는 글자의 뜻·음
    """
    mean, read = ctx['mean'], ctx['read']

    def short(m):
        """뜻 문자열 첫 절만 남기고 괄호주석·끝의 음(音)을 떼어낸다.
        (build_db.py meaning_options 와 같은 규약)"""
        if not m:
            return None
        seg = re.sub(r'\s*\([^)]*\)\s*', ' ', m.split(',')[0]).strip()
        toks = seg.split()
        if len(toks) >= 2 and len(toks[-1]) == 1 and '가' <= toks[-1] <= '힣':
            toks = toks[:-1]
        return ' '.join(toks).strip() or None

    o = ctx['var'].get(c)
    if o and o in mean:
        return (c, short(mean[o]), read.get(o, ''), o)
    rs = ctx['rs'].get(c)
    if rs and rs[1] <= 0:
        o2 = ctx['rad_orig'].get(rs[0])
        if o2 and o2 != c and o2 in mean:
            return (c, short(mean[o2]), read.get(o2, ''), o2)
    if c in mean:
        return (c, short(mean[c]), read.get(c, ''), None)
    o3 = ctx['zvar'].get(c)
    if o3 and o3 in mean:
        return (c, short(mean[o3]), read.get(o3, ''), o3)
    return None


def decompose_parts(ch, ids_map, max_parts=5):
    """글자 → (IDS문자열, 구성요소 리스트).

    · IDS가 글자 자신과 같으면(독체자·분해정보 없음) 구성요소는 빈 리스트.
    · 중첩된 IDS는 원자 글자가 될 때까지 펼친다(例 金 ⿱人⿻王丷 → 人·王·丷).
    · 구성요소가 max_parts를 넘으면 과분해로 보아 최상위 자식만 남기고,
      그래도 원자가 아니면 분해를 포기한다(빈 리스트).
    """
    ids = ids_map.get(ch)
    if not ids or ids == ch:
        return (ids, [])
    tree = parse_ids(ids)
    if tree is None or isinstance(tree, str):
        return (ids, [])
    ps = leaves(tree)
    # 구성요소가 너무 많으면(과분해) 파자 풀이로서 의미가 없어 포기한다.
    # ※ 여기서 얻는 ps 는 "IDS 문자열에서 IDC 연산자를 뺀 글자열"과 항상 같다
    #    (IDS는 전위 표기라 비연산자 토큰이 곧 리프의 좌→우 순서다).
    #    name-hanja-db.js 쪽 breakdown()이 그 성질을 그대로 이용하므로,
    #    여기에 그 규칙을 벗어나는 예외를 넣으면 양쪽이 어긋난다.
    if len(ps) > max_parts or len(ps) < 2:
        return (ids, [])
    return (ids, ps)
