import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const read = (path) => readFileSync(new URL(path, root), 'utf8');
const modules = readdirSync(new URL('src/', root)).filter((name) => name.endsWith('.mjs')).map((name) => [`src/${name}`, read(`src/${name}`)]);
const html = read('index.html');

test('application code makes no network requests', () => {
  for (const [name, code] of modules) {
    for (const pattern of [/\bfetch\s*\(/, /XMLHttpRequest/, /sendBeacon/, /new\s+WebSocket/, /EventSource/]) {
      assert.doesNotMatch(code, pattern, `${name} must not use ${pattern}`);
    }
    for (const match of code.matchAll(/(?:import\s*\(|from\s+)['"]([^'"]+)['"]/g)) {
      assert.ok(match[1].startsWith('./') || match[1].startsWith('../'), `${name} imports a non-local module: ${match[1]}`);
    }
  }
});

test('the page loads only local scripts and styles', () => {
  for (const match of html.matchAll(/<(script|link)\b[^>]*\b(src|href)="([^"]+)"/g)) {
    assert.ok(!/^(https?:)?\/\//.test(match[3]), `${match[1]} loads a remote resource: ${match[3]}`);
  }
  const remoteLinks = [...html.matchAll(/<a\b[^>]*href="(https?:[^"]+)"/g)].map((match) => match[1]);
  assert.deepEqual(remoteLinks, ['https://dua.2lados.pt/'], 'the only outbound link is the user-clicked DUA link');
});

test('pdf.js is vendored and loaded from this project', () => {
  const pdf = read('src/pdf.mjs');
  assert.match(pdf, /import\('\.\.\/vendor\/pdfjs\/pdf\.min\.mjs'\)/);
  assert.match(pdf, /new URL\('\.\.\/vendor\/pdfjs\/pdf\.worker\.min\.mjs', import\.meta\.url\)/);
  assert.match(read('vendor/pdfjs/LICENSE'), /Apache License/);
});
