import { Link } from "react-router-dom";

const Multiplayer = () => {
    return (
        <div className='flex flex-col items-center justify-center h-screen'>
            <h1 className="text-5xl font-bold mb-8">Multiplayer</h1>
            <div className="flex flex-col gap-4 w-full max-w-xs px-4">
                <input
                    type="text"
                    placeholder="Room Code"
                    className="p-2 rounded-xl bg-slate-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
                <button className='bg-purple-600 p-2 rounded-xl text-lg hover:bg-purple-700 transition-colors'>
                    Join Room
                </button>
                <button className='bg-green-600 p-2 rounded-xl text-lg hover:bg-green-700 transition-colors'>
                    Create Room
                </button>
                <Link to={'/'}>
                    <button className='w-full bg-slate-700 p-2 rounded-xl text-lg hover:bg-slate-600 transition-colors mt-4'>
                        Back
                    </button>
                </Link>
            </div>
        </div>
    );
}

export default Multiplayer;