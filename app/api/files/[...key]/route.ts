import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/session';
import { checkMaterialAccess } from '@/lib/access';
import { getFile } from '@/lib/storage';

/**
 * Serves stored files. Free files are open to everyone (no login, §5.1); paid
 * files run the same access check as the material page, so the storage URL can
 * never be used to sidestep payment.
 */
export async function GET(
  _req: Request,
  { params }: { params: { key: string[] } }
) {
  const key = params.key.map(decodeURIComponent).join('/');

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

  const file = await getFile(key);
  if (!file) return new NextResponse('File missing from storage', { status: 404 });

  await prisma.material.update({
    where: { id: material.id },
    data: { downloadCount: { increment: 1 } },
  });

  return new NextResponse(new Uint8Array(file.body), {
    headers: {
      'Content-Type': file.mimeType,
      'Content-Disposition': `attachment; filename="${material.fileName}"`,
      'Content-Length': String(file.body.length),
      'Cache-Control': 'private, no-store',
    },
  });
}
