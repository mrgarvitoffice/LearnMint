
// This file defines constants used throughout the Nexithra application.
// It includes navigation items, application name, and static data for features like the library and news.

import type { LucideIcon } from 'lucide-react'; // Type for Lucide icons
// Importing all used Lucide icons for navigation and other UI elements
import {
  LayoutDashboard, // Icon for Dashboard
  FileText,        // Icon for Note Generator
  AudioLines,      // Icon for Audio Factory
  Calculator,      // Icon for Calculator
  Newspaper,       // Icon for Daily News
  Library,         // Generic library icon
  Gamepad2,        // Icon for Arcade
  Bot,             // Icon for AI Chatbot
  TestTubeDiagonal,// Icon for Custom Test
  BookMarked,       // Specific icon used for the Library navigation item
  UserCircle,      // Icon for Profile / "You"
  Settings,        // Icon for Settings
  BarChart,        // Icon for Progress
  Home,            // Icon for Home
  NotebookText,    // Icon for Generate
  BookOpen,        // Icon for Wikidata resource
  Lightbulb,       // Icon for Project Gutenberg resource,
  Brain,           // Icon for Project Gutenberg resource,
  School,          // Icon for College feature
  Code2,           // Icon for Coding Playground
  GraduationCap,    // Icon for RGPV Notes, NCERT
  Youtube,         // Icon for NPTEL,
  HeartPulse,      // NEET
  Atom,            // IIT JEE
  Book,            // School Boards
  Landmark,        // IAS
  PenSquare,       // School Prep
  Trophy,          // Olympiad
  Building,        // Govt Exams
  Briefcase,       // ESE/GATE
  AreaChart,       // Finance
  MapPin,          // Location
  FlaskConical,    // Pharmacy, Chemical Eng
  Car,             // Automobile Eng
  Cog,             // Mechanical Eng
  Building2,       // Civil Eng
  CircuitBoard,     // Electrical, Electronics
  Pickaxe,         // Mining
  Scissors,        // Textile
  Cpu,              // Computer Science
  Robot,           // Robotics
  BrainCircuit,    // AI/ML, Data Science
} from 'lucide-react';

/**
 * @interface NavItem
 * Defines the structure for a navigation item in the application.
 * Used for rendering sidebar and header navigation links.
 */
export interface NavItem {
  title: string;         // The display text for the navigation item (acts as translation key).
  href: string;          // The URL path for the navigation link.
  icon: LucideIcon;      // The Lucide icon component to display next to the title.
  description?: string;  // A short description for feature cards (acts as translation key)
  label?: string;        // An optional label (e.g., "AI", "New") to highlight the item.
  disabled?: boolean;    // If true, the navigation item is disabled.
  children?: NavItem[];  // Optional array of sub-navigation items for dropdowns or nested menus.
}

// --- Main Navigation Items Configuration (for Desktop Sidebar) ---
// This array defines the structure and content of the primary navigation menu.
// Titles are now keys for translation (e.g., 'sidebar.dashboard').
export const NAV_ITEMS: NavItem[] = [
  { title: 'sidebar.dashboard', href: '/dashboard', icon: LayoutDashboard },
  { title: 'sidebar.aiChat', href: '/chatbot', icon: Bot, label: 'AI' },
  { title: 'sidebar.generateNotes', href: '/notes', icon: FileText, label: 'AI' },
  { title: 'sidebar.college', href: '/college', icon: School, label: 'New' },
  { title: 'sidebar.customTest', href: '/custom-test', icon: TestTubeDiagonal },
  { title: 'sidebar.audioFactory', href: '/flashcards', icon: AudioLines, label: 'AI' },
  { title: 'sidebar.dailyNews', href: '/news', icon: Newspaper },
  { title: 'sidebar.library', href: '/library', icon: BookMarked },
  { title: 'sidebar.profile', href: '/profile', icon: UserCircle },
];

// --- Mobile Top Navigation ---
export const TOP_NAV_ITEMS: NavItem[] = [
  { title: 'sidebar.aiChat', href: '/chatbot', icon: Bot },
  { title: 'sidebar.dailyNews', href: '/news', icon: Newspaper },
  { title: 'sidebar.audioFactory', href: '/flashcards', icon: AudioLines },
  { title: 'sidebar.library', href: '/library', icon: BookMarked },
  { title: 'sidebar.college', href: '/college', icon: School },
];

// --- Mobile Bottom Navigation ---
export const BOTTOM_NAV_ITEMS: NavItem[] = [
  { title: 'bottombar.home', href: '/dashboard', icon: Home },
  { title: 'bottombar.generate', href: '/notes', icon: NotebookText },
  { title: 'bottombar.test', href: '/custom-test', icon: TestTubeDiagonal },
  { title: 'sidebar.library', href: '/library', icon: BookMarked },
  { title: 'sidebar.profile', href: '/profile', icon: UserCircle },
];


// --- Application Name ---
export const APP_NAME = "Nexithra";

// --- Goal Selection Cards Data ---
export const GOAL_CARDS_DATA = [
    { type: 'neet', icon: HeartPulse, title: 'NEET', description: 'Class 11 | Class 12 | Class 12+', location: 'in' },
    { type: 'jee', icon: Atom, title: 'IIT JEE', description: 'Class 11 | Class 12 | Class 12+', location: 'in' },
    { type: 'school-boards', icon: Book, title: 'School Boards (Class 9 to 12)', description: 'CBSE | ICSE | International Boards', location: 'global' },
    { type: 'ias', icon: Landmark, title: 'LM IAS', description: 'UPSC | State PSC', location: 'in' },
    { type: 'school-prep', icon: PenSquare, title: 'School Preparation (Class 3 to 8)', description: 'CBSE | ICSE | International Boards', location: 'global' },
    { type: 'olympiad', icon: Trophy, title: 'Olympiad', description: 'Government Olympiad | Private Olympiad', location: 'global' },
    { type: 'govt-exams', icon: Building, title: 'Govt. Exams', description: 'SSC | Banking | Teaching | Railway | JAIIB & CAIIB | Nursing | Judiciary | State Exams', location: 'in' },
    { type: 'entrance-exam', icon: GraduationCap, title: 'UG & PG Entrance Exam', description: 'MBA | IPMAT | IIT Jam & CSIR NET | CLAT | CUET | UGC NET | NIFT, NID & UCEED | B.ARCH| CUET PG | Pharma', location: 'global' },
    { type: 'gate', icon: Briefcase, title: 'ESE GATE & Engineering', description: 'All engineering disciplines and branches', location: 'global' },
    { type: 'finance', icon: AreaChart, title: 'Finance Course', description: 'CA | CS | CMA | All Levels', location: 'global' },
    { type: 'college', icon: School, title: 'University / College', description: 'Select your specific university, branch, and semester for curated notes.', location: 'global' },
    { type: 'general', icon: UserCircle, title: 'General Learner', description: 'Explore any topic without specific curriculum filters.', location: 'global' },
];


