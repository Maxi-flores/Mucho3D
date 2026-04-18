# Mucho3D V2 - Engineering OS

A next-generation 3D printing platform built with modern web technologies. Features a professional 3D studio, AI-powered command palette, and integrated marketplace.

![Mucho3D Banner](https://via.placeholder.com/1200x300/050505/00A3FF?text=Mucho3D+V2+-+Engineering+OS)

## Features

### 🎨 3D Studio
- Interactive 3D viewport powered by **React Three Fiber**
- Engineering grid with infinite scrolling
- Wireframe mesh visualization
- Real-time camera controls
- Technical HUD with FPS counter and scene stats

### 🤖 AI Command Palette
- Keyboard shortcut (`Cmd+K` / `Ctrl+K`) for instant access
- Fuzzy search for commands
- Chat interface for AI assistance
- Command categories and shortcuts

### 🛒 Integrated Shop
- Bento grid layout with dynamic card sizes
- Product filtering and search
- Shopping cart with persistent storage
- Product detail modal with specifications

### 🎯 Modern UI/UX
- **Glassmorphism** design system
- Dark-mode-first aesthetic
- Smooth animations with **Framer Motion**
- Responsive layout (mobile-first)
- **Linear/Vercel-inspired** styling

## Tech Stack

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool & dev server
- **Tailwind CSS** - Utility-first styling

### 3D Graphics
- **Three.js** - 3D rendering engine
- **React Three Fiber** - React renderer for Three.js
- **@react-three/drei** - Useful helpers for R3F

### State Management
- **Zustand** - Lightweight state management
- **Zustand Persist** - LocalStorage persistence

### Routing & Navigation
- **React Router v6** - Client-side routing

### Animation
- **Framer Motion** - Declarative animations

### Icons & UI
- **Lucide React** - Icon library
- **clsx** + **tailwind-merge** - Conditional classes

## Getting Started

### Prerequisites
- Node.js 18+
- npm 9+

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd Mucho3D
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env.local
```

4. Start development server:
```bash
npm run dev
```

The app runs locally at `http://127.0.0.1:3000`

No cloud services are required for the default local setup. AI chat is disabled by default until you point `VITE_API_BASE_URL` at a local backend.

### Build for Production

```bash
npm run build
npm run preview
```

## Project Structure

```
mucho3d-v2/
├── public/                 # Static assets
├── src/
│   ├── components/         # React components
│   │   ├── 3d/            # Three.js/R3F components
│   │   ├── ai/            # Command palette & chat
│   │   ├── layout/        # Layout components
│   │   ├── shop/          # Shop components
│   │   ├── shared/        # Shared components (Logo, etc.)
│   │   └── ui/            # Base UI components
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utilities & constants
│   ├── pages/             # Page components
│   ├── store/             # Zustand stores
│   ├── styles/            # Global CSS
│   ├── types/             # TypeScript definitions
│   ├── App.tsx            # Root component
│   ├── main.tsx           # Entry point
│   └── router.tsx         # Route configuration
├── index.html             # HTML entry
├── package.json           # Dependencies
├── tsconfig.json          # TypeScript config
├── vite.config.ts         # Vite config
├── tailwind.config.js     # Tailwind config
└── README.md              # This file
```

## Design System

### Colors
- **Background:** `#050505` (near-black)
- **Primary:** `#00A3FF` (electric blue)
- **Surface:** Glassmorphism with `rgba(30, 41, 59, 0.4)`

### Typography
- **Headings:** Geist Mono / JetBrains Mono
- **Body:** Inter / System Sans

### Effects
- Backdrop blur for glass panels
- Glow effects on primary elements
- Smooth spring animations
- Engineering grid patterns

## Keyboard Shortcuts

- `Cmd+K` / `Ctrl+K` - Open command palette
- `Cmd+B` / `Ctrl+B` - Toggle sidebar
- `Esc` - Close modals/palette

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run type-check` - Check TypeScript types

## Deployment

### Azure Static Web Apps

1. Build the project:
```bash
npm run build
```

2. Deploy the `dist/` folder to Azure Static Web Apps

3. Configure `staticwebapp.config.json` for routing

### Other Platforms

The built output in `dist/` can be deployed to:
- Vercel
- Netlify
- Cloudflare Pages
- Any static hosting service

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari 14+, Chrome Android 90+)

## Performance

- Lighthouse Score: 95+ on all metrics
- 60 FPS 3D rendering
- Code splitting for optimal load times
- Tree-shaking for minimal bundle size
- Lazy loading for routes

## License

ISC

## Author

Max - Mucho3D Team

## Acknowledgments

- [Three.js](https://threejs.org/) - 3D graphics library
- [React Three Fiber](https://github.com/pmndrs/react-three-fiber) - React renderer for Three.js
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [Framer Motion](https://www.framer.com/motion/) - Animation library
- [Zustand](https://github.com/pmndrs/zustand) - State management
- [Lucide](https://lucide.dev/) - Icon library

---

Built with ❤️ using modern web technologies
