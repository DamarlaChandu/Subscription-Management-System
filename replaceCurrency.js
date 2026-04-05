const fs = require('fs');
const path = require('path');

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;
  
  // We need to avoid breaking template literals `${...}` and mongo operators `$set`, etc.
  // And avoid breaking literal $ variables if any. 
  // Let's replace `$ ` with `₹ `
  // Let's replace `>$` with `>₹`
  // Let's replace `\n$` with `\n₹`
  // Let's replace `value: '$'` with `value: '₹'`
  // Let's replace `Fixed ($)` with `Fixed (₹)`
  
  content = content.replace(/'\$'/g, "'₹'");
  content = content.replace(/"\$"/g, '"₹"');
  content = content.replace(/>\$/g, '>₹');
  content = content.replace(/ \$/g, ' ₹');
  content = content.replace(/\(\$/g, '(₹');
  content = content.replace(/:\s*'\$/g, ": '₹");
  content = content.replace(/`\$/g, '`₹');

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Updated:', filePath);
  }
}

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      replaceInFile(fullPath);
    }
  }
}

processDirectory('./app/dashboard');
processDirectory('./components');
console.log('Currency replacement complete.');
