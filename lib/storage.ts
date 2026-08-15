import { randomUUID } from 'crypto';
import { mkdir, writeFile, readFile, unlink } from 'fs/promises';
import path from 'path';

/**
 * Storage abstraction.
 *
 * Production target is Cloudflare R2 (S3-compatible, cheap egress for large
 * PDFs/books). Until R2 credentials exist, files land on local disk under
 * ./storage and are served through /api/files/[...key] — the calling code and
 * the DB records are identical either way, so flipping to R2 is env-only.
 */

const LOCAL_ROOT = path.join(process.cwd(), 'storage');

export function isR2Configured() {
  return Boolean(
    process.env.R2_ACCOUNT_ID &&
      process.env.R2_ACCESS_KEY_ID &&
      process.env.R2_SECRET_ACCESS_KEY &&
      process.env.R2_BUCKET
  );
}

export type StoredFile = {
  key: string;
  url: string;
  size: number;
  mimeType: string;
  fileName: string;
};

function safeName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-120);
}

async function r2Client() {
  const { S3Client } = await import('@aws-sdk/client-s3');
  return new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  });
}

export async function putFile(file: File, prefix = 'materials'): Promise<StoredFile> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const key = `${prefix}/${new Date().getFullYear()}/${randomUUID()}-${safeName(
    file.name
  )}`;
  const mimeType = file.type || 'application/octet-stream';

  if (isR2Configured()) {
    const { PutObjectCommand } = await import('@aws-sdk/client-s3');
    const client = await r2Client();
    await client.send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET!,
        Key: key,
        Body: buffer,
        ContentType: mimeType,
      })
    );
    const base = process.env.R2_PUBLIC_BASE_URL;
    return {
      key,
      url: base ? `${base.replace(/\/$/, '')}/${key}` : `/api/files/${key}`,
      size: buffer.length,
      mimeType,
      fileName: file.name,
    };
  }

  const dest = path.join(LOCAL_ROOT, key);
  await mkdir(path.dirname(dest), { recursive: true });
  await writeFile(dest, buffer);
  return {
    key,
    url: `/api/files/${key}`,
    size: buffer.length,
    mimeType,
    fileName: file.name,
  };
}

export async function getFile(
  key: string
): Promise<{ body: Buffer; mimeType: string } | null> {
  if (isR2Configured()) {
    try {
      const { GetObjectCommand } = await import('@aws-sdk/client-s3');
      const client = await r2Client();
      const res = await client.send(
        new GetObjectCommand({ Bucket: process.env.R2_BUCKET!, Key: key })
      );
      const bytes = await res.Body!.transformToByteArray();
      return {
        body: Buffer.from(bytes),
        mimeType: res.ContentType || 'application/octet-stream',
      };
    } catch {
      return null;
    }
  }

  try {
    const full = path.join(LOCAL_ROOT, key);
    if (!full.startsWith(LOCAL_ROOT)) return null; // path traversal guard
    const body = await readFile(full);
    return { body, mimeType: guessMime(key) };
  } catch {
    return null;
  }
}

export async function deleteFile(key: string) {
  if (isR2Configured()) {
    const { DeleteObjectCommand } = await import('@aws-sdk/client-s3');
    const client = await r2Client();
    await client.send(
      new DeleteObjectCommand({ Bucket: process.env.R2_BUCKET!, Key: key })
    );
    return;
  }
  try {
    await unlink(path.join(LOCAL_ROOT, key));
  } catch {
    /* already gone */
  }
}

function guessMime(key: string) {
  const ext = path.extname(key).toLowerCase();
  const map: Record<string, string> = {
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx':
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.ppt': 'application/vnd.ms-powerpoint',
    '.pptx':
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    '.zip': 'application/zip',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
  };
  return map[ext] || 'application/octet-stream';
}

export const ALLOWED_MIME = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/zip',
  'image/png',
  'image/jpeg',
];

export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024; // 25 MB

/**
 * Identify a file by its leading bytes.
 *
 * `File.type` is supplied by the browser and trivially forged, so it cannot be
 * the basis for an allow-list — an executable labelled "application/pdf" would
 * pass. These signatures come from the file itself.
 *
 * Office formats (.docx/.pptx) and .zip are all ZIP containers and cannot be
 * told apart from the first bytes alone, so they share one signature; the real
 * distinction is drawn by the extension check in the caller.
 */
export type SniffedKind = 'pdf' | 'zip' | 'ole' | 'png' | 'jpeg' | 'unknown';

export function sniffFileKind(bytes: Uint8Array): SniffedKind {
  const startsWith = (...sig: number[]) =>
    sig.length <= bytes.length && sig.every((b, i) => bytes[i] === b);

  if (startsWith(0x25, 0x50, 0x44, 0x46)) return 'pdf'; // %PDF
  if (startsWith(0x50, 0x4b, 0x03, 0x04)) return 'zip'; // PK.. — docx, pptx, zip
  if (startsWith(0x50, 0x4b, 0x05, 0x06)) return 'zip'; // empty archive
  if (startsWith(0xd0, 0xcf, 0x11, 0xe0)) return 'ole'; // legacy .doc/.ppt
  if (startsWith(0x89, 0x50, 0x4e, 0x47)) return 'png';
  if (startsWith(0xff, 0xd8, 0xff)) return 'jpeg';
  return 'unknown';
}

/** Extensions the platform accepts, mapped to the content each may contain. */
const EXTENSION_KINDS: Record<string, SniffedKind[]> = {
  '.pdf': ['pdf'],
  '.doc': ['ole'],
  '.docx': ['zip'],
  '.ppt': ['ole'],
  '.pptx': ['zip'],
  '.zip': ['zip'],
  '.png': ['png'],
  '.jpg': ['jpeg'],
  '.jpeg': ['jpeg'],
};

export type UploadCheck = { ok: true; kind: SniffedKind } | { ok: false; error: string };

/**
 * Validates an upload against its real content. Called before anything is
 * written to storage or recorded in the database.
 */
export function checkUpload(fileName: string, bytes: Uint8Array): UploadCheck {
  const ext = path.extname(fileName).toLowerCase();
  const allowedKinds = EXTENSION_KINDS[ext];

  if (!allowedKinds) {
    return {
      ok: false,
      error: 'Upload a PDF, Word, PowerPoint, image or zip file.',
    };
  }

  const kind = sniffFileKind(bytes);

  if (kind === 'unknown') {
    return {
      ok: false,
      error: `That file does not look like a real ${ext.replace('.', '').toUpperCase()} document.`,
    };
  }

  if (!allowedKinds.includes(kind)) {
    return {
      ok: false,
      error: `That file is named "${ext}" but its contents are something else. Re-save it and try again.`,
    };
  }

  return { ok: true, kind };
}
