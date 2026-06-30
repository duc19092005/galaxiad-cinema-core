const fs = require('node:fs');
const path = require('node:path');

const faceApiDir = path.join(__dirname, '..', 'node_modules', 'face-api.js', 'build', 'es6');

function stripSourcemapComments(dir) {
  if (!fs.existsSync(dir)) {
    return;
  }

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      stripSourcemapComments(fullPath);
      continue;
    }

    if (!entry.isFile() || !entry.name.endsWith('.js')) {
      continue;
    }

    const original = fs.readFileSync(fullPath, 'utf8');
    const stripped = original.replace(/\r?\n?\/\/# sourceMappingURL=.*$/gm, '');

    if (stripped !== original) {
      fs.writeFileSync(fullPath, stripped);
    }
  }
}

stripSourcemapComments(faceApiDir);