// --- College Feature Data ---
export const COLLEGE_DATA: Record<string, any> = {
    RGPV: {
      name: 'RGPV (Rajiv Gandhi Proudyogiki Vishwavidyalaya)',
      programs: {
        'B.Tech': {
          name: 'B.Tech',
          branches: {
            'CSE': { name: 'Computer Science and Engineering', semesters: { '1': { name: '1st', subjects: [ { id: 'rgpv-bt-1-chem', name: 'Engineering Chemistry', units: ["Water – Analysis, Treatments and Industrial Applications", "Fuels and Combustion", "Polymers and Composites", "Analytical Techniques", "Corrosion and Its Control"] }, { id: 'rgpv-bt-1-math1', name: 'Mathematics-I', units: ["Differential Calculus", "Integral Calculus", "Matrices and Linear Algebra", "Vector Calculus", "Differential Equations"] }, { id: 'rgpv-bt-1-eng', name: 'English for Communication', units: ["Fundamentals of Communication", "Sentence Structure", "Reading and Comprehension", "Technical Writing", "Professional Communication"] }, { id: 'rgpv-bt-1-bee', name: 'Basic Electrical & Electronics Engineering', units: ["D.C. Circuits", "A.C. Circuits", "Three-Phase Systems", "Electromagnetic Induction", "Basics of Electronics"] }, { id: 'rgpv-bt-1-graphics', name: 'Engineering Graphics', units: ["Introduction to Engineering Graphics", "Projections of Points and Lines", "Projections of Planes and Solids", "Orthographic Projections", "CAD and Building Information Modelling"] }, { id: 'rgpv-bt-1-mfg', name: 'Manufacturing Practices', units: ["Workshop Practices", "Machining Processes"] } ] }, '2': { name: '2nd', subjects: [ { id: 'rgpv-bt-2-phy', name: 'Engineering Physics', units: ["Quantum Mechanics", "Optics", "Electromagnetic Waves", "Solid State Physics", "Applications of Physics"] }, { id: 'rgpv-bt-2-math2', name: 'Mathematics-II', units: ["Ordinary Differential Equations", "Partial Differential Equations", "Laplace Transforms", "Fourier Series and Transforms", "Numerical Methods"] }, { id: 'rgpv-bt-2-bme', name: 'Basic Mechanical Engineering', units: ["Engineering Materials", "Thermodynamics", "Fluid Mechanics", "Mechanics of Solids", "Manufacturing Methods"] }, { id: 'rgpv-bt-2-bce', name: 'Basic Civil Engineering & Mechanics', units: ["Introduction to Civil Engineering", "Structural Analysis", "Fluid Mechanics", "Geotechnical Engineering", "Building Drawing"] }, { id: 'rgpv-bt-2-cs', name: 'Computational Skills', units: ["Introduction to Programming", "Problem-Solving"] } ] }, '3': { name: '3rd', subjects: [ { id: 'rgpv-cse-3-eee', name: 'Energy and Environmental Engineering', units: ["Energy Resources", "Ecosystems", "Biodiversity and Conservation", "Environmental Pollution", "Environmental Ethics and Disaster Management"] }, { id: 'rgpv-cse-3-ds', name: 'Discrete Structures', units: ["Set Theory and Relations", "Logic and Propositional Calculus", "Graph Theory", "Combinatorics", "Algebraic Structures"] }, { id: 'rgpv-cse-3-dsa', name: 'Data Structures', units: ["Introduction to Data Structures", "Stacks and Queues", "Trees", "Graphs", "Hashing and Advanced Data Structures"] }, { id: 'rgpv-cse-3-digitalsys', name: 'Digital Systems', units: ["Number Systems and Codes", "Logic Gates and Circuits", "Sequential Circuits", "Memory Systems", "Introduction to Microprocessors"] }, { id: 'rgpv-cse-3-oopm', name: 'Object-Oriented Programming and Methodology', units: ["Introduction to OOP", "Advanced OOP Concepts", "Exception Handling", "File Handling", "UML and Design Patterns"] }, ] }, '4': { name: '4th', subjects: [ { id: 'rgpv-cse-4-math3', name: 'Mathematics-III', units: ["Numerical Methods", "Interpolation", "Partial Differential Equations", "Probability and Statistics", "Complex Variables"] }, { id: 'rgpv-cse-4-cso', name: 'Computer System Organization', units: ["Basic Computer Architecture", "Memory Systems", "Input/Output Systems", "Pipelining and Parallelism", "Advanced Architectures"] }, { id: 'rgpv-cse-4-se', name: 'Software Engineering', units: ["Introduction to Software Engineering", "Software Design", "Software Testing", "Software Project Management", "Software Maintenance"] }, { id: 'rgpv-cse-4-ada', name: 'Analysis and Design of Algorithms', units: ["Introduction to Algorithms", "Divide and Conquer", "Greedy Algorithms", "Dynamic Programming", "Advanced Algorithms"] }, { id: 'rgpv-cse-4-os', name: 'Operating Systems', units: ["Introduction to Operating Systems", "Process Management", "Memory Management", "File Systems", "I/O and Security"] }, ] }, '5': { name: '5th', subjects: [ { id: 'rgpv-cse-5-toc', name: 'Theory of Computation', units: ["Finite Automata", "Context-Free Grammars", "Turing Machines", "Undecidability", "Complexity Theory"] }, { id: 'rgpv-cse-5-dbms', name: 'Database Management Systems', units: ["Introduction to DBMS", "Relational Model", "Database Design", "Transaction Management", "Advanced Topics"] }, { id: 'rgpv-cse-5-cn', name: 'Computer Networks', units: ["Introduction to Computer Networks", "Physical and Data Link Layers", "Network Layer", "Transport Layer", "Application Layer"] }, { id: 'rgpv-cse-5-elective1-cyber', name: 'Elective-I (Cyber Security)', units: ["Introduction to Cyber Security", "Cryptography", "Network Security", "System Security", "Cyber Forensics"] }, { id: 'rgpv-cse-5-openelective1-ai', name: 'Open Elective-I (Artificial Intelligence)', units: ["Introduction to AI", "Problem Solving", "Knowledge Representation", "Machine Learning Basics", "AI Applications"] }, ] }, '6': { name: '6th', subjects: [ { id: 'rgpv-cse-6-cd', name: 'Compiler Design', units: ["Introduction to Compilers", "Lexical Analysis", "Syntax Analysis", "Semantic Analysis", "Code Optimization and Generation"] }, { id: 'rgpv-cse-6-cg', name: 'Computer Graphics', units: ["Introduction to Computer Graphics", "2D Transformations", "3D Transformations", "Curves and Surfaces", "Animation and Rendering"] }, { id: 'rgpv-cse-6-elective2-cloud', name: 'Elective-II (Cloud Computing)', units: ["Introduction to Cloud Computing", "Cloud Architecture", "Cloud Storage", "Cloud Security", "Cloud Applications"] }, { id: 'rgpv-cse-6-openelective2-iot', name: 'Open Elective-II (Internet of Things)', units: ["Introduction to IoT", "IoT Communication", "IoT Data Management", "IoT Security", "IoT Case Studies"] }, { id: 'rgpv-cse-6-project1', name: 'Project-I', units: ["Problem identification and SRS preparation", "Design and implementation", "Testing and documentation", "Presentation and evaluation"] }, ] }, '7': { name: '7th', subjects: [ { id: 'rgpv-cse-7-ai-ml', name: 'Artificial Intelligence and Machine Learning', units: ["Introduction to AI and ML", "Supervised Learning", "Unsupervised Learning", "Neural Networks", "Advanced ML Topics"] }, { id: 'rgpv-cse-7-ds', name: 'Distributed Systems', units: ["Introduction to Distributed Systems", "Communication in Distributed Systems", "Distributed Algorithms", "Distributed File Systems", "Distributed Applications"] }, { id: 'rgpv-cse-7-elective3-data-mining', name: 'Elective-III (Data Mining and Knowledge Discovery)', units: ["Introduction to Data Mining", "Association Rule Mining", "Classification", "Clustering", "Advanced Topics"] }, { id: 'rgpv-cse-7-openelective3-blockchain', name: 'Open Elective-III (Blockchain Technology)', units: ["Introduction to Blockchain", "Blockchain Architecture", "Cryptographic Foundations", "Smart Contracts", "Enterprise Blockchain"] }, { id: 'rgpv-cse-7-project2', name: 'Project-II', units: ["Extension of Project-I", "Implementation of advanced features", "Testing, validation, and optimization", "Final presentation and report"] }, ] }, '8': { name: '8th', subjects: [ { id: 'rgpv-cse-8-big-data', name: 'Big Data Analytics', units: ["Introduction to Big Data", "Data Storage", "Data Processing", "Big Data Analytics", "Big Data Applications"] }, { id: 'rgpv-cse-8-elective4-mobile', name: 'Elective-IV (Mobile Computing)', units: ["Introduction to Mobile Computing", "Mobile Communication", "Mobile Application Development", "Mobile Security", "Advanced Topics"] }, { id: 'rgpv-cse-8-openelective4-pattern', name: 'Open Elective-IV (Pattern Recognition)', units: ["Introduction to Pattern Recognition", "Statistical Pattern Recognition", "Feature Extraction", "Classification Techniques", "Applications"] }, { id: 'rgpv-cse-8-major-project', name: 'Major Project', units: ["Full-fledged project implementation", "System design and development", "Testing, deployment, and documentation", "Presentation and viva-voce"] }, ] }, } },
            'IT': { name: 'Information Technology', semesters: { '1': { name: '1st', subjects: [ { id: 'rgpv-bt-1-chem', name: 'Engineering Chemistry', units: ["Water – Analysis, Treatments and Industrial Applications", "Fuels and Combustion", "Polymers and Composites", "Analytical Techniques", "Corrosion and Its Control"] }, { id: 'rgpv-bt-1-math1', name: 'Mathematics-I', units: ["Differential Calculus", "Integral Calculus", "Matrices and Linear Algebra", "Vector Calculus", "Differential Equations"] }, { id: 'rgpv-bt-1-eng', name: 'English for Communication', units: ["Fundamentals of Communication", "Sentence Structure", "Reading and Comprehension", "Technical Writing", "Professional Communication"] }, { id: 'rgpv-bt-1-bee', name: 'Basic Electrical & Electronics Engineering', units: ["D.C. Circuits", "A.C. Circuits", "Three-Phase Systems", "Electromagnetic Induction", "Basics of Electronics"] }, { id: 'rgpv-bt-1-graphics', name: 'Engineering Graphics', units: ["Introduction to Engineering Graphics", "Projections of Points and Lines", "Projections of Planes and Solids", "Orthographic Projections", "CAD and Building Information Modelling"] }, { id: 'rgpv-bt-1-mfg', name: 'Manufacturing Practices', units: ["Workshop Practices", "Machining Processes"] } ] }, '2': { name: '2nd', subjects: [ { id: 'rgpv-bt-2-phy', name: 'Engineering Physics', units: ["Quantum Mechanics", "Optics", "Electromagnetic Waves", "Solid State Physics", "Applications of Physics"] }, { id: 'rgpv-bt-2-math2', name: 'Mathematics-II', units: ["Ordinary Differential Equations", "Partial Differential Equations", "Laplace Transforms", "Fourier Series and Transforms", "Numerical Methods"] }, { id: 'rgpv-bt-2-bme', name: 'Basic Mechanical Engineering', units: ["Engineering Materials", "Thermodynamics", "Fluid Mechanics", "Mechanics of Solids", "Manufacturing Methods"] }, { id: 'rgpv-bt-2-bce', name: 'Basic Civil Engineering & Mechanics', units: ["Introduction to Civil Engineering", "Structural Analysis", "Fluid Mechanics", "Geotechnical Engineering", "Building Drawing"] }, { id: 'rgpv-bt-2-cs', name: 'Computational Skills', units: ["Introduction to Programming", "Problem-Solving"] } ] }, '3': { name: '3rd', subjects: [ { id: 'rgpv-it-3-math3', name: 'Mathematics-III', units: ["Numerical Methods", "Laplace Transforms", "Fourier Series and Transforms", "Partial Differential Equations", "Probability and Statistics"] }, { id: 'rgpv-it-3-ds', name: 'Data Structures', units: ["Introduction to Data Structures", "Stacks and Queues", "Trees", "Graphs", "Sorting and Searching"] }, { id: 'rgpv-it-3-dcs', name: 'Digital Circuits and Systems', units: ["Number Systems and Codes", "Logic Gates and Boolean Algebra", "Combinational Circuits", "Sequential Circuits", "Logic Families"] }, { id: 'rgpv-it-3-oop', name: 'Object-Oriented Programming', units: ["OOP Concepts", "C++ Programming", "Inheritance and Polymorphism", "Templates and Exception Handling", "File Handling and STL"] }, { id: 'rgpv-it-3-coa', name: 'Computer Organization and Architecture', units: ["Basic Computer Organization", "Instruction Set Architecture", "Memory Systems", "Control Unit", "I/O Organization"] }, { id: 'rgpv-it-3-eee', name: 'Energy, Environment, Ecology, and Society', units: ["Ecosystems", "Biodiversity", "Pollution", "Solid Waste Management", "Disaster Management"] } ] }, '4': { name: '4th', subjects: [ { id: 'rgpv-it-4-discrete', name: 'Discrete Structures', units: ["Set Theory and Logic", "Combinatorics", "Graph Theory", "Algebraic Structures", "Number Theory"] }, { id: 'rgpv-it-4-ada', name: 'Design and Analysis of Algorithms', units: ["Introduction", "Divide and Conquer", "Greedy Algorithms", "Dynamic Programming", "NP-Completeness"] }, { id: 'rgpv-it-4-os', name: 'Operating Systems', units: ["Introduction", "Process Management", "Synchronization", "Memory Management", "File Systems and I/O"] }, { id: 'rgpv-it-4-dbms', name: 'Database Management Systems', units: ["Introduction", "Relational Algebra and SQL", "Normalization", "Transaction Management", "Advanced Topics"] }, { id: 'rgpv-it-4-cn', name: 'Computer Networks', units: ["Introduction", "Physical and Data Link Layer", "Network Layer", "Transport Layer", "Application Layer"] } ] }, '5': { name: '5th', subjects: [ { id: 'rgpv-it-5-se', name: 'Software Engineering', units: ["Software Development Life Cycle", "Requirement Analysis", "Design Concepts", "Testing", "Maintenance and Quality"] }, { id: 'rgpv-it-5-java', name: 'Java Programming', units: ["Java Basics", "Advanced Java", "Multithreading", "Java I/O and Networking", "Java Frameworks"] }, { id: 'rgpv-it-5-cgmm', name: 'Computer Graphics and Multimedia', units: ["Introduction", "2D Graphics", "Transformations", "3D Graphics", "Multimedia"] }, { id: 'rgpv-it-5-toc', name: 'Theory of Computation', units: ["Finite Automata", "Regular Expressions", "Context-Free Grammars", "Turing Machines", "Computability and Complexity"] }, { id: 'rgpv-it-5-web', name: 'Web Technologies', units: ["HTML and CSS", "JavaScript", "Server-Side Scripting", "Web Frameworks", "Web Security"] } ] }, '6': { name: '6th', subjects: [ { id: 'rgpv-it-6-cd', name: 'Compiler Design', units: ["Introduction", "Syntax Analysis", "Semantic Analysis", "Code Generation", "Code Optimization and Run-Time Environment"] }, { id: 'rgpv-it-6-dcn', name: 'Data Communication and Networks', units: ["Data Communication", "Network Layer Protocols", "Transport Layer", "Wireless and Mobile Networks", "Network Security"] }, { id: 'rgpv-it-6-ai', name: 'Artificial Intelligence', units: ["Introduction", "Search Techniques", "Knowledge Representation", "Machine Learning Basics", "Applications"] }, { id: 'rgpv-it-6-spm', name: 'Software Project Management', units: ["Project Planning", "Risk Management", "Project Execution", "Agile Practices", "Tools and Standards"] }, { id: 'rgpv-it-6-cc', name: 'Cloud Computing', units: ["Introduction", "Cloud Architecture", "Virtualization", "Cloud Storage", "Applications"] } ] }, '7': { name: '7th', subjects: [ { id: 'rgpv-it-7-iot', name: 'Internet of Things (IoT)', units: ["IoT Fundamentals", "IoT Hardware", "IoT Communication", "IoT Applications", "IoT Security"] }, { id: 'rgpv-it-7-cs', name: 'Cyber Security', units: ["Introduction", "Cryptography", "Network Security", "Application Security", "Incident Response"] }, { id: 'rgpv-it-7-bda', name: 'Big Data Analytics', units: ["Introduction", "MapReduce", "NoSQL Databases", "Data Processing", "Visualization and Tools"] }, { id: 'rgpv-it-7-bt', name: 'Blockchain Technology', units: ["Introduction", "Bitcoin Blockchain", "Permissioned Blockchains", "Smart Contracts", "Applications"] } ] }, '8': { name: '8th', subjects: [ { id: 'rgpv-it-8-ml', name: 'Machine Learning', units: ["Introduction", "Regression and Classification", "Clustering and Dimensionality Reduction", "Neural Networks", "Applications"] }, { id: 'rgpv-it-8-ds', name: 'Distributed Systems', units: ["Introduction", "Communication", "Distributed Algorithms", "Distributed File Systems", "Case Studies"] }, { id: 'rgpv-it-8-mc', name: 'Mobile Computing', units: ["Introduction", "Mobile Communication", "Mobile OS", "Mobile Security", "Applications"] } ] }, } },
            'AIML': { name: 'Artificial Intelligence & Machine Learning', semesters: {} },
            'DS': { name: 'Data Science', semesters: {} },
            'IoT': { name: 'Internet of Things', semesters: {} },
            'CSBS': { name: 'Computer Science & Business Systems', semesters: {} },
            'Cyber Security': { name: 'Cyber Security', semesters: {} },
            'ECE': { name: 'Electronics and Communication Engineering', semesters: {} },
            'EE': { name: 'Electrical Engineering', semesters: {} },
            'EX': { name: 'Electrical and Electronics Engineering', semesters: {} },
            'ME': { name: 'Mechanical Engineering', semesters: {} },
            'CE': { name: 'Civil Engineering', semesters: {} },
            'AU': { name: 'Automobile Engineering', semesters: {} },
            'CM': { name: 'Chemical Engineering', semesters: {} },
            'BT': { name: 'Biotechnology', semesters: {} },
            'MI': { name: 'Mining Engineering', semesters: {} },
            'TX': { name: 'Textile Engineering', semesters: {} },
            'AN': { name: 'Aeronautical Engineering', semesters: {} },
            'PE': { name: 'Petrochemical Engineering', semesters: {} },
          }
        },
        'B.Pharm': { name: 'B.Pharm', branches: {} },
        'B.Arch': { name: 'B.Arch', branches: {} },
        'B.Sc': { name: 'B.Sc', branches: {} },
        'BCA': { name: 'BCA', branches: {} },
        'B.Com': { name: 'B.Com (Hons)', branches: {} },
        'B.Ed': { name: 'B.Ed', branches: {} },
        'MBA': { name: 'MBA', branches: {} },
        'M.Tech': { name: 'M.Tech', branches: {} },
        'M.Des': { name: 'M.Des', branches: {} },
        'MCA': { name: 'MCA', branches: {} },
        'M.Pharm': { name: 'M.Pharm', branches: {} },
        'M.Sc': { name: 'M.Sc', branches: {} },
        'M.Arch': { name: 'M.Arch', branches: {} },
        'MS': { name: 'M.S. in Cyber Law', branches: {} },
        'PhD': { name: 'Ph.D', branches: {} },
        'Dual Degree': { name: 'Dual Degree (BE/B.Tech + M.Tech/MBA)', branches: {} },
        'Diploma': { name: 'Diploma Programs', branches: {} }
      }
    },
    CBSE: {
        name: 'CBSE',
        programs: {
            'School': {
                name: 'School',
                branches: {
                    'All Subjects': {
                      semesters: {
                        '3': { name: 'Class 3', subjects: [{id: 'cbse-3-eng', name: 'English'}, {id: 'cbse-3-math', name: 'Mathematics'}, {id: 'cbse-3-evs', name: 'EVS'}, {id: 'cbse-3-hin', name: 'Hindi'}]},
                        '4': { name: 'Class 4', subjects: [{id: 'cbse-4-eng', name: 'English'}, {id: 'cbse-4-math', name: 'Mathematics'}, {id: 'cbse-4-evs', name: 'EVS'}, {id: 'cbse-4-hin', name: 'Hindi'}]},
                        '5': { name: 'Class 5', subjects: [{id: 'cbse-5-eng', name: 'English'}, {id: 'cbse-5-math', name: 'Mathematics'}, {id: 'cbse-5-evs', name: 'EVS'}, {id: 'cbse-5-hin', name: 'Hindi'}]},
                        '6': { name: 'Class 6', subjects: [{id: 'cbse-6-eng', name: 'English'}, {id: 'cbse-6-math', name: 'Mathematics'}, {id: 'cbse-6-sci', name: 'Science'}, {id: 'cbse-6-sst', name: 'Social Science'}, {id: 'cbse-6-hin', name: 'Hindi'}]},
                        '7': { name: 'Class 7', subjects: [{id: 'cbse-7-eng', name: 'English'}, {id: 'cbse-7-math', name: 'Mathematics'}, {id: 'cbse-7-sci', name: 'Science'}, {id: 'cbse-7-sst', name: 'Social Science'}, {id: 'cbse-7-hin', name: 'Hindi'}]},
                        '8': { name: 'Class 8', subjects: [{id: 'cbse-8-eng', name: 'English'}, {id: 'cbse-8-math', name: 'Mathematics'}, {id: 'cbse-8-sci', name: 'Science'}, {id: 'cbse-8-sst', name: 'Social Science'}, {id: 'cbse-8-hin', name: 'Hindi'}]},
                        '9': { name: 'Class 9', subjects: [{id: 'cbse-9-eng', name: 'English'}, {id: 'cbse-9-math', name: 'Mathematics'}, {id: 'cbse-9-sci', name: 'Science'}, {id: 'cbse-9-sst', name: 'Social Science'}, {id: 'cbse-9-hin', name: 'Hindi'}]},
                        '10': { name: 'Class 10', subjects: [{id: 'cbse-10-eng', name: 'English'}, {id: 'cbse-10-math', name: 'Mathematics'}, {id: 'cbse-10-sci', name: 'Science'}, {id: 'cbse-10-sst', name: 'Social Science'}, {id: 'cbse-10-hin', name: 'Hindi'}]},
                        '11': { name: 'Class 11', subjects: [{id: 'cbse-11-eng', name: 'English (Core)'}, {id: 'cbse-11-math', name: 'Mathematics'}, {id: 'cbse-11-phy', name: 'Physics'}, {id: 'cbse-11-chem', name: 'Chemistry'}, {id: 'cbse-11-bio', name: 'Biology'}, {id: 'cbse-11-acc', name: 'Accountancy'}, {id: 'cbse-11-bst', name: 'Business Studies'}, {id: 'cbse-11-eco', name: 'Economics'}, {id: 'cbse-11-hist', name: 'History'}, {id: 'cbse-11-polsci', name: 'Political Science'}, {id: 'cbse-11-geo', name: 'Geography'}]},
                        '12': { name: 'Class 12', subjects: [{id: 'cbse-12-eng', name: 'English (Core)'}, {id: 'cbse-12-math', name: 'Mathematics'}, {id: 'cbse-12-phy', name: 'Physics'}, {id: 'cbse-12-chem', name: 'Chemistry'}, {id: 'cbse-12-bio', name: 'Biology'}, {id: 'cbse-12-acc', name: 'Accountancy'}, {id: 'cbse-12-bst', name: 'Business Studies'}, {id: 'cbse-12-eco', name: 'Economics'}, {id: 'cbse-12-hist', name: 'History'}, {id: 'cbse-12-polsci', name: 'Political Science'}, {id: 'cbse-12-geo', name: 'Geography'}]},
                      }
                    }
                }
            }
        }
    },
    ICSE: {
        name: 'ICSE',
        programs: {}
    },
    International: {
        name: 'International Board',
        programs: {}
    }
  };


