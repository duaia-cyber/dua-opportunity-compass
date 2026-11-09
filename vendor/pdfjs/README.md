# pdf.js (vendored)

- Package: `pdfjs-dist` 6.5.438 from npm, files `build/pdf.min.mjs` and `build/pdf.worker.min.mjs`, unmodified.
- Licence: Apache License 2.0 (see `LICENSE`). Copyright Mozilla Foundation and contributors.
- Why vendored: the prototype makes no network requests at runtime. The PDF text layer is read in the browser; nothing is uploaded.
