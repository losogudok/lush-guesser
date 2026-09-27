import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { copyStarterImages } from './starter-images';

const createTempDirectories = async () => {
  const source = await fs.mkdtemp(path.join(os.tmpdir(), 'seed-src-'));
  const volume = await fs.mkdtemp(path.join(os.tmpdir(), 'seed-vol-'));
  return { source, volume };
};

const writePng = async (directory: string, name: string, size = 10) => {
  await fs.writeFile(path.join(directory, name), Buffer.alloc(size, 0x61));
};

describe('copyStarterImages', () => {
  it('copies starter images into the image volume', async () => {
    const { source, volume } = await createTempDirectories();
    await writePng(source, 'rose.png');
    await writePng(source, 'mint.png');

    await copyStarterImages(source, volume);

    await expect(
      fs.access(path.join(volume, 'rose.png')),
    ).resolves.toBeUndefined();
    await expect(
      fs.access(path.join(volume, 'mint.png')),
    ).resolves.toBeUndefined();
  });

  it('is idempotent: re-copying skips files already in the volume', async () => {
    const { source, volume } = await createTempDirectories();
    await writePng(source, 'rose.png');

    await copyStarterImages(source, volume);
    // Change the source afterwards to detect unintended recopying.
    await writePng(source, 'rose.png', 20);

    await copyStarterImages(source, volume);

    const retained = await fs.stat(path.join(volume, 'rose.png'));
    expect(retained.size).toBe(10);
  });

  it('copies only the requested subset when one is given', async () => {
    const { source, volume } = await createTempDirectories();
    await writePng(source, 'rose.png');
    await writePng(source, 'mint.png');

    await copyStarterImages(source, volume, ['rose.png']);

    await expect(
      fs.access(path.join(volume, 'rose.png')),
    ).resolves.toBeUndefined();
    await expect(fs.access(path.join(volume, 'mint.png'))).rejects.toThrow();
  });

  it('creates the image volume directory when it does not exist', async () => {
    const { source, volume } = await createTempDirectories();
    await writePng(source, 'rose.png');
    const nestedVolume = path.join(volume, 'nested', 'images');

    await copyStarterImages(source, nestedVolume);

    await expect(
      fs.access(path.join(nestedVolume, 'rose.png')),
    ).resolves.toBeUndefined();
  });
});
