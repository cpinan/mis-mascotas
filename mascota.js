#!/usr/bin/env node
/**
 * mascota.js — CLI unificado para gestionar mascotas memorias
 *
 * ─── COMANDOS ────────────────────────────────────────────────────────────────
 *
 *   node mascota.js entrevistar
 *       Entrevista interactiva paso a paso. Hace preguntas sobre el animal
 *       y compone el tributo automáticamente. Recomendado para nuevas mascotas.
 *
 *   node mascota.js agregar <NombreCarpeta> [opciones]
 *       Crea la estructura directamente con argumentos. Útil para scripting.
 *       Opciones: --nombre --emoji --años --badge --tributo --avatar
 *                 --color --fotos <archivo.txt> --posicion <N>
 *
 *   node mascota.js fotos <NombreCarpeta> <archivo.txt>
 *   node mascota.js fotos <NombreCarpeta> --links "url1" "url2" ...
 *       Importa fotos de Google Drive a imagenes.json. Evita duplicados.
 *
 *   node mascota.js listar
 *       Muestra todas las mascotas registradas con sus datos principales.
 *
 * ─── EJEMPLOS ────────────────────────────────────────────────────────────────
 *
 *   node mascota.js entrevistar
 *
 *   node mascota.js agregar Luna --nombre "Luna" --emoji "🐱" \
 *     --años "2018 – 2025" --color "#7a9ec2" --fotos links-luna.txt
 *
 *   node mascota.js fotos Miyoto links-nuevas.txt
 *
 *   node mascota.js listar
 */

'use strict';

const fs       = require('fs');
const path     = require('path');
const readline = require('readline');

// ── Constantes ────────────────────────────────────────────────────────────────

const DRIVE_PATTERN = /https:\/\/drive\.google\.com\/file\/d\/[^/\s"]+\/view[^\s"]*/g;

// ── Utilidades generales ──────────────────────────────────────────────────────

function extractDriveLinks(text) {
  return [...text.matchAll(DRIVE_PATTERN)].map(m => m[0]);
}

function nombreACarpeta(nombre) {
  return nombre.trim().replace(/\s+/g, '_');
}

function verificarRaiz() {
  if (!fs.existsSync('mascotas.json')) {
    console.error('Error: ejecuta el script desde la raíz del proyecto.');
    process.exit(1);
  }
}

function leerMascotasJson() {
  return JSON.parse(fs.readFileSync('mascotas.json', 'utf8'));
}

function guardarMascotasJson(data) {
  fs.writeFileSync('mascotas.json', JSON.stringify(data, null, 2) + '\n');
}

function crearEstructura(config, carpeta) {
  const mascotaDir  = path.join('mascotas', carpeta);
  const imagenesDir = path.join(mascotaDir, 'imagenes');

  if (fs.existsSync(mascotaDir)) {
    console.error(`Error: la carpeta "${mascotaDir}" ya existe.`);
    process.exit(1);
  }

  fs.mkdirSync(imagenesDir, { recursive: true });
  fs.writeFileSync(path.join(mascotaDir, 'config.json'),   JSON.stringify(config,        null, 2) + '\n');
  fs.writeFileSync(path.join(mascotaDir, 'imagenes.json'), JSON.stringify({ fotos: [] }, null, 2) + '\n');

  console.log(`✓ Carpeta creada:  mascotas/${carpeta}/`);
  console.log(`✓ config.json      generado`);
  console.log(`✓ imagenes.json    generado`);
}

function registrarMascota(carpeta, posicion) {
  const data = leerMascotasJson();
  if (data.mascotas.includes(carpeta)) {
    console.warn(`Aviso: "${carpeta}" ya estaba en mascotas.json.`);
    return;
  }
  if (posicion >= 1 && posicion <= data.mascotas.length + 1) {
    data.mascotas.splice(posicion - 1, 0, carpeta);
    console.log(`✓ Registrada en mascotas.json (posición ${posicion})`);
  } else {
    data.mascotas.push(carpeta);
    console.log(`✓ Registrada en mascotas.json`);
  }
  guardarMascotasJson(data);
}

