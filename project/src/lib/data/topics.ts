import { collection, getDocs, orderBy, query, doc } from 'firebase/firestore';
import { getDownloadURL, ref } from 'firebase/storage';
import { firestore, storage } from '../firebase';

export interface TopicWithURL {
  id: string;
  title: string;
  order: number;
  videoURL: string;
  thumbnailURL: string;
  thumbnailPath?: string;
  durationSec: number;
  prereq: string[];
  description?: string;
}

interface FirestoreTopicDoc {
  id: string;
  order: number;
  durationSec: number;
  prereq?: string[];
  description?: string;
  difficulty?: number;
  skillTag?: string;
  storagePath?: string;
  thumbnailPath?: string;
  videoUrl?: string;
}

/**
 * Fetches all topics from a specific chapter in Firestore and resolves their storage paths to download URLs
 * @param chapterId - The ID of the chapter to fetch topics for (defaults to 'Vectors' for backwards compatibility)
 * @returns Promise<TopicWithURL[]> - Array of topics with resolved URLs, sorted by order
 */
export async function getAllTopicsWithURLs(chapterId: string = 'Vectors'): Promise<TopicWithURL[]> {
  try {
    console.log(`Fetching topics from Firestore for chapter: ${chapterId}...`);
    // Query Firestore subcollection: Chapters/{chapterId}/{chapterId}-Theory
    const chapterDoc = doc(firestore, 'Chapters', chapterId);
    const topicsCollection = collection(chapterDoc, `${chapterId}-Theory`);
    const topicsQuery = query(topicsCollection, orderBy('order', 'asc'));
    const querySnapshot = await getDocs(topicsQuery);

    console.log(`Found ${querySnapshot.docs.length} topics in Firestore for ${chapterId}`);
    
    // Process all documents in parallel for better performance
    const topicPromises = querySnapshot.docs.map(async (docSnapshot) => {
      const docData = docSnapshot.data() as Omit<FirestoreTopicDoc, 'id'>;
      const topic: FirestoreTopicDoc = {
        id: docSnapshot.id,
        ...docData,
      };

      console.log(`🔍 Processing topic: ${topic.id}`);

      try {
        // Try to get video URL - Priority 1: Direct videoUrl field
        let videoURL: string;
        
        if (topic.videoUrl) {
          console.log(`🎯 Using direct videoUrl for ${topic.id}: ${topic.videoUrl.substring(0, 100)}...`);
          // Clean and validate the videoUrl
          videoURL = topic.videoUrl.trim();
          
          // Check if URL is properly formatted
          if (!videoURL.startsWith('http://') && !videoURL.startsWith('https://')) {
            console.error(`❌ Invalid videoUrl format for ${topic.id}: ${videoURL}`);
            throw new Error(`Invalid videoUrl format for topic: ${topic.id}`);
          }
          
          console.log(`✅ Direct videoUrl set successfully for ${topic.id}`);
        }
        // Priority 2: Fallback to storagePath processing
        else if (topic.storagePath) {
          try {
            // Handle both full gs:// URLs and relative paths
            let cleanPath = topic.storagePath;
            if (cleanPath.startsWith('gs://')) {
              // Extract just the path part from gs://bucket/path format
              const pathMatch = cleanPath.match(/gs:\/\/[^\/]+\/(.+)/);
              cleanPath = pathMatch ? pathMatch[1] : cleanPath;
            }
            
            const videoRef = ref(storage, cleanPath);
            videoURL = await getDownloadURL(videoRef);
            console.log(`✅ Successfully resolved storage URL for ${topic.id}`);
          } catch (storageError) {
            console.error(`❌ Failed to resolve storage URL for ${topic.id}:`, storageError);
            throw storageError; // Re-throw to skip this topic
          }
        } else {
          console.error(`❌ No videoUrl or storagePath found for topic: ${topic.id}`);
          throw new Error(`No video source found for topic: ${topic.id}`);
        }
        
        // Add cache-busting parameter for storage URLs only
        // Only add cache-busting for non-direct videoUrls to avoid breaking signed URLs
        if (!topic.videoUrl && videoURL) {
          if (!videoURL.includes('?')) {
            videoURL += `?t=${Date.now()}`;
          } else {
            videoURL += `&t=${Date.now()}`;
          }
        }
        
        // Test URL accessibility
        try {
          const testUrl = new URL(videoURL);
        } catch (urlError) {
          console.error(`❌ Invalid URL format for ${topic.id}:`, urlError);
          throw new Error(`Invalid URL format for topic: ${topic.id}`);
        }
        
        // Use placeholder thumbnail initially for faster loading
        const thumbnailURL = `https://via.placeholder.com/320x180/4F46E5/FFFFFF?text=${encodeURIComponent(topic.id)}`;

        // Return successfully resolved topic
        return {
          id: topic.id,
          title: topic.id.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()), // Convert ID to title
          order: topic.order,
          videoURL,
          thumbnailURL,
          thumbnailPath: topic.thumbnailPath,
          durationSec: topic.durationSec,
          prereq: topic.prereq || [],
          description: topic.description,
        };
        console.log(`✅ Topic processed successfully: ${topic.id}`);
      } catch (storageError) {
        // Log warning and skip this topic if storage resolution fails
        console.error(
          `❌ SKIPPING topic ${topic.id} due to error:`,
          storageError
        );
        return null; // Return null for failed topics
      }
    });

    // Wait for all topics to process in parallel
    const results = await Promise.all(topicPromises);
    
    // Filter out failed topics (null values)
    const topicsWithURLs = results.filter((topic): topic is TopicWithURL => topic !== null);

    console.log(`📊 Final result: ${topicsWithURLs.length} topics with resolved URLs`);
    return topicsWithURLs;
  } catch (firestoreError) {
    // Log error and return empty array if Firestore query fails
    console.error('❌ Failed to fetch topics from Firestore:', firestoreError);
    return []; // Return empty array on error
  }
}

/**
 * Get thumbnail URL for a topic (used for lazy loading)
 * @param topic - Topic with thumbnail path
 * @returns Promise<string> - Thumbnail URL or placeholder
 */
export async function getTopicThumbnailURL(topic: { id: string; thumbnailPath?: string }): Promise<string> {
  if (!topic.thumbnailPath) {
    return `https://via.placeholder.com/320x180/4F46E5/FFFFFF?text=${encodeURIComponent(topic.id)}`;
  }

  try {
    // Handle both full gs:// URLs and relative paths for thumbnails
    let cleanThumbPath = topic.thumbnailPath;
    if (cleanThumbPath.startsWith('gs://')) {
      const pathMatch = cleanThumbPath.match(/gs:\/\/[^\/]+\/(.+)/);
      cleanThumbPath = pathMatch ? pathMatch[1] : cleanThumbPath;
    }
    
    const thumbnailRef = ref(storage, cleanThumbPath);
    return await getDownloadURL(thumbnailRef);
  } catch (thumbError) {
    console.warn(`⚠️ Thumbnail failed for ${topic.id}, using placeholder`);
    return `https://via.placeholder.com/320x180/4F46E5/FFFFFF?text=${encodeURIComponent(topic.id)}`;
  }
}