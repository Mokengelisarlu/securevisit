import { NextResponse } from 'next/server';

const ALLOWED_BLOB_HOSTS = [
  'blob.vercel-storage.com',
  'vercel-storage.com',
];

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');

    if (!url) {
        return new NextResponse('Missing url parameter', { status: 400 });
    }

    // Validate that the URL is from an allowed blob host
    try {
        const parsedUrl = new URL(url);
        const isAllowed = ALLOWED_BLOB_HOSTS.some(
            (host) => parsedUrl.hostname === host || parsedUrl.hostname.endsWith(`.${host}`)
        );
        if (!isAllowed) {
            return new NextResponse('Forbidden: url host not allowed', { status: 403 });
        }
    } catch {
        return new NextResponse('Invalid url parameter', { status: 400 });
    }

    try {
        const response = await fetch(url, {
            headers: {
                Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}`,
            }
        });

        if (!response.ok) {
            return new NextResponse('Failed to fetch blob', { status: response.status });
        }

        const blob = await response.blob();
        return new NextResponse(blob, {
            headers: {
                'Content-Type': response.headers.get('Content-Type') || 'application/octet-stream',
                'Cache-Control': 'public, max-age=31536000, immutable',
            },
        });
    } catch (error) {
        console.error('Error proxying blob:', error);
        return new NextResponse('Error proxying blob', { status: 500 });
    }
}
