# Kimberly's Memory Site

A beautiful, scrollable website to share memories with Kimberly, featuring a coffee-themed kawaii design with hearts and cats.

## Architecture

- **Frontend**: Next.js app deployed on Vercel
- **Backend**: Express.js API deployed on Render
- **Database**: MongoDB
- **File Storage**: Cloudinary

## Features

- **Public Site**: Long scrollable collage of drawings, letters, photos, and notes with dates
- **Background Music**: Plays songs from Humbe and Latin Mafia
- **Admin Panel**: Private area to upload new memories (password protected)
- **Mobile Optimized**: Responsive design for mobile viewing
- **Cloud Storage**: Images stored on Cloudinary

## Setup

### Backend (Deploy to Render)

1. Go to `backend/` folder.

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables in `.env`:
   ```
   MONGODB_URI=your_mongodb_connection_string
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   PORT=5000
   ```

4. Set up MongoDB database and Cloudinary account.

5. Run locally:
   ```bash
   npm run dev
   ```

6. Deploy to Render: Connect GitHub repo, set build command `npm install`, start command `npm start`, and environment variables.

### Frontend (Deploy to Vercel)

1. In root folder, install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables in `.env.local`:
   ```
   NEXT_PUBLIC_API_URL=https://your-render-backend-url
   ```

3. Update the music source in `src/app/page.tsx` with actual Humbe/Latin Mafia song URLs.

4. Change the admin password in `src/app/admin/page.tsx`.

5. Run locally:
   ```bash
   npm run dev
   ```

6. Deploy to Vercel: Connect GitHub repo, Vercel will auto-detect Next.js.

## Usage

- **Public Site**: Scroll through the memories. Music plays automatically.
- **Admin Panel**: Login with password, then upload new memories by selecting type, adding title, content/date, and file if image.
