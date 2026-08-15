import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/session';
import { checkMaterialAccess } from '@/lib/access';
import { getSignedDownloadUrl, getFileStream } from '@/lib/storage';

/**
 * Serves stored files. Free files are open to everyone (no login, §5.1); paid
 * files run the same access check as the material page, so the storage URL can
 * never be used to sidestep payment.
 *
 * The check always happens here. Only once it passes does the request either
 * redirect to a short-lived presigned R2 URL, or stream from local disk when R2
 * is not configured. Either way the file's bytes are never buffered in memory.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ key: string[] }> }
) {
  const { key: segments } = await params;
  const key = segments.map(decodeURIComponent).join('/');

  const material = await prisma.material.findFirst({
    where: { fileKey: key },
    select: {
      id: true,
      isFree: true,
      uploadedById: true,
      fileName: true,
      status: true,
    },
  });

  if (!material) return new NextResponse('Not found', { status: 404 });

  const user = await getSessionUser();

  if (material.status !== 'APPROVED') {
    const privileged =
      user &&
      (user.role === 'SUPER_ADMIN' ||
        user.role === 'LECTURER' ||
        user.role === 'TA' ||
        user.id === material.uploadedById);
    if (!privileged) return new NextResponse('Not available', { status: 403 });
  }

  const access = await checkMaterialAccess(material, user);
  if (!access.canDownload) {
    return new NextResponse('Payment required', { status: 402 });
  }

  // Access is granted from here on.
  const signedUrl = await getSignedDownloadUrl(key, material.fileName);

  if (signedUrl) {
    await bumpDownloadCount(material.id);
    // 302, not 307/308: this is a one-off location for this request and must
    // never be cached or replayed once the signature expires.
    return NextResponse.redirect(signedUrl, {
      status: 302,
      headers: { 'Cache-Control': 'private, no-store' },
    });
  }

  const file = await getFileStream(key);
  if (!file) return new NextResponse('File missing from storage', { status: 404 });

  await bumpDownloadCount(material.id);

  const safeFileName = material.fileName.replace(/["\\]/g, '');
  return new NextResponse(file.stream, {
    headers: {
      'Content-Type': file.mimeType,
      'Content-Disposition': `attachment; filename="${safeFileName}"`,
      'Content-Length': String(file.size),
      'Cache-Control': 'private, no-store',
    },
  });
}

/** A failed counter update must never cost the user their download. */
async function bumpDownloadCount(materialId: string) {
  try {
    await prisma.material.update({
      where: { id: materialId },
      data: { downloadCount: { increment: 1 } },
    });
  } catch {
    /* counting is not worth failing a download over */
  }
}