// --- App Languages (for Settings & News) ---
// Added 'englishName' for robust AI prompt translation.
export const APP_LANGUAGES: { value: string; label: string; bcp47: string; englishName: string; }[] = [
  { value: "en", label: "English", bcp47: "en-US", englishName: "English" },
  { value: "es", label: "Español (Spanish)", bcp47: "es-ES", englishName: "Spanish" },
  { value: "hi", label: "हिन्दी (Hindi)", bcp47: "hi-IN", englishName: "Hindi" },
  { value: "ja", label: "日本語 (Japanese)", bcp47: "ja-JP", englishName: "Japanese" },
  { value: "fr", label: "Français (French)", bcp47: "fr-FR", englishName: "French" },
  { value: "de", label: "Deutsch (German)", bcp47: "de-DE", englishName: "German" },
  { value: "ru", label: "Русский (Russian)", bcp47: "ru-RU", englishName: "Russian" },
  { value: "pt", label: "Português (Portuguese)", bcp47: "pt-BR", englishName: "Portuguese" },
  { value: "it", label: "Italiano (Italian)", bcp47: "it-IT", englishName: "Italian" },
  { value: "zh", label: "中文 (Chinese)", bcp47: "zh-CN", englishName: "Chinese" },
  { value: "ar", label: "العربية (Arabic)", bcp47: "ar-SA", englishName: "Arabic" },
  { value: "ko", label: "한국어 (Korean)", bcp47: "ko-KR", englishName: "Korean" },
  { value: "tr", label: "Türkçe (Turkish)", bcp47: "tr-TR", englishName: "Turkish" },
  { value: "nl", label: "Nederlands (Dutch)", bcp47: "nl-NL", englishName: "Dutch" },
  { value: "sv", label: "Svenska (Swedish)", bcp47: "sv-SE", englishName: "Swedish" },
  { value: "pl", label: "Polski (Polish)", bcp47: "pl-PL", englishName: "Polish" },
  { value: "id", label: "Bahasa Indonesia", bcp47: "id-ID", englishName: "Indonesian" },
  { value: "vi", label: "Tiếng Việt (Vietnamese)", bcp47: "vi-VN", englishName: "Vietnamese" },
  { value: "th", label: "ไทย (Thai)", bcp47: "th-TH", englishName: "Thai" },
  { value: "el", label: "Ελληνικά (Greek)", bcp47: "el-GR", englishName: "Greek" },
  { value: "he", label: "עברית (Hebrew)", bcp47: "he-IL", englishName: "Hebrew" },
  { value: "sa", label: "संस्कृतम् (Sanskrit)", bcp47: "sa-IN", englishName: "Sanskrit" },
  { value: "bn", label: "বাংলা (Bengali)", bcp47: "bn-IN", englishName: "Bengali" },
  { value: "mr", label: "मराठी (Marathi)", bcp47: "mr-IN", englishName: "Marathi" },
  { value: "ta", label: "தமிழ் (Tamil)", bcp47: "ta-IN", englishName: "Tamil" },
  { value: "te", label: "తెలుగు (Telugu)", bcp47: "te-IN", englishName: "Telugu" },
  { value: "gu", label: "ગુજરાતી (Gujarati)", bcp47: "gu-IN", englishName: "Gujarati" },
  { value: "pa", label: "ਪੰਜਾਬੀ (Punjabi)", bcp47: "pa-IN", englishName: "Punjabi" },
  { value: "ur", label: "اردو (Urdu)", bcp47: "ur-PK", englishName: "Urdu" },
  { value: "uk", label: "Українська (Ukrainian)", bcp47: "uk-UA", englishName: "Ukrainian" },
  { value: "fa", label: "فارسی (Persian)", bcp47: "fa-IR", englishName: "Persian" },
  { value: "ro", label: "Română (Romanian)", bcp47: "ro-RO", englishName: "Romanian" },
  { value: "cs", label: "Čeština (Czech)", bcp47: "cs-CZ", englishName: "Czech" },
  { value: "hu", label: "Magyar (Hungarian)", bcp47: "hu-HU", englishName: "Hungarian" },
  { value: "fi", label: "Suomi (Finnish)", bcp47: "fi-FI", englishName: "Finnish" },
  { value: "da", label: "Dansk (Danish)", bcp47: "da-DK", englishName: "Danish" },
  { value: "ms", label: "Bahasa Melayu (Malay)", bcp47: "ms-MY", englishName: "Malay" },
  { value: "fil", label: "Filipino", bcp47: "fil-PH", englishName: "Filipino" },
  { value: "sr", label: "Српски (Serbian)", bcp47: "sr-RS", englishName: "Serbian" },
  { value: "bg", label: "Български (Bulgarian)", bcp47: "bg-BG", englishName: "Bulgarian" },
  { value: "ca", label: "Català (Catalan)", bcp47: "ca-ES", englishName: "Catalan" },
  { value: "hr", "label": "Hrvatski (Croatian)", "bcp47": "hr-HR", englishName: "Croatian" },
  { value: "sk", "label": "Slovenčina (Slovak)", "bcp47": "sk-SK", englishName: "Slovak" },
  { value: "lt", "label": "Lietuvių (Lithuanian)", "bcp47": "lt-LT", englishName: "Lithuanian" },
  { value: "et", "label": "Eesti (Estonian)", "bcp47": "et-EE", englishName: "Estonian" },
];


