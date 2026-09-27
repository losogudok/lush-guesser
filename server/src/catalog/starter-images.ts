import { promises as fs } from 'node:fs';
import path from 'node:path';

/**
 * Copies starter ingredient images into the image volume. Idempotent:
 * files that already exist at the destination are left untouched. When
 * onlySourceImages is provided, only those file names are considered.
 */
export const copyStarterImages = async (
  sourceDirectory: string,
  imageVolumeDirectory: string,
  onlySourceImages?: readonly string[],
): Promise<void> => {
  const fileNames =
    onlySourceImages ??
    (await fs.readdir(sourceDirectory)).filter((name) =>
      name.toLowerCase().endsWith('.png'),
    );

  await fs.mkdir(imageVolumeDirectory, { recursive: true });

  for (const fileName of fileNames) {
    const targetPath = path.join(imageVolumeDirectory, fileName);
    try {
      await fs.access(targetPath);
      continue; // Already present; never overwrite admin-managed files.
    } catch {
      // Destination missing: fall through to the copy.
    }
    await fs.copyFile(path.join(sourceDirectory, fileName), targetPath);
  }
};
