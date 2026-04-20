import fs from 'fs';
import { parseGeosite, buildGeosite } from './src/parsers/v2ray-dat.js';

const inputPath = 'C:\\Users\\Andrey\\Downloads\\geosite.dat';
const outputPath = 'C:\\Users\\Andrey\\Downloads\\geosite-rebuilt.dat';

async function main() {
  console.log('Reading original file...');
  const original = fs.readFileSync(inputPath);
  console.log(`Original size: ${original.length} bytes`);

  console.log('Parsing...');
  const categories = await parseGeosite(original);
  console.log(`Parsed ${categories.length} categories`);

  // Show first few categories
  for (const cat of categories.slice(0, 5)) {
    console.log(`  ${cat.tag}: ${cat.domains.length} domains`);
  }

  console.log('Rebuilding...');
  const rebuilt = await buildGeosite(categories);
  console.log(`Rebuilt size: ${rebuilt.length} bytes`);

  fs.writeFileSync(outputPath, rebuilt);

  // Compare
  if (original.length === rebuilt.length) {
    const same = original.equals(rebuilt);
    if (same) {
      console.log('\n✓ Files are IDENTICAL (byte-for-byte match)');
    } else {
      // Find first difference
      for (let i = 0; i < original.length; i++) {
        if (original[i] !== rebuilt[i]) {
          console.log(`\n✗ Files differ at byte offset ${i}`);
          console.log(`  Original: ${original.slice(i, i + 20).toString('hex')}`);
          console.log(`  Rebuilt:  ${rebuilt.slice(i, i + 20).toString('hex')}`);
          break;
        }
      }
    }
  } else {
    console.log(`\n✗ Files differ in size: ${original.length} vs ${rebuilt.length} (diff: ${rebuilt.length - original.length})`);
    
    // Try to re-parse the rebuilt file to verify it's valid
    console.log('\nVerifying rebuilt file is parseable...');
    const reparsed = await parseGeosite(rebuilt);
    console.log(`Re-parsed ${reparsed.length} categories`);
    
    // Compare category counts
    let domainCountOrig = 0, domainCountRebuilt = 0;
    for (const cat of categories) domainCountOrig += cat.domains.length;
    for (const cat of reparsed) domainCountRebuilt += cat.domains.length;
    console.log(`Original total domains: ${domainCountOrig}`);
    console.log(`Rebuilt total domains: ${domainCountRebuilt}`);
    
    // Check if any data is lost
    let mismatches = 0;
    for (let i = 0; i < categories.length; i++) {
      const origCat = categories[i];
      const rebCat = reparsed[i];
      if (origCat.tag !== rebCat.tag) {
        console.log(`Category ${i}: tag mismatch ${origCat.tag} vs ${rebCat.tag}`);
        mismatches++;
      }
      if (origCat.domains.length !== rebCat.domains.length) {
        console.log(`Category ${origCat.tag}: domain count mismatch ${origCat.domains.length} vs ${rebCat.domains.length}`);
        mismatches++;
      }
    }
    if (mismatches === 0) {
      console.log('\n✓ All categories and domain counts match after re-parse (data integrity OK)');
    }
  }
}

main().catch(console.error);
