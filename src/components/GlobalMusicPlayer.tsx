'use client';

import { useMusic } from './MusicContext';
import { useEffect } from 'react';

export default function GlobalMusicPlayer() {
  const {
    musicFiles,
    currentSongIndex,
    currentTime,
    isPlaying,
    queue,
    originalSongId,
    setMusicFiles,
    setCurrentSongIndex,
    setCurrentTime,
    setIsPlaying,
    setQueue,
    setOriginalSongId,
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
                // 2. Sync Time Drift (only if drift > 4s or if we just started)
                if (audioRef.current) {
                   const drift = Math.abs(audioRef.current.currentTime - data.currentTime);
                   if (drift > 4) {
                      console.log('🎵 Time drift sync: adjusting by', drift, 'seconds');
                      audioRef.current.currentTime = data.currentTime;
                   }
                }
              }
              
               // 3. Sync Playing State
              if (data.isPlaying !== undefined && audioRef.current) {
                if (data.isPlaying && audioRef.current.paused) {
                  console.log('🎵 State sync: Server says PLAY, local is PAUSED. Playing...');
                  audioRef.current.play()
                    .then(() => setIsPlaying(true))
                    .catch(err => {
                      console.error('❌ Could not start playback during sync:', err);
                      // On mobile we might need a user gesture
                      setIsPlaying(false);
                    });
                } else if (!data.isPlaying && !audioRef.current.paused) {
                  console.log('🎵 State sync: Server says PAUSE, local is PLAYING. Pausing...');
                  audioRef.current.pause();
                  setIsPlaying(false);
                }
              }

              // 4. Sync Queue and Original Song
              if (data.queue) {
                setQueue(data.queue);
              }
              if (data.originalSongId !== undefined) {
                setOriginalSongId(data.originalSongId);
              }
            }
          }
        }
      } catch (error) {
        console.error('Error syncing with server:', error);
      }
    };

    // Only run the interval if we are NOT on the Manuel page (to avoid feedback loops)
    // Or if we are on the Manuel page, maybe run it less frequently?
    // Let's check for the path
    const isManuelPage = typeof window !== 'undefined' && window.location.pathname.includes('/manuel');
    
    syncWithServer();
    const intervalTime = isManuelPage ? 10000 : 4000; // Poll less frequently on Manuel page
    const interval = setInterval(syncWithServer, intervalTime);

    return () => clearInterval(interval);
  }, [musicFiles, currentSongIndex, isPlaying, queue, originalSongId]);

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
            console.log('🎵 Song ended. Checking queue...');
            
            // 1. Check if there is something in the queue
            if (queue && queue.length > 0) {
              const nextSong = queue[0];
              const remainingQueue = queue.slice(1);
              const nextIndex = musicFiles.findIndex(s => s._id === nextSong._id);

              console.log('🎵 Playing next song in queue:', nextSong.name);
              
              if (audioRef.current && nextSong && nextIndex !== -1) {
                audioRef.current.src = nextSong.url;
                audioRef.current.currentTime = 0;
                audioRef.current.play().then(() => {
                  setIsPlaying(true);
                  setCurrentSongIndex(nextIndex);
                  setQueue(remainingQueue);
                  // Update server: pop from queue
                  fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/manuel/music/current`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      currentSongId: nextSong._id,
                      currentTime: 0,
                      isPlaying: true,
                      queue: remainingQueue.map(s => s._id)
                    })
                  }).catch(() => {});
                }).catch(err => console.error('Error playing next from queue:', err));
              }
              return;
            }

            // 2. Check if we have an original song to return to
            if (originalSongId) {
              const prevSongIndex = musicFiles.findIndex(s => s._id === originalSongId);
              const prevSong = musicFiles[prevSongIndex];

              console.log('🎵 Queue finished. Returning to original song:', prevSong?.name);

              if (audioRef.current && prevSong && prevSongIndex !== -1) {
                audioRef.current.src = prevSong.url;
                audioRef.current.currentTime = 0;
                audioRef.current.play().then(() => {
                  setIsPlaying(true);
                  setCurrentSongIndex(prevSongIndex);
                  setOriginalSongId(null);
                  // Update server: clear originalSongId
                  fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/manuel/music/current`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      currentSongId: prevSong._id,
                      currentTime: 0,
                      isPlaying: true,
                      originalSongId: null
                    })
                  }).catch(() => {});
                }).catch(err => console.error('Error returning to original song:', err));
              }
              return;
            }

            // 3. Fallback to normal sequence
            const nextIndex = (currentSongIndex + 1) % musicFiles.length;
            const nextSong = musicFiles[nextIndex];
            if (audioRef.current && nextSong) {
              audioRef.current.src = nextSong.url;
              audioRef.current.currentTime = 0;
              audioRef.current.play().then(() => {
                setIsPlaying(true);
                setCurrentSongIndex(nextIndex);
                // Update server
                fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/manuel/music/current`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    currentSongId: nextSong._id,
                    currentTime: 0,
                    isPlaying: true
                  })
                }).catch(() => {});
              }).catch(err => console.error('Error playing next in sequence:', err));
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