import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '@/styles/nta-mock.css';
import { getHydratedTest, AttemptQuestion } from '@/services/tests';
import { LaTeXRenderer } from '@/components/LaTeXRenderer';
import { evaluateOne, aggregate, type UserResponse, type TestQuestion } from '@/lib/mocktests/evaluate';
import { firestore as db, auth } from '@/lib/firebase';
import { doc, setDoc, serverTimestamp, collection } from 'firebase/firestore';
import TestGuard from '@/components/proctoring/TestGuard';
import ntaLogo from '@/assets/images/NTA_logo.png';
import moeLogo from '@/assets/images/moe1.png';
import azadiLogo from '@/assets/images/akam.png';
import Logo1 from '@/assets/images/Logo1.png';
import Logo2 from '@/assets/images/Logo2.png';
import Logo3 from '@/assets/images/Logo3.png';
import Logo4 from '@/assets/images/Logo4.png';
import Logo5 from '@/assets/images/Logo5.png';

type Status = 'unvisited' | 'notanswered' | 'answered' | 'marked' | 'ansmarked';

interface AnswerState {
  response?: number | number[] | string;
  status: Status;
  marked?: boolean;
  visited?: boolean;
}

export default function MockAttempt() {
  const { testId = '' } = useParams<{ testId: string }>();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [test, setTest] = useState<Awaited<ReturnType<typeof getHydratedTest>> | null>(null);
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, AnswerState>>({});
  const [remaining, setRemaining] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);
  const attemptStartRef = useRef<number>(Date.now());

  // Track responses and per-question timing
  const [responses, setResponses] = useState<Record<string, UserResponse>>({});
  const [timeMap, setTimeMap] = useState<Record<string, number>>({});
  const [activeQid, setActiveQid] = useState<string | null>(null);
  const [enteredAt, setEnteredAt] = useState<number | null>(null);

  const enterQuestion = useCallback((qid: string) => {
    // close timing of previous question
    if (activeQid && enteredAt) {
      const delta = Math.floor((Date.now() - enteredAt) / 1000);
      setTimeMap((prev) => ({ ...prev, [activeQid!]: (prev[activeQid!] ?? 0) + delta }));
    }
    setActiveQid(qid);
    setEnteredAt(Date.now());
  }, [activeQid, enteredAt]);

  const stopTiming = useCallback(() => {
    if (activeQid && enteredAt) {
      const delta = Math.floor((Date.now() - enteredAt) / 1000);
      setTimeMap((prev) => ({ ...prev, [activeQid!]: (prev[activeQid!] ?? 0) + delta }));
      setEnteredAt(null);
    }
  }, [activeQid, enteredAt]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    (async () => {
      setLoading(true);
      const t = await getHydratedTest(testId);
      setTest(t);
      attemptStartRef.current = Date.now();
      const init: Record<string, AnswerState> = {};
      t.questions.forEach(q => { init[q.id] = { status: 'unvisited' }; });
      setAnswers(init);

      // Clean up old timer entries for this test (keep localStorage clean)
      const oldKey = `ntaTimer:${testId}`;
      localStorage.removeItem(oldKey);
      
      // Clean up old attempt entries (older than 24 hours)
      const now = Date.now();
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith(`ntaAttempt:${testId}:`)) {
          const timestamp = parseInt(key.split(':')[2]);
          if (now - timestamp > 24 * 60 * 60 * 1000) { // 24 hours
            localStorage.removeItem(key);
          }
        }
      });
      
      // Always start a fresh timer for each test attempt
      const start = now;
      const end = start + t.durationMinutes * 60_000;
      
      const tick = () => {
        const remainingTime = Math.max(0, Math.floor((end - Date.now()) / 1000));
        setRemaining(remainingTime);
        
        // Auto-submit when timer reaches zero
        if (remainingTime === 0) {
          console.log('Timer ended - Auto-submitting test');
          navigate(`/mock-tests/result/${testId}`);
        }
      };
      
      tick();
      interval = setInterval(tick, 1000);
    })().finally(() => setLoading(false));

    // Cleanup function
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [testId, navigate]);

  // Group questions by type
  const groupedQuestions = useMemo(() => {
    if (!test?.questions) return { sections: [], questionMap: new Map() };
    
    const mcqQuestions = test.questions.filter(q => q.type === 'MCQ');
    const multipleAnswerQuestions = test.questions.filter(q => q.type === 'MultipleAnswer');
    const numericalQuestions = test.questions.filter(q => q.type === 'Numerical');
    
    const sections = [];
    const questionMap = new Map();
    let globalIndex = 0;
    
    if (mcqQuestions.length > 0) {
      sections.push({
        name: 'Single Correct Answer (MCQ)',
        type: 'MCQ',
        questions: mcqQuestions,
        startIndex: globalIndex,
        endIndex: globalIndex + mcqQuestions.length - 1
      });
      mcqQuestions.forEach((q, localIndex) => {
        questionMap.set(globalIndex + localIndex, { question: q, sectionIndex: 0, localIndex });
      });
      globalIndex += mcqQuestions.length;
    }
    
    if (multipleAnswerQuestions.length > 0) {
      sections.push({
        name: 'Multiple Correct Answer',
        type: 'MultipleAnswer',
        questions: multipleAnswerQuestions,
        startIndex: globalIndex,
        endIndex: globalIndex + multipleAnswerQuestions.length - 1
      });
      multipleAnswerQuestions.forEach((q, localIndex) => {
        questionMap.set(globalIndex + localIndex, { question: q, sectionIndex: sections.length - 1, localIndex });
      });
      globalIndex += multipleAnswerQuestions.length;
    }
    
    if (numericalQuestions.length > 0) {
      sections.push({
        name: 'Numerical Answer',
        type: 'Numerical',
        questions: numericalQuestions,
        startIndex: globalIndex,
        endIndex: globalIndex + numericalQuestions.length - 1
      });
      numericalQuestions.forEach((q, localIndex) => {
        questionMap.set(globalIndex + localIndex, { question: q, sectionIndex: sections.length - 1, localIndex });
      });
    }
    
    return { sections, questionMap };
  }, [test?.questions]);

  const totalQuestions = groupedQuestions.questionMap.size;
  const currentQuestionData = groupedQuestions.questionMap.get(idx);
  const q: AttemptQuestion | null = currentQuestionData?.question || null;

  const counts = useMemo(() => {
    const result = { unvisited: 0, notanswered: 0, answered: 0, marked: 0, ansmarked: 0 };
    if (!test) return result;
    for (const qq of test.questions) {
      const s = (answers[qq.id]?.status ?? 'unvisited') as Status;
      if (s in result) (result as any)[s] += 1; else result.unvisited += 1;
    }
    return result;
  }, [answers, test]);

  useEffect(() => {
    if (!q) return;
    setAnswers(prev => {
      const curr = prev[q.id] || { status: 'unvisited' };
      if (!curr.visited) return { ...prev, [q.id]: { ...curr, visited: true, status: curr.status === 'unvisited' ? 'notanswered' : curr.status } };
      return prev;
    });
    bodyRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    if (q) enterQuestion(q.id);
  }, [q?.id, enterQuestion]);

  const onSelect = (payload: number | number[] | string) => {
    if (!q) return;
    setAnswers(prev => {
      const curr = prev[q.id] || { status: 'unvisited' };
      const resp = payload;
      const hasAns = (typeof resp === 'number' && !Number.isNaN(resp)) || (Array.isArray(resp) && resp.length > 0) || (typeof resp === 'string' && resp.trim() !== '');
      const status: Status = curr.marked ? (hasAns ? 'ansmarked' : 'marked') : (hasAns ? 'answered' : 'notanswered');
      return { ...prev, [q.id]: { ...curr, response: resp, status } };
    });

    // Mirror into responses state for evaluation
    setResponses(prev => {
      const next: UserResponse =
        q.type === 'MCQ'
          ? { kind: 'MCQ', choiceIndex: typeof payload === 'number' ? (payload as number) : undefined }
          : q.type === 'MultipleAnswer'
          ? { kind: 'MultipleAnswer', choiceIndices: Array.isArray(payload) ? (payload as number[]) : [] }
          : { kind: 'Numerical', value: String(payload ?? '') };
      return { ...prev, [q.id]: next };
    });
  };

  const saveAndNext = () => goTo(idx + 1);
  const clearResponse = () => { if (!q) return; onSelect(q.type === 'MultipleAnswer' ? [] : q.type === 'MCQ' ? NaN : ''); };
  const saveAndMark = () => {
    if (!q) return;
    setAnswers(prev => {
      const curr = prev[q.id] || { status: 'notanswered' };
      const hasAns = curr.response !== undefined && ((Array.isArray(curr.response) && curr.response.length) || (typeof curr.response === 'number' && !Number.isNaN(curr.response)) || (typeof curr.response === 'string' && (curr.response as string).trim() !== ''));
      return { ...prev, [q.id]: { ...curr, marked: true, status: hasAns ? 'ansmarked' : 'marked' } };
    });
  };
  const markAndNext = () => { saveAndMark(); goTo(idx + 1); };

  const goTo = (next: number) => {
    if (!test) return;
    const clamped = Math.min(totalQuestions - 1, Math.max(0, next));
    setIdx(clamped);
  };

  const handleSubmitTest = useCallback(async (isViolation: boolean = false) => {
    if (!test) {
      console.error('No test data available for submission');
      alert('Test data is not available. Please refresh and try again.');
      return;
    }
    
    if (isSubmitting) {
      console.log('Submission already in progress, ignoring duplicate request');
      return;
    }

    // Check authentication
    if (!auth.currentUser) {
      console.error('User not authenticated');
      alert('You must be logged in to submit the test. Please sign in and try again.');
      return;
    }
    
    console.log('Starting test submission...', { 
      isViolation, 
      isViolationBoolean: Boolean(isViolation),
      testId: test.id, 
      userId: auth.currentUser.uid,
      questionsCount: Object.keys(responses).length
    });
    setIsSubmitting(true);
    stopTiming();

    try {
      // Evaluate in the same order as displayed (grouped by type)
      const orderedQuestions: TestQuestion[] = [];
      
      // Add questions in the same order as groupedQuestions
      groupedQuestions.sections.forEach(section => {
        section.questions.forEach(q => {
          orderedQuestions.push(q as unknown as TestQuestion);
        });
      });

      if (orderedQuestions.length === 0) {
        throw new Error('No questions found for evaluation');
      }

      console.log('Evaluating', orderedQuestions.length, 'questions...');
      const evals = orderedQuestions.map((qq) =>
        evaluateOne(
          qq,
          responses[qq.id],
          timeMap[qq.id] ?? 0,
          { marksCorrect: undefined, marksWrong: undefined }
        )
      );

      const durationSec = Math.max(0, Math.floor((Date.now() - attemptStartRef.current) / 1000));
      const analytics = aggregate(evals, orderedQuestions, durationSec, { marksCorrect: undefined, marksWrong: undefined });

      // Persist attempt under user document
      const uid = auth.currentUser.uid;
      
      // Generate a more reliable attempt ID
      const attemptId = `attempt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Streamlined payload creation (remove unnecessary deep cleaning)
      const cleanTotals = {
        totalQuestions: analytics.totals.totalQuestions || 0,
        attempted: analytics.totals.attempted || 0,
        correct: analytics.totals.correct || 0,
        incorrect: analytics.totals.incorrect || 0,
        partial: analytics.totals.partial || 0,
        unattempted: analytics.totals.unattempted || 0,
        score: analytics.totals.score || 0,
        maxScore: analytics.totals.maxScore || 0,
        durationSec: analytics.totals.durationSec || 0,
      };

      // Simplified cleaning for byDifficulty and byChapter
      const cleanByDifficulty = analytics.byDifficulty || {};
      const cleanByChapter = analytics.byChapter || {};

      const payload = {
        testId: String(test.id || ''),
        testTitle: String(test.name || ''),
        exam: String(test.exam || ''),
        startedAt: new Date(attemptStartRef.current).toISOString(),
        submittedAt: serverTimestamp(),
        isViolation: Boolean(isViolation),
        totals: cleanTotals,
        byDifficulty: cleanByDifficulty,
        byChapter: cleanByChapter,
        perQuestion: analytics.perQuestion.map((pq) => ({
          qid: pq.qid || '',
          result: pq.result || 'unattempted',
          score: pq.score || 0,
          timeSec: pq.timeSec || 0,
          difficulty: pq.difficulty || 'unknown',
          type: pq.type || 'MCQ',
          chapter: pq.chapter || null,
          chapterId: pq.chapterId || null,
          skillTags: pq.skillTags || [],
          response: responses[pq.qid] || null,
          questionText: pq.questionText || '',
          choices: pq.choices || [],
        })),
      };

      // Fast submission to Firestore
      console.log('Submitting test attempt...', { attemptId, uid, isViolation: payload.isViolation });
      
      const docRef = doc(collection(db, 'users', uid, 'mockTestAttempts'), attemptId);
      await setDoc(docRef, payload);

      console.log('Test submitted successfully, navigating to results...');
      navigate(`/mock-tests/result/${attemptId}`);
    } catch (error) {
      console.error('Error submitting test:', error);
      
      // More detailed error reporting
      let errorMessage = 'There was an error submitting your test.';
      if (error instanceof Error) {
        console.error('Error details:', error.message, error.stack);
        if (error.message.includes('Converting circular structure to JSON')) {
          errorMessage = 'Data structure error. Please refresh the page and try again.';
        } else if (error.message.includes('Failed to serialize test data')) {
          errorMessage = 'Data serialization error. Please refresh the page and try again.';
        } else if (error.message.includes('permission-denied')) {
          errorMessage = 'Permission denied. Please check your account permissions and try again.';
        } else if (error.message.includes('network')) {
          errorMessage = 'Network error. Please check your internet connection and try again.';
        } else if (error.message.includes('quota')) {
          errorMessage = 'Storage quota exceeded. Please contact support.';
        } else {
          errorMessage = `Error: ${error.message}`;
        }
      }
      
      setIsSubmitting(false);
      alert(errorMessage + ' Please contact support if the issue persists.');
    }
  }, [test, groupedQuestions, responses, timeMap, navigate]);

  // Wrapper for proctoring auto-submit (must be idempotent)
  const handleAutoSubmit = useCallback(async (isViolation: boolean = false) => {
    console.log('Auto-submitting test due to proctoring violation:', isViolation);
    await handleSubmitTest(isViolation);
  }, [handleSubmitTest]);

  const fmt = (sec:number) => {
    const h = Math.floor(sec/3600).toString().padStart(2,'0');
    const m = Math.floor((sec%3600)/60).toString().padStart(2,'0');
    const s = Math.floor(sec%60).toString().padStart(2,'0');
    return `${h}:${m}:${s}`;
  };

  if (loading || !test || !q) return <div className="p-6 text-center">Loading test…</div>;

  return (
    <TestGuard onAutoSubmit={handleAutoSubmit}>
      <div id="nta-mock-root">
      {/* Top blue bar */}
      <div className="nta-topbar">
        <div className="home">Home</div>
        <div className="right">
          <span>Default Language</span>
          <select>
            <option>English</option>
            <option>Hindi</option>
          </select>
              </div>
            </div>

      {/* Logos + info strip like NTA */}
      <div className="nta-header-strip">
        <div className="nta-logos">
          <img src={ntaLogo} alt="NTA" />
          <img src={moeLogo} alt="MOE" />
          <img src={azadiLogo} alt="Azadi" />
              </div>
        <div className="nta-info">
          <div className="nta-candidate">
            <div className="nta-avatar">👤</div>
            <div className="nta-meta">
              <small>Candidate Name : <b>[Your Name]</b></small>
              <small>Exam Name : <b>{test?.name}</b></small>
              <small>Remaining Time : <span className="nta-timer">{fmt(remaining)}</span></small>
            </div>
          </div>
        </div>
      </div>

      {/* Layout */}
      <div className="nta-layout">
        {/* Paper */}
        <div className="nta-paper">
          <div className="nta-paper-head">
            Question {idx + 1} : 
            {currentQuestionData && (
              <span style={{ fontSize: '12px', color: '#666', marginLeft: '8px' }}>
                ({groupedQuestions.sections[currentQuestionData.sectionIndex]?.name})
              </span>
            )}
          </div>
          <div ref={bodyRef} className="nta-paper-body">
            <div style={{ whiteSpace: 'pre-wrap' }}>
              <LaTeXRenderer>{q.questionText}</LaTeXRenderer>
            </div>
            {q.imageUrl ? <div className="mt-2"><img src={q.imageUrl} alt="" style={{ maxWidth: '100%' }} /></div> : null}

            <div className="nta-options">
              {q.type === 'MCQ' && (q.choices || []).map((c, i) => (
                <label key={i} className="nta-option">
                  <input type="radio" name={`mcq-${q.id}`} checked={answers[q.id]?.response === i} onChange={() => onSelect(i)} />
                  <span><LaTeXRenderer>{c}</LaTeXRenderer></span>
                </label>
              ))}

              {q.type === 'MultipleAnswer' && (q.choices || []).map((c, i) => {
                const arr = Array.isArray(answers[q.id]?.response) ? (answers[q.id]?.response as number[]) : [];
                const checked = arr.includes(i);
                return (
                  <label key={i} className="nta-option">
                    <input type="checkbox" checked={checked} onChange={(e) => { const next = new Set(arr); if (e.target.checked) next.add(i); else next.delete(i); onSelect(Array.from(next.values()).sort()); }} />
                    <span><LaTeXRenderer>{c}</LaTeXRenderer></span>
                  </label>
                );
              })}

              {q.type === 'Numerical' && (
                <div className="nta-option">
                  <input type="text" value={(answers[q.id]?.response as string) ?? ''} onChange={(e) => onSelect(e.target.value)} style={{ width: '260px', padding: '6px 8px', border: '1px solid #cbd5e1', borderRadius: '2px' }} />
                </div>
              )}
            </div>
          </div>

          <div className="nta-actions">
            <button className="btn btn-green" onClick={saveAndNext}>SAVE & NEXT</button>
            <button className="btn btn-grey" onClick={clearResponse}>CLEAR</button>
            <button className="btn btn-amber" onClick={saveAndMark}>SAVE & MARK FOR REVIEW</button>
            <button className="btn btn-blue" onClick={markAndNext}>MARK FOR REVIEW & NEXT</button>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
              <button className="btn btn-outline" onClick={() => goTo(idx - 1)}>« BACK</button>
              <button className="btn btn-outline" onClick={() => goTo(idx + 1)}>NEXT »</button>
              <button 
                className="btn btn-green" 
                onClick={() => handleSubmitTest(false)}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'SUBMITTING...' : 'SUBMIT'}
              </button>
            </div>
        </div>
      </div>

        {/* Right panel */}
        <aside className="nta-right">
          <div className="nta-legend">
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8 }}>
              <div className="num active" style={{ width: 40 }}> {idx + 1} </div>
              <div><b>Question Navigator</b></div>
            </div>
            <ul>
              <li style={{ display:'flex', alignItems:'center', gap:8 }}>
                <div style={{ position: 'relative', display: 'inline-block' }}>
                  <img src={Logo1} alt="Not visited" className="nta-statusimg" />
                  <span style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: '12px', fontWeight: 'bold', color: '#000' }}>{counts.unvisited}</span>
                </div>
                <span>Not Visited</span>
              </li>
              <li style={{ display:'flex', alignItems:'center', gap:8 }}>
                <div style={{ position: 'relative', display: 'inline-block' }}>
                  <img src={Logo2} alt="Not answered" className="nta-statusimg" />
                  <span style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: '12px', fontWeight: 'bold', color: '#fff' }}>{counts.notanswered}</span>
                </div>
                <span>Not Answered</span>
              </li>
              <li style={{ display:'flex', alignItems:'center', gap:8 }}>
                <div style={{ position: 'relative', display: 'inline-block' }}>
                  <img src={Logo3} alt="Answered" className="nta-statusimg" />
                  <span style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: '12px', fontWeight: 'bold', color: '#fff' }}>{counts.answered}</span>
                </div>
                <span>Answered</span>
              </li>
              <li style={{ display:'flex', alignItems:'center', gap:8 }}>
                <div style={{ position: 'relative', display: 'inline-block' }}>
                  <img src={Logo4} alt="Marked" className="nta-statusimg" />
                  <span style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: '12px', fontWeight: 'bold', color: '#fff' }}>{counts.marked}</span>
                </div>
                <span>Marked for Review</span>
              </li>
              <li style={{ gridColumn: '1 / span 2', display:'flex', alignItems:'center', gap:8 }}>
                <div style={{ position: 'relative', display: 'inline-block' }}>
                  <img src={Logo5} alt="Answered & marked" className="nta-statusimg" />
                  <span style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: '12px', fontWeight: 'bold', color: '#fff' }}>{counts.ansmarked}</span>
                </div>
                <span>Answered & Marked for Review (will be considered for evaluation)</span>
              </li>
            </ul>
          </div>

          <div className="nta-palette">
            {groupedQuestions.sections.map((section, sectionIndex) => (
              <div key={section.type} className="section-group" style={{ marginBottom: '16px' }}>
                <div className="section-header" style={{ 
                  fontSize: '14px', 
                  fontWeight: 'bold', 
                  color: '#333', 
                  marginBottom: '8px', 
                  padding: '8px 12px', 
                  backgroundColor: '#f5f5f5', 
                  borderRadius: '4px',
                  borderLeft: '4px solid #1976d2'
                }}>
                  {section.name}
                </div>
                <div className="grid-nums">
                  {section.questions.map((qq, localIndex) => {
                    const globalIndex = section.startIndex + localIndex;
                    const s = answers[qq.id]?.status ?? 'unvisited';
                    const active = globalIndex === idx ? 'active' : '';
                    const questionNumber = (globalIndex + 1).toString().padStart(2, '0');
                    
                    // Use Logo images for all statuses except unvisited
                    if (s === 'notanswered') {
                      return (
                        <div key={qq.id} className={`num-container ${active}`} onClick={() => setIdx(globalIndex)} style={{ position: 'relative', display: 'inline-block', width: '40px', height: '40px' }}>
                          <img src={Logo2} alt="Not answered" style={{ position: 'absolute', top: '0', left: '0', width: '40px', height: '40px' }} />
                          <span style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: '12px', fontWeight: 'bold', color: '#fff', zIndex: 10 }}>
                            {questionNumber}
                          </span>
                        </div>
                      );
                    }
                    
                    if (s === 'answered') {
                      return (
                        <div key={qq.id} className={`num-container ${active}`} onClick={() => setIdx(globalIndex)} style={{ position: 'relative', display: 'inline-block', width: '40px', height: '40px' }}>
                          <img src={Logo3} alt="Answered" style={{ position: 'absolute', top: '0', left: '0', width: '40px', height: '40px' }} />
                          <span style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: '12px', fontWeight: 'bold', color: '#fff', zIndex: 10 }}>
                            {questionNumber}
                          </span>
                        </div>
                      );
                    }
                    
                    if (s === 'marked') {
                      return (
                        <div key={qq.id} className={`num-container ${active}`} onClick={() => setIdx(globalIndex)} style={{ position: 'relative', display: 'inline-block', width: '40px', height: '40px' }}>
                          <img src={Logo4} alt="Marked for review" style={{ position: 'absolute', top: '0', left: '0', width: '40px', height: '40px' }} />
                          <span style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: '12px', fontWeight: 'bold', color: '#fff', zIndex: 10 }}>
                            {questionNumber}
                          </span>
                        </div>
                      );
                    }
                    
                    if (s === 'ansmarked') {
                      return (
                        <div key={qq.id} className={`num-container ${active}`} onClick={() => setIdx(globalIndex)} style={{ position: 'relative', display: 'inline-block', width: '40px', height: '40px' }}>
                          <img src={Logo5} alt="Answered and marked for review" style={{ position: 'absolute', top: '0', left: '0', width: '40px', height: '40px' }} />
                          <span style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: '12px', fontWeight: 'bold', color: '#fff', zIndex: 10 }}>
                            {questionNumber}
                          </span>
                        </div>
                      );
                    }
                    
                    // Default case for unvisited - use Logo1.png
                    return (
                      <div key={qq.id} className={`num-container ${active}`} onClick={() => setIdx(globalIndex)} style={{ position: 'relative', display: 'inline-block', width: '40px', height: '40px' }}>
                        <img src={Logo1} alt="Not visited" style={{ position: 'absolute', top: '0', left: '0', width: '40px', height: '40px' }} />
                        <span style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: '12px', fontWeight: 'bold', color: '#000', zIndex: 10 }}>
                          {questionNumber}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
            </div>
        </aside>
        </div>

      <div className="nta-footer">© All Rights Reserved - National Testing Agency</div>
      </div>
    </TestGuard>
  );
}
