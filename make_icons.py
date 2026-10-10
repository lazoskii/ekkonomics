from PIL import Image, ImageDraw
import os

OUT = os.path.join(os.path.dirname(__file__), "icons")
os.makedirs(OUT, exist_ok=True)

BG = (37, 99, 235)       # blue-600
CARD = (255, 255, 255)   # white
STRIPE = (30, 64, 175)   # blue-800
COIN = (250, 204, 21)    # yellow-400
COIN_EDGE = (202, 138, 4)


def draw_icon(size, maskable=False):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    # background
    radius = size * (0.0 if maskable else 0.18)
    d.rounded_rectangle([0, 0, size, size], radius=radius, fill=BG)

    # safe zone scale (maskable icons get cropped ~20%, keep content in ~70% center)
    scale = 0.62 if maskable else 0.78
    cx, cy = size / 2, size / 2
    w, h = size * scale, size * scale * 0.62

    # card body (slightly rotated look via two rects is complex; keep straight, clean)
    card_x0 = cx - w / 2
    card_y0 = cy - h / 2
    card_x1 = cx + w / 2
    card_y1 = cy + h / 2
    card_radius = h * 0.16
    d.rounded_rectangle([card_x0, card_y0, card_x1, card_y1], radius=card_radius, fill=CARD)

    # stripe near top of card
    stripe_y0 = card_y0 + h * 0.22
    stripe_y1 = card_y0 + h * 0.36
    d.rectangle([card_x0, stripe_y0, card_x1, stripe_y1], fill=STRIPE)

    # small lines (fake text) bottom of card
    line_h = h * 0.07
    line_y = card_y1 - h * 0.22
    d.rounded_rectangle([card_x0 + w * 0.08, line_y, card_x0 + w * 0.42, line_y + line_h],
                         radius=line_h / 2, fill=(203, 213, 225))

    # coin overlapping bottom-right corner
    coin_r = w * 0.20
    coin_cx = card_x1 - coin_r * 0.3
    coin_cy = card_y1 - coin_r * 0.1
    d.ellipse([coin_cx - coin_r, coin_cy - coin_r, coin_cx + coin_r, coin_cy + coin_r],
              fill=COIN, outline=COIN_EDGE, width=max(1, int(size * 0.008)))

    return img


def save(img, name):
    path = os.path.join(OUT, name)
    img.save(path)
    print("saved", path)


save(draw_icon(192), "icon-192.png")
save(draw_icon(512), "icon-512.png")
save(draw_icon(180), "apple-touch-icon.png")
save(draw_icon(32), "favicon-32.png")
save(draw_icon(512, maskable=True), "icon-512-maskable.png")
save(draw_icon(192, maskable=True), "icon-192-maskable.png")
