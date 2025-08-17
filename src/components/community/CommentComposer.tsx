import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { MarkdownEditor } from './MarkdownEditor';
import { LoaderOne } from '../ui/loader';
import { createCommentSchema } from '@/lib/community/validation';
import { commentService } from '@/services/community';
import toast from 'react-hot-toast';

interface CommentComposerProps {
  threadId: string;
  parentId?: string;
  onSubmit: () => void;
  onCancel: () => void;
}

export const CommentComposer: React.FC<CommentComposerProps> = ({ 
  threadId, 
  parentId, 
  onSubmit, 
  onCancel 
}) => {
  const { user } = useAuth();
  const [body, setBody] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!user) {
      toast.error('Please sign in to comment');
      return;
    }

    try {
      const data = {
        threadId,
        bodyMarkdown: body.trim(),
        parentId: parentId || null,
      };

      const validation = createCommentSchema.safeParse(data);
      if (!validation.success) {
        toast.error(validation.error.errors[0].message);
        return;
      }

      setIsSubmitting(true);

      // Create comment using the service
      await commentService.createComment(threadId, parentId, data.bodyMarkdown);

      toast.success('Comment posted!');
      onSubmit();
    } catch (error) {
      console.error('Error posting comment:', error);
      toast.error('Failed to post comment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <div className="mb-4">
        <MarkdownEditor
          value={body}
          onChange={setBody}
          placeholder={parentId ? "Write your reply..." : "Write your comment..."}
          minHeight={100}
          maxHeight={300}
        />
      </div>

      <div className="flex justify-end space-x-3">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          data-cursor="button"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || !body.trim()}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          data-cursor="button"
        >
          {isSubmitting ? (
            <>
              <LoaderOne size="small" />
              <span>Posting...</span>
            </>
          ) : (
            <span>Post {parentId ? 'Reply' : 'Comment'}</span>
          )}
        </button>
      </div>
    </div>
  );
};
