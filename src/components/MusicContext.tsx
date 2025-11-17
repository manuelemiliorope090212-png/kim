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
  setMusicFiles: (files: MusicFile[]) => void;
  setCurrentSongIndex: (index: number) => void;
  setCurrentTime: (time: number) => void;
  setIsPlaying: (playing: boolean) => void;
  playSong: (index: number) => void;
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
  const audioRef = useRef<HTMLAudioElement>(null);

  const playSong = (index: number) => {
    if (!audioRef.current || musicFiles.length === 0) return;

    const music = musicFiles[index];
    if (!music) return;

    audioRef.current.src = music.url;
    audioRef.current.currentTime = 0;
    audioRef.current.play().then(() => {
      setIsPlaying(true);
      setCurrentSongIndex(index);
    }).catch(err => console.error('Error playing:', err));
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
    setMusicFiles,
    setCurrentSongIndex,
    setCurrentTime,
    setIsPlaying,
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