import Queue from 'bull';
import imageThumbnail from 'image-thumbnail';
import dbClient from './utils/db';
import { saveFileLocally } from './utils/file';
import sendMail from './utils/mailer';

const fileQueue = new Queue('thumbnail generation');
const userQueue = new Queue('email sending');

fileQueue.process(async (job, done) => {
  const { fileId, userId } = job.data;
  if (!fileId) {
    throw new Error('Missing fileId');
  }
  if (!userId) {
    throw new Error('Missing userId');
  }
  const file = await dbClient.findFile({ _id: fileId, userId });
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

userQueue.process(async (job, done) => {
  const { userId } = job.data;
  if (!userId) {
    throw new Error('Missing userId');
  }
  const user = await dbClient.findUser({ _id: userId });
  if (!user) {
    throw new Error('User not found');
  }
  console.log(`Welcome ${user.email}`);
  await sendMail(user.email);
  done();
});
