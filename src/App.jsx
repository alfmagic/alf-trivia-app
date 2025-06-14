import { Routes, Route } from 'react-router-dom';
import Home from './components/Home';
import SinglePlayer from './components/SinglePlayer';
import Multiplayer from './components/Multiplayer';

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