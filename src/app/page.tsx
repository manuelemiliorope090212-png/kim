'use client';

import { useEffect, useState, useRef } from 'react';

interface Memory {
  _id: string;
  type: 'drawing' | 'letter' | 'photo' | 'note';
  title: string;
  content: string;
  date: string;
}

interface ManuelNote {
  _id: string;
  type: 'note' | 'image';
  title: string;
  content?: string;
  imageUrl?: string;
  date: string;
}

type ContentItem = (Memory | ManuelNote) & { source: 'memory' | 'manuel' };

export default function Home() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [manuelNotes, setManuelNotes] = useState<ManuelNote[]>([]);
  const [musicPlaylist, setMusicPlaylist] = useState<any[]>([]);
  const [allContent, setAllContent] = useState<ContentItem[]>([]);
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [showPasswordError, setShowPasswordError] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    // Fetch memories
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/memories`)
      .then(res => res.json())
      .then(data => setMemories(data))
      .catch(err => console.error(err));

    // Fetch Manuel's notes
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/manuel/notes`)
      .then(res => res.json())
      .then(data => setManuelNotes(data))
      .catch(err => console.error('Error fetching manuel notes:', err));

    // Fetch music playlist
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/manuel/music`)
      .then(res => res.json())
      .then(data => setMusicPlaylist(data.sort((a: any, b: any) => a.order - b.order)))
      .catch(err => console.error('Error fetching music playlist:', err));
  }, []);

  // Combine memories and manuel notes when either changes
  useEffect(() => {
    const combined = [
      ...memories.map(memory => ({ ...memory, source: 'memory' as const })),
      ...manuelNotes.map(note => ({ ...note, source: 'manuel' as const }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    setAllContent(combined);
  }, [memories, manuelNotes]);

  // Sincronización de música con el servidor
  useEffect(() => {
    if (musicPlaylist.length === 0) return;

    const syncWithServer = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/manuel/music/current`);
        if (response.ok) {
          const data = await response.json();
          if (data.currentSong) {
            // Encontrar el índice de la canción actual en la playlist
            const songIndex = musicPlaylist.findIndex(song => song._id === data.currentSong._id);
            if (songIndex !== -1) {
              setCurrentSongIndex(songIndex);
              setCurrentTime(data.currentTime);
            }
          }
        }
      } catch (error) {
        console.error('Error syncing with server:', error);
      }
    };

    // Sincronizar inmediatamente al cargar
    syncWithServer();

    // Sincronizar cada 30 segundos para mantener consistencia
    const interval = setInterval(syncWithServer, 30000);

    return () => clearInterval(interval);
  }, [musicPlaylist]);

  // Función para validar contraseña
  const checkPassword = () => {
    // La fecha especial: 27 de octubre de 2025
    const specialDate = '27/10/2025';
    const alternativeFormats = [
      '27/10/2025',
      '27-10-2025',
      '27102025',
      '27 10 2025',
      '27.10.2025'
    ];

    const normalizedPassword = password.trim().toLowerCase();

    if (alternativeFormats.some(format => normalizedPassword === format.toLowerCase())) {
      setIsAuthenticated(true);
      setShowPasswordError(false);
      // Iniciar música automáticamente al autenticar
      setTimeout(() => startMusic(), 500);
    } else {
      setShowPasswordError(true);
      setTimeout(() => setShowPasswordError(false), 3000);
    }
  };

  // Función para iniciar música después de interacción del usuario
  const startMusic = async () => {
    if (!audioRef.current || musicPlaylist.length === 0) return;

    try {
      audioRef.current.currentTime = currentTime;
      await audioRef.current.play();
      setIsPlaying(true);
    } catch (error) {
      console.error('Error al reproducir música:', error);
    }
  };

  // Función para detener música
  const stopMusic = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  // Efecto para reproducir automáticamente cuando cambia la canción (si ya está activada)
  useEffect(() => {
    if (isPlaying && audioRef.current && musicPlaylist.length > 0) {
      const playCurrentSong = async () => {
        try {
          // Pequeño delay para asegurar que el src se haya actualizado
          setTimeout(async () => {
            if (audioRef.current) {
              audioRef.current.currentTime = currentTime;
              await audioRef.current.play();
            }
          }, 100);
        } catch (error) {
          console.error('Error al cambiar canción:', error);
        }
      };
      playCurrentSong();
    }
  }, [currentSongIndex, isPlaying, musicPlaylist.length]);

  const getRandomRotation = () => Math.random() * 6 - 3; // -3 to 3 degrees
  const getRandomSize = () => 'w-full'; // Tamaño consistente para mejor concentración

  const renderContent = (item: ContentItem, index: number) => {
    const isManuelNote = item.source === 'manuel';
    const isImage = isManuelNote ? (item as ManuelNote).type === 'image' : (item as Memory).type === 'photo' || (item as Memory).type === 'drawing';
    const isText = isManuelNote ? (item as ManuelNote).type === 'note' : (item as Memory).type === 'letter' || (item as Memory).type === 'note';

    return (
      <div
        key={item._id}
        className={`aesthetic-card p-6 break-inside-avoid mb-6 ${getRandomSize()}`}
        style={{
          transform: `rotate(${getRandomRotation()}deg)`,
          animationDelay: `${index * 0.1}s`
        }}
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-semibold text-[var(--cream)]">{item.title}</h2>
          <span className="text-lg">
            {isManuelNote ? (
              (item as ManuelNote).type === 'image' ? '🖼️' : '📝'
            ) : (
              (item as Memory).type === 'drawing' && '🎨' ||
              (item as Memory).type === 'letter' && '💌' ||
              (item as Memory).type === 'photo' && '📸' ||
              (item as Memory).type === 'note' && '📝'
            )}
          </span>
        </div>
        <p className="text-sm text-[var(--cream)] opacity-75 mb-4">
          📅 {new Date(item.date).toLocaleDateString()}
        </p>
        {isImage && (
          <img
            src={isManuelNote ? (item as ManuelNote).imageUrl! : (item as Memory).content}
            alt={item.title}
            className="w-full rounded-xl mb-4"
            style={{ maxHeight: '300px', objectFit: 'cover' }}
          />
        )}
        {isText && (
          <div className="notebook-note bg-[rgba(254,247,237,0.1)] backdrop-blur-sm border border-[var(--cream)] border-opacity-30 p-6 rounded-lg text-[var(--cream)] whitespace-pre-wrap text-sm leading-relaxed relative">
            {/* Líneas de cuaderno */}
            <div className="absolute inset-0 pointer-events-none opacity-30">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-full border-b border-[var(--cream)] border-opacity-50"
                  style={{ top: `${(i + 1) * 2.2}rem` }}
                />
              ))}
            </div>
            {/* Agujeros del cuaderno */}
            <div className="absolute left-0 top-4 bottom-4 flex flex-col justify-around">
              <div className="w-3 h-3 bg-[var(--cream)] rounded-full opacity-40"></div>
              <div className="w-3 h-3 bg-[var(--cream)] rounded-full opacity-40"></div>
              <div className="w-3 h-3 bg-[var(--cream)] rounded-full opacity-40"></div>
            </div>
            <div className="pl-6 relative z-10">
              {isManuelNote ? (item as ManuelNote).content : (item as Memory).content}
            </div>
          </div>
        )}
        <div className="mt-4 flex justify-end space-x-2">
          <span className="text-lg">💕</span>
          <span className="text-lg">🐱</span>
          <span className="text-lg">☕</span>
        </div>
      </div>
    );
  };

  // Si no está autenticado, mostrar pantalla de contraseña
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen text-[var(--cream)] relative overflow-hidden">
        {/* Floating Coffee Elements - mismos que el sitio principal */}
        <div className="absolute inset-0 pointer-events-none">
          <span className="absolute top-10 left-10 text-4xl floating-heart">☕</span>
          <span className="absolute top-20 right-20 text-3xl floating-cat">🫖</span>
          <span className="absolute bottom-40 left-20 text-2xl floating-heart">🍪</span>
          <span className="absolute bottom-20 right-10 text-4xl floating-cat">🥐</span>
          <span className="absolute top-1/2 left-5 text-3xl floating-heart">🌸</span>
          <span className="absolute top-1/3 right-5 text-2xl floating-cat">💖</span>
          <span className="absolute bottom-1/3 left-1/3 text-2xl floating-heart">🐱</span>
          <span className="absolute top-3/4 right-1/4 text-3xl floating-cat">✨</span>
        </div>

        {/* Header igual que el sitio principal */}
        <header className="relative text-center py-12 md:py-16 px-4 mt-8">
          <div className="aesthetic-card p-6 md:p-8 max-w-2xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold text-[var(--cream)] mb-4 md:mb-6 animate-pulse drop-shadow-lg leading-tight">
              ☕ Para Kimberly ☕
            </h1>

            <div className="flex justify-center space-x-4 md:space-x-6 text-2xl md:text-3xl">
              <span className="drop-shadow-lg">🎨</span>
              <span className="drop-shadow-lg">💌</span>
              <span className="drop-shadow-lg">📸</span>
              <span className="drop-shadow-lg">📝</span>
              <span className="drop-shadow-lg">🎵</span>
            </div>
          </div>
        </header>

        {/* Pantalla de contraseña con el mismo estilo */}
        <main className="relative max-w-4xl mx-auto px-4 py-8 pb-20">
          <div className="text-center">
            <div className="aesthetic-card p-8 md:p-12 max-w-lg mx-auto">
              <div className="mb-8">
                <span className="text-6xl mb-4 block animate-bounce">🔒</span>
                <h2 className="text-3xl md:text-4xl font-bold text-[var(--cream)] mb-4 drop-shadow-lg">
                  Olaaaaa Kim
                </h2>
                <p className="text-lg text-[var(--cream)] opacity-75 mb-6">
                  💕🐱☕
                </p>
              </div>

              <div className="space-y-6">
                <div className="notebook-note bg-[rgba(254,247,237,0.1)] backdrop-blur-sm border border-[var(--cream)] border-opacity-30 p-6 rounded-lg">
                  <input
                    type="text"
                    placeholder="Ingresa la fecha especial..."
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && checkPassword()}
                    className="w-full text-center text-xl bg-transparent border-none outline-none text-[var(--cream)] placeholder-[var(--cream)] placeholder-opacity-60"
                    autoFocus
                  />
                </div>

                {showPasswordError && (
                  <p className="text-red-400 text-sm animate-pulse drop-shadow-lg">
                    Fecha incorrecta 💔 Inténtalo de nuevo
                  </p>
                )}

                <button
                  onClick={checkPassword}
                  className="aesthetic-card px-8 py-4 text-xl font-bold text-[var(--cream)] transition-all duration-300 hover:scale-110 shadow-lg border-2 border-[var(--cream)] border-opacity-50 hover:border-opacity-80"
                >
                  ✨ Entrar ✨
                </button>
              </div>

              <div className="mt-8 text-sm text-[var(--cream)] opacity-60">
                <p className="drop-shadow-lg">💕 ---------  💕</p>
              </div>
            </div>
          </div>
        </main>

        {/* Footer igual que el sitio principal */}
        <footer className="relative text-center py-12 mx-4 mb-4">
          <div className="aesthetic-card p-8 max-w-lg mx-auto">
            <p className="text-xl text-[var(--cream)] mb-2"></p>
            <p className="text-2xl font-bold text-[var(--cream)] mb-4">Kimberly 💕</p>
            <p className="text-lg text-[var(--cream)] opacity-75 mb-6">🐱☕🎶✨</p>
            <div className="flex justify-center space-x-3">
              <span className="text-3xl animate-bounce drop-shadow-lg">🌸</span>
              <span className="text-3xl animate-bounce drop-shadow-lg" style={{ animationDelay: '0.2s' }}>💖</span>
              <span className="text-3xl animate-bounce drop-shadow-lg" style={{ animationDelay: '0.4s' }}>🐱</span>
              <span className="text-3xl animate-bounce drop-shadow-lg" style={{ animationDelay: '0.6s' }}>☕</span>
            </div>
          </div>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-[var(--cream)] relative overflow-hidden">
      {/* Floating Coffee Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <span className="absolute top-10 left-10 text-4xl floating-heart">☕</span>
        <span className="absolute top-20 right-20 text-3xl floating-cat">🫖</span>
        <span className="absolute bottom-40 left-20 text-2xl floating-heart">🍪</span>
        <span className="absolute bottom-20 right-10 text-4xl floating-cat">🥐</span>
        <span className="absolute top-1/2 left-5 text-3xl floating-heart">🌸</span>
        <span className="absolute top-1/3 right-5 text-2xl floating-cat">💖</span>
        <span className="absolute bottom-1/3 left-1/3 text-2xl floating-heart">🐱</span>
        <span className="absolute top-3/4 right-1/4 text-3xl floating-cat">✨</span>
      </div>

      {/* Background Music Sincronizada */}
      {musicPlaylist.length > 0 && (
        <audio
          ref={audioRef}
          className="hidden"
          src={musicPlaylist[currentSongIndex]?.url}
          preload="auto"
          onLoadedData={(e) => {
            const audio = e.target as HTMLAudioElement;
            if (isPlaying) {
              audio.currentTime = currentTime;
            }
          }}
          onCanPlayThrough={() => {
            // Cuando la canción está completamente cargada y lista
            if (isPlaying && audioRef.current) {
              audioRef.current.currentTime = currentTime;
              audioRef.current.play().catch(err => console.error('Error reproduciendo:', err));
            }
          }}
          onEnded={() => {
            // Cambiar inmediatamente a la siguiente canción para reproducción continua
            const nextIndex = (currentSongIndex + 1) % musicPlaylist.length;
            setCurrentSongIndex(nextIndex);
          }}
          onTimeUpdate={(e) => {
            // Solo corregir si hay un drift muy grande (más de 60 segundos)
            // Esto permite que la música fluya naturalmente pero se corrija si hay problemas grandes
            const audio = e.target as HTMLAudioElement;
            if (isPlaying && Math.abs(audio.currentTime - currentTime) > 60) {
              audio.currentTime = currentTime;
            }
          }}
          onError={(e) => {
            console.error('Error cargando audio:', e);
            // Intentar pasar a la siguiente canción si hay error
            const nextIndex = (currentSongIndex + 1) % musicPlaylist.length;
            setCurrentSongIndex(nextIndex);
          }}
        />
      )}

      {/* Header */}
      <header className="relative text-center py-12 md:py-16 px-4 mt-8">
        <div className="aesthetic-card p-6 md:p-8 max-w-2xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold text-[var(--cream)] mb-4 md:mb-6 animate-pulse drop-shadow-lg leading-tight">
            ☕ Para Kimberly ☕
          </h1>

          <div className="flex justify-center space-x-4 md:space-x-6 text-2xl md:text-3xl">
            <span className="drop-shadow-lg">🎨</span>
            <span className="drop-shadow-lg">💌</span>
            <span className="drop-shadow-lg">📸</span>
            <span className="drop-shadow-lg">📝</span>
            <span className="drop-shadow-lg">🎵</span>
          </div>
        </div>
      </header>

      {/* Collage */}
      <main className="relative max-w-6xl mx-auto px-4 py-8 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {allContent.map((item, index) => renderContent(item, index))}
        </div>
        {allContent.length === 0 && (
          <div className="text-center py-20">
            <div className="aesthetic-card p-8 max-w-md mx-auto">
              <p className="text-2xl text-[var(--cream)] mb-4">Aún no hay recuerdos ni notas... ¡pero pronto! 💕</p>
              <div className="flex justify-center space-x-4 text-3xl">
                <span>🐱</span>
                <span>☕</span>
                <span>💖</span>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="relative text-center py-12 mx-4 mb-4">
        <div className="aesthetic-card p-8 max-w-lg mx-auto">
          <p className="text-xl text-[var(--cream)] mb-2"></p>
          <p className="text-2xl font-bold text-[var(--cream)] mb-4">Kimberly 💕</p>
          <p className="text-lg text-[var(--cream)] opacity-75 mb-6">🐱☕🎶✨</p>

          {/* Botón de mute más visible */}
          <div className="mb-6">
            <button
              onClick={isPlaying ? stopMusic : startMusic}
              className="aesthetic-card px-8 py-4 text-2xl font-bold transition-all duration-300 hover:scale-110 shadow-lg border-2 border-[var(--cream)] border-opacity-50"
              title={isPlaying ? 'Pausar música' : 'Reanudar música'}
            >
              {isPlaying ? '🔇 Pausar Música' : '🎵 Reanudar Música'}
            </button>
          </div>

          <div className="flex justify-center space-x-3">
            <span className="text-3xl animate-bounce drop-shadow-lg">🌸</span>
            <span className="text-3xl animate-bounce drop-shadow-lg" style={{ animationDelay: '0.2s' }}>💖</span>
            <span className="text-3xl animate-bounce drop-shadow-lg" style={{ animationDelay: '0.4s' }}>🐱</span>
            <span className="text-3xl animate-bounce drop-shadow-lg" style={{ animationDelay: '0.6s' }}>☕</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
