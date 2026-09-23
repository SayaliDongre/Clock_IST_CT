# ChronoSync IST-CT

A modern, glassmorphic Progressive Web App (PWA) designed to seamlessly manage time conversions, track deadlines, and display live clocks for Indian Standard Time (IST) and Central Time (CT). Built primarily for distance-learning students bridging the gap between India and US Central Time zones (e.g., UT Austin students).

## 🚀 Features

- **Time Converter:** Bi-directional date and time conversion between IST and CT (automatically accounts for CT Daylight Saving Time).
- **World Clock:** Live tracking of both time zones with real-time difference calculation.
- **Deadline Tracker:** Track upcoming deadlines with visual urgency indicators (safe, warning, danger) and custom smooth completion animations. Data is persisted locally via `localStorage`.
- **Progressive Web App (PWA):** Fully installable on mobile devices (iOS/Android) as a standalone app utilizing Service Workers for caching.
- **Glassmorphic UI:** A visually stunning frontend built with raw CSS, featuring animated gradient blob backgrounds and frosted glass panels.

## 🛠️ Technology Stack

- **HTML5:** Semantic structure and layout.
- **CSS3:** Vanilla CSS leveraging modern features like CSS Variables, `backdrop-filter` for glassmorphism, flexbox/grid for responsive layouts, and keyframe animations.
- **JavaScript (ES6+):** Vanilla JS handling DOM manipulation, complex `Intl.DateTimeFormat` timezone parsing, and local storage state management. No external heavy frameworks (React/Vue/Angular) used to ensure maximum performance and minimal footprint.
- **Service Workers:** For PWA offline caching and installation capabilities.

## 📁 Project Structure

```text
.
├── index.html       # Main application entry point and DOM structure
├── styles.css       # Global styles, animations, and glassmorphic design system
├── script.js        # Core application logic (Tabs, Clocks, Converter, Tracker)
├── manifest.json    # PWA configuration manifest
├── sw.js            # Service worker for resource caching
├── icon-192.png     # PWA icon (192x192)
└── icon-512.png     # PWA icon (512x512)
```

## 💻 Developer Setup

This project requires zero build steps or bundlers. To run it locally for development:

1. **Clone the repository:**
   ```bash
   git clone https://github.com/SayaliDongre/Clock_IST_CT.git
   cd Clock_IST_CT
   ```

2. **Serve the application:**
   Because of Service Worker and module restrictions in modern browsers, you should run this through a local HTTP server rather than opening `index.html` directly from the filesystem.
   
   *Using Python 3:*
   ```bash
   python -m http.server 8000
   ```
   
   *Using Node.js (http-server):*
   ```bash
   npx http-server -p 8000
   ```

3. **Open your browser:**
   Navigate to `http://localhost:8000`.

## 🌐 Deployment

The application is designed to be hosted seamlessly on **GitHub Pages**. 
1. Navigate to your repository **Settings** > **Pages**.
2. Select the `main` branch as your source.
3. Save, and the app will automatically build and deploy.

## 📝 Key Implementation Details

- **Timezone Logic:** Because vanilla JavaScript's `Date` object relies heavily on the user's local system time, timezone conversions are handled by cross-referencing exact UTC epoch times against the `Intl.DateTimeFormat` API for specific IANA zones (`Asia/Kolkata` and `America/Chicago`). 
- **Tracker Storage:** The deadline tracker uses `localStorage` bound to the key `chrono_deadlines`.
- **CSS Animations:** Background blobs utilize infinite `alternate ease-in-out` transforms, while deadline completions utilize sequential class additions (`.completed`, then `.erasing`) tied to JS `setTimeout` to synchronize DOM removal with CSS transition ends.
