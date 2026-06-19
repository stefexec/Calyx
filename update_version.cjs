const fs = require('fs');
const files = ['en.json', 'de.json', 'fr.json', 'es.json', 'zh.json'];

files.forEach(f => {
  const p = `src/locales/${f}`;
  if (fs.existsSync(p)) {
    let content = fs.readFileSync(p, 'utf8');
    content = content.replace(/v1\.1\.1/g, 'v1.2.0');
    fs.writeFileSync(p, content);
  }
});
console.log('Updated version in locales');
