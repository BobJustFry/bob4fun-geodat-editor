# Contributing to Geodat Editor

Thank you for your interest in contributing to **Geodat Editor**! This guide will help you get started quickly.

## Quick Start

### Prerequisites
- **Node.js** 18+ (recommended 22+)
- **npm** 10+
- **Git**

### Local Development Setup

```bash
# Clone the repository
git clone https://github.com/BobJustFry/bob4fun-geodat-editor.git
cd bob4fun-geodat-editor

# Install dependencies
npm install --workspace=frontend
npm install --workspace=backend

# Start backend (from project root or backend/ directory)
cd backend
npm run dev

# In a new terminal, start frontend dev server
cd frontend
npm run dev
# Frontend will be available at http://localhost:5173
# API proxy automatically routes /api to http://localhost:3000
```

Both servers support hot reload during development.

## Project Structure

```
backend/                 # Express.js API server
├── src/
│   ├── index.js        # Server entry point (port 3000)
│   ├── routes/         # API endpoints
│   │   ├── upload.js   # File upload handler
│   │   ├── download.js # File download handler
│   │   ├── convert.js  # Format conversion
│   │   └── parse.js    # File parsing
│   ├── parsers/        # Format parsers
│   │   ├── mihomo-mrs.js
│   │   └── v2ray-dat.js
│   ├── proto/          # Protobuf definitions
│   │   └── geodata.proto
│   └── utils/
│       └── cleanup.js  # Temp file cleanup

frontend/               # React + Vite web app
├── src/
│   ├── main.jsx        # App entry point
│   ├── App.jsx         # Root component + state management
│   ├── i18n.jsx        # i18n keys (EN/RU)
│   ├── styles.css      # Global styles (CSS variables, dark/light theme)
│   ├── components/     # React components
│   │   ├── SplitEditor.jsx    # Main editor layout
│   │   ├── CategoryList.jsx   # Category sidebar
│   │   ├── RuleEditor.jsx     # Rule list & inline editor
│   │   ├── DonorPanel.jsx     # Read-only file viewer
│   │   ├── FileUploader.jsx   # Upload UI
│   │   ├── AboutModal.jsx     # About & version info
│   │   ├── Pagination.jsx     # Pagination component
│   │   └── ... (other components)
│   └── api/
│       └── client.js   # API client (axios-based)
└── public/
    ├── robots.txt      # SEO (search engine crawling)
    ├── sitemap.xml     # SEO (site index)
    └── (icons & images)
```

## Development Workflows

### Adding a New Feature

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Keep components focused and small
   - Update i18n keys in `frontend/src/i18n.jsx` for UI strings
   - Add both English and Russian translations

3. **Test locally**
   ```bash
   # Frontend dev server auto-reloads
   # Backend: `npm run dev` with `--watch` flag
   ```

4. **Build and verify**
   ```bash
   cd frontend
   npm run build
   # Check `dist/` folder is generated correctly
   ```

5. **Commit and push**
   ```bash
   git add .
   git commit -m "feat: description of your feature"
   git push origin feature/your-feature-name
   ```

6. **Open a Pull Request** 
   - Link any related issues
   - Describe what changed and why
   - Include before/after screenshots if UI-related

### Fixing a Bug

1. **Create a bug-fix branch**
   ```bash
   git checkout -b fix/bug-description
   ```

2. **Reproduce the bug locally**
   - Check if it affects frontend, backend, or both
   - Note the steps to reproduce

3. **Implement the fix**
   - Make minimal, focused changes
   - Add comments for non-obvious logic

4. **Test the fix**
   - Verify in dev mode with hot reload
   - Test edge cases

5. **Build and commit**
   ```bash
   npm run build   # in frontend/
   git add .
   git commit -m "fix: description of the fix"
   git push origin fix/bug-description
   ```

6. **Open a Pull Request** referencing the issue

### Adding Support for a New Format

Formats (`.dat`, `.mrs`, `.txt`, `.yaml`) are handled by parsers in `backend/src/parsers/`.

1. **Add a new parser**: Create `backend/src/parsers/your-format.js`
   - Export `parse(fileContent)` → returns `{ categories: [...] }`
   - Export `serialize(data)` → returns string/buffer

