'use client';

import { ImageUp, Plus, Trash2 } from 'lucide-react';
import { useRef, useState } from 'react';

type Path = Array<string | number>;
type Props = { value: unknown; path?: Path; onChange: (path: Path, value: unknown) => void; label?: string };
const icons = ['plane', 'ship', 'truck', 'warehouse', 'file-check', 'shield', 'package', 'clock', 'money', 'map-pin', 'headphones'];

function humanize(value: string | number) {
  if (typeof value === 'number') return `Item ${value + 1}`;
  return value.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/[-_]/g, ' ').replace(/^./, (letter) => letter.toUpperCase());
}

function emptyLike(value: unknown, key = ''): unknown {
  if (typeof value === 'string') return key === 'icon' ? value : '';
  if (Array.isArray(value)) return [];
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([childKey, child]) => [childKey, emptyLike(child, childKey)]));
  if (typeof value === 'number') return 0;
  if (typeof value === 'boolean') return false;
  return '';
}

function isMediaPath(path: Path) {
  const names = path.map(String).map((part) => part.toLowerCase());
  return names.some((part) => ['image', 'images', 'logo'].includes(part)) && !names.includes('imagealt');
}

export default function RecursiveEditor({ value, path = [], onChange, label }: Props) {
  if (typeof value === 'string') return <StringEditor value={value} path={path} onChange={onChange} label={label || humanize(path.at(-1) || 'Value')} />;

  if (Array.isArray(value)) {
    const template = value[0];
    return <div className="object-group"><h3 className="object-title">{label || humanize(path.at(-1) || 'Items')}</h3><div className="array-list">{value.map((item, index) => <div className="array-item" key={`${path.join('.')}-${index}`}><span className="array-number">Item {index + 1}</span><RecursiveEditor value={item} path={[...path, index]} onChange={onChange} /><button type="button" className="btn btn-danger" onClick={() => onChange(path, value.filter((_, itemIndex) => itemIndex !== index))}><Trash2 size={15} /> Remove</button></div>)}</div><button type="button" className="btn btn-secondary" style={{ marginTop: '.8rem' }} onClick={() => onChange(path, [...value, template === undefined ? '' : emptyLike(template)])}><Plus size={16} /> Add item</button></div>;
  }

  if (value && typeof value === 'object') {
    return <div className={path.length > 1 ? 'object-group' : ''}>{label && <h3 className="object-title">{label}</h3>}{Object.entries(value).map(([key, child]) => <RecursiveEditor key={key} value={child} path={[...path, key]} onChange={onChange} label={humanize(key)} />)}</div>;
  }

  return null;
}

function StringEditor({ value, path, onChange, label }: { value: string; path: Path; onChange: Props['onChange']; label: string }) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const key = String(path.at(-1) || '').toLowerCase();
  const longText = ['description', 'marqueetext', 'address'].includes(key) || value.length > 100;
  const media = isMediaPath(path);
  const websiteUrl = process.env.NEXT_PUBLIC_WEBSITE_URL?.replace(/\/$/, '') || '';
  const previewUrl = value.startsWith('/') && websiteUrl ? `${websiteUrl}${value}` : value;

  async function upload(file?: File) {
    if (!file) return;
    setUploading(true); setError('');
    try {
      const body = new FormData(); body.append('file', file);
      const response = await fetch('/api/upload', { method: 'POST', body });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Upload failed.');
      onChange(path, result.url);
    } catch (uploadError) { setError(uploadError instanceof Error ? uploadError.message : 'Upload failed.'); }
    setUploading(false); if (fileInput.current) fileInput.current.value = '';
  }

  return <div className="field"><label>{label}</label>{key === 'icon' ? <select className="select" value={value} onChange={(event) => onChange(path, event.target.value)}>{icons.map((icon) => <option key={icon} value={icon}>{humanize(icon)}</option>)}</select> : media ? <><div className="media-row"><input className="input" value={value} onChange={(event) => onChange(path, event.target.value)} placeholder="Image URL" /><button type="button" className="btn btn-secondary" disabled={uploading} onClick={() => fileInput.current?.click()}><ImageUp size={16} />{uploading ? 'Uploading…' : 'Upload image'}</button></div><input ref={fileInput} type="file" accept="image/*" hidden onChange={(event) => upload(event.target.files?.[0])} />{value && <img className="media-preview" src={previewUrl} alt="Preview" />}{error && <span className="status error">{error}</span>}</> : longText ? <textarea className="textarea" value={value} onChange={(event) => onChange(path, event.target.value)} /> : <input className="input" value={value} onChange={(event) => onChange(path, event.target.value)} />}</div>;
}
