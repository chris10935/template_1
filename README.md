# Hawthorne & Vale Law Office Website Template

A professional law firm website template with a modern design, featuring practice area information, contact forms, and an AI-powered legal assistant chatbot.

## Features

- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Multiple Pages**: Home, About, Services, Contact, and Privacy pages
- **Legal Assistant**: RAG-based retrieval system for answering common legal questions
- **Professional Layout**: Clean, modern design suitable for law firms and legal professionals

## GitHub Pages Deployment

This website is automatically deployed to GitHub Pages using GitHub Actions.

### Setup Instructions

1. **Enable GitHub Pages** in your repository:
   - Go to Settings → Pages
   - Under "Build and deployment", select "GitHub Actions" as the source

2. **Merge to Main Branch**: 
   - Once changes are merged to the `main` branch, the GitHub Actions workflow will automatically deploy the site

3. **Manual Deployment** (optional):
   - Go to Actions tab in your repository
   - Select "Deploy to GitHub Pages" workflow
   - Click "Run workflow" to manually trigger a deployment

### Accessing Your Site

After deployment, your site will be available at:
```
https://chris10935.github.io/template_1/
```

## Local Development

To run this website locally:

1. Clone the repository:
   ```bash
   git clone https://github.com/chris10935/template_1.git
   cd template_1
   ```

2. Open the website:
   - Simply open `index.html` in your web browser
   - Or use a local web server like `python -m http.server` or `npx serve`

## Structure

```
.
├── index.html              # Root redirect page
├── site/                   # Main website files
│   ├── index.html         # Home page
│   ├── about.html         # About page
│   ├── services.html      # Services page
│   ├── contact.html       # Contact page
│   ├── privacy.html       # Privacy policy
│   ├── css/               # Stylesheets
│   ├── js/                # JavaScript files
│   ├── assets/            # Images and assets
│   └── data/              # Data files for RAG system
└── .github/
    └── workflows/
        └── deploy-pages.yml  # GitHub Actions deployment workflow
```

## Customization

To customize the website for your law firm:

1. Edit the content in the HTML files under the `site/` directory
2. Update the logo and images in `site/assets/`
3. Modify styles in `site/css/styles.css`
4. Update contact information throughout the site

## License

This is a template project. Feel free to use and modify it for your needs.
