#!/usr/bin/env node
/**
 * entrevistar-mascota.js
 *
 * Entrevista interactiva para crear el perfil completo de una mascota.
 * Hace preguntas paso a paso — tanto los datos técnicos (nombre, años, color)
 * como preguntas narrativas para componer el tributo automáticamente.
 *
 * Al terminar, crea la carpeta, config.json e imagenes.json, y registra
 * la mascota en mascotas.json — igual que agregar-mascota.js.
 *
 * Uso:
 *   node entrevistar-mascota.js
 *
 * No requiere argumentos. Todo se ingresa de forma interactiva.
 */

'use strict';

const fs       = require('fs');
const path     = require('path');
const readline = require('readline');

// ── Helpers de readline ───────────────────────────────────────────────────────

const rl = readline.createInterface({
  input:  process.stdin,
  output: process.stdout,
});

/**
 * Hace una pregunta y devuelve la respuesta como Promise.
 * Si se provee un valor por defecto, se muestra entre corchetes.
 */
function preguntar(texto, defecto = '') {
  const sufijo = defecto ? ` [${defecto}]` : '';
  return new Promise((resolve) => {
    rl.question(`${texto}${sufijo}: `, (respuesta) => {
      resolve(respuesta.trim() || defecto);
    });
  });
}

/**
 * Hace una pregunta de sí/no. Devuelve true para "s", false para "n".
 */
async function preguntarSiNo(texto, defecto = 's') {
  const opciones = defecto === 's' ? '[S/n]' : '[s/N]';
  const respuesta = await preguntar(`${texto} ${opciones}`);
  return respuesta.toLowerCase() !== 'n' && (respuesta.toLowerCase() === 's' || defecto === 's');
}

/** Imprime una línea divisora con título opcional. */
function seccion(titulo = '') {
  const linea = '─'.repeat(55);
  console.log('');
  if (titulo) {
    console.log(`── ${titulo} ${'─'.repeat(Math.max(0, 52 - titulo.length))}`);
  } else {
    console.log(linea);
  }
}

// ── Constructor del tributo ───────────────────────────────────────────────────

/**
 * Compone el texto del tributo a partir de las respuestas narrativas.
 * Solo incluye las secciones que tienen contenido.
 */
function componerTributo(datos) {
  const parrafos = [];

  // Párrafo 1: nombre oficial + llegada
  let p1 = '';
  if (datos.nombreOficial && datos.nombreOficial !== datos.nombre) {
    p1 += `Tu nombre era ${datos.nombreOficial}, pero todos te conocimos como ${datos.nombre}`;
    if (datos.comoLlego) {
      p1 += `. ${datos.comoLlego}`;
    } else {
      p1 += ' — y así te quedaste.';
    }
  } else if (datos.comoLlego) {
    p1 += datos.comoLlego;
  }
  if (p1) parrafos.push(p1);

  // Párrafo 2: personalidad + manías
  const partesPers = [];
  if (datos.personalidad) partesPers.push(datos.personalidad);
  if (datos.mania)        partesPers.push(datos.mania);
  if (partesPers.length)  parrafos.push(partesPers.join(' '));

  // Párrafo 3: lo que se extraña
  if (datos.extranas) parrafos.push(datos.extranas);

  // Párrafo 4: mensaje de cierre
  if (datos.mensaje) {
    parrafos.push(datos.mensaje);
  } else if (datos.nombre) {
    parrafos.push(`Gracias por todo, ${datos.nombre}.`);
  }

  return parrafos.join('\n\n');
}

// ── Lógica de archivos (igual que agregar-mascota.js) ─────────────────────────

function nombreACarpeta(nombre) {
  return nombre.trim().replace(/\s+/g, '_');
}

function crearArchivos(cfg, carpeta) {
  const mascotaDir  = path.join('mascotas', carpeta);
  const imagenesDir = path.join(mascotaDir, 'imagenes');

  if (fs.existsSync(mascotaDir)) {
    console.error(`\nError: la carpeta "${mascotaDir}" ya existe.`);
    process.exit(1);
  }

  fs.mkdirSync(imagenesDir, { recursive: true });
  fs.writeFileSync(path.join(mascotaDir, 'config.json'),   JSON.stringify(cfg,          null, 2) + '\n');
  fs.writeFileSync(path.join(mascotaDir, 'imagenes.json'), JSON.stringify({ fotos: [] }, null, 2) + '\n');

  console.log(`\n✓ Carpeta creada:  mascotas/${carpeta}/`);
  console.log(`✓ config.json      generado`);
  console.log(`✓ imagenes.json    generado (vacío)`);
}

function registrarEnMascotasJson(carpeta) {
  const data = JSON.parse(fs.readFileSync('mascotas.json', 'utf8'));
  if (!data.mascotas.includes(carpeta)) {
    data.mascotas.push(carpeta);
    fs.writeFileSync('mascotas.json', JSON.stringify(data, null, 2) + '\n');
    console.log(`✓ Registrada en mascotas.json`);
  }
}