2. **Register in routes**: Update `backend/src/routes/parse.js` and `download.js`

3. **Add client-side support** (if needed): Update `frontend/src/api/client.js`

4. **Test**: Upload a sample file and verify parsing/serialization

## Code Style & Best Practices

### Frontend (React)
- Use **functional components** with hooks
- Keep components **under 300 lines** (split if larger)
- Use **meaningful variable names** (avoid `x`, `temp`, etc.)
- Add **PropTypes** or JSDoc comments for component props
- Use **CSS variables** for theming (defined in `styles.css`)
- i18n: Always use `i18n.t('key')` instead of hardcoded strings

### Backend (Express.js)
- Use **async/await** instead of callbacks
- Return **consistent JSON responses** with `{ success, data, error }`
- Add **error handling** for file operations
- Use **UUID** for file names (not user-controlled input)
- Clean up **temp files** after upload/processing

### General
- **No console.log** in production code (use `console.error` for errors only)
- **Keep dependencies minimal** — check before adding npm packages
- **Comment complex logic** — make reasoning clear
- **No hardcoded strings** — use i18n keys
- **Test cross-browser** — especially file upload and drag-drop

## Internationalization (i18n)

All UI strings must support English and Russian.

**Add a new string:**

1. Edit `frontend/src/i18n.jsx`:
   ```javascript
   export const i18n = {
     en: {
       myNewKey: 'My English Text',
       // ...
     },
     ru: {
       myNewKey: 'Мой русский текст',
       // ...
     }
   };
   ```

2. Use in components:
   ```jsx
   const { i18n } = useContext(I18nContext);
   <button>{i18n.t('myNewKey')}</button>
   ```

## Building & Deployment

### Build for Production
```bash
cd frontend
npm run build
# Output: dist/

cd ../backend
# Backend doesn't need explicit build, just copy src/
```

### Docker Build (Production)
```bash
# From project root
docker-compose build
docker-compose up
# App available at configured domain (via Caddy)
```

### Versioning
Update version in:
- `frontend/package.json` (version field)
- `frontend/src/App.jsx` (APP_VERSION constant, if exists)
- `frontend/src/components/AboutModal.jsx` (version display)

Use **semantic versioning**: `MAJOR.MINOR.PATCH`

## Performance Tips

- **Frontend**: Lazy-load components with `lazy/Suspense`
- **Backend**: Cache protobuf schemas after first parse
- **General**: Avoid unnecessary re-renders (useCallback, useMemo)
- **Files**: Optimize images and assets (use public/ folder)

## Testing Checklist Before PR

- [ ] App runs locally without errors
- [ ] Feature/fix works as expected
- [ ] No console errors or warnings
- [ ] i18n keys added for new strings (EN + RU)
- [ ] UI looks good in dark AND light theme
- [ ] Tested in desktop browser (Chrome, Firefox, Safari if possible)
- [ ] Build succeeds: `npm run build`
- [ ] Upload/download file workflow still works
- [ ] No hardcoded paths or environment-specific code

## Commit Message Format

Follow conventional commits for clarity:

```
feat:    New feature for users
fix:     Bug fix for users
docs:    Changes to documentation
style:   Formatting, semicolons, etc. (not functional change)
refactor: Code restructuring without feature/bug change
perf:    Performance improvements
chore:   Dependencies, CI config, etc.
```

**Examples:**
- `feat: add drag-and-drop file upload`
- `fix: correct IPv4 mask calculation for trailing zeros`
- `docs: update setup instructions`

## Resources

- **Documentation**: See [README.md](README.md) for project overview
- **SEO**: See [SEO_OPTIMIZATION.md](SEO_OPTIMIZATION.md) for search optimization
- **Issues**: Check GitHub Issues for bugs and feature requests
- **Proto**: See `backend/src/proto/geodata.proto` for data structure docs

## Questions?

- Open an **Issue** for bugs and feature requests
- Check existing **Issues/PRs** before reporting duplicates
- Ask in commit comments if help needed during review

---

**Happy coding!** 🚀 We appreciate your contributions to making Geodat Editor better.
