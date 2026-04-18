#!/usr/bin/env node
/**
 * agregar-mascota.js
 *
 * Crea la estructura completa para una nueva mascota y la registra
 * en mascotas.json. Opcionalmente importa fotos desde Google Drive
 * usando la misma lógica de drive-to-imagenes.js.
 *
 * ─── USO ────────────────────────────────────────────────────────────────────
 *
 *   node agregar-mascota.js <NombreCarpeta> [opciones]
 *
 * El <NombreCarpeta> debe ser único, sin espacios (usar guión_bajo si es
 * necesario) y coincidir exactamente con lo que aparecerá en los tabs.
 *
 * ─── OPCIONES ───────────────────────────────────────────────────────────────
 *
 *   --nombre    "Nombre a mostrar"   Nombre visible en la UI (default: NombreCarpeta)
 *   --emoji     "🐶"                 Emoji de fallback si el avatar no carga
 *   --años      "2018 – 2024"        Rango de vida
 *   --badge     "Texto del badge"    Texto decorativo bajo el nombre
 *   --tributo   "Texto de homenaje"  Puede contener \n para saltos de línea
 *   --avatar    "URL o ruta"         URL de Drive o ruta local (ej: imagenes/avatar.jpg)
 *   --color     "#c9a96e"            Color de acento CSS
 *   --fotos     archivo.txt          Archivo con links de Drive (uno por línea)
 *   --posicion  2                    Posición en los tabs (default: al final)
 *
 * ─── EJEMPLOS ───────────────────────────────────────────────────────────────
 *
 *   # Mínimo — solo crea la carpeta y registra la mascota
 *   node agregar-mascota.js Luna
 *
 *   # Con datos completos
 *   node agregar-mascota.js Luna \
 *     --nombre "Luna" \
 *     --emoji "🐱" \
 *     --años "2018 – 2025" \
 *     --badge "La más independiente" \
 *     --tributo "Luna llegó un día de lluvia y nunca se fue." \
 *     --avatar "https://drive.google.com/file/d/1ABC.../view?usp=sharing" \
 *     --color "#7a9ec2" \
 *     --fotos links-luna.txt
 *
 *   # Insertar en la segunda posición de los tabs
 *   node agregar-mascota.js Luna --posicion 2
 *
 * ─── NOTAS ──────────────────────────────────────────────────────────────────
 *
 *   - Si la carpeta ya existe, el script se detiene sin modificar nada.
 *   - Las fotos se procesan con la misma lógica de drive-to-imagenes.js.
 *   - Todos los campos son opcionales: se pueden editar después en
 *     mascotas/<Nombre>/config.json e imagenes.json.
 */

'use strict';

const fs   = require('fs');
const path = require('path');

// ── Reutilizar lógica de drive-to-imagenes.js ────────────────────────────────

const DRIVE_FILE_PATTERN = /https:\/\/drive\.google\.com\/file\/d\/[^/\s"]+\/view[^\s"]*/g;

function extractDriveLinks(text) {
  return [...text.matchAll(DRIVE_FILE_PATTERN)].map(m => m[0]);
}

// ── Parseo de argumentos ─────────────────────────────────────────────────────

function parseArgs(argv) {
  const args = argv.slice(2);

  if (!args.length || args[0].startsWith('--')) {
    printUsageAndExit();
  }

  const result = { carpeta: args[0] };

  for (let i = 1; i < args.length; i++) {
    const flag = args[i];
    const value = args[i + 1];

    if (!flag.startsWith('--') || value === undefined) continue;

    switch (flag) {
      case '--nombre':   result.nombre   = value; i++; break;
      case '--emoji':    result.emoji    = value; i++; break;
      case '--años':     result.años     = value; i++; break;
      case '--badge':    result.badge    = value; i++; break;
      case '--tributo':  result.tributo  = value; i++; break;
      case '--avatar':   result.avatar   = value; i++; break;
      case '--color':    result.color    = value; i++; break;
      case '--fotos':    result.fotos    = value; i++; break;
      case '--posicion': result.posicion = parseInt(value, 10); i++; break;
      default:
        console.warn(`Opción desconocida ignorada: ${flag}`);
    }
  }

  return result;
}

function printUsageAndExit() {
  console.error('Uso: node agregar-mascota.js <NombreCarpeta> [--nombre "..."] [--emoji "🐱"] [--años "2018–2025"] [--badge "..."] [--tributo "..."] [--avatar "url"] [--color "#hex"] [--fotos archivo.txt] [--posicion N]');
  process.exit(1);
}

// ── Creación de archivos ─────────────────────────────────────────────────────

