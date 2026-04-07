const fs = require("fs").promises;
const path = require("path");
const translatte = require("translatte");

const ROOT_DIR = __dirname;
const OCR_DIR = path.join(ROOT_DIR, "ocr-output");
const ES_DIR = path.join(ROOT_DIR, "ocr-output-es");
const SUPPORTED_EXTENSIONS = new Set([".json"]);
const DELAY_MS = 1000; // Delay between requests
const MAX_RETRIES = 3;

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function listJsonFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const results = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...await listJsonFiles(fullPath));
    } else if (entry.isFile() && SUPPORTED_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
      results.push(fullPath);
    }
  }

  return results;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function translateWithRetry(text, attempts = 1) {
  try {
    const result = await translatte(text, { from: "en", to: "es" });
    return { text: result.text };
  } catch (error) {
    const message = String(error.message || error);
    if (attempts < MAX_RETRIES) {
      console.warn(`Translation failed, retrying in ${DELAY_MS}ms... (${attempts}/${MAX_RETRIES}): ${message}`);
      await sleep(DELAY_MS * attempts);
      return translateWithRetry(text, attempts + 1);
    }
    throw error;
  }
}

async function translateJsonFile(filePath, force = false) {
  const raw = await fs.readFile(filePath, "utf8");
  const data = JSON.parse(raw);

  // Compute output path
  const relativePath = path.relative(OCR_DIR, filePath);
  const esFilePath = path.join(ES_DIR, relativePath);

  if (!force) {
    try {
      await fs.access(esFilePath);
      console.log(`Skipping (already translated): ${path.relative(ROOT_DIR, esFilePath)}`);
      return;
    } catch {
      // File does not exist, proceed
    }
  }

  if (!data.extractedText || !data.extractedText.trim()) {
    console.log(`Skipping (no extracted text): ${path.relative(ROOT_DIR, filePath)}`);
    return;
  }

  console.log(`Translating: ${path.relative(ROOT_DIR, filePath)}`);
  const translated = await translateWithRetry(data.extractedText);

  // Create translated JSON with same structure as original
  const translatedData = {
    ...data,
    translatedText: translated.text,
    translationEngine: "translatte",
    translationDate: new Date().toISOString()
  };

  await ensureDir(path.dirname(esFilePath));

  await fs.writeFile(esFilePath, JSON.stringify(translatedData, null, 2), "utf8");
  console.log(`Saved Spanish file: ${path.relative(ROOT_DIR, esFilePath)}`);
}

async function main() {
  const args = process.argv.slice(2);
  const force = args.includes("--force");
  const fileArg = args.find(arg => arg.startsWith("--file="));
  const onlyFile = fileArg ? path.resolve(ROOT_DIR, fileArg.replace("--file=", "")) : null;
  const exists = await fs.stat(OCR_DIR).catch(() => null);
  if (!exists || !exists.isDirectory()) {
    console.error(`ERROR: No OCR output directory found at ${OCR_DIR}`);
    process.exit(1);
  }

  const files = onlyFile ? [onlyFile] : await listJsonFiles(OCR_DIR);
  if (files.length === 0) {
    console.log("No OCR JSON files found.");
    return;
  }

  console.log(`Found ${files.length} OCR JSON file${files.length !== 1 ? "s" : ""}.`);

  // Ensure output directory exists
  await ensureDir(ES_DIR);

  for (const filePath of files) {
    try {
      await translateJsonFile(filePath, force);
    } catch (error) {
      console.error(`Failed to translate ${filePath}:`, error.message || error);
    }
    await sleep(DELAY_MS);
  }

  console.log("Translation pass complete.");
}

main().catch(error => {
  console.error("Unexpected error:", error);
  process.exit(1);
});