/**
 * Change Review Tests
 * Tests for labelChanges function: deadline, removed rights, order, exact quote,
 * duplicates, HTML-like text, deduplication, and invalid input.
 */

import test from 'node:test';
import assert from 'assert/strict';
import { labelChanges } from '../src/change-review.mjs';

test('labelChanges: added deadline with category', () => {
  const changes = [
    { kind: 'added', quote: 'Applications close on 15 December 2024' }
  ];
  const result = labelChanges(changes);
  assert.equal(result.length, 1);
  assert.equal(result[0].kind, 'added');
  assert.equal(result[0].quote, 'Applications close on 15 December 2024');
  assert.ok(Array.isArray(result[0].categories));
  assert.ok(result[0].categories.includes('deadline'));
});

test('labelChanges: removed rights clause with signal kind', () => {
  const changes = [
    { kind: 'removed', quote: 'All rights to the work shall be transferred to the organiser.' }
  ];
  const result = labelChanges(changes);
  assert.equal(result.length, 1);
  assert.equal(result[0].kind, 'removed');
  assert.equal(result[0].quote, 'All rights to the work shall be transferred to the organiser.');
  assert.ok(Array.isArray(result[0].signalKinds));
  assert.ok(result[0].signalKinds.includes('rights'));
});

test('labelChanges: unrelated text returns empty categories and signals', () => {
  const changes = [
    { kind: 'added', quote: 'This is just a random line of text.' }
  ];
  const result = labelChanges(changes);
  assert.equal(result.length, 1);
  assert.deepEqual(result[0].categories, []);
  assert.deepEqual(result[0].signalKinds, []);
});

test('labelChanges: exact quote preservation with whitespace', () => {
  const originalQuote = '  Deadline: 31 December 2024  ';
  const changes = [
    { kind: 'added', quote: originalQuote }
  ];
  const result = labelChanges(changes);
  assert.equal(result[0].quote, originalQuote);
});

test('labelChanges: preserve order of entries', () => {
  const changes = [
    { kind: 'added', quote: 'Deadline: 15 December' },
    { kind: 'removed', quote: 'Fee: €25' },
    { kind: 'added', quote: 'Eligible: universities only' }
  ];
  const result = labelChanges(changes);
  assert.equal(result.length, 3);
  assert.equal(result[0].kind, 'added');
  assert.equal(result[1].kind, 'removed');
  assert.equal(result[2].kind, 'added');
  assert.equal(result[0].quote, 'Deadline: 15 December');
  assert.equal(result[1].quote, 'Fee: €25');
  assert.equal(result[2].quote, 'Eligible: universities only');
});

test('labelChanges: duplicate entries are preserved', () => {
  const changes = [
    { kind: 'added', quote: 'Deadline: 31 December' },
    { kind: 'added', quote: 'Deadline: 31 December' },
    { kind: 'added', quote: 'Deadline: 31 December' }
  ];
  const result = labelChanges(changes);
  assert.equal(result.length, 3);
  result.forEach(entry => {
    assert.equal(entry.quote, 'Deadline: 31 December');
  });
});

test('labelChanges: categories deduplicated within entry', () => {
  const changes = [
    { kind: 'added', quote: 'Deadline for funding applications close on 31 December' }
  ];
  const result = labelChanges(changes);
  assert.equal(result.length, 1);
  const categories = result[0].categories;
  const uniqueCategories = new Set(categories);
  assert.equal(categories.length, uniqueCategories.size);
});

test('labelChanges: signal kinds deduplicated within entry', () => {
  const changes = [
    { kind: 'added', quote: 'All rights to intellectual property transfer exclusive worldwide licence perpetual copyright' }
  ];
  const result = labelChanges(changes);
  assert.equal(result.length, 1);
  const signalKinds = result[0].signalKinds;
  const uniqueSignalKinds = new Set(signalKinds);
  assert.equal(signalKinds.length, uniqueSignalKinds.size);
});

test('labelChanges: HTML-like text treated as inert', () => {
  const changes = [
    { kind: 'added', quote: '<div>This is not HTML</div>' }
  ];
  const result = labelChanges(changes);
  assert.equal(result.length, 1);
  assert.equal(result[0].quote, '<div>This is not HTML</div>');
});

test('labelChanges: rejects null input', () => {
  assert.throws(() => labelChanges(null), /Input must be an array/);
});

test('labelChanges: rejects non-array input', () => {
  assert.throws(() => labelChanges({ kind: 'added', quote: 'test' }), /Input must be an array/);
});

test('labelChanges: rejects array with non-object entry', () => {
  assert.throws(() => labelChanges([null]), /not an object/);
});

test('labelChanges: rejects entry with invalid kind', () => {
  assert.throws(() => labelChanges([{ kind: 'modified', quote: 'text' }]), /invalid kind/);
});

test('labelChanges: rejects entry with non-string quote', () => {
  assert.throws(() => labelChanges([{ kind: 'added', quote: 123 }]), /invalid quote/);
});

test('labelChanges: rejects entry with array quote', () => {
  assert.throws(() => labelChanges([{ kind: 'added', quote: ['text'] }]), /invalid quote/);
});

test('labelChanges: returns correct properties in output', () => {
  const changes = [
    { kind: 'added', quote: 'Deadline: 31 December' }
  ];
  const result = labelChanges(changes);
  const entry = result[0];
  const keys = Object.keys(entry).sort();
  assert.deepEqual(keys, ['categories', 'kind', 'quote', 'signalKinds']);
});