function crearEstructura(opts) {
  const carpeta    = opts.carpeta;
  const mascotaDir = path.join('mascotas', carpeta);
  const imagenesDir = path.join(mascotaDir, 'imagenes');

  // Verificar que no exista ya
  if (fs.existsSync(mascotaDir)) {
    console.error(`Error: la carpeta "${mascotaDir}" ya existe. Edita los archivos directamente.`);
    process.exit(1);
  }

  // Verificar que mascotas.json exista (estamos en el directorio correcto)
  if (!fs.existsSync('mascotas.json')) {
    console.error('Error: no se encuentra mascotas.json. Ejecuta el script desde la raíz del proyecto.');
    process.exit(1);
  }

  // Crear carpetas
  fs.mkdirSync(imagenesDir, { recursive: true });
  console.log(`✓ Carpeta creada: ${imagenesDir}`);

  // Crear config.json
  const config = {
    nombre:       opts.nombre  || carpeta,
    emoji:        opts.emoji   || '🐾',
    avatar:       opts.avatar  || 'imagenes/avatar.jpg',
    años:         opts.años    || '????  – ????',
    badge:        opts.badge   || '',
    tributo:      opts.tributo || '',
    color_acento: opts.color   || '#c9a96e',
  };

  fs.writeFileSync(
    path.join(mascotaDir, 'config.json'),
    JSON.stringify(config, null, 2) + '\n'
  );
  console.log(`✓ config.json creado`);

  // Crear imagenes.json (vacío o con fotos de Drive)
  let fotos = [];

  if (opts.fotos) {
    if (!fs.existsSync(opts.fotos)) {
      console.error(`Error: no se encuentra el archivo de fotos "${opts.fotos}"`);
      process.exit(1);
    }
    const contenido = fs.readFileSync(opts.fotos, 'utf8');
    fotos = extractDriveLinks(contenido);

    if (!fotos.length) {
      console.warn(`Advertencia: no se encontraron links de Drive válidos en "${opts.fotos}"`);
    } else {
      console.log(`✓ ${fotos.length} foto(s) importada(s) desde ${opts.fotos}`);
    }
  }

  fs.writeFileSync(
    path.join(mascotaDir, 'imagenes.json'),
    JSON.stringify({ fotos }, null, 2) + '\n'
  );
  console.log(`✓ imagenes.json creado`);

  return mascotaDir;
}

// ── Registro en mascotas.json ────────────────────────────────────────────────

function registrarEnMascotasJson(carpeta, posicion) {
  const data = JSON.parse(fs.readFileSync('mascotas.json', 'utf8'));

  if (data.mascotas.includes(carpeta)) {
    console.warn(`Advertencia: "${carpeta}" ya estaba en mascotas.json — no se agregó de nuevo.`);
    return;
  }

  if (posicion !== undefined && posicion >= 1 && posicion <= data.mascotas.length + 1) {
    data.mascotas.splice(posicion - 1, 0, carpeta);
    console.log(`✓ Registrada en mascotas.json en la posición ${posicion}`);
  } else {
    data.mascotas.push(carpeta);
    console.log(`✓ Registrada en mascotas.json (última posición)`);
  }

  fs.writeFileSync('mascotas.json', JSON.stringify(data, null, 2) + '\n');
}

// ── Resumen final ────────────────────────────────────────────────────────────

function imprimirResumen(opts) {
  const carpeta = opts.carpeta;
  console.log('');
  console.log('─── Listo ───────────────────────────────────────────────────');
  console.log(`  Mascota:  ${opts.nombre || carpeta}`);
  console.log(`  Carpeta:  mascotas/${carpeta}/`);
  console.log('');
  console.log('  Próximos pasos:');

  if (!opts.avatar || opts.avatar === 'imagenes/avatar.jpg') {
    console.log(`  1. Copia la foto de perfil a mascotas/${carpeta}/imagenes/avatar.jpg`);
  }
  if (!opts.tributo) {
    console.log(`  2. Edita el tributo en mascotas/${carpeta}/config.json`);
  }
  if (!opts.fotos) {
    console.log(`  3. Agrega fotos en mascotas/${carpeta}/imagenes.json`);
    console.log(`     (o usa: node drive-to-imagenes.js ${carpeta} links.txt)`);
  }

  console.log('');
  console.log('  Para publicar:');
  console.log(`  git add mascotas/${carpeta}/ mascotas.json`);
  console.log(`  git commit -m "Agregar mascota: ${carpeta}"`);
  console.log('  git push');
  console.log('─────────────────────────────────────────────────────────────');
}

// ── Main ─────────────────────────────────────────────────────────────────────

function main() {
  const opts = parseArgs(process.argv);

  crearEstructura(opts);
  registrarEnMascotasJson(opts.carpeta, opts.posicion);
  imprimirResumen(opts);
}

main();
