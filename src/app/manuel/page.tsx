'use client';

import { useState, useEffect, useRef } from 'react';

const MANUEL_PASSWORD = 'manuel123'; // Change this to a secure password

interface ManuelNote {
  _id: string;
  title: string;
  content: string;
  date: string;
  type: 'note' | 'image';
  imageUrl?: string;
}

interface MusicFile {
  _id: string;
  name: string;
  url: string;
  order: number;
}

export default function Manuel() {
  const [password, setPassword] = useState('');
  const [loggedIn, setLoggedIn] = useState(false);
  // Notes state
  const [notes, setNotes] = useState<ManuelNote[]>([]);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteImage, setNoteImage] = useState<File | null>(null);

  // Music state
  const [musicFiles, setMusicFiles] = useState<MusicFile[]>([]);
  const [selectedMusic, setSelectedMusic] = useState<File | null>(null);
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const [message, setMessage] = useState('');

  useEffect(() => {
    if (loggedIn) {
      fetchNotes();
      fetchMusicFiles();
    }
  }, [loggedIn]);

  // Sincronización de música en vivo (igual que en la página principal)
  useEffect(() => {
    if (musicFiles.length === 0) return;

    const syncMusic = () => {
      // Timestamp base: medianoche del día actual
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const elapsedMs = now.getTime() - startOfDay.getTime();
      const elapsedSeconds = elapsedMs / 1000;

      // Duración estimada por canción (3 minutos = 180 segundos)
      const songDuration = 180;
      const totalPlaylistDuration = musicFiles.length * songDuration;

      // Calcular posición en el loop infinito
      const positionInLoop = elapsedSeconds % totalPlaylistDuration;

      // Encontrar qué canción debería estar sonando
      let accumulatedTime = 0;
      let currentSongIdx = 0;
      let currentSongTime = 0;

      for (let i = 0; i < musicFiles.length; i++) {
        if (positionInLoop < accumulatedTime + songDuration) {
          currentSongIdx = i;
          currentSongTime = positionInLoop - accumulatedTime;
          break;
        }
        accumulatedTime += songDuration;
      }

      setCurrentSongIndex(currentSongIdx);
      setCurrentTime(currentSongTime);
    };

    // Sincronizar inmediatamente
    syncMusic();

    // Actualizar cada 30 segundos para correcciones menores (menos interrupciones)
    const interval = setInterval(syncMusic, 30000);

    return () => clearInterval(interval);
  }, [musicFiles]);

  // Función para iniciar música
  const startMusic = async () => {
    if (!audioRef.current || musicFiles.length === 0) return;

    try {
      audioRef.current.currentTime = currentTime;
      await audioRef.current.play();
      setIsPlaying(true);
    } catch (error) {
      console.error('Error al reproducir música:', error);
    }
  };

  const handleLogin = () => {
    if (password === MANUEL_PASSWORD) {
      setLoggedIn(true);
    } else {
      alert('Contraseña incorrecta');
    }
  };

  const fetchNotes = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/manuel/notes`);
      if (res.ok) {
        const data = await res.json();
        setNotes(data);
      }
    } catch (error) {
      console.error('Error fetching notes:', error);
    }
  };

  const fetchMusicFiles = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/manuel/music`);
      if (res.ok) {
        const data = await res.json();
        setMusicFiles(data);
      }
    } catch (error) {
      console.error('Error fetching music files:', error);
    }
  };


  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('title', noteTitle);
    formData.append('content', noteContent);
    formData.append('type', noteImage ? 'image' : 'note');
    if (noteImage) formData.append('image', noteImage);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/manuel/notes`, {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        setMessage('Nota agregada exitosamente!');
        setNoteTitle('');
        setNoteContent('');
        setNoteImage(null);
        fetchNotes();
      } else {
        setMessage('Error agregando nota');
      }
    } catch (error) {
      setMessage('Error de conexión');
    }
  };

  const handleUploadMusic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMusic) return;

    const formData = new FormData();
    formData.append('music', selectedMusic);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/manuel/music`, {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        setMessage('Música subida exitosamente!');
        setSelectedMusic(null);
        fetchMusicFiles();
      } else {
        setMessage('Error subiendo música');
      }
    } catch (error) {
      setMessage('Error de conexión');
    }
  };


  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta nota?')) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/manuel/notes/${noteId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setMessage('Nota eliminada!');
        fetchNotes();
      } else {
        setMessage('Error eliminando nota');
      }
    } catch (error) {
      setMessage('Error de conexión');
    }
  };

  if (!loggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center text-[var(--cream)] relative overflow-hidden">
        {/* Floating Coffee Elements */}
        <div className="absolute inset-0 pointer-events-none">
          <span className="absolute top-20 left-10 text-4xl floating-heart">☕</span>
          <span className="absolute bottom-20 right-10 text-3xl floating-cat">🫖</span>
          <span className="absolute top-1/2 right-20 text-2xl floating-heart">🔒</span>
        </div>

        <div className="aesthetic-card p-6 md:p-8 max-w-md mx-4 relative z-10">
          <h1 className="text-3xl md:text-4xl font-bold text-[var(--cream)] mb-6 text-center animate-pulse drop-shadow-lg">
             Panel de Manuel
          </h1>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Contraseña"
            className="w-full p-3 border-2 border-[var(--cream)] border-opacity-30 rounded-xl mb-4 focus:border-[var(--cream)] focus:outline-none bg-[rgba(254,247,237,0.1)] text-[var(--cream)] placeholder-[var(--cream)] placeholder-opacity-70"
          />
          <button
            onClick={handleLogin}
            className="w-full bg-[var(--coffee-light)] text-[var(--cream)] p-3 rounded-xl font-semibold hover:bg-[var(--coffee-medium)] transition-colors drop-shadow-lg"
          >
            Entrar 🚪
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-[var(--cream)] relative overflow-hidden p-4">
      {/* Floating Coffee Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <span className="absolute top-10 left-10 text-3xl floating-heart">☕</span>
        <span className="absolute top-20 right-20 text-2xl floating-cat">🫖</span>
        <span className="absolute bottom-40 left-20 text-xl floating-heart">🎨</span>
        <span className="absolute bottom-20 right-10 text-3xl floating-cat">📝</span>
        <span className="absolute top-1/2 left-5 text-2xl floating-heart">💖</span>
        <span className="absolute top-1/3 right-5 text-xl floating-cat">🎵</span>
      </div>

      {/* Música sincronizada (siempre reproduciendo) */}
      {musicFiles.length > 0 && (
        <audio
          ref={audioRef}
          className="hidden"
          src={musicFiles[currentSongIndex]?.url}
          preload="auto"
          onLoadedData={(e) => {
            const audio = e.target as HTMLAudioElement;
            if (isPlaying) {
              audio.currentTime = currentTime;
            }
          }}
          onCanPlayThrough={() => {
            // Cuando está lista, reproduce automáticamente
            if (isPlaying && audioRef.current) {
              audioRef.current.currentTime = currentTime;
              audioRef.current.play().catch(err => console.error('Error reproduciendo:', err));
            }
          }}
          onEnded={() => {
            // Cambiar inmediatamente a la siguiente canción para reproducción continua
            const nextIndex = (currentSongIndex + 1) % musicFiles.length;
            setCurrentSongIndex(nextIndex);
          }}
          onTimeUpdate={(e) => {
            const audio = e.target as HTMLAudioElement;
            if (isPlaying && Math.abs(audio.currentTime - currentTime) > 30) {
              // Re-sincronizar solo si hay drift muy grande (>30 segundos) para evitar reinicios constantes
              audio.currentTime = currentTime;
            }
          }}
          onError={(e) => {
            console.error('Error cargando audio:', e);
            // Intentar pasar a la siguiente canción si hay error
            const nextIndex = (currentSongIndex + 1) % musicFiles.length;
            setCurrentSongIndex(nextIndex);
          }}
        />
      )}

      <div className="max-w-6xl mx-auto relative z-10">
        <header className="text-center py-8 md:py-12 mb-8">
          <div className="aesthetic-card p-6 md:p-8 max-w-2xl mx-auto">
            <h1 className="text-3xl md:text-4xl font-bold text-[var(--cream)] mb-3 md:mb-4 animate-pulse drop-shadow-lg">
               Panel Personal de Manuel
            </h1>
            <p className="text-lg md:text-xl text-[var(--cream)] opacity-90">
              Sube dibujos, escribe notas y agrega música para Kimberly 💕
            </p>
          </div>
        </header>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Add Content Form */}
          <div className="lg:col-span-1">
            <div className="aesthetic-card p-6 mb-6">
              <h2 className="text-2xl font-bold text-[var(--cream)] mb-4">
                ➕ Agregar Dibujo o Nota
              </h2>
              <form onSubmit={handleAddNote}>
                <div className="mb-4">
                  <label className="block text-[var(--coffee-brown)] font-semibold mb-2">
                    Título
                  </label>
                  <input
                    type="text"
                    value={noteTitle}
                    onChange={(e) => setNoteTitle(e.target.value)}
                    required
                    className="w-full p-3 border-2 border-[var(--cream)] border-opacity-30 rounded-xl focus:border-[var(--cream)] focus:outline-none bg-[rgba(254,247,237,0.1)] text-[var(--cream)] placeholder-[var(--cream)] placeholder-opacity-70"
                    placeholder="Título..."
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-[var(--cream)] font-semibold mb-2">
                    Nota (opcional si hay imagen)
                  </label>
                  <textarea
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    className="w-full p-3 border-2 border-[var(--cream)] border-opacity-30 rounded-xl h-24 focus:border-[var(--cream)] focus:outline-none resize-none bg-[rgba(254,247,237,0.1)] text-[var(--cream)] placeholder-[var(--cream)] placeholder-opacity-70"
                    placeholder="Escribe algo bonito..."
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-[var(--cream)] font-semibold mb-2">
                    Dibujo/Imagen
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setNoteImage(e.target.files?.[0] || null)}
                    className="w-full p-3 border-2 border-[var(--cream)] border-opacity-30 rounded-xl file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[var(--coffee-light)] file:text-[var(--cream)] hover:file:bg-[var(--coffee-medium)] bg-[rgba(254,247,237,0.1)]"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-[var(--coffee-light)] text-[var(--cream)] p-3 rounded-xl font-semibold hover:bg-[var(--coffee-medium)] transition-colors drop-shadow-lg"
                >
                  🎨 Agregar al Sitio
                </button>
              </form>
            </div>

            {/* Music Upload */}
            <div className="aesthetic-card p-6">
              <h2 className="text-2xl font-bold text-[var(--cream)] mb-4">
                🎵 Agregar Música
              </h2>
              <form onSubmit={handleUploadMusic}>
                <div className="mb-4">
                  <label className="block text-[var(--cream)] font-semibold mb-2">
                    Archivo MP3/MP4
                  </label>
                  <input
                    type="file"
                    accept="audio/*,video/*"
                    onChange={(e) => setSelectedMusic(e.target.files?.[0] || null)}
                    required
                    className="w-full p-3 border-2 border-[var(--cream)] border-opacity-30 rounded-xl file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[var(--coffee-light)] file:text-[var(--cream)] hover:file:bg-[var(--coffee-medium)] bg-[rgba(254,247,237,0.1)]"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-[var(--coffee-light)] text-[var(--cream)] p-3 rounded-xl font-semibold hover:bg-[var(--coffee-medium)] transition-colors drop-shadow-lg"
                >
                  🎶 Agregar a Playlist
                </button>
              </form>
            </div>
          </div>

          {/* Content Display */}
          <div className="lg:col-span-2 space-y-6">
            {/* Notes/Drawings */}
            <div>
              <h2 className="text-2xl font-bold text-[var(--cream)] mb-4">
                🎨 Dibujos y Notas Subidos ({notes.length})
              </h2>
              {notes.length === 0 ? (
                <div className="aesthetic-card p-8 text-center">
                  <p className="text-[var(--cream)] opacity-75 text-lg">
                    Aún no has subido nada. ¡Agrega dibujos y notas para Kimberly! 💕
                  </p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {notes.map((note) => (
                    <div key={note._id} className="aesthetic-card p-4">
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="text-lg font-semibold text-[var(--cream)]">
                          {note.title}
                        </h3>
                        <button
                          onClick={() => handleDeleteNote(note._id)}
                          className="text-red-300 hover:text-red-100 text-xl"
                        >
                          🗑️
                        </button>
                      </div>
                      {note.type === 'image' && note.imageUrl && (
                        <img
                          src={note.imageUrl}
                          alt={note.title}
                          className="w-full rounded-xl mb-3 max-h-48 object-cover"
                        />
                      )}
                      {note.content && (
                        <p className="text-[var(--cream)] whitespace-pre-wrap text-sm">
                          {note.content}
                        </p>
                      )}
                      <p className="text-xs text-[var(--cream)] opacity-50 mt-2">
                        📅 {new Date(note.date).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Control de Música */}
            <div>
              <h2 className="text-2xl font-bold text-[var(--cream)] mb-4">
                🎵 Control de Música
              </h2>
              {musicFiles.length === 0 ? (
                <div className="aesthetic-card p-8 text-center">
                  <p className="text-[var(--cream)] opacity-75 text-lg">
                    No hay música subida. ¡Agrega canciones para el sitio! 🎶
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Canción Actual Sincronizada */}
                  <div className="aesthetic-card p-6">
                    <h3 className="text-lg font-bold text-[var(--cream)] mb-3">
                      🎶 Reproducción Sincronizada
                    </h3>
                    <div className="text-center">
                      <div className="text-3xl mb-2">
                        {isPlaying ? '🎵' : '⏸️'}
                      </div>
                      <h4 className="text-lg font-semibold text-[var(--cream)] mb-2">
                        {musicFiles[currentSongIndex]?.name}
                      </h4>
                      <p className="text-[var(--cream)] opacity-75 text-sm mb-4">
                        Canción {currentSongIndex + 1} de {musicFiles.length} - Sincronizada
                      </p>
                      <div className="flex justify-center gap-3">
                        {!isPlaying ? (
                          <button
                            onClick={startMusic}
                            className="px-4 py-2 bg-[var(--coffee-light)] text-[var(--cream)] rounded-lg font-semibold hover:bg-[var(--coffee-medium)] transition-colors"
                          >
                            ▶️ Iniciar Sincronización
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              if (audioRef.current) {
                                audioRef.current.pause();
                                setIsPlaying(false);
                              }
                            }}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors"
                          >
                            ⏸️ Pausar
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Selector Manual de Canciones (estilo Spotify) */}
                  <div className="aesthetic-card p-6">
                    <h3 className="text-lg font-bold text-[var(--cream)] mb-3">
                      🎵 Control de Música (Estilo Spotify)
                    </h3>
                    <p className="text-[var(--cream)] opacity-75 text-sm mb-4">
                      Haz clic en cualquier canción para reproducirla desde el segundo 0
                    </p>

                    {/* Control de tiempo personalizado */}
                    <div className="mb-4 p-3 bg-[rgba(254,247,237,0.1)] rounded-lg">
                      <label className="block text-[var(--cream)] font-medium mb-2">
                        ⏰ Segundo personalizado (opcional):
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="180"
                        placeholder="0"
                        className="w-full p-2 border-2 border-[var(--cream)] border-opacity-30 rounded-lg bg-[rgba(254,247,237,0.1)] text-[var(--cream)] placeholder-[var(--cream)] placeholder-opacity-70 focus:border-[var(--cream)] focus:outline-none"
                        onChange={(e) => {
                          const customTime = parseInt(e.target.value) || 0;
                          if (audioRef.current && isPlaying) {
                            audioRef.current.currentTime = customTime;
                          }
                        }}
                      />
                      <p className="text-xs text-[var(--cream)] opacity-60 mt-1">
                        Cambia el segundo mientras la canción está reproduciéndose
                      </p>
                    </div>

                    <div className="space-y-2">
                      {musicFiles.map((music, index) => (
                        <div
                          key={music._id}
                          className={`p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                            currentSongIndex === index && isPlaying
                              ? 'bg-[var(--coffee-light)] border-2 border-[var(--cream)]'
                              : 'bg-[rgba(254,247,237,0.1)] hover:bg-[rgba(254,247,237,0.2)]'
                          }`}
                          onClick={() => {
                            // Detener canción anterior si está reproduciendo
                            if (audioRef.current) {
                              audioRef.current.pause();
                            }

                            // Cambiar a la nueva canción y reproducir desde el segundo 0
                            if (audioRef.current) {
                              audioRef.current.src = music.url;
                              audioRef.current.currentTime = 0;
                              audioRef.current.play().then(() => {
                                setIsPlaying(true);
                                setCurrentSongIndex(index);
                              }).catch(err => console.error('Error reproduciendo:', err));
                            }
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h4 className="text-[var(--cream)] font-medium flex items-center gap-2">
                                {currentSongIndex === index && isPlaying ? '🎵' : '🎶'} {music.name}
                              </h4>
                              <p className="text-[var(--cream)] opacity-60 text-sm">
                                #{music.order} • Haz clic para reproducir desde el inicio
                              </p>
                            </div>
                            <div className="text-[var(--cream)] opacity-75">
                              {currentSongIndex === index && isPlaying ? '🔊 Reproduciendo' : '🔇 Lista'}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Botón para volver a sincronización */}
                    <div className="mt-4 pt-4 border-t border-[var(--cream)] border-opacity-20">
                      <button
                        onClick={() => {
                          // Detener reproducción manual y volver a sincronización
                          if (audioRef.current) {
                            audioRef.current.pause();
                            setIsPlaying(false);
                            // Volver a la canción sincronizada actual después de un breve delay
                            setTimeout(() => startMusic(), 500);
                          }
                        }}
                        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                      >
                        🔄 Volver a Reproducción Sincronizada
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Message Display */}
        {message && (
          <div className="fixed bottom-4 right-4 aesthetic-card p-4 max-w-sm">
            <p className="text-[var(--cream)]">{message}</p>
            <button
              onClick={() => setMessage('')}
              className="absolute top-2 right-2 text-[var(--cream)] opacity-50 hover:opacity-100"
            >
              ✕
            </button>
          </div>
        )}
      </div>
    </div>
  );
}