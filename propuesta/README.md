# Maldita Smash — Propuesta digital

Presentación comercial interactiva (HTML/CSS/JS, sin frameworks ni dependencias) para proponer a **Maldita Smash** el desarrollo de su web y plataforma digital en tres niveles: **START**, **BUSINESS** y **PRO**.

- 30 páginas organizadas en 7 capítulos: Visión → Experiencia → Planes → Pro → Tecnología → Inversión → Evolución.
- Usa los recursos reales de la marca que están en la raíz del repositorio. **Los originales no se modifican.**
- Funciona como presentación en escritorio, se reorganiza como documento en celular/tablet y se exporta a PDF A4 apaisado (una página por sección).

---

## Estructura

```text
propuesta/
├── index.html                    # toda la presentación (30 secciones)
├── Maldita-Smash-Propuesta.pdf   # PDF ya exportado (regenerar tras editar)
├── assets/
│   └── fonts/                    # Anton, Archivo y Space Mono (woff2, licencia OFL)
├── images/                       # imágenes optimizadas derivadas de los originales
├── styles/
│   ├── fonts.css                 # @font-face locales
│   ├── main.css                  # tokens de marca, escenario, navegación, etiquetas, animaciones
│   ├── slides.css                # composición de cada página
│   ├── mockups.css               # celular, navegador, tablet e interfaces conceptuales
│   ├── responsive.css            # mobile y tablet vertical
│   └── print.css                 # exportación a PDF (A4 apaisado)
├── scripts/
│   └── main.js                   # navegación, progreso, revelado, contadores, exportación
└── tools/
    ├── export-pdf.mjs            # exporta el PDF con Chrome headless (Node 22+)
    ├── prepare_assets.py         # regenera /images desde los originales (Pillow)
    └── lift.swift                # recorte de sujeto con Apple Vision (macOS)
```

## Cómo abrirla

**Online:** https://pedroibanez97.github.io/propuesta-malditasmash/ (GitHub Pages, rama `main`, carpeta raíz; el `index.html` de la raíz del repositorio redirige a esta carpeta).

**Opción 1 — doble clic** en `propuesta/index.html`. Funciona sin servidor (no hace falta instalar nada).

**Opción 2 — servidor local** (recomendado para presentar):

```bash
cd propuesta
python3 -m http.server 8080      # o: npx serve .
# abrir http://localhost:8080
```

### Navegación

| Acción | Cómo |
| --- | --- |
| Siguiente / anterior | `→` `←`, `↓` `↑`, `Espacio`, `RePág`/`AvPág`, rueda o trackpad, botones de la esquina inferior |
| Primera / última página | `Inicio` / `Fin` |
| Ir a un capítulo | Barra superior (01 Visión … 07 Evolución); en celular, botón de menú |
| Abrir en una página puntual | Agregar el ancla a la URL: `index.html#s13` (PRO), `#s23` (Inversión) |

En celular y tablet vertical la presentación pasa a ser un documento con scroll libre: las grillas se apilan, la tipografía se agranda y los mockups se reacomodan.

## Exportar a PDF

**Desde la presentación:** botón **“Descargar propuesta”** (arriba a la derecha o en la última página). Abre el diálogo de impresión ya configurado:

- Destino: **Guardar como PDF**
- Tamaño: **A4**, orientación **horizontal** (se toma del CSS)
- Márgenes: **Ninguno**
- Si aparece la opción, activar **Gráficos de fondo**

Recomendado: Chrome o Edge (son los que mejor respetan tamaño de página y fondos).

**Desde la terminal** (resultado idéntico, sin diálogo):

```bash
cd propuesta
node tools/export-pdf.mjs                    # → Maldita-Smash-Propuesta.pdf
node tools/export-pdf.mjs ~/Desktop/propuesta.pdf
CHROME_PATH="/ruta/a/chrome" node tools/export-pdf.mjs   # si Chrome no está en la ruta habitual
```

Requiere Node 22 o superior y Chrome/Chromium/Edge instalado. El PDF pesa ~7 MB.

## Antes de enviarla

