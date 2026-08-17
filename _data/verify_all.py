# -*- coding: utf-8 -*-
"""DB 전수 원획 대조 (음절 단위 조회 → 개별 조회 폴백, v1.7: 병렬화로 확대분 처리)

v1.7에서 규모가 2,564자 → 6,800자대로 늘며 음절 배치 조회(irum.com 1페이지 상한 약
30자)를 넘는 후보가 늘어 개별 폴백이 수백~수천 건 필요해졌다. 대조 로직(정규식·판정
기준)은 어제 그대로이고, 폴백 조회만 스레드풀로 병렬화해(요청 자체는 동일한 GET) 전수
대조를 현실적 시간 안에 끝낸다.
"""
import sys, io, json, re, time, urllib.parse, subprocess, collections
from concurrent.futures import ThreadPoolExecutor, as_completed
sys.stdout.reconfigure(encoding='utf-8')

D = r'C:/Users/NHNE/saju-mbti/_data/'
db = json.load(io.open(D + 'db_draft.json', encoding='utf-8'))


def fetch(url):
    return subprocess.run(["curl", "-sSL", "-A", "Mozilla/5.0", "--max-time", "20", url],
                          capture_output=True).stdout.decode('utf-8', 'replace')


def parse(out):
    ref = {}
    for m in re.finditer(r'ha-ll">(.)</dt>(.*?)</dl>', out, re.S):
        s = re.search(r'총\s*(\d+)획', m.group(2))
        if s:
            ref[m.group(1)] = int(s.group(1))
    return ref


def query_reading(r):
    ks = json.dumps({"query": [r]}, ensure_ascii=False)
    url = "https://www.irum.com/Resource/Hanja?ks=" + urllib.parse.quote(ks.encode('utf-8'))
    return parse(fetch(url))


def query_char(ch):
    ks = json.dumps({"query": [ch]}, ensure_ascii=False)
    url = "https://www.irum.com/Resource/Hanja?ks=" + urllib.parse.quote(ks.encode('utf-8'))
    ref = parse(fetch(url))
    return ref.get(ch)


# 1단계: 음절 배치 조회(원 스크립트와 동일한 순차 방식 — 서버 부하 최소화)
readings = list(db.keys())
batch_ref = {}
for i, r in enumerate(readings):
    batch_ref[r] = query_reading(r)
    time.sleep(0.15)
    if (i + 1) % 50 == 0:
        print('배치 진행 %d/%d' % (i + 1, len(readings)))

# 2단계: 배치 결과에 없는 글자만 개별 조회로 폴백(병렬)
need_fallback = []
for r, lst in db.items():
    ref = batch_ref.get(r, {})
    for e in lst:
        if e['ch'] not in ref:
            need_fallback.append((r, e['ch']))

print('개별 폴백 필요:', len(need_fallback))
fallback_result = {}
with ThreadPoolExecutor(max_workers=8) as ex:
    futs = {ex.submit(query_char, ch): (r, ch) for r, ch in need_fallback}
    done = 0
    for fut in as_completed(futs):
        r, ch = futs[fut]
        try:
            fallback_result[(r, ch)] = fut.result()
        except Exception:
            fallback_result[(r, ch)] = None
        done += 1
        if done % 200 == 0:
            print('폴백 진행 %d/%d' % (done, len(need_fallback)))

# 3단계: 판정
ok = bad = unchecked = 0
mismatch = []
unchecked_list = []
for r, lst in db.items():
    ref = batch_ref.get(r, {})
    for e in lst:
        v = ref.get(e['ch'])
        if v is None:
            v = fallback_result.get((r, e['ch']))
        if v is None:
            unchecked += 1
            unchecked_list.append((r, e['ch']))
        elif v == e['strokes']:
            ok += 1
        else:
            bad += 1
            mismatch.append((r, e['ch'], e['strokes'], v))

print('\n대조 완료 | 일치 %d / 불일치 %d / 미조회 %d' % (ok, bad, unchecked))
print('\n=== MISMATCH (%d) ===' % len(mismatch))
for m in mismatch:
    print('MISMATCH', m[0], m[1], 'DB=%d irum=%d' % (m[2], m[3]))
print('\n=== UNCHECKED (%d) ===' % len(unchecked_list))
for u in unchecked_list:
    print('UNCHECKED', u[0], u[1])

out = {
    'ok': ok, 'bad': bad, 'unchecked': unchecked,
    'mismatch': [{'reading': m[0], 'ch': m[1], 'db': m[2], 'irum': m[3]} for m in mismatch],
    'unchecked_list': [{'reading': u[0], 'ch': u[1]} for u in unchecked_list],
}
json.dump(out, io.open(D + 'verify_all_result.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('\n결과 저장:', D + 'verify_all_result.json')
