-- projects.rg

module projects
title "Projects"

project shop_weh {
  name    "Shop Weh"
  tag     "Grocery prices in Jamaica"
  text    "Add your grocery list and Shop Weh shows which store has"
       .. "it cheapest, and how much you save."
  feature "Prices from stores across Jamaica, updated every day"
  feature "Collects prices from government price surveys and store"
       .. "websites"
  feature "Ranks stores by how much of your list they carry, not just"
       .. "price"
  feature "Works on your phone like an app"
  stack   [Next.js, TypeScript, Firebase, GitHub Actions]
  link    "Visit shopweh.store" "https://shopweh.store"
  shot    shopweh-list "Shop Weh grocery list screen with rice, sugar,"
       .. "cornmeal and flour and a Find the cheapest"
       .. "store button"
  shot    shopweh-cheapest "Shop Weh cheapest store result showing the"
       .. "total in Jamaican dollars and the possible"
       .. "saving"
}

project estore_trust {
  name    "EStore Trust"
  tag     "Check an Instagram shop before you pay"
  text    "Search for an Instagram business and see its trust score,"
       .. "the checks behind it, buyer reviews and any scam reports."
  feature "Automatic checks of each shop, with every result shown"
  feature "Owners can verify their shop to earn a higher trust level"
  feature "Proof of order is checked, with addresses blurred and kept"
       .. "private"
  feature "Accounts are phone-verified so reviews come from real"
       .. "buyers"
  stack   [Next.js, TypeScript, Supabase, OpenAI]
  link    "Open EStore Trust" "https://estoretrust.vercel.app"
  shot    estoretrust-home "EStore Trust home screen with a search bar for"
       .. "Instagram profiles, most popular shops and a"
       .. "list of scanned businesses"
  shot    estoretrust-store "EStore Trust business page for BYCHARI showing"
       .. "a trust score of 78 out of 100 and the checks"
       .. "behind it"
}

project chichi_bus {
  name    "Chichi Bus"
  tag     "When is the next JUTC bus?"
  text    "JUTC doesn’t share live bus locations, so riders share"
       .. "them with each other. Tap “I see a bus” and everyone on"
       .. "that route gets an estimate of when it will reach them."
  feature "All 159 JUTC routes and 208 stops, mapped on real roads"
  feature "Your location is only shared when you choose to"
  feature "Works offline once the routes are loaded"
  feature "Route and stop data collected from the official JUTC route"
       .. "guide"
  stack   [Preact, Firebase, Leaflet, OpenStreetMap]
  link    "Open Chichi Bus" "https://chichibus.vercel.app"
  shot    chichibus-route "Chichi Bus route 8 map from Naggo Head to"
       .. "downtown Kingston with timetable and I see a"
       .. "bus button"
  shot    chichibus-my-routes "Chichi Bus My routes screen with a map of"
       .. "nearby stops and followed routes"
}

project sequik {
  name    "Sequik"
  tag     "Rent tracking for small landlords · iOS & Android"
  text    "See what rent has come in this month, who owes what and"
       .. "which leases are ending, then log payments, store"
       .. "documents and track repairs from your phone."
  feature "Rent collected vs expected, with overdue reminders"
  feature "Tenants, properties, documents and repairs in one place"
  feature "Six months of payment history for each tenant"
  feature "Each landlord’s data and receipts are kept private"
  stack   [React Native, Expo, TypeScript, Supabase]
  link    "Join the waitlist" "https://sequik.netlify.app"
  shot    sequik-overview "Sequik rent tracker overview showing rent"
       .. "collected this month, outstanding balance and"
       .. "overdue tenants"
  shot    sequik-tenants "Sequik tenants screen listing overdue and due"
       .. "tenants with amounts owed"
}

heading "More projects"

item request_inspector {
  name    "Request Inspector"
  tag     "Developer tool"
  text    "Captures incoming HTTP requests on temporary public links"
       .. "and shows them live, so developers can see exactly what"
       .. "their apps receive. Any request can be replayed with"
       .. "changed headers or data, and it starts with one Docker"
       .. "command."
  stack   [Go, PostgreSQL, React, Docker]
  link    "GitHub" "https://github.com/RajaeDev6/request-inspector"
}

item due {
  name    "Due & ExpenseTrakr"
  tag     "In progress"
  text    "Two money apps: Due splits household bills between"
       .. "housemates, and ExpenseTrakr tracks spending across"
       .. "wallets, with recurring transactions and budgets."
  stack   [React Native, TypeScript, Firebase]
}

item public_eye {
  name    "Public Eye JA"
  tag     "Earlier project"
  text    "Take a photo of an infrastructure problem, like a pothole"
       .. "or broken light, and the app classifies it, adds your"
       .. "location and reports it to the authorities."
  stack   [React Native]
  link    "GitHub" "https://github.com/RajaeDev6/public-eye-ja"
}
