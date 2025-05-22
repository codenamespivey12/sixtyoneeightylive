import { MainLayout } from './components/Layout';
import { GeminiProvider } from './contexts/GeminiContext';
import './styles/main.scss';

function App() {
  return (
    <GeminiProvider>
      <div className="app-container">
        <MainLayout />
      </div>
    </GeminiProvider>
  );
}

export default App;
