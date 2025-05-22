# sixtyoneeighty live 💥 POW!

**sixtyoneeighty live** is a real-time AI chat and video streaming web application for desktop browsers, bringing the vibrant, action-packed aesthetic of Adam West's Batman comics to your screen! Engage with the Gemini Live API through chat, voice, webcam video, and screen sharing.

## ✨ Features (Planned & In-Progress)

* **Real-time Multimodal Chat:** Interact using text, voice, video, and screen sharing.
* **Live Video Streaming:** Share your webcam feed.
* **Live Audio Streaming:** With a dynamic microphone volume visualizer.
* **Screen Sharing:** Easily toggle between webcam and screen content.
* **Authentic Comic Book Theme:**
    * Bold, vibrant colors (blues, yellows, reds, with black outlines).
    * Thick comic-style borders on all elements.
    * Comic fonts ('Bangers', 'Permanent Marker').
    * Subtle halftone background patterns.
    * Animated comic SFX overlays ("POW!", "BAM!", "ZAP!").
    * Chunky, fun comic-style icons and buttons.
    * "Utility belt" media controls.
* **Backend:** Powered by the Google Gemini Live API (JavaScript SDK, native audio, "Leda" voice).

## 🥞 Tech Stack

* **Frontend:**
    * React (TypeScript)
    * Functional Components & Hooks
    * SCSS for styling (with CSS variables for theming)
    * React Context for State Management
    * Custom Hooks for Media (Webcam, Mic, Screen Share)
* **Fonts:**
    * [Google Fonts: Bangers](https://fonts.google.com/specimen/Bangers)
    * [Google Fonts: Permanent Marker](https://fonts.google.com/specimen/Permanent+Marker)
* **API:** Google Gemini Live API

## 🚀 Getting Started

**(Instructions will be updated as the project is built)**

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd sixtyoneeighty-live
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Set up environment variables:**
    * Create a `.env` file in the root directory.
    * Add your Gemini API Key:
        ```
        REACT_APP_GEMINI_API_KEY=YOUR_API_KEY_HERE
        ```
        *(Note: Environment variables should be handled securely and not committed if sensitive. [cite: 8])*
4.  **Run the development server:**
    ```bash
    npm start
    ```
    The application should open in your default web browser at `http://localhost:3000` (or similar).

## 🛠️ Scripts

* `npm start`: Runs the app in development mode.
* `npm run build`: Builds the app for production.
* `npm test`: Runs the test suite (tests to be added). [cite: 7]
* `npm run lint`: Lints the codebase (linter to be configured).

## 🎨 Assets & Theming

* **Logo:** A comic book title-style logo for "sixtyoneeighty live" will be placed in the upper left. (Asset TBD)
* **SFX Popups:** Animated "POW!", "BAM!", "ZAP!" graphics. (Assets TBD or CSS animated)
* **Icons:** Custom SVG icons for media controls (mic, camera, screen share, connect/disconnect). (Assets TBD)

*(This README will be updated as new features are added or setup steps change. [cite: 34])*