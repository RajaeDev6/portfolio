-- about.rg
-- written in rg, a small language I made for this site.
-- the preview on the right is the interpreter's output.

module about

profile rajae {
  name    "Rajae Givans"
  role    "Cybersecurity and software engineering student, based in"
       .. "Kingston, Jamaica."
  bio     "I build and deploy full-stack web apps, mobile apps and"
       .. "APIs in TypeScript, Go and Python, with a focus on backend"
       .. "development, secure design and AI features built on LLM"
       .. "APIs. I’ve shipped production features as a software"
       .. "engineer intern and contributed to open source."
  button  "See my projects" -> :e projects
  button  "Email me" -> mail
  social  github "https://github.com/RajaeDev6"
  social  linkedin "https://linkedin.com/in/rajae-g"
}
