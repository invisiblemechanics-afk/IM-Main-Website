import React, { useState, useMemo } from 'react';
import { Search, X, Tag } from 'lucide-react';

interface GlobalTagPickerProps {
  selectedTags: string[];
  onChange: (tags: string[]) => void;
  allTags?: Array<{ tag: string; chapter: string }>;
}

// Mock data - TODO: Replace with useAllSkillTags() when available
const mockAllTags = [
  { tag: 'kinematics', chapter: 'Motion in a Straight Line' },
  { tag: 'dynamics', chapter: 'Laws of Motion' },
  { tag: 'work-energy', chapter: 'Work, Energy and Power' },
  { tag: 'rotational-motion', chapter: 'System of Particles and Rotational Motion' },
  { tag: 'gravitation', chapter: 'Gravitation' },
  { tag: 'simple-harmonic-motion', chapter: 'Oscillations' },
  { tag: 'waves', chapter: 'Waves' },
  { tag: 'thermodynamics', chapter: 'Thermodynamics' },
  { tag: 'kinetic-theory', chapter: 'Kinetic Theory' },
  { tag: 'electrostatics', chapter: 'Electric Charges and Fields' },
  { tag: 'current-electricity', chapter: 'Current Electricity' },
  { tag: 'magnetic-effects', chapter: 'Moving Charges and Magnetism' },
  { tag: 'electromagnetic-induction', chapter: 'Electromagnetic Induction' },
  { tag: 'alternating-current', chapter: 'Alternating Current' },
  { tag: 'optics', chapter: 'Ray Optics and Optical Instruments' },
  { tag: 'refractive-index', chapter: 'Ray Optics and Optical Instruments' },
  { tag: 'ray-optics', chapter: 'Ray Optics and Optical Instruments' },
  { tag: 'lens', chapter: 'Ray Optics and Optical Instruments' },
  { tag: 'mirror', chapter: 'Ray Optics and Optical Instruments' },
  { tag: 'reflection', chapter: 'Ray Optics and Optical Instruments' },
  { tag: 'refraction', chapter: 'Ray Optics and Optical Instruments' },
  { tag: 'wave-optics', chapter: 'Wave Optics' },
  { tag: 'interference', chapter: 'Wave Optics' },
  { tag: 'diffraction', chapter: 'Wave Optics' },
  { tag: 'polarization', chapter: 'Wave Optics' },
  { tag: 'modern-physics', chapter: 'Dual Nature of Radiation and Matter' },
  { tag: 'atomic-structure', chapter: 'Atoms' },
  { tag: 'nuclear-physics', chapter: 'Nuclei' },
  { tag: 'semiconductors', chapter: 'Semiconductor Electronics' },
];

export default function GlobalTagPicker({ 
  selectedTags, 
  onChange, 
  allTags = mockAllTags 
}: GlobalTagPickerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  const filteredTags = useMemo(() => {
    return allTags.filter(item => 
      item.tag.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.chapter.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [allTags, searchTerm]);

  const handleTagToggle = (tag: string) => {
    if (selectedTags.includes(tag)) {
      onChange(selectedTags.filter(t => t !== tag));
    } else {
      onChange([...selectedTags, tag]);
    }
  };

  const handleRemoveTag = (tag: string) => {
    onChange(selectedTags.filter(t => t !== tag));
  };

  const getTagChapter = (tag: string) => {
    return allTags.find(item => item.tag === tag)?.chapter || '';
  };

  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-2">Selected Topics</h4>
        
        {/* Selected Tags Display */}
        {selectedTags.length > 0 ? (
          <div className="flex flex-wrap gap-2 mb-3">
            {selectedTags.map(tag => (
              <span
                key={tag}
                className="inline-flex items-center space-x-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
              >
                <Tag className="w-3 h-3" />
                <span className="font-medium">{tag}</span>
                <span className="text-xs opacity-75">
                  [{getTagChapter(tag)}]
                </span>
                <button
                  onClick={() => handleRemoveTag(tag)}
                  className="ml-1 hover:bg-blue-200 rounded-full p-0.5 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 mb-3">No topics selected (all topics will be included)</p>
        )}

        {/* Search and Toggle */}
        <div className="flex space-x-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-3 py-2 text-sm font-medium text-primary-600 border border-primary-200 rounded-lg hover:bg-primary-50 transition-colors"
          >
            {isExpanded ? 'Hide Topics' : 'Select Topics'}
          </button>
          
          {selectedTags.length > 0 && (
            <button
              onClick={() => onChange([])}
              className="px-3 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Expandable Tag Picker */}
      {isExpanded && (
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          {/* Search Input */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search topics or chapters..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* Tags Grid */}
          <div className="max-h-64 overflow-y-auto space-y-1">
            {filteredTags.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">
                No topics found matching "{searchTerm}"
              </p>
            ) : (
              filteredTags.map(({ tag, chapter }) => (
                <label
                  key={tag}
                  className="flex items-center space-x-3 p-2 hover:bg-white rounded-lg cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedTags.includes(tag)}
                    onChange={() => handleTagToggle(tag)}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-900 text-sm">{tag}</span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-200 text-gray-700">
                        {chapter}
                      </span>
                    </div>
                  </div>
                </label>
              ))
            )}
          </div>

          {/* Quick Actions */}
          <div className="mt-4 pt-3 border-t border-gray-200 flex justify-between">
            <button
              onClick={() => onChange(allTags.map(item => item.tag))}
              className="text-xs text-primary-600 hover:text-primary-800 font-medium"
            >
              Select All
            </button>
            <button
              onClick={() => setIsExpanded(false)}
              className="text-xs text-gray-600 hover:text-gray-800 font-medium"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
