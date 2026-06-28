# EcoAudit - Community Waste Logger

EcoAudit is a community waste logging web application built as part of the CodeChef VITC Projects Department recruitment task. Users can log their waste disposal with automatic GPS location capture, and a community manager can monitor all activity.

## Live Demo
https://ecoaudit-one.vercel.app/

## Tech Stack
- Frontend: HTML, CSS, JavaScript
- Database and Auth: Supabase (PostgreSQL)
- File Storage: Supabase Storage
- Maps: Leaflet.js with OpenStreetMap
- Reverse Geocoding: Nominatim (OpenStreetMap)
- Deployment: GitHub Pages
## APIs Used
- Supabase API: database, authentication and file storage
- Browser Geolocation API: automatic GPS coordinate capture
- Nominatim (OpenStreetMap): reverse geocoding coordinates to place names
- Leaflet.js with OpenStreetMap tiles: interactive map rendering
## Features

### User
- Signup and login with username and password
- Dashboard with total waste logged, number of disposals, frequent disposal location
- Top 3 waste categories by weight
- Notice board to view messages from the community manager
- Map showing current location and past disposal pins
- Log waste with category, weight, optional photo and automatic GPS capture
- View past 5 entries and full disposal history
- Send suggestions or complaints to the community manager

### Community Manager
- Overview of total waste, total users, total disposals, most active location
- Waste type ranking for all 6 categories by total weight
- Map showing all users disposal locations with username on hover
- Post notices to all users
- View suggestions and complaints from users
- Recent entries and full history with filter by user

## Database Tables
- waste_logs: stores waste entries with category, weight, coordinates, photo and username
- notices: notices posted by the manager to users
- suggestions: messages sent by users to the manager

## Project Structure
- index.html: login and signup page
- dashboard.html: user dashboard
- history.html: user full disposal history
- admin.html: community manager dashboard
- admin-history.html: manager full history with user filter
- style.css: all styling
- supabase.js: database connection
- auth.js: login and signup logic
- dashboard.js: user dashboard logic
- history.js: user history logic
- admin.js: manager dashboard logic
- admin-history.js: manager history logic

## How to Run Locally
1. Clone the repository
   git clone https://github.com/nivetha-3227/EcoAudit.git
2. Open the folder in VS Code
3. Install the Live Server extension
4. Right click index.html and click Open with Live Server
5. No database setup needed as the app uses a live Supabase backend

## Test Accounts
- User: sign up with any username and password
- Community Manager: username is ecoadmin and password is admin123

  <img width="959" height="538" alt="image" src="https://github.com/user-attachments/assets/6638662e-ce17-4bf9-8c8e-b4da5d66bf96" />
  <img width="950" height="551" alt="image" src="https://github.com/user-attachments/assets/bf525e35-36d9-4d72-8362-4911d6fac12c" />
  <img width="951" height="499" alt="image" src="https://github.com/user-attachments/assets/74afc38e-b2e4-4d64-90d7-372353fc3a71" />
  <img width="955" height="490" alt="image" src="https://github.com/user-attachments/assets/6d7b6797-b3df-4dbe-aabc-2d5d879c6926" />
  <img width="958" height="497" alt="image" src="https://github.com/user-attachments/assets/f7871a5d-fcae-48e3-891a-1649163b6ebc" />
  <img width="946" height="490" alt="image" src="https://github.com/user-attachments/assets/59b07b25-6f45-4663-ba75-0b3665bc5cc4" />
  <img width="959" height="501" alt="image" src="https://github.com/user-attachments/assets/4727620b-f8d8-42d7-a924-b42e5513d58c" />
  <img width="959" height="493" alt="image" src="https://github.com/user-attachments/assets/1f8234e7-5ab9-45ef-ac8c-ea54a30375c5" />








