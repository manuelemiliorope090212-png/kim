'use client';

import { useEffect, useState, useRef } from 'react';
import { useMusic } from '../components/MusicContext';

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
  const { 
    musicFiles, 
    setCurrentSongIndex, 
    setCurrentTime, 
    setIsPlaying, 
    isPlaying,
    currentTime,
    currentSongIndex,
    audioRef 
  } = useMusic();
  const [memories, setMemories] = useState<Memory[]>([]);
  const [manuelNotes, setManuelNotes] = useState<ManuelNote[]>([]);
  const [allContent, setAllContent] = useState<ContentItem[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [showPasswordError, setShowPasswordError] = useState(false);


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
  }, []);

  // Combine memories and manuel notes when either changes
  useEffect(() => {
    const combined = [
      ...memories.map(memory => ({ ...memory, source: 'memory' as const })),
      ...manuelNotes.map(note => ({ ...note, source: 'manuel' as const }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    setAllContent(combined);
  }, [memories, manuelNotes]);



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
      // Iniciar música automáticamente al autenticar (interacción del usuario)
      if (audioRef.current) {
        audioRef.current.play().then(() => {
          setIsPlaying(true);
        }).catch(err => console.error('Error al iniciar música:', err));
      }
    } else {
      setShowPasswordError(true);
      setTimeout(() => setShowPasswordError(false), 3000);
    }
  };

  // Función para detener música
  const stopMusic = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  // Función para iniciar música manualmente
  const startMusic = async () => {
    if (audioRef.current) {
      try {
        await audioRef.current.play();
        setIsPlaying(true);
      } catch (err) {
        console.error('Error manual play:', err);
      }
    }
  };



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
          <div className="rounded-xl overflow-hidden mb-4">
            <img
              src={isManuelNote ? (item as ManuelNote).imageUrl! : (item as Memory).content}
              alt={item.title}
              className="w-full max-h-[500px] md:max-h-72 object-contain md:object-cover"
            />
          </div>
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
          {/* Emojis de café flotantes */}
          <span className="absolute top-[5%] left-[5%] text-4xl floating-heart">☕</span>
          <span className="absolute top-[5%] right-[5%] text-3xl floating-cat">☕</span>
          <span className="absolute top-[15%] left-[15%] text-2xl floating-heart">☕</span>
          <span className="absolute top-[15%] right-[15%] text-4xl floating-cat">☕</span>
          <span className="absolute top-[25%] left-[25%] text-3xl floating-heart">☕</span>
          <span className="absolute top-[25%] right-[25%] text-2xl floating-cat">☕</span>
          <span className="absolute top-[35%] left-[35%] text-4xl floating-heart">☕</span>
          <span className="absolute top-[35%] right-[35%] text-3xl floating-cat">☕</span>
          <span className="absolute top-[45%] left-[45%] text-2xl floating-heart">☕</span>
          <span className="absolute top-[45%] right-[45%] text-4xl floating-cat">☕</span>
          <span className="absolute top-[55%] left-[55%] text-3xl floating-heart">☕</span>
          <span className="absolute top-[55%] right-[55%] text-2xl floating-cat">☕</span>
          <span className="absolute top-[65%] left-[65%] text-4xl floating-heart">☕</span>
          <span className="absolute top-[65%] right-[65%] text-3xl floating-cat">☕</span>
          <span className="absolute top-[75%] left-[75%] text-2xl floating-heart">☕</span>
          <span className="absolute top-[75%] right-[75%] text-4xl floating-cat">☕</span>
          <span className="absolute top-[85%] left-[85%] text-3xl floating-heart">☕</span>
          <span className="absolute top-[85%] right-[85%] text-2xl floating-cat">☕</span>
          <span className="absolute top-[95%] left-[95%] text-4xl floating-heart">☕</span>
          <span className="absolute top-[95%] right-[95%] text-3xl floating-cat">☕</span>

          {/* Imágenes de bigmix.png como emojis flotantes - distribuidas en zigzag */}
          <img src="/bigmix.png" alt="bigmix" className="absolute top-[5%] left-[5%] w-16 h-16 floating-heart opacity-60" />
          <img src="/bigmix.png" alt="bigmix" className="absolute top-[15%] left-[45%] w-14 h-14 floating-cat opacity-50" />
          <img src="/bigmix.png" alt="bigmix" className="absolute top-[25%] left-[85%] w-18 h-18 floating-heart opacity-70" />
          <img src="/bigmix.png" alt="bigmix" className="absolute top-[35%] left-[5%] w-15 h-15 floating-cat opacity-55" />
          <img src="/bigmix.png" alt="bigmix" className="absolute top-[45%] left-[45%] w-17 h-17 floating-heart opacity-65" />
          <img src="/bigmix.png" alt="bigmix" className="absolute top-[55%] left-[85%] w-14 h-14 floating-cat opacity-45" />
          <img src="/bigmix.png" alt="bigmix" className="absolute top-[65%] left-[5%] w-16 h-16 floating-heart opacity-60" />
          <img src="/bigmix.png" alt="bigmix" className="absolute top-[75%] left-[45%] w-18 h-18 floating-cat opacity-50" />
          <img src="/bigmix.png" alt="bigmix" className="absolute top-[85%] left-[85%] w-15 h-15 floating-heart opacity-70" />
          <img src="/bigmix.png" alt="bigmix" className="absolute top-[95%] left-[5%] w-17 h-17 floating-cat opacity-40" />
          <img src="/bigmix.png" alt="bigmix" className="absolute top-[10%] left-[25%] w-14 h-14 floating-heart opacity-55" />
          <img src="/bigmix.png" alt="bigmix" className="absolute top-[20%] left-[65%] w-16 h-16 floating-cat opacity-65" />
          <img src="/bigmix.png" alt="bigmix" className="absolute top-[30%] left-[25%] w-18 h-18 floating-heart opacity-45" />
          <img src="/bigmix.png" alt="bigmix" className="absolute top-[40%] left-[65%] w-15 h-15 floating-cat opacity-60" />
          <img src="/bigmix.png" alt="bigmix" className="absolute top-[50%] left-[25%] w-17 h-17 floating-heart opacity-50" />
        </div>

        {/* Header igual que el sitio principal */}
        <header className="relative text-center py-12 md:py-16 px-4 mt-8">
          <div className="aesthetic-card p-6 md:p-8 max-w-2xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold text-[var(--cream)] mb-4 md:mb-6 animate-pulse drop-shadow-lg leading-tight">
              ☕࣪ ˖⟡˚Kiiiiim˚⟡˖࣪ ☕
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
                ⋆.𐙚˚₍ᐢ. .ᐢ₎ ₊˚⊹♡TQM⊹˚✧ִ ࣪₍^. .^₎Ⳋ𖤐°.ᐟ
                </h2>
                <p className="text-lg text-[var(--cream)] opacity-75 mb-6">
                  💕🐱☕
                </p>
              </div>

              <div className="space-y-6">
                <div className="notebook-note bg-[rgba(254,247,237,0.1)] backdrop-blur-sm border border-[var(--cream)] border-opacity-30 p-6 rounded-lg">
                  <input
                    type="text"
                    placeholder="¿Cuándo empezamos a hablar?"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && checkPassword()}
                    className="w-full text-center text-base md:text-xl bg-transparent border-none outline-none text-[var(--cream)] placeholder-[var(--cream)] placeholder-opacity-60"
                    autoFocus
                  />
                </div>

                {showPasswordError && (
                  <p className="text-red-400 text-sm animate-pulse drop-shadow-lg">
                    Fecha incorrecta 💔 maaaaaaaaaaaaaaaal
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
                <p className="drop-shadow-lg">💕 pista: 27 de octubre de 2025 💕</p>
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
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Coffee PNG Images with DVD-like bouncing animation - distributed across screen */}
        <img src="/coffee.png?v=1" alt="coffee" className="absolute w-12 h-12 bouncing-coffee-1 opacity-60" />
        <img src="/coffee.png?v=1" alt="coffee" className="absolute w-10 h-10 bouncing-coffee-2 opacity-50" />
        <img src="/coffee.png?v=1" alt="coffee" className="absolute w-14 h-14 bouncing-coffee-3 opacity-70" />
        <img src="/coffee.png?v=1" alt="coffee" className="absolute w-11 h-11 bouncing-coffee-4 opacity-55" />
        <img src="/coffee.png?v=1" alt="coffee" className="absolute w-9 h-9 bouncing-coffee-5 opacity-65" />
        <img src="/coffee.png?v=1" alt="coffee" className="absolute w-13 h-13 bouncing-coffee-6 opacity-45" />
        <img src="/coffee.png?v=1" alt="coffee" className="absolute w-10 h-10 bouncing-coffee-7 opacity-60" />
        <img src="/coffee.png?v=1" alt="coffee" className="absolute w-12 h-12 bouncing-coffee-8 opacity-50" />
        <img src="/coffee.png?v=1" alt="coffee" className="absolute w-8 h-8 bouncing-coffee-9 opacity-70" />
        <img src="/coffee.png?v=1" alt="coffee" className="absolute w-15 h-15 bouncing-coffee-10 opacity-40" />

        {/* Extra coffee images for mobile - distributed left and right */}
        <img src="/coffee.png?v=1" alt="coffee" className="absolute w-11 h-11 bouncing-coffee-11 opacity-55 md:hidden" />
        <img src="/coffee.png?v=1" alt="coffee" className="absolute w-9 h-9 bouncing-coffee-12 opacity-65 md:hidden" />
        <img src="/coffee.png?v=1" alt="coffee" className="absolute w-13 h-13 bouncing-coffee-13 opacity-45 md:hidden" />
        <img src="/coffee.png?v=1" alt="coffee" className="absolute w-10 h-10 bouncing-coffee-14 opacity-60 md:hidden" />
        <img src="/coffee.png?v=1" alt="coffee" className="absolute w-12 h-12 bouncing-coffee-15 opacity-50 md:hidden" />

        {/* Many more coffee images - distributed across entire screen */}

        {/* Even more coffee images */}
        <img src="/coffee.png?v=1" alt="coffee" className="absolute w-9 h-9 bouncing-coffee-61 opacity-20" />
        <img src="/coffee.png?v=1" alt="coffee" className="absolute w-12 h-12 bouncing-coffee-62 opacity-15" />
        <img src="/coffee.png?v=1" alt="coffee" className="absolute w-7 h-7 bouncing-coffee-63 opacity-25" />
        <img src="/coffee.png?v=1" alt="coffee" className="absolute w-11 h-11 bouncing-coffee-64 opacity-30" />
        <img src="/coffee.png?v=1" alt="coffee" className="absolute w-8 h-8 bouncing-coffee-65 opacity-35" />
        <img src="/coffee.png?v=1" alt="coffee" className="absolute w-10 h-10 bouncing-coffee-66 opacity-20" />
        <img src="/coffee.png?v=1" alt="coffee" className="absolute w-6 h-6 bouncing-coffee-67 opacity-40" />
        <img src="/coffee.png?v=1" alt="coffee" className="absolute w-9 h-9 bouncing-coffee-68 opacity-25" />
        <img src="/coffee.png?v=1" alt="coffee" className="absolute w-12 h-12 bouncing-coffee-69 opacity-15" />
        <img src="/coffee.png?v=1" alt="coffee" className="absolute w-7 h-7 bouncing-coffee-70 opacity-30" />
        <img src="/coffee.png?v=1" alt="coffee" className="absolute w-11 h-11 bouncing-coffee-71 opacity-35" />
        <img src="/coffee.png?v=1" alt="coffee" className="absolute w-8 h-8 bouncing-coffee-72 opacity-20" />
        <img src="/coffee.png?v=1" alt="coffee" className="absolute w-10 h-10 bouncing-coffee-73 opacity-25" />
        <img src="/coffee.png?v=1" alt="coffee" className="absolute w-6 h-6 bouncing-coffee-74 opacity-40" />
        <img src="/coffee.png?v=1" alt="coffee" className="absolute w-9 h-9 bouncing-coffee-75 opacity-30" />
        <img src="/coffee.png?v=1" alt="coffee" className="absolute w-12 h-12 bouncing-coffee-76 opacity-15" />
        <img src="/coffee.png?v=1" alt="coffee" className="absolute w-7 h-7 bouncing-coffee-77 opacity-35" />
        <img src="/coffee.png?v=1" alt="coffee" className="absolute w-11 h-11 bouncing-coffee-78 opacity-20" />
        <img src="/coffee.png?v=1" alt="coffee" className="absolute w-8 h-8 bouncing-coffee-79 opacity-25" />
        <img src="/coffee.png?v=1" alt="coffee" className="absolute w-10 h-10 bouncing-coffee-80 opacity-40" />
        <img src="/coffee.png?v=1" alt="coffee" className="absolute w-6 h-6 bouncing-coffee-81 opacity-30" />
        <img src="/coffee.png?v=1" alt="coffee" className="absolute w-9 h-9 bouncing-coffee-82 opacity-35" />
        <img src="/coffee.png?v=1" alt="coffee" className="absolute w-12 h-12 bouncing-coffee-83 opacity-20" />
        <img src="/coffee.png?v=1" alt="coffee" className="absolute w-7 h-7 bouncing-coffee-84 opacity-25" />
        <img src="/coffee.png?v=1" alt="coffee" className="absolute w-11 h-11 bouncing-coffee-85 opacity-40" />
        <img src="/coffee.png?v=1" alt="coffee" className="absolute w-8 h-8 bouncing-coffee-86 opacity-30" />
        <img src="/coffee.png?v=1" alt="coffee" className="absolute w-10 h-10 bouncing-coffee-87 opacity-35" />
        <img src="/coffee.png?v=1" alt="coffee" className="absolute w-6 h-6 bouncing-coffee-88 opacity-20" />
        <img src="/coffee.png?v=1" alt="coffee" className="absolute w-9 h-9 bouncing-coffee-89 opacity-25" />
        <img src="/coffee.png?v=1" alt="coffee" className="absolute w-12 h-12 bouncing-coffee-90 opacity-40" />
        <img src="/coffee.png?v=1" alt="coffee" className="absolute w-7 h-7 bouncing-coffee-91 opacity-30" />
        <img src="/coffee.png?v=1" alt="coffee" className="absolute w-11 h-11 bouncing-coffee-92 opacity-35" />
        <img src="/coffee.png?v=1" alt="coffee" className="absolute w-8 h-8 bouncing-coffee-93 opacity-20" />
        <img src="/coffee.png?v=1" alt="coffee" className="absolute w-10 h-10 bouncing-coffee-94 opacity-25" />
        <img src="/coffee.png?v=1" alt="coffee" className="absolute w-6 h-6 bouncing-coffee-95 opacity-40" />
        <img src="/coffee.png?v=1" alt="coffee" className="absolute w-9 h-9 bouncing-coffee-96 opacity-30" />
        <img src="/coffee.png?v=1" alt="coffee" className="absolute w-12 h-12 bouncing-coffee-97 opacity-35" />
        <img src="/coffee.png?v=1" alt="coffee" className="absolute w-7 h-7 bouncing-coffee-98 opacity-20" />
        <img src="/coffee.png?v=1" alt="coffee" className="absolute w-11 h-11 bouncing-coffee-99 opacity-25" />
        <img src="/coffee.png?v=1" alt="coffee" className="absolute w-8 h-8 bouncing-coffee-100 opacity-40" />
        <img src="/coffee.png?v=1" alt="coffee" className="absolute w-10 h-10 bouncing-coffee-101 opacity-30" />
        <img src="/coffee.png?v=1" alt="coffee" className="absolute w-6 h-6 bouncing-coffee-102 opacity-35" />
        <img src="/coffee.png?v=1" alt="coffee" className="absolute w-9 h-9 bouncing-coffee-103 opacity-20" />
        <img src="/coffee.png?v=1" alt="coffee" className="absolute w-12 h-12 bouncing-coffee-104 opacity-25" />
        <img src="/coffee.png?v=1" alt="coffee" className="absolute w-7 h-7 bouncing-coffee-105 opacity-40" />
        <img src="/coffee.png?v=1" alt="coffee" className="absolute w-11 h-11 bouncing-coffee-106 opacity-30" />
        <img src="/coffee.png?v=1" alt="coffee" className="absolute w-8 h-8 bouncing-coffee-107 opacity-35" />
        <img src="/coffee.png?v=1" alt="coffee" className="absolute w-10 h-10 bouncing-coffee-108 opacity-20" />
        <img src="/coffee.png?v=1" alt="coffee" className="absolute w-6 h-6 bouncing-coffee-109 opacity-25" />
        <img src="/coffee.png?v=1" alt="coffee" className="absolute w-9 h-9 bouncing-coffee-110 opacity-40" />
        <img src="/coffee.png?v=1" alt="coffee" className="absolute w-12 h-12 bouncing-coffee-111 opacity-30" />
        <img src="/coffee.png?v=1" alt="coffee" className="absolute w-7 h-7 bouncing-coffee-112 opacity-35" />
        <img src="/coffee.png?v=1" alt="coffee" className="absolute w-11 h-11 bouncing-coffee-113 opacity-20" />
        <img src="/coffee.png?v=1" alt="coffee" className="absolute w-8 h-8 bouncing-coffee-114 opacity-25" />
        <img src="/coffee.png?v=1" alt="coffee" className="absolute w-10 h-10 bouncing-coffee-115 opacity-40" />
        <img src="/coffee.png?v=1" alt="coffee" className="absolute w-6 h-6 bouncing-coffee-116 opacity-30" />
        <img src="/coffee.png?v=1" alt="coffee" className="absolute w-9 h-9 bouncing-coffee-117 opacity-35" />
        <img src="/coffee.png?v=1" alt="coffee" className="absolute w-12 h-12 bouncing-coffee-118 opacity-20" />
        <img src="/coffee.png?v=1" alt="coffee" className="absolute w-7 h-7 bouncing-coffee-119 opacity-25" />
        <img src="/coffee.png?v=1" alt="coffee" className="absolute w-11 h-11 bouncing-coffee-120 opacity-40" />
        <img src="/coffee.png?v=1" alt="coffee" className="absolute w-8 h-8 bouncing-coffee-121 opacity-30" />
        <img src="/coffee.png?v=1" alt="coffee" className="absolute w-10 h-10 bouncing-coffee-122 opacity-35" />
        <img src="/coffee.png?v=1" alt="coffee" className="absolute w-6 h-6 bouncing-coffee-123 opacity-20" />
        <img src="/coffee.png?v=1" alt="coffee" className="absolute w-9 h-9 bouncing-coffee-124 opacity-25" />
        <img src="/coffee.png?v=1" alt="coffee" className="absolute w-12 h-12 bouncing-coffee-125 opacity-40" />
        <img src="/coffee.png?v=1" alt="coffee" className="absolute w-7 h-7 bouncing-coffee-126 opacity-30" />
        <img src="/coffee.png?v=1" alt="coffee" className="absolute w-11 h-11 bouncing-coffee-127 opacity-35" />
        <img src="/coffee.png?v=1" alt="coffee" className="absolute w-8 h-8 bouncing-coffee-128 opacity-20" />
        <img src="/coffee.png?v=1" alt="coffee" className="absolute w-10 h-10 bouncing-coffee-129 opacity-25" />
        <img src="/coffee.png?v=1" alt="coffee" className="absolute w-6 h-6 bouncing-coffee-130 opacity-40" />
        <img src="/coffee.png?v=1" alt="coffee" className="absolute w-9 h-9 bouncing-coffee-131 opacity-30" />
        <img src="/coffee.png?v=1" alt="coffee" className="absolute w-12 h-12 bouncing-coffee-132 opacity-35" />
        <img src="/coffee.png?v=1" alt="coffee" className="absolute w-7 h-7 bouncing-coffee-133 opacity-20" />
        <img src="/coffee.png?v=1" alt="coffee" className="absolute w-11 h-11 bouncing-coffee-134 opacity-25" />
        <img src="/coffee.png?v=1" alt="coffee" className="absolute w-8 h-8 bouncing-coffee-135 opacity-40" />
        <img src="/coffee.png?v=1" alt="coffee" className="absolute w-10 h-10 bouncing-coffee-136 opacity-30" />
        <img src="/coffee.png?v=1" alt="coffee" className="absolute w-6 h-6 bouncing-coffee-137 opacity-35" />
        <img src="/coffee.png?v=1" alt="coffee" className="absolute w-9 h-9 bouncing-coffee-138 opacity-20" />
        <img src="/coffee.png?v=1" alt="coffee" className="absolute w-12 h-12 bouncing-coffee-139 opacity-25" />
        <img src="/coffee.png?v=1" alt="coffee" className="absolute w-7 h-7 bouncing-coffee-140 opacity-40" />
        <img src="/coffee.png?v=1" alt="coffee" className="absolute w-11 h-11 bouncing-coffee-141 opacity-30" />
        <img src="/coffee.png?v=1" alt="coffee" className="absolute w-8 h-8 bouncing-coffee-142 opacity-35" />
        <img src="/coffee.png?v=1" alt="coffee" className="absolute w-10 h-10 bouncing-coffee-143 opacity-20" />
        <img src="/coffee.png?v=1" alt="coffee" className="absolute w-6 h-6 bouncing-coffee-144 opacity-25" />
        <img src="/coffee.png?v=1" alt="coffee" className="absolute w-9 h-9 bouncing-coffee-145 opacity-40" />
        <img src="/coffee.png?v=1" alt="coffee" className="absolute w-12 h-12 bouncing-coffee-146 opacity-30" />
        <img src="/coffee.png?v=1" alt="coffee" className="absolute w-7 h-7 bouncing-coffee-147 opacity-35" />
        <img src="/coffee.png?v=1" alt="coffee" className="absolute w-11 h-11 bouncing-coffee-148 opacity-20" />
        <img src="/coffee.png?v=1" alt="coffee" className="absolute w-8 h-8 bouncing-coffee-149 opacity-25" />
        <img src="/coffee.png?v=1" alt="coffee" className="absolute w-10 h-10 bouncing-coffee-150 opacity-40" />

        {/* Additional emoji elements */}
        <span className="absolute top-16 left-16 text-4xl floating-heart">🍪</span>
        <span className="absolute top-32 right-32 text-3xl floating-cat">🥐</span>
        <span className="absolute bottom-52 left-32 text-2xl floating-heart">🌸</span>
        <span className="absolute bottom-32 right-16 text-4xl floating-cat">💖</span>
        <span className="absolute top-1/2 left-8 text-3xl floating-heart">🐱</span>
        <span className="absolute top-1/3 right-8 text-2xl floating-cat">✨</span>
        <span className="absolute bottom-1/3 left-1/3 text-2xl floating-heart">🍰</span>
        <span className="absolute top-3/4 right-1/4 text-3xl floating-cat">🧁</span>

        {/* Imágenes flotantes de tuli_azul - 20 imágenes moviéndose por toda la pantalla */}
        <img src="/tuli_azul.png" alt="tuli azul" className="absolute w-12 h-12 bouncing-tulip-1 opacity-70" />
        <img src="/tuli_azul.png" alt="tuli azul" className="absolute w-12 h-12 bouncing-tulip-2 opacity-60" />
        <img src="/tuli_azul.png" alt="tuli azul" className="absolute w-12 h-12 bouncing-tulip-3 opacity-65" />
        <img src="/tuli_azul.png" alt="tuli azul" className="absolute w-12 h-12 bouncing-tulip-4 opacity-70" />
        <img src="/tuli_azul.png" alt="tuli azul" className="absolute w-12 h-12 bouncing-tulip-5 opacity-60" />
        <img src="/tuli_azul.png" alt="tuli azul" className="absolute w-12 h-12 bouncing-tulip-6 opacity-65" />
        <img src="/tuli_azul.png" alt="tuli azul" className="absolute w-12 h-12 bouncing-tulip-7 opacity-70" />
        <img src="/tuli_azul.png" alt="tuli azul" className="absolute w-12 h-12 bouncing-tulip-8 opacity-60" />
        <img src="/tuli_azul.png" alt="tuli azul" className="absolute w-12 h-12 bouncing-tulip-9 opacity-70" />
        <img src="/tuli_azul.png" alt="tuli azul" className="absolute w-12 h-12 bouncing-tulip-10 opacity-60" />
        <img src="/tuli_azul.png" alt="tuli azul" className="absolute w-12 h-12 bouncing-tulip-11 opacity-65" />
        <img src="/tuli_azul.png" alt="tuli azul" className="absolute w-12 h-12 bouncing-tulip-12 opacity-70" />
        <img src="/tuli_azul.png" alt="tuli azul" className="absolute w-12 h-12 bouncing-tulip-13 opacity-60" />
        <img src="/tuli_azul.png" alt="tuli azul" className="absolute w-12 h-12 bouncing-tulip-14 opacity-65" />
        <img src="/tuli_azul.png" alt="tuli azul" className="absolute w-12 h-12 bouncing-tulip-15 opacity-70" />
        <img src="/tuli_azul.png" alt="tuli azul" className="absolute w-12 h-12 bouncing-tulip-16 opacity-60" />
        <img src="/tuli_azul.png" alt="tuli azul" className="absolute w-12 h-12 bouncing-tulip-17 opacity-65" />
        <img src="/tuli_azul.png" alt="tuli azul" className="absolute w-12 h-12 bouncing-tulip-18 opacity-70" />
        <img src="/tuli_azul.png" alt="tuli azul" className="absolute w-12 h-12 bouncing-tulip-19 opacity-60" />
        <img src="/tuli_azul.png" alt="tuli azul" className="absolute w-12 h-12 bouncing-tulip-20 opacity-65" />

        {/* Imágenes flotantes de volley3 con rotación - 20 imágenes moviéndose por toda la pantalla */}
        <img src="/volley3.png" alt="volley" className="absolute w-12 h-12 object-contain bouncing-volley-1 opacity-70 animate-spin" />
        <img src="/volley3.png" alt="volley" className="absolute w-12 h-12 object-contain bouncing-volley-2 opacity-60 animate-spin" />
        <img src="/volley3.png" alt="volley" className="absolute w-12 h-12 object-contain bouncing-volley-3 opacity-65 animate-spin" />
        <img src="/volley3.png" alt="volley" className="absolute w-12 h-12 object-contain bouncing-volley-4 opacity-70 animate-spin" />
        <img src="/volley3.png" alt="volley" className="absolute w-12 h-12 object-contain bouncing-volley-5 opacity-60 animate-spin" />
        <img src="/volley3.png" alt="volley" className="absolute w-12 h-12 object-contain bouncing-volley-6 opacity-65 animate-spin" />
        <img src="/volley3.png" alt="volley" className="absolute w-12 h-12 object-contain bouncing-volley-7 opacity-70 animate-spin" />
        <img src="/volley3.png" alt="volley" className="absolute w-12 h-12 object-contain bouncing-volley-8 opacity-60 animate-spin" />
        <img src="/volley3.png" alt="volley" className="absolute w-12 h-12 object-contain bouncing-volley-9 opacity-65 animate-spin" />
        <img src="/volley3.png" alt="volley" className="absolute w-12 h-12 object-contain bouncing-volley-10 opacity-70 animate-spin" />
        <img src="/volley3.png" alt="volley" className="absolute w-12 h-12 object-contain bouncing-volley-11 opacity-60 animate-spin" />
        <img src="/volley3.png" alt="volley" className="absolute w-12 h-12 object-contain bouncing-volley-12 opacity-65 animate-spin" />
        <img src="/volley3.png" alt="volley" className="absolute w-12 h-12 object-contain bouncing-volley-13 opacity-70 animate-spin" />
        <img src="/volley3.png" alt="volley" className="absolute w-12 h-12 object-contain bouncing-volley-14 opacity-60 animate-spin" />
        <img src="/volley3.png" alt="volley" className="absolute w-12 h-12 object-contain bouncing-volley-15 opacity-65 animate-spin" />
        <img src="/volley3.png" alt="volley" className="absolute w-12 h-12 object-contain bouncing-volley-16 opacity-70 animate-spin" />
        <img src="/volley3.png" alt="volley" className="absolute w-12 h-12 object-contain bouncing-volley-17 opacity-60 animate-spin" />
        <img src="/volley3.png" alt="volley" className="absolute w-12 h-12 object-contain bouncing-volley-18 opacity-65 animate-spin" />
        <img src="/volley3.png" alt="volley" className="absolute w-12 h-12 object-contain bouncing-volley-19 opacity-70 animate-spin" />
        <img src="/volley3.png" alt="volley" className="absolute w-12 h-12 object-contain bouncing-volley-20 opacity-60 animate-spin" />
      </div>



      {/* Header */}
      <header className="relative text-center py-12 md:py-16 px-4 mt-8">
        <div className="aesthetic-card p-6 md:p-8 max-w-2xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold text-[var(--cream)] mb-4 md:mb-6 animate-pulse drop-shadow-lg leading-tight">
            ☕࣪ ˖⟡˚Kiiiiim me gustas mucho˚⟡˖࣪ ☕
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
