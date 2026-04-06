/**
 * generate-index.js
 * Escanea la carpeta `images/` y genera `index.json` con la estructura de carpetas e imágenes.
 * 
 * USO:
 *   node generate-index.js
 *
 * REQUISITOS:
 *   Node.js instalado. No necesita dependencias externas.
 *
 * ESTRUCTURA ESPERADA:
 *   images/
 *     Categoria A/
 *       imagen1.png
 *       imagen2.png
 *     Categoria B/
 *       foto.png
 */

const fs   = require("fs");
const path = require("path");

const IMAGES_DIR  = path.join(__dirname, "images");
const OUTPUT_FILE = path.join(__dirname, "index.json");
const EXTENSIONS  = new Set([".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg"]);

function slugify(name) {
  return name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9\-_]/g, "");
}

function scanFolder() {
  if (!fs.existsSync(IMAGES_DIR)) {
    console.error(`❌  No existe la carpeta: ${IMAGES_DIR}`);
    console.error(`    Creá la carpeta "images/" junto a este script y poné tus subcarpetas adentro.`);
    process.exit(1);
  }

  const categories = [];
  const entries = fs.readdirSync(IMAGES_DIR, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const catName = entry.name;
    const catPath = path.join(IMAGES_DIR, catName);
    const files   = fs.readdirSync(catPath, { withFileTypes: true });

    const images = files
      .filter(f => f.isFile() && EXTENSIONS.has(path.extname(f.name).toLowerCase()))
      .map(f => ({
        name: path.parse(f.name).name,          // nombre sin extensión
        file: f.name,                            // nombre completo con extensión
        path: `images/${catName}/${f.name}`,     // ruta relativa desde index.html
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    if (images.length === 0) continue; // ignorar carpetas vacías

    categories.push({
      id:     slugify(catName),
      name:   catName,
      count:  images.length,
      images,
    });
  }

  categories.sort((a, b) => a.name.localeCompare(b.name));

  const output = {
    generated: new Date().toISOString(),
    totalImages: categories.reduce((sum, c) => sum + c.count, 0),
    categories,
  };

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2), "utf8");

  console.log(`✅  index.json generado`);
  console.log(`    Categorías : ${categories.length}`);
  console.log(`    Imágenes   : ${output.totalImages}`);
  console.log(`    Archivo    : ${OUTPUT_FILE}`);
}

scanFolder();
