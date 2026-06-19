const fs = require('fs');

async function translateText(text, targetLang) {
  // Free google translate API endpoint
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    return data[0].map(x => x[0]).join('');
  } catch (e) {
    console.error('Translation error for', text, e);
    return text;
  }
}

async function run() {
  const en = JSON.parse(fs.readFileSync('src/locales/en.json', 'utf8'));
  const langs = ['de', 'fr', 'es', 'zh-CN'];
  const fileMap = { 'de': 'de.json', 'fr': 'fr.json', 'es': 'es.json', 'zh-CN': 'zh.json' };

  for (const lang of langs) {
    console.log(`Translating to ${lang}...`);
    const translated = {};
    const entries = Object.entries(en);
    
    // Process in batches of 10 to avoid rate limits / speed it up
    for (let i = 0; i < entries.length; i += 10) {
      const batch = entries.slice(i, i + 10);
      await Promise.all(batch.map(async ([key, text]) => {
        // preserve placeholders like {{day}}
        let textToTranslate = text.replace(/\{\{(.*?)\}\}/g, '<span class="$1"></span>');
        let res = await translateText(textToTranslate, lang);
        res = res.replace(/<span class="(.*?)"><\/span>/g, '{{$1}}');
        res = res.replace(/<span class="(.*?)"> <\/span>/g, '{{$1}}');
        translated[key] = res;
      }));
      process.stdout.write('.');
    }
    console.log('\nDone ' + lang);
    fs.writeFileSync(`src/locales/${fileMap[lang]}`, JSON.stringify(translated, null, 2));
  }
}

run().catch(console.error);
