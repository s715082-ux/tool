#!/usr/bin/env bash
set -euo pipefail
mkdir -p dist/libs
cp index.html styles.css app.js privacy.html dist/

curl -fsSL https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js -o dist/libs/pdf-lib.min.js
curl -fsSL https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js -o dist/libs/pdf.min.js
curl -fsSL https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js -o dist/libs/pdf.worker.min.js
curl -fsSL https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js -o dist/libs/jszip.min.js
curl -fsSL https://cdnjs.cloudflare.com/ajax/libs/Sortable/1.15.2/Sortable.min.js -o dist/libs/Sortable.min.js

cat > /tmp/libs.sha256 <<'EOF'
0f9a5cad07941f0826586c94e089d89b918c46e5c17cf2d5a3c6f666e3bc694f  dist/libs/pdf-lib.min.js
5b5799e6f8c680663207ac5b42ee14eed2a406fa7af48f50c154f0c0b1566946  dist/libs/pdf.min.js
feabdf309770ed24bba31a5467836cdc8cf639c705af27d52b585b041bb8527b  dist/libs/pdf.worker.min.js
acc7e41455a80765b5fd9c7ee1b8078a6d160bbbca455aeae854de65c947d59e  dist/libs/jszip.min.js
ca68430703c4f5960e90735867c6e94d29b5a3de37107d8100e5a301007e9e6e  dist/libs/Sortable.min.js
EOF

sha256sum -c /tmp/libs.sha256
