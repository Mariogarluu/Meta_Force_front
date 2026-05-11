#!/usr/bin/env node

/**
 * Auditoría básica de ficheros i18n (es/en/fr).
 *
 * - Verifica que las tres traducciones comparten el mismo conjunto de claves.
 * - Comprueba que los placeholders {{var}} coinciden en los tres idiomas.
 * - Señala cadenas sospechosas (cuando el valor es igual a la clave).
 */

import fs from "node:fs";
import path from "node:path";

// Partimos del directorio del proyecto front (..) desde scripts/
const SCRIPT_DIR = path.dirname(new URL(import.meta.url).pathname.replace(/^\/+/, ""));
const ROOT = path.resolve(path.join(SCRIPT_DIR, ".."));
const I18N_DIR = path.join(ROOT, "public", "assets", "i18n");

const files = {
  es: path.join(I18N_DIR, "es.json"),
  en: path.join(I18N_DIR, "en.json"),
  fr: path.join(I18N_DIR, "fr.json"),
};

function readJson(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  return JSON.parse(raw);
}

function flatten(obj, prefix = "") {
  const out = {};
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === "object" && !Array.isArray(value)) {
      Object.assign(out, flatten(value, fullKey));
    } else {
      out[fullKey] = value;
    }
  }
  return out;
}

function extractPlaceholders(str) {
  if (typeof str !== "string") return [];
  const re = /\{\{([^}]+)\}\}/g;
  const result = [];
  let match;
  while ((match = re.exec(str)) !== null) {
    result.push(match[1].trim());
  }
  return result.sort();
}

function main() {
  console.log("== Meta-Force i18n audit ==");
  console.log("Root:", ROOT);

  const es = flatten(readJson(files.es));
  const en = flatten(readJson(files.en));
  const fr = flatten(readJson(files.fr));

  const allKeys = new Set([...Object.keys(es), ...Object.keys(en), ...Object.keys(fr)]);

  const missing = [];
  const placeholderMismatches = [];
  const suspicious = [];

  for (const key of allKeys) {
    const vEs = es[key];
    const vEn = en[key];
    const vFr = fr[key];

    if (vEs === undefined || vEn === undefined || vFr === undefined) {
      missing.push({
        key,
        es: vEs === undefined,
        en: vEn === undefined,
        fr: vFr === undefined,
      });
    }

    const phEs = extractPlaceholders(vEs);
    const phEn = extractPlaceholders(vEn);
    const phFr = extractPlaceholders(vFr);

    const phKey = JSON.stringify({ es: phEs, en: phEn, fr: phFr });
    if (
      JSON.stringify(phEs) !== JSON.stringify(phEn) ||
      JSON.stringify(phEs) !== JSON.stringify(phFr)
    ) {
      placeholderMismatches.push({
        key,
        es: phEs,
        en: phEn,
        fr: phFr,
      });
    }

    // Cadena sospechosa: valor idéntico a la clave (p.ej. "home.title": "home.title")
    if (typeof vEs === "string" && vEs === key) {
      suspicious.push({ locale: "es", key, value: vEs });
    }
    if (typeof vEn === "string" && vEn === key) {
      suspicious.push({ locale: "en", key, value: vEn });
    }
    if (typeof vFr === "string" && vFr === key) {
      suspicious.push({ locale: "fr", key, value: vFr });
    }
  }

  console.log("\n-- Claves faltantes --");
  if (!missing.length) {
    console.log("OK: no se han encontrado claves faltantes entre es/en/fr.");
  } else {
    for (const m of missing) {
      console.log(
        `key="${m.key}" faltante en: ${[
          m.es ? "es" : null,
          m.en ? "en" : null,
          m.fr ? "fr" : null,
        ]
          .filter(Boolean)
          .join(", ")}`,
      );
    }
  }

  console.log("\n-- Placeholders {{var}} inconsistentes --");
  if (!placeholderMismatches.length) {
    console.log("OK: todos los placeholders coinciden entre es/en/fr.");
  } else {
    for (const p of placeholderMismatches) {
      console.log(
        `key="${p.key}" es=${JSON.stringify(p.es)} en=${JSON.stringify(p.en)} fr=${JSON.stringify(
          p.fr,
        )}`,
      );
    }
  }

  console.log("\n-- Cadenas sospechosas (valor == clave) --");
  if (!suspicious.length) {
    console.log("OK: no se han encontrado valores sospechosos.");
  } else {
    for (const s of suspicious) {
      console.log(`locale=${s.locale} key="${s.key}" value="${s.value}"`);
    }
  }

  console.log("\nFin de la auditoría i18n.");
}

main();

