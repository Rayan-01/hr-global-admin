import { isAuthenticated } from '@/lib/auth';
import { editableSections, type SiteContent } from '@/lib/default-content';
import { readContent, writeContent } from '@/lib/github';

export async function GET() {
  const content = await readContent();
  return Response.json(content, { headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=300' } });
}

export async function PUT(request: Request) {
  if (!(await isAuthenticated())) return Response.json({ error: 'Please sign in again.' }, { status: 401 });
  try {
    const content = await request.json() as SiteContent;
    if (!content || typeof content !== 'object' || editableSections.some((section) => !(section in content))) {
      return Response.json({ error: 'The content document is incomplete.' }, { status: 400 });
    }
    await writeContent(content);
    return Response.json({ ok: true, savedAt: new Date().toISOString() });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to save content.';
    return Response.json({ error: message }, { status: 500 });
  }
}
