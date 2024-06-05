import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import tmp from 'tmp';
import path from 'node:path';

export async function createVideoFromImages(
  imagePaths: string[],
  outputPath: string,
  lengthInSeconds: number,
  videoBitrate: string,
  size: string,
  fps: number
) {
  const tempImageListFile = tmp.fileSync({ tmpdir: './' });

  const fileListContent = [];
  for (const imagePath of imagePaths) {
    fileListContent.push(`file '${imagePath}'`);
    fileListContent.push(`duration ${lengthInSeconds / imagePaths.length}`);
  }

  fs.writeFileSync(tempImageListFile.name, fileListContent.join('\n'));

  const tempVideoFile = tmp.fileSync({ tmpdir: './', postfix: path.parse(outputPath).ext });

  const command = ffmpeg()
    .input(tempImageListFile.name)
    .inputFormat('concat')
    .videoBitrate(videoBitrate)
    .size(size)
    .fps(fps)
    .output(tempVideoFile.name);

  try {
    command.on('end', () => {
      console.log('Video created successfully:', outputPath);
      fs.copyFileSync(tempVideoFile.name, outputPath);
      fs.unlinkSync(tempVideoFile.name);
      fs.unlinkSync(tempImageListFile.name);
    })
      .on('error', (err) => console.error('Error:', err))
      .run();
  } catch (error) {
    console.error('Error creating video:', error);
  }
}
