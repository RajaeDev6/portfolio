-- security.rg

module security
title "Security Projects"

item soc_shift {
  name    "SOC Shift"
  tag     "Security analyst training"
  text    "Practice the day-to-day work of a security analyst."
       .. "Classify each alert in a queue as a real threat, a false"
       .. "alarm or expected activity, rank the real threats, and map"
       .. "them to MITRE ATT&CK tactics. Other shifts give you an"
       .. "inbox to sort phishing from legitimate email. Fifteen"
       .. "shifts get harder as you go, and each ends with a score"
       .. "and an explanation of every call."
  stack   [JavaScript, Firebase]
  link    "Open SOC Shift" "https://socshift.vercel.app"
}

item coresight {
  name    "CoreSight"
  tag     "Log search"
  text    "Parses syslog, login and web access logs into a searchable"
       .. "index. You can filter with its own query operators, and it"
       .. "flags suspicious patterns such as repeated failed logins"
       .. "from one address."
  stack   [Python]
  link    "GitHub" "https://github.com/RajaeDev6/coresight"
}

item pingsweeper {
  name    "PingSweeper"
  tag     "Network scanner"
  text    "Sends ICMP echo requests (pings) to every address in a"
       .. "subnet at the same time using Go’s goroutines, then"
       .. "reports which hosts are up and how long each took to"
       .. "respond."
  stack   [Go]
  link    "GitHub" "https://github.com/RajaeDev6/PingSweeper"
}

heading "Labs from my degree"

item pentest {
  name    "Penetration test"
  tag     "GreenFields Financial Services · Team of 3"
  text    "Scanned, exploited and reported on a deliberately"
       .. "vulnerable network, capturing unencrypted passwords and"
       .. "presenting a fix plan in an executive summary."
  stack   [Kali Linux, Wireshark]
}

item vuln_assessment {
  name    "Vulnerability assessment"
  tag     "University lab"
  text    "Inventoried services, ports and software versions on a"
       .. "Windows system, researched known CVEs in NVD and MITRE,"
       .. "and wrote up the risks and fixes."
  stack   [Nmap, PowerShell, CVE research]
}

item network_lab {
  name    "Network security lab"
  tag     "University lab"
  text    "Analyzed DNS, web and ICMP traffic in Wireshark, scanned"
       .. "hosts for open ports, and configured firewall rules to"
       .. "block unwanted connections."
  stack   [Wireshark, Nmap, Windows Firewall]
}
