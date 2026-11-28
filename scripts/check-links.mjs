import fs from 'node:fs';

for (const dir of ['site', 'peer']) {
  const html = fs.readFileSync(`${dir}/index.html`, 'utf8');
  const hrefs = [...html.matchAll(/href="([^"]+)"/g)].map((m) => m[1]);
  const ids = new Set([...html.matchAll(/id="([^"]+)"/g)].map((m) => m[1]));
  const bad = [];
  for (const href of hrefs) {
    if (href.startsWith('#')) {
      if (!ids.has(href.slice(1))) bad.push(`${href} (ancre manquante)`);
    } else if (!href.startsWith('http') && !href.startsWith('mailto')) {
      if (!fs.existsSync(`${dir}/${href.split('#')[0]}`)) bad.push(`${href} (fichier manquant)`);
    }
  }
  console.log(dir, bad.length ? `LIENS CASSES: ${bad.join(', ')}` : 'tous les liens locaux et ancres OK');
}
