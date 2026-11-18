# Rajae - Personal Portfolio

A clean and minimal portfolio website that highlights my software engineering and cybersecurity work.  
The site focuses on clarity, structure, and simple navigation while showcasing my software engineering projects and experience.

Live Demo: [Rajae's portfolio](https://rajaedev.space)

---

## Tech Used

- **HTML**
- **CSS** (hand-written, no framework), inlined into the page so nothing blocks the first render
- **JavaScript**
- **Nunito Sans**, a self-hosted Latin subset with preload
- **Hugeicons** as an inline SVG sprite

No frameworks or build tools - the site is lightweight and loads quickly by design.

Styles live in `assets/styles.css`. After editing it, run `python3 tools/inline-css.py` to copy it into `index.html` and `projects.html` and update the CSP hash in `_headers`.

---

## Features

### **1. Responsive Layout**
Works smoothly across desktop, tablet, and mobile.  
Includes a clean mobile hamburger menu with auto-close behavior.

### **2. Work**
The home page opens with what I build: apps for everyday problems in Jamaica. Four short project tiles (Shop Weh, EStore Trust, Chichi Bus, Sequik) link to `projects.html` (served at `/projects`), which has the full write-ups and screenshots, security tools and labs, and smaller projects.

### **3. Security**
SOC Shift (security analyst training), CoreSight (log search) and PingSweeper (network scanner).

### **4. Experience, Skills & Education**
- Software Engineer Intern at the Jamaica Artificial Intelligence Association
- Contributed to open source (Talawa API)

### **SEO**
- Descriptive title, meta description and keywords
- Open Graph and Twitter card tags with a social preview image (`assets/og-image.jpg`)
- JSON-LD structured data (Person, WebSite and a list of projects)
- Canonical URL, `robots.txt` and `sitemap.xml`
- Semantic HTML, alt text on every screenshot, and no render-blocking CSS framework

### **Security headers**
`_headers` sets a strict Content-Security-Policy (no inline scripts or styles), HSTS, `nosniff`, a referrer policy, a permissions policy and frame blocking for Netlify.

### **5. Navigation**
The nav highlights the section you're reading as you scroll. Motion is limited to small hover effects and is turned off for visitors who prefer reduced motion.

### **6. Look**
Dark and warm, with Nunito Sans and one gold accent. Copy is short and plain.

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

- **Add a downloadable resume button**  
- **Add a blog section** for technical writeups (Go, Linux, cyber labs, etc.)

---

## 📬 Contact

If you want to reach out:

- LinkedIn: https://linkedin.com/in/rajae-g


