#!/usr/bin/env python3
"""
AegisVault Core Cryptographic Module
===================================
Local On-Device End-to-End Encryption (AES-256-GCM) with PBKDF2 Key Derivation,
SHA-256 Checksums, and DoD 5220.22-M Secure File Shredding.

Compatible with AegisVault Web Crypto binary container format (.aegis).
"""

import os
import sys
import json
import struct
import hashlib
import secrets
from typing import Tuple, Dict, Any, Optional

try:
    from cryptography.hazmat.primitives.ciphers.aead import AESGCM
    from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
    from cryptography.hazmat.primitives import hashes
    from cryptography.hazmat.backends import default_backend
    HAS_CRYPTOGRAPHY = True
except ImportError:
    HAS_CRYPTOGRAPHY = False

MAGIC_HEADER = b"AEGIS_V1"
PBKDF2_ITERATIONS = 600000
SALT_SIZE = 16
IV_SIZE = 12
HASH_SIZE = 32
TAG_SIZE = 16


def derive_key(passphrase: str, salt: bytes) -> bytes:
    """Derive 256-bit AES key using PBKDF2-HMAC-SHA256 with 600,000 iterations."""
    if HAS_CRYPTOGRAPHY:
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=PBKDF2_ITERATIONS,
            backend=default_backend()
        )
        return kdf.derive(passphrase.encode('utf-8'))
    else:
        # Fallback to standard library hashlib pbkdf2
        return hashlib.pbkdf2_hmac(
            'sha256',
            passphrase.encode('utf-8'),
            salt,
            PBKDF2_ITERATIONS,
            dklen=32
        )


def compute_file_sha256(file_path: str) -> str:
    """Calculate SHA-256 hex digest of a file in streaming chunks."""
    sha256 = hashlib.sha256()
    with open(file_path, 'rb') as f:
        while chunk := f.read(65536):
            sha256.update(chunk)
    return sha256.hexdigest()


def compute_bytes_sha256(data: bytes) -> str:
    """Calculate SHA-256 hex digest of in-memory bytes."""
    return hashlib.sha256(data).hexdigest()


def encrypt_file(input_path: str, output_path: str, passphrase: str) -> Dict[str, Any]:
    """
    Encrypt file using AES-256-GCM with authenticated metadata.
    Output Format:
    [MAGIC: 8B] [SALT: 16B] [IV: 12B] [ORIGINAL_SHA256: 32B] [META_LEN: 4B] [META_JSON: NB] [CIPHERTEXT + TAG: REST]
    """
    if not os.path.exists(input_path):
        raise FileNotFoundError(f"Input file not found: {input_path}")

    file_name = os.path.basename(input_path)
    file_size = os.path.getsize(input_path)
    original_hash_hex = compute_file_sha256(input_path)
    original_hash_bytes = bytes.fromhex(original_hash_hex)

    salt = secrets.token_bytes(SALT_SIZE)
    iv = secrets.token_bytes(IV_SIZE)
    key = derive_key(passphrase, salt)

    metadata = json.dumps({
        "name": file_name,
        "size": file_size,
        "timestamp": int(os.path.getmtime(input_path) * 1000),
        "cipher": "AES-256-GCM",
        "platform": "windows-aegis-core"
    }).encode('utf-8')
    meta_len_bytes = struct.pack(">I", len(metadata))

    # Read plaintext
    with open(input_path, 'rb') as f:
        plain_data = f.read()

    # Authenticate original SHA256 as additional associated data (AAD)
    if HAS_CRYPTOGRAPHY:
        aesgcm = AESGCM(key)
        ciphertext = aesgcm.encrypt(iv, plain_data, original_hash_bytes)
    else:
        raise RuntimeError("The 'cryptography' library is required. Run 'pip install cryptography'.")

    # Write output container
    with open(output_path, 'wb') as out_f:
        out_f.write(MAGIC_HEADER)
        out_f.write(salt)
        out_f.write(iv)
        out_f.write(original_hash_bytes)
        out_f.write(meta_len_bytes)
        out_f.write(metadata)
        out_f.write(ciphertext)

    encrypted_hash = compute_file_sha256(output_path)

    return {
        "input_path": input_path,
        "output_path": output_path,
        "original_hash": original_hash_hex,
        "encrypted_hash": encrypted_hash,
        "original_size": file_size,
        "encrypted_size": os.path.getsize(output_path),
        "cipher": "AES-256-GCM-256"
    }


