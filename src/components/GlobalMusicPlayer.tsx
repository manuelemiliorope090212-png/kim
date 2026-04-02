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

  useEffect(() => {
    const syncWithServer = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/manuel/music/current`);
        if (response.ok) {
          const data = await response.json();
          if (data.currentSong) {
            const serverSongIndex = musicFiles.findIndex(song => song._id === data.currentSong._id);
            if (serverSongIndex !== -1) {
              // 1. Sync Song
              if (serverSongIndex !== currentSongIndex) {
                console.log('🎵 Song sync: server has', data.currentSong.name);
                setCurrentSongIndex(serverSongIndex);
                if (audioRef.current) {
                  audioRef.current.src = musicFiles[serverSongIndex].url;
                  audioRef.current.currentTime = data.currentTime || 0;
                }
              } else {
                // 2. Sync Time Drift (only if drift > 3s)
                if (audioRef.current && Math.abs(audioRef.current.currentTime - data.currentTime) > 3) {
                   console.log('🎵 Time drift sync: adjusting by', Math.abs(audioRef.current.currentTime - data.currentTime), 'seconds');
                   audioRef.current.currentTime = data.currentTime;
                }
              }
              
              // 3. Sync Playing State
              if (data.isPlaying !== undefined && audioRef.current) {
                if (data.isPlaying && audioRef.current.paused) {
                  audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
                } else if (!data.isPlaying && !audioRef.current.paused) {
                  audioRef.current.pause();
                  setIsPlaying(false);
                }
              }
            }
          }
        }
      } catch (error) {
        console.error('Error syncing with server:', error);
      }
    };

    // Check every 4 seconds for a balance between "real-time" and "less load"
    syncWithServer();
    const interval = setInterval(syncWithServer, 4000);

    return () => clearInterval(interval);
  }, [musicFiles, currentSongIndex, isPlaying]);

  return (
    <>
      {musicFiles.length > 0 && (
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
            const nextSong = musicFiles[nextIndex];
            if (audioRef.current && nextSong) {
              audioRef.current.src = nextSong.url;
              audioRef.current.currentTime = 0;
              audioRef.current.play().then(() => {
                setIsPlaying(true);
                setCurrentSongIndex(nextIndex);
                // Update server so everyone follows the playlist
                fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/manuel/music/current`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    currentSongId: nextSong._id,
                    currentTime: 0,
                    isPlaying: true
                  })
                }).catch(() => {});
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
      )}
    </>
  );
}