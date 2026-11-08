import { isAuthenticated } from '@/lib/auth';
import { uploadImage } from '@/lib/github';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  if (!(await isAuthenticated())) return Response.json({ error: 'Please sign in again.' }, { status: 401 });
  try {
    const form = await request.formData();
    const file = form.get('file');
    const pathValue = form.get('path');
    const previousUrl = form.get('previousUrl');
    if (!(file instanceof File) || !file.type.startsWith('image/')) return Response.json({ error: 'Choose a valid image file.' }, { status: 400 });
    if (file.size > 10 * 1024 * 1024) return Response.json({ error: 'Images must be 10 MB or smaller.' }, { status: 400 });
    const path = typeof pathValue === 'string' ? JSON.parse(pathValue) as Array<string | number> : [];
    if (!Array.isArray(path) || path.some((part) => typeof part !== 'string' && typeof part !== 'number')) {
      return Response.json({ error: 'Invalid image field.' }, { status: 400 });
    }
    return Response.json({ url: await uploadImage(file, path, typeof previousUrl === 'string' ? previousUrl : '') });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Upload failed.';
    return Response.json({ error: message }, { status: 500 });
  }
}
