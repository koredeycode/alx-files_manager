import { mkdir, writeFile } from 'fs';
import { join } from 'path';
import { promisify } from 'util';

const mkDirAsync = promisify(mkdir);
const writeFileAsync = promisify(writeFile);

export async function makeDirectory(dir) {
  await mkDirAsync(dir, { recursive: true });
}

export async function saveFileLocally(baseDir, filename, data) {
  const localPath = join(baseDir, filename);
  await writeFileAsync(localPath, Buffer.from(data, 'base64'));
  return localPath;
}

export default {
  makeDirectory,
  saveFileLocally,
};
