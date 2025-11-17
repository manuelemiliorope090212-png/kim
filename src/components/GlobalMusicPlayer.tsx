'use client';

import { useMusic } from './MusicContext';
import { useEffect } from 'react';

export default function GlobalMusicPlayer() {
  const {
    musicFiles,
    currentSongIndex,
    currentTime,
    isPlaying,
    setMusicFiles,
    setCurrentSongIndex,
    setCurrentTime,
    setIsPlaying,
    audioRef
  } = useMusic();

  // Sync when song changes (triggered by server updates)
  useEffect(() => {
    if (musicFiles.length === 0) return;

    const checkForSongChanges = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/manuel/music/current`);
        if (response.ok) {
          const data = await response.json();
          if (data.currentSong) {
            const serverSongIndex = musicFiles.findIndex(song => song._id === data.currentSong._id);
            if (serverSongIndex !== -1 && serverSongIndex !== currentSongIndex) {
              console.log('🎵 Server song changed, updating local player:', data.currentSong.name);
              // Update immediately when server song changes
              setCurrentSongIndex(serverSongIndex);
              setCurrentTime(data.currentTime);
              setIsPlaying(true); // Start playing the new song
              if (audioRef.current) {
                audioRef.current.src = musicFiles[serverSongIndex].url;
                audioRef.current.currentTime = data.currentTime;
                // Try to play immediately
                const playPromise = audioRef.current.play();
                if (playPromise !== undefined) {
                  playPromise.catch(err => {
                    console.error('❌ Could not auto-play new song:', err);
                    setIsPlaying(false);
                  });
                }
              }
            }
          }
        }
      } catch (error) {
        console.error('Error checking for song changes:', error);
      }
    };

    // Check immediately and then every 2 seconds for faster sync
    checkForSongChanges();
    const interval = setInterval(checkForSongChanges, 2000);

    return () => clearInterval(interval);
  }, [musicFiles, currentSongIndex, isPlaying, setCurrentSongIndex, setCurrentTime, setIsPlaying]);

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
            console.log('🎵 onCanPlayThrough triggered');
            console.log('🎵 isPlaying:', isPlaying, 'currentTime:', currentTime);
            if (audioRef.current && isPlaying) {
              const audio = audioRef.current;
              console.log('🎵 Audio duration:', audio.duration);
              if (currentTime < audio.duration) {
                audio.currentTime = currentTime;
                console.log('🎵 Set currentTime to:', currentTime);
              } else {
                audio.currentTime = 0;
                console.log('🎵 Reset currentTime to 0 (invalid time)');
              }
              // Only try to play if we have user interaction context
              // On mobile, this might fail due to autoplay restrictions
              console.log('🎵 Attempting to play from onCanPlayThrough...');
              const playPromise = audio.play();
              if (playPromise !== undefined) {
                playPromise.then(() => {
                  console.log('✅ Audio started playing from onCanPlayThrough');
                }).catch(err => {
                  console.error('❌ Autoplay prevented in onCanPlayThrough:', err);
                  console.error('❌ Error details:', err.message, err.name);
                  // On mobile, mark as not playing since autoplay failed
                  setIsPlaying(false);
                });
              } else {
                console.warn('⚠️ Play promise is undefined in onCanPlayThrough');
              }
            } else {
              console.log('🎵 Not playing or no audio ref in onCanPlayThrough');
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
            console.error('❌ Error loading audio:', e);
            console.error('❌ Audio error details:', e.target?.error);
            const nextIndex = (currentSongIndex + 1) % musicFiles.length;
            console.log('🎵 Trying next song due to error:', nextIndex);
            if (audioRef.current) {
              audioRef.current.src = musicFiles[nextIndex].url;
            }
          }}
          onLoadStart={() => console.log('🎵 Audio load started')}
          onLoadedData={() => console.log('🎵 Audio data loaded')}
          onLoadedMetadata={() => console.log('🎵 Audio metadata loaded')}
          onProgress={() => console.log('🎵 Audio progress event')}
          onStalled={() => console.log('🎵 Audio stalled')}
          onSuspend={() => console.log('🎵 Audio suspended')}
          onWaiting={() => console.log('🎵 Audio waiting')}
        />
      )}
    </>
  );
}