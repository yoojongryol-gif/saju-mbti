# -*- coding: utf-8 -*-
"""원획 교차검증: 생성한 DB의 strokes(원획)를 성명학 사이트와 대조.

대조처: 인터넷 한국작명연구원 인명용한자 조회 (https://www.irum.com/Resource/Hanja)
        — "성명학에서 한자의 획수는 康熙字典과 玉篇을 근본으로 하여 원획으로 하여야 합니다"
          라고 명시된 원획 기준 표. 검색 GET: /Resource/Hanja?ks={"query":["漢"]}
"""
import sys, io, json, re, time, urllib.parse, subprocess, collections
sys.stdout.reconfigure(encoding='utf-8')

D = r'C:/Users/NHNE/saju-mbti/_data/'
db = json.load(io.open(D + 'db_draft.json', encoding='utf-8'))
bych = {}
for r, lst in db.items():
    for e in lst:
        bych[e['ch']] = e

# 변형부수 전 유형 + 무보정 대조군을 고루 담은 표본 30자
SAMPLE = ['江', '湖', '潤', '澈', '淸',        # 氵→水
          '揆', '振', '換', '採',              # 扌→手
          '性', '情', '惜',                    # 忄→心
          '英', '草', '藍', '薰',              # 艹→艸
          '陳', '陣', '院',                    # 阝(좌)→阜
          '都', '鄕', '那',                    # 阝(우)→邑
          '珉', '珪', '環',                    # 王→玉
          '胤',                                # 月(육달)→肉
          '進', '道', '遠',                    # 辶→辵
          '福', '祖', '神',                    # 礻→示
          '裏',                                # 衤→衣
          '熱', '烈',                          # 灬→火 (무변동 대조)
          '羅',                                # 罒→网
          '家', '明', '星', '東', '金']         # 무보정 대조군


def query(ch):
    ks = json.dumps({"query": [ch]}, ensure_ascii=False)
    url = "https://www.irum.com/Resource/Hanja?ks=" + urllib.parse.quote(ks.encode('utf-8'))
    out = subprocess.run(["curl", "-sSL", "-A", "Mozilla/5.0", url],
                         capture_output=True).stdout.decode('utf-8', 'replace')
    for m in re.finditer(r'ha-ll">(.)</dt>(.*?)</dl>', out, re.S):
        if m.group(1) != ch:
            continue
        s = re.search(r'총\s*(\d+)획', m.group(2))
        if s:
            return int(s.group(1))
    return None


rows, ok, bad, miss = [], 0, [], []
for ch in SAMPLE:
    e = bych.get(ch)
    if not e:
        miss.append(ch); continue
    ref = query(ch)
    time.sleep(0.3)
    if ref is None:
        miss.append(ch); continue
    match = (ref == e['strokes'])
    rows.append((ch, e['pilhoek'], e['strokes'], ref, 'OK' if match else 'MISMATCH'))
    if match: ok += 1
    else: bad.append((ch, e['strokes'], ref))

print('한자 | 필획(Unihan) | 원획(본 DB) | 원획(irum.com) | 결과')
for r in rows:
    print('%s | %d | %d | %d | %s' % r)
print('\n표본 %d자 중 일치 %d, 불일치 %d, 조회실패 %s' % (len(rows), ok, len(bad), miss))
if bad:
    print('불일치:', bad)
