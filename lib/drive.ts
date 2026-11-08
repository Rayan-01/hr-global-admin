import { Readable } from 'node:stream';
import { google } from 'googleapis';
import { defaultSiteContent, type SiteContent } from '@/lib/default-content';

const CONTENT_FILE = 'site-content.json';

function driveClient() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  if (!email || !privateKey) throw new Error('Google Drive service account is not configured.');
  const auth = new google.auth.JWT({ email, key: privateKey, scopes: ['https://www.googleapis.com/auth/drive'] });
  return google.drive({ version: 'v3', auth });
}

function folderId() { return process.env.GOOGLE_DRIVE_FOLDER_ID || '1T_6jqh8saDWKZHUUeLYuAbJ6sb3nG7AN'; }

async function findContentFile() {
  const drive = driveClient();
  const result = await drive.files.list({ q: `'${folderId()}' in parents and name='${CONTENT_FILE}' and trashed=false`, fields: 'files(id,name)', spaces: 'drive' });
  return result.data.files?.[0]?.id || null;
}

export async function readContent(): Promise<SiteContent> {
  try {
    const id = await findContentFile();
    if (!id) return defaultSiteContent;
    const response = await driveClient().files.get({ fileId: id, alt: 'media' });
    return response.data as unknown as SiteContent;
  } catch (error) {
    console.error('Drive content read failed; using defaults.', error);
    return defaultSiteContent;
  }
}

export async function writeContent(content: SiteContent) {
  const drive = driveClient();
  const id = await findContentFile();
  const media = { mimeType: 'application/json', body: JSON.stringify(content, null, 2) };
  if (id) await drive.files.update({ fileId: id, media });
  else await drive.files.create({ requestBody: { name: CONTENT_FILE, parents: [folderId()], mimeType: 'application/json' }, media, fields: 'id' });
}

export async function uploadImage(file: File) {
  const drive = driveClient();
  const buffer = Buffer.from(await file.arrayBuffer());
  const created = await drive.files.create({
    requestBody: { name: `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '-')}`, parents: [folderId()] },
    media: { mimeType: file.type, body: Readable.from(buffer) }, fields: 'id',
  });
  const id = created.data.id;
  if (!id) throw new Error('Google Drive did not return an uploaded file ID.');
  await drive.permissions.create({ fileId: id, requestBody: { role: 'reader', type: 'anyone' } });
  return `https://drive.google.com/thumbnail?id=${id}&sz=w2400`;
}
