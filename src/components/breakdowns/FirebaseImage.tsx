import React, { useState, useEffect } from 'react';
import { getDownloadURL, ref } from 'firebase/storage';
import { storage } from '../../lib/firebase';

interface FirebaseImageProps {
  imagePath: string;
  alt: string;
  className?: string;
}

// Direct Firebase Storage URL for the demo image
const DEMO_IMAGE_URL = 'https://firebasestorage.googleapis.com/v0/b/invisible-mechanics---2.firebasestorage.app/o/images%2Fbreakdowns-sample-image.png?alt=media&token=558d254b-7792-42e6-b4d7-adfde6f0d710';

export const FirebaseImage: React.FC<FirebaseImageProps> = ({ imagePath, alt, className = '' }) => {
  const [imageUrl, setImageUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!imagePath) {
      setLoading(false);
      return;
    }

    const loadImage = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // If it's already a full URL (starts with http), use it directly
        if (imagePath.startsWith('http')) {
          setImageUrl(imagePath);
          setLoading(false);
          return;
        }
        
        // Otherwise, try to load from Firebase Storage
        const imageRef = ref(storage, `images/${imagePath}`);
        const url = await getDownloadURL(imageRef);
        
        setImageUrl(url);
        setLoading(false);
      } catch (err) {
        console.error(`Failed to load image: ${imagePath}`, err);
        // Fallback to demo image if loading fails
        setImageUrl(DEMO_IMAGE_URL);
        setLoading(false);
        setError(null); // Clear error since we have fallback
      }
    };

    loadImage();
  }, [imagePath]);

  if (loading) {
    return (
      <div className={`bg-gray-100 rounded-lg flex items-center justify-center min-h-[200px] ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!imageUrl) {
    return (
      <div className={`bg-gray-100 rounded-lg flex items-center justify-center min-h-[200px] ${className}`}>
        <div className="text-center text-gray-500">
          <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-sm">Image not available</p>
        </div>
      </div>
    );
  }

  return (
    <img 
      src={imageUrl} 
      alt={alt}
      className={className}
      loading="lazy"
      onError={(e) => {
        // If image fails to load, try the demo image as fallback
        const target = e.target as HTMLImageElement;
        if (target.src !== DEMO_IMAGE_URL) {
          target.src = DEMO_IMAGE_URL;
        }
      }}
    />
  );
};