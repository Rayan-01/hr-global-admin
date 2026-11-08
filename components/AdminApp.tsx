'use client';

import { Check, ExternalLink, LogOut, RefreshCw, Save } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';
import RecursiveEditor from '@/components/RecursiveEditor';
import { editableSections, type SiteContent } from '@/lib/default-content';

type Notice = { kind: 'success' | 'error' | 'info'; message: string } | null;

export default function AdminApp() {
  const [auth, setAuth] = useState<'loading' | 'guest' | 'authenticated'>('loading');
  const [content, setContent] = useState<SiteContent | null>(null);
  const [section, setSection] = useState<(typeof editableSections)[number]>('brand');
  const [notice, setNotice] = useState<Notice>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { void checkSession(); }, []);

  async function checkSession() {
    try {
      const response = await fetch('/api/auth/session', { cache: 'no-store' });
      const result = await response.json();
      if (result.authenticated) { setAuth('authenticated'); await loadContent(); }
      else setAuth('guest');
    } catch { setAuth('guest'); }
  }

  async function loadContent() {
    setNotice({ kind: 'info', message: 'Loading the latest saved content…' });
    try {
      const response = await fetch(`/api/content?t=${Date.now()}`, { cache: 'no-store' });
      if (!response.ok) throw new Error('Could not load website content.');
      setContent(await response.json()); setNotice(null);
    } catch (error) { setNotice({ kind: 'error', message: error instanceof Error ? error.message : 'Could not load content.' }); }
  }

  function update(path: Array<string | number>, value: unknown) {
    if (!content) return;
    const next = structuredClone(content) as Record<string, unknown>;
    let cursor: any = next;
    for (let index = 0; index < path.length - 1; index += 1) cursor = cursor[path[index]];
    cursor[path[path.length - 1]] = value;
    setContent(next as SiteContent); setNotice({ kind: 'info', message: 'You have unsaved changes.' });
  }

  async function save() {
    if (!content) return;
    setSaving(true); setNotice({ kind: 'info', message: 'Saving to Google Drive…' });
    try {
      const response = await fetch('/api/content', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(content) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Save failed.');
      setNotice({ kind: 'success', message: 'Saved. The public website will update within about one minute.' });
    } catch (error) { setNotice({ kind: 'error', message: error instanceof Error ? error.message : 'Save failed.' }); }
    setSaving(false);
  }

  async function logout() { await fetch('/api/auth/logout', { method: 'POST' }); setAuth('guest'); setContent(null); }

  if (auth === 'loading') return <div className="loader">Opening the content manager…</div>;
  if (auth === 'guest') return <Login onSuccess={async () => { setAuth('authenticated'); await loadContent(); }} />;
  if (!content) return <div className="loader">Loading website content…</div>;

  const websiteUrl = process.env.NEXT_PUBLIC_WEBSITE_URL;
  return <div className="shell"><header className="topbar"><div className="brand-lockup"><div className="brand-mark">HR</div><div><h1>HR Global Express</h1><p>Website content manager</p></div></div><div className="actions">{websiteUrl && <a className="btn btn-secondary" href={websiteUrl} target="_blank" rel="noreferrer"><ExternalLink size={16} /> View website</a>}<button className="btn btn-secondary" onClick={logout}><LogOut size={16} /> Sign out</button></div></header><div className="layout"><nav className="sidebar" aria-label="Content sections">{editableSections.map((name) => <button key={name} className={section === name ? 'active' : ''} onClick={() => setSection(name)}>{name === 'whyChooseUs' ? 'Why choose us' : name}</button>)}</nav><main className="content"><div className="content-head"><div><h2>{section === 'whyChooseUs' ? 'Why choose us' : section}</h2><p>Edit the fields below, then save your changes.</p></div><div className="actions"><button className="btn btn-secondary" onClick={loadContent}><RefreshCw size={16} /> Reload saved</button><button className="btn btn-primary" disabled={saving} onClick={save}>{saving ? <RefreshCw size={16} /> : <Save size={16} />}{saving ? 'Saving…' : 'Save changes'}</button></div></div>{notice && <div className={`status ${notice.kind}`} style={{ marginBottom: '1rem' }}>{notice.kind === 'success' && <Check size={15} style={{ verticalAlign: 'text-bottom', marginRight: 5 }} />}{notice.message}</div>}<section className="card"><RecursiveEditor value={content[section]} path={[section]} onChange={update} /></section></main></div></div>;
}

function Login({ onSuccess }: { onSuccess: () => Promise<void> }) {
  const [email, setEmail] = useState(''); const [password, setPassword] = useState('');
  const [error, setError] = useState(''); const [loading, setLoading] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault(); setLoading(true); setError('');
    try {
      const response = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Login failed.');
      await onSuccess();
    } catch (loginError) { setError(loginError instanceof Error ? loginError.message : 'Login failed.'); }
    setLoading(false);
  }
  return <main className="login-page"><form className="login-card" onSubmit={submit}><div className="login-badge">HR</div><h1>Website administration</h1><p>Sign in to update the public website content and upload images to Google Drive.</p><div className="field"><label>Email address</label><input className="input" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="username" /></div><div className="field"><label>Password</label><input className="input" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required autoComplete="current-password" /></div>{error && <div className="status error" style={{ marginBottom: '1rem' }}>{error}</div>}<button className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>{loading ? 'Signing in…' : 'Sign in'}</button></form></main>;
}
