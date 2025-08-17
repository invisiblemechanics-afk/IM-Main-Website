import React, { useState, useMemo } from 'react';
import { X, Clock, Users, BookOpen, Target, AlertCircle, ChevronDown, ChevronRight } from 'lucide-react';
import { MockTest } from '../types';
import { useChapterTagIndex } from '../hooks/useChapterTagIndex';
import { normalizeTag, normalizeChapterId, labelFromSlug } from '../utils/tagNormalize';

interface TestDetailsModalProps {
  test: MockTest;
  isOpen: boolean;
  onClose: () => void;
}

export default function TestDetailsModal({ test, isOpen, onClose }: TestDetailsModalProps) {
  const [expandedChapters, setExpandedChapters] = useState<Record<string, boolean>>({});
  
  // Get syllabus chapters and fetch their skillTags from Firestore
  const syllabus = (test?.syllabusChapters ?? []).map(normalizeChapterId);
  const { byChapter, ownerByTag, loading } = useChapterTagIndex(syllabus);

  // Create proper chapter-tag buckets using Firestore data
  const buckets = useMemo(() => {
    // Initialize buckets for each syllabus chapter
    const map = new Map<string, string[]>();  // chapterId -> display labels[]
    syllabus.forEach(c => map.set(c, []));

    const other: string[] = [];
    const seen = new Set<string>(); // prevent dupes

    const tags: string[] = Array.isArray(test?.skillTags) ? test.skillTags : [];

    for (const raw of tags) {
      const key = normalizeTag(raw);
      if (!key || seen.has(key)) continue;
      seen.add(key);

      const owner = ownerByTag.get(key);
      if (owner && map.has(owner)) {
        // belongs to a syllabus chapter: push there
        map.get(owner)!.push(labelFromSlug(key));
      } else {
        // not owned by any syllabus chapter: goes to Other
        other.push(labelFromSlug(key));
      }
    }

    // Sort labels within each chapter for stable UI
    for (const [k, arr] of map.entries()) arr.sort((a, b) => a.localeCompare(b));
    other.sort((a, b) => a.localeCompare(b));

    return { map, other };
  }, [test?.skillTags, ownerByTag, syllabus.join('|')]);
  
  if (!isOpen) return null;

  const toggleChapter = (chapter: string) => {
    setExpandedChapters(prev => ({
      ...prev,
      [chapter]: !prev[chapter]
    }));
  };

  const getDifficultyLabel = (difficulty: { easy: number; moderate: number; tough: number }) => {
    if (difficulty.tough >= 50) return 'Hard';
    if (difficulty.moderate >= 50) return 'Moderate';
    return 'Easy';
  };

  const getDifficultyColor = (difficulty: { easy: number; moderate: number; tough: number }) => {
    if (difficulty.tough >= 50) return 'text-red-600 bg-red-50';
    if (difficulty.moderate >= 50) return 'text-yellow-600 bg-yellow-50';
    return 'text-green-600 bg-green-50';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-gray-900 truncate">{test.name}</h2>
            <div className="flex items-center space-x-2 mt-1">
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                {test.exam}
              </span>
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(test.difficulty)}`}>
                {getDifficultyLabel(test.difficulty)}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Test Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <Users className="w-6 h-6 text-primary-600 mx-auto mb-2" />
              <div className="text-sm text-gray-600">Total Questions</div>
              <div className="text-lg font-semibold text-gray-900">{test.totalQuestions}</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <Clock className="w-6 h-6 text-primary-600 mx-auto mb-2" />
              <div className="text-sm text-gray-600">Duration</div>
              <div className="text-lg font-semibold text-gray-900">{test.duration} min</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <Target className="w-6 h-6 text-primary-600 mx-auto mb-2" />
              <div className="text-sm text-gray-600">Difficulty</div>
              <div className="text-lg font-semibold text-gray-900">{getDifficultyLabel(test.difficulty)}</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <BookOpen className="w-6 h-6 text-primary-600 mx-auto mb-2" />
              <div className="text-sm text-gray-600">Topics</div>
              <div className="text-lg font-semibold text-gray-900">
                {loading ? '...' : (
                  Array.from(buckets.map.values()).reduce((sum, arr) => sum + arr.length, 0) + buckets.other.length
                )}
              </div>
            </div>
          </div>

          {/* Difficulty Distribution */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Difficulty Distribution</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Easy Questions</span>
                <span className="text-sm text-gray-600">{test.difficulty.easy}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full"
                  style={{ width: `${test.difficulty.easy}%` }}
                ></div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Moderate Questions</span>
                <span className="text-sm text-gray-600">{test.difficulty.moderate}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-yellow-500 h-2 rounded-full"
                  style={{ width: `${test.difficulty.moderate}%` }}
                ></div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Hard Questions</span>
                <span className="text-sm text-gray-600">{test.difficulty.tough}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-red-500 h-2 rounded-full"
                  style={{ width: `${test.difficulty.tough}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Chapters and Topics - Using Firestore chapter-tag mapping */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Chapters & Topics Covered</h3>
            
            {loading ? (
              <div className="flex items-center justify-center py-4">
                <div className="text-sm text-gray-500">Loading chapter mappings...</div>
              </div>
            ) : (
              <div className="space-y-2">
                {/* Syllabus chapters as collapsible rows */}
                {syllabus.map(chId => {
                  const items = buckets.map.get(chId) || [];
                  return (
                    <details key={chId} className="rounded-xl border border-gray-200 bg-white group">
                      <summary className="cursor-pointer px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors">
                        <div className="flex items-center space-x-2">
                          <BookOpen className="w-4 h-4 text-primary-600" />
                          <span className="font-medium text-gray-900">{chId}</span>
                          <span className="text-sm text-gray-500">({items.length} topics)</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-500 group-open:rotate-90 transition-transform" />
                      </summary>
                      {items.length > 0 ? (
                        <div className="px-4 pb-3 flex flex-wrap gap-2">
                          {items.map((lbl, i) => (
                            <span key={i} className="text-xs bg-violet-50 text-violet-700 border border-violet-100 rounded-lg px-2 py-1">
                              {lbl}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <div className="px-4 pb-4 text-xs text-gray-500">No topics from this chapter in this test.</div>
                      )}
                    </details>
                  );
                })}

                {/* Only show "Other" if there are leftovers */}
                {buckets.other.length > 0 && (
                  <details className="rounded-xl border border-gray-200 bg-white group">
                    <summary className="cursor-pointer px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors">
                      <div className="flex items-center space-x-2">
                        <BookOpen className="w-4 h-4 text-gray-400" />
                        <span className="font-medium text-gray-900">Other</span>
                        <span className="text-sm text-gray-500">({buckets.other.length} topics)</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-500 group-open:rotate-90 transition-transform" />
                    </summary>
                    <div className="px-4 pb-3 flex flex-wrap gap-2">
                      {buckets.other.map((lbl, i) => (
                        <span key={i} className="text-xs bg-gray-50 text-gray-700 border border-gray-100 rounded-lg px-2 py-1">
                          {lbl}
                        </span>
                      ))}
                    </div>
                  </details>
                )}
              </div>
            )}
          </div>

          {/* Test Information */}
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-blue-900 mb-1">Test Information</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• This test follows the {test.exam} examination pattern</li>
                  <li>• All questions are mandatory and carry equal marks</li>
                  <li>• Review your answers before final submission</li>
                  <li>• Timer will be visible throughout the test</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
