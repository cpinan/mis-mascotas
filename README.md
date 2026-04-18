# Mis Mascotas — Memorial PWA

Sitio memorial estático para mascotas. Mobile-first, instalable como app (PWA), funciona offline y se despliega gratis en GitHub Pages.

**Ver sitio:** https://cpinan.github.io/mis-mascotas

> Si el sitio no carga, GitHub Pages puede tardar hasta 5 minutos la primera vez.
> Verificar estado en: **Settings → Pages** del repositorio.

---

## Estructura del proyecto

```
index.html                   ← App shell (no editar para cambiar textos)
manifest.json                ← Configuración PWA
sw.js                        ← Service Worker (cache offline)
drive-to-imagenes.js         ← Script para importar fotos desde Google Drive
icons/
  main.png                   ← Ícono de la app (favicon + PWA)
mascotas.json                ← Lista de mascotas + textos globales del sitio
mascotas/
  <NombreMascota>/
    config.json              ← Datos de la mascota
    imagenes.json            ← Lista de fotos
    imagenes/                ← Fotos locales (opcional)
```

---

## Mascotas actuales

| Nombre | Años | Color |
|--------|------|-------|
| Miyoto | ? – 2026 | `#b07d4a` |

---

## Cómo agregar una mascota

### 1. Crear la carpeta

```bash
mkdir -p mascotas/NombreMascota/imagenes
```

> El nombre de la carpeta debe coincidir exactamente con el string en `mascotas.json`. Sin espacios (usar guión bajo si es necesario).

### 2. Crear `mascotas/NombreMascota/config.json`

```json
{
  "nombre": "Nombre a mostrar",
  "emoji": "🐱",
  "avatar": "https://drive.google.com/file/d/FILE_ID/view?usp=drive_link",
  "años": "2010 – 2025",
  "badge": "Texto pequeño bajo el nombre",
  "tributo": "Párrafo de homenaje.\n\nPuede tener saltos de línea con \\n.",
  "color_acento": "#c9a96e"
}
```

**Notas:**
- `avatar` puede ser una URL de Google Drive o una ruta local como `imagenes/avatar.jpg`
- Las comillas `"` dentro del tributo deben escaparse como `\"`
- `color_acento` afecta el subrayado del tab y el badge

### 3. Crear `mascotas/NombreMascota/imagenes.json`

```json
{
  "fotos": [
    "https://drive.google.com/file/d/FILE_ID/view?usp=drive_link",
    "foto-local.jpg"
  ]
}
```

**Layout del collage:**
- Foto 0 → celda alta (doble altura)
- Foto 3 → celda ancha (doble ancho)
- Resto → celdas normales

### 4. Registrar en `mascotas.json`

```json
{
  "sitio": { ... },
  "mascotas": ["Miyoto", "NombreMascota"]
}
```

El orden del array determina el orden de los tabs.

---

## Agregar fotos desde Google Drive

Las fotos deben estar compartidas como **"Cualquiera con el enlace"**.

### Opción A — manual
Copiar el link de compartir de cada foto y pegarlo en `imagenes.json`.

### Opción B — con el script

Crear un archivo `links.txt` con un link por línea y ejecutar:

```bash
node drive-to-imagenes.js NombreMascota links.txt
```

El script detecta automáticamente los links de Drive, los agrega a `imagenes.json` y evita duplicados.

---

## Editar textos globales del sitio

Editar `mascotas.json`:

```json
{
  "sitio": {
    "titulo": "Mis *Compañeros* de Vida",
    "subtitulo": "Cada uno dejó su huella en mi corazón.",
    "pie_de_pagina": "Con amor eterno — cada despedida es también un gracias."
  }
}
```

El campo `titulo` admite `*palabra*` para cursiva dorada.

---

## Eliminar una mascota

```bash
rm -rf mascotas/NombreMascota/
```

Y quitar su nombre del array en `mascotas.json`.

---

## Publicar cambios

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

## Notas técnicas

- Sin frameworks, sin build steps, sin `package.json`
- Las fotos de Google Drive se sirven vía `lh3.googleusercontent.com` con `referrerpolicy="no-referrer"` para evitar bloqueos
- El Service Worker cachea el shell offline; las fotos de Drive no se cachean
- Soporta swipe horizontal en el lightbox (móvil) y flechas de teclado (desktop)
- Respeta safe areas (`env(safe-area-inset-*)`) para notch e indicador de inicio en iPhone
- Para forzar que los usuarios reciban cambios en `index.html` o `sw.js`, incrementar `CACHE_VERSION` en `sw.js`
