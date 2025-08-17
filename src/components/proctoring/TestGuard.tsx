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
  const [finalArmed, setFinalArmed] = React.useState(false);

  const intervalRef = React.useRef<number | undefined>();
  const timeoutRef = React.useRef<number | undefined>();

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
    } catch {
      // ignore; user can try again
    }
  };

  const autoNow = (why: string, countStrike: boolean = false) => {
    console.log('Auto-submitting test:', why, 'countStrike:', countStrike);
    clearTimers();
    setViolation(null);
    if (countStrike) {
      setStrikes((s) => {
        const next = s + 1;
        if (next >= maxGraceIncidents) setFinalArmed(true);
        return next;
      });
    }
    onAutoSubmit(true); // pass true to indicate this is a violation auto-submit
  };

  const startViolation = (reason: string) => {
    console.log('Starting violation:', reason, 'finalArmed:', finalArmed, 'violation?.active:', violation?.active);
    
    // Check if final warning is armed - immediate submit
    if (finalArmed) {
      console.log('Final warning armed - immediate submit');
      autoNow(reason, false);
      return;
    }
    
    // Check if already handling a violation
    if (violation?.active) {
      console.log('Already handling violation, ignoring');
      return;
    }
    
    console.log('Setting up new violation with', graceSeconds, 'seconds grace period');
    
    // Clear any existing timers first
    clearTimers();
    
    // Set violation state
    setViolation({ active: true, reason, remaining: graceSeconds });

    // Start countdown timer - this is the main timer
    console.log('Starting interval timer');
    intervalRef.current = window.setInterval(() => {
      console.log('Interval tick');
      setViolation((prevViolation) => {
        if (!prevViolation || !prevViolation.active) {
          console.log('No active violation, stopping timer');
          return prevViolation;
        }
        
        const newRemaining = prevViolation.remaining - 1;
        console.log('Timer countdown:', prevViolation.remaining, '→', newRemaining);
        
        if (newRemaining <= 0) {
          console.log('Timer reached 0, triggering auto-submit');
          // Don't clear timers here as it might cause race conditions
          setTimeout(() => {
            autoNow(reason + " (timed out)", false);
          }, 50);
          return { ...prevViolation, remaining: 0 };
        }
        
        return { ...prevViolation, remaining: newRemaining };
      });
    }, 1000);

    // Backup timeout - should trigger slightly after the main timer
    console.log('Setting backup timeout for', (graceSeconds + 1), 'seconds');
    timeoutRef.current = window.setTimeout(() => {
      console.log('Backup timeout triggered - this should not happen if main timer works');
      autoNow(reason + " (backup timeout)", false);
    }, (graceSeconds + 1) * 1000);
  };

  const endViolation = () => {
    if (!violation?.active) return;
    clearTimers();
    setViolation(null);
    setStrikes((s) => {
      const next = s + 1; // count incident only when they return in time
      if (next >= maxGraceIncidents) setFinalArmed(true);
      return next;
    });
  };

  React.useEffect(() => {
    if (typeof document === "undefined") return;

    const onFsChange = () => {
      console.log('Fullscreen change detected, isFullscreen:', isFullscreen());
      if (!isFullscreen()) startViolation("Exited full screen");
      else endViolation();
    };

    const onVisibility = () => {
      console.log('Visibility change detected, state:', document.visibilityState);
      if (document.visibilityState === "hidden")
        startViolation("Switched tab / minimized");
      else endViolation();
    };

    const onBlur = () => {
      console.log('Window blur detected');
      startViolation("Window lost focus");
    };
    const onFocus = () => {
      console.log('Window focus detected');
      endViolation();
    };

    document.addEventListener("fullscreenchange", onFsChange);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", onBlur);
    window.addEventListener("focus", onFocus);

    return () => {
      document.removeEventListener("fullscreenchange", onFsChange);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("focus", onFocus);
      clearTimers();
    };
  }, []); // Remove problematic dependencies

  const needsStart =
    typeof document !== "undefined" && !isFullscreen() && !violation?.active;

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
                  onClick={enterFullscreen}
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
              
              {finalArmed && (
                <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm font-semibold text-yellow-800">
                    🚨 Final Warning: The next violation will submit your test immediately!
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {finalArmed && !violation?.active && isFullscreen() && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 bg-yellow-400 text-black text-sm px-4 py-3 rounded-lg shadow-lg border border-yellow-500">
          <div className="flex items-center space-x-2">
            <span className="text-lg">🚨</span>
            <span className="font-semibold">Final Warning: Next exit will submit immediately!</span>
          </div>
        </div>
      )}
    </div>
  );
}
