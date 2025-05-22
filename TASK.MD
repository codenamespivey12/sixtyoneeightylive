# TASK.MD

## Active Work (Current Sprint/Phase 1)

### Project Setup & Structure
- [ ] Initialize React (TypeScript) project using `npm` (e.g., with Vite).
- [ ] Set up basic project folder structure: `/src`, `/src/components`, `/src/assets` (for SVGs, images), `/src/styles` (for SCSS), `/src/hooks`, `/src/services` (for API interactions).
- [ ] Configure SCSS: set up main stylesheet, partials for variables, components, etc. Define initial theme variables (colors, fonts, border styles) as per `PLANNING.MD`.
- [ ] Implement basic HTML/JSX structure for the single-page app layout: main content area (for video/screen), side panel (for chat), and a bottom bar (for controls).

### Core Components (Initial Shells & Basic Functionality)
- [ ] `ChatPanel.tsx`:
    - [ ] Input field for messages.
    - [ ] Area to display chat messages (initially client-side only).
    - [ ] Basic styling for chat bubbles (comic callouts).
- [ ] `MediaDisplay.tsx`:
    - [ ] Container to render video element for webcam or screen share.
    - [ ] Initial logic to switch between video sources.
- [ ] `ControlsBar.tsx` ("Utility Belt"):
    - [ ] Buttons to toggle microphone (mute/unmute).
    - [ ] Buttons to toggle webcam (on/off).
    - [ ] Buttons to toggle screen sharing (on/off, switch from webcam).
    - [ ] Connect/Disconnect button for Gemini Live service.
    - [ ] Basic comic-style iconography for buttons.
- [ ] `AudioVisualizer.tsx`:
    - [ ] Component to display microphone volume (e.g., pulsing bars).
- [ ] `ComicSFXOverlay.tsx`:
    - [ ] Component to display animated "POW!", "BAM!" overlays (triggered by actions). Initially, placeholder display.

### Media Hooks (Client-Side Media Access)
- [ ] `useWebcam.ts`: Custom hook to access webcam using `navigator.mediaDevices.getUserMedia({ video: true })`. Manages video stream state.
- [ ] `useMicrophone.ts`: Custom hook to access microphone using `navigator.mediaDevices.getUserMedia({ audio: true })`. Manages audio stream state and provides data for `AudioVisualizer.tsx`.
- [ ] `useScreenShare.ts`: Custom hook to access screen sharing using `navigator.mediaDevices.getDisplayMedia()`. Manages screen share stream state.

### Gemini Live API Integration (Placeholder Service)
- [ ] Create `src/services/geminiLiveService.ts`.
- [ ] **Review `backend.txt` (provided by user) for specific Gemini Live API configurations (model, voice, system prompt) and ensure `geminiLiveService.ts` placeholder functions and future implementation details align accordingly.**
- [ ] Implement placeholder functions in `geminiLiveService.ts`:
    - [ ] `async function connectToGemini(apiKey: string): Promise<void>`
    - [ ] `async function disconnectFromGemini(): Promise<void>`
    - [ ] `async function sendChatMessage(message: { text: string, mediaStream?: MediaStream }): Promise<void>`
    - [ ] `function onGeminiMessage(callback: (response: any) => void): UnsubscribeFunction` (where UnsubscribeFunction is `() => void`)
    - [ ] `async function initializeLocalMedia(): Promise<{ videoStream: MediaStream, audioStream: MediaStream }>`
    - [ ] `async function setVoicePreference(voiceName: 'Leda' | string): Promise<void>` (ensure 'Leda' is default based on `backend.txt`)

### Styling & Theming (Initial Pass)
- [ ] Apply global styles: comic book font ('Bangers' for titles, 'Permanent Marker' for body/chat) via SCSS.
- [ ] Implement halftone background pattern.
- [ ] Style main layout panels with thick, comic-style borders.
- [ ] Style chat bubbles as comic callouts.
- [ ] Style buttons in `ControlsBar.tsx` with chunky, comic iconography (using placeholder SVGs or descriptive text initially).

### Documentation
- [ ] Create initial `README.MD` with project overview, tech stack, and basic setup/run instructions.

## Milestones

### Milestone 1: Basic UI Shell & Local Media Functionality
* All core components (`ChatPanel`, `MediaDisplay`, `ControlsBar`, `AudioVisualizer`) are rendered in their designated layout areas.
* User can click a button to start their webcam, and the feed appears in `MediaDisplay.tsx`.
* User can click a button to enable their microphone, and `AudioVisualizer.tsx` shows activity.
* User can click a button to start screen sharing, and the shared screen appears in `MediaDisplay.tsx` (replacing webcam).
* Basic comic book styling (fonts, borders, background) is apparent.
* Controls in `ControlsBar.tsx` can toggle local media states.

### Milestone 2: Placeholder Gemini Live Integration & Basic Chat UI
* User can type a message into the chat input in `ChatPanel.tsx`.
* The typed message appears in the chat display area (client-side rendering only).
* A "Connect to Gemini" button in `ControlsBar.tsx` calls the `connectToGemini()` placeholder function from `geminiLiveService.ts`, which is designed with `backend.txt` in mind.
* Other relevant controls call their respective placeholder functions in `geminiLiveService.ts`.
* Basic comic SFX overlay appears momentarily when a chat message is "sent" (client-side).

## Discovered During Work
*(To be filled as development progresses)*