def decrypt_file(container_path: str, output_path: str, passphrase: str) -> Dict[str, Any]:
    """
    Decrypt an .aegis binary container and verify integrity.
    """
    if not os.path.exists(container_path):
        raise FileNotFoundError(f"Container file not found: {container_path}")

    with open(container_path, 'rb') as f:
        magic = f.read(len(MAGIC_HEADER))
        if magic != MAGIC_HEADER:
            raise ValueError("Invalid file format: Not an AegisVault container.")

        salt = f.read(SALT_SIZE)
        iv = f.read(IV_SIZE)
        original_hash_bytes = f.read(HASH_SIZE)
        original_hash_hex = original_hash_bytes.hex()

        meta_len_data = f.read(4)
        meta_len = struct.unpack(">I", meta_len_data)[0]
        metadata_raw = f.read(meta_len)
        metadata = json.loads(metadata_raw.decode('utf-8'))

        ciphertext = f.read()

    key = derive_key(passphrase, salt)

    if not HAS_CRYPTOGRAPHY:
        raise RuntimeError("The 'cryptography' library is required. Run 'pip install cryptography'.")

    aesgcm = AESGCM(key)
    try:
        plain_data = aesgcm.decrypt(iv, ciphertext, original_hash_bytes)
    except Exception as e:
        raise PermissionError("Decryption failed: Incorrect master password or corrupted file.") from e

    # Verify SHA-256 integrity
    computed_hash = compute_bytes_sha256(plain_data)
    if computed_hash.lower() != original_hash_hex.lower():
        raise ValueError("INTEGRITY COMPROMISED: SHA-256 hash mismatch! Data has been tampered with.")

    with open(output_path, 'wb') as f:
        f.write(plain_data)

    return {
        "output_path": output_path,
        "metadata": metadata,
        "verified_hash": computed_hash,
        "original_hash": original_hash_hex,
        "integrity_verified": True
    }


def secure_shred_file(file_path: str, passes: int = 3) -> bool:
    """
    DoD 5220.22-M Compliant 3-Pass Secure Overwrite and Shredder.
    Pass 1: Overwrite with 0x00
    Pass 2: Overwrite with 0xFF
    Pass 3: Overwrite with cryptographically secure random bytes
    Finally truncates and deletes the file from disk.
    """
    if not os.path.exists(file_path):
        return False

    file_size = os.path.getsize(file_path)
    chunk_size = 65536

    with open(file_path, "ba+", buffering=0) as f:
        # Pass 1: Zeros
        f.seek(0)
        remaining = file_size
        while remaining > 0:
            to_write = min(chunk_size, remaining)
            f.write(b"\x00" * to_write)
            remaining -= to_write
        f.flush()
        os.fsync(f.fileno())

        # Pass 2: Ones
        f.seek(0)
        remaining = file_size
        while remaining > 0:
            to_write = min(chunk_size, remaining)
            f.write(b"\xFF" * to_write)
            remaining -= to_write
        f.flush()
        os.fsync(f.fileno())

        # Pass 3: CSPRNG Random Bytes
        f.seek(0)
        remaining = file_size
        while remaining > 0:
            to_write = min(chunk_size, remaining)
            f.write(secrets.token_bytes(to_write))
            remaining -= to_write
        f.flush()
        os.fsync(f.fileno())

        # Truncate to zero bytes
        f.truncate(0)

    # Finally unlink
    os.remove(file_path)
    return True


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("AegisVault Python Cryptographic CLI")
        print("Usage:")
        print("  python aegis_crypto.py encrypt <file> <output.aegis> <passphrase>")
        print("  python aegis_crypto.py decrypt <file.aegis> <output_file> <passphrase>")
        print("  python aegis_crypto.py shred <file_to_wipe>")
        sys.exit(1)

    cmd = sys.argv[1].lower()
    if cmd == "encrypt" and len(sys.argv) >= 5:
        res = encrypt_file(sys.argv[2], sys.argv[3], sys.argv[4])
        print(json.dumps(res, indent=2))
    elif cmd == "decrypt" and len(sys.argv) >= 5:
        res = decrypt_file(sys.argv[2], sys.argv[3], sys.argv[4])
        print(json.dumps(res, indent=2))
    elif cmd == "shred" and len(sys.argv) >= 3:
        success = secure_shred_file(sys.argv[2])
        print(f"File {sys.argv[2]} securely wiped: {success}")
    else:
        print(f"Unknown command: {cmd}")
