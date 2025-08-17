import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../lib/firebase';
import { v4 as uuidv4 } from 'uuid';

export const uploadService = {
  async uploadImage(file: File, folder: string = 'community'): Promise<string> {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      throw new Error('File must be an image');
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      throw new Error('Image must be less than 5MB');
    }

    // Generate unique filename
    const extension = file.name.split('.').pop() || 'jpg';
    const filename = `${uuidv4()}.${extension}`;
    const path = `${folder}/${filename}`;

    // Create storage reference
    const storageRef = ref(storage, path);

    // Upload file
    const snapshot = await uploadBytes(storageRef, file, {
      contentType: file.type,
      customMetadata: {
        uploadedAt: new Date().toISOString()
      }
    });

    // Get download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    return downloadURL;
  },

  async uploadMultipleImages(files: File[], folder: string = 'community'): Promise<string[]> {
    const uploadPromises = files.map(file => this.uploadImage(file, folder));
    return Promise.all(uploadPromises);
  }
};