function imprimirProximosPasos(carpeta) {
  console.log('');
  console.log('── Próximos pasos ───────────────────────────────────────');
  console.log(`  1. Copia el avatar a mascotas/${carpeta}/imagenes/avatar.jpg`);
  console.log(`  2. Agrega fotos:`);
  console.log(`     node mascota.js fotos ${carpeta} links.txt`);
  console.log(`  3. Publica:`);
  console.log(`     git add mascotas/${carpeta}/ mascotas.json`);
  console.log(`     git commit -m "Agregar mascota: ${carpeta}"`);
  console.log(`     git push`);
  console.log('─────────────────────────────────────────────────────────');
}

// ── Readline helpers ──────────────────────────────────────────────────────────

function crearRL() {
  return readline.createInterface({ input: process.stdin, output: process.stdout });
}

function preguntar(rl, texto, defecto = '') {
  const sufijo = defecto ? ` [${defecto}]` : '';
  return new Promise((resolve) => {
    rl.question(`${texto}${sufijo}: `, (r) => resolve(r.trim() || defecto));
  });
}

async function preguntarSiNo(rl, texto, defecto = 's') {
  const opciones = defecto === 's' ? '[S/n]' : '[s/N]';
  const r = await preguntar(rl, `${texto} ${opciones}`);
  return r.toLowerCase() === 's' || (defecto === 's' && r.toLowerCase() !== 'n');
}

function seccion(titulo = '') {
  console.log('');
  if (titulo) console.log(`── ${titulo} ${'─'.repeat(Math.max(0, 52 - titulo.length))}`);
  else        console.log('─'.repeat(55));
}

// ── Constructor del tributo ───────────────────────────────────────────────────

function componerTributo(datos) {
  const parrafos = [];

  let p1 = '';
  if (datos.nombreOficial && datos.nombreOficial !== datos.nombre) {
    p1 = `Tu nombre era ${datos.nombreOficial}, pero todos te conocimos como ${datos.nombre}`;
    p1 += datos.comoLlego ? `. ${datos.comoLlego}` : ' — y así te quedaste.';
  } else if (datos.comoLlego) {
    p1 = datos.comoLlego;
  }
  if (p1) parrafos.push(p1);

  const p2 = [datos.personalidad, datos.mania].filter(Boolean).join(' ');
  if (p2) parrafos.push(p2);

  if (datos.extranas) parrafos.push(datos.extranas);

  parrafos.push(datos.mensaje || `Gracias por todo, ${datos.nombre}.`);

  return parrafos.join('\n\n');
}

// ── Comando: entrevistar ──────────────────────────────────────────────────────

async function cmdEntrevistar() {
  verificarRaiz();

  const rl = crearRL();

  console.log('');
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║       Perfil de mascota — entrevista interactiva       ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  console.log('  Responde las preguntas. Enter para dejar en blanco.');

  const datos = {};

  seccion('Datos básicos');
  datos.nombre = await preguntar(rl, '¿Cómo se llama la mascota?');
  if (!datos.nombre) { console.error('El nombre es obligatorio.'); rl.close(); process.exit(1); }

  datos.carpeta = await preguntar(rl, 'Nombre de la carpeta (sin espacios)', nombreACarpeta(datos.nombre));
  datos.emoji   = await preguntar(rl, '¿Qué emoji la representa?', '🐾');

  if (await preguntarSiNo(rl, '¿Tenía un nombre oficial diferente al apodo?', 'n')) {
    datos.nombreOficial = await preguntar(rl, '¿Cuál era su nombre oficial?');
  }

  seccion('Fechas');
  const anoNac = await preguntar(rl, '¿En qué año nació?');
  const anoFal = await preguntar(rl, '¿En qué año falleció?');
  datos.años = `${anoNac || '????'} – ${anoFal || '????'}`;

  seccion('Apariencia en el sitio');
  datos.badge = await preguntar(rl, 'Badge (texto pequeño bajo el nombre)');
  datos.color = await preguntar(rl, 'Color de acento (hex CSS)', '#c9a96e');

  seccion('Tributo — cuéntanos sobre su vida');
  console.log('  Estas respuestas componen el texto del tributo automáticamente.\n');
  datos.comoLlego    = await preguntar(rl, '¿Cómo llegó a tu vida?');
  datos.personalidad = await preguntar(rl, '¿Cómo era su personalidad?');
  datos.mania        = await preguntar(rl, '¿Cuál era su manía o costumbre más característica?');
  datos.extranas     = await preguntar(rl, '¿Qué es lo que más extrañas de él/ella?');
  datos.mensaje      = await preguntar(rl, '¿Qué mensaje le darías?');

  const config = {
    nombre:       datos.nombre,
    emoji:        datos.emoji,
    avatar:       'imagenes/avatar.jpg',
    años:         datos.años,
    badge:        datos.badge,
    tributo:      componerTributo(datos),
    color_acento: datos.color,
  };

  seccion('Vista previa');
  console.log(JSON.stringify(config, null, 2));
  if (config.tributo) {
    console.log('\n── Tributo ──────────────────────────────────────────────');
    console.log(config.tributo);
    console.log('─────────────────────────────────────────────────────────');
  }

  if (!await preguntarSiNo(rl, '\n¿Crear la mascota con estos datos?')) {
    console.log('\nCancelado.');
    rl.close();
    return;
  }

  crearEstructura(config, datos.carpeta);
  registrarMascota(datos.carpeta);
  imprimirProximosPasos(datos.carpeta);
  rl.close();
}