// --- Other Helpful Resources (for Library page) ---
export const OTHER_RESOURCES = [
  { title: "library.resources.wikidata", description: "library.resources.wikidataDesc", link: "https://www.wikidata.org/", icon: BookOpen },
  { title: "library.resources.ck12", description: "library.resources.ck12Desc", link: "https://www.ck12.org/", icon: Lightbulb },
  { title: "library.resources.gutenberg", description: "library.resources.gutenbergDesc", link: "https://www.gutenberg.org/", icon: Brain },
];

// --- Dedicated Resources for the College Page ---
export const COLLEGE_RESOURCES = [
    { title: "college.resources.rgpvNotes", description: "college.resources.rgpvNotesDesc", link: "https://www.rgpvnotes.in/btech/grading-system-old/qp/", icon: GraduationCap },
    { title: "college.resources.ncert", description: "college.resources.ncertDesc", link: "https://ncert.nic.in/textbook.php", icon: GraduationCap },
    { title: "college.resources.nptel", description: "college.resources.nptelDesc", link: "/library?feature=youtube&query=NPTEL", icon: Youtube },
    { title: "college.resources.mit_ocw", description: "college.resources.mit_ocwDesc", link: "https://ocw.mit.edu/", icon: Brain },
    { title: "college.resources.khan_academy", description: "college.resources.khan_academyDesc", link: "https://www.khanacademy.org/computing/computer-science/software-engineering", icon: Lightbulb },
    { title: "college.resources.open_library", description: "college.resources.open_libraryDesc", link: "https://openlibrary.org/", icon: BookOpen },
    { title: "college.resources.replit", description: "college.resources.replitDesc", link: "https://replit.com/", icon: Code2 },
];


