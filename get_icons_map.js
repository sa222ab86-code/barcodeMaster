import fs from 'fs';

try {
  const bundle = fs.readFileSync('dist/assets/index-BpFKDGTi.js', 'utf-8');
  console.log('Bundle loaded, length:', bundle.length);
  
  // Let's find some identifiers like "pt", "cr", "ha", "Qs" in relation to Lucide icon creation
  // Lucide icons in the production bundle are usually like: "const pt = createLucideIcon(...)", "const cr = ..."
  // Or we can search for the exact occurrences of jsx(IconName, ...) or we can see definitions.
  
  const searchFor = ['FileSpreadsheet', 'Receipt', 'Printer', 'Share2', 'Edit', 'Trash2', 'Plus', 'Settings', 'Eye', 'CloudUpload', 'CloudDownload'];
  for (const name of searchFor) {
    const idx = bundle.indexOf(`"${name}"`);
    if (idx !== -1) {
      console.log(`Lucide "${name}" found at: ${idx}`);
      // Print context
      console.log(bundle.substring(idx - 100, idx + 200));
    }
  }
} catch (e) {
  console.error(e);
}
