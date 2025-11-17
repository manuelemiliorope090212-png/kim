'use client';

import { useState, useEffect } from 'react';
import { useMusic } from '../../components/MusicContext';

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

  // Music state from context
  const {
    musicFiles,
    currentSongIndex,
    currentTime,
    isPlaying,
    autoplayFailed,
    setMusicFiles,
    setCurrentSongIndex,
    setCurrentTime,
    setIsPlaying,
    setAutoplayFailed,
    playSong,
    seekTo,
    audioRef
  } = useMusic();

  const [selectedMusic, setSelectedMusic] = useState<File | null>(null);
  const [message, setMessage] = useState('');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) return;

    const newMusicFiles = [...musicFiles];
    const draggedItem = newMusicFiles[draggedIndex];
    newMusicFiles.splice(draggedIndex, 1);
    newMusicFiles.splice(dropIndex, 0, draggedItem);

    // Update order numbers
    const updatedFiles = newMusicFiles.map((file, index) => ({
      ...file,
      order: index + 1
    }));

    setMusicFiles(updatedFiles);

    // Update current song index if it was affected
    if (currentSongIndex === draggedIndex) {
      setCurrentSongIndex(dropIndex);
    } else if (currentSongIndex > draggedIndex && currentSongIndex <= dropIndex) {
      setCurrentSongIndex(currentSongIndex - 1);
    } else if (currentSongIndex < draggedIndex && currentSongIndex >= dropIndex) {
      setCurrentSongIndex(currentSongIndex + 1);
    }

    // Update database
    try {
      for (const file of updatedFiles) {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/manuel/music/${file._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order: file.order }),
        });
      }
      setMessage('Orden de música actualizado!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error updating music order:', error);
      setMessage('Error actualizando orden');
      // Revert changes on error
      fetchMusicFiles();
    }

    setDraggedIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  useEffect(() => {
    if (loggedIn) {
      fetchNotes();
      fetchMusicFiles();
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
                      <div className="text-center text-[var(--cream)] opacity-75 text-sm">
                        🎵 Haz clic en cualquier canción para reproducirla para todos
                      </div>
 
                      {/* Mobile autoplay warning */}
                      {autoplayFailed && (
                        <div className="mt-4 p-3 bg-yellow-100 border border-yellow-300 rounded-lg text-center">
                          <p className="text-yellow-800 text-sm">
                            📱 En móvil: usa los controles de audio visibles abajo para reproducir la música
                          </p>
                        </div>
                      )}
 
                      {/* Progress Bar */}
                      <div className="mt-4">
                        <div className="flex items-center gap-2 text-[var(--cream)] text-sm">
                          <span>0:00</span>
                          <input
                            type="range"
                            min="0"
                            max={audioRef.current?.duration || 180}
                            value={currentTime}
                            onChange={(e) => {
                              const newTime = parseFloat(e.target.value);
                              seekTo(newTime);
                              // Update server with new time
                              fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/manuel/music/current`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  currentSongId: musicFiles[currentSongIndex]?._id,
                                  currentTime: newTime
                                })
                              }).catch(err => console.error('Error updating server time:', err));
                            }}
                            className="flex-1 h-2 bg-[var(--cream)] bg-opacity-30 rounded-lg appearance-none cursor-pointer slider"
                          />
                          <span>{Math.floor((audioRef.current?.duration || 180) / 60)}:{String(Math.floor((audioRef.current?.duration || 180) % 60)).padStart(2, '0')}</span>
                        </div>
                        <div className="text-center text-[var(--cream)] text-xs mt-1">
                          {Math.floor(currentTime / 60)}:{String(Math.floor(currentTime % 60)).padStart(2, '0')} / {Math.floor((audioRef.current?.duration || 180) / 60)}:{String(Math.floor((audioRef.current?.duration || 180) % 60)).padStart(2, '0')}
                        </div>
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
                          draggable
                          className={`p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                            currentSongIndex === index && isPlaying
                              ? 'bg-white border-2 border-[var(--coffee-medium)] text-black'
                              : 'bg-[rgba(254,247,237,0.1)] hover:bg-[rgba(254,247,237,0.2)]'
                          } ${draggedIndex === index ? 'opacity-50' : ''}`}
                          onDragStart={(e) => handleDragStart(e, index)}
                          onDragOver={handleDragOver}
                          onDrop={(e) => handleDrop(e, index)}
                          onDragEnd={handleDragEnd}
                          onClick={async () => {
                            console.log('🎵 Song clicked:', music.name, 'index:', index);
                            try {
                              console.log('🎵 Calling playSong...');
                              await playSong(index);
                              console.log('🎵 playSong completed successfully');
                              setAutoplayFailed(false);
                              setMessage(`🎵 Reproduciendo: ${music.name}`);
                              setTimeout(() => setMessage(''), 3000);

                              // Update server with new song selection - this will trigger sync for all users
                              console.log('🎵 Updating server with song selection...');
                              await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/manuel/music/current`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  currentSongId: music._id,
                                  currentTime: 0
                                })
                              });
                              console.log('🎵 Server updated successfully - all users should now sync to this song');
                            } catch (error) {
                              console.error('❌ Error in song click handler:', error);
                              setAutoplayFailed(true);
                              setMessage('En móvil, usa los controles de audio visibles 📱');
                              setTimeout(() => setMessage(''), 5000);
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