// ── Comando: agregar ──────────────────────────────────────────────────────────

function cmdAgregar(args) {
  verificarRaiz();

  if (!args.length || args[0].startsWith('--')) {
    console.error('Uso: node mascota.js agregar <NombreCarpeta> [--nombre ...] [--emoji ...] [--años ...] [--badge ...] [--tributo ...] [--avatar ...] [--color ...] [--fotos archivo.txt] [--posicion N]');
    process.exit(1);
  }

  const carpeta = args[0];
  const opts    = { posicion: Infinity };

  for (let i = 1; i < args.length; i++) {
    const flag = args[i], val = args[i + 1];
    if (!flag.startsWith('--') || val === undefined) continue;
    switch (flag) {
      case '--nombre':   opts.nombre   = val; i++; break;
      case '--emoji':    opts.emoji    = val; i++; break;
      case '--años':     opts.años     = val; i++; break;
      case '--badge':    opts.badge    = val; i++; break;
      case '--tributo':  opts.tributo  = val; i++; break;
      case '--avatar':   opts.avatar   = val; i++; break;
      case '--color':    opts.color    = val; i++; break;
      case '--fotos':    opts.fotos    = val; i++; break;
      case '--posicion': opts.posicion = parseInt(val, 10); i++; break;
      default: console.warn(`Opción desconocida: ${flag}`);
    }
  }

  let fotos = [];
  if (opts.fotos) {
    if (!fs.existsSync(opts.fotos)) {
      console.error(`Error: no se encuentra "${opts.fotos}"`);
      process.exit(1);
    }
    fotos = extractDriveLinks(fs.readFileSync(opts.fotos, 'utf8'));
    console.log(`✓ ${fotos.length} foto(s) importada(s) desde ${opts.fotos}`);
  }

  const config = {
    nombre:       opts.nombre  || carpeta,
    emoji:        opts.emoji   || '🐾',
    avatar:       opts.avatar  || 'imagenes/avatar.jpg',
    años:         opts.años    || '???? – ????',
    badge:        opts.badge   || '',
    tributo:      opts.tributo || '',
    color_acento: opts.color   || '#c9a96e',
  };

  const mascotaDir = path.join('mascotas', carpeta);
  if (fs.existsSync(mascotaDir)) {
    console.error(`Error: la carpeta "${mascotaDir}" ya existe.`);
    process.exit(1);
  }

  fs.mkdirSync(path.join(mascotaDir, 'imagenes'), { recursive: true });
  fs.writeFileSync(path.join(mascotaDir, 'config.json'),   JSON.stringify(config,         null, 2) + '\n');
  fs.writeFileSync(path.join(mascotaDir, 'imagenes.json'), JSON.stringify({ fotos },      null, 2) + '\n');
  console.log(`✓ Carpeta creada: mascotas/${carpeta}/`);

  registrarMascota(carpeta, opts.posicion);
  imprimirProximosPasos(carpeta);
}

// ── Comando: fotos ────────────────────────────────────────────────────────────

