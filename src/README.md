
# 🌱 LearnMint: Your AI-Powered Study Revolution! 🚀
### A Project by **MrGarvit**

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

**Welcome to LearnMint!** An advanced, AI-driven Next.js application engineered to transform your study sessions into a dynamic, productive, and engaging experience. Say goodbye to tedious material preparation and hello to intelligent learning that's tailored, insightful, and lightning-fast.

---

## 🌟 Table of Contents

*   [Core Philosophy & Design](#-core-philosophy--design)
*   [🔥 Key Features](#-key-features)
*   [🛠️ Tech Stack](#️-tech-stack)
*   [🚀 Getting Started: Setup Guide](#-getting-started-setup-guide)
    *   [1. Prerequisites](#1-prerequisites)
    *   [2. CRITICAL: Configure Firebase](#2-critical-configure-firebase)
    *   [3. CRITICAL: Environment Variables (.env)](#3-critical-environment-variables-env)
    *   [4. Install Dependencies](#4-install-dependencies)
    *   [5. Add Static Assets](#5-add-static-assets)
    *   [6. Run the Application](#6-run-the-application)
*   [☁️ Deployment](#️-deployment)
*   [🎨 Customization](#-customization)
*   [💖 Creator's Note](#️-creators-note)

---

## ✨ Core Philosophy & Design

LearnMint is built on the principles of efficiency, engagement, and elegance.

*   **Sleek & Modern UI**: A stunning futuristic dark theme, designed for comfortable, prolonged study sessions. A light mode is also available.
*   **Vibrant Color Scheme**: A sophisticated deep blue background, a vibrant neon teal primary, and a striking magenta accent, all defined with HSL CSS variables for easy theming.
*   **Typography Excellence**: The modern `Orbitron` font family is used for crisp, futuristic readability.
*   **Iconography**: A consistent and modern visual language using `lucide-react` icons.
*   **Built with the Best**: Tailwind CSS and ShadCN UI components for a polished, professional, and fully responsive experience.

---

## 🔥 Key Features

LearnMint is packed with a suite of powerful, AI-driven tools:

*   **Firebase Authentication**: Secure user sign-in via Google or Email, plus a fully-featured Guest Mode.
*   **Unified AI Material Generation**:
    *   Enter a topic to generate comprehensive study materials instantly:
        *   📝 **In-depth Notes**: Formatted in Markdown with headings, lists, tables, and AI-generated images embedded directly in the text.
        *   🎯 **Interactive 30-Question Quiz**: A mix of multiple-choice and short-answer questions with detailed explanations.
        *   📚 **20 Engaging Flashcards**: For quick review and memorization.
*   **Custom Test Creation Lab**: Build tailored tests by combining topics, using custom notes, setting difficulty levels, and adding timers.
*   **Advanced AI Chatbot**:
    *   Converse with distinct AI personas like the confident "Gojo" or the wise "Holo".
    *   Supports text, image, PDF, audio, and video uploads for contextual conversations.
    *   Features voice input and spoken responses.
*   **Precision Toolkit**: A scientific calculator and a comprehensive unit converter with calculation history.
*   **Daily News Digest**: Fetches the latest global news, filterable by location, category, and language, with voice search capabilities.
*   **Resource Library**: A hub for external knowledge, featuring integrated YouTube and Google Books search, plus curated links to educational platforms.
*   **LearnMint Arcade**: A fun zone with a "Definition Challenge" game and links to other brain-boosting activities.
*   **Audio Factory**: Generate spoken summaries from text, images, or PDFs, and create multi-speaker audio discussions from any content.
*   **Personalization**: Theme toggling (light/dark), adjustable font sizes, and multi-language support.

---

## 🛠️ Tech Stack

LearnMint leverages a modern, robust tech stack:

*   **Framework**: Next.js 15+ (App Router)
*   **Language**: TypeScript
*   **Styling**: Tailwind CSS with ShadCN UI
*   **Authentication**: Firebase Authentication (Google, Email, Anonymous)
*   **AI**: Google Gemini via Genkit for all generative features (text, image, and audio)
*   **State Management**: React Query (TanStack Query)
*   **UI/UX**: Framer Motion, Lucide Icons, `next-themes`

---

## 🚀 Getting Started: Setup Guide

Follow these steps carefully to run LearnMint locally.

### 1. Prerequisites

*   Node.js (LTS version recommended)
*   `npm` or `yarn`

### 2. CRITICAL: Configure Firebase

This is the most common point of failure. **You must configure Firebase correctly for authentication to work.**

1.  **Go to the Firebase Console**: [https://console.firebase.google.com/](https://console.firebase.google.com/)
2.  **Select your project**: Find the project with the ID that matches `NEXT_PUBLIC_FIREBASE_PROJECT_ID` in your `.env` file.
3.  Navigate to **Authentication** (in the Build section on the left sidebar).
4.  Go to the **Sign-in method** tab.
5.  **Enable Providers**: Click **Add new provider** and enable both **Google** and **Email/Password**. For Google, set a project public-facing email.
6.  **Authorize Domains**: While still in Authentication, go to the **Settings** tab and select **Authorized domains**.
7.  Click **Add domain** and add the following:
    *   `localhost` (for local development)
    *   Your Firebase auth domain (the value of `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` from your `.env` file, e.g., `your-project-id.firebaseapp.com`)
    *   If you are using a cloud workstation, add its domain as well (e.g., `*.cloudworkstations.dev`).

### 3. CRITICAL: Environment Variables (.env)

Create a file named `.env` in the root of the project and populate it with your API keys. **The application will not work without this file.**

<details>
<summary><strong>⚠️ Click here for a template and detailed guide ⚠️</strong></summary>

```env
# === Firebase Authentication (REQUIRED) ===
# Get these from your Firebase project settings.
# CRITICAL: Ensure the Auth Domain is added to the "Authorized domains" list in Firebase.
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=1:...:web:...

# === Genkit AI Features (REQUIRED for AI) ===
# Get keys from Google AI Studio: https://aistudio.google.com/app/apikey
# The associated Google Cloud project must have the "Generative Language API" enabled and billing configured.

# Main/Default Gemini API Key
GOOGLE_API_KEY=AIzaSy...

# (Optional) Key for Study Notes generation. Uses GOOGLE_API_KEY if blank.
GOOGLE_API_KEY_NOTES=AIzaSy...

# (Optional) Key for AI Chatbot. Uses GOOGLE_API_KEY if blank.
GOOGLE_API_KEY_CHATBOT=AIzaSy...

# (Optional) Key for Quizzes/Flashcards. Uses GOOGLE_API_KEY if blank.
GOOGLE_API_KEY_QUIZZES=AIzaSy...

# (CRITICAL for images in notes) Key for Image Generation.
# Falls back to NOTES key, then main key if blank. A dedicated key is recommended.
GOOGLE_API_KEY_IMAGES=AIzaSy...

# (CRITICAL for Audio Factory) Key for Text-to-Speech (TTS) generation. Uses GOOGLE_API_KEY if blank.
GOOGLE_API_KEY_TTS=AIzaSy...


# === Other Service API Keys (REQUIRED for certain features) ===

# (Required for News Page) Get a free key from https://newsdata.io/
NEWSDATA_API_KEY=pub_...

# (Required for Library Page) Get from Google Cloud Console (YouTube Data API v3)
YOUTUBE_API_KEY=AIzaSy...

# (Required for Library Page) Get from Google Cloud Console (Google Books API)
GOOGLE_BOOKS_API_KEY=AIzaSy...
```

**Important Notes:**
*   Use your own valid API keys.
*   Do not use quotes around the values in the `.env` file.
*   After creating or modifying `.env`, you **MUST restart your development server** for the changes to apply.

</details>

### 4. Install Dependencies

```bash
npm install
# or
yarn install
```

### 5. Add Static Assets

The application requires a few static assets to be placed in the `public/` directory:

*   **PWA Icons**:
    *   `public/icons/icon-192x192.png`
    *   `public/icons/icon-512x512.png`
*   **Sound Effects**: Place your `.mp3` files in `public/sounds/`. Required sounds include `ting.mp3`, `correct-answer.mp3`, etc.
*   **Chatbot Avatars**: Place avatar images in `public/images/`, such as `gojo-dp.jpg` and `holo-dp.jpg`.

### 6. Run the Application

1.  **Run the Development Server**:
    ```bash
    npm run dev
    # or
    yarn dev
    ```
    Access LearnMint at `http://localhost:3000` (or your configured port).

2.  **Run Genkit Dev Server** (Optional, but recommended for debugging AI flows):
    ```bash
    npm run genkit:dev
    ```
    Access the Genkit inspection UI at `http://localhost:4000`.

---

## ☁️ Deployment

This application is optimized for deployment on **Firebase Hosting**.

1.  **Install Firebase CLI**: If you haven't already, install the Firebase command-line tools: `npm install -g firebase-tools`.
2.  **Login to Firebase**: `firebase login`.
3.  **Initialize Firebase**: `firebase init hosting`. Select your Firebase project and configure the settings (e.g., use `out` as the public directory if you are exporting a static site, though this project is intended for a live server).
4.  **Build the Project**: `npm run build`.
5.  **Deploy**: `firebase deploy --only hosting`.

---

## 🎨 Customization

*   **Styling & Theme**: Modify colors and styles in `src/app/globals.css` and `tailwind.config.ts`.
*   **AI Prompts**: Tweak the behavior of the AI features by editing the prompt files in `src/ai/flows/`.
*   **Fonts**: Change the application font in `src/app/layout.tsx`.

---

## 💖 Creator's Note

LearnMint was created by **MrGarvit** as a demonstration of cutting-edge AI integration in modern web applications. It showcases the power of generative AI to create dynamic, personalized, and engaging educational experiences.

Enjoy minting new knowledge!!!

    