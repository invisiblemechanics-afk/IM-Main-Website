import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, doc } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { MockTest } from '../types';

export function useTests() {
  const [tests, setTests] = useState<MockTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadTests = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch tests from Firestore Tests collection
        const testsCollection = collection(firestore, 'Tests');
        const testsQuery = query(testsCollection, orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(testsQuery);
        
        const testsData: MockTest[] = [];
        
        // Process each test document
        for (const testDoc of querySnapshot.docs) {
          const data = testDoc.data();
          
          // Convert duration from seconds to minutes
          const durationMinutes = data.durationSec ? Math.round(data.durationSec / 60) : (data.duration || 180);
          
          // Fetch Questions subcollection to get actual question data
          let calculatedDifficulty = { easy: 33, moderate: 34, tough: 33 };
          let actualQuestionCount = data.totalQuestions || 30;
          let skillTags: string[] = data.skillTags || [];
          let chapterTopics: Record<string, string[]> = {};
          
          // Get syllabus chapters from test document 
          const syllabusChapters = data.syllabusChapters || [];
          
          try {
            const questionsRef = collection(firestore, 'Tests', testDoc.id, 'Questions');
            const questionsSnapshot = await getDocs(questionsRef);
            
            if (!questionsSnapshot.empty) {
              const questions = questionsSnapshot.docs.map(qDoc => qDoc.data());
              actualQuestionCount = questions.length;
              console.log(`Test ${testDoc.id}: Found ${questions.length} questions in subcollection`);
              
              // Calculate difficulty distribution from actual questions
              if (questions.length > 0) {
                const difficulties = questions.map(q => q.difficulty || 5);
                const totalDifficulty = difficulties.reduce((sum, diff) => sum + diff, 0);
                const avgDifficulty = totalDifficulty / questions.length;
                
                // Categorize based on average difficulty
                if (avgDifficulty <= 5) {
                  calculatedDifficulty = { easy: 80, moderate: 15, tough: 5 };
                } else if (avgDifficulty <= 8) {
                  calculatedDifficulty = { easy: 20, moderate: 60, tough: 20 };
                } else {
                  calculatedDifficulty = { easy: 10, moderate: 30, tough: 60 };
                }
                
                // Function to format skill tag for display
                const formatSkillTag = (skillTag: string): string => {
                  return skillTag
                    .replace(/-/g, ' ') // Replace hyphens with spaces
                    .replace(/\b\w/g, l => l.toUpperCase()); // Capitalize first letter of each word
                };

                // Function to infer chapter from topic name based on syllabus chapters
                const inferChapterFromTopic = (topic: string, syllabusChapters: string[]): string => {
                  const topicLower = topic.toLowerCase();
                  
                  // First try direct chapter name matching
                  for (const syllabusChapter of syllabusChapters) {
                    const chapterLower = syllabusChapter.toLowerCase();
                    const topicClean = topicLower.replace(/[-\s]/g, '');
                    const chapterClean = chapterLower.replace(/[-\s&,]/g, '');
                    if (topicClean.includes(chapterClean) || chapterClean.includes(topicClean)) {
                      return syllabusChapter;
                    }
                  }
                  
                  // Comprehensive topic-to-chapter mapping
                  const topicMappings = {
                    // Alternating Current
                    'Alternating Current': [
                      'lcr', 'inductance', 'parallel circuit', 'series circuit', 'ac circuit',
                      'alternating current', 'impedance', 'reactance', 'resonance'
                    ],
                    
                    // Electrostatics  
                    'Electrostatics': [
                      'charge', 'electric field', 'electric potential', 'capacitor', 'dielectric',
                      'rc circuit', 'electrostatic', 'coulomb', 'gauss law', 'electric flux'
                    ],
                    
                    // Center of Mass / Centre of Mass
                    'Center of Mass': [
                      'center of mass', 'centre of mass', 'centripetal', 'centrifugal',
                      'center', 'centre', 'com', 'mass center'
                    ],
                    'Centre of Mass': [
                      'center of mass', 'centre of mass', 'centripetal', 'centrifugal', 
                      'center', 'centre', 'com', 'mass center'
                    ],
                    
                    // Laws of Motion
                    'Laws of Motion': [
                      'newton', 'contact force', 'friction', 'normal force', 'tension',
                      'force', 'law of motion', 'f=ma', 'inertia', 'momentum'
                    ],
                    
                    // Magnetism
                    'Magnetism': [
                      'magnetic', 'magnet', 'magnetic field', 'magnetic flux', 'electromagnet',
                      'magnetic force', 'magnetic dipole', 'magnetic moment'
                    ],
                    
                    // Ray Optics
                    'Ray Optics': [
                      'lens', 'mirror', 'image', 'reflection', 'refraction', 'optical',
                      'convex', 'concave', 'aberration', 'focal', 'ray', 'light',
                      'converging', 'diverging', 'distance', 'cyclotron', 'bending',
                      'refractive index', 'refractive-index', 'refractiveindex', 'snell',
                      'critical angle', 'total internal reflection', 'prism', 'dispersion'
                    ],
                    
                    // Wave Optics
                    'Wave Optics': [
                      'interference', 'diffraction', 'polarization', 'young', 'double slit',
                      'coherent', 'incoherent', 'fringe', 'wavelength', 'amplitude',
                      'phase', 'huygens', 'fresnel', 'wave nature', 'wave-optics'
                    ],
                    
                    // Rotation
                    'Rotation': [
                      'rotation', 'rotational', 'angular', 'torque', 'moment of inertia',
                      'rigid body', 'rolling', 'spin', 'axis', 'centripetal', 'tangential',
                      'total acceleration', 'uniform', 'pure rolling', 'ball', 'rod',
                      'collision', 'instantaneous', 'relative', 'closest approach'
                    ],
                    
                    // Thermodynamics
                    'Thermodynamics': [
                      'heat', 'temperature', 'thermal', 'gas', 'pressure', 'volume',
                      'entropy', 'enthalpy', 'density', 'liquid', 'solid', 'phase',
                      'thermodynamic', 'expansion', 'compression', 'immersed', 'apparent weight'
                    ],
                    
                    // Work, Power & Energy
                    'Work, Power & Energy': [
                      'work', 'energy', 'power', 'kinetic energy', 'potential energy',
                      'spring', 'elastic', 'conservation', 'mechanical energy',
                      'gravitational', 'oscillation', 'simple harmonic'
                    ]
                  };
                  
                  // Check each syllabus chapter against topic mappings
                  for (const syllabusChapter of syllabusChapters) {
                    const keywords = topicMappings[syllabusChapter as keyof typeof topicMappings];
                    if (keywords) {
                      for (const keyword of keywords) {
                        if (topicLower.includes(keyword)) {
                          return syllabusChapter;
                        }
                      }
                    }
                  }
                  
                  return 'Other';
                };

                // Use skillTags from document level, not from individual questions
                const testSkillTags = data.skillTags || [];
                
                // Initialize chapter topics with syllabus chapters
                syllabusChapters.forEach((chapter: string) => {
                  chapterTopics[chapter] = [];
                });
                
                // Organize skillTags by their respective chapters
                testSkillTags.forEach((skillTag: string) => {
                  const formattedTag = formatSkillTag(skillTag);
                  const chapter = inferChapterFromTopic(skillTag, syllabusChapters);
                  
                  // Debug specific topics that were mentioned as problematic
                  if (skillTag.includes('uniform') || skillTag.includes('rolling') || 
                      skillTag.includes('ball') || skillTag.includes('collision')) {
                    console.log(`🔍 Mapping "${skillTag}" → "${chapter}"`);
                  }
                  
                  if (chapter === 'Other') {
                    // Only add to Other if the chapter is not in syllabusChapters
                    if (!chapterTopics['Other']) {
                      chapterTopics['Other'] = [];
                    }
                    if (!chapterTopics['Other'].includes(formattedTag)) {
                      chapterTopics['Other'].push(formattedTag);
                    }
                  } else {
                    // Add to the identified chapter from syllabusChapters
                    if (!chapterTopics[chapter].includes(formattedTag)) {
                      chapterTopics[chapter].push(formattedTag);
                    }
                  }
                });

                // Remove empty chapters
                Object.keys(chapterTopics).forEach(chapter => {
                  if (chapterTopics[chapter].length === 0) {
                    delete chapterTopics[chapter];
                  }
                });
                
                // Extract all skill tags for backward compatibility using formatted tags
                skillTags = testSkillTags.map(formatSkillTag);
              }
            }
          } catch (questionsError) {
            console.warn(`Failed to fetch questions for test ${testDoc.id}:`, questionsError);
            // Fall back to document-level data
          }
          
          testsData.push({
            id: testDoc.id,
            name: data.name || 'Test 1',
            exam: data.exam || 'JEE Main',
            duration: durationMinutes,
            totalQuestions: actualQuestionCount,
            difficulty: calculatedDifficulty,
            skillTags: skillTags,
            syllabusChapters: syllabusChapters,
            chapterTopics: chapterTopics,
            createdBy: data.createdBy || 'admin',
            createdAt: data.createdAt?.toDate?.()?.toISOString?.()?.split('T')[0] || new Date().toISOString().split('T')[0]
          });
        }
        
        console.log(`Loaded ${testsData.length} tests from Firestore`);
        if (testsData.length > 0) {
          console.log('Sample test data:', testsData[0]);
          console.log('Syllabus chapters:', testsData[0].chapterTopics ? Object.keys(testsData[0].chapterTopics) : 'none');
          console.log('Chapter organization:', testsData[0].chapterTopics);
        }
        setTests(testsData);
      } catch (err) {
        console.error('Failed to load tests from Firestore:', err);
        setError(err instanceof Error ? err.message : 'Failed to load tests');
        setTests([]);
      } finally {
        setLoading(false);
      }
    };

    loadTests();
  }, []);

  return { tests, loading, error };
}
