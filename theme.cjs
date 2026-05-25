const fs = require('fs');
const path = require('path');

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace(/zinc-950/g, 'gray-50');
  content = content.replace(/zinc-900/g, 'white');
  content = content.replace(/zinc-800/g, 'gray-200');
  content = content.replace(/zinc-700/g, 'gray-300');
  content = content.replace(/zinc-600/g, 'gray-400');
  content = content.replace(/zinc-500/g, 'gray-500');
  content = content.replace(/zinc-400/g, 'gray-600');
  content = content.replace(/zinc-300/g, 'gray-700');
  content = content.replace(/zinc-100/g, 'gray-900');
  content = content.replace(/zinc-50/g, 'gray-900');
  fs.writeFileSync(filePath, content, 'utf8');
}

function walkDir(dir) {
  fs.readdirSync(dir).forEach(file => {
    let fullPath = path.join(dir, file);
    if (fs.lstatSync(fullPath).isDirectory()) {
      walkDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      replaceInFile(fullPath);
    }
  });
}

walkDir(path.join(__dirname, 'src'));
console.log('Theme updated to light mode!');
