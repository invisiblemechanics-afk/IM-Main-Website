import React from "react";

type Props = {
  children: React.ReactNode;
  onAutoSubmit: (isViolation?: boolean) => void;             // call your existing submit function
  graceSeconds?: number;                // default 10
  maxGraceIncidents?: number;           // default 3 (next one auto-submits)
};

export default function TestGuard({
  children,
  onAutoSubmit,
  graceSeconds = 10,
  maxGraceIncidents = 3,
}: Props) {
  const [violation, setViolation] = React.useState<{
    active: boolean;
    reason: string;
    remaining: number;
  } | null>(null);

  const [strikes, setStrikes] = React.useState(0);

  const intervalRef = React.useRef<number | undefined>();
  const timeoutRef = React.useRef<number | undefined>();
  const violationProcessedRef = React.useRef<boolean>(false);
  const violationCountRef = React.useRef<number>(0); // Track actual violation count

  const isFullscreen = () =>
    typeof document !== "undefined" &&
    !!(
      document.fullscreenElement ||
      // @ts-ignore - vendor prefixes
      document.webkitFullscreenElement ||
      // @ts-ignore
      document.msFullscreenElement
    );

  const clearTimers = () => {
    if (intervalRef.current) window.clearInterval(intervalRef.current);
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    intervalRef.current = undefined;
    timeoutRef.current = undefined;
  };

  const enterFullscreen = async () => {
    if (typeof document === "undefined") return;
    // Use documentElement to cover the whole page
    const el: any = document.documentElement;
    try {
      if (el.requestFullscreen) await el.requestFullscreen();
      else if (el.webkitRequestFullscreen) await el.webkitRequestFullscreen();
      else if (el.msRequestFullscreen) await el.msRequestFullscreen();
      
      // Manually end violation after attempting to enter fullscreen
      // This ensures the modal disappears even if the fullscreen event is delayed
      setTimeout(() => {
        if (isFullscreen() && violation?.active) {
          console.log('🔄 Manually ending violation after entering fullscreen');
          endViolation();
        }
      }, 200);
    } catch {
      // ignore; user can try again
    }
  };

  const autoNow = (why: string, countStrike: boolean = false) => {
    console.log('🚀 AUTO-SUBMITTING TEST:', why, 'countStrike:', countStrike);
    console.log('🚀 Current strikes at auto-submit:', strikes);
    clearTimers();
    setViolation(null);
    if (countStrike) {
      setStrikes((s) => {
        const next = s + 1;
        return next;
      });
    }
    
    // Use setTimeout to ensure state updates are processed
    setTimeout(() => {
      console.log('🚀 Calling onAutoSubmit...');
      onAutoSubmit(true); // pass true to indicate this is a violation auto-submit
    }, 100);
  };

  const startViolation = (reason: string) => {
    // Increment violation count immediately
    violationCountRef.current += 1;
    const currentViolations = violationCountRef.current;
    
    console.log('🚨 Starting violation #' + currentViolations + ':', reason);
    console.log('🔍 Current strikes:', strikes, 'Current violations:', currentViolations, 'Max allowed:', maxGraceIncidents);
    
    // If this is the 4th+ violation, auto-submit immediately
    if (currentViolations > maxGraceIncidents) {
      console.log('⚡ VIOLATION #' + currentViolations + ' EXCEEDS LIMIT (' + maxGraceIncidents + ') - IMMEDIATE AUTO-SUBMIT');
      autoNow(reason + ' (violation #' + currentViolations + ')', false);
      return;
    }
    
    // Check if already handling a violation
    if (violation?.active) {
      console.log('⏸️ Already handling violation, ignoring new violation');
      return;
    }
    
    console.log('⏱️ Setting up new violation with', graceSeconds, 'seconds grace period');
    
    // Clear any existing timers first
    clearTimers();
    
    // Reset the processed flag for new violation
    violationProcessedRef.current = false;
    
    // Set violation state
    setViolation({ active: true, reason, remaining: graceSeconds });

    // Start countdown timer - this is the main timer
    console.log('🔄 Starting interval timer for countdown');
    intervalRef.current = window.setInterval(() => {
      console.log('⏰ Interval tick - checking violation state');
      setViolation((prevViolation) => {
        if (!prevViolation || !prevViolation.active) {
          console.log('❌ No active violation, stopping timer');
          if (intervalRef.current) {
            window.clearInterval(intervalRef.current);
            intervalRef.current = undefined;
          }
          return prevViolation;
        }
        
        const newRemaining = prevViolation.remaining - 1;
        console.log('⏳ Timer countdown:', prevViolation.remaining, '→', newRemaining);
        
        if (newRemaining <= 0) {
          console.log('💥 Timer reached 0, triggering auto-submit');
          // Clear the interval immediately to prevent multiple triggers
          if (intervalRef.current) {
            window.clearInterval(intervalRef.current);
            intervalRef.current = undefined;
          }
          // Clear timeout as well
          if (timeoutRef.current) {
            window.clearTimeout(timeoutRef.current);
            timeoutRef.current = undefined;
          }
          // Trigger auto-submit with a small delay to ensure state is updated
          setTimeout(() => {
            // Check if violation was already processed
            if (violationProcessedRef.current) {
              console.log('⚠️ Violation already processed, just auto-submitting');
              autoNow(reason + " (timed out)", false);
              return;
            }
            
            console.log('⚠️ Violation timeout - checking strikes before incrementing');
            violationProcessedRef.current = true; // Mark as processed
            
            // Count strike for timing out, then auto-submit
            setStrikes((s) => {
              const next = Math.min(s + 1, maxGraceIncidents); // Cap at max
              console.log('📊 Strike added for timeout:', s, '→', next, '/', maxGraceIncidents);
              return next;
            });
            autoNow(reason + " (timed out)", false);
          }, 50);
          return { ...prevViolation, remaining: 0, active: false };
        }
        
        return { ...prevViolation, remaining: newRemaining };
      });
    }, 1000);

    // Backup timeout - should trigger slightly after the main timer
    console.log('🔒 Setting backup timeout for', (graceSeconds + 1), 'seconds');
    timeoutRef.current = window.setTimeout(() => {
      // Check if violation was already processed
      if (violationProcessedRef.current) {
        console.log('🚨 Backup timeout - violation already processed, just auto-submitting');
        autoNow(reason + " (backup timeout)", false);
        return;
      }
      
      console.log('🚨 Backup timeout triggered - checking strikes before incrementing');
      violationProcessedRef.current = true; // Mark as processed
      
      // Count strike for backup timeout, then auto-submit
      setStrikes((s) => {
        const next = Math.min(s + 1, maxGraceIncidents); // Cap at max
        console.log('📊 Strike added for backup timeout:', s, '→', next, '/', maxGraceIncidents);
        return next;
      });
      autoNow(reason + " (backup timeout)", false);
    }, (graceSeconds + 1) * 1000);
  };

  const endViolation = () => {
    if (!violation?.active) {
      console.log('🔕 No active violation to end');
      return;
    }
    
    // Check if this violation was already processed
    if (violationProcessedRef.current) {
      console.log('🔕 Violation already processed, just clearing timers and state');
      clearTimers();
      setViolation(null);
      return;
    }
    
    console.log('✅ Ending violation - user returned in time');
    
    // Mark as processed to prevent double counting
    violationProcessedRef.current = true;
    
    clearTimers();
    setViolation(null);
    
    // Add strike for this violation (capped at max)
    setStrikes((s) => {
      const next = Math.min(s + 1, maxGraceIncidents); // Cap at max
      console.log('📊 Strike added:', s, '→', next, '/', maxGraceIncidents);
      console.log('📊 Violation count ref:', violationCountRef.current);
      return next;
    });
  };

  React.useEffect(() => {
    if (typeof document === "undefined") return;

    const onFsChange = () => {
      const fullscreenState = isFullscreen();
      console.log('Fullscreen change detected, isFullscreen:', fullscreenState);
      
      // Add a small delay to ensure the fullscreen state has settled
      setTimeout(() => {
        if (!isFullscreen()) {
          console.log('User exited fullscreen - starting violation');
          startViolation("Exited full screen");
        } else {
          console.log('User returned to fullscreen - ending violation');
          endViolation();
        }
      }, 100);
    };

    const onVisibility = () => {
      const visibilityState = document.visibilityState;
      console.log('Visibility change detected, state:', visibilityState);
      
      setTimeout(() => {
        if (document.visibilityState === "hidden") {
          console.log('Tab/window hidden - starting violation');
          startViolation("Switched tab / minimized");
        } else {
          console.log('Tab/window visible - ending violation');
          endViolation();
        }
      }, 100);
    };

    const onBlur = () => {
      console.log('Window blur detected');
      setTimeout(() => {
        console.log('Window lost focus - starting violation');
        startViolation("Window lost focus");
      }, 100);
    };
    
    const onFocus = () => {
      console.log('Window focus detected');
      setTimeout(() => {
        console.log('Window regained focus - ending violation');
        endViolation();
      }, 100);
    };

    // Add event listeners
    document.addEventListener("fullscreenchange", onFsChange);
    document.addEventListener("webkitfullscreenchange", onFsChange); // Safari
    document.addEventListener("mozfullscreenchange", onFsChange); // Firefox
    document.addEventListener("MSFullscreenChange", onFsChange); // IE/Edge
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", onBlur);
    window.addEventListener("focus", onFocus);

    console.log('TestGuard event listeners attached');

    return () => {
      console.log('TestGuard cleanup - removing event listeners');
      document.removeEventListener("fullscreenchange", onFsChange);
      document.removeEventListener("webkitfullscreenchange", onFsChange);
      document.removeEventListener("mozfullscreenchange", onFsChange);
      document.removeEventListener("MSFullscreenChange", onFsChange);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("focus", onFocus);
      clearTimers();
    };
  }, []); // Empty dependency array to run only once

  const needsStart =
    typeof document !== "undefined" && !isFullscreen() && !violation?.active;

  // Debug logging for state tracking
  React.useEffect(() => {
    console.log('🔍 TestGuard state:', { 
      strikes, 
      maxGraceIncidents, 
      violationActive: violation?.active,
      needsStart 
    });
  }, [strikes, violation?.active, needsStart]);

  return (
    <div className="relative">
      {children}

      {(violation?.active || needsStart) && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white rounded-2xl p-8 max-w-lg text-center shadow-2xl border border-gray-200">
            {needsStart && !violation?.active ? (
              <>
                <div className="mb-4">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                    </svg>
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">Start in Full Screen</h2>
                <p className="text-gray-700 mb-6 leading-relaxed">
                  For a fair attempt, the test runs in full screen mode. Click below to continue.
                </p>
                <button
                  onClick={enterFullscreen}
                  className="px-6 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors"
                >
                  Enter Full Screen
                </button>
              </>
            ) : (
              <>
                <div className="mb-4">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-red-600 mb-3">⚠️ Return to Full Screen</h2>
                <p className="text-gray-700 mb-4 leading-relaxed">
                  <strong>{violation?.reason}</strong>
                </p>
                
                {/* Prominent countdown display */}
                <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 mb-6">
                  <div className="text-4xl font-bold text-red-600 mb-2">
                    {violation?.remaining}
                  </div>
                  <p className="text-red-700 font-semibold">
                    seconds remaining before auto-submit
                  </p>
                </div>

                <button
                  onClick={() => {
                    console.log('🔴 Back to Full Screen button clicked');
                    enterFullscreen();
                    // Immediately end violation when button is clicked
                    // This provides instant feedback to the user
                    if (violation?.active) {
                      console.log('🔄 Immediately ending violation on button click');
                      endViolation();
                    }
                  }}
                  className="px-6 py-3 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors mb-4"
                >
                  Back to Full Screen
                </button>
              </>
            )}
            
            {/* Strikes display */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-center space-x-4 text-sm">
                <div className="flex items-center space-x-2">
                  <span className="text-gray-600">Violations:</span>
                  <div className="flex space-x-1">
                    {Array.from({ length: maxGraceIncidents }, (_, i) => (
                      <div
                        key={i}
                        className={`w-3 h-3 rounded-full ${
                          i < strikes ? 'bg-red-500' : 'bg-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="font-semibold text-gray-900">
                    {strikes} / {maxGraceIncidents}
                  </span>
                </div>
              </div>
              
              {strikes >= maxGraceIncidents && (
                <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm font-semibold text-yellow-800">
                    🚨 Final Warning: You have used all 3 chances. The next violation will submit your test immediately!
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {strikes >= maxGraceIncidents && !violation?.active && isFullscreen() && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 bg-yellow-400 text-black text-sm px-4 py-3 rounded-lg shadow-lg border border-yellow-500">
          <div className="flex items-center space-x-2">
            <span className="text-lg">🚨</span>
            <span className="font-semibold">Final Warning: 3/3 strikes used - Next exit will submit immediately!</span>
          </div>
        </div>
      )}
    </div>
  );
}
