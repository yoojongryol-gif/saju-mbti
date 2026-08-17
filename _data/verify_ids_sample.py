# -*- coding: utf-8 -*-
"""
verify_ids_sample.py — 파자 데이터 표본 대조 (MZ사주풀이 v1.9)

  python verify_ids_sample.py            # 표본 30자 대조
  python verify_ids_sample.py --all      # 전량 대조

배포된 name-hanja-db.js 의 ids/구성요소/서사가 원자료(_data/ids.txt = cjkvi-ids)와
정확히 일치하는지 되짚는다. 빌드가 만든 값을 빌드 코드로 다시 확인하면 의미가 없으므로,
여기서는 **name-hanja-db.js 파일 자체를 파싱해서** 원자료와 맞대어 본다.

검사 항목
  ① entry.ids  == ids.txt 의 그 글자 IDS (한국 자형 우선 규약 그대로)
  ② IDS에서 IDC 연산자를 뺀 글자열 == JS breakdown 이 내놓는 구성요소
  ③ 큐레이션 서사가 붙은 글자는 서사에 등장하는 한자가 실제 구성요소 안에 있는지
     (서사가 데이터에 없는 글자를 끌어들이지 않았는지)
  ④ entry.snd(소리 구실 구성요소)의 음이 실제로 그 글자의 음과 겹치는지

표본 30자는 자형 유형이 골고루 섞이도록 고정해 두었다(고정 목록이라 실행마다 같은 결과).
"""
import sys, io, re, json, subprocess
sys.stdout.reconfigure(encoding='utf-8')
D = r'C:/Users/NHNE/saju-mbti/_data/'
ROOT = r'C:/Users/NHNE/saju-mbti/'
sys.path.insert(0, D)
from ids_lib import load_ids, load_hanja_meanings, IDC_ARITY   # noqa: E402

# 자형 유형이 고루 섞이도록 고른 표본 30자
SAMPLE = ('忍 明 珉 浩 李 朴 崔 家 安 洪 淸 燦 智 志 銀 恩 敏 秀 賢 雅 '
          '林 秋 都 桂 星 松 柱 錫 律 孝').split()

ids_map = load_ids(D + 'ids.txt')
mean_map, read_map = load_hanja_meanings(D + 'hanja.txt')

# ---- 배포 파일에서 (음, 글자) → {ids, snd} 를 직접 뽑아낸다 (빌드 코드를 거치지 않는다)
js = io.open(ROOT + 'name-hanja-db.js', encoding='utf-8').read()
ENTRY_RE = re.compile(r"\{ch:'(.)',meaning:'((?:[^'\\]|\\.)*)',strokes:(\d+),pilhoek:(\d+),"
                      r"rad:(?:'(.)'|null),jawonElement:(?:'(.)'|null)([^}]*)\}")
entries = {}
for m in ENTRY_RE.finditer(js):
    ch, tail = m.group(1), m.group(7)
    ids = re.search(r"ids:'([^']*)'", tail)
    snd = re.search(r"snd:'(.)'", tail)
    if ch not in entries:
        entries[ch] = {'ids': ids.group(1) if ids else None,
                       'snd': snd.group(1) if snd else None}

stories = {}
mstore = re.search(r"var stories = \{(.*?)\n  \};", js, re.S)
for m in re.finditer(r"'(.)': '((?:[^'\\]|\\.)*)'", mstore.group(1)):
    stories[m.group(1)] = m.group(2)

# ---- JS breakdown() 이 실제로 내놓는 구성요소 (node 로 배포 파일을 그대로 실행)
targets = sorted(entries) if '--all' in sys.argv else SAMPLE
# 대조 대상 목록은 임시 파일로 넘긴다(전량 모드는 명령줄 길이 제한을 넘긴다).
json.dump(targets, io.open(D + '_ids_targets.json', 'w', encoding='utf-8'), ensure_ascii=False)
node_src = (
    "var D=require('%(r)sname-hanja-db.js');"
    "var T=JSON.parse(require('fs').readFileSync('%(d)s_ids_targets.json','utf8'));var out={};"
    "T.forEach(function(c){var b=D.breakdown(c);out[c]={ids:b.ids,resolved:b.resolved,"
    "parts:b.parts.map(function(p){return p.ch;}).join(''),"
    "origs:b.parts.map(function(p){return p.orig||p.ch;}).join(''),"
    "story:b.story,sound:b.sound};});"
    "process.stdout.write(JSON.stringify({rows:out,radForms:D.radForms}));"
    % {'r': ROOT.replace('\\', '/'), 'd': D}
)
_raw = json.loads(subprocess.run([r'node', '-e', node_src], capture_output=True,
                                 check=True).stdout.decode('utf-8'))
jsout, RAD_FORMS = _raw['rows'], _raw['radForms']

fails, checked = [], 0
for ch in targets:
    e = entries.get(ch)
    b = jsout.get(ch)
    if not e or not b:
        continue
    checked += 1
    raw = ids_map.get(ch)
    # ① IDS 원본 일치
    if e['ids'] != raw:
        fails.append('%s ids 불일치: DB %r ≠ 원자료 %r' % (ch, e['ids'], raw))
        continue
    if not b['resolved']:
        continue
    # ② 구성요소 = IDS − IDC 연산자
    expect = ''.join(c for c in raw if c not in IDC_ARITY)
    if b['parts'] != expect:
        fails.append('%s 구성요소 불일치: breakdown %r ≠ IDS−IDC %r' % (ch, b['parts'], expect))
    # ③ 서사에 등장하는 한자가 전부 실제 구성요소(또는 그 원형부수·글자 자신)인지.
    #    데이터에 없는 글자를 서사가 끌어들이면 여기서 걸린다.
    st = stories.get(ch)
    if st:
        allowed = set(expect) | set(b.get('origs') or '') | set([ch])
        for pc in expect:
            if RAD_FORMS.get(pc):
                allowed.add(RAD_FORMS[pc])
        stray = [hj for hj in re.findall(r'[一-鿿]', st) if hj not in allowed]
        if stray:
            fails.append('%s 서사에 구성요소가 아닌 한자 등장: %s' % (ch, ' '.join(stray)))
    # ④ 소리 구실 구성요소의 음이 실제로 겹치는지
    if e['snd']:
        if e['snd'] not in expect:
            fails.append('%s snd %r 가 구성요소 %r 에 없음' % (ch, e['snd'], expect))

print('대조 %d자 / 불일치 %d건' % (checked, len(fails)))
for f in fails:
    print('  FAIL', f)
if not fails:
    print('표본 대조 통과 — DB의 ids/구성요소/소리 표시가 cjkvi-ids 원본과 일치합니다.')
sys.exit(1 if fails else 0)
