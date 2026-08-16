"""
_gen_icons.py — v1.6 사극 테마 아이콘 재생성 (배포 대상 아님, 1회성 유틸)
  python _gen_icons.py
먹빛 배경 + 금색 원 + 낙관(붉은 도장) 액센트 + 금색 한자 "運"(운/fortune).
maskable purpose 로도 쓰이므로 핵심 요소는 중앙 80% 안전영역 안에 배치.
4배 슈퍼샘플링 후 축소 저장으로 안티에일리어싱 확보.
"""
import math
from PIL import Image, ImageDraw, ImageFont

INK = (26, 20, 16, 255)        # 먹빛 배경
INK2 = (15, 11, 8, 255)
GOLD = (201, 162, 39, 255)     # 금색 포인트
GOLD_LIGHT = (224, 192, 96, 255)
SEAL_RED = (163, 39, 43, 255)  # 낙관 붉은색
CREAM = (243, 233, 210, 255)   # 한지빛 글자색

FONT_PATH = "C:/Windows/Fonts/HANBatangB.ttf"


def draw_icon(size, out_path, maskable=False):
    scale = 4
    S = size * scale
    img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    # ---- 배경: 먹빛 방사형 그라디언트 ----
    cx, cy = S / 2, S / 2
    maxr = S * 0.72
    steps = 90
    for i in range(steps, 0, -1):
        t = i / steps
        r = maxr * t
        col = tuple(int(INK2[k] + (INK[k] - INK2[k]) * (1 - t)) for k in range(3))
        bbox = [cx - r, cy - r, cx + r, cy + r]
        d.ellipse(bbox, fill=col + (255,))
    # 배경 모서리까지 완전히 채우기(마스커블 대비)
    d.rectangle([0, 0, S, S], outline=None)
    corner = Image.new("RGBA", (S, S), INK)
    img = Image.alpha_composite(corner, img)
    d = ImageDraw.Draw(img)

    # ---- 안전영역(중앙 80%) 기준 반경 ----
    safe_r = S * (0.40 if maskable else 0.44)

    # ---- 금색 원(달) ----
    ring_w = max(2 * scale, int(S * 0.012))
    d.ellipse([cx - safe_r, cy - safe_r, cx + safe_r, cy + safe_r],
              outline=GOLD, width=ring_w)
    inner_r = safe_r - ring_w * 2
    d.ellipse([cx - inner_r, cy - inner_r, cx + inner_r, cy + inner_r],
              fill=(35, 27, 20, 255))

    # ---- 중앙 한자 "運" ----
    try:
        font = ImageFont.truetype(FONT_PATH, int(inner_r * 1.35))
    except Exception:
        font = ImageFont.load_default()
    ch = "運"
    bbox = d.textbbox((0, 0), ch, font=font)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    tx = cx - tw / 2 - bbox[0]
    ty = cy - th / 2 - bbox[1]
    d.text((tx, ty), ch, font=font, fill=GOLD_LIGHT)

    # ---- 낙관(붉은 도장) 액센트: 우하단, 안전영역 안쪽 ----
    seal_size = safe_r * 0.62
    seal_cx = cx + safe_r * 0.62
    seal_cy = cy + safe_r * 0.62
    half = seal_size / 2
    seal_box = [seal_cx - half, seal_cy - half, seal_cx + half, seal_cy + half]
    d.rounded_rectangle(seal_box, radius=seal_size * 0.14, fill=SEAL_RED)
    d.rounded_rectangle(seal_box, radius=seal_size * 0.14, outline=GOLD_LIGHT, width=max(1 * scale, int(seal_size * 0.05)))
    try:
        seal_font = ImageFont.truetype(FONT_PATH, int(seal_size * 0.56))
    except Exception:
        seal_font = ImageFont.load_default()
    sch = "福"  # 복(福) — 낙관 안 글자
    sbbox = d.textbbox((0, 0), sch, font=seal_font)
    stw, sth = sbbox[2] - sbbox[0], sbbox[3] - sbbox[1]
    d.text((seal_cx - stw / 2 - sbbox[0], seal_cy - sth / 2 - sbbox[1]), sch, font=seal_font, fill=CREAM)

    img = img.resize((size, size), Image.LANCZOS)
    img.save(out_path)
    print("saved", out_path, size, "maskable" if maskable else "any")


if __name__ == "__main__":
    draw_icon(192, "icon-192.png", maskable=False)
    draw_icon(512, "icon-512.png", maskable=True)
