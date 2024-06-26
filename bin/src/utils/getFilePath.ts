import path from 'path';
import { storagePath } from '../../lib/config';

export const getFilePath = (uuid: string, relativePath: string): string => {
  return path.join(storagePath, uuid, relativePath);
};
