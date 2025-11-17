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

  console.log('🎵 GlobalMusicPlayer rendered - musicFiles:', musicFiles.length, 'currentSongIndex:', currentSongIndex, 'isPlaying:', isPlaying);

  // Sync when song changes (triggered by server updates)
  useEffect(() => {
    console.log('🎵 useEffect triggered for sync - musicFiles.length:', musicFiles.length);
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
              setCurrentSongIndex(serverSongIndex);
              if (data.currentTime !== undefined) {
                setCurrentTime(data.currentTime);
              }
              // Set the new song but don't auto-play (browsers require user interaction)
              if (audioRef.current) {
                console.log('🎵 Setting synced song src and currentTime (will play on user interaction)');
                audioRef.current.src = musicFiles[serverSongIndex].url;
                audioRef.current.currentTime = data.currentTime || 0;
                // Don't set isPlaying to true here - wait for user interaction
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
  }, [musicFiles, currentSongIndex, isPlaying]);

  return (
    <>
      {musicFiles.length > 0 && (
        <div className="fixed bottom-4 right-4 z-50">
          <audio
            ref={audioRef}
            className="hidden"
            src={musicFiles[currentSongIndex]?.url}
            preload="auto"
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
            console.log('🎵 onCanPlayThrough triggered - isPlaying:', isPlaying, 'currentTime:', currentTime, 'audio.readyState:', audioRef.current?.readyState);
            if (audioRef.current && isPlaying && audioRef.current.paused) {
              const audio = audioRef.current;
              console.log('🎵 Audio duration:', audio.duration, 'currentTime before:', audio.currentTime, 'muted:', audio.muted, 'volume:', audio.volume);
              if (currentTime < audio.duration) {
                audio.currentTime = currentTime;
                console.log('🎵 Set currentTime to:', currentTime);
              } else {
                audio.currentTime = 0;
                console.log('🎵 Reset currentTime to 0 (invalid time)');
              }
              // Only try to play if we have user interaction context and audio is paused
              // On mobile, this might fail due to autoplay restrictions
              console.log('🎵 Attempting to play from onCanPlayThrough...');
              const playPromise = audio.play();
              if (playPromise !== undefined) {
                playPromise.then(() => {
                  console.log('✅ Audio started playing from onCanPlayThrough - currentTime:', audio.currentTime, 'muted:', audio.muted, 'volume:', audio.volume);
                }).catch(err => {
                  console.error('❌ Autoplay prevented in onCanPlayThrough:', err);
                  console.error('❌ Error details:', (err as Error).message, (err as Error).name);
                  // On mobile, mark as not playing since autoplay failed
                  setIsPlaying(false);
                });
              } else {
                console.warn('⚠️ Play promise is undefined in onCanPlayThrough');
              }
            } else {
              console.log('🎵 Not playing, no audio ref, or already playing in onCanPlayThrough');
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
            console.error('❌ Audio error details:', (e.target as HTMLAudioElement)?.error);
            const nextIndex = (currentSongIndex + 1) % musicFiles.length;
            console.log('🎵 Trying next song due to error:', nextIndex);
            if (audioRef.current) {
              audioRef.current.src = musicFiles[nextIndex].url;
            }
          }}
          onLoadStart={() => console.log('🎵 Audio load started')}
          onLoadedMetadata={() => console.log('🎵 Audio metadata loaded')}
          onProgress={() => console.log('🎵 Audio progress event')}
          onStalled={() => console.log('🎵 Audio stalled')}
          onSuspend={() => console.log('🎵 Audio suspended')}
          onWaiting={() => console.log('🎵 Audio waiting')}
          />

          {/* Custom play button for user interaction */}
          {!isPlaying && (
            <button
              onClick={() => {
                if (audioRef.current) {
                  audioRef.current.play().then(() => {
                    setIsPlaying(true);
                    console.log('✅ User started playing music');
                  }).catch(err => {
                    console.error('❌ Error playing on user click:', err);
                  });
                }
              }}
              className="bg-[var(--coffee-light)] text-[var(--cream)] p-3 rounded-full shadow-lg hover:bg-[var(--coffee-medium)] transition-colors"
              title="Reproducir música"
            >
              🎵 ▶️
            </button>
          )}

          {isPlaying && (
            <button
              onClick={() => {
                if (audioRef.current) {
                  audioRef.current.pause();
                  setIsPlaying(false);
                  console.log('⏸️ User paused music');
                }
              }}
              className="bg-[var(--coffee-medium)] text-[var(--cream)] p-3 rounded-full shadow-lg hover:bg-[var(--coffee-dark)] transition-colors"
              title="Pausar música"
            >
              ⏸️
            </button>
          )}
        </div>
      )}
    </>
  );
}