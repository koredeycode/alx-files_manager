import { mkdir, writeFile } from 'fs';
import { join } from 'path';

export async function makeDirectory(dir) {
  await mkdir(dir, { recursive: true });
}

export async function saveFileLocally(baseDir, filename, data) {
  const localPath = join(baseDir, filename);
  await writeFile(localPath, Buffer.from(data, 'base64'));
  return localPath;
}

export default {
  makeDirectory,
  saveFileLocally,
};
