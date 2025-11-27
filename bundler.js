const fs = require('fs');
const path = require('path');

const output = 'front-context.txt';
const dirsToIgnore = ['node_modules', '.git', 'dist', '.angular', 'coverage', '.vscode', '.idea'];
const extensionsToInclude = ['.ts', '.js', '.html', '.scss', '.css', '.json'];

function getAllFiles(dirPath, arrayOfFiles) {
  const files = fs.readdirSync(dirPath);
  arrayOfFiles = arrayOfFiles || [];

  files.forEach(function(file) {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (!dirsToIgnore.includes(file)) {
        arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
      }
    } else {
      if (extensionsToInclude.includes(path.extname(file))) {
        arrayOfFiles.push(fullPath);
      }
    }
  });
  return arrayOfFiles;
}

async function bundle() {
  try {
    const files = getAllFiles(__dirname);
    const stream = fs.createWriteStream(output, { flags: 'w' });

    console.log(`Analizando proyecto Angular...`);
    console.log(`Procesando ${files.length} archivos...`);

    for (const filePath of files) {
      if (filePath.includes('bundler.js') || filePath.includes(output) || filePath.includes('package-lock.json')) continue;

      const relativePath = path.relative(__dirname, filePath);
      const content = fs.readFileSync(filePath, 'utf8');

      stream.write(`\n\n--- START OF FILE: ${relativePath} ---\n`);
      stream.write(content);
      stream.write(`\n--- END OF FILE: ${relativePath} ---\n`);
    }

    stream.end();
    console.log(`Éxito. Archivo generado: ${output}`);
  } catch (error) {
    console.error("Error generando el bundle:", error);
  }
}

bundle();