import { randomUUID } from 'crypto';
import { mkdir, writeFile, unlink } from 'fs/promises';
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
    // Always the gated route, never R2_PUBLIC_BASE_URL: a direct bucket link
    // would hand out paid material without an access check, and this value is
    // rendered into the page. /api/files checks access, then redirects to a
    // short-lived presigned URL.
    return {
      key,
      url: `/api/files/${key}`,
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

/* getFile() used to read an entire object into a Buffer. It has been replaced
 * by getSignedDownloadUrl() for R2 and getFileStream() for local disk, and is
 * deliberately not kept around: reintroducing a buffered read would restore the
 * memory ceiling this change removed. */

/**
 * A short-lived URL that lets the browser fetch the object straight from R2.
 *
 * This is what keeps the app out of the download path. Previously every byte
 * was read into the server's memory and copied again into the response, so a
 * 25 MB file cost ~50 MB per concurrent download and a busy exam week could
 * exhaust the process. With a presigned URL the server only decides *whether*
 * the download is allowed; R2 serves the bytes.
 *
 * The expiry is deliberately short. The URL grants access to anyone holding it,
 * so it should outlive the redirect and little else.
 *
 * Returns null when R2 is not configured, so callers fall back to local disk.
 */
export async function getSignedDownloadUrl(
  key: string,
  fileName: string,
  expiresInSeconds = 120
): Promise<string | null> {
  if (!isR2Configured()) return null;

  const { GetObjectCommand } = await import('@aws-sdk/client-s3');
  const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner');
  const client = await r2Client();

  // Quotes would end the filename early and let a crafted name inject further
  // Content-Disposition parameters.
  const safeFileName = fileName.replace(/["\\]/g, '');

  const command = new GetObjectCommand({
    Bucket: process.env.R2_BUCKET!,
    Key: key,
    ResponseContentDisposition: `attachment; filename="${safeFileName}"`,
  });

  return getSignedUrl(client, command, { expiresIn: expiresInSeconds });
}

/**
 * Local-disk equivalent of the above: a stream rather than a buffer, so the
 * fallback path does not hold whole files in memory either.
 */
export async function getFileStream(key: string): Promise<{
  stream: ReadableStream<Uint8Array>;
  size: number;
  mimeType: string;
} | null> {
  const full = path.join(LOCAL_ROOT, key);
  if (!full.startsWith(LOCAL_ROOT)) return null; // path traversal guard

  try {
    const { createReadStream } = await import('fs');
    const { stat } = await import('fs/promises');
    const { Readable } = await import('stream');

    const info = await stat(full);
    if (!info.isFile()) return null;

    const nodeStream = createReadStream(full);
    return {
      stream: Readable.toWeb(nodeStream) as ReadableStream<Uint8Array>,
      size: info.size,
      mimeType: guessMime(key),
    };
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
