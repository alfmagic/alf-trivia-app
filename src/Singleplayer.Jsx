import { Link } from "react-router-dom";

const SinglePlayer = () => {
    // This is just a placeholder for now.
    // You will add your question fetching logic here later.
    return (
        <div className="flex flex-col items-center justify-center h-screen">
            <h1 className="text-5xl font-bold mb-8">Single Player</h1>
            <p className="mb-8">Questions will appear here soon!</p>
            <Link to={'/'}>
                <button className='w-full bg-slate-700 p-2 rounded-xl text-lg hover:bg-slate-600 transition-colors'>
                    Back to Home
                </button>
            </Link>
        </div>
    );
}

export default SinglePlayer;