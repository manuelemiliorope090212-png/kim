'use client';

import { useMusic } from './MusicContext';
import { useEffect } from 'react';

export default function GlobalMusicPlayer() {
  const {
    musicFiles,
    currentSongIndex,
    currentTime,
    isPlaying,
    setCurrentTime,
    setIsPlaying,
    audioRef
  } = useMusic();

  // Removed automatic 30-second sync as requested
  // Only sync when manually triggered or when song changes

  return (
    <>
      {musicFiles.length > 0 && (
        <audio
          ref={audioRef}
          className="hidden md:block" // Hidden on desktop, visible on mobile for interaction
          src={musicFiles[currentSongIndex]?.url}
          preload="auto"
          controls={typeof window !== 'undefined' && window.innerWidth < 768} // Show controls on mobile
          onLoadedData={(e) => {
            const audio = e.target as HTMLAudioElement;
            if (isPlaying) {
              if (currentTime < audio.duration) {
                audio.currentTime = currentTime;
              } else {
                audio.currentTime = 0;
              }
            }
          }}
          onCanPlayThrough={() => {
            console.log('Audio can play through');
            if (audioRef.current && isPlaying) {
              const audio = audioRef.current;
              if (currentTime < audio.duration) {
                audio.currentTime = currentTime;
              } else {
                audio.currentTime = 0;
              }
              // Only try to play if we have user interaction context
              // On mobile, this might fail due to autoplay restrictions
              const playPromise = audio.play();
              if (playPromise !== undefined) {
                playPromise.then(() => {
                  console.log('Audio started playing');
                }).catch(err => {
                  console.error('Autoplay prevented:', err);
                  // On mobile, mark as not playing since autoplay failed
                  setIsPlaying(false);
                });
              }
            }
          }}
          onEnded={() => {
            const nextIndex = (currentSongIndex + 1) % musicFiles.length;
            if (audioRef.current) {
              audioRef.current.src = musicFiles[nextIndex].url;
              audioRef.current.currentTime = 0;
              audioRef.current.play().then(() => {
                setIsPlaying(true);
              }).catch(err => console.error('Error playing next:', err));
            }
          }}
          onTimeUpdate={(e) => {
            const audio = e.target as HTMLAudioElement;
            setCurrentTime(audio.currentTime);
          }}
          onError={(e) => {
            console.error('Error loading audio:', e);
            const nextIndex = (currentSongIndex + 1) % musicFiles.length;
            if (audioRef.current) {
              audioRef.current.src = musicFiles[nextIndex].url;
            }
          }}
        />
      )}
    </>
  );
}