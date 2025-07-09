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

# LearnMint 🌱

> *AI-Powered All-in-One Learning Platform*

LearnMint is a modern, AI-driven web application designed to revolutionize the learning process. Built with Next.js and the Google Gemini API, it provides a comprehensive suite of tools that automate study material creation, facilitate interactive learning, and support students in mastering any subject with greater efficiency and engagement.

## ✨ Features

### 🤖 AI-Powered Content Generation
- *📝 Smart Notes*: Generate well-structured, Markdown-formatted notes with embedded AI-generated images
- *🎯 Interactive Quizzes*: Create quizzes with multiple-choice and short-answer questions, complete with detailed explanations
- *📚 Dynamic Flashcards*: Instant flashcard creation for quick review and memorization

### 🧪 Custom Test Creation Lab
- Build tailored exams by combining multiple topics
- Set custom difficulty levels and time limits
- Use personal notes or AI-generated content
- Timer functionality for realistic exam simulation

### 💬 Advanced AI Chatbot
- Multiple AI personas for different learning styles
- Support for text, image, PDF, audio, and video uploads
- Contextual conversations for deeper understanding
- Rich multimedia interactions

### 🛠 Integrated Learning Toolkit
- *🔬 Scientific Calculator*: Advanced mathematical computations
- *📏 Unit Converter*: Convert between different measurement units
- *📹 YouTube Integration*: Search and access educational videos
- *📖 Google Books Search*: Find relevant academic resources
- *📰 News Feed*: Stay updated with current affairs

### 🎧 Audio Factory
- *🗣 Text-to-Speech*: Convert any text content to natural-sounding audio
- *👥 Two-Person Audio Generation*: Create dialogue-style audio with multiple voices
- *📄 File Reading*: Read aloud any uploaded document or file
- *🎵 Voice Customization*: Multiple voice options and speech settings

### 🎨 Personalization & Accessibility
- *🌙 Dark/Light Theme*: Futuristic design with theme toggling
- *📱 Responsive Design*: Seamless experience across all devices
- *🔤 Adjustable Font Sizes*: Better readability for all users
- *🌍 45+ Language Support*: Comprehensive multilingual accessibility
- *♿ Accessibility Features*: Inclusive design principles

## 🚀 Tech Stack

- *Framework*: [Next.js](https://nextjs.org/) (App Router)
- *Language*: [TypeScript](https://www.typescriptlang.org/)
- *AI*: [Google Gemini via Genkit](https://firebase.google.com/docs/genkit)
- *Styling*: [Tailwind CSS](https://tailwindcss.com/) with [ShadCN UI](https://ui.shadcn.com/)
- *Authentication*: [Firebase Authentication](https://firebase.google.com/docs/auth)
- *State Management*: [TanStack Query](https://tanstack.com/query/latest)
- *Animations*: [Framer Motion](https://www.framer.com/motion/)
- *Icons*: [Lucide Icons](https://lucide.dev/)

## 🎯 Getting Started

### Prerequisites
- Node.js 18+ and npm/yarn
- Firebase project setup
- Google Gemini API key

### Installation

1. *Clone the repository*
   bash
   git clone https://github.com/yourusername/learnmint.git
   cd learnmint
   

2. *Install dependencies*
   bash
   npm install
   # or
   yarn install
   

3. *Environment Setup*
   Create a .env.local file in the root directory:
   env
   NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id
   
   GOOGLE_GEMINI_API_KEY=your_gemini_api_key
   

4. *Run the development server*
   bash
   npm run dev
   # or
   yarn dev
   

5. *Open your browser*
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📱 Usage

### For Students
1. *Sign up/Login* using Firebase Authentication
2. *Generate Study Materials*: Enter any topic to create instant notes, quizzes, and flashcards
3. *Take Custom Tests*: Build personalized exams with difficulty settings
4. *Chat with AI*: Get help with multimedia support
5. *Access Tools*: Use integrated calculator, converter, and research tools

### For Teachers
1. *Create Content*: Generate comprehensive study materials for any subject
2. *Build Tests*: Design custom exams with multiple topics and difficulty levels
3. *Use Audio Factory*: Create audio content and read documents aloud for students
4. *Monitor Progress*: Track student engagement and performance
5. *Distribute Resources*: Share materials easily with students

## 🏗 Project Structure


learnmint/
├── app/                    # Next.js app directory
│   ├── components/         # Reusable UI components
│   ├── lib/               # Utility functions and configurations
│   ├── pages/             # Application pages
│   └── styles/            # Global styles
├── public/                # Static assets
├── firebase/              # Firebase configuration
├── types/                 # TypeScript type definitions
└── utils/                 # Helper functions


## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (git checkout -b feature/amazing-feature)
3. Commit your changes (git commit -m 'Add amazing feature')
4. Push to the branch (git push origin feature/amazing-feature)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- *Google Gemini AI* for powerful AI capabilities
- *Next.js Team* for the excellent framework
- *Firebase* for authentication and backend services
- *ShadCN/UI* for beautiful UI components
- *Tailwind CSS* for efficient styling

## 📞 Support

For support, email support@learnmint.com or join our [Discord community](https://discord.gg/learnmint).

## 🚀 Roadmap

- [ ] Mobile app development
- [ ] Offline mode support
- [ ] Advanced analytics dashboard
- [ ] Collaborative study rooms
- [ ] Integration with LMS platforms
- [ ] Voice-to-text note taking
- [ ] Advanced AI tutoring modes

---

*Made with ❤ by [MrGarvit](https://github.com/mrgarvit)*

[![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Firebase](https://img.shields.io/badge/Firebase-039BE5?style=for-the-badge&logo=Firebase&logoColor=white)](https://firebase.google.com/)