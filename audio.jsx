import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Settings, Info } from 'lucide-react';

const App = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Mock audio functionality since we can't use actual audio elements
  useEffect(() => {
    let interval;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime(prev => {
          if (prev >= duration) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, duration]);

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const reset = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const toggleInfo = () => {
    setShowInfo(!showInfo);
  };

  // Format time for display (MM:SS)
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Mock duration (3 minutes)
  useEffect(() => {
    setDuration(180);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            STECH
          </h1>
          <p className="text-gray-300 text-lg">Spatial Audio Experience</p>
        </div>

        {/* Main Player Card */}
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 shadow-2xl border border-white/20">
          {/* Visualizer Placeholder */}
          <div className="w-full h-64 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-2xl mb-8 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-500/30 rounded-full mx-auto mb-4 flex items-center justify-center">
                <div className="w-8 h-8 bg-purple-400 rounded-full animate-pulse"></div>
              </div>
              <p className="text-white/70 text-sm">Audio Visualizer</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-300 mb-2">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
              ></div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap items-center justify-center gap-4 mb-6">
            <button
              onClick={togglePlay}
              className="w-16 h-16 bg-purple-600 hover:bg-purple-700 rounded-full flex items-center justify-center transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              {isPlaying ? (
                <Pause className="w-8 h-8 text-white" />
              ) : (
                <Play className="w-8 h-8 text-white ml-1" />
              )}
            </button>
            
            <button
              onClick={reset}
              className="w-12 h-12 bg-gray-600 hover:bg-gray-700 rounded-full flex items-center justify-center transition-all duration-200 transform hover:scale-105"
            >
              <RotateCcw className="w-5 h-5 text-white" />
            </button>
            
            <button
              onClick={toggleMute}
              className="w-12 h-12 bg-gray-600 hover:bg-gray-700 rounded-full flex items-center justify-center transition-all duration-200 transform hover:scale-105"
            >
              {isMuted ? (
                <VolumeX className="w-5 h-5 text-white" />
              ) : (
                <Volume2 className="w-5 h-5 text-white" />
              )}
            </button>
            
            <button
              onClick={toggleInfo}
              className="w-12 h-12 bg-gray-600 hover:bg-gray-700 rounded-full flex items-center justify-center transition-all duration-200 transform hover:scale-105"
            >
              <Info className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Volume Control */}
          <div className="flex items-center gap-4">
            <Volume2 className="w-5 h-5 text-gray-300" />
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
            />
          </div>
        </div>

        {/* Info Modal */}
        {showInfo && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 max-w-md w-full border border-white/20">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-white">About STECH</h3>
                <button
                  onClick={toggleInfo}
                  className="w-8 h-8 bg-gray-600 hover:bg-gray-700 rounded-full flex items-center justify-center"
                >
                  <span className="text-white text-lg">×</span>
                </button>
              </div>
              <p className="text-gray-300 leading-relaxed">
                STECH is an innovative spatial audio platform designed to deliver immersive sound experiences. 
                Our technology creates a 3D audio environment that transports you to another dimension.
              </p>
              <div className="mt-4 pt-4 border-t border-white/20">
                <p className="text-sm text-gray-400">
                  Use the controls to play/pause, reset, adjust volume, and explore settings.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-gray-400 text-sm">
            © 2024 STECH Audio Platform
          </p>
        </div>
      </div>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: linear-gradient(45deg, #8b5cf6, #ec4899);
          cursor: pointer;
          box-shadow: 0 4px 8px rgba(0,0,0,0.3);
        }
        
        .slider::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: linear-gradient(45deg, #8b5cf6, #ec4899);
          cursor: pointer;
          border: none;
          box-shadow: 0 4px 8px rgba(0,0,0,0.3);
        }
      `}</style>
    </div>
  );
};

export default App;