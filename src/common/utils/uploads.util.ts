import { join, normalize, sep } from 'path';

export const uploadsRoot = join(__dirname, '..', '..', '..', 'uploads');

export const uploadDirectory = (...segments: string[]): string => join(uploadsRoot, ...segments);

export const uploadedPublicPathToDiskPath = (publicPath: string): string => {
  const relativePath = publicPath.replace(/^\/uploads\/?/, '');
  return normalize(join(uploadsRoot, relativePath));
};

export const isInsideUploadsRoot = (path: string): boolean => {
  const normalizedRoot = normalize(uploadsRoot);
  const normalizedPath = normalize(path);

  return normalizedPath === normalizedRoot || normalizedPath.startsWith(`${normalizedRoot}${sep}`);
};
