import test from 'node:test';
import assert from 'node:assert/strict';
import { encodeWorkspace, decodeWorkspace } from '../src/workspace.mjs';

const workspace = { text:'Deadline: 2026-12-04', previousText:'Deadline: 2026-11-20', url:'https://example.org/rules', reviewed:['item_0001_deadline'], notes:{item_0001_deadline:'Confirm the time.'} };

test('round trips a local working copy with notes and review state', () => {
  const result = decodeWorkspace(encodeWorkspace(workspace));
  assert.equal(result.text, workspace.text);
  assert.equal(result.previousText, workspace.previousText);
  assert.equal(result.url, workspace.url);
  assert.deepEqual(result.reviewed, workspace.reviewed);
  assert.equal(result.notes.item_0001_deadline, 'Confirm the time.');
});

test('refuses invalid or unrelated files and oversized text', () => {
  for (const input of ['not json', '{}', '{"version":999}', 'x'.repeat(200001)]) assert.throws(() => decodeWorkspace(input));
  assert.throws(() => encodeWorkspace({...workspace,text:'x'.repeat(150001)}));
  assert.equal(decodeWorkspace(encodeWorkspace({...workspace,text:'x'.repeat(150000)})).text.length, 150000);
});

test('rejects unsafe source URLs and object keys', () => {
  for (const url of ['javascript:alert(1)', 'https://a:b@example.org/', 'file:///tmp/private', '//example.org/', null]) {
    assert.throws(() => encodeWorkspace({...workspace,url}));
  }
  assert.throws(() => decodeWorkspace('{"version":1,"text":"x","previousText":"","url":"","reviewed":[],"notes":{"__proto__":"bad"}}'));
});

test('bounds restored review state and rejects unexpected root fields', () => {
  assert.throws(() => encodeWorkspace({...workspace, reviewed:Array(201).fill('item_0001_deadline')}));
  assert.throws(() => decodeWorkspace('{"version":1,"text":"x","previousText":"","url":"","reviewed":[],"notes":{},"__proto__":{"polluted":true}}'));
  assert.equal({}.polluted,undefined);
});

test('preserves text literally, without evaluating markup or rewriting quotes', () => {
  const text = 'Deadline: <img src=x onerror="alert(1)">';
  assert.equal(decodeWorkspace(encodeWorkspace({...workspace,text})).text,text);
});

test('round-trips checklist progress and still opens version 1 files', async () => {
  const { encodeWorkspace: enc, decodeWorkspace: dec } = await import('../src/workspace.mjs');
  const saved = dec(enc({ text: 'x', previousText: '', url: '', reviewed: [], notes: {}, ready: ['need_2_1'] }));
  assert.deepEqual(saved.ready, ['need_2_1']);
  assert.deepEqual(dec('{"version":1,"text":"x","previousText":"","url":"","reviewed":[],"notes":{}}').ready, []);
  assert.throws(() => dec('{"version":2,"text":"x","previousText":"","url":"","reviewed":[],"notes":{},"ready":["<script>"]}'));
});

test('keeps an optional PDF page map and rejects malformed ones', () => {
  const saved = decodeWorkspace(encodeWorkspace({...workspace, pages:[1, 14, 30]}));
  assert.deepEqual(saved.pages, [1, 14, 30]);
  assert.deepEqual(decodeWorkspace(encodeWorkspace(workspace)).pages, []);
  for (const pages of [[2, 5], [1, 1], [1, 'x'], [1, 0], Array.from({length: 2001}, (_, i) => i + 1)]) {
    assert.throws(() => encodeWorkspace({...workspace, pages}), String(pages).slice(0, 20));
  }
  assert.throws(() => decodeWorkspace('{"version":1,"text":"x","previousText":"","url":"","reviewed":[],"notes":{},"pages":[1]}'));
});
