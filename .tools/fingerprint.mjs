
// .tools/fingerprint.mjs
import { createHash } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const inputs = [
  { src: 'script.js',   tag: /(<script[^>]*src=")script\.js(")/ },
  { src: 'styles.css',  tag: /(<link[^>]*href=")styles\.css(")/ },
];

async function hashFile(filePath) {
  const buf = await fs.readFile(filePath);
  const hash = createHash('sha1').update(buf).digest('hex').slice(0, 8);
  return { hash, buf };
}

async function run() {
  // Read HTML once
  const htmlPath = path.join(root, 'index.html');
  let html = await fs.readFile(htmlPath, 'utf8');

  for (const item of inputs) {
    const { src, tag } = item;
    const abs = path.join(root, src);

    // Skip missing files gracefully
    try {
      const { hash, buf } = await hashFile(abs);
      const ext = path.extname(src);            // .js or .css
      const base = path.basename(src, ext);     // script or styles
      const hashed = `${base}.${hash}${ext}`;   // script.1a2b3c4d.js

      // Write hashed copy
      await fs.writeFile(path.join(root, hashed), buf);

      // Rewrite HTML reference
      html = html.replace(tag, `$1${hashed}$2`);
      console.log(`✔ Fingerprinted ${src} → ${hashed}`);
    } catch (e) {
      console.warn(`(i) Skip ${src}: not found`);
    }
  }

  // Write out rewritten HTML to a clean /dist folder
  await fs.mkdir(path.join(root, 'dist'), { recursive: true });

  // Copy other needed files (wordlist, images, etc.)
  const toCopy = ['index.html', 'wordlist.txt']; // add any assets you need
  for (const f of toCopy) {
    const srcPath = path.join(root, f);
    try {
      await fs.access(srcPath);
      if (f === 'index.html') {
        await fs.writeFile(path.join(root, 'dist', f), html, 'utf8');
      } else {
        const buf = await fs.readFile(srcPath);
        await fs.writeFile(path.join(root, 'dist', f), buf);
      }
    } catch (_) {
      // ignore missing optional files
    }
  }

  // Also move hashed assets into /dist
  const files = await fs.readdir(root);
  for (const f of files) {
    if (/^script\.[0-9a-f]{8}\.js$/.test(f) || /^styles\.[0-9a-f]{8}\.css$/.test(f)) {
      const buf = await fs.readFile(path.join(root, f));
      await fs.writeFile(path.join(root, 'dist', f), buf);
    }
  }

  console.log('✔ dist/ ready');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});