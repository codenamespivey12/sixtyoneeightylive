import React from 'react';
import { ChatPanel } from '../Chat';
import { MediaDisplay } from '../Media';
import { ControlsBar } from './index';
import { AudioPlayer } from '../UI';

const MainLayout: React.FC = () => {
  return (
    <>
      <header className="app-header">
        <h1 className="app-title">sixtyoneeighty live</h1>
      </header>

      <div className="main-content-wrapper">
        <main className="stage-area">
          <MediaDisplay />
        </main>

        <aside className="sidebar-area">
          <ChatPanel />
        </aside>
      </div>

      <footer className="controls-area utility-belt">
        <div className="controls-container">
          <ControlsBar />
        </div>
      </footer>

      {/* AudioPlayer doesn't render any visible UI, it just plays audio */}
      <AudioPlayer />
    </>
  );
};

export default MainLayout;
