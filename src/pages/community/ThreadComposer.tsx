import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Logo } from '../../components/Logo';
import { LoaderOne } from '../../components/ui/loader';
import { MarkdownEditor } from '../../components/community/MarkdownEditor';
import { EmbedPreview } from '../../components/community/EmbedPreview';
import { XMarkIcon, PhotoIcon } from '@heroicons/react/24/outline';
import { generateSlug } from '../../lib/community/utils';
import { createThreadSchema } from '../../lib/community/validation';
import { uploadService } from '../../services/upload';
import { threadService } from '../../services/community';
import { rateLimiter, RATE_LIMITS } from '../../lib/community/rateLimit';
import toast from 'react-hot-toast';

interface LocationState {
  problemId?: string;
  slideId?: string;
  problemTitle?: string;
  slideTitle?: string;
}

export const ThreadComposer: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState;
  
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.title = 'New Thread - Community - Invisible Mechanics';
  }, []);

  const handleImageUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    setUploadingImage(true);
    try {
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setImages(prev => [...prev, previewUrl]);
      setImageFiles(prev => [...prev, file]);
      toast.success('Image added');
    } catch (error) {
      console.error('Error adding image:', error);
      toast.error('Failed to add image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleAddTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !tags.includes(tag) && tags.length < 5) {
      setTags(prev => [...prev, tag]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(prev => prev.filter(tag => tag !== tagToRemove));
  };

  const handleSubmit = async () => {
    if (!user) {
      toast.error('Please sign in to create a thread');
      return;
    }

    // Check rate limit
    if (!rateLimiter.check(user.uid, 'thread_create', RATE_LIMITS.THREAD_CREATE.limit, RATE_LIMITS.THREAD_CREATE.window)) {
      const remainingMs = rateLimiter.getRemainingTime(user.uid, 'thread_create');
      const remainingMinutes = Math.ceil(remainingMs / 60000);
      toast.error(`You've created too many threads. Please wait ${remainingMinutes} minutes.`);
      return;
    }

    try {
      const data = {
        title: title.trim(),
        bodyMarkdown: body.trim(),
        images,
        tags,
        problemId: state?.problemId,
        slideId: state?.slideId,
      };

      const validation = createThreadSchema.safeParse(data);
      if (!validation.success) {
        toast.error(validation.error.errors[0].message);
        return;
      }

      setIsSubmitting(true);

      // Upload images if any
      let uploadedImageUrls: string[] = [];
      if (imageFiles.length > 0) {
        try {
          uploadedImageUrls = await uploadService.uploadMultipleImages(imageFiles);
        } catch (uploadError) {
          console.error('Error uploading images:', uploadError);
          toast.error('Failed to upload images. Please try again.');
          setIsSubmitting(false);
          return;
        }
      }

      // Create thread using the service
      const breakdown = state?.problemId && state?.slideId ? {
        problemId: state.problemId,
        slideId: state.slideId,
        snapshotUrl: undefined // TODO: implement snapshot generation if needed
      } : undefined;

      const thread = await threadService.createThread(
        data.title,
        data.bodyMarkdown,
        uploadedImageUrls,
        data.tags,
        breakdown
      );

      toast.success('Thread created successfully!');
      navigate(`/community/t/${thread.id}-${thread.slug}`);
    } catch (error) {
      console.error('Error creating thread:', error);
      toast.error('Failed to create thread. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-md border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <Logo />
              <h1 className="text-xl font-semibold text-gray-900">Create New Thread</h1>
            </div>
            
            <button
              onClick={() => navigate('/community')}
              className="text-gray-500 hover:text-gray-700"
              data-cursor="button"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {/* Embed Preview */}
          {state?.problemId && state?.slideId && (
            <div className="mb-6">
              <EmbedPreview
                problemId={state.problemId}
                slideId={state.slideId}
                problemTitle={state.problemTitle}
                slideTitle={state.slideTitle}
              />
            </div>
          )}

          {/* Title */}
          <div className="mb-6">
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Title
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What's your question?"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              maxLength={200}
            />
            <p className="mt-1 text-sm text-gray-500">{title.length}/200</p>
          </div>

          {/* Body */}
          <div className="mb-6">
            <label htmlFor="body" className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <MarkdownEditor
              value={body}
              onChange={setBody}
              placeholder="Share context, what you tried, and where you're stuck..."
              minHeight={200}
            />
          </div>

          {/* Tags */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tags (optional)
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {tags.map(tag => (
                <span
                  key={tag}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-700"
                >
                  {tag}
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-2 text-gray-500 hover:text-gray-700"
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                </span>
              ))}
            </div>
            {tags.length < 5 && (
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                  placeholder="Add a tag"
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <button
                  onClick={handleAddTag}
                  className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md text-sm hover:bg-gray-200"
                  data-cursor="button"
                >
                  Add
                </button>
              </div>
            )}
          </div>

          {/* Images */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Images (optional)
            </label>
            <div className="flex flex-wrap gap-2">
              {images.map((url, index) => (
                <div key={index} className="relative">
                  <img
                    src={url}
                    alt={`Upload ${index + 1}`}
                    className="w-24 h-24 object-cover rounded-lg"
                  />
                  <button
                    onClick={() => {
                      setImages(prev => prev.filter((_, i) => i !== index));
                      setImageFiles(prev => prev.filter((_, i) => i !== index));
                    }}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {images.length < 5 && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImage}
                  className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center hover:border-gray-400 disabled:opacity-50"
                  data-cursor="button"
                >
                  {uploadingImage ? (
                    <LoaderOne size="small" />
                  ) : (
                    <PhotoIcon className="w-8 h-8 text-gray-400" />
                  )}
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
                className="hidden"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => navigate('/community')}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              data-cursor="button"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !title.trim() || !body.trim()}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              data-cursor="button"
            >
              {isSubmitting ? (
                <>
                  <LoaderOne size="small" />
                  <span>Creating...</span>
                </>
              ) : (
                <span>Create Thread</span>
              )}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};
