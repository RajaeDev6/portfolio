# Rajae - Personal Portfolio

A clean and minimal portfolio website that highlights my software engineering and cybersecurity work.  
The site focuses on clarity, structure, and simple navigation while showcasing my software engineering projects and experience.

Live Demo: [Rajae's portfolio](https://rajaedev.space)

---

## Tech Used

- **HTML**
- **CSS** (hand-written, no framework), inlined into the page so nothing blocks the first render
- **JavaScript**
- **Inter** and **Source Serif 4**, self-hosted Latin subsets with preload
- **Phosphor icons** as an inline SVG sprite, plus Devicon badges

No frameworks or build tools - the site is lightweight and loads quickly by design.

Styles live in `assets/styles.css`. After editing it, run `python3 tools/inline-css.py` to copy it into `index.html` and update the CSP hash in `_headers`.

---

## Features

### **1. Responsive Layout**
Works smoothly across desktop, tablet, and mobile.  
Includes a clean mobile hamburger menu with auto-close behavior.

### **2. Projects Section**
Featured, with screenshots:
- Shop Weh: grocery price comparison for Jamaica ([shopweh.store](https://shopweh.store))
- Chichi Bus: crowdsourced JUTC bus tracker ([chichibus.vercel.app](https://chichibus.vercel.app))
- Sequik: rent tracker for landlords ([sequik.netlify.app](https://sequik.netlify.app))

The rest sit in a compact list: one row per project, which opens to show the details. Also: EStore Trust (scam checker for Jamaican Instagram shops, [estoretrust.vercel.app](https://estoretrust.vercel.app)), SOC Shift, Kaaty, The Forgotten Maze, Request Inspector, Due & ExpenseTrakr, plus earlier work (PingSweeper, CoreSight, Public Eye JA).

### **3. Experience, Skills & Education**
- Software Engineer Intern at the Jamaica Artificial Intelligence Association
- Open-source contribution to Talawa API

### **SEO**
- Descriptive title, meta description and keywords
- Open Graph and Twitter card tags with a social preview image (`assets/og-image.jpg`)
- JSON-LD structured data (Person, WebSite and a list of projects)
- Canonical URL, `robots.txt` and `sitemap.xml`
- Semantic HTML, alt text on every screenshot, and no render-blocking CSS framework

### **Security headers**
`_headers` sets a strict Content-Security-Policy (no inline scripts or styles), HSTS, `nosniff`, a referrer policy, a permissions policy and frame blocking for Netlify.

### **4. Restrained Motion**
The hero rises slightly on load; everything else is static. Motion is turned off for visitors who prefer reduced motion.

### **5. Minimalist Aesthetic**
Dark theme with soft grays and a tan accent. Type, icons, corners and spacing follow my apps (Shop Weh): Inter with Source Serif 4 titles, Phosphor icons, 20px cards with 10px inner tiles, and pill-shaped buttons and chips.

---

## The Process

The goal was to build a portfolio that reflects how I approach software:  
simple, functional, and intentional.

1. **Design First**  
   Planned a clean layout with clear sections and consistent spacing.  
   Prioritized readability over decoration.

2. **Plain CSS**  
   Started with Tailwind's CDN, then moved to a small hand-written stylesheet so the page loads faster.

3. **Mobile Experience**  
   Focused heavily on mobile:
   - hamburger menu  
   - auto-closing navigation  
   - smooth scrolling  
   - clean spacing  

4. **Content Structure**  
   Split the work into:
   - About  
   - Software Projects  
   - Cybersecurity Projects  
   - Skills  
   - Certifications  
   - Contact  

   This keeps the portfolio balanced between software engineering and cybersecurity.

5. **Performance**  
   Avoided frameworks and build pipelines to keep things simple and load times extremely fast.

---

## 🔧 How It Can Be Improved

Some future enhancements I’m considering:

- **Dedicated project pages** for deeper breakdowns  
- **Add a downloadable resume button**  
- **Add a blog section** for technical writeups (Go, Linux, cyber labs, etc.)

---

## 📬 Contact

If you want to reach out:

- LinkedIn: https://linkedin.com/in/rajae-g


