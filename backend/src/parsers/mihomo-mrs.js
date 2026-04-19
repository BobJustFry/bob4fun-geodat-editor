import { execFile } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const execFileAsync = promisify(execFile);
const TMP_DIR = process.env.TMP_DIR || '/tmp/geodat';
const MIHOMO_BIN = process.env.MIHOMO_BIN || 'mihomo';

/**
 * Parse MRS file to text list of domains or CIDRs.
 * Uses mihomo CLI: convert-ruleset <behavior> mrs <input.mrs> <output.txt>
 * But mihomo only converts TO mrs, not FROM.
 * So we read the MRS binary directly and convert to text using mihomo.
 */

/**
 * Convert MRS binary to text list using mihomo.
 * mihomo convert-ruleset <behavior> mrs <source.mrs> <target.txt>
 * Actually, mihomo converts FROM text/yaml TO mrs.
 * For reading MRS back to text, we parse it ourselves or use mrs->text.
 * 
 * Looking at the mihomo source, ConvertToMrs with format=MrsRule exports to text.
 * But the CLI only converts TO .mrs.
 * 
 * We'll parse MRS manually: zstd decompress, then read binary format.
 */

import zlib from 'zlib';

/**
 * Parse MRS to text by calling mihomo convert-ruleset with mrs format as input.
 * Since mihomo CLI doesn't support mrs->text directly, we handle this via
 * the REST API approach: we store the raw rules as text.
 * 
 * For now: MRS files are parsed by extracting the behavior info from header,
 * and then we provide a "download as MRS" by converting text->mrs via mihomo.
 */

/**
 * Convert text list to MRS binary using mihomo CLI.
 * @param {string} text - newline-separated list of domains or CIDRs
 * @param {'domain'|'ipcidr'} behavior 
 * @returns {Promise<Buffer>} MRS binary
 */
export async function textToMrs(text, behavior) {
  const workDir = path.join(TMP_DIR, uuidv4());
  fs.mkdirSync(workDir, { recursive: true });

  const inputFile = path.join(workDir, 'input.txt');
  const outputFile = path.join(workDir, 'output.mrs');

  try {
    fs.writeFileSync(inputFile, text, 'utf-8');
    await execFileAsync(MIHOMO_BIN, [
      'convert-ruleset', behavior, 'text', inputFile, outputFile
    ], { timeout: 30000 });
    return fs.readFileSync(outputFile);
  } finally {
    fs.rmSync(workDir, { recursive: true, force: true });
  }
}

/**
 * Convert MRS binary to text list.
 * Uses mihomo convert-ruleset with mrs format which exports to text.
 * @param {Buffer} mrsBuffer 
 * @param {'domain'|'ipcidr'} behavior 
 * @returns {Promise<string>} newline-separated text
 */
export async function mrsToText(mrsBuffer, behavior) {
  const workDir = path.join(TMP_DIR, uuidv4());
  fs.mkdirSync(workDir, { recursive: true });

  const inputFile = path.join(workDir, 'input.mrs');
  const outputFile = path.join(workDir, 'output.txt');

  try {
    fs.writeFileSync(inputFile, mrsBuffer);
    // mihomo convert-ruleset <behavior> mrs <source.mrs> <target.txt>
    // When source is mrs and format is mrs, it exports to text
    await execFileAsync(MIHOMO_BIN, [
      'convert-ruleset', behavior, 'mrs', inputFile, outputFile
    ], { timeout: 30000 });
    return fs.readFileSync(outputFile, 'utf-8');
  } finally {
    fs.rmSync(workDir, { recursive: true, force: true });
  }
}

/**
 * Detect MRS behavior from the binary header.
 * Format: zstd( MRS\x01 + behavior(1 byte) + ... )
 * behavior: 0 = domain, 1 = ipcidr
 * @param {Buffer} mrsBuffer 
 * @returns {Promise<{behavior: string, count: number}>}
 */
export async function detectMrsBehavior(mrsBuffer) {
  // We need to decompress just the header
  // Use Node.js zstd or exec a tool
  // For simplicity, read the first bytes after zstd decompression
  const { execSync } = await import('child_process');
  const workDir = path.join(TMP_DIR, uuidv4());
  fs.mkdirSync(workDir, { recursive: true });

  try {
    const inputFile = path.join(workDir, 'input.mrs');
    fs.writeFileSync(inputFile, mrsBuffer);

    // Use python to decompress zstd and read header
    const script = `
import zstandard, struct, sys, json
data = open(sys.argv[1], 'rb').read()
dctx = zstandard.ZstdDecompressor()
dec = dctx.decompress(data)
magic = dec[:4]
if magic != b'MRS\\x01':
    print(json.dumps({"error": "invalid magic"}))
    sys.exit(0)
behavior_byte = dec[4]
count = struct.unpack('>q', dec[5:13])[0]
behavior = "domain" if behavior_byte == 0 else "ipcidr"
print(json.dumps({"behavior": behavior, "count": count}))
`;
    const pyFile = path.join(workDir, 'detect.py');
    fs.writeFileSync(pyFile, script);
    const result = execSync(`python3 "${pyFile}" "${inputFile}"`, {
      timeout: 5000,
      encoding: 'utf-8'
    }).trim();
    return JSON.parse(result);
  } finally {
    fs.rmSync(workDir, { recursive: true, force: true });
  }
}
