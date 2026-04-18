import { test } from 'node:test';
import assert from 'node:assert/strict';
import { driveUrl, resolvePhoto, renderTitle } from '../js/utils.mjs';

// ── driveUrl ─────────────────────────────────────────────────────────────────

test('driveUrl: convierte link de Drive a lh3.googleusercontent.com', () => {
  const input  = 'https://drive.google.com/file/d/1aBcDeFgHiJkLmNoPqRsTuVwXyZ/view?usp=sharing';
  const result = driveUrl(input);
  assert.equal(result, 'https://lh3.googleusercontent.com/d/1aBcDeFgHiJkLmNoPqRsTuVwXyZ');
});

test('driveUrl: preserva hyphens y underscores en el file ID', () => {
  const input  = 'https://drive.google.com/file/d/1a-B_cD2eF3gH/view?usp=drive_link';
  const result = driveUrl(input);
  assert.equal(result, 'https://lh3.googleusercontent.com/d/1a-B_cD2eF3gH');
});

test('driveUrl: URL no-Drive se devuelve sin cambios', () => {
  const input = 'https://ejemplo.com/foto.jpg';
  assert.equal(driveUrl(input), input);
});

test('driveUrl: string sin URL se devuelve sin cambios', () => {
  const input = 'foto1.jpg';
  assert.equal(driveUrl(input), input);
});

test('driveUrl: URL con parámetros antes del path no hace match accidental', () => {
  const input = 'https://ejemplo.com/gallery?src=/file/x/algo';
  assert.equal(driveUrl(input), input);
});

// ── resolvePhoto ─────────────────────────────────────────────────────────────

test('resolvePhoto: URL https pasa por driveUrl', () => {
  const driveInput = 'https://drive.google.com/file/d/FILEID123/view?usp=sharing';
  const result = resolvePhoto(driveInput, 'Miyoto');
  assert.equal(result, 'https://lh3.googleusercontent.com/d/FILEID123');
});

test('resolvePhoto: URL http también pasa por driveUrl', () => {
  const input  = 'http://ejemplo.com/foto.jpg';
  const result = resolvePhoto(input, 'Miyoto');
  assert.equal(result, input); // no es Drive, driveUrl lo devuelve igual
});

test('resolvePhoto: nombre de archivo local se resuelve con ruta de mascota', () => {
  const result = resolvePhoto('foto1.jpg', 'Miyoto');
  assert.equal(result, 'mascotas/Miyoto/imagenes/foto1.jpg');
});

test('resolvePhoto: respeta el nombre exacto de la mascota en la ruta', () => {
  const result = resolvePhoto('avatar.jpg', 'Mi_Gato');
  assert.equal(result, 'mascotas/Mi_Gato/imagenes/avatar.jpg');
});

test('resolvePhoto: URL no-Drive https se devuelve sin modificar', () => {
  const input  = 'https://cdn.ejemplo.com/img/foto.png';
  const result = resolvePhoto(input, 'Miyoto');
  assert.equal(result, input);
});

// ── renderTitle ───────────────────────────────────────────────────────────────

test('renderTitle: *palabra* se convierte en <em>palabra</em>', () => {
  assert.equal(renderTitle('Mis *Compañeros* de Vida'), 'Mis <em>Compañeros</em> de Vida');
});

test('renderTitle: múltiples marcas se convierten todas', () => {
  assert.equal(
    renderTitle('*Amor* y *Memoria*'),
    '<em>Amor</em> y <em>Memoria</em>'
  );
});

test('renderTitle: string sin asteriscos se devuelve sin cambios', () => {
  const input = 'Mascotas Memorias';
  assert.equal(renderTitle(input), input);
});

test('renderTitle: asterisco suelto sin cerrar no se convierte', () => {
  const input = 'Hola * mundo';
  assert.equal(renderTitle(input), input);
});

test('renderTitle: string vacío devuelve string vacío', () => {
  assert.equal(renderTitle(''), '');
});
