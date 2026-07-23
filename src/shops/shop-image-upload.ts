import { BadRequestException } from '@nestjs/common';
import { existsSync, mkdirSync } from 'fs';
import { extname } from 'path';
import { diskStorage } from 'multer';
import { uploadDirectory } from '../common/utils/uploads.util';

export type ShopImageSlot = 'logo' | 'cover';

const allowedExtensions = new Set(['.jpg', '.jpeg', '.png', '.webp']);
const allowedMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);

export const shopImageUploadOptions = {
  storage: diskStorage({
    destination: (_request, _file, callback) => {
      const slot = shopImageSlotFromRequest(_request.params?.slot);
      const destination = uploadDirectory('shops', slot);

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

export const shopImageSlotFromRequest = (slot: string | undefined): ShopImageSlot => {
  if (slot === 'logo' || slot === 'cover') {
    return slot;
  }

  throw new BadRequestException('Image slot must be logo or cover.');
};

export const shopImagePath = (slot: ShopImageSlot, filename: string): string =>
  `/uploads/shops/${slot}/${filename}`;
