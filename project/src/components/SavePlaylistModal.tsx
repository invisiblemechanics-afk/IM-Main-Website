import React, { useState } from 'react';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, addDoc, serverTimestamp, doc } from 'firebase/firestore';
import { X } from 'lucide-react';
import { LoaderOne } from './ui/loader';

interface SavePlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTopics: string[];
  onSuccess: () => void;
}

export const SavePlaylistModal: React.FC<SavePlaylistModalProps> = ({
  isOpen,
  onClose,
  selectedTopics,
  onSuccess,
}) => {
  const [playlistName, setPlaylistName] = useState('');
  const [playlistDescription, setPlaylistDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!playlistName.trim()) return;

    setIsSaving(true);
    setError(null);

    try {
      const auth = getAuth();
      const db = getFirestore();
      
      if (!auth.currentUser) {
        throw new Error('User not authenticated');
      }

      const uid = auth.currentUser.uid;
      
      // Create playlist document in users/{uid}/playlists
      const userPlaylistsRef = collection(doc(db, 'users', uid), 'playlists');
      
      await addDoc(userPlaylistsRef, {
        name: playlistName.trim(),
        description: playlistDescription.trim() || null,
        topicTags: selectedTopics,
        createdAt: serverTimestamp(),
      });

      // Clear form and close modal
      setPlaylistName('');
      setPlaylistDescription('');
      onClose();
      onSuccess();
    } catch (err) {
      console.error('Error saving playlist:', err);
      setError('Failed to save playlist. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    if (!isSaving) {
      setPlaylistName('');
      setPlaylistDescription('');
      setError(null);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Save Playlist</h2>
          <button
            onClick={handleClose}
            disabled={isSaving}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4">
          <div>
            <label htmlFor="playlist-name" className="block text-sm font-medium text-gray-700 mb-2">
              Playlist name <span className="text-red-500">*</span>
            </label>
            <input
              id="playlist-name"
              type="text"
              value={playlistName}
              onChange={(e) => setPlaylistName(e.target.value)}
              disabled={isSaving}
              placeholder="Enter playlist name..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              autoFocus
            />
          </div>

          <div>
            <label htmlFor="playlist-description" className="block text-sm font-medium text-gray-700 mb-2">
              Description <span className="text-gray-400">(optional)</span>
            </label>
            <textarea
              id="playlist-description"
              value={playlistDescription}
              onChange={(e) => setPlaylistDescription(e.target.value)}
              disabled={isSaving}
              placeholder="Add a description for your playlist..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed resize-none"
            />
          </div>

          {selectedTopics.length > 0 && (
            <div className="text-sm text-gray-600">
              {selectedTopics.length} topic{selectedTopics.length !== 1 ? 's' : ''} selected
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={handleClose}
            disabled={isSaving}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!playlistName.trim() || isSaving}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center"
          >
            {isSaving ? (
              <>
                <div className="mr-2">
                  <LoaderOne />
                </div>
                Saving...
              </>
            ) : (
              'Save'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};