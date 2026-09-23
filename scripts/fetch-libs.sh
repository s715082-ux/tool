#!/usr/bin/env bash
set -euo pipefail
mkdir -p dist/libs
cp index.html styles.css app.js privacy.html dist/
curl -fsSL https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js -o dist/libs/pdf-lib.min.js
curl -fsSL https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js -o dist/libs/pdf.min.js
curl -fsSL https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js -o dist/libs/pdf.worker.min.js
curl -fsSL https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js -o dist/libs/jszip.min.js
curl -fsSL https://cdnjs.cloudflare.com/ajax/libs/Sortable/1.15.2/Sortable.min.js -o dist/libs/Sortable.min.js

echo 'SHA256_BASELINE_BEGIN'
sha256sum dist/libs/pdf-lib.min.js dist/libs/pdf.min.js dist/libs/pdf.worker.min.js dist/libs/jszip.min.js dist/libs/Sortable.min.js
echo 'SHA256_BASELINE_END'
