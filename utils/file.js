/* eslint-disable object-curly-newline */
import { mkdir, writeFile, stat, existsSync, realpath } from 'fs';
import { join } from 'path';
import { promisify } from 'util';

const mkDirAsync = promisify(mkdir);
const writeFileAsync = promisify(writeFile);
const statAsync = promisify(stat);
const realpathAsync = promisify(realpath);

export async function makeDirectory(dir) {
  await mkDirAsync(dir, { recursive: true });
}

export async function saveFileLocally(baseDir, filename, data) {
  let localPath = filename;
  if (baseDir !== null) {
    localPath = join(baseDir, filename);
  }
  await writeFileAsync(localPath, data);
  return localPath;
}

export async function checkFile(filePath) {
  let ret = false;
  if (existsSync(filePath)) {
    const fileInfo = await statAsync(filePath);
    ret = fileInfo.isFile();
  }
  return ret;
}
export async function getAbsFilePath(filePath) {
  return realpathAsync(filePath);
}

export default {
  makeDirectory,
  saveFileLocally,
  checkFile,
  getAbsFilePath,
};
