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

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/memories`)
      .then(res => res.json())
      .then(data => setMemories(data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div className="min-h-screen bg-amber-50 text-amber-900">
      {/* Background Music */}
      <audio autoPlay loop className="hidden">
        <source src="https://example.com/humbe-song.mp3" type="audio/mpeg" />
        {/* Replace with actual Humbe/Latin Mafia song URL */}
      </audio>

      {/* Header */}
      <header className="text-center py-8 bg-amber-100 rounded-b-3xl shadow-lg">
        <h1 className="text-4xl font-bold text-amber-800">💖 Memories for Kimberly 💖</h1>
        <p className="text-lg mt-2">A collage of love and creativity 🐱☕</p>
      </header>

      {/* Collage */}
      <main className="max-w-4xl mx-auto p-4 space-y-8">
        {memories.map((memory) => (
          <div key={memory._id} className="bg-white rounded-2xl shadow-lg p-6 border-4 border-amber-200">
            <h2 className="text-2xl font-semibold text-amber-800 mb-2">{memory.title}</h2>
            <p className="text-sm text-amber-600 mb-4">📅 {new Date(memory.date).toLocaleDateString()}</p>
            {memory.type === 'photo' || memory.type === 'drawing' ? (
              <img src={memory.content} alt={memory.title} className="w-full rounded-xl" />
            ) : (
              <div className="bg-amber-50 p-4 rounded-xl text-amber-900 whitespace-pre-wrap">
                {memory.content}
              </div>
            )}
            <div className="mt-4 text-right">
              {memory.type === 'drawing' && '🎨'}
              {memory.type === 'letter' && '💌'}
              {memory.type === 'photo' && '📸'}
              {memory.type === 'note' && '📝'}
            </div>
          </div>
        ))}
        {memories.length === 0 && (
          <div className="text-center py-16">
            <p className="text-xl text-amber-700">No memories yet... but soon! 💕</p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="text-center py-8 bg-amber-100 rounded-t-3xl mt-8">
        <p className="text-amber-800">Made with ❤️ for you, Kimberly</p>
        <p className="text-sm mt-2">🐱☕🎶</p>
      </footer>
    </div>
  );
}
