// Playlist generation utility based on diagnostic results

export interface SkillScore {
  correct: number;
  total: number;
  percentage: number;
}

export interface Topic {
  id: string;
  title: string;
  skillTag: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  prerequisites?: string[];
}

export interface PlaylistResult {
  id: string;
  topics: Topic[];
  metadata: {
    generatedAt: Date;
    source: 'diagnostic';
    skillScores: Record<string, SkillScore>;
    totalQuestions: number;
    correctAnswers: number;
  };
}

// Mock topics - in production this would come from Firestore
const mockTopics: Topic[] = [
  // Beginner topics
  { id: 'vectors-intro', title: 'Introduction to Vectors', skillTag: 'basics', difficulty: 'beginner' },
  { id: 'vector-addition-basics', title: 'Vector Addition Basics', skillTag: 'vector-addition', difficulty: 'beginner' },
  { id: 'scalar-multiplication-intro', title: 'Scalar Multiplication Introduction', skillTag: 'scalar-multiplication', difficulty: 'beginner' },
  { id: 'vector-magnitude', title: 'Vector Magnitude and Length', skillTag: 'magnitude', difficulty: 'beginner' },
  { id: 'unit-vectors-basics', title: 'Unit Vectors Fundamentals', skillTag: 'unit-vectors', difficulty: 'beginner' },
  
  // Intermediate topics
  { id: 'dot-product', title: 'Dot Product and Applications', skillTag: 'dot-product', difficulty: 'intermediate', prerequisites: ['vectors-intro', 'vector-magnitude'] },
  { id: 'cross-product', title: 'Cross Product in 3D', skillTag: 'cross-product', difficulty: 'intermediate', prerequisites: ['dot-product'] },
  { id: 'vector-angles', title: 'Angles Between Vectors', skillTag: 'vector-angles', difficulty: 'intermediate', prerequisites: ['dot-product'] },
  { id: 'vector-projections', title: 'Vector Projections', skillTag: 'projections', difficulty: 'intermediate', prerequisites: ['dot-product'] },
  
  // Advanced topics
  { id: 'linear-independence', title: 'Linear Independence and Dependence', skillTag: 'linear-independence', difficulty: 'advanced', prerequisites: ['vector-addition-basics'] },
  { id: 'vector-spaces', title: 'Vector Spaces and Subspaces', skillTag: 'vector-spaces', difficulty: 'advanced', prerequisites: ['linear-independence'] },
  { id: 'orthogonality', title: 'Orthogonality and Orthonormal Sets', skillTag: 'orthogonality', difficulty: 'advanced', prerequisites: ['dot-product', 'unit-vectors-basics'] },
];

/**
 * Generate a personalized playlist based on diagnostic results
 * 
 * Logic:
 * - < 50%: Include topic + prerequisites (needs foundation)
 * - 50-99%: Skip basic prerequisites, include intermediate content
 * - 100%: Skip topic entirely (already mastered)
 * 
 * @param skillScores Record of skill performance
 * @param allTopics Available topics (optional, uses mock data if not provided)
 * @returns Generated playlist with ordered topics
 */
export function generatePlaylist(
  skillScores: Record<string, SkillScore>,
  allTopics: Topic[] = mockTopics
): PlaylistResult {
  const playlistId = `playlist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const selectedTopics: Topic[] = [];
  const includedSkills = new Set<string>();

  // Calculate overall performance
  const totalQuestions = Object.values(skillScores).reduce((sum, score) => sum + score.total, 0);
  const correctAnswers = Object.values(skillScores).reduce((sum, score) => sum + score.correct, 0);

  // Process each skill area
  Object.entries(skillScores).forEach(([skillTag, score]) => {
    const percentage = score.percentage;
    
    // Find topics for this skill
    const skillTopics = allTopics.filter(topic => topic.skillTag === skillTag);
    
    skillTopics.forEach(topic => {
      if (percentage === 100) {
        // Perfect score - skip this topic entirely
        return;
      } else if (percentage >= 50) {
        // Good performance - include intermediate/advanced content, skip basics
        if (topic.difficulty !== 'beginner') {
          selectedTopics.push(topic);
          includedSkills.add(skillTag);
        }
      } else {
        // Poor performance - include all content including prerequisites
        selectedTopics.push(topic);
        includedSkills.add(skillTag);
        
        // Include prerequisites
        if (topic.prerequisites) {
          const prerequisites = allTopics.filter(t => 
            topic.prerequisites!.includes(t.id) && 
            !selectedTopics.find(selected => selected.id === t.id)
          );
          selectedTopics.push(...prerequisites);
        }
      }
    });
  });

  // Add foundational topics for skills not covered in diagnostic
  const uncoveredSkills = ['basics', 'foundations'].filter(skill => !includedSkills.has(skill));
  uncoveredSkills.forEach(skillTag => {
    const foundationalTopics = allTopics.filter(topic => 
      topic.skillTag === skillTag && 
      topic.difficulty === 'beginner' &&
      !selectedTopics.find(selected => selected.id === topic.id)
    );
    selectedTopics.push(...foundationalTopics);
  });

  // Remove duplicates and sort by difficulty
  const uniqueTopics = Array.from(
    new Map(selectedTopics.map(topic => [topic.id, topic])).values()
  );

  // Sort by difficulty: beginner → intermediate → advanced
  const difficultyOrder = { 'beginner': 1, 'intermediate': 2, 'advanced': 3 };
  const sortedTopics = uniqueTopics.sort((a, b) => {
    const diffOrder = difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty];
    if (diffOrder !== 0) return diffOrder;
    
    // Secondary sort by title for consistency
    return a.title.localeCompare(b.title);
  });

  return {
    id: playlistId,
    topics: sortedTopics,
    metadata: {
      generatedAt: new Date(),
      source: 'diagnostic',
      skillScores,
      totalQuestions,
      correctAnswers,
    }
  };
}

/**
 * Calculate skill scores from diagnostic answers
 */
export function calculateSkillScores(answers: Array<{ skillTag: string; isCorrect: boolean }>): Record<string, SkillScore> {
  const skillCounts = answers.reduce((acc, answer) => {
    const skill = answer.skillTag;
    if (!acc[skill]) {
      acc[skill] = { correct: 0, total: 0 };
    }
    acc[skill].total += 1;
    if (answer.isCorrect) {
      acc[skill].correct += 1;
    }
    return acc;
  }, {} as Record<string, { correct: number; total: number }>);

  // Convert to SkillScore format with percentage
  return Object.entries(skillCounts).reduce((acc, [skill, counts]) => {
    acc[skill] = {
      ...counts,
      percentage: Math.round((counts.correct / counts.total) * 100)
    };
    return acc;
  }, {} as Record<string, SkillScore>);
}