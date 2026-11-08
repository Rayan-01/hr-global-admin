import { defaultSiteContent, type SiteContent } from '@/lib/default-content';

const CONTENT_PATH = 'content/site-content.json';

function repository() {
  return {
    owner: process.env.GITHUB_OWNER || 'Rayan-01',
    repo: process.env.GITHUB_REPO || 'hrglobalexpress',
    branch: process.env.GITHUB_BRANCH || 'main',
  };
}

function headers(requireToken = false) {
  const token = process.env.GITHUB_TOKEN;
  if (requireToken && !token) throw new Error('GITHUB_TOKEN is not configured in Vercel.');
  return {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function fileUrl(path: string) {
  const { owner, repo } = repository();
  const encodedPath = path.split('/').map(encodeURIComponent).join('/');
  return `https://api.github.com/repos/${owner}/${repo}/contents/${encodedPath}`;
}

async function getFile(path: string) {
  const { branch } = repository();
  const response = await fetch(`${fileUrl(path)}?ref=${encodeURIComponent(branch)}`, {
    headers: headers(),
    cache: 'no-store',
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`GitHub could not read ${path} (${response.status}).`);
  const result = await response.json() as { sha: string; content: string; encoding: string };
  return {
    sha: result.sha,
    buffer: Buffer.from(result.content.replace(/\n/g, ''), result.encoding === 'base64' ? 'base64' : 'utf8'),
  };
}

async function putFile(path: string, buffer: Buffer, message: string) {
  const existing = await getFile(path);
  const { branch } = repository();
  const response = await fetch(fileUrl(path), {
    method: 'PUT',
    headers: { ...headers(true), 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      branch,
      content: buffer.toString('base64'),
      ...(existing?.sha ? { sha: existing.sha } : {}),
    }),
  });
  if (!response.ok) {
    const result = await response.json().catch(() => null) as { message?: string } | null;
    throw new Error(result?.message || `GitHub could not save ${path} (${response.status}).`);
  }
}

async function deleteFile(path: string, message: string) {
  const existing = await getFile(path);
  if (!existing) return;
  const { branch } = repository();
  const response = await fetch(fileUrl(path), {
    method: 'DELETE',
    headers: { ...headers(true), 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, branch, sha: existing.sha }),
  });
  if (!response.ok) {
    const result = await response.json().catch(() => null) as { message?: string } | null;
    throw new Error(result?.message || `GitHub could not delete ${path} (${response.status}).`);
  }
}

export async function readContent(): Promise<SiteContent> {
  try {
    const file = await getFile(CONTENT_PATH);
    return file ? JSON.parse(file.buffer.toString('utf8')) as SiteContent : defaultSiteContent;
  } catch (error) {
    console.error('GitHub content read failed; using defaults.', error);
    return defaultSiteContent;
  }
}

export async function writeContent(content: SiteContent) {
  await putFile(CONTENT_PATH, Buffer.from(JSON.stringify(content, null, 2)), 'Update website content from admin dashboard');
}

export async function uploadImage(file: File, path: Array<string | number> = [], previousUrl = '') {
  const rawExtension = file.name.includes('.') ? file.name.split('.').pop() || '' : '';
  const extension = rawExtension ? `.${rawExtension.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()}` : '';
  const baseName = file.name.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9-]+/g, '-').replace(/^-|-$/g, '').toLowerCase() || 'image';
  const heroIndex = path[0] === 'hero' && path[1] === 'images' && typeof path[2] === 'number' ? path[2] : null;
  const name = heroIndex === null ? `${Date.now()}-${baseName}${extension}` : `hero-${heroIndex + 1}${extension}`;
  const repositoryPath = `public/images/uploads/${name}`;
  const assetUrl = `/images/uploads/${name}`;
  const publicUrl = heroIndex === null ? assetUrl : `${assetUrl}?v=${Date.now()}`;

  await putFile(repositoryPath, Buffer.from(await file.arrayBuffer()), heroIndex === null ? `Upload website image ${name}` : `Replace hero image ${heroIndex + 1}`);

  const previousAssetUrl = previousUrl.split('?')[0];
  if (heroIndex !== null && previousAssetUrl.startsWith('/images/uploads/') && previousAssetUrl !== assetUrl) {
    const previousPath = `public${previousAssetUrl}`;
    try {
      await deleteFile(previousPath, `Remove replaced hero image ${heroIndex + 1}`);
    } catch (error) {
      console.error('The replacement was uploaded, but the previous hero image could not be removed.', error);
    }
  }

  return publicUrl;
}
