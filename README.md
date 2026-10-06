# Maldita Smash — Propuesta digital

Propuesta comercial interactiva para el desarrollo de la web y la plataforma digital de **Maldita Smash**.

**Ver online:** https://pedroibanez97.github.io/propuesta-malditasmash/
**Descargar en PDF:** [propuesta/Maldita-Smash-Propuesta.pdf](propuesta/Maldita-Smash-Propuesta.pdf)

---

## Qué contiene

- **La presentación** (30 páginas): la visión, la experiencia de compra, los tres planes (**START**, **BUSINESS** y **PRO**), los módulos de gestión, la tecnología, la inversión y la evolución de la plataforma.
- **El PDF** de la propuesta, en A4 horizontal, una página por sección.
- **Los recursos originales de la marca** (logo, mascota y fotografía de producto), que la presentación usa sin modificarlos.

## Ver la presentación

**Online:** abrir https://pedroibanez97.github.io/propuesta-malditasmash/

**En la computadora:** abrir `propuesta/index.html` con doble clic (no hace falta instalar nada).

Para moverse: flechas del teclado, rueda del mouse, los botones de la esquina inferior o el índice de capítulos de la barra superior. En el celular se recorre con scroll, como una página.

## Descargar o regenerar el PDF

- **Desde la presentación:** botón **“Descargar propuesta”** → *Guardar como PDF* (A4, horizontal, márgenes “Ninguno”). Se recomienda Chrome o Edge.
- **Desde la terminal** (requiere Node 22+ y Google Chrome):

  ```bash
  node propuesta/tools/export-pdf.mjs
  ```

  Actualiza `propuesta/Maldita-Smash-Propuesta.pdf`. Conviene regenerarlo después de cualquier cambio de texto.

## Publicación online (GitHub Pages)

El sitio se publica desde la rama `main`, carpeta raíz (`/`). El `index.html` de la raíz redirige a la presentación (`propuesta/`), así el link para compartir es:

https://pedroibanez97.github.io/propuesta-malditasmash/

Para actualizar la versión online alcanza con hacer *commit* y *push* a `main`: GitHub Pages la vuelve a publicar en uno o dos minutos.

## Estructura

```text
├── index.html                  # redirige a la presentación (GitHub Pages)
├── propuesta/
│   ├── index.html              # la presentación
│   ├── Maldita-Smash-Propuesta.pdf
│   ├── images/                 # imágenes optimizadas
│   ├── assets/fonts/           # tipografías
│   ├── styles/  scripts/       # diseño y comportamiento
│   ├── tools/                  # exportación a PDF y preparación de imágenes
│   └── README.md               # detalles técnicos y de personalización
└── *.jpg, *.webp               # recursos originales de la marca
```

Los detalles para editar textos, reemplazar imágenes o cambiar colores están en [propuesta/README.md](propuesta/README.md).
