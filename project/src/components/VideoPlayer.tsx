import React, { useState, useEffect, useRef } from 'react';
import { getDownloadURL, ref } from 'firebase/storage';
import { storage } from '../lib/firebase';

interface VideoPlayerProps {
  storagePath: string;
  onError?: (error: any) => void;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ storagePath, onError }) => {
  const [videoURL, setVideoURL] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Video control states
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isHovering, setIsHovering] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    console.log(`🎬 VideoPlayer: Loading storage path: ${storagePath}`);
    setLoading(true);
    setError(null);
    
    getDownloadURL(ref(storage, storagePath))
      .then(url => {
        console.log(`✅ VideoPlayer: Got download URL: ${url.substring(0, 100)}...`);
        setVideoURL(url);
        setLoading(false);
      })
      .catch(err => {
        console.error('❌ VideoPlayer: Error loading video:', err);
        setError(err.message);
        setLoading(false);
        if (onError) onError(err);
      });
  }, [storagePath]);

  // Auto-hide controls
  useEffect(() => {
    if (isHovering || !isPlaying) {
      setShowControls(true);
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    } else {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }

    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [isHovering, isPlaying]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Only handle key events when video player is focused or no input is focused
      const activeElement = document.activeElement;
      const isInputFocused = activeElement?.tagName === 'INPUT' || 
                            activeElement?.tagName === 'TEXTAREA' ||
                            activeElement?.contentEditable === 'true';
      
      if (isInputFocused) return;

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          togglePlayPause();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          skipTime(-10);
          break;
        case 'ArrowRight':
          e.preventDefault();
          skipTime(10);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [isPlaying]);

  const skipTime = (seconds: number) => {
    if (videoRef.current) {
      const newTime = Math.max(0, Math.min(duration, currentTime + seconds));
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  // Video event handlers
  const handlePlay = () => {
    setIsPlaying(true);
    console.log(`▶️ Video playback started`);
  };

  const handlePause = () => {
    setIsPlaying(false);
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      console.log(`📊 Video metadata loaded`);
    }
  };

  // Control handlers
  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
    if (newVolume === 0) {
      setIsMuted(true);
    } else if (isMuted) {
      setIsMuted(false);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      if (isMuted) {
        videoRef.current.volume = volume;
        setIsMuted(false);
      } else {
        videoRef.current.volume = 0;
        setIsMuted(true);
      }
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Format time
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="text-center text-slate-400 p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-400 mx-auto mb-2"></div>
        <p>Loading video…</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="text-center text-red-400 p-8">
        <div className="text-2xl mb-2">⚠️</div>
        <p>Failed to load video</p>
        <p className="text-sm text-gray-500 mt-2">{error}</p>
      </div>
    );
  }
  
  if (!videoURL) {
    return (
      <div className="text-center text-slate-400 p-8">
        <div className="text-2xl mb-2">📹</div>
        <p>No video URL available</p>
      </div>
    );
  }
  
  return (
    <div 
      ref={containerRef}
      className="relative bg-gray-900 rounded-lg shadow-xl overflow-hidden group"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >


      {/* Video Element */}
      <video
        ref={videoRef}
        src={videoURL}
        className="w-full h-auto bg-black"
        onPlay={handlePlay}
        onPause={handlePause}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onError={(e) => console.error('❌ Video playback error:', e)}
        onClick={togglePlayPause}
      />

      {/* Custom Control Bar */}
      <div 
        className={`absolute bottom-0 left-0 right-0 bg-black/30 backdrop-blur-sm px-4 py-2 transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="flex items-center justify-between space-x-2 md:space-x-4">
          {/* Left Side - Play/Pause & Time */}
          <div className="flex items-center space-x-2 md:space-x-4">
            {/* Play/Pause Button */}
            <button
              onClick={togglePlayPause}
              className="w-5 h-5 md:w-6 md:h-6 text-white hover:bg-purple-600/20 rounded-full p-1 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-400"
              aria-label={isPlaying ? 'Pause video' : 'Play video'}
            >
              {isPlaying ? (
                <svg fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                </svg>
              ) : (
                <svg fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              )}
            </button>

            {/* Time Display */}
            <div className="hidden sm:block text-sm text-gray-200 font-mono">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
          </div>

          {/* Center - Seek Slider */}
          <div className="flex-1 mx-2 md:mx-4">
            <input
              type="range"
              min="0"
              max={duration || 0}
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
              style={{
                background: `linear-gradient(to right, #7C3AED 0%, #7C3AED ${(currentTime / duration) * 100}%, #6B7280 ${(currentTime / duration) * 100}%, #6B7280 100%)`
              }}
              aria-label="Seek video position"
            />
          </div>

          {/* Right Side - Volume & Fullscreen */}
          <div className="flex items-center space-x-1 md:space-x-2">
            {/* Volume Button */}
            <button
              onClick={toggleMute}
              className="w-5 h-5 md:w-6 md:h-6 text-white hover:bg-purple-600/20 rounded-full p-1 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-400"
              aria-label={isMuted ? 'Unmute video' : 'Mute video'}
            >
              {isMuted || volume === 0 ? (
                <svg fill="currentColor" viewBox="0 0 24 24">
                  <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
                </svg>
              ) : (
                <svg fill="currentColor" viewBox="0 0 24 24">
                  <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                </svg>
              )}
            </button>

            {/* Volume Slider */}
            <div className="hidden md:flex items-center w-16">
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                style={{
                  background: `linear-gradient(to right, #7C3AED 0%, #7C3AED ${(isMuted ? 0 : volume) * 100}%, #6B7280 ${(isMuted ? 0 : volume) * 100}%, #6B7280 100%)`
                }}
                aria-label="Adjust volume"
              />
            </div>

            {/* Fullscreen Button */}
            <button
              onClick={toggleFullscreen}
              className="w-5 h-5 md:w-6 md:h-6 text-white hover:bg-purple-600/20 rounded-full p-1 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-400"
              aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            >
              {isFullscreen ? (
                <svg fill="currentColor" viewBox="0 0 24 24">
                  <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/>
                </svg>
              ) : (
                <svg fill="currentColor" viewBox="0 0 24 24">
                  <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #7C3AED;
          cursor: pointer;
        }
        .slider::-moz-range-thumb {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #7C3AED;
          cursor: pointer;
          border: none;
        }
      `}</style>
    </div>
  );
};

export default VideoPlayer;