// --- Math Facts (Primary Source in English) ---
// This list is now the primary source for the "Daily Motivation" and "Math Fact" features.
// The AI's only job is to translate one of these facts.
export const MATH_FACTS_EN = [
  "The number 0 is the only number that cannot be represented by Roman numerals.",
  "Pi (π) is an irrational number, meaning its decimal representation never ends and never repeats.",
  "A 'googol' is 1 followed by 100 zeros.",
  "The Fibonacci sequence is found in many natural patterns, like the arrangement of seeds in a sunflower.",
  "The sum of angles in any triangle is always 180 degrees.",
  "Prime numbers are natural numbers greater than 1 that have no positive divisors other than 1 and themselves.",
  "In a room of 23 people, there's a 50% chance that two people have the same birthday.",
  "The word 'hundred' comes from the Old Norse term, 'hundrath', which actually means 120, not 100.",
  "From 0 to 1,000, the only number that has the letter 'a' in it is 'one thousand'.",
  "The spiral shapes of sunflowers and other patterns in nature follow the Fibonacci sequence."
];

// --- Motivational Quotes (Primary Source in English) ---
export const MOTIVATIONAL_QUOTES_EN = [
  { quote: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { quote: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
  { quote: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
  { quote: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
  { quote: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius" },
  { quote: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { quote: "Strive not to be a success, but rather to be of value.", author: "Albert Einstein" },
  { quote: "I have not failed. I've just found 10,000 ways that won't work.", author: "Thomas A. Edison" },
  { quote: "The mind is everything. What you think you become.", author: "Buddha" },
  { quote: "An unexamined life is not worth living.", author: "Socrates" }
];


// --- News API Categories (for News page filters) ---
// "Top Headlines" + 7 specific categories.
export const NEWS_CATEGORIES = [
  { value: "top", label: "Top Headlines" },
  { value: "business", label: "Business" },
  { value: "technology", label: "Technology" },
  { value: "sports", label: "Sports" },
  { value: "science", label: "Science" },
  { value: "health", label: "Health" },
  { value: "entertainment", label: "Entertainment" },
  { value: "world", label: "World" },
];


// --- News API Countries (for News page filters) ---
// A selection of countries with their ISO 2-letter codes.
// This list is now derived from APP_LANGUAGES for broader coverage.
export const NEWS_COUNTRIES: { value: string; label: string }[] = Array.from(
  new Map(
    APP_LANGUAGES.map(lang => {
      const countryCode = lang.bcp47.split('-')[1]?.toLowerCase();
      const countryName = new Intl.DisplayNames(['en'], { type: 'region' }).of(countryCode?.toUpperCase() || "");
      return countryCode && countryName ? [countryCode, { value: countryCode, label: countryName }] : [null, null];
    }).filter(item => item[0])
  ).values()
).sort((a, b) => a.label.localeCompare(b.label));



// --- US States (for News page, State/Region filter when US is selected) ---
export const US_STATES: { value: string; label: string }[] = [
  { value: "Alabama", label: "Alabama" }, { value: "Alaska", label: "Alaska" }, { value: "Arizona", label: "Arizona" },
  { value: "Arkansas", label: "Arkansas" }, { value: "California", label: "California" }, { value: "Colorado", label: "Colorado" },
  { value: "Connecticut", label: "Connecticut" }, { value: "Delaware", label: "Delaware" }, { value: "Florida", label: "Florida" },
  { value: "Georgia", label: "Georgia" }, { value: "Hawaii", label: "Hawaii" }, { value: "Idaho", label: "Idaho" },
  { value: "Illinois", label: "Illinois" }, { value: "Indiana", label: "Indiana" }, { value: "Iowa", label: "Iowa" },
  { value: "Kansas", label: "Kansas" }, { value: "Kentucky", label: "Kentucky" }, { value: "Louisiana", label: "Louisiana" },
  { value: "Maine", label: "Maine" }, { value: "Maryland", label: "Maryland" }, { value: "Massachusetts", label: "Massachusetts" },
  { value: "Michigan", label: "Michigan" }, { value: "Minnesota", label: "Minnesota" }, { value: "Mississippi", label: "Mississippi" },
  { value: "Missouri", label: "Missouri" }, { value: "Montana", label: "Montana" }, { value: "Nebraska", label: "Nebraska" },
  { value: "Nevada", label: "Nevada" }, { value: "New Hampshire", label: "New Hampshire" }, { value: "New Jersey", label: "New Jersey" },
  { value: "New Mexico", label: "New Mexico" }, { value: "New York", label: "New York" }, { value: "North Carolina", label: "North Carolina" },
  { value: "North Dakota", label: "North Dakota" }, { value: "Ohio", label: "Ohio" }, { value: "Oklahoma", label: "Oklahoma" },
  { value: "Oregon", label: "Oregon" }, { value: "Pennsylvania", label: "Pennsylvania" }, { value: "Rhode Island", label: "Rhode Island" },
  { value: "South Carolina", label: "South Carolina" }, { value: "South Dakota", label: "South Dakota" }, { value: "Tennessee", label: "Tennessee" },
  { value: "Texas", label: "Texas" }, { value: "Utah", label: "Utah" }, { value: "Vermont", label: "Vermont" },
  { value: "Virginia", label: "Virginia" }, { value: "Washington", label: "Washington" }, { value: "West Virginia", label: "West Virginia" },
  { value: "Wisconsin", label: "Wisconsin" }, { value: "Wyoming", label: "Wyoming" },
];

// --- Canadian Provinces and Territories ---
export const CA_PROVINCES_TERRITORIES: { value: string; label: string }[] = [
  { value: "Alberta", label: "Alberta" }, { value: "British Columbia", label: "British Columbia" }, { value: "Manitoba", label: "Manitoba" },
  { value: "New Brunswick", label: "New Brunswick" }, { value: "Newfoundland and Labrador", label: "Newfoundland and Labrador" },
  { value: "Nova Scotia", label: "Nova Scotia" }, { value: "Ontario", label: "Ontario" }, { value: "Prince Edward Island", label: "Prince Edward Island" },
  { value: "Quebec", label: "Quebec" }, { value: "Saskatchewan", label: "Saskatchewan" },
  { value: "Northwest Territories", label: "Northwest Territories" }, { value: "Nunavut", label: "Nunavut" }, { value: "Yukon", label: "Yukon" },
];

// --- Australian States and Territories ---
export const AU_STATES_TERRITORIES: { value: string; label: string }[] = [
  { value: "New South Wales", label: "New South Wales" }, { value: "Victoria", label: "Victoria" }, { value: "Queensland", label: "Queensland" },
  { value: "Western Australia", label: "Western Australia" }, { value: "South Australia", label: "South Australia" }, { value: "Tasmania", label: "Tasmania" },
  { value: "Australian Capital Territory", label: "Australian Capital Territory" }, { value: "Northern Territory", label: "Northern Territory" },
];

// --- Indian States and Union Territories (Expanded) ---
export const IN_STATES_UT: { value: string; label: string }[] = [
  { value: "Andhra Pradesh", label: "Andhra Pradesh" }, { value: "Arunachal Pradesh", label: "Arunachal Pradesh" }, { value: "Assam", label: "Assam" },
  { value: "Bihar", label: "Bihar" }, { value: "Chhattisgarh", label: "Chhattisgarh" }, { value: "Goa", label: "Goa" },
  { value: "Gujarat", label: "Gujarat" }, { value: "Haryana", label: "Haryana" }, { value: "Himachal Pradesh", label: "Himachal Pradesh" },
  { value: "Jharkhand", label: "Jharkhand" }, { value: "Karnataka", label: "Karnataka" }, { value: "Kerala", label: "Kerala" },
  { value: "Madhya Pradesh", label: "Madhya Pradesh" }, { value: "Maharashtra", label: "Maharashtra" }, { value: "Manipur", label: "Manipur" },
  { value: "Meghalaya", label: "Meghalaya" }, { value: "Mizoram", label: "Mizoram" }, { value: "Nagaland", label: "Nagaland" },
  { value: "Odisha", label: "Odisha" }, { value: "Punjab", label: "Punjab" }, { value: "Rajasthan", label: "Rajasthan" },
  { value: "Sikkim", label: "Sikkim" }, { value: "Tamil Nadu", label: "Tamil Nadu" }, { value: "Telangana", label: "Telangana" },
  { value: "Tripura", label: "Tripura" }, { value: "Uttarakhand", label: "Uttarakhand" }, { value: "Uttar Pradesh", label: "Uttar Pradesh" },
  { value: "West Bengal", label: "West Bengal" }, { value: "Andaman and Nicobar Islands", label: "Andaman & Nicobar" },
  { value: "Chandigarh", label: "Chandigarh" }, { value: "Dadra and Nagar Haveli and Daman and Diu", label: "Dadra & Nagar Haveli, Daman & Diu" },
  { value: "Delhi", label: "Delhi" }, { value: "Jammu and Kashmir", label: "Jammu & Kashmir" }, { value: "Ladakh", label: "Ladakh" },
  { value: "Lakshadweep", label: "Lakshadweep" }, { value: "Puducherry", label: "Puducherry" },
];

// --- German States (Bundesländer) ---
export const DE_STATES: { value: string; label: string }[] = [
  { value: "Baden-Württemberg", label: "Baden-Württemberg" }, { value: "Bavaria", label: "Bavaria (Bayern)" }, { value: "Berlin", label: "Berlin" },
  { value: "Brandenburg", label: "Brandenburg" }, { value: "Bremen", label: "Bremen" }, { value: "Hamburg", label: "Hamburg" },
  { value: "Hesse", label: "Hesse (Hessen)" }, { value: "Lower Saxony", label: "Lower Saxony (Niedersachsen)" },
  { value: "Mecklenburg-Vorpommern", label: "Mecklenburg-Vorpommern" }, { value: "North Rhine-Westphalia", label: "North Rhine-Westphalia (Nordrhein-Westfalen)" },
  { value: "Rhineland-Palatinate", label: "Rhineland-Palatinate (Rheinland-Pfalz)" }, { value: "Saarland", label: "Saarland" },
  { value: "Saxony", label: "Saxony (Sachsen)" }, { value: "Saxony-Anhalt", label: "Saxony-Anhalt (Sachsen-Anhalt)" },
  { value: "Schleswig-Holstein", label: "Schleswig-Holstein" }, { value: "Thuringia", label: "Thuringia (Thüringen)" },
];

// --- French Regions (Expanded a bit) ---
export const FR_REGIONS: { value: string; label: string }[] = [
  { value: "Auvergne-Rhône-Alpes", label: "Auvergne-Rhône-Alpes" }, { value: "Bourgogne-Franche-Comté", label: "Bourgogne-Franche-Comté" },
  { value: "Brittany", label: "Brittany (Bretagne)" }, { value: "Centre-Val de Loire", label: "Centre-Val de Loire" },
  { value: "Corsica", label: "Corsica (Corse)" }, { value: "Grand Est", label: "Grand Est" },
  { value: "Hauts-de-France", label: "Hauts-de-France" }, { value: "Île-de-France", label: "Île-de-France" },
  { value: "Normandy", label: "Normandy (Normandie)" }, { value: "Nouvelle-Aquitaine", label: "Nouvelle-Aquitaine" },
  { value: "Occitanie", label: "Occitanie" }, { value: "Pays de la Loire", label: "Pays de la Loire" },
  { value: "Provence-Alpes-Côte d'Azur", label: "Provence-Alpes-Côte d'Azur" },
];

// --- Japanese Prefectures ---
export const JP_PREFECTURES: { value: string; label: string }[] = [
  { value: "Hokkaido", label: "Hokkaido" }, { value: "Aomori", label: "Aomori" }, { value: "Iwate", label: "Iwate" },
  { value: "Miyagi", label: "Miyagi" }, { value: "Akita", label: "Akita" }, { value: "Yamagata", label: "Yamagata" },
  { value: "Fukushima", label: "Fukushima" }, { value: "Ibaraki", label: "Ibaraki" }, { value: "Tochigi", label: "Tochigi" },
  { value: "Gunma", label: "Gunma" }, { value: "Saitama", label: "Saitama" }, { value: "Chiba", label: "Chiba" },
  { value: "Tokyo", label: "Tokyo" }, { value: "Kanagawa", label: "Kanagawa" }, { value: "Niigata", label: "Niigata" },
  { value: "Toyama", label: "Toyama" }, { value: "Ishikawa", label: "Ishikawa" }, { value: "Fukui", label: "Fukui" },
  { value: "Yamanashi", label: "Yamanashi" }, { value: "Nagano", label: "Nagano" }, { value: "Gifu", label: "Gifu" },
  { value: "Shizuoka", label: "Shizuoka" }, { value: "Aichi", label: "Aichi" }, { value: "Mie", label: "Mie" },
  { value: "Shiga", label: "Shiga" }, { value: "Kyoto", label: "Kyoto" }, { value: "Osaka", label: "Osaka" },
  { value: "Hyogo", label: "Hyogo" }, { value: "Nara", label: "Nara" }, { value: "Wakayama", label: "Wakayama" },
  { value: "Tottori", label: "Tottori" }, { value: "Shimane", label: "Shimane" }, { value: "Okayama", label: "Okayama" },
  { value: "Hiroshima", label: "Hiroshima" }, { value: "Yamaguchi", label: "Yamaguchi" }, { value: "Tokushima", label: "Tokushima" },
  { value: "Kagawa", label: "Kagawa" }, { value: "Ehime", label: "Ehime" }, { value: "Kochi", label: "Kochi" },
  { value: "Fukuoka", label: "Fukuoka" }, { value: "Saga", label: "Saga" }, { value: "Nagasaki", label: "Nagasaki" },
  { value: "Kumamoto", label: "Kumamoto" }, { value: "Oita", label: "Oita" }, { value: "Miyazaki", label: "Miyazaki" },
  { value: "Kagoshima", label: "Kagoshima" }, { value: "Okinawa", label: "Okinawa" },
];

// --- United Arab Emirates Emirates (for News page filters) ---
export const AE_EMIRATES: { value: string; label: string }[] = [
  { value: "Abu Dhabi", label: "Abu Dhabi" },
  { value: "Ajman", label: "Ajman" },
  { value: "Dubai", label: "Dubai" },
  { value: "Fujairah", label: "Fujairah" },
  { value: "Ras Al Khaimah", label: "Ras Al Khaimah" },
  { value: "Sharjah", label: "Sharjah" },
  { value: "Umm Al Quwain", label: "Umm Al Quwain" },
];


// --- Country-Specific Regions (for News page filters) ---
// Provides a structured way to offer specific region dropdowns for certain countries.
export const COUNTRY_SPECIFIC_REGIONS: Record<string, { value: string; label: string }[]> = {
  'us': US_STATES,
  'ca': CA_PROVINCES_TERRITORIES,
  'au': AU_STATES_TERRITORIES,
  'in': IN_STATES_UT,
  'de': DE_STATES,
  'fr': FR_REGIONS,
  'jp': JP_PREFECTURES,
  'ae': AE_EMIRATES,
};


// --- Definition Challenge Words (for Arcade page) ---
// A list of words with their definitions and hints for the Definition Challenge game.
export const DEFINITION_CHALLENGE_WORDS = [
  { term: "Photosynthesis", definition: "The process by which green plants use sunlight, water, and carbon dioxide to create their own food and release oxygen.", hint: "Starts with 'P', essential for plant life." },
  { term: "Gravity", definition: "The force that attracts a body toward the center of the earth, or toward any other physical body having mass.", hint: "Keeps us on the ground, related to apples and Newton." },
  { term: "Democracy", definition: "A system of government by the whole population or all the eligible members of a state, typically through elected representatives.", hint: "Rule by the people, ancient Greek origins." },
  { term: "Mitosis", definition: "A type of cell division that results in two daughter cells each having the same number and kind of chromosomes as the parent nucleus.", hint: "Cellular reproduction, not meiosis." },
  { term: "Ecosystem", definition: "A biological community of interacting organisms and their physical environment.", hint: "Includes living and non-living components in an area." },
  { term: "Metaphor", definition: "A figure of speech in which a word or phrase is applied to an object or action to which it is not literally applicable.", hint: "Comparing without 'like' or 'as'." },
  { term: "Algorithm", definition: "A process or set of rules to be followed in calculations or other problem-solving operations, especially by a computer.", hint: "Step-by-step instructions." },
  { term: "Renaissance", definition: "The revival of art and literature under the influence of classical models in the 14th–16th centuries.", hint: "French for 'rebirth'." },
  { term: "Evaporation", definition: "The process of turning from liquid into vapor.", hint: "Water cycle component." },
  { term: "Hypothesis", definition: "A supposition or proposed explanation made on the basis of limited evidence as a starting point for further investigation.", hint: "Educated guess in science." },
  { term: "Soliloquy", definition: "An act of speaking one's thoughts aloud when by oneself or regardless of any hearers, especially by a character in a play.", hint: "Dramatic speech, alone on stage." },
  { term: "Inflation", definition: "A general increase in prices and fall in the purchasing value of money.", hint: "Economic term, money buys less." },
];

export const SCHOOL_DATA = {
    CBSE: {},
    ICSE: {},
    International: {},
  };
    






    


    
