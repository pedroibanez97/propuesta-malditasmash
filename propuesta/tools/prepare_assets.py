"""
Genera las imágenes optimizadas de la propuesta a partir de los recursos
originales de Maldita Smash (que viven en la raíz del repositorio y NO se modifican).

Uso (desde /propuesta):
    swiftc -O tools/lift.swift -o tools/lift      # sólo la primera vez (macOS 14+)
    python3 tools/prepare_assets.py

Requiere Pillow. Los recortes de mascota/hamburguesa usan el recorte de sujeto
de Apple Vision (tools/lift). Si no está disponible, se reutilizan los recortes
existentes en /images.
"""
import os
import shutil
import subprocess
import tempfile
from PIL import Image, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))       # repo
OUT = os.path.abspath(os.path.join(HERE, "..", "images"))
LIFT = os.path.join(HERE, "lift")

SRC = {
    "logo": os.path.join(ROOT, "logo-malditasmash.jpg"),
    "mascota_rebelde": os.path.join(ROOT, "mascota-malditasmash.jpg"),
    "mascota_paracaidas": os.path.join(ROOT, "mascota-maldita-smash.jpg"),
    "burger": os.path.join(ROOT, "burguer-malditasmash.webp"),
}


def save_webp(im, name, q=84):
    path = os.path.join(OUT, name)
    im.save(path, "WEBP", quality=q, method=6)
    print("  ->", name, im.size, os.path.getsize(path) // 1024, "KB")


def save_jpg(im, name, q=84):
    path = os.path.join(OUT, name)
    im.save(path, "JPEG", quality=q, optimize=True, progressive=True)
    print("  ->", name, im.size, os.path.getsize(path) // 1024, "KB")


def lift(src, pad=12):
    """Recorta el sujeto principal con Apple Vision y lo ajusta a su bounding box."""
    if not os.path.exists(LIFT):
        return None
    tmp = tempfile.mktemp(suffix=".png")
    subprocess.run([LIFT, src, tmp, "all"], check=True, capture_output=True)
    im = Image.open(tmp).convert("RGBA")
    os.remove(tmp)
    l, t, r, b = im.getchannel("A").point(lambda a: 255 if a > 8 else 0).getbbox()
    return im.crop((max(l - pad, 0), max(t - pad, 0), min(r + pad, im.width), min(b + pad, im.height)))


def logo_mark():
    """Isotipo (M roja) sin fondo: recorte con Vision si está disponible, si no por croma."""
    src = Image.open(SRC["logo"]).convert("RGB")
    lifted = lift(SRC["logo"], pad=6)
    if lifted is not None:
        out = lifted
    else:
        px = src.load()
        out = Image.new("RGBA", src.size)
        op = out.load()
        for y in range(src.height):
            for x in range(src.width):
                r, g, b = px[x, y]
                a = max(0.0, min(1.0, (0.46 - g / max(r, 1)) / 0.12))
                if a > 0:
                    op[x, y] = (r, g, b, int(a * 255))
        out = out.crop(out.getchannel("A").getbbox())
    # quita el halo amarillo de los bordes semitransparentes
    px = out.load()
    for y in range(out.height):
        for x in range(out.width):
            r, g, b, a = px[x, y]
            if 0 < a < 250 or g > r * 0.45:
                px[x, y] = (r, min(g, int(r * 0.3)), min(b, 20), a)
    # variante amarilla (misma luz 3D) para fondos rojos
    alpha = out.getchannel("A")
    shade = out.getchannel("R").point(lambda v: min(1.0, v / 235) * 255)
    yellow = Image.merge("RGBA", (
        shade.point(lambda v: int(min(255, v * 1.02 + 6))),
        shade.point(lambda v: int(v * 0.78)),
        shade.point(lambda v: int(v * 0.05)),
        alpha,
    ))
    return out, yellow


def main():
    os.makedirs(OUT, exist_ok=True)
    print("Logo")
    shutil.copy(SRC["logo"], os.path.join(OUT, "logo-original.jpg"))
    red, yellow = logo_mark()
    red.thumbnail((720, 720), Image.LANCZOS)
    yellow.thumbnail((720, 720), Image.LANCZOS)
    save_webp(red, "logo-mark-red.webp", 90)
    save_webp(yellow, "logo-mark-yellow.webp", 90)
    small = red.copy()
    small.thumbnail((240, 240), Image.LANCZOS)
    save_webp(small, "logo-mark-red-sm.webp", 90)  # usos chicos (barras, mockups)
    fav = red.copy()
    fav.thumbnail((128, 128), Image.LANCZOS)
    fav.save(os.path.join(OUT, "favicon.png"))

    print("Escenas de mascota y producto (JPEG: Chrome los incrusta sin recomprimir en el PDF)")
    save_jpg(Image.open(SRC["mascota_rebelde"]).convert("RGB"), "escena-rebelde.jpg")
    save_jpg(Image.open(SRC["mascota_paracaidas"]).convert("RGB"), "escena-paracaidas.jpg")
    save_jpg(Image.open(SRC["burger"]).convert("RGB"), "burger-foto.jpg")

    print("Recortes (Apple Vision)")
    for key, name in (("mascota_rebelde", "mascota-rebelde.webp"),
                      ("mascota_paracaidas", "mascota-paracaidas.webp"),
                      ("burger", "burger-recorte.webp")):
        cut = lift(SRC[key])
        if cut is None:
            print("  (sin tools/lift: se conserva", name, ")")
            continue
        save_webp(cut, name, 88)
        if name == "burger-recorte.webp":  # miniaturas de los mockups
            sm = cut.copy()
            sm.thumbnail((320, 320), Image.LANCZOS)
            save_webp(sm, "burger-recorte-sm.webp", 86)


if __name__ == "__main__":
    main()
