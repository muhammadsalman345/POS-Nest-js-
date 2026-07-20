import { BadRequestException } from '@nestjs/common';
import { existsSync, mkdirSync } from 'fs';
import { diskStorage } from 'multer';
import { extname, join } from 'path';

const allowedExtensions = new Set(['.jpg', '.jpeg', '.png', '.webp']);
const allowedMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);

export const productImageUploadOptions = {
  storage: diskStorage({
    destination: (_request, _file, callback) => {
      const destination = join(process.cwd(), 'uploads', 'products');

      if (!existsSync(destination)) {
        mkdirSync(destination, { recursive: true });
      }

      callback(null, destination);
    },
    filename: (_request, file, callback) => {
      const extension = extname(file.originalname).toLowerCase();
      const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`;
      callback(null, uniqueName);
    },
  }),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (_request, file, callback) => {
    const extension = extname(file.originalname).toLowerCase();

    if (!allowedExtensions.has(extension) || !allowedMimeTypes.has(file.mimetype)) {
      callback(new BadRequestException('Only jpg, jpeg, png and webp images are allowed.'), false);
      return;
    }

    callback(null, true);
  },
};

export const productImagePath = (filename: string): string => `/uploads/products/${filename}`;
