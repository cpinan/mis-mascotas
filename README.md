# Mis Mascotas — Memorial PWA

Sitio memorial estático para mascotas. Mobile-first, instalable como app (PWA), funciona offline y se despliega gratis en GitHub Pages.

**Ver sitio:** https://cpinan.github.io/mis-mascotas

> Si el sitio no carga tras activar Pages, esperar 2–5 minutos y verificar el estado en **Settings → Pages** del repositorio.

---

## Estructura del proyecto

```
index.html                   ← Estructura HTML (no editar para cambiar textos)
manifest.json                ← Configuración PWA
sw.js                        ← Service Worker (cache offline)
drive-to-imagenes.js         ← Script para importar fotos desde Google Drive
css/
  styles.css                 ← Todos los estilos: colores, layout, lightbox
js/
  app.js                     ← Toda la lógica: carga de datos, collage, tabs
icons/
  main.png                   ← Ícono de la app (favicon + PWA)
mascotas.json                ← Lista de mascotas + textos globales del sitio
mascotas/
  <NombreMascota>/
    config.json              ← Datos de la mascota (nombre, tributo, color…)
    imagenes.json            ← Lista de fotos (Drive o locales)
    imagenes/                ← Fotos locales (opcional)
```

**Regla clave:** el nombre de la carpeta en `mascotas/` debe coincidir exactamente con el string en el array de `mascotas.json`. Son case-sensitive. Sin espacios (usar guión bajo si es necesario).

---

## Mascotas actuales

| Nombre | Años | Color acento |
|--------|------|-------------|
| Miyoto | ? – 2026 | `#b07d4a` |

---

## Agregar una nueva mascota

### Paso 1 — Crear la carpeta

```bash
mkdir -p mascotas/NombreMascota/imagenes
```

### Paso 2 — Crear `mascotas/NombreMascota/config.json`

```json
{
  "nombre": "Nombre a mostrar en la UI",
  "emoji": "🐱",
  "avatar": "https://drive.google.com/file/d/FILE_ID/view?usp=drive_link",
  "años": "2010 – 2025",
  "badge": "Texto pequeño bajo el nombre",
  "tributo": "Párrafo de homenaje.\n\nUsar \\n para saltos de línea.",
  "color_acento": "#c9a96e"
}
```

| Campo | Descripción |
|-------|-------------|
| `nombre` | Nombre que aparece en la UI y en el tab |
| `emoji` | Fallback si el avatar no carga |
| `avatar` | URL de Drive o ruta local (`imagenes/avatar.jpg`) |
| `años` | Rango de vida, ej. `"2010 – 2025"` o `"2010 – presente"` |
| `badge` | Texto decorativo pequeño bajo el nombre |
| `tributo` | Texto de homenaje. Admite `\n` para saltos de línea. Las comillas `"` dentro del texto deben escaparse como `\"` |
| `color_acento` | Color CSS para el tab activo y el badge |

### Paso 3 — Crear `mascotas/NombreMascota/imagenes.json`

```json
{
  "fotos": [
    "https://drive.google.com/file/d/FILE_ID/view?usp=drive_link",
    "foto-local.jpg"
  ]
}
```

Las fotos de Drive deben estar compartidas como **"Cualquiera con el enlace"**.

**Layout del collage — ciclo de 14 posiciones:**
- Posiciones 1, 8 → celda alta (doble altura)
- Posiciones 4, 11 → celda ancha (doble ancho)
- Resto → celdas normales

### Paso 4 — Registrar en `mascotas.json`

Abrir `mascotas.json` en la raíz y agregar el nombre al array:

```json
{
  "sitio": { "..." },
  "mascotas": ["Miyoto", "NombreMascota"]
}
```

El orden del array = orden de los tabs en el sitio.

### Paso 5 — Publicar

```bash
git add mascotas/NombreMascota/ mascotas.json
git commit -m "Agregar mascota: NombreMascota"
git push
```

---

## Importar fotos desde Google Drive

### Opción A — Manual

1. Abrir la carpeta de Drive
2. Click derecho en cada foto → **Compartir** → **Cualquiera con el enlace** → copiar link
3. Pegar los links en `imagenes.json`

### Opción B — Script automático

Crear un archivo `links.txt` con un link por línea y ejecutar:

```bash
node drive-to-imagenes.js NombreMascota links.txt
```

El script extrae los IDs de Drive, actualiza `imagenes.json` y evita duplicados. Si ya había fotos, las conserva.

---

## Editar una mascota existente

| Qué cambiar | Dónde |
|-------------|-------|
| Nombre, años, badge, tributo, color | `mascotas/<Nombre>/config.json` |
| Foto de perfil (avatar) | Campo `avatar` en `config.json` |
| Agregar o quitar fotos de la galería | `mascotas/<Nombre>/imagenes.json` |
| Orden de los tabs | Array `mascotas` en `mascotas.json` |
| Título, subtítulo, pie de página | Objeto `sitio` en `mascotas.json` |

El campo `titulo` en `mascotas.json` admite `*palabra*` para cursiva dorada.

---

## Eliminar una mascota

```bash
rm -rf mascotas/NombreMascota/
```

Y quitar su nombre del array en `mascotas.json`.

---

## Publicar cualquier cambio

```bash
git add .
git commit -m "descripción del cambio"
git push
```

GitHub Pages se actualiza automáticamente en unos segundos.

---

## Desarrollo local

```bash
python3 -m http.server 8080
# → http://localhost:8080
```

El Service Worker requiere `localhost` o HTTPS para funcionar.

---

## Qué editar según lo que querés cambiar

| Quiero cambiar... | Archivo |
|-------------------|---------|
| Colores, fuentes, tamaños | `css/styles.css` |
| Lógica de la app | `js/app.js` |
| Estructura de la página | `index.html` |
| Ícono de la app / favicon | `icons/main.png` |
| Configuración PWA | `manifest.json` |

> Después de modificar `index.html`, `css/styles.css`, `js/app.js` o `sw.js`, incrementar `CACHE_VERSION` en `sw.js` para que los usuarios reciban la versión nueva.

---

## Notas técnicas

- Sin frameworks, sin build steps, sin `package.json` — todo vanilla HTML/CSS/JS
- Las fotos de Drive se sirven vía `lh3.googleusercontent.com` con `referrerpolicy="no-referrer"` para evitar bloqueos por el header `Referer`
- El Service Worker cachea el shell (HTML, CSS, JS, JSON) para uso offline; las fotos de Drive no se cachean
- El lightbox soporta swipe horizontal en móvil y navegación con flechas del teclado en desktop
- El slideshow avanza automáticamente con crossfade y efecto Ken Burns (paneo sutil sin zoom); se activa con el botón "▶ Presentación" sobre la galería
- Respeta `env(safe-area-inset-*)` para el notch e indicador de inicio en iPhone
