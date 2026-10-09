import path from 'path';
// Uploaded product photos live on a Docker volume. Next.js only serves files that
// existed in /public at build time, so new uploads are served by app/uploads/[file].
export const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), 'public', 'uploads');
