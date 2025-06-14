import { Link } from "react-router-dom";

const Home = () => {
    return (
        <div className="flex flex-col items-center justify-center h-screen">
            <h1 className="text-5xl font-bold mb-8">Alf Trivia</h1>
            <div className="flex gap-4">
                <Link to={'/singleplayer'}>
                    <button className='bg-slate-800 p-2 rounded-xl text-lg hover:bg-slate-700 transition-colors'>
                        Single Player
                    </button>
                </Link>
                <Link to={'/multiplayer'}>
                    <button className='bg-slate-800 p-2 rounded-xl text-lg hover:bg-slate-700 transition-colors'>
                        Multiplayer
                    </button>
                </Link>
            </div>
        </div>
    );
}

export default Home;