# -*- coding: utf-8 -*-
"""DB 전수 원획 대조 (음절 단위 조회로 irum.com 부하 최소화)"""
import sys, io, json, re, time, urllib.parse, subprocess
sys.stdout.reconfigure(encoding='utf-8')

D = r'C:/Users/NHNE/saju-mbti/_data/'
db = json.load(io.open(D + 'db_draft.json', encoding='utf-8'))

def single(ch):
    ks = json.dumps({"query": [ch]}, ensure_ascii=False)
    url = "https://www.irum.com/Resource/Hanja?ks=" + urllib.parse.quote(ks.encode('utf-8'))
    out = subprocess.run(["curl", "-sSL", "-A", "Mozilla/5.0", url],
                         capture_output=True).stdout.decode('utf-8', 'replace')
    for m in re.finditer(r'ha-ll">(.)</dt>(.*?)</dl>', out, re.S):
        if m.group(1) == ch:
            s2 = re.search(r'총\s*(\d+)획', m.group(2))
            if s2: return int(s2.group(1))
    return None


ok = bad = unchecked = 0
mismatch = []
for r, lst in db.items():
    ks = json.dumps({"query": [r]}, ensure_ascii=False)
    url = "https://www.irum.com/Resource/Hanja?ks=" + urllib.parse.quote(ks.encode('utf-8'))
    out = subprocess.run(["curl", "-sSL", "-A", "Mozilla/5.0", url],
                         capture_output=True).stdout.decode('utf-8', 'replace')
    ref = {}
    for m in re.finditer(r'ha-ll">(.)</dt>(.*?)</dl>', out, re.S):
        s = re.search(r'총\s*(\d+)획', m.group(2))
        if s:
            ref[m.group(1)] = int(s.group(1))
    for e in lst:
        v = ref.get(e['ch'])
        if v is None:
            v = single(e['ch'])
        if v is None:
            unchecked += 1
            print('UNCHECKED', r, e['ch'])
        elif v == e['strokes']:
            ok += 1
        else:
            bad += 1
            mismatch.append((r, e['ch'], e['strokes'], v))
    time.sleep(0.2)

print('대조 완료 | 일치 %d / 불일치 %d / 미조회 %d' % (ok, bad, unchecked))
for m in mismatch:
    print('MISMATCH', m)
