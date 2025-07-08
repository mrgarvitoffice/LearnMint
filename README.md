<p align="center">
  <a href="#" target="_blank">
    <img src="https://placehold.co/600x300.png?text=LearnMint&font=orbitron&bg=222_47_11&fc=170_100_50" alt="LearnMint Banner">
  </a>
</p>
<h1 align="center">LearnMint: The AI-Powered Learning Toolkit</h1>

<p align="center">
  <img alt="GitHub language count" src="https://img.shields.io/github/languages/count/MrGarvit/learnmint?color=%2300C4B3&style=for-the-badge">
  <img alt="GitHub top language" src="https://img.shields.io/github/languages/top/MrGarvit/learnmint?color=%2300C4B3&style=for-the-badge">
  <img alt="GitHub last commit" src="https://img.shields.io/github/last-commit/MrGarvit/learnmint?style=for-the-badge">
</p>

## About The Project

**LearnMint** is a modern, AI-driven web application designed to revolutionize the learning process. Built with Next.js and the Google Gemini API, it provides a comprehensive suite of tools that automate study material creation, facilitate interactive learning, and support students in mastering any subject with greater efficiency and engagement.

The application features a sleek, futuristic design system with a dark-mode-first approach, built upon a customizable HSL color theme in Tailwind CSS. The interface is fully responsive, ensuring a seamless experience across all devices.

---

### Key Features

*   **Unified AI Material Generation**: Instantly create comprehensive study materials from a single topic.
    *   📝 **In-depth Notes**: Generate well-structured, Markdown-formatted notes complete with headings, lists, and embedded AI-generated images.
    *   🎯 **Interactive Quizzes**: Receive quizzes with multiple-choice and short-answer questions, each including detailed explanations to reinforce learning.
    *   📚 **Engaging Flashcards**: Create flashcards for quick review sessions and memorization of key concepts.

*   **Custom Test Creation Lab**: Build tailored exams by combining topics, using custom notes, setting difficulty levels, and adding timers.

*   **Advanced AI Chatbot**: Engage with distinct AI personas, supporting text, image, PDF, audio, and video uploads for rich, contextual conversations.

*   **Integrated Toolkit & Resource Library**: Access a suite of academic utilities, including a scientific calculator and a unit converter, alongside an integrated search for YouTube and Google Books.

*   **Personalization & Accessibility**: Features include light/dark theme toggling, adjustable font sizes, and multi-language support to cater to a global audience.

---

### Built With

This project leverages a modern and scalable tech stack:

*   **Framework**: [Next.js](https://nextjs.org/) (App Router)
*   **Language**: [TypeScript](https://www.typescriptlang.org/)
*   **AI**: [Google Gemini via Genkit](https://firebase.google.com/docs/genkit)
*   **Styling**: [Tailwind CSS](https://tailwindcss.com/) with [ShadCN UI](https://ui.shadcn.com/)
*   **Authentication**: [Firebase Authentication](https://firebase.google.com/docs/auth)
*   **State Management**: [TanStack Query](https://tanstack.com/query/latest)
*   **UI/UX**: [Framer Motion](https://www.framer.com/motion/), [Lucide Icons](https://lucide.dev/)

---

## 🚀 Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

*   Node.js (LTS version)
*   `npm` or `yarn` package manager

### Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/MrGarvit/learnmint.git
    cd learnmint
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set Up Environment Variables:**
    Create a `.env` file in the project's root directory. This file is crucial for storing your secret API keys.

    <details>
    <summary><strong>Click for .env template and instructions</strong></summary>

    Copy the following template into your new `.env` file and replace the placeholder values with your actual credentials.

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
    **Important:** After creating or modifying the `.env` file, you must restart your development server for the changes to take effect.
    </details>

4.  **Configure Firebase Authentication:**
    For user sign-in to work, you must enable the necessary providers in your Firebase project.

    <details>
    <summary><strong>Click for Firebase Setup Guide</strong></summary>

    1.  Go to the [Firebase Console](https://console.firebase.google.com/).
    2.  Select the project that matches your `NEXT_PUBLIC_FIREBASE_PROJECT_ID`.
    3.  Navigate to **Authentication** > **Sign-in method**.
    4.  Enable the **Google** and **Email/Password** providers.
    5.  Go to the **Settings** tab within Authentication and select **Authorized domains**.
    6.  Add `localhost` to the list of authorized domains for local development.
    </details>

5.  **Run the Application:**
    *   **Main App Server:**
        ```bash
        npm run dev
        ```
        Access the application at `http://localhost:3000`.

    *   **Genkit AI Server (Optional):**
        To inspect and debug AI flows, run this in a separate terminal:
        ```bash
        npm run genkit:dev
        ```
        Access the Genkit UI at `http://localhost:4000`.
