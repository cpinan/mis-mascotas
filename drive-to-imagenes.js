#!/usr/bin/env node
/**
 * drive-to-imagenes.js
 *
 * Lee los links de Google Drive desde un archivo de texto (uno por línea)
 * y genera o actualiza el imagenes.json de una mascota.
 *
 * Uso:
 *   node drive-to-imagenes.js <NombreMascota> <archivo-links.txt>
 *
 * Ejemplo:
 *   node drive-to-imagenes.js Miyoto links.txt
 *
 * El archivo links.txt debe tener un link por línea, por ejemplo:
 *   https://drive.google.com/file/d/1ABC.../view?usp=drive_link
 *   https://drive.google.com/file/d/1XYZ.../view?usp=sharing
 *
 * También acepta links pegados directamente como argumentos:
 *   node drive-to-imagenes.js Miyoto --links "url1" "url2" "url3"
 */

const fs = require('fs');
const path = require('path');

const DRIVE_FILE_PATTERN = /https:\/\/drive\.google\.com\/file\/d\/[^/\s"]+\/view[^\s"]*/g;

function extractDriveLinks(text) {
  return [...text.matchAll(DRIVE_FILE_PATTERN)].map(m => m[0]);
}

function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.error('Uso: node drive-to-imagenes.js <NombreMascota> <archivo-links.txt>');
    console.error('  o: node drive-to-imagenes.js <NombreMascota> --links "url1" "url2" ...');
    process.exit(1);
  }

  const petName = args[0];
  const outputPath = path.join('mascotas', petName, 'imagenes.json');

  if (!fs.existsSync(path.join('mascotas', petName))) {
    console.error(`Error: no existe la carpeta mascotas/${petName}/`);
    process.exit(1);
  }

  let links = [];

  if (args[1] === '--links') {
    // Links pasados como argumentos directos
    const raw = args.slice(2).join('\n');
    links = extractDriveLinks(raw);
  } else {
    // Leer desde archivo
    const filePath = args[1];
    if (!fs.existsSync(filePath)) {
      console.error(`Error: no se encuentra el archivo "${filePath}"`);
      process.exit(1);
    }
    const content = fs.readFileSync(filePath, 'utf8');
    links = extractDriveLinks(content);
  }

  if (!links.length) {
    console.error('No se encontraron links de Google Drive válidos.');
    process.exit(1);
  }

  // Leer imagenes.json existente y combinar (sin duplicados)
  let existing = [];
  if (fs.existsSync(outputPath)) {
    try {
      existing = JSON.parse(fs.readFileSync(outputPath, 'utf8')).fotos || [];
    } catch {
      existing = [];
    }
  }

  const combined = [...new Set([...existing, ...links])];
  const added = combined.length - existing.length;

  fs.writeFileSync(outputPath, JSON.stringify({ fotos: combined }, null, 2) + '\n');

  console.log(`✓ ${outputPath} actualizado`);
  console.log(`  ${added} foto(s) nueva(s) agregada(s) — total: ${combined.length}`);
}

main();
