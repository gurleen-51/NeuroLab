# NeuroVerse AI Laboratory

A professional-grade AI experimentation laboratory for visualizing and training neural networks in the browser.

## Features
- **CNN Lab**: Interactive Convolutional Neural Network builder and visualization.
- **Hopfield Lab**: Associative memory pattern recognition with gesture support.
- **Playground**: Real-time training metrics and data visualization.
- **Visual Learning**: 3D data explorations and insight panels.

## Tech Stack
- **Frontend**: React, Vite, Tailwind CSS v4, Framer Motion, Three.js, Recharts.
- **Backend**: Node.js, Express.

## Project Structure
- `/frontend`: React application.
- `/backend`: Express API.

## Deployment Guide

### 1. Push to GitHub
1. Create a new repository on GitHub.
2. Link your local repo:
   ```bash
   git remote add origin <YOUR_GITHUB_REPO_URL>
   git branch -M main
   git push -u origin main
   ```

### 2. Deploy Frontend (Vercel/Netlify)
- **Vercel**: Import the repository, select the `frontend` folder as the root, and it will automatically detect Vite.
- **Netlify**: Similar to Vercel, ensure the build command is `npm run build` and publish directory is `dist`.

### 3. Deploy Backend (Render/Railway)
- Connect your repo, select the `backend` folder.
- Ensure the start command is `node server.js`.
- Add environment variables if needed.

## Development
To run locally:
1. `cd frontend && npm run dev`
2. `cd backend && node server.js`