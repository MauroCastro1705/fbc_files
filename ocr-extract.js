const fs = require("fs").promises;
const path = require("path");
const { createWorker } = require("tesseract.js");

const ROOT_DIR = __dirname;
const IMAGES_DIR = path.join(ROOT_DIR, "images");
const OUTPUT_DIR = path.join(ROOT_DIR, "ocr-output");
const SUPPORTED_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".tif", ".tiff", ".bmp", ".gif", ".avif"]);

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function listImages(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const results = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...await listImages(fullPath));
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (SUPPORTED_EXTENSIONS.has(ext)) {
        results.push(fullPath);
      }
    }
  }

  return results;
}

function outputJsonPath(imagePath) {
  const relativeFromImages = path.relative(IMAGES_DIR, imagePath);
  const outputRelative = `${relativeFromImages.replace(/\.png$/, "")}.json`;
  return path.join(OUTPUT_DIR, outputRelative);
}

function normalizeSlashes(value) {
  return value.replace(/\\/g, "/");
}

async function extractTextFromImage(worker, imagePath) {
  const relativePath = normalizeSlashes(path.relative(ROOT_DIR, imagePath));
  console.log(`
📄 Processing: ${relativePath}`);

  const { data: { text } } = await worker.recognize(imagePath, "eng");
  return text.trim();
}

async function saveResult(imagePath, text, error) {
  const outputPath = outputJsonPath(imagePath);
  const outputDir = path.dirname(outputPath);
  await ensureDir(outputDir);

  const payload = {
    imagePath: normalizeSlashes(path.relative(ROOT_DIR, imagePath)),
    extractedText: text || "",
    error: error ? String(error) : null,
    engine: "tesseract.js",
    language: "eng"
  };

  await fs.writeFile(outputPath, JSON.stringify(payload, null, 2), "utf8");
  console.log(`✅ Saved: ${normalizeSlashes(path.relative(ROOT_DIR, outputPath))}`);
}

async function main() {
  const exists = await fs.stat(IMAGES_DIR).catch(() => null);
  if (!exists || !exists.isDirectory()) {
    console.error(`ERROR: No images directory found at ${IMAGES_DIR}`);
    process.exit(1);
  }

  const imageFiles = await listImages(IMAGES_DIR);
  if (imageFiles.length === 0) {
    console.log("No supported images found in /images.");
    return;
  }

  console.log(`Found ${imageFiles.length} image${imageFiles.length !== 1 ? "s" : ""} to process.`);
  await ensureDir(OUTPUT_DIR);

  let worker;
  try {
    worker = await createWorker({
      logger: ({ status, progress }) => {
        if (status && progress != null) {
          process.stdout.write(`  ${status} ${(progress * 100).toFixed(0)}%\r`);
        }
      }
    });

    await worker.load();
    await worker.loadLanguage("eng");
    await worker.initialize("eng");

    for (const imagePath of imageFiles) {
      try {
        const text = await extractTextFromImage(worker, imagePath);
        await saveResult(imagePath, text, null);
      } catch (error) {
        console.error(`\n❌ OCR failed for ${imagePath}:`, error.message || error);
        await saveResult(imagePath, "", error);
      }
    }

    console.log(`\nFinished OCR extraction. JSON files are under: ${normalizeSlashes(path.relative(ROOT_DIR, OUTPUT_DIR))}`);
  } finally {
    if (worker && typeof worker.terminate === "function") {
      await worker.terminate();
    }
  }
}

main().catch(error => {
  console.error("Unexpected error:", error);
  process.exit(1);
});
