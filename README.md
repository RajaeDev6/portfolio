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
- **Hugeicons** as an inline SVG sprite, plus Devicon badges

No frameworks or build tools - the site is lightweight and loads quickly by design.

Styles live in `assets/styles.css`. After editing it, run `python3 tools/inline-css.py` to copy it into `index.html` and `projects.html` and update the CSP hash in `_headers`.

---

## Features

### **1. Responsive Layout**
Works smoothly across desktop, tablet, and mobile.  
Includes a clean mobile hamburger menu with auto-close behavior.

### **2. Security**
The home page has a Security section: SOC Shift (SOC analyst training platform), CoreSight (log analysis engine) and PingSweeper (subnet scanner), next to the security habits that carry into the apps (row-level security, private storage with signed URLs, opt-in location, a strict CSP on this site).

### **3. Projects**
The home page shows four short picks (Shop Weh, EStore Trust, Chichi Bus, Sequik) that link to `projects.html` (served at `/projects`). That page has the full write-ups and screenshots:
- Shop Weh: grocery price comparison for Jamaica ([shopweh.store](https://shopweh.store))
- EStore Trust: scam checker for Jamaican Instagram shops ([estoretrust.vercel.app](https://estoretrust.vercel.app))
- Sequik: rent tracker for landlords ([sequik.netlify.app](https://sequik.netlify.app))
- Chichi Bus: crowdsourced JUTC bus tracker ([chichibus.vercel.app](https://chichibus.vercel.app))
- Security tools and labs from my degree (penetration test, vulnerability assessment, network security)
- Request Inspector, Due & ExpenseTrakr and Public Eye JA in a compact, expandable list

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

### **5. Restrained Motion**
The hero rises slightly on load; everything else is static. Motion is turned off for visitors who prefer reduced motion.

### **6. Minimalist Aesthetic**
Dark theme with cool grays and a teal accent, with a plain-text `now.txt` note beside the hero. Type and icons follow EStore Trust (Nunito Sans, Hugeicons), with 20px cards, 10px inner tiles, and pill-shaped buttons and chips.

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


