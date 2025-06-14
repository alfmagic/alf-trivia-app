import { Routes, Route } from 'react-router-dom';

// Corrected import paths for your project structure
import Home from './Home';
import SinglePlayer from './SinglePlayer';
import Multiplayer from './Multiplayer';

function App() {
  return (
    // These classes apply the dark theme to your whole app permanently.
    <div className="bg-slate-900 text-slate-200 min-h-screen">
      <Routes>
        <Route path='/' element={<Home />} />
        <Route path='/singleplayer' element={<SinglePlayer />} />
        <Route path='/multiplayer' element={<Multiplayer />} />
      </Routes>
    </div>
  );
}

export default App;