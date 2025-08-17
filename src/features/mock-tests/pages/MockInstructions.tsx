import React, { useMemo, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { firestore } from '../../../lib/firebase';
import { enterFullscreenNow } from '../../../utils/fullscreen';
import { useTestAttempt } from '../hooks/useAttempts';
import './nta-instructions.css';

import ntaLogo from '../../../assets/images/NTA_logo.png';
import moeLogo from '../../../assets/images/moe1.png';
import azadiLogo from '../../../assets/images/akam.png';
import Logo1 from '../../../assets/images/Logo1.png';
import Logo2 from '../../../assets/images/Logo2.png';
import Logo3 from '../../../assets/images/Logo3.png';
import Logo4 from '../../../assets/images/Logo4.png';
import Logo5 from '../../../assets/images/Logo5.png';
import downIcon from '../../../../../src/assets/images/down.png';
import upIcon from '../../../../../src/assets/images/up.png';

const NEXT_ROUTE_AFTER_INSTRUCTIONS = (testId: string) => `/mock-tests/attempt/${testId}`;

function StatusIcon({
  kind,
}: {
  kind:
    | 'not-visited'
    | 'not-answered'
    | 'answered'
    | 'marked'
    | 'answered-marked';
}) {
  switch (kind) {
    case 'not-visited':
      return (
        <span className="nta-status nta-status--box" aria-label="Not visited" />
      );
    case 'not-answered':
      return (
        <span
          className="nta-status nta-status--flag"
          aria-label="Not answered"
        />
      );
    case 'answered':
      return (
        <span
          className="nta-status nta-status--box nta-status--answered"
          aria-label="Answered"
        />
      );
    case 'marked':
      return (
        <span
          className="nta-status nta-status--dot nta-status--marked"
          aria-label="Marked for review"
        />
      );
    case 'answered-marked':
      return (
        <span
          className="nta-status nta-status--dot nta-status--answered"
          aria-label="Answered & marked for review"
        />
      );
    default:
      return null;
  }
}

export default function Instructions() {
  const { testId = '' } = useParams();
  const nav = useNavigate();
  const [agree, setAgree] = useState(false);
  const [testData, setTestData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { hasAttempted, attempt, loading: attemptLoading } = useTestAttempt(testId);

  // Fetch test data from Firestore
  useEffect(() => {
    const fetchTestData = async () => {
      if (!testId) return;
      
      try {
        setLoading(true);
        const testDocRef = doc(firestore, 'Tests', testId);
        const testDocSnap = await getDoc(testDocRef);
        
        if (testDocSnap.exists()) {
          setTestData(testDocSnap.data());
        }
      } catch (error) {
        console.error('Error fetching test data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTestData();
  }, [testId]);

  const onProceed = async () => {
    if (!agree) return;
    await enterFullscreenNow(); // Enter fullscreen with user gesture
    nav(NEXT_ROUTE_AFTER_INSTRUCTIONS(testId));
  };

  // Calculate duration in minutes
  const durationMinutes = useMemo(() => {
    if (!testData) return 180;
    return testData.durationSec ? Math.round(testData.durationSec / 60) : (testData.duration || 180);
  }, [testData]);

  const testName = testData?.name || 'Mock Test';

  const languages = useMemo(
    () => [
      'English',
      'Hindi',
      'Gujarati',
      'Assamese',
      'Bengali',
      'Kannada',
      'Malayalam',
      'Marathi',
      'Odia',
      'Punjabi',
      'Tamil',
      'Telugu',
      'Urdu',
    ],
    []
  );

  // Redirect if user has already attempted this test
  useEffect(() => {
    if (!attemptLoading && hasAttempted && attempt) {
      nav(`/mock-tests/result/${attempt.id}`);
    }
  }, [hasAttempted, attempt, attemptLoading, nav]);

  // Show loading while checking attempt status or fetching test data
  if (loading || attemptLoading) {
    return (
      <div className="nta-root">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading test instructions...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="nta-root">
      {/* Top blue strip with "Home" placeholder (as in NTA) */}
      <div className="nta-topbar">
        <div className="nta-topbar__home">Home</div>
      </div>

      {/* Header with logos + language select */}
      <header className="nta-header">
        <div className="nta-header__left">
          <img src={ntaLogo} alt="National Testing Agency" className="nta-logo nta-logo--nta" />
          <img src={moeLogo} alt="Ministry of Education" className="nta-logo nta-logo--moe" />
          <img src={azadiLogo} alt="Azadi Ka Amrit Mahotsav" className="nta-logo nta-logo--azadi" />
        </div>

        <div className="nta-header__right">
          <label className="nta-langlabel" htmlFor="lang">
            Choose Your Default Language
          </label>
          <select id="lang" className="nta-select">
            {languages.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </div>
      </header>

      <main className="nta-main">
        <h1 className="nta-title">GENERAL INSTRUCTIONS</h1>
        <h2 className="nta-subtitle">Please read the instructions carefully</h2>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-sm text-gray-500">Loading test information...</div>
          </div>
        ) : (
          <>

        <section className="nta-section">
          <h3 className="nta-section__heading">General Instructions:</h3>

          <ol className="nta-ol">
            <li>
              Total duration of {testName} is <strong>{durationMinutes} min</strong>.
            </li>
            <li>
              The clock will be set at the server. The countdown timer in the
              top right corner of screen will display the remaining time
              available for you to complete the examination. When the timer
              reaches zero, the examination will end by itself. You will not be
              required to end or submit your examination.
            </li>
            <li>
              The Questions Palette displayed on the right side of screen will
              show the status of each question using one of the following
              symbols:
              <ol className="nta-ol nta-ol--numbered">
                <li className="nta-statusrow">
                  <img src={Logo1} alt="Not visited" className="nta-statusimg" />
                  You have not visited the question yet.
                </li>
                <li className="nta-statusrow">
                  <img src={Logo2} alt="Not answered" className="nta-statusimg" />
                  You have not answered the question.
                </li>
                <li className="nta-statusrow">
                  <img src={Logo3} alt="Answered" className="nta-statusimg" />
                  You have answered the question.
                </li>
                <li className="nta-statusrow">
                  <img src={Logo4} alt="Marked for review" className="nta-statusimg" />
                  You have NOT answered the question, but have marked the
                  question for review.
                </li>
                <li className="nta-statusrow">
                  <img src={Logo5} alt="Answered & marked for review" className="nta-statusimg" />
                  The question(s) “Answered and Marked for Review” will be
                  considered for evaluation.
                </li>
              </ol>
            </li>
            <li>
              You can click on the "&gt;" arrow which appears to the left of question palette to collapse the question palette thereby maximizing the question window. To view the question palette again, you can click on "&lt;" which appears on the right side of question window.
            </li>
            <li>
              You can click on your "Profile" image on top right corner of your screen to change the language during the exam for entire question paper. On clicking of Profile image you will get a drop-down to change the question content to the desired language.
            </li>
            <li>
              You can click on <img src={downIcon} alt="navigate down" className="nta-inline-icon" /> to navigate to the bottom and <img src={upIcon} alt="navigate up" className="nta-inline-icon" /> to navigate to top of the question are, without scrolling.
            </li>
          </ol>
        </section>

        <section className="nta-section">
          <h3 className="nta-section__heading">Navigating to a Question:</h3>
          <ol className="nta-ol" start="7">
            <li>
              To answer a question, do the following:
              <ol className="nta-ol nta-ol--alpha">
                <li>
                  Click on the question number in the Question Palette at the right of your screen to go to that numbered question directly. Note that using this option does NOT save your answer to the current question.
                </li>
                <li>
                  Click on <strong>Save &amp; Next</strong> to save your answer for the current question and then go to the next question.
                </li>
                <li>
                  Click on <strong>Mark for Review &amp; Next</strong> to save your answer for the current question, mark it for review, and then go to the next question.
                </li>
              </ol>
            </li>
          </ol>
        </section>

        <section className="nta-section">
          <h3 className="nta-section__heading">Answering a Question:</h3>
          <ol className="nta-ol" start="8">
            <li>
              Procedure for answering a multiple choice type question:
              <ol className="nta-ol nta-ol--alpha">
                <li>To select your answer, click on the button of one of the options.</li>
                <li>
                  To deselect your chosen answer, click on the button of the chosen option again or click on the <strong>Clear Response</strong> button
                </li>
                <li>To change your chosen answer, click on the button of another option</li>
                <li>
                  To save your answer, you MUST click on the <strong>Save &amp; Next</strong> button.
                </li>
                <li>
                  To mark the question for review, click on the <strong>Mark for Review &amp; Next</strong> button.
                </li>
              </ol>
            </li>
            <li>
              To change your answer to a question that has already been answered, first select that question for answering and then follow the procedure for answering that type of question.
            </li>
          </ol>
        </section>

        <section className="nta-section">
          <h3 className="nta-section__heading">Navigating through sections:</h3>
          <ol className="nta-ol" start="10">
            <li>
              Sections in this question paper are displayed on the top bar of the screen. Questions in a section can be viewed by clicking on the section name. The section you are currently viewing is highlighted.
            </li>
            <li>
              After you click the <strong>Save &amp; Next</strong> button on the last question for a section, you will automatically be taken to the first question of the next section.
            </li>
            <li>
              You can shuffle between sections and questions anytime during the examination as per your convenience only during the time stipulated.
            </li>
            <li>
              Candidate can view the corresponding section summary as part of the legend that appears in every section above the question palette.
            </li>
          </ol>

          <p className="nta-note">
            Please note all questions will appear in your default language. This language can be changed for a particular question later on.
          </p>
        </section>

        {/* Agreement + Proceed */}
        <div className="nta-agree">
          <label className="nta-agree__label">
            <input
              type="checkbox"
              checked={agree}
              onChange={(e) => setAgree(e.target.checked)}
              className="nta-checkbox"
            />
            <span>
              I have read and understood the instructions. I agree that in case
              of not adhering to the instructions, I shall be liable to be
              debarred from this Test and/or to disciplinary action.
            </span>
          </label>

          <button
            className={`nta-proceed ${agree ? 'is-enabled' : 'is-disabled'}`}
            onClick={onProceed}
            disabled={!agree}
          >
            PROCEED
          </button>
        </div>
        </>
        )}
      </main>

      <footer className="nta-footer">
        © All Rights Reserved - National Testing Agency
      </footer>
    </div>
  );
}


