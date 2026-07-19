# Pulkit Awasthi — Portfolio Website

A fast, static portfolio (plain HTML / CSS / JavaScript — no build step, no server needed)
with a built-in **Case Study Manager** so you can add and edit your work without touching code.

## Files

```
pulkit portfolio/
├── index.html          Home — hero, filterable work grid (Apps / Websites), about, contact
├── case-study.html     Reusable case-study template (opens when you click "View project")
├── admin.html          Case Study Manager (your CRM) — add / edit / delete projects
├── css/styles.css      All styling. Colours are variables at the very top — change once.
├── js/
│   ├── projects.js     Your content "database" (the published projects)
│   ├── store.js        Shared helper
│   ├── main.js         Renders the home grid + filters
│   ├── case-study.js   Renders a case-study page
│   └── admin.js        Powers the CRM
├── images/             Sample mockups (replace with your own)
└── README.md           This file
```

## How to view it

Double-click **index.html** to open it in your browser. That's it.
(For everything to work smoothly you can also run a tiny local server — see bottom.)

## Manage everything from one place (no code)

Open **admin.html** in your browser. It's a private CMS with two tabs:

**1. Site content** — edit every section of the site:
- Profile photo, Hero (big name, tagline, badges), Intro (headline, bio, stats, photo sticker)
- Companies, About heading/description, Experience timeline (add/remove entries)
- Skills, Tools, Education, and Contact details
- Edit the fields, then click **Save content**.

**2. Case studies** — add / edit / delete your project case studies:
- Title, type (App or Website), cover image, mockups, and the case-study sections.
- Click **Add project**, or **Edit** / **Delete** any existing one.

Then to publish:
1. Click **Preview site** (opens the home page with your unsaved changes) to check.
2. Click **Download projects.js** (top-right).
3. Move that downloaded `projects.js` into the `js/` folder, replacing the old one.

That last step "publishes" your changes so anyone opening the site sees them.
Uploaded images are embedded into the file automatically, so you don't manage image files separately.

## Nobody else can edit your site

This is built so that **only you** can change what's on the site:

- The public pages (`index.html`, `case-study.html`) read **only** from `js/projects.js` —
  the file you publish. Nothing a visitor does in their own browser can change it.
- `admin.html` edits a **private draft in your own browser** and never touches the live site.
  It only produces a new `projects.js` for you to publish.
- **When you share/host the site, simply do not upload `admin.html` and `js/admin.js`.**
  Then the editor doesn't exist online at all — visitors can only view.

## Change the colours

Open `css/styles.css` and edit the 6 variables at the very top (`--bg`, `--text`,
`--accent`, etc.). The whole site re-themes instantly.

## Publishing online (free options)

- **Netlify Drop**: drag the whole `pulkit portfolio` folder onto https://app.netlify.com/drop
- **GitHub Pages**: push the folder to a repo and enable Pages
- **Vercel**: import the folder

## Tip: run a local server (optional)

Some browsers restrict features on `file://`. To be safe:

```
cd "pulkit portfolio"
python3 -m http.server 8000
```

Then open http://localhost:8000
