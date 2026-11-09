import test from 'node:test';
import assert from 'node:assert/strict';
import { createCalendarReference } from '../src/calendar.mjs';

const example = { iso: '2026-12-04', quote: 'Deadline: 4 December 2026 at 17:00 Lisbon', sourceUrl: 'https://example.org/rules', language: 'en', uid: 'test-123', now: new Date('2026-11-09T09:00:00Z') };

test('exports a reviewed day as an all-day reference without inventing a time', () => {
  const ics = createCalendarReference(example);
  const unfolded = ics.replace(/\r\n[ \t]/g, '');
  assert.match(ics, /DTSTART;VALUE=DATE:20261204\r\n/);
  assert.match(ics, /DTEND;VALUE=DATE:20261205\r\n/);
  assert.match(ics, /DTSTAMP:20261109T090000Z\r\n/);
  assert.match(unfolded, /confirm.*time.*zone/i);
  assert.ok(unfolded.includes(example.quote));
  assert.ok(ics.includes(example.sourceUrl));
});

test('refuses ambiguous or invalid dates and wraps year-end correctly', () => {
  for (const iso of ['04/05/2026', '2026-02-29', '2026-13-40', '']) {
    assert.throws(() => createCalendarReference({...example, iso}));
  }
  assert.match(createCalendarReference({...example, iso:'2028-12-31'}), /DTEND;VALUE=DATE:20290101\r\n/);
});

test('escapes source text instead of allowing injected calendar fields', () => {
  const ics = createCalendarReference({...example, quote: 'Deadline\nATTENDEE:someone@example.com;extra,thing'});
  assert.doesNotMatch(ics, /\r\nATTENDEE:/);
  assert.ok(ics.replace(/\r\n[ \t]/g, '').includes('Deadline\\nATTENDEE:someone@example.com\\;extra\\,thing'));
});

test('rejects unsafe source URLs instead of embedding credentials', () => {
  for (const sourceUrl of ['javascript:alert(1)', 'https://a:b@example.org/', 'file:///tmp/private']) {
    assert.throws(() => createCalendarReference({...example, sourceUrl}));
  }
});

test('rejects injected event IDs and escapes carriage returns', () => {
  assert.throws(() => createCalendarReference({...example, uid: 'good\r\nATTENDEE:someone@example.com'}));
  const ics = createCalendarReference({...example, quote: 'Deadline\rATTENDEE:someone@example.com'});
  assert.doesNotMatch(ics, /\r\nATTENDEE:/);
  for (const line of ics.split('\r\n')) assert.ok(new TextEncoder().encode(line).length <= 75);
});

test('bundles the deadline and suggested milestones as separate all-day events', async () => {
  const { createPlanCalendar } = await import('../src/calendar.mjs');
  const events = [
    { iso: '2026-11-13', uid: 'plan-1', summary: 'SUGGESTED: Gather documents', description: 'A planning suggestion, not an organiser date.' },
    { iso: '2026-12-04', uid: 'plan-2', summary: 'Deadline day (from the notice)', description: 'Confirm the time and time zone.\nApplications close on 4 December 2026' }
  ];
  const ics = createPlanCalendar({ events, sourceUrl: 'https://example.org/rules', now: new Date('2026-11-09T09:00:00Z') });
  assert.equal((ics.match(/BEGIN:VEVENT/g) || []).length, 2);
  assert.match(ics, /DTSTART;VALUE=DATE:20261113\r\n/);
  assert.match(ics, /DTSTART;VALUE=DATE:20261204\r\nDTEND;VALUE=DATE:20261205\r\n/);
  assert.equal((ics.match(/URL:https:\/\/example.org\/rules/g) || []).length, 2);
  for (const line of ics.split('\r\n')) assert.ok(new TextEncoder().encode(line).length <= 75);
  assert.throws(() => createPlanCalendar({ events: [], now: new Date() }));
  assert.throws(() => createPlanCalendar({ events: [{ ...events[0], iso: '13/11/2026' }], now: new Date() }));
  assert.throws(() => createPlanCalendar({ events: [{ ...events[0], uid: 'bad\r\nX:1' }], now: new Date() }));
});
