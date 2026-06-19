const fs = require('fs');
const files = ['de.json', 'fr.json', 'es.json', 'zh.json'];

files.forEach(f => {
  const p = `src/locales/${f}`;
  if (fs.existsSync(p)) {
    const data = JSON.parse(fs.readFileSync(p, 'utf8'));
    
    data['dashboard.title'] = 'Calyx';
    data['dashboard.copyright'] = '© 2026 Calyx v1.1.1 • by Gurkenwerfer';
    
    if (f === 'de.json') data['settings.test_alert_body'] = 'Dies ist eine Testnachricht aus den Calyx-Einstellungen.';
    if (f === 'fr.json') data['settings.test_alert_body'] = 'Ceci est un message de test des paramètres de Calyx.';
    if (f === 'es.json') data['settings.test_alert_body'] = 'Este es un mensaje de prueba de la configuración de Calyx.';
    if (f === 'zh.json') data['settings.test_alert_body'] = '这是来自 Calyx 设置的测试消息。';

    fs.writeFileSync(p, JSON.stringify(data, null, 2));
  }
});
console.log('Fixed Calyx name in translations');
