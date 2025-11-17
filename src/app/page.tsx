'use client';

import { useEffect, useState } from 'react';

interface Memory {
  _id: string;
  type: 'drawing' | 'letter' | 'photo' | 'note';
  title: string;
  content: string;
  date: string;
}

export default function Home() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [musicPlaylist, setMusicPlaylist] = useState<any[]>([]);

  useEffect(() => {
    // Fetch memories
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/memories`)
      .then(res => res.json())
      .then(data => setMemories(data))
      .catch(err => console.error(err));

    // Fetch music playlist
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/manuel/music`)
      .then(res => res.json())
      .then(data => setMusicPlaylist(data.sort((a: any, b: any) => a.order - b.order)))
      .catch(err => console.error('Error fetching music playlist:', err));
  }, []);

  const getRandomRotation = () => Math.random() * 6 - 3; // -3 to 3 degrees
  const getRandomSize = () => Math.random() > 0.5 ? 'w-full' : 'w-3/4 mx-auto';

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#fef7ed] via-[#fce7f3] to-[#fef7ed] text-[var(--foreground)] relative overflow-hidden">
      {/* Floating Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <span className="absolute top-10 left-10 text-4xl floating-heart">💖</span>
        <span className="absolute top-20 right-20 text-3xl floating-cat">🐱</span>
        <span className="absolute bottom-40 left-20 text-2xl floating-heart">☕</span>
        <span className="absolute bottom-20 right-10 text-4xl floating-cat">💕</span>
        <span className="absolute top-1/2 left-5 text-3xl floating-heart">🌸</span>
        <span className="absolute top-1/3 right-5 text-2xl floating-cat">🍪</span>
      </div>

      {/* Background Music Playlist */}
      {musicPlaylist.length > 0 && (
        <audio autoPlay loop className="hidden">
          {musicPlaylist.map((music) => (
            <source key={music._id} src={music.url} type="audio/mpeg" />
          ))}
        </audio>
      )}

      {/* Header */}
      <header className="relative text-center py-12 bg-gradient-to-r from-[var(--pastel-pink)] to-[var(--soft-pink)] rounded-b-3xl shadow-lg mx-4 mt-4">
        <h1 className="text-5xl font-bold text-[var(--coffee-brown)] mb-4 animate-pulse">
          💖 Para Kimberly 💖
        </h1>
        <p className="text-xl text-[var(--coffee-brown)]">☕</p>
        <div className="mt-4 flex justify-center space-x-4">
          <span className="text-2xl">🎨</span>
          <span className="text-2xl">💌</span>
          <span className="text-2xl">📸</span>
          <span className="text-2xl">📝</span>
        </div>
      </header>

      {/* Collage */}
      <main className="relative max-w-6xl mx-auto p-4 pb-20">
        <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
          {memories.map((memory, index) => (
            <div
              key={memory._id}
              className={`kawaii-card bg-white p-6 break-inside-avoid mb-6 ${getRandomSize()}`}
              style={{
                transform: `rotate(${getRandomRotation()}deg)`,
                animationDelay: `${index * 0.1}s`
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xl font-semibold text-[var(--coffee-brown)]">{memory.title}</h2>
                <span className="text-lg">
                  {memory.type === 'drawing' && '🎨'}
                  {memory.type === 'letter' && '💌'}
                  {memory.type === 'photo' && '📸'}
                  {memory.type === 'note' && '📝'}
                </span>
              </div>
              <p className="text-sm text-[var(--coffee-brown)] opacity-75 mb-4">
                📅 {new Date(memory.date).toLocaleDateString()}
              </p>
              {memory.type === 'photo' || memory.type === 'drawing' ? (
                <img
                  src={memory.content}
                  alt={memory.title}
                  className="w-full rounded-xl mb-4"
                  style={{ maxHeight: '300px', objectFit: 'cover' }}
                />
              ) : (
                <div className="notebook-note bg-white border-2 border-[var(--coffee-brown)] p-6 rounded-lg shadow-lg text-[var(--coffee-brown)] whitespace-pre-wrap text-sm leading-relaxed relative">
                  {/* Líneas de cuaderno */}
                  <div className="absolute inset-0 pointer-events-none opacity-20">
                    {[...Array(10)].map((_, i) => (
                      <div
                        key={i}
                        className="absolute w-full border-b border-[var(--coffee-brown)]"
                        style={{ top: `${(i + 1) * 2}rem` }}
                      />
                    ))}
                  </div>
                  {/* Agujeros del cuaderno */}
                  <div className="absolute left-0 top-4 bottom-4 flex flex-col justify-around">
                    <div className="w-3 h-3 bg-[var(--coffee-brown)] rounded-full opacity-60"></div>
                    <div className="w-3 h-3 bg-[var(--coffee-brown)] rounded-full opacity-60"></div>
                    <div className="w-3 h-3 bg-[var(--coffee-brown)] rounded-full opacity-60"></div>
                  </div>
                  <div className="pl-6">
                    {memory.content}
                  </div>
                </div>
              )}
              <div className="mt-4 flex justify-end space-x-2">
                <span className="text-lg">💕</span>
                <span className="text-lg">🐱</span>
                <span className="text-lg">☕</span>
              </div>
            </div>
          ))}
        </div>
        {memories.length === 0 && (
          <div className="text-center py-20">
            <div className="kawaii-card bg-white p-8 max-w-md mx-auto">
              <p className="text-2xl text-[var(--coffee-brown)] mb-4">Aún no hay recuerdos... ¡pero pronto! 💕</p>
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
      <footer className="relative text-center py-12 bg-gradient-to-r from-[var(--soft-pink)] to-[var(--pastel-pink)] rounded-t-3xl mx-4 mb-4 shadow-lg">
        <p className="text-xl text-[var(--coffee-brown)] mb-2">Hecho con amor infinito ❤️ para ti, Kimberly</p>
        <p className="text-lg text-[var(--coffee-brown)] opacity-75">🐱☕🎶💕</p>
        <div className="mt-4 flex justify-center space-x-2">
          <span className="text-2xl animate-bounce">🌸</span>
          <span className="text-2xl animate-bounce" style={{ animationDelay: '0.2s' }}>💖</span>
          <span className="text-2xl animate-bounce" style={{ animationDelay: '0.4s' }}>🐱</span>
        </div>
      </footer>
    </div>
  );
}
