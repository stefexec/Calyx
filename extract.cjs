const fs = require('fs');
const path = require('path');

const locales = {};

function scanDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      scanDir(fullPath);
    } else if (fullPath.endsWith('.jsx') || fullPath.endsWith('.js')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      
      // Match t('key', 'default value') or t("key", "default value")
      // Handles basic cases.
      const regex = /t\(\s*['"]([^'"]+)['"]\s*,\s*(['"])(.*?)\2/g;
      let match;
      while ((match = regex.exec(content)) !== null) {
        locales[match[1]] = match[3];
      }
    }
  }
}

scanDir(path.join(__dirname, 'src'));
fs.writeFileSync('src/locales/en.json', JSON.stringify(locales, null, 2));
console.log('Extracted ' + Object.keys(locales).length + ' keys to en.json');
