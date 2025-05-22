# PLANNING.MD

## 1. Project Vision

**Project Name:** sixtyoneeighty live

**High-Level Vision:**
A real-time AI chat and video streaming web application with multimodal capabilities (chat, voice, video/webcam, screen share) for desktop browsers. The application will feature a distinctive comic book / Adam West Batman aesthetic. The backend leverages the Gemini Live API, with specifics (model, voice, system prompt) detailed in `backend.txt`.

**Core User Experience:**
Users can engage in real-time chat, stream their webcam and microphone, and share their screen, all within a single-page application designed to look and feel like a vintage comic book.

## 2. Architecture

### 2.1. Frontend
* **Framework:** React (TypeScript)
* **Component Model:** Functional Components with Hooks
* **Structure:** Modular (separate components for chat, media panel, controls, UI overlays, etc.)
* **State Management:** React Context/Provider for global application state (e.g., connection status, user information, theme settings).
* **Custom Hooks:** Dedicated hooks for managing media streams (webcam, screen capture, microphone audio).
* **Styling:** SCSS with variables for theme colors, fonts, and comic-style elements.

### 2.2. Backend
* **Primary Service:** Google Gemini Live API
    * **SDK:** JavaScript
    * **Configuration Reference:** **`backend.txt` (provided by user)** contains the AI Studio-generated code, including the specific model, voice ("Leda"), and system prompt to be used.
    * **Audio:** Native audio input/output (as per `backend.txt`).
* **Interaction:** All core functionalities (chat, multimodal input/output) will interface directly with the Gemini Live API configured as per `backend.txt`.
* **Initial Setup:** Focus on client-side logic with placeholder functions in `geminiLiveService.ts` designed to align with the interactions specified or implied by `backend.txt`. No separate user authentication or message persistence backend in this initial phase.

### 2.3. API Interaction
* The frontend will make calls to the Gemini Live API for all real-time communication features, following the patterns and requirements indicated by the setup in `backend.txt`.
* Clear contracts for these API interactions (request/response payloads) will be defined as development progresses, starting with placeholder functions that anticipate the `backend.txt` configuration.

## 3. Constraints

* **Platform:** Desktop web browsers (latest Chrome, Firefox, Edge, Safari). Mobile-friendly is a plus but desktop is the priority.
* **Aesthetic:** Must strictly adhere to the comic book / Adam West Batman theme.
* **Client-Side Focus:** Initial development will emphasize client-side implementation with mocked backend calls that reflect the expected behavior based on `backend.txt`.
* **Performance:** Ensure smooth real-time video, audio, and chat performance on typical desktop hardware.
* **Code Modularity:** Files should ideally be kept under 500 lines; split into smaller modules where appropriate.

## 4. Tech Stack

### 4.1. Frontend
* **Language:** TypeScript
* **Core Library:** React
* **Styling:** SCSS
    * Variables for primary colors (blues, yellows, reds, black outlines), fonts, border styles.
    * Halftone pattern for backgrounds.
* **Fonts:**
    * Titles & SFX: 'Bangers' (Google Fonts)
    * Chat Text & UI Elements: 'Permanent Marker' (Google Fonts)
* **Icons:** Custom SVGs for a chunky, comic-book style (not standard icon libraries).
* **Animations:** CSS transitions and potentially a small animation library if needed for comic-style effects (panel flips, SFX pop-ups).

### 4.2. Backend Integration
* **API:** Google Gemini Live API (via JavaScript SDK)
* **Definitive Configuration:** See **`backend.txt`** for model, voice, and system prompt details.

## 5. Tools

* **Version Control:** Git
* **Package Manager:** npm
* **IDE:** AI-assisted IDE supporting project-level rules (e.g., Cursor, Windsurf).
    * **MCP Servers:** `context7` to be used frequently for documentation.
* **Browser DevTools:** For debugging and performance tuning.

## 6. Project Scope (Initial Phase - MVP)

* Functional chat interface.
* Functional webcam display.
* Functional microphone input with visualizer.
* Functional screen sharing (toggleable with webcam).
* Basic comic book theming applied (colors, borders, fonts).
* "Utility belt" for media controls.
* Placeholder API integration for Gemini Live, designed to align with `backend.txt`.