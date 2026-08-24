// Firestore(timecard-saas)の内容を毎日GitHubリポジトリにバックアップするスクリプト
// 認証不要（Firestoreルールがread:trueのため、GETのみ・書き込みは行わない）
import fs from 'fs';
import path from 'path';

const PROJECT_ID = 'timecard-saas';
const DOCS = ['data', 'config', 'users'];
const BASE_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/timecard`;

// Firestore REST の型付きフィールドをプレーンなJSに変換
function decodeValue(v) {
  if (v == null) return null;
  if ('stringValue' in v) return v.stringValue;
  if ('integerValue' in v) return parseInt(v.integerValue, 10);
  if ('doubleValue' in v) return v.doubleValue;
  if ('booleanValue' in v) return v.booleanValue;
  if ('nullValue' in v) return null;
  if ('timestampValue' in v) return v.timestampValue;
  if ('arrayValue' in v) return (v.arrayValue.values || []).map(decodeValue);
  if ('mapValue' in v) return decodeFields(v.mapValue.fields || {});
  return null;
}
function decodeFields(fields) {
  const out = {};
  for (const [k, v] of Object.entries(fields)) out[k] = decodeValue(v);
  return out;
}

async function fetchDoc(name) {
  const res = await fetch(`${BASE_URL}/${name}`);
  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error(`${name}: HTTP ${res.status}`);
  }
  const json = await res.json();
  return decodeFields(json.fields || {});
}

async function main() {
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD (UTC)
  const outDir = path.join('backups');
  fs.mkdirSync(outDir, { recursive: true });

  const snapshot = {};
  for (const docName of DOCS) {
    console.log(`Fetching timecard/${docName} ...`);
    snapshot[docName] = await fetchDoc(docName);
  }

  const outPath = path.join(outDir, `${today}.json`);
  fs.writeFileSync(outPath, JSON.stringify(snapshot, null, 0));
  const sizeKB = (fs.statSync(outPath).size / 1024).toFixed(1);
  console.log(`Wrote ${outPath} (${sizeKB} KB)`);

  // 90日より古い日次バックアップは削除（リポジトリ肥大化防止）
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 90);
  const files = fs.readdirSync(outDir).filter(f => /^\d{4}-\d{2}-\d{2}\.json$/.test(f));
  let removed = 0;
  for (const f of files) {
    const d = new Date(f.replace('.json', ''));
    if (d < cutoff) { fs.unlinkSync(path.join(outDir, f)); removed++; }
  }
  if (removed) console.log(`Removed ${removed} backups older than 90 days`);
}

main().catch(e => { console.error(e); process.exit(1); });
