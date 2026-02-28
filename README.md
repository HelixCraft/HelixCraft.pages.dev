# HelixCraft Portfolio

Modern, clean portfolio site for HelixCraft's projects.

## Features

- 🌓 Dark/Light mode toggle
- 📱 Fully responsive design
- ⚡ Fast client-side routing (SPA)
- 🔄 Dynamic GitHub data fetching
- 📊 Sortable repository table
- 🎨 Clean, minimal design with glassmorphism

## Local Development

### Option 1: Python HTTP Server

```bash
python3 -m http.server 8000
```

### Option 2: Node.js HTTP Server

```bash
npx http-server -p 8000
```

### Option 3: PHP Built-in Server

```bash
php -S localhost:8000
```

Then open `http://localhost:8000` in your browser.

## Deployment

This is a static site that can be deployed to:

- GitHub Pages
- Netlify
- Vercel
- Cloudflare Pages
- Any static hosting service

For proper routing on static hosts, you may need to configure redirects:

- All routes should redirect to `/index.html`
- This allows the client-side router to handle navigation

### Example: Netlify `_redirects` file

```
/*    /index.html   200
```

### Example: Vercel `vercel.json` file

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

## Structure

- `index.html` - Main HTML shell
- `style.css` - All styles (dark/light mode)
- `script.js` - Client-side routing, GitHub API, interactions

## Pages

- `/` - Projects (featured + all repos)
- `/activity` - GitHub contributions & stats
- `/about` - Bio, tech stack, social links
- `/donate` - BTC, LTC, PayPal donation info
