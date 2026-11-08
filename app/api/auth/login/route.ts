import { createSession, validateCredentials } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    if (typeof email !== 'string' || typeof password !== 'string' || !validateCredentials(email, password)) {
      return Response.json({ error: 'Email or password is incorrect.' }, { status: 401 });
    }
    await createSession(email);
    return Response.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Login failed.';
    return Response.json({ error: message }, { status: 500 });
  }
}