function cmdFotos(args) {
  verificarRaiz();

  if (args.length < 2) {
    console.error('Uso: node mascota.js fotos <NombreCarpeta> <archivo.txt>');
    console.error('  o: node mascota.js fotos <NombreCarpeta> --links "url1" "url2" ...');
    process.exit(1);
  }

  const carpeta     = args[0];
  const mascotaDir  = path.join('mascotas', carpeta);
  const outputPath  = path.join(mascotaDir, 'imagenes.json');

  if (!fs.existsSync(mascotaDir)) {
    console.error(`Error: no existe la carpeta mascotas/${carpeta}/`);
    process.exit(1);
  }

  let nuevos = [];
  if (args[1] === '--links') {
    nuevos = extractDriveLinks(args.slice(2).join('\n'));
  } else {
    if (!fs.existsSync(args[1])) {
      console.error(`Error: no se encuentra "${args[1]}"`);
      process.exit(1);
    }
    nuevos = extractDriveLinks(fs.readFileSync(args[1], 'utf8'));
  }

  if (!nuevos.length) {
    console.error('No se encontraron links de Drive válidos.');
    process.exit(1);
  }

  let existentes = [];
  if (fs.existsSync(outputPath)) {
    try { existentes = JSON.parse(fs.readFileSync(outputPath, 'utf8')).fotos || []; } catch { /* ok */ }
  }

  const combinados = [...new Set([...existentes, ...nuevos])];
  const agregados  = combinados.length - existentes.length;

  fs.writeFileSync(outputPath, JSON.stringify({ fotos: combinados }, null, 2) + '\n');
  console.log(`✓ ${outputPath} actualizado`);
  console.log(`  ${agregados} foto(s) nueva(s) — total: ${combinados.length}`);
}

// ── Comando: listar ───────────────────────────────────────────────────────────

function cmdListar() {
  verificarRaiz();

  const data = leerMascotasJson();
  const mascotas = data.mascotas || [];

  if (!mascotas.length) {
    console.log('No hay mascotas registradas en mascotas.json.');
    return;
  }

  console.log('');
  console.log(`Mascotas registradas (${mascotas.length}):`);
  console.log('');

  mascotas.forEach((nombre, i) => {
    const configPath = path.join('mascotas', nombre, 'config.json');
    const imgsPath   = path.join('mascotas', nombre, 'imagenes.json');

    let años   = '—';
    let badge  = '';
    let nFotos = 0;

    if (fs.existsSync(configPath)) {
      try {
        const cfg = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        años  = cfg.años  || '—';
        badge = cfg.badge || '';
      } catch { /* ok */ }
    }
    if (fs.existsSync(imgsPath)) {
      try { nFotos = (JSON.parse(fs.readFileSync(imgsPath, 'utf8')).fotos || []).length; } catch { /* ok */ }
    }

    console.log(`  ${i + 1}. ${nombre}`);
    console.log(`     Años: ${años}${badge ? `  ·  ${badge}` : ''}`);
    console.log(`     Fotos: ${nFotos}  ·  mascotas/${nombre}/`);
    console.log('');
  });
}

// ── Ayuda ─────────────────────────────────────────────────────────────────────

function cmdAyuda() {
  console.log(`
mascota.js — CLI para gestionar mascotas memorias

COMANDOS:
  node mascota.js entrevistar
      Entrevista interactiva para crear el perfil completo de una mascota.
      Compone el tributo automáticamente a partir de tus respuestas.

  node mascota.js agregar <NombreCarpeta> [opciones]
      Crea la estructura directamente con argumentos.
      --nombre   "Nombre a mostrar"
      --emoji    "🐱"
      --años     "2018 – 2025"
      --badge    "Texto del badge"
      --tributo  "Texto de homenaje"
      --avatar   "URL o imagenes/avatar.jpg"
      --color    "#c9a96e"
      --fotos    archivo-links.txt
      --posicion N  (posición en los tabs, default: al final)

  node mascota.js fotos <NombreCarpeta> <archivo.txt>
  node mascota.js fotos <NombreCarpeta> --links "url1" "url2"
      Importa fotos de Google Drive a imagenes.json sin duplicar.

  node mascota.js listar
      Muestra todas las mascotas con sus datos principales.

  node mascota.js ayuda
      Muestra esta ayuda.
`);
}

// ── Entry point ───────────────────────────────────────────────────────────────

const [,, comando, ...resto] = process.argv;

switch (comando) {
  case 'entrevistar':           cmdEntrevistar().catch(e => { console.error(e); process.exit(1); }); break;
  case 'agregar':               cmdAgregar(resto);  break;
  case 'fotos':                 cmdFotos(resto);    break;
  case 'listar':                cmdListar();        break;
  case 'ayuda': case '--help': case '-h': cmdAyuda(); break;
  default:
    console.error(`Comando desconocido: "${comando || ''}"\nEjecuta: node mascota.js ayuda`);
    process.exit(1);
}