// ── Entrevista ────────────────────────────────────────────────────────────────

async function entrevistar() {
  console.log('');
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║       Perfil de mascota — entrevista interactiva       ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  console.log('  Responde las preguntas. Enter para dejar en blanco.');

  // Verificar directorio
  if (!fs.existsSync('mascotas.json')) {
    console.error('\nError: ejecuta el script desde la raíz del proyecto.');
    process.exit(1);
  }

  const datos = {};

  // ── Datos básicos ──────────────────────────────────────────────────────────
  seccion('Datos básicos');

  datos.nombre = await preguntar('¿Cómo se llama la mascota?');
  if (!datos.nombre) {
    console.error('El nombre es obligatorio.');
    process.exit(1);
  }

  const carpetaSugerida = nombreACarpeta(datos.nombre);
  datos.carpeta = await preguntar('Nombre de la carpeta (sin espacios)', carpetaSugerida);

  datos.emoji = await preguntar('¿Qué emoji la representa?', '🐾');

  const tieneNombreOficial = await preguntarSiNo('¿Tenía un nombre oficial diferente al apodo?', 'n');
  if (tieneNombreOficial) {
    datos.nombreOficial = await preguntar('¿Cuál era su nombre oficial?');
  }

  // ── Fechas ─────────────────────────────────────────────────────────────────
  seccion('Fechas');

  const anoNac = await preguntar('¿En qué año nació?');
  const sigueConNosotros = await preguntarSiNo('¿Sigue con nosotros?', 'n');

  if (sigueConNosotros) {
    datos.años = `${anoNac || '????'} – presente`;
  } else {
    const anoFal = await preguntar('¿En qué año falleció?');
    datos.años = `${anoNac || '????'} – ${anoFal || '????'}`;
  }

  // ── Apariencia ─────────────────────────────────────────────────────────────
  seccion('Apariencia en el sitio');

  datos.badge = await preguntar('Badge (texto pequeño bajo el nombre)');
  datos.color = await preguntar('Color de acento (hex CSS)', '#c9a96e');

  // ── Narrativa para el tributo ──────────────────────────────────────────────
  seccion('Tributo — cuéntanos sobre su vida');

  console.log('  Estas respuestas se usan para componer el texto del tributo.');
  console.log('  Puedes dejar en blanco las que no apliquen.\n');

  datos.comoLlego   = await preguntar('¿Cómo llegó a tu vida? (de dónde vino, cómo fue el encuentro)');
  datos.personalidad = await preguntar('¿Cómo era su personalidad? (describe con tus palabras)');
  datos.mania        = await preguntar('¿Cuál era su manía o costumbre más característica?');
  datos.extranas     = await preguntar('¿Qué es lo que más extrañas de él/ella?');
  datos.mensaje      = await preguntar('¿Qué mensaje le darías?');

  // ── Vista previa ───────────────────────────────────────────────────────────
  const tributo = componerTributo(datos);

  const config = {
    nombre:       datos.nombre,
    emoji:        datos.emoji,
    avatar:       'imagenes/avatar.jpg',
    años:         datos.años,
    badge:        datos.badge,
    tributo:      tributo,
    color_acento: datos.color,
  };

  seccion('Vista previa');
  console.log(JSON.stringify(config, null, 2));
  console.log('');
  if (tributo) {
    console.log('── Tributo ──────────────────────────────────────────────');
    console.log(tributo.replace(/\\n/g, '\n'));
    console.log('─────────────────────────────────────────────────────────');
  }

  // ── Confirmación ──────────────────────────────────────────────────────────
  const confirmar = await preguntarSiNo('\n¿Crear la mascota con estos datos?');
  if (!confirmar) {
    console.log('\nCancelado. No se creó nada.');
    rl.close();
    return;
  }

  // ── Crear archivos ─────────────────────────────────────────────────────────
  crearArchivos(config, datos.carpeta);
  registrarEnMascotasJson(datos.carpeta);

  seccion();
  console.log('  Próximos pasos:');
  console.log(`  1. Copia el avatar a mascotas/${datos.carpeta}/imagenes/avatar.jpg`);
  console.log(`  2. Agrega fotos con: node drive-to-imagenes.js ${datos.carpeta} links.txt`);
  console.log(`  3. Publica:`);
  console.log(`     git add mascotas/${datos.carpeta}/ mascotas.json`);
  console.log(`     git commit -m "Agregar mascota: ${datos.carpeta}"`);
  console.log(`     git push`);
  console.log('─────────────────────────────────────────────────────────');

  rl.close();
}

entrevistar().catch((err) => {
  console.error(err);
  rl.close();
  process.exit(1);
});
