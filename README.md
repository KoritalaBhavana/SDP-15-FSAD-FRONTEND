# 🏡 ActivityHub — Frontend

> **SDP-15 | Full Stack Application Development (FSAD)**
> A comprehensive travel and homestay platform connecting tourists with homestay hosts, local guides, and nearby attractions.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Render-46E3B7?style=flat-square)](https://fsad-frontend-jmme.onrender.com/)
[![React](https://img.shields.io/badge/React-18.x-61DAFB?style=flat-square&logo=react)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5.x-646CFF?style=flat-square&logo=vite)](https://vitejs.dev/)

---

## 📖 Table of Contents

- [Project Overview](#project-overview)
- [Features by Role](#features-by-role)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Pages & Routes](#pages--routes)
- [API Integration](#api-integration)
- [Environment Variables](#environment-variables)
- [Deployment](#deployment)
- [Known Issues & Fixes](#known-issues--fixes)
- [Team](#team)

---

## 📌 Project Overview

**ActivityHub** is a full-stack travel platform that connects travellers with homestay options and provides information about nearby tourist attractions. The app enhances the travel experience by offering personalised recommendations and local insights.

There are **4 user roles**, each with their own dashboard, navigation, and functionality:

| Role | Description |
|------|-------------|
| 🧳 **Tourist** | Search homestays, book stays, explore attractions, manage trips |
| 🏡 **Homestay Host** | List properties, manage bookings, interact with guests |
| 🧭 **Local Guide** | Provide insights, manage itineraries, recommend places |
| 👨‍💼 **Admin** | Manage users, approve listings, conduct interviews, view analytics |

---

## ✨ Features by Role

### 🏠 Landing Page (Public)
- Search bar with location, dates, and guest count (with location autocomplete)
- Featured homestays carousel
- Trending travel destinations
- Nearby tourist attractions section
- Local guide recommendations
- Category filters: Family Stay, Budget Stay, Luxury, Nature Stay
- Limited-time offers and discount section (StayFirst offer button functional)
- Popular places carousel with real destination images
- User reviews and ratings display
- Navigation: Home, Homestays, Attractions, Guides, Login
- Footer with Contact, About, Policies

### 🔐 Authentication (Sign In / Sign Up)
- Login via email/phone and password
- Role-based sign-up: **Tourist / Homestay Host / Local Guide**
- Forgot password with OTP/verification
- Optional Google social login
- Secure login with JWT token storage
- Auto-redirect to role-specific dashboard after login
- Sign out accessible from the profile dropdown menu

### 🧳 Tourist Dashboard
- Search and filter homestays (price, rating, location, amenities)
- Recommended and recently viewed stays
- Wishlist / favourite homestays (functional buttons)
- Nearby attractions list with map view
- **My Bookings** — active bookings with working "View Details" and "Cancel" buttons
- Trips Taken, Reviews Given, Places Visited statistics (Discover hover — all working)
- Travel suggestions from local guides
- Add Attraction feature
- Notification centre (booking updates, offers, messages — bell icon shows unread count)
- Profile settings with editable photo upload and personal details

### 🏡 Homestay Listing Page
- Grid / list view of homestays with distinct images per property
- Name, location, price per night, rating and reviews
- Amenity icons (WiFi, food, parking, pool, etc.)
- Short description and distance from tourist places
- Sort by: Price Low-to-High, Top Rated, Nearest Location
- Map view option
- "View Details" button per listing

### 📄 Homestay Detail Page
- Large image gallery
- Full description, room details, price breakdown
- Available date picker
- Amenities list and house rules
- Host profile information
- Ratings and written reviews
- Nearby attractions and local guide tips
- "Book Now" and "Add to Wishlist" buttons

### 📅 Booking Page
- Selected homestay summary
- Check-in / check-out date selection
- Guest count selector
- Automatic price calculation with taxes and charges
- Special requests text box
- Cancellation policy display
- "Confirm Booking" button

### 💳 Payment Page
- Full booking summary with total amount
- Payment methods: Credit/Debit Card, UPI, Net Banking, Wallet
- Coupon code input field
- Secure payment badge
- Payment success/failure feedback messages
- Invoice download option

### ⭐ Tourist Attractions Page
- Nearby places listed with photos
- Description, distance from stay, ratings
- Best time to visit, entry fee, map location
- Local guide recommendations
- "Save to Itinerary" option

### 🍽️ Dining Page
- Book a Chef option
- **Book a Table** — separate, fully functional table booking flow (not merged with chef booking)

### 🧭 Local Guide Dashboard
- Guide profile with experience and ratings
- **My Itineraries** — Create New (working modal form), Edit (pre-populated form toggle)
- **Add Attraction** — with working image upload via Cloudinary
- Travel tips, hidden gems, local food recommendations
- Suggested itineraries for tourists
- Chat / contact option with tourists
- **Booking Management** — working list with status actions
- **Reviews** — with manual reply text input (controlled textarea)
- **Messages** — working message thread view
- Editable profile with photo upload
- Profile Settings navigation (dropdown + sidebar both functional)

### 🏡 Homestay Host Dashboard
- Add new property with multiple image upload
- Edit property details
- Manage availability calendar
- Booking requests with **Accept / Reject popup confirmation** (modal with API call)
- Guest details view
- **Dynamic Dashboard Stats**: Total Earnings, Active Bookings, Total Reviews, Occupancy Rate (fetched live from API)
- Reviews with **manual reply input** (controlled textarea)
- Messages from tourists
- Editable profile with photo upload
- Profile Settings — accessible from both top dropdown and sidebar

### 👨‍💼 Admin Dashboard
- Overview stats: Total Tourists, Hosts, Guides, Active Bookings, Listings
- **User Management**: View pending/approved/rejected users with action buttons
- Pending interview scheduling for Tourists, Homestay Hosts, and Guides — all functional
- Appointed users list with status
- Approve / reject homestay listings
- Remove inappropriate content
- Manage tourist place information
- Reports and complaints handling
- Analytics and statistics
- Platform settings

### 💬 Chat / Messaging
- Tourist ↔ Host real-time messaging
- Tourist ↔ Guide messaging
- Booking-related message threads
- Notification alerts for new messages

### 👤 Profile Page (All Roles)
- Custom profile photo upload (each role can set their own image)
- Personal details with inline edit form
- Saved favourites / wishlist
- Booking history
- Reviews submitted
- Notification preferences
- Logout

### 🔔 Notifications
- Bell icon in navbar showing unread count badge
- Booking confirmation, payment success/failure
- Host approval updates
- Guide recommendations, offer alerts
- New message notifications

---

## 🛠️ Tech Stack

| Category | Technology |
|----------|-----------|
| Framework | React 18 |
| Build Tool | Vite 5 |
| Routing | React Router DOM v6 |
| State Management | React Context API |
| HTTP Client | Axios |
| Styling | Tailwind CSS / CSS Modules |
| Maps & Location | Google Maps API / Leaflet.js |
| Authentication | JWT (localStorage) |
| Notifications | React Toastify |
| Date Picker | React Datepicker |
| Image Upload | Cloudinary |
| Deployment | Render (Static Site) |

---

## 📁 Project Structure

```
SDP-15-FSAD-FRONTEND/
├── public/
│   ├── images/                    # Static destination images
│   └── index.html
├── src/
│   ├── assets/                    # Icons, logos
│   ├── components/
│   │   ├── common/                # Navbar, Footer, Modal, Cards, Buttons
│   │   ├── tourist/               # Tourist-specific components
│   │   ├── host/                  # Host-specific components
│   │   ├── guide/                 # Guide-specific components
│   │   └── admin/                 # Admin-specific components
│   ├── pages/
│   │   ├── Home.jsx
│   │   ├── Auth/
│   │   │   ├── Login.jsx
│   │   │   └── Register.jsx
│   │   ├── Tourist/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── MyBookings.jsx
│   │   │   ├── Wishlist.jsx
│   │   │   ├── Attractions.jsx
│   │   │   ├── BookingPage.jsx
│   │   │   ├── PaymentPage.jsx
│   │   │   └── ProfileSettings.jsx
│   │   ├── Host/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── AddProperty.jsx
│   │   │   ├── ManageBookings.jsx
│   │   │   ├── Reviews.jsx
│   │   │   ├── Messages.jsx
│   │   │   └── ProfileSettings.jsx
│   │   ├── Guide/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── MyItineraries.jsx
│   │   │   ├── AddAttraction.jsx
│   │   │   ├── BookingManagement.jsx
│   │   │   ├── Reviews.jsx
│   │   │   ├── Messages.jsx
│   │   │   └── ProfileSettings.jsx
│   │   └── Admin/
│   │       ├── Dashboard.jsx
│   │       ├── UserManagement.jsx
│   │       ├── PendingInterviews.jsx
│   │       ├── AppointedUsers.jsx
│   │       ├── HomestayApproval.jsx
│   │       └── Analytics.jsx
│   ├── services/
│   │   ├── api.js                 # Axios instance + JWT interceptors
│   │   ├── authService.js
│   │   ├── bookingService.js
│   │   ├── homestayService.js
│   │   ├── attractionService.js
│   │   └── guideService.js
│   ├── context/
│   │   ├── AuthContext.jsx
│   │   └── NotificationContext.jsx
│   ├── hooks/
│   │   ├── useAuth.js
│   │   └── useLocation.js
│   ├── utils/
│   │   ├── helpers.js
│   │   └── constants.js
│   ├── App.jsx
│   └── main.jsx
├── .env.example
├── package.json
├── vite.config.js
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js >= 18.x
- npm >= 9.x (or yarn)
- Backend server running (see Backend README)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/KoritalaBhavana/SDP-15-FSAD-FRONTEND.git
cd SDP-15-FSAD-FRONTEND

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Fill in your values (see Environment Variables section)

# 4. Start the development server
npm run dev
```

App runs at `http://localhost:5173`

### Build for Production

```bash
npm run build
npm run preview
```

---

## 🗺️ Pages & Routes

| Path | Page | Access |
|------|------|--------|
| `/` | Home (Landing) | Public |
| `/login` | Login | Public |
| `/register` | Register (Role selection) | Public |
| `/tourist/dashboard` | Tourist Dashboard | Tourist |
| `/tourist/bookings` | My Bookings | Tourist |
| `/tourist/wishlist` | Wishlist | Tourist |
| `/tourist/attractions` | Attractions | Tourist |
| `/tourist/profile` | Profile Settings | Tourist |
| `/homestay/:id` | Homestay Detail | Public |
| `/booking/:id` | Booking Page | Tourist |
| `/payment` | Payment | Tourist |
| `/host/dashboard` | Host Dashboard | Host |
| `/host/add-property` | Add Property | Host |
| `/host/bookings` | Manage Bookings | Host |
| `/host/reviews` | Reviews | Host |
| `/host/messages` | Messages | Host |
| `/host/profile` | Profile Settings | Host |
| `/guide/dashboard` | Guide Dashboard | Guide |
| `/guide/itineraries` | My Itineraries | Guide |
| `/guide/attractions` | Add Attraction | Guide |
| `/guide/bookings` | Booking Management | Guide |
| `/guide/reviews` | Reviews | Guide |
| `/guide/messages` | Messages | Guide |
| `/guide/profile` | Profile Settings | Guide |
| `/admin/dashboard` | Admin Dashboard | Admin |
| `/admin/users` | User Management | Admin |
| `/admin/interviews` | Pending Interviews | Admin |
| `/admin/appointed` | Appointed Users | Admin |
| `/admin/homestays` | Homestay Approval | Admin |
| `/admin/analytics` | Analytics | Admin |

---

## 🔌 API Integration

All API calls go to the Spring Boot backend. The Axios instance in `src/services/api.js`:

```js
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
```

Full API documentation is available via **Swagger UI** at:
```
http://localhost:8080/swagger-ui/index.html
```

Key API groups:

| Group | Base Path |
|-------|-----------|
| Auth | `/api/auth` |
| Users | `/api/users` |
| Homestays | `/api/homestays` |
| Bookings | `/api/bookings` |
| Payments | `/api/payments` |
| Attractions | `/api/attractions` |
| Guides | `/api/guides` |
| Itineraries | `/api/itineraries` |
| Reviews | `/api/reviews` |
| Messages | `/api/messages` |
| Admin | `/api/admin` |

---

## 🔑 Environment Variables

```env
# Backend API base URL
VITE_API_BASE_URL=http://localhost:8080/api

# Google Maps API (location search + map views)
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# Cloudinary (profile and property image uploads)
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
VITE_CLOUDINARY_UPLOAD_PRESET=your_upload_preset

# Google OAuth (optional)
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

> ⚠️ Never commit `.env` to version control.

---

## ☁️ Deployment

**Platform**: Render (Static Site)
**Live URL**: https://fsad-frontend-jmme.onrender.com

### Steps to Deploy on Render

1. Push code to GitHub
2. Render Dashboard → **New Static Site** → Connect repo
3. Build command: `npm run build`
4. Publish directory: `dist`
5. Add environment variables
6. Deploy

### Alternative: Vercel

```bash
npm install -g vercel
vercel --prod
```

---

## 🐛 Known Issues & Fixes

| Area | Issue | Fix |
|------|-------|-----|
| Tourist — My Bookings | View Details / Cancel button not working | Wired to booking service with booking ID |
| Tourist — Profile Dropdown | Profile Settings not navigating | Fixed route to `/tourist/profile` |
| Tourist — Discover Stats | Trips, Wishlist, Reviews, Places buttons inactive | Added navigation handlers |
| Tourist — Notifications | Bell icon empty | Connected to NotificationContext with unread count |
| Host — Add Property | Form submission not working | Fixed multipart upload + API POST |
| Host — Booking Requests | No Accept/Reject popup | Added confirmation modal with PATCH call |
| Host — Reviews/Messages | Buttons inactive | Routed to `/host/reviews` and `/host/messages` |
| Host — Profile Edit | Cannot save edits | Fixed PUT `/api/users/{id}` call |
| Host — Dashboard Stats | All stats static | Fetched dynamically from `/api/admin/stats` |
| Host — Reply Button | Cannot type reply | Controlled `<textarea>` state added |
| Guide — Profile Edit | Image and details not editable | Cloudinary upload + editable form |
| Guide — Itinerary Edit | Edit option not working | Pre-populated edit form with toggle |
| Guide — Create Itinerary | "Create New" button inactive | Modal with POST to `/api/itineraries` |
| Guide — Booking/Reviews/Messages | Non-functional | Routes and API calls added |
| Guide — Profile Settings Dropdown | Not navigating | Fixed to `/guide/profile` |
| Guide — Add Attraction Image | Cannot upload image | Cloudinary upload integrated |
| Admin | No login existed | Admin login with role-check added |
| Admin — Interviews | Pending buttons inactive | Wired to interview scheduling API |
| Admin — User Management | No actions for pending requests | Accept/Reject/Interview buttons added |
| All Roles — Profile Photo | Could not upload custom image | File input + Cloudinary upload with preview |
| Dining | Book Table not working | Separate table-booking flow added |
| Images | Manali, Darjeeling, Hampi, Valley of Flowers broken | Replaced with working CDN URLs |
| Images | Dudhsagar Falls wrong image | Replaced with correct image |
| Images | Mountain Dew Cottage same as others | Unique image assigned |
| Offers | StayFirst button inactive | Click handler with modal/redirect added |

---

## 👥 Team

**SDP Group 15 — FSAD**

| Member | Role |
|--------|------|
| Koritala Bhavana | Team Lead / Full Stack Developer |
| Sahithi | Frontend Developer |
| Saniya | Frontend Developer |

---

## 📄 License

Developed as part of the **Full Stack Application Development (FSAD)** course — SDP Group 15. For academic use only.
