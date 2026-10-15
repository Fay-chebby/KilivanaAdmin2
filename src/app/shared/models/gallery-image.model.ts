export interface GalleryImage {
  id: string | number;
  url: string;
  caption?: string;
  uploadedBy?: 'farmer' | 'inspector';
  uploadedAt?: string;
  isPrimary?: boolean;
  name?: string;
  file?: File;
}
