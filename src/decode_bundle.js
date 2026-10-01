import fs from 'fs';

try {
  const fileContent = fs.readFileSync('dist/assets/index-Cjzg_Cv1.js', 'utf-8');
  
  // Let's search for "print-parent" and look for the return statement of the main component
  const searchStr = 'print-parent';
  const startIdx = fileContent.indexOf(searchStr);
  
  if (startIdx !== -1) {
    console.log('Found print-parent in bundle. Reading segment around it...');
    const segment = fileContent.substring(Math.max(0, startIdx - 5000), Math.min(fileContent.length, startIdx + 85000));
    fs.writeFileSync('app_layout.txt', segment);
    console.log('Saved 90,000 characters around "print-parent" to app_layout.txt.');
  } else {
    console.log('Could not find "print-parent" in the bundle.');
  }
} catch (e) {
  console.error('Error decoding bundle:', e);
}
