import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';

export async function POST(request: Request): Promise<NextResponse> {
    const { searchParams } = new URL(request.url);
    const filename = searchParams.get('filename') || 'upload';

    // Extract file from form data
    let file;
    try {
        const formData = await request.formData();
        file = formData.get('file');
    } catch (e) {
        return NextResponse.json({ error: 'Failed to parse form data' }, { status: 400 });
    }

    if (!file || !(file instanceof Blob)) {
        return NextResponse.json({ error: 'No valid file provided in "file" field' }, { status: 400 });
    }

    try {
        const blob = await put(file.name || filename, file, {
            access: 'private',
        });

        return NextResponse.json(blob);
    } catch (error: any) {
        console.error('Blob upload error:', error);
        return NextResponse.json({ error: error.message || 'Failed to upload' }, { status: 500 });
    }
}
