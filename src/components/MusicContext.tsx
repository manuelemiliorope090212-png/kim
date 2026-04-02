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
  queue: MusicFile[];
  originalSongId: string | null;
  setMusicFiles: (files: MusicFile[]) => void;
  setCurrentSongIndex: (index: number) => void;
  setCurrentTime: (time: number) => void;
  setIsPlaying: (playing: boolean) => void;
  setAutoplayFailed: (failed: boolean) => void;
  setQueue: (queue: MusicFile[]) => void;
  setOriginalSongId: (id: string | null) => void;
  addToQueue: (song: MusicFile) => void;
  removeFromQueue: (songId: string) => void;
  clearQueue: () => void;
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
  const [queue, setQueue] = useState<MusicFile[]>([]);
  const [originalSongId, setOriginalSongId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    // Fetch music files immediately on mount
    const fetchMusic = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/manuel/music`);
        if (res.ok) {
          const data = await res.json();
          const sortedData = data.sort((a: any, b: any) => a.order - b.order);
          setMusicFiles(sortedData);
        }
      } catch (error) {
        console.error('Error fetching music in context:', error);
      }
    };
    fetchMusic();
  }, []);

  const playSong = async (index: number) => {
    console.log('🎵 playSong called with index:', index);
    if (!audioRef.current || musicFiles.length === 0) {
      console.error('❌ No audio ref or no music files');
      return;
    }

    const music = musicFiles[index];
    if (!music) {
      console.error('❌ No music found at index:', index);
      return;
    }

    console.log('🎵 Playing song:', music.name, 'URL:', music.url);

    try {
      // Set the source and load
      audioRef.current.src = music.url;
      console.log('🎵 Set audio src to:', music.url);
      audioRef.current.load(); // Force reload for mobile compatibility
      console.log('🎵 Called audio.load()');

      // Wait a bit for loading on mobile
      console.log('🎵 Waiting 100ms for loading...');
      await new Promise(resolve => setTimeout(resolve, 100));

      console.log('🎵 Attempting to play...');
      // Try to play
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        console.log('🎵 Play promise created, awaiting...');
        await playPromise;
        console.log('✅ Audio started playing successfully!');
        setIsPlaying(true);
        setCurrentSongIndex(index);
      } else {
        console.warn('⚠️ Play promise is undefined');
      }
    } catch (err) {
      console.error('❌ Error playing:', err);
      console.error('❌ Error details:', (err as Error).message, (err as Error).name);
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

  const addToQueue = (song: MusicFile) => {
    setQueue(prev => {
      if (prev.find(s => s._id === song._id)) return prev;
      return [...prev, song];
    });
  };

  const removeFromQueue = (songId: string) => {
    setQueue(prev => prev.filter(s => s._id !== songId));
  };

  const clearQueue = () => {
    setQueue([]);
    setOriginalSongId(null);
  };

  const value: MusicContextType = {
    musicFiles,
    currentSongIndex,
    currentTime,
    isPlaying,
    autoplayFailed,
    queue,
    originalSongId,
    setMusicFiles,
    setCurrentSongIndex,
    setCurrentTime,
    setIsPlaying,
    setAutoplayFailed,
    setQueue,
    setOriginalSongId,
    addToQueue,
    removeFromQueue,
    clearQueue,
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