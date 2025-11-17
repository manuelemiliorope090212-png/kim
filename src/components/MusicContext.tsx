'use client';

import React, { createContext, useContext, useState, useRef, useEffect, ReactNode } from 'react';

interface MusicFile {
  _id: string;
  name: string;
  url: string;
  order: number;
}

interface MusicContextType {
  musicFiles: MusicFile[];
  currentSongIndex: number;
  currentTime: number;
  isPlaying: boolean;
  autoplayFailed: boolean;
  setMusicFiles: (files: MusicFile[]) => void;
  setCurrentSongIndex: (index: number) => void;
  setCurrentTime: (time: number) => void;
  setIsPlaying: (playing: boolean) => void;
  setAutoplayFailed: (failed: boolean) => void;
  playSong: (index: number) => Promise<void>;
  seekTo: (time: number) => void;
  audioRef: React.RefObject<HTMLAudioElement>;
}

const MusicContext = createContext<MusicContextType | undefined>(undefined);

export const useMusic = () => {
  const context = useContext(MusicContext);
  if (!context) {
    throw new Error('useMusic must be used within a MusicProvider');
  }
  return context;
};

interface MusicProviderProps {
  children: ReactNode;
}

export const MusicProvider: React.FC<MusicProviderProps> = ({ children }) => {
  const [musicFiles, setMusicFiles] = useState<MusicFile[]>([]);
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [autoplayFailed, setAutoplayFailed] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const playSong = async (index: number) => {
    if (!audioRef.current || musicFiles.length === 0) return;

    const music = musicFiles[index];
    if (!music) return;

    try {
      // Set the source and load
      audioRef.current.src = music.url;
      audioRef.current.load(); // Force reload for mobile compatibility

      // Wait a bit for loading on mobile
      await new Promise(resolve => setTimeout(resolve, 100));

      // Try to play
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        await playPromise;
        setIsPlaying(true);
        setCurrentSongIndex(index);
      }
    } catch (err) {
      console.error('Error playing:', err);
      // On mobile, this might fail due to autoplay restrictions
      // The audio will be prepared but won't play until user interaction
      setCurrentSongIndex(index);
      setAutoplayFailed(true);
      // Don't set isPlaying to true if autoplay failed
      throw err; // Re-throw so caller can handle it
    }
  };

  const seekTo = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  // Removed automatic 30-second sync as requested
  // Only sync when manually triggered

  const value: MusicContextType = {
    musicFiles,
    currentSongIndex,
    currentTime,
    isPlaying,
    autoplayFailed,
    setMusicFiles,
    setCurrentSongIndex,
    setCurrentTime,
    setIsPlaying,
    setAutoplayFailed,
    playSong,
    seekTo,
    audioRef,
  };

  return (
    <MusicContext.Provider value={value}>
      {children}
    </MusicContext.Provider>
  );
};