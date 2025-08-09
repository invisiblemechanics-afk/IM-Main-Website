// Sample breakdown questions data organized by chapters
export interface BreakdownQuestion {
  id: string;
  title: string;
  text: string;
  type: 'MCQ' | 'Numerical' | 'Multiple Answer';
  difficulty: 'Easy' | 'Medium' | 'Hard';
  chapter: string;
  options?: string[];
  correct?: number | number[];
  img?: string;
  status: 'Not Attempted' | 'Correct Answer' | 'Wrong Answer';
}

export interface Chapter {
  id: string;
  name: string;
  questionCount: number;
}

export const chapters: Chapter[] = [
  { id: 'vectors', name: 'Vectors', questionCount: 12 },
  { id: 'rotation', name: 'Rotation', questionCount: 8 },
  { id: 'thermodynamics', name: 'Thermodynamics', questionCount: 15 },
  { id: 'waves', name: 'Waves', questionCount: 10 },
  { id: 'electricity', name: 'Electricity', questionCount: 18 },
];

export const breakdownQuestions: BreakdownQuestion[] = [
  // Vectors Chapter
  {
    id: 'vec-1',
    title: 'Vector Addition in 2D',
    text: 'Two vectors A and B are given with magnitudes 5 and 3 respectively. Find the magnitude of their resultant when the angle between them is 60°.',
    type: 'Numerical',
    difficulty: 'Medium',
    chapter: 'vectors',
    img: 'breakdowns-sample-image.png',
    status: 'Not Attempted'
  },
  {
    id: 'vec-2', 
    title: 'Dot Product Applications',
    text: 'Given vectors A = 3i + 4j and B = 2i - j, calculate the angle between them.',
    type: 'Numerical',
    difficulty: 'Medium',
    chapter: 'vectors',
    img: 'breakdowns-sample-image.png',
    status: 'Not Attempted'
  },
  {
    id: 'vec-3',
    title: 'Cross Product in 3D',
    text: 'Find the cross product of vectors A = i + 2j + 3k and B = 2i - j + k.',
    type: 'Multiple Answer',
    difficulty: 'Hard',
    chapter: 'vectors',
    options: [
      'The magnitude is √35',
      'The direction is along 5i + 5j - 5k',
      'It is perpendicular to both A and B',
      'The result is 5i + 5j - 5k'
    ],
    correct: [2, 3],
    img: 'breakdowns-sample-image.png',
    status: 'Not Attempted'
  },
  {
    id: 'vec-4',
    title: 'Unit Vector Calculation',
    text: 'A vector has components (6, 8, 0). What is its unit vector?',
    type: 'MCQ',
    difficulty: 'Easy',
    chapter: 'vectors',
    options: [
      '(0.6, 0.8, 0)',
      '(0.8, 0.6, 0)',
      '(6, 8, 0)',
      '(3, 4, 0)'
    ],
    correct: 0,
    img: 'breakdowns-sample-image.png',
    status: 'Not Attempted'
  },

  // Rotation Chapter
  {
    id: 'rot-1',
    title: 'Angular Momentum Conservation',
    text: 'Two thin circular discs of mass m and 4m, having radii of a and 2a, respectively, are rigidly fixed by a massless, rigid rod of length = √24a through their centers. This assembly is laid on a firm and flat surface, and set rolling without slipping on the surface so that the angular speed about the axis of the rod is ω. The angular momentum of the entire assembly about the point \'O\' is L (see the figure). Which of the following statement(s) is(are) true?',
    type: 'Multiple Answer',
    difficulty: 'Hard',
    chapter: 'rotation',
    options: [
      'The center of mass of the assembly rotates about the z-axis with an angular speed of ω/5',
      'The magnitude of angular momentum of center of mass of the assembly about the point O is 81ma²ω',
      'The magnitude of angular momentum of the assembly about its center of mass is 17ma²ω/2',
      'The magnitude of the z component of L is 55ma²ω'
    ],
    correct: [0, 2],
    img: 'breakdowns-sample-image.png',
    status: 'Not Attempted'
  },
  {
    id: 'rot-2',
    title: 'Rolling Motion',
    text: 'A solid cylinder rolls down an inclined plane. Find the ratio of rotational to translational kinetic energy.',
    type: 'MCQ',
    difficulty: 'Medium',
    chapter: 'rotation',
    options: ['1:2', '1:1', '2:1', '1:3'],
    correct: 0,
    img: 'breakdowns-sample-image.png',
    status: 'Not Attempted'
  },
  {
    id: 'rot-3',
    title: 'Component - Angular Momentum',
    text: 'The z-component of angular momentum is given by x/25 · ma² · w, find x',
    type: 'Numerical',
    difficulty: 'Hard',
    chapter: 'rotation',
    img: 'breakdowns-sample-image.png',
    status: 'Not Attempted'
  },

  // More sample questions for other chapters...
  {
    id: 'thermo-1',
    title: 'Ideal Gas Law Applications',
    text: 'An ideal gas undergoes an isothermal process. Calculate the work done when the volume changes from V to 2V.',
    type: 'Numerical',
    difficulty: 'Medium',
    chapter: 'thermodynamics',
    img: 'breakdowns-sample-image.png',
    status: 'Not Attempted'
  },
  {
    id: 'waves-1',
    title: 'Wave Interference',
    text: 'Two waves with the same frequency and amplitude interfere constructively. What is the amplitude of the resultant wave?',
    type: 'MCQ',
    difficulty: 'Easy',
    chapter: 'waves',
    options: ['A', '2A', 'A/2', '0'],
    correct: 1,
    img: 'breakdowns-sample-image.png',
    status: 'Not Attempted'
  },
  {
    id: 'elec-1',
    title: 'Electric Field Calculations',
    text: 'Calculate the electric field at a point due to a point charge using Coulomb\'s law.',
    type: 'Numerical',
    difficulty: 'Easy',
    chapter: 'electricity',
    img: 'breakdowns-sample-image.png',
    status: 'Not Attempted'
  }
];

// Helper functions
export const getQuestionsByChapter = (chapterId: string): BreakdownQuestion[] => {
  return breakdownQuestions.filter(q => q.chapter === chapterId);
};

export const getQuestionById = (questionId: string): BreakdownQuestion | undefined => {
  return breakdownQuestions.find(q => q.id === questionId);
};

export const getChapterById = (chapterId: string): Chapter | undefined => {
  return chapters.find(c => c.id === chapterId);
};