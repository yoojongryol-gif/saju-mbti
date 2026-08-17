# -*- coding: utf-8 -*-
"""ids_probe.py — v1.9 파자 데이터 탐색용 보조 스크립트 (배포 대상 아님).

_data/ids.txt(cjkvi-ids) + _data/hanja.txt(libhangul) + CJKRadicals.txt 를 읽어
인명 빈용 글자의 구성요소와 그 뜻을 원자료에서만 뽑아 출력한다.
큐레이션 서사를 "데이터로 확인되는 범위 안"에서 쓰기 위한 근거표.

  python ids_probe.py cover          # 커버리지 수치
  python ids_probe.py list 400       # 빈도 상위 N자의 구성요소표
  python ids_probe.py rad            # 214 부수 목록(뜻·음)
"""
import sys, io, json
sys.stdout.reconfigure(encoding='utf-8')
D = r'C:/Users/NHNE/saju-mbti/_data/'
sys.path.insert(0, D)
from ids_lib import (load_ids, load_hanja_meanings, load_radical_variants,  # noqa
                     load_rs_and_variants, decompose_parts, resolve_component)

ids_map = load_ids(D + 'ids.txt')
mean_map, read_map = load_hanja_meanings(D + 'hanja.txt')
VAR, RAD_ORIG = load_radical_variants(D + 'CJKRadicals.txt')
RS, ZVAR = load_rs_and_variants(D + 'Unihan_IRGSources.txt', D + 'Unihan_Variants.txt')
CTX = dict(mean=mean_map, read=read_map, var=VAR, rad_orig=RAD_ORIG, rs=RS, zvar=ZVAR)


def short(m):
    return m.split(',')[0].strip() if m else None


def comp(c):
    return resolve_component(c, CTX)


mode = sys.argv[1] if len(sys.argv) > 1 else 'cover'
draft = json.load(io.open(D + 'db_draft.json', encoding='utf-8'))

if mode == 'rad':
    for n in sorted(RAD_ORIG):
        c = RAD_ORIG[n]
        print('%d\t%s\t%s\t%s' % (n, c, short(mean_map.get(c, '?')), read_map.get(c, '?')))
    sys.exit()

seen, rows = set(), []
for r, lst in draft.items():
    for i, e in enumerate(lst):
        if e['ch'] in seen:
            continue
        seen.add(e['ch'])
        rows.append((r, i, e))
rows.sort(key=lambda x: (x[1], x[0]))

if mode == 'cover':
    tot = full = nopart = partial_ = noids = 0
    for r, i, e in rows:
        tot += 1
        ids, parts = decompose_parts(e['ch'], ids_map)
        if not ids:
            noids += 1
        elif not parts:
            nopart += 1
        elif all(comp(p) for p in parts):
            full += 1
        else:
            partial_ += 1
    print('고유 글자 %d / IDS 없음 %d / 분해불가(독체·과분해) %d / 구성요소 전부 확인 %d / 일부 미확인 %d'
          % (tot, noids, nopart, full, partial_))
    sys.exit()

limit = int(sys.argv[2]) if len(sys.argv) > 2 else 400
n = 0
for r, i, e in rows:
    if n >= limit:
        break
    ch = e['ch']
    ids, parts = decompose_parts(ch, ids_map)
    if not parts:
        continue
    cs = [comp(p) for p in parts]
    if not all(cs):
        continue
    n += 1
    snd = [c[0] for c in cs if c[0] != ch and r in c[2]]
    print('%s %s/%s | %s | %s%s' % (
        ch, e['meaning'], r, ids,
        ' + '.join('%s%s=%s' % (c[0], ('(' + c[3] + ')') if c[3] else '', c[1]) for c in cs),
        ('  ♪' + ''.join(snd)) if len(snd) == 1 else ''))
