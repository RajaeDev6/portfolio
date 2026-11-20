-- skills.rg

module skills
title "Skills"

skills stack {
  group   "Languages"
       .. [TypeScript, JavaScript, Go]
       .. [Python, Rust, SQL, Bash]
  group   "Web & mobile"
       .. [React, React Native, Expo]
       .. [Next.js]
  group   "Backend"
       .. [FastAPI, Flask, PostgreSQL]
       .. [Supabase, Firebase, MongoDB]
       .. [REST APIs, GraphQL, OpenAI API]
  group   "Security"
       .. [Wireshark, Nmap, Kali Linux]
       .. [log analysis, alert triage]
       .. [MITRE ATT&CK]
  group   "Tools"
       .. [Git, GitHub Actions, Docker]
       .. [CI/CD, Linux, Vercel]
}
