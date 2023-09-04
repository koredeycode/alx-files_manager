import Queue from 'bull';
import imageThumbnail from 'image-thumbnail';
import dbClient from './utils/db';
import { saveFileLocally } from './utils/file';

const fileQueue = new Queue('thumbnail generation');

fileQueue.process(async (job, done) => {
  const { fileId, userId } = job.data;
  if (!fileId) {
    throw new Error('Missing fileId');
  }
  if (!userId) {
    throw new Error('Missing userId');
  }
  const file = await dbClient.findFile({ id: fileId, userId });
  if (!file) {
    throw new Error('File not found');
  }
  const filePath = file.localPath;
  const sizes = [500, 250, 100];
  sizes.forEach(async (size) => {
    const buffer = await imageThumbnail(filePath, { width: size });
    console.log(`Generating file: ${filePath}, size: ${size}`);
    await saveFileLocally(null, `${filePath}_${size}`, buffer);
  });
  done();
});
