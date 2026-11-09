/**
 * Change Review Module
 * Labels added and removed lines with possible topics and risk signals.
 * Pure module: no network, DOM, previous text or novelty claims.
 */

import { analyse } from './analysis.mjs';
import { detectSignals, SIGNAL_KINDS } from './insights.mjs';

/**
 * Label a change with categories and signal kinds.
 * Each valid input object has kind (added/removed) and a string quote.
 * Returns exact kind, quote, deduplicated categories and signalKinds.
 * Rejects invalid top-level input or invalid entries.
 *
 * @param {Array} changes - Array of change objects, each with kind and quote
 * @returns {Array} - Labelled changes with categories and signalKinds
 * @throws {Error} - If input is not an array or contains invalid entries
 */
export function labelChanges(changes) {
  // Reject invalid top-level input
  if (!Array.isArray(changes)) {
    throw new Error('Input must be an array of change objects');
  }

  const labelled = [];

  for (let i = 0; i < changes.length; i++) {
    const change = changes[i];

    // Reject invalid entries
    if (!change || typeof change !== 'object') {
      throw new Error(`Change at index ${i} is not an object`);
    }

    const { kind, quote } = change;

    // Validate kind
    if (kind !== 'added' && kind !== 'removed') {
      throw new Error(`Change at index ${i} has invalid kind: ${kind}. Must be 'added' or 'removed'.`);
    }

    // Validate quote is a string
    if (typeof quote !== 'string') {
      throw new Error(`Change at index ${i} has invalid quote: not a string`);
    }

    // Extract categories from analysis
    const analysisResult = analyse({ text: quote, previousText: '', url: '' });
    const categories = [];
    const categorySet = new Set();

    for (const item of analysisResult.items) {
      if (item.category && !categorySet.has(item.category)) {
        categories.push(item.category);
        categorySet.add(item.category);
      }
    }

    // Extract signal kinds
    const signals = detectSignals(quote);
    const signalKinds = [];
    const signalSet = new Set();

    for (const signal of signals) {
      if (signal.kind && !signalSet.has(signal.kind)) {
        signalKinds.push(signal.kind);
        signalSet.add(signal.kind);
      }
    }

    labelled.push({
      kind,
      quote,
      categories,
      signalKinds
    });
  }

  return labelled;
}

export default { labelChanges };
