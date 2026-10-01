/**
 * AegisVault Cryptographic Engine
 * Provides End-to-End Encryption (AES-256-GCM), PBKDF2 Key Derivation,
 * SHA-256 Checksums, and DoD 5220.22-M Secure Wipe.
 * Matches the specification in python_core/aegis_crypto.py.
 */

export interface VaultFile {
  id: string;
  name: string;
  size: number;
  type: string;
  originalHash: string; // SHA-256 of plain data
  encryptedHash?: string; // SHA-256 of encrypted container
  status: 'encrypted' | 'decrypted' | 'tampered' | 'verified';
  createdAt: number;
  encryptedAt?: number;
  plainData?: Uint8Array;
  encryptedData?: Uint8Array;
  downloadUrl?: string;
  previewUrl?: string;
}

const MAGIC_BYTES = new TextEncoder().encode("AEGIS_V1"); // 8 bytes
const PBKDF2_ITERATIONS = 600000;

// Convert Uint8Array to hex string
export function bufferToHex(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Convert hex string to Uint8Array
export function hexToBuffer(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

// Compute SHA-256 hash of a buffer
export async function computeSHA256(data: Uint8Array | ArrayBuffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', data as unknown as BufferSource);
  return bufferToHex(hashBuffer);
}

// Derive AES-GCM 256-bit key from passphrase and salt using PBKDF2
export async function deriveKeyFromPassword(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as unknown as BufferSource,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    passwordKey,
    {
      name: 'AES-GCM',
      length: 256,
    },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt a plain file into an .aegis binary package
 * Format:
 * [MAGIC: 8B] [SALT: 16B] [IV: 12B] [SHA256: 32B] [META_LEN: 4B] [META_JSON: NB] [CIPHERTEXT + TAG: REST]
 */
export async function encryptFileBuffer(
  fileData: Uint8Array,
  fileName: string,
  mimeType: string,
  passphrase: string
): Promise<{
  encryptedContainer: Uint8Array;
  originalHash: string;
  encryptedHash: string;
}> {
  const originalHashHex = await computeSHA256(fileData);
  const originalHashBytes = hexToBuffer(originalHashHex);

  // Generate cryptographic salt (16 bytes) and IV (12 bytes)
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));

  // Derive AES-256 key
  const key = await deriveKeyFromPassword(passphrase, salt);

  // Prepare metadata
  const metadata = JSON.stringify({
    name: fileName,
    type: mimeType || 'application/octet-stream',
    timestamp: Date.now(),
    version: '1.0',
    cipher: 'AES-256-GCM',
  });
  const metadataBytes = new TextEncoder().encode(metadata);
  const metaLenBytes = new Uint8Array(4);
  new DataView(metaLenBytes.buffer).setUint32(0, metadataBytes.length, false);

  // Encrypt file payload using AES-256-GCM
  const ciphertextBuffer = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv as unknown as BufferSource,
      additionalData: originalHashBytes as unknown as BufferSource, // Authenticate original hash
      tagLength: 128,
    },
    key,
    fileData as unknown as BufferSource
  );

  const ciphertext = new Uint8Array(ciphertextBuffer);

  // Combine into single binary payload
  const totalLength =
    MAGIC_BYTES.length +
    salt.length +
    iv.length +
    originalHashBytes.length +
    metaLenBytes.length +
    metadataBytes.length +
    ciphertext.length;

  const container = new Uint8Array(totalLength);
  let offset = 0;

  container.set(MAGIC_BYTES, offset);
  offset += MAGIC_BYTES.length;

  container.set(salt, offset);
  offset += salt.length;

  container.set(iv, offset);
  offset += iv.length;

  container.set(originalHashBytes, offset);
  offset += originalHashBytes.length;

  container.set(metaLenBytes, offset);
  offset += metaLenBytes.length;

  container.set(metadataBytes, offset);
  offset += metadataBytes.length;

  container.set(ciphertext, offset);

  const encryptedHash = await computeSHA256(container);

  return {
    encryptedContainer: container,
    originalHash: originalHashHex,
    encryptedHash: encryptedHash,
  };
}

/**
 * Decrypt an .aegis binary package
 */
