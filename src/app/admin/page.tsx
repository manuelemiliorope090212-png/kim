'use client';

import { useState } from 'react';

const ADMIN_PASSWORD = 'kimberly123'; // Change this to a secure password

export default function Admin() {
  const [password, setPassword] = useState('');
  const [loggedIn, setLoggedIn] = useState(false);
  const [type, setType] = useState<'drawing' | 'letter' | 'photo' | 'note'>('note');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [date, setDate] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState('');

  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) {
      setLoggedIn(true);
    } else {
      alert('Incorrect password');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('type', type);
    formData.append('title', title);
    formData.append('content', content);
    formData.append('date', date);
    if (file) formData.append('file', file);

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/memories`, {
      method: 'POST',
      body: formData,
    });

    if (res.ok) {
      setMessage('Memory added successfully!');
      setTitle('');
      setContent('');
      setDate('');
      setFile(null);
    } else {
      setMessage('Error adding memory');
    }
  };

  if (!loggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-amber-50">
        <div className="bg-white p-8 rounded-2xl shadow-lg">
          <h1 className="text-2xl font-bold text-amber-800 mb-4">Admin Login</h1>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            className="w-full p-2 border rounded mb-4"
          />
          <button onClick={handleLogin} className="w-full bg-amber-600 text-white p-2 rounded">
            Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-amber-50 p-4">
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-2xl shadow-lg">
        <h1 className="text-3xl font-bold text-amber-800 mb-6">Add New Memory</h1>
        <form onSubmit={handleSubmit} encType="multipart/form-data">
          <div className="mb-4">
            <label className="block text-amber-700 mb-2">Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as any)}
              className="w-full p-2 border rounded"
            >
              <option value="note">Note</option>
              <option value="letter">Letter</option>
              <option value="photo">Photo</option>
              <option value="drawing">Drawing</option>
            </select>
          </div>
          <div className="mb-4">
            <label className="block text-amber-700 mb-2">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full p-2 border rounded"
            />
          </div>
          <div className="mb-4">
            <label className="block text-amber-700 mb-2">Content</label>
            {type === 'photo' || type === 'drawing' ? (
              <input
                type="file"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                required
                className="w-full p-2 border rounded"
              />
            ) : (
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
                className="w-full p-2 border rounded h-32"
              />
            )}
          </div>
          <div className="mb-4">
            <label className="block text-amber-700 mb-2">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full p-2 border rounded"
            />
          </div>
          <button type="submit" className="w-full bg-amber-600 text-white p-2 rounded">
            Add Memory
          </button>
        </form>
        {message && <p className="mt-4 text-center text-amber-700">{message}</p>}
      </div>
    </div>
  );
}