# Mucho3D V3 - Quick Start Guide

Welcome to **Mucho3D V3** - the fully operational 3D printing engineering platform!

## ⚡ 30-Second Setup

### Prerequisites
- Node.js 18+ installed
- npm 9+ installed

### Installation
```bash
# 1. Navigate to project directory
cd Mucho3D

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev

# 4. Open browser to http://127.0.0.1:3000
```

That's it! 🎉

---

## 🎯 Your First 5 Minutes

### 1. **Explore the Dashboard** (1 min)
- Visit the Dashboard on startup
- See real-time stats and widgets
- Check out the 3D preview
- Browse featured products

### 2. **Try the 3D Studio** (2 min)
- Click "Try Studio" button
- Click in the 3D viewport to view the scene
- Use **Ctrl+K** (or **Cmd+K** on Mac) to open the command palette
- Create a new object: Use the left sidebar's "Create" panel
- Rotate camera: Click and drag in viewport

### 3. **Edit an Object** (1 min)
- Click on an object in the 3D scene
- Right sidebar shows object properties
- Try changing:
  - **Name** - Edit the object name
  - **Color** - Pick a new color
  - **Position** - Adjust X, Y, Z values
  - **Scale** - Make it bigger or smaller

### 4. **Explore the Shop** (1 min)
- Navigate to Shop
- Search for "filament"
- Sort by price
- Click a product to see details
- Add item to cart

---

## ⌨️ Essential Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Ctrl+K` / `Cmd+K` | Open command palette |
| `ESC` | Close dialogs |
| `↑` `↓` | Navigate commands |
| `Enter` | Execute command |

---

## 🎮 Studio Controls Guide

### Object Management (Left Sidebar)
- **Create Panel** - Add new objects (box, sphere, torus, etc.)
- **Objects List** - See all scene objects
  - Click to select
  - Eye icon to toggle visibility
  - Trash icon to delete

### Property Editor (Right Sidebar)
- **Display Section** - Toggle grid, wireframe, HUD
- **Properties Panel** - Edit selected object
  - Name, color, position, rotation, scale
- **File Operations** - Save and export

### 3D Viewport (Center)
- **Left-Click + Drag** - Rotate view
- **Right-Click + Drag** - Pan view
- **Scroll** - Zoom in/out
- **Click Object** - Select it

### Buttons (Top Right)
- **Play/Pause** - Toggle animation
- **Reset** - Reset camera to default

---

## 🛒 Shopping Quick Tips

### Search & Filter
1. Use search bar to find products
2. Click category badges to filter
3. Use sort dropdown for price/name

### Adding to Cart
1. Click product card
2. View details in modal
3. Use product details to add items

### Cart Features
- Cart persists between sessions
- Auto-save to browser storage
- Quantity adjustment in cart
- One-click checkout (when backend ready)

---

## 💡 Pro Tips

### Keyboard Power User
- Press `Ctrl+K` to access all commands
- Navigate with arrow keys
- Press Enter to execute

### Save Your Work
- Click "Save Project" to browser storage
- Click "Export as JSON" to download file
- Import later to continue work

### Organize Objects
1. Use descriptive names
2. Assign colors for visual grouping
3. Hide objects you're not working on
4. Duplicate objects for variations

### Performance
- Toggle grid/wireframe if FPS drops
- Fewer objects = better performance
- Close command palette when not needed

---

## 🐛 Troubleshooting

### 3D Viewport Not Showing
- Check browser GPU support
- Try Chrome/Edge first (best compatibility)
- Check console for WebGL errors
- Refresh the page

### Commands Not Appearing
- Ensure command palette is open (Ctrl+K)
- Try typing different keywords
- Check ARCHITECTURE.md for full command list

### Objects Not Updating
- Make sure object is selected (highlighted in list)
- Check console for errors
- Try refreshing the page

### Cart Items Not Saving
- Check browser localStorage is enabled
- Try clearing cache and reloading
- Verify you're clicking "Add to Cart"

---

## 📚 Further Learning

### Documentation
- **ARCHITECTURE.md** - System design and components
- **V3_RELEASE_NOTES.md** - Complete feature list
- **README.md** - Project overview

### Code Structure
```
src/
├── pages/         # Page components (Home, Dashboard, Studio, Shop)
├── components/    # UI components organized by feature
│   ├── 3d/       # 3D rendering components
│   ├── studio/   # Studio-specific components
│   ├── shop/     # Shop components
│   ├── ai/       # Command palette components
│   ├── layout/   # Layout components
│   └── ui/       # Base UI components
├── store/        # Zustand state stores
├── hooks/        # Custom React hooks
├── lib/          # Utilities, constants, animations
└── types/        # TypeScript type definitions
```

---

## 🚀 Next Steps

1. **Create your first project**
   - Go to Studio
   - Create several objects
   - Arrange them in 3D space
   - Save your work

2. **Explore all features**
   - Visit Dashboard for stats
   - Browse Shop for products
   - Use Command Palette extensively
   - Try keyboard shortcuts

3. **Customize**
   - Change object colors
   - Name objects meaningfully
   - Organize your scene
   - Export and share projects

4. **Share feedback**
   - Use command palette to report issues
   - Check console for errors
   - Review V3_RELEASE_NOTES.md for known limitations

---

## 📞 Quick Reference

### Development Commands
```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run type-check   # Check TypeScript types
```

### Important URLs
- Landing: http://127.0.0.1:3000/
- Dashboard: http://127.0.0.1:3000/dashboard
- Studio: http://127.0.0.1:3000/studio
- Shop: http://127.0.0.1:3000/shop
- Health: http://127.0.0.1:3000/health

---

## 🎉 You're All Set!

Mucho3D V3 is **fully operational** and ready to use. Enjoy exploring the future of 3D printing!

**Pro Tip:** Open developer tools (F12) to see real-time performance metrics and debug information.

---

**Questions?** Check the ARCHITECTURE.md file or review the V3_RELEASE_NOTES.md for comprehensive documentation.

**Built with ❤️ using React, Three.js, and TypeScript**