export async function decryptFileBuffer(
  container: Uint8Array,
  passphrase: string
): Promise<{
  plainData: Uint8Array;
  fileName: string;
  mimeType: string;
  originalHash: string;
}> {
  // Check minimum length
  const minLen = 8 + 16 + 12 + 32 + 4 + 16;
  if (container.length < minLen) {
    throw new Error('Định dạng tệp không hợp lệ: tệp quá nhỏ so với tiêu chuẩn AegisVault.');
  }

  // Check magic bytes
  for (let i = 0; i < MAGIC_BYTES.length; i++) {
    if (container[i] !== MAGIC_BYTES[i]) {
      throw new Error('Mã định danh không hợp lệ: Đây không phải là tệp mã hóa .aegis.');
    }
  }

  let offset = 8;
  const salt = container.slice(offset, offset + 16);
  offset += 16;

  const iv = container.slice(offset, offset + 12);
  offset += 12;

  const originalHashBytes = container.slice(offset, offset + 32);
  const originalHashHex = bufferToHex(originalHashBytes);
  offset += 32;

  const metaLen = new DataView(container.buffer, container.byteOffset + offset, 4).getUint32(0, false);
  offset += 4;

  const metadataBytes = container.slice(offset, offset + metaLen);
  offset += metaLen;

  let metadata: { name: string; type: string } = { name: 'decrypted_file', type: 'application/octet-stream' };
  try {
    metadata = JSON.parse(new TextDecoder().decode(metadataBytes));
  } catch (e) {
    // fallback if metadata parsing fails
  }

  const ciphertext = container.slice(offset);

  // Derive AES-256 key with PBKDF2
  const key = await deriveKeyFromPassword(passphrase, salt);

  try {
    const plainBuffer = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv as unknown as BufferSource,
        additionalData: originalHashBytes as unknown as BufferSource,
        tagLength: 128,
      },
      key,
      ciphertext as unknown as BufferSource
    );

    const plainData = new Uint8Array(plainBuffer);

    // Verify hash integrity of decrypted output
    const computedHash = await computeSHA256(plainData);
    if (computedHash.toLowerCase() !== originalHashHex.toLowerCase()) {
      throw new Error('Cảnh báo: Dữ liệu đã bị giả mạo! Hash giải mã không khớp với chứng thực ban đầu.');
    }

    return {
      plainData,
      fileName: metadata.name || 'unlocked_file',
      mimeType: metadata.type || 'application/octet-stream',
      originalHash: originalHashHex,
    };
  } catch (err: any) {
    if (err.message && err.message.includes('giả mạo')) {
      throw err;
    }
    throw new Error('Sai mật khẩu chủ hoặc dữ liệu tệp tin đã bị can thiệp trái phép (Authentication Tag Failed).');
  }
}

/**
 * DoD 5220.22-M 3-Pass Secure Wipe Algorithm
 * Pass 1: Overwrite with all 0x00
 * Pass 2: Overwrite with all 0xFF
 * Pass 3: Overwrite with cryptographically secure random bytes
 */
export async function secureShredBuffer(
  buffer: Uint8Array,
  onProgress?: (pass: number, percent: number) => void
): Promise<void> {
  const len = buffer.length;
  
  // Pass 1: 0x00
  buffer.fill(0x00);
  if (onProgress) onProgress(1, 33);
  await new Promise(r => setTimeout(r, 60));

  // Pass 2: 0xFF
  buffer.fill(0xFF);
  if (onProgress) onProgress(2, 66);
  await new Promise(r => setTimeout(r, 60));

  // Pass 3: Random bytes in chunks
  const chunkSize = 65536;
  for (let i = 0; i < len; i += chunkSize) {
    const size = Math.min(chunkSize, len - i);
    const randomChunk = crypto.getRandomValues(new Uint8Array(size));
    buffer.set(randomChunk, i);
  }
  if (onProgress) onProgress(3, 100);
}

// Generate 12-word BIP-39 mnemonic list
const BIP39_WORDS = [
  "abandon", "ability", "able", "about", "above", "absent", "absorb", "abstract", "absurd", "abuse",
  "access", "accident", "account", "accuse", "achieve", "acid", "acoustic", "acquire", "across", "act",
  "action", "actor", "actress", "actual", "adapt", "add", "addict", "address", "adjust", "admit",
  "adult", "advance", "advice", "aerobic", "affair", "afford", "afraid", "again", "age", "agent",
  "agree", "ahead", "aim", "air", "airport", "aisle", "alarm", "album", "alcohol", "alert",
  "alien", "all", "alley", "allow", "almost", "alone", "alpha", "already", "also", "alter",
  "always", "amateur", "amazing", "among", "amount", "amused", "analyst", "anchor", "ancient", "anger",
  "angle", "angry", "animal", "ankle", "announce", "annual", "another", "answer", "antenna", "antique",
  "anxiety", "any", "apart", "apology", "appear", "apple", "approve", "april", "arch", "arctic",
  "area", "arena", "argue", "arm", "armed", "armor", "army", "around", "arrange", "arrest",
  "arrive", "arrow", "art", "artefact", "artist", "artwork", "ask", "aspect", "assault", "asset",
  "assist", "assume", "asthma", "athlete", "atom", "attack", "attend", "attitude", "attract", "auction"
];

export function generateRecoveryPhrase(): string[] {
  const phrase: string[] = [];
  const randomIndices = crypto.getRandomValues(new Uint32Array(12));
  for (let i = 0; i < 12; i++) {
    const word = BIP39_WORDS[randomIndices[i] % BIP39_WORDS.length];
    phrase.push(word);
  }
  return phrase;
}
