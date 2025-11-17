'use client';

import { useState, useEffect } from 'react';

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
  isActive: boolean;
}

export default function Manuel() {
  const [password, setPassword] = useState('');
  const [loggedIn, setLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState<'notes' | 'music'>('notes');

  // Notes state
  const [notes, setNotes] = useState<ManuelNote[]>([]);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteImage, setNoteImage] = useState<File | null>(null);

  // Music state
  const [musicFiles, setMusicFiles] = useState<MusicFile[]>([]);
  const [selectedMusic, setSelectedMusic] = useState<File | null>(null);
  const [activeMusic, setActiveMusic] = useState<MusicFile | null>(null);

  const [message, setMessage] = useState('');

  useEffect(() => {
    if (loggedIn) {
      fetchNotes();
      fetchMusicFiles();
      fetchActiveMusic();
    }
  }, [loggedIn]);

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

  const fetchActiveMusic = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/manuel/music/active`);
      if (res.ok) {
        const data = await res.json();
        setActiveMusic(data);
      }
    } catch (error) {
      console.error('Error fetching active music:', error);
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

  const handleSetActiveMusic = async (musicId: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/manuel/music/${musicId}/activate`, {
        method: 'PUT',
      });

      if (res.ok) {
        setMessage('Música activada para el sitio!');
        fetchActiveMusic();
        fetchMusicFiles();
      } else {
        setMessage('Error activando música');
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#fef7ed] via-[#fce7f3] to-[#fef7ed]">
        <div className="kawaii-card bg-white p-8 max-w-md mx-4">
          <h1 className="text-3xl font-bold text-[var(--coffee-brown)] mb-6 text-center">
            👨 Panel de Manuel
          </h1>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Contraseña"
            className="w-full p-3 border-2 border-[var(--pastel-pink)] rounded-xl mb-4 focus:border-[var(--soft-pink)] focus:outline-none"
          />
          <button
            onClick={handleLogin}
            className="w-full bg-[var(--soft-pink)] text-[var(--coffee-brown)] p-3 rounded-xl font-semibold hover:bg-[var(--pastel-pink)] transition-colors"
          >
            Entrar 🚪
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#fef7ed] via-[#fce7f3] to-[#fef7ed] p-4">
      <div className="max-w-6xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-[var(--coffee-brown)] mb-2">
            👨 Panel Personal de Manuel
          </h1>
          <p className="text-[var(--coffee-brown)] opacity-75">
            Gestiona tus notas, imágenes y la música del sitio 💕
          </p>
        </header>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-8">
          <div className="bg-white kawaii-card p-2 flex rounded-xl">
            <button
              onClick={() => setActiveTab('notes')}
              className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                activeTab === 'notes'
                  ? 'bg-[var(--soft-pink)] text-[var(--coffee-brown)]'
                  : 'text-[var(--coffee-brown)] hover:bg-[var(--pastel-pink)]'
              }`}
            >
              📝 Notas e Imágenes
            </button>
            <button
              onClick={() => setActiveTab('music')}
              className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                activeTab === 'music'
                  ? 'bg-[var(--soft-pink)] text-[var(--coffee-brown)]'
                  : 'text-[var(--coffee-brown)] hover:bg-[var(--pastel-pink)]'
              }`}
            >
              🎵 Música
            </button>
          </div>
        </div>

        {/* Notes Tab */}
        {activeTab === 'notes' && (
          <div className="grid md:grid-cols-2 gap-8">
            {/* Add Note Form */}
            <div className="kawaii-card bg-white p-6">
              <h2 className="text-2xl font-bold text-[var(--coffee-brown)] mb-4">
                ➕ Agregar Nota o Imagen
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
                    className="w-full p-3 border-2 border-[var(--pastel-pink)] rounded-xl focus:border-[var(--soft-pink)] focus:outline-none"
                    placeholder="Título de la nota..."
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-[var(--coffee-brown)] font-semibold mb-2">
                    Contenido
                  </label>
                  <textarea
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    required={!noteImage}
                    className="w-full p-3 border-2 border-[var(--pastel-pink)] rounded-xl h-32 focus:border-[var(--soft-pink)] focus:outline-none resize-none"
                    placeholder="Escribe tu nota aquí..."
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-[var(--coffee-brown)] font-semibold mb-2">
                    Imagen (opcional)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setNoteImage(e.target.files?.[0] || null)}
                    className="w-full p-3 border-2 border-[var(--pastel-pink)] rounded-xl file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[var(--pastel-pink)] file:text-[var(--coffee-brown)] hover:file:bg-[var(--soft-pink)]"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-[var(--soft-pink)] text-[var(--coffee-brown)] p-3 rounded-xl font-semibold hover:bg-[var(--pastel-pink)] transition-colors"
                >
                  💾 Guardar Nota
                </button>
              </form>
            </div>

            {/* Notes List */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-[var(--coffee-brown)] mb-4">
                📚 Tus Notas ({notes.length})
              </h2>
              {notes.length === 0 ? (
                <div className="kawaii-card bg-white p-6 text-center">
                  <p className="text-[var(--coffee-brown)] opacity-75">
                    Aún no tienes notas. ¡Agrega la primera! 📝
                  </p>
                </div>
              ) : (
                notes.map((note) => (
                  <div key={note._id} className="kawaii-card bg-white p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-semibold text-[var(--coffee-brown)]">
                        {note.title}
                      </h3>
                      <button
                        onClick={() => handleDeleteNote(note._id)}
                        className="text-red-500 hover:text-red-700 text-xl"
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
                    <p className="text-[var(--coffee-brown)] whitespace-pre-wrap">
                      {note.content}
                    </p>
                    <p className="text-sm text-[var(--coffee-brown)] opacity-50 mt-2">
                      📅 {new Date(note.date).toLocaleDateString()}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Music Tab */}
        {activeTab === 'music' && (
          <div className="grid md:grid-cols-2 gap-8">
            {/* Upload Music */}
            <div className="kawaii-card bg-white p-6">
              <h2 className="text-2xl font-bold text-[var(--coffee-brown)] mb-4">
                🎵 Subir Música
              </h2>
              <form onSubmit={handleUploadMusic}>
                <div className="mb-4">
                  <label className="block text-[var(--coffee-brown)] font-semibold mb-2">
                    Archivo de Música (MP3/MP4)
                  </label>
                  <input
                    type="file"
                    accept="audio/*,video/*"
                    onChange={(e) => setSelectedMusic(e.target.files?.[0] || null)}
                    required
                    className="w-full p-3 border-2 border-[var(--pastel-pink)] rounded-xl file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[var(--pastel-pink)] file:text-[var(--coffee-brown)] hover:file:bg-[var(--soft-pink)]"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-[var(--soft-pink)] text-[var(--coffee-brown)] p-3 rounded-xl font-semibold hover:bg-[var(--pastel-pink)] transition-colors"
                >
                  ⬆️ Subir Música
                </button>
              </form>

              {/* Active Music Display */}
              {activeMusic && (
                <div className="mt-6 p-4 bg-[var(--pastel-pink)] rounded-xl">
                  <h3 className="text-lg font-semibold text-[var(--coffee-brown)] mb-2">
                    🎶 Música Activa en el Sitio
                  </h3>
                  <p className="text-[var(--coffee-brown)]">{activeMusic.name}</p>
                  <audio controls className="w-full mt-2">
                    <source src={activeMusic.url} type="audio/mpeg" />
                  </audio>
                </div>
              )}
            </div>

            {/* Music Library */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-[var(--coffee-brown)] mb-4">
                📚 Biblioteca de Música ({musicFiles.length})
              </h2>
              {musicFiles.length === 0 ? (
                <div className="kawaii-card bg-white p-6 text-center">
                  <p className="text-[var(--coffee-brown)] opacity-75">
                    No hay archivos de música. ¡Sube el primero! 🎵
                  </p>
                </div>
              ) : (
                musicFiles.map((music) => (
                  <div key={music._id} className="kawaii-card bg-white p-4">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-lg font-semibold text-[var(--coffee-brown)]">
                        {music.name}
                      </h3>
                      {music.isActive ? (
                        <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
                          🎵 Activa
                        </span>
                      ) : (
                        <button
                          onClick={() => handleSetActiveMusic(music._id)}
                          className="bg-[var(--soft-pink)] text-[var(--coffee-brown)] px-4 py-2 rounded-lg font-semibold hover:bg-[var(--pastel-pink)] transition-colors"
                        >
                          🎵 Activar
                        </button>
                      )}
                    </div>
                    <audio controls className="w-full">
                      <source src={music.url} type="audio/mpeg" />
                    </audio>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Message Display */}
        {message && (
          <div className="fixed bottom-4 right-4 kawaii-card bg-white p-4 max-w-sm">
            <p className="text-[var(--coffee-brown)]">{message}</p>
            <button
              onClick={() => setMessage('')}
              className="absolute top-2 right-2 text-[var(--coffee-brown)] opacity-50 hover:opacity-100"
            >
              ✕
            </button>
          </div>
        )}
      </div>
    </div>
  );
}