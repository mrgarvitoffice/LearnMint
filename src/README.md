
# LearnMint: AI-Powered Learning Toolkit

<p align="center">
  <a href="https://learnmint.dev" target="_blank">
    <img src="https://placehold.co/600x300.png?text=LearnMint&font=orbitron&bg=222_47_11&fc=170_100_50" alt="LearnMint Banner" data-ai-hint="futuristic abstract">
  </a>
</p>

<p align="center">
  <img alt="GitHub language count" src="https://img.shields.io/github/languages/count/MrGarvit/learnmint?color=%2300C4B3&style=for-the-badge">
  <img alt="GitHub top language" src="https://img.shields.io/github/languages/top/MrGarvit/learnmint?color=%2300C4B3&style=for-the-badge">
  <img alt="GitHub last commit" src="https://img.shields.io/github/last-commit/MrGarvit/learnmint?style=for-the-badge">
</p>

**LearnMint** is an advanced, AI-driven Next.js application engineered to transform study sessions into a dynamic and productive experience. It automates the creation of study materials, offers interactive learning tools, and provides a suite of utilities to support students and lifelong learners.

---

## 🌟 Table of Contents

*   [Overview & Design Philosophy](#-overview--design-philosophy)
*   [🔥 Key Features](#-key-features)
*   [🛠️ Tech Stack](#️-tech-stack)
*   [🚀 Getting Started: Setup Guide](#-getting-started-setup-guide)
    *   [1. Prerequisites](#1-prerequisites)
    *   [2. Configure Firebase](#2-configure-firebase)
    *   [3. Environment Variables (.env)](#3-environment-variables-env)
    *   [4. Install Dependencies](#4-install-dependencies)
    *   [5. Run the Application](#5-run-the-application)
*   [☁️ Deployment](#️-deployment)
*   [🎨 Customization](#-customization)

---

## ✨ Overview & Design Philosophy

LearnMint is built on the principles of efficiency, engagement, and elegance.

*   **Modern UI**: A futuristic dark theme designed for comfortable, prolonged study sessions, with a light mode available.
*   **Vibrant Color Scheme**: A sophisticated deep blue background, a vibrant neon teal primary, and a striking magenta accent, all defined with HSL CSS variables for easy theming.
*   **Typography**: The modern `Orbitron` font family is used for crisp, futuristic readability.
*   **Iconography**: A consistent and modern visual language using `lucide-react` icons.
*   **Component-Based Architecture**: Built with Tailwind CSS and ShadCN UI components for a polished, professional, and fully responsive experience.

---

## 🔥 Key Features

LearnMint is packed with a suite of powerful, AI-driven tools:

*   **Firebase Authentication**: Secure user sign-in via Google or Email, plus a fully-featured Guest Mode.
*   **Unified AI Material Generation**:
    *   Enter a topic to generate comprehensive study materials instantly:
        *   📝 **In-depth Notes**: Formatted in Markdown with headings, lists, tables, and AI-generated images embedded directly in the text.
        *   🎯 **Interactive Quizzes**: A mix of multiple-choice and short-answer questions with detailed explanations.
        *   📚 **Engaging Flashcards**: For quick review and memorization.
*   **Custom Test Creation Lab**: Build tailored tests by combining topics, using custom notes, setting difficulty levels, and adding timers.
*   **Advanced AI Chatbot**:
    *   Converse with distinct AI personas.
    *   Supports text, image, PDF, audio, and video uploads for contextual conversations.
    *   Features voice input and spoken responses.
*   **Precision Toolkit**: A scientific calculator and a comprehensive unit converter with calculation history.
*   **Daily News Digest**: Fetches the latest global news, filterable by location, category, and language, with voice search capabilities.
*   **Resource Library**: A hub for external knowledge, featuring integrated YouTube and Google Books search, plus curated links to educational platforms.
*   **Personalization**: Theme toggling (light/dark), adjustable font sizes, and multi-language support.

---

## 🛠️ Tech Stack

LearnMint leverages a modern, robust tech stack:

*   **Framework**: Next.js 15+ (App Router)
*   **Language**: TypeScript
*   **Styling**: Tailwind CSS with ShadCN UI
*   **Authentication**: Firebase Authentication (Google, Email, Anonymous)
*   **AI**: Google Gemini via Genkit for all generative features
*   **State Management**: React Query (TanStack Query)
*   **UI/UX**: Framer Motion, Lucide Icons, `next-themes`

---

## 🚀 Getting Started: Setup Guide

Follow these steps carefully to run LearnMint locally.

### 1. Prerequisites

*   Node.js (LTS version recommended)
*   `npm` or `yarn`

### 2. Configure Firebase

This is a common point of failure. You must configure Firebase correctly for authentication to work.

1.  **Go to the Firebase Console**: [https://console.firebase.google.com/](https://console.firebase.google.com/)
2.  **Select your project**: Find the project with the ID that matches `NEXT_PUBLIC_FIREBASE_PROJECT_ID` in your `.env` file.
3.  Navigate to **Authentication** (in the Build section on the left sidebar).
4.  Go to the **Sign-in method** tab.
5.  **Enable Providers**: Click **Add new provider** and enable both **Google** and **Email/Password**.
6.  **Authorize Domains**: While in Authentication, go to the **Settings** tab and select **Authorized domains**.
7.  Click **Add domain** and add `localhost` (for local development) and your Firebase auth domain (e.g., `your-project-id.firebaseapp.com`).

### 3. Environment Variables (.env)

Create a file named `.env` in the root of the project and populate it with your API keys. The application will not work without this file.

<details>
<summary><strong>Click here for the .env template and guide</strong></summary>

```env
# === Firebase Authentication (REQUIRED) ===
# Get these from your Firebase project settings.
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=1:...:web:...

# === Genkit AI Features (REQUIRED for AI) ===
# Get keys from Google AI Studio: https://aistudio.google.com/app/apikey
# The associated Google Cloud project must have the "Generative Language API" enabled and billing configured.
GOOGLE_API_KEY=AIzaSy...
GOOGLE_API_KEY_NOTES=AIzaSy...
GOOGLE_API_KEY_CHATBOT=AIzaSy...
GOOGLE_API_KEY_QUIZZES=AIzaSy...
GOOGLE_API_KEY_IMAGES=AIzaSy...
GOOGLE_API_KEY_TTS=AIzaSy...

# === Other Service API Keys (REQUIRED for certain features) ===
# News Page: https://newsdata.io/
NEWSDATA_API_KEY=pub_...
# Library Page: Google Cloud Console (YouTube Data API v3 & Google Books API)
YOUTUBE_API_KEY=AIzaSy...
GOOGLE_BOOKS_API_KEY=AIzaSy...
```
**Important:** After creating or modifying `.env`, you must restart your development server.

</details>

### 4. Install Dependencies

```bash
npm install
# or
yarn install
```

### 5. Run the Application

1.  **Run the Development Server**:
    ```bash
    npm run dev
    ```
    Access the application at `http://localhost:3000` (or your configured port).

2.  **Run Genkit Dev Server** (Optional, for debugging AI flows):
    ```bash
    npm run genkit:dev
    ```
    Access the Genkit inspection UI at `http://localhost:4000`.

---

## ☁️ Deployment

This application is optimized for deployment on **Firebase Hosting**.

1.  **Install Firebase CLI**: `npm install -g firebase-tools`.
2.  **Login to Firebase**: `firebase login`.
3.  **Initialize Firebase**: `firebase init hosting`.
4.  **Build the Project**: `npm run build`.
5.  **Deploy**: `firebase deploy --only hosting`.

---

## 🎨 Customization

*   **Styling & Theme**: Modify colors and styles in `src/app/globals.css` and `tailwind.config.ts`.
*   **AI Prompts**: Tweak the behavior of the AI features by editing the prompt files in `src/ai/flows/`.
*   **Fonts**: Change the application font in `src/app/layout.tsx`.
