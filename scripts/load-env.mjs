/**
 * Carga variables desde process.env, front/.env y back/.env (mismo orden que set-env.js).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FRONT_ROOT = path.resolve(__dirname, '..');
const REPO_ROOT = path.resolve(FRONT_ROOT, '..');

const URL_KEYS = ['SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_URL'];
const ANON_KEYS = [
  'SUPABASE_ANON_KEY',
  'SUPABASE_KEY',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
  'SUPABASE_PUBLISHABLE_KEY',
];

function parseDotenv(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const out = {};
  for (const line of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

let merged = null;

export function loadEnv() {
  if (merged) return merged;
  const sources = [
    path.join(FRONT_ROOT, '.env'),
    path.join(REPO_ROOT, 'back', '.env'),
  ];
  merged = sources.reduce((acc, file) => ({ ...parseDotenv(file), ...acc }), {});
  return merged;
}

function resolve(keys) {
  loadEnv();
  for (const k of keys) {
    const v = process.env[k]?.trim();
    if (v) return v;
  }
  for (const k of keys) {
    const v = merged[k]?.trim();
    if (v) return v;
  }
  return undefined;
}

export function envOrThrow(name, aliases = []) {
  const keys = [name, ...aliases];
  const value = resolve(keys);
  if (!value) {
    throw new Error(
      `Falta la variable de entorno ${name}. Defínela en el shell o en front/.env / back/.env`
    );
  }
  return value;
}

export function getSupabasePublicConfig() {
  return {
    url: envOrThrow('SUPABASE_URL', URL_KEYS.filter((k) => k !== 'SUPABASE_URL')),
    anonKey: envOrThrow('SUPABASE_ANON_KEY', ANON_KEYS.filter((k) => k !== 'SUPABASE_ANON_KEY')),
  };
}

export function projectRefFromUrl(url) {
  const match = url.match(/^https:\/\/([^.]+)\.supabase\.co\/?$/);
  if (!match) {
    throw new Error(`SUPABASE_URL no válida: ${url}`);
  }
  return match[1];
}
