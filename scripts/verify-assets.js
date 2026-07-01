const fs = require('node:fs');
const path = require('node:path');

const projectRoot = path.resolve(__dirname, '..');
const sourceRoot = path.join(projectRoot, 'src');
const imageExtensions = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp']);
const fileExtensions = new Set(['.ts', '.tsx', '.js', '.jsx']);
const importPattern =
  /(?:require\(\s*['"]([^'"]+)['"]\s*\)|import\s+[^'"]*?from\s+['"]([^'"]+)['"]|import\(\s*['"]([^'"]+)['"]\s*\))/g;

function collectSourceFiles(dir, files = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name === '.expo') {
      continue;
    }

    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      collectSourceFiles(fullPath, files);
      continue;
    }

    if (fileExtensions.has(path.extname(entry.name))) {
      files.push(fullPath);
    }
  }
  return files;
}

function resolveSpecifier(sourceFile, specifier) {
  if (specifier.startsWith('@/')) {
    return path.join(sourceRoot, specifier.slice(2));
  }

  if (specifier.startsWith('./') || specifier.startsWith('../')) {
    return path.resolve(path.dirname(sourceFile), specifier);
  }

  return null;
}

function shouldValidateSpecifier(specifier) {
  const ext = path.extname(specifier).toLowerCase();
  return imageExtensions.has(ext);
}

function toRelative(filePath) {
  return path.relative(projectRoot, filePath).replace(/\\/g, '/');
}

const sourceFiles = collectSourceFiles(sourceRoot);
const failures = [];

for (const sourceFile of sourceFiles) {
  const content = fs.readFileSync(sourceFile, 'utf8');
  const matches = content.matchAll(importPattern);

  for (const match of matches) {
    const specifier = match[1] || match[2] || match[3];
    if (!specifier || !shouldValidateSpecifier(specifier)) {
      continue;
    }

    const resolvedPath = resolveSpecifier(sourceFile, specifier);
    if (!resolvedPath) {
      continue;
    }

    if (!fs.existsSync(resolvedPath)) {
      failures.push({
        source: toRelative(sourceFile),
        specifier,
        resolved: toRelative(resolvedPath),
      });
    }
  }
}

if (failures.length > 0) {
  console.error('Asset reference validation failed:');
  for (const failure of failures) {
    console.error(
      `- ${failure.source} -> "${failure.specifier}" (expected at ${failure.resolved})`
    );
  }
  process.exit(1);
}

console.log('Asset reference validation passed.');