1. **Completar el contacto** (página 30). En `index.html`, buscar `[ Nombre / Estudio ]`, `[ Email ]`, `[ Teléfono ]` y `[ Web ]` y reemplazarlos.
2. Si se cambia algún texto, **regenerar el PDF** (`node tools/export-pdf.mjs`).

## Qué es real y qué es ilustrativo

- **Recursos de marca** (logo, mascota, fotografía de producto): reales, tomados de la raíz del repositorio.
- **Mockups** (home, menú, producto, carrito, cocina, delivery, CRM, stock, dashboard): son *conceptos* construidos en HTML/CSS y están marcados con las etiquetas **CONCEPTO**, **EJEMPLO VISUAL** o **DATOS ILUSTRATIVOS**.
- **Nombres de productos, precios en $ y métricas**: ejemplos visuales. Los precios de productos se muestran como `$ X.XXX` a propósito.
- **Planes, inversión, plazos y formas de pago**: contenido comercial oficial de la propuesta.

## Recursos e imágenes

Los archivos originales viven en la raíz del repositorio y no se tocan:

| Original | Uso en la propuesta |
| --- | --- |
| `logo-malditasmash.jpg` | `images/logo-original.jpg` y el isotipo recortado `images/logo-mark-*.webp` |
| `mascota-malditasmash.jpg` | escena `images/escena-rebelde.jpg` y recorte `images/mascota-rebelde.webp` |
| `mascota-maldita-smash.jpg` | escena `images/escena-paracaidas.jpg` y recorte `images/mascota-paracaidas.webp` |
| `burguer-malditasmash.webp` | foto `images/burger-foto.jpg` y recortes `images/burger-recorte*.webp` |

Las fotos opacas se guardan en JPEG a propósito: Chrome las incrusta en el PDF sin recomprimirlas (el PDF pesa varias veces menos que con WebP).

### Reemplazar un recurso

**Opción simple:** reemplazar el archivo dentro de `images/` por otro con **el mismo nombre** y proporción similar (los recortes deben ser PNG/WebP con fondo transparente).

**Opción automática** (regenera todo `images/` desde los originales):

```bash
cd propuesta
swiftc -O tools/lift.swift -o tools/lift   # una sola vez · macOS 14+ (recorte con Apple Vision)
python3 -m pip install Pillow              # si no está instalado
python3 tools/prepare_assets.py
```

Sin `tools/lift` (por ejemplo, en Linux o Windows) el script conserva los recortes existentes y separa el isotipo por color.

Para sumar imágenes nuevas (más productos, fotos del local), copiarlas a `images/` y referenciarlas desde `index.html`.

## Personalización rápida

- **Colores de marca:** variables en `styles/main.css` → `:root` (`--yellow`, `--red`, `--orange`, `--black`, `--cream`).
- **Textos:** todo está en `index.html`, una sección por página, comentada con su número (`01 · PORTADA`, `23 · INVERSIÓN`…).
- **Agregar o quitar páginas:** duplicar un `<section class="slide">` completo. El contador, la barra de progreso y la navegación se ajustan solos; si se agrega un capítulo, sumarlo también en `<nav class="chapters">`.
- **Modo estático:** `index.html?static` desactiva las animaciones y muestra todo (útil para capturas de pantalla).

## Notas técnicas

- **Escenario 16:10:** en escritorio cada página es un escenario 16:10 que escala con la ventana. Todas las medidas internas usan la unidad `--u` (1 % del ancho del escenario), así la composición es idéntica en una laptop, en un monitor grande y en la hoja A4 del PDF. En mobile `--u` toma un valor fijo y `responsive.css` reorganiza cada página.
- **Accesibilidad:** HTML semántico, textos alternativos, mockups descriptos con `role="img"`, navegación completa por teclado, foco visible y respeto de `prefers-reduced-motion`.
- **Rendimiento:** sin librerías externas; imágenes optimizadas (~800 KB en total) y tipografías locales (~220 KB), carga diferida y precarga en segundo plano para que el PDF salga completo.
- **Compatibilidad:** navegadores actuales (usa container queries y `:has()`). Verificada en Chrome en escritorio (1280–1920 px), tablet (1024 × 768 y 820 × 1180) y celular (390 px). La exportación a PDF está optimizada para Chrome/Edge.
