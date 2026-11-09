# Change review — design

`src/change-review.mjs` exports `labelChanges(changes)`. Each well-formed `{kind, quote}` becomes `{kind, quote, categories, signalKinds}`. Categories come from `analyse({text: quote, previousText: '', url: ''}).items`; signal kinds come from `detectSignals(quote)`. Deduplicate labels without changing the line. Invalid input is rejected. No translations, DOM, previous text or claims of novelty belong in the pure module.

In the existing changes section, a native select switches between all lines and lines with any label. Use the existing category and signal-name translations, textContent for user text, and a clear note that matching is incomplete. Preserve the original diff and downloaded brief. Keep the filter state during review/language changes; reset it for a new analysis. Do not present unlabelled lines as safe.
