import React, { useState, useEffect, useCallback } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, onSnapshot, updateDoc, arrayUnion, collection, deleteDoc } from 'firebase/firestore';
import { Sparkles, Users, Tv, Settings, Copy, Share2, Play, ChevronLeft, Crown, User, ArrowRight, LogOut, CheckCircle, XCircle, Link as LinkIcon } from 'lucide-react';

// --- FIREBASE CONFIGURATION ---
// In a real deployed app, this would come from Vercel's environment variables.
const firebaseConfig = JSON.parse(import.meta.env.VITE_FIREBASE_CONFIG || '{}');
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-trivia-app';

// --- FIREBASE INITIALIZATION ---
let app;
let auth;
let db;

try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
} catch (error) {
    console.error("Error initializing Firebase:", error);
}

// --- HELPER FUNCTIONS ---
const generateRoomCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
};

const generateRandomName = () => {
    const adjectives = ["Clever", "Swift", "Witty", "Curious", "Brave", "Silent", "Daring", "Happy", "Lucky"];
    const nouns = ["Fox", "Jaguar", "Panda", "Raptor", "Lion", "Owl", "Wolf", "Monkey", "Eagle"];
    return `${adjectives[Math.floor(Math.random() * adjectives.length)]} ${nouns[Math.floor(Math.random() * nouns.length)]}`;
};


const shuffleArray = (array) => {
    return [...array].sort(() => Math.random() - 0.5);
};

// --- API HOOK for fetching trivia questions ---
const useTriviaQuestions = () => {
    const fetchQuestions = useCallback(async (amount = 10, category = '', difficulty = '') => {
        try {
            const url = `https://opentdb.com/api.php?amount=${amount}&category=${category}&difficulty=${difficulty}&type=multiple`;
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const data = await response.json();
            if (data.response_code !== 0) {
                console.error("Trivia API error, using fallback questions.");
                return getFallbackQuestions();
            }
            return data.results.map(q => ({
                question: q.question,
                correctAnswer: q.correct_answer,
                incorrectAnswers: q.incorrect_answers,
                answers: shuffleArray([q.correct_answer, ...q.incorrect_answers]),
                category: q.category,
                difficulty: q.difficulty,
            }));
        } catch (error) {
            console.error('Failed to fetch trivia questions:', error);
            return getFallbackQuestions();
        }
    }, []);
    
    const getFallbackQuestions = () => {
        return [
            { question: "What is the capital of France?", correctAnswer: "Paris", incorrectAnswers: ["London", "Berlin", "Madrid"], answers: ["London", "Paris", "Berlin", "Madrid"], category: "Geography", difficulty: "easy" },
            { question: "Who wrote 'Hamlet'?", correctAnswer: "William Shakespeare", incorrectAnswers: ["Charles Dickens", "Leo Tolstoy", "Mark Twain"], answers: ["Charles Dickens", "William Shakespeare", "Leo Tolstoy", "Mark Twain"], category: "Literature", difficulty: "easy" },
        ];
    };

    return { fetchQuestions };
};


// --- UI COMPONENTS ---
const LoadingSpinner = () => (
    <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-purple-500"></div>
    </div>
);

const CustomModal = ({ title, children, onClose }) => (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4">
        <div className="bg-gray-800 border border-gray-700 rounded-2xl shadow-lg p-8 w-full max-w-md text-white text-center">
            <h2 className="text-2xl font-bold mb-6">{title}</h2>
            <div>{children}</div>
            <button
                onClick={onClose}
                className="mt-8 w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-lg transition-transform transform hover:scale-105"
            >
                Close
            </button>
        </div>
    </div>
);


// --- MAIN APP COMPONENTS ---

const MainMenu = ({ setView, setGameMode }) => (
    <div className="w-full max-w-md mx-auto p-4 flex flex-col items-center justify-center h-full text-center">
        <div className="mb-10">
            <Sparkles className="mx-auto h-12 w-12 text-purple-400" />
            <h1 className="text-5xl font-bold text-white mt-4">Trivia Questions</h1>
            <p className="text-gray-400 mt-2">made by Alf</p>
        </div>
        <div className="w-full space-y-4">
            <button
                onClick={() => {
                    setGameMode('single');
                    setView('enterName');
                }}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-500 text-white font-bold py-4 px-6 rounded-xl text-lg flex items-center justify-center gap-3 transition-transform transform hover:scale-105 shadow-lg"
            >
                <User /> Single Player
            </button>
            <button
                onClick={() => {
                    setGameMode('multiplayer');
                    setView('enterName');
                }}
                className="w-full bg-gradient-to-r from-green-500 to-teal-400 text-white font-bold py-4 px-6 rounded-xl text-lg flex items-center justify-center gap-3 transition-transform transform hover:scale-105 shadow-lg"
            >
                <Users /> Multiplayer
            </button>
        </div>
    </div>
);

const EnterName = ({ setView, setPlayerName, gameMode, playerName, directJoinRoomId, handleJoinRoom }) => {
    const [name, setName] = useState(playerName);

    const handleSubmit = (e) => {
        e.preventDefault();
        let finalName = name.trim();
        if (!finalName) {
            finalName = generateRandomName();
        }
        setPlayerName(finalName);

        if (directJoinRoomId) {
             handleJoinRoom(directJoinRoomId, finalName);
        } else if (gameMode === 'single') {
            setView('game');
        } else {
            setView('multiplayerMenu');
        }
    };

    return (
        <div className="w-full max-w-md mx-auto p-4 flex flex-col items-center justify-center h-full">
            <div className="text-center mb-10">
                <Users className="mx-auto h-12 w-12 text-purple-400" />
                <h1 className="text-4xl font-bold text-white mt-4">
                    {directJoinRoomId ? "Joining Game" : (gameMode === 'single' ? 'Single Player' : 'Multiplayer')}
                </h1>
                <p className="text-gray-400 mt-2">Enter your name or continue with a random one.</p>
            </div>
            <form onSubmit={handleSubmit} className="w-full space-y-6">
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter name (optional)"
                    className="w-full bg-gray-700 text-white placeholder-gray-400 border-2 border-gray-600 rounded-lg py-3 px-4 text-center text-lg focus:outline-none focus:border-purple-500 transition-colors"
                />
                <div className="flex gap-4">
                    <button
                        type="button"
                        onClick={() => setView('mainMenu')}
                        className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-4 rounded-lg transition-transform transform hover:scale-105"
                    >
                         <ChevronLeft className="inline-block mr-1" size={20}/> Back
                    </button>
                    <button
                        type="submit"
                        className="w-full bg-gradient-to-r from-purple-600 to-blue-500 text-white font-bold py-3 px-4 rounded-lg transition-transform transform hover:scale-105"
                    >
                        Continue <ArrowRight className="inline-block ml-1" size={20}/>
                    </button>
                </div>
            </form>
        </div>
    );
};

const MultiplayerMenu = ({ setView, setRoomId, userId, playerName, handleJoinRoom }) => {
    const [joinCode, setJoinCode] = useState('');
    const [error, setError] = useState('');
    const { fetchQuestions } = useTriviaQuestions();

    const handleCreateRoom = async () => {
        const newRoomId = generateRoomCode();
        setRoomId(newRoomId);
        const questions = await fetchQuestions();
        const roomDocRef = doc(db, `artifacts/${appId}/public/data/rooms/${newRoomId}`);

        try {
            await setDoc(roomDocRef, {
                hostId: userId,
                players: [{ uid: userId, name: playerName, score: 0 }],
                questions,
                currentQuestionIndex: 0,
                gameState: 'waiting',
                createdAt: new Date(),
                answers: {},
            });
            setView('lobby');
        } catch (e) {
            console.error("Error creating room: ", e);
            setError('Could not create room. Please try again.');
        }
    };

    const onJoinSubmit = async (e) => {
        e.preventDefault();
        if (!joinCode.trim()) return;
        await handleJoinRoom(joinCode, playerName, setError);
    };
    
    return (
        <div className="w-full max-w-md mx-auto p-4 flex flex-col items-center justify-center h-full">
            <div className="text-center mb-10">
                <Users className="mx-auto h-12 w-12 text-green-400" />
                <h1 className="text-4xl font-bold text-white mt-4">Multiplayer</h1>
                <p className="text-gray-400 mt-2">Create a new room or join a friend's</p>
            </div>
            {error && <p className="text-red-400 bg-red-900/50 p-3 rounded-lg mb-4">{error}</p>}
            <div className="w-full space-y-4">
                <button
                    onClick={handleCreateRoom}
                    className="w-full bg-gradient-to-r from-green-500 to-teal-400 text-white font-bold py-4 px-6 rounded-xl text-lg flex items-center justify-center gap-3 transition-transform transform hover:scale-105 shadow-lg"
                >
                    Create Room
                </button>
                <p className="text-center text-gray-400">OR</p>
                <form onSubmit={onJoinSubmit} className="w-full space-y-4">
                    <input
                        type="text"
                        value={joinCode}
                        onChange={(e) => setJoinCode(e.target.value)}
                        placeholder="ENTER ROOM CODE"
                        className="w-full bg-gray-700 text-white placeholder-gray-400 border-2 border-gray-600 rounded-lg py-3 px-4 text-center tracking-widest font-mono text-lg focus:outline-none focus:border-pink-500 transition-colors"
                        maxLength="6"
                    />
                    <button
                        type="submit"
                        className="w-full bg-gradient-to-r from-pink-600 to-purple-500 text-white font-bold py-3 px-4 rounded-lg transition-transform transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={!joinCode.trim()}
                    >
                        Join Room
                    </button>
                </form>
            </div>
             <button
                type="button"
                onClick={() => setView('enterName')}
                className="mt-8 bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-4 rounded-lg transition-transform transform hover:scale-105"
            >
                <ChevronLeft className="inline-block mr-1" size={20}/> Back
            </button>
        </div>
    );
};

const Lobby = ({ setView, roomId, userId }) => {
    const [room, setRoom] = useState(null);
    const [isHost, setIsHost] = useState(false);
    const [copied, setCopied] = useState(''); // 'code', 'link', ''
    const [error, setError] = useState('');

    useEffect(() => {
        if (!roomId) {
            setView('multiplayerMenu');
            return;
        }
        const roomDocRef = doc(db, `artifacts/${appId}/public/data/rooms/${roomId}`);
        const unsubscribe = onSnapshot(roomDocRef, (doc) => {
            if (doc.exists()) {
                const data = doc.data();
                setRoom(data);
                setIsHost(data.hostId === userId);
                if (data.gameState === 'playing') {
                    setView('game');
                }
            } else {
                setError('This room no longer exists.');
                setTimeout(() => {
                    setView('multiplayerMenu');
                }, 3000)
            }
        });
        return () => unsubscribe();
    }, [roomId, userId, setView]);

    const handleStartGame = async () => {
        const roomDocRef = doc(db, `artifacts/${appId}/public/data/rooms/${roomId}`);
        try {
            await updateDoc(roomDocRef, { gameState: 'playing' });
        } catch (e) {
            console.error("Error starting game: ", e);
            setError('Failed to start the game.');
        }
    };
    
    const handleLeaveRoom = async () => {
        if (!room) return;
        try {
            const roomDocRef = doc(db, `artifacts/${appId}/public/data/rooms/${roomId}`);
            const updatedPlayers = room.players.filter(p => p.uid !== userId);

            if (updatedPlayers.length === 0) {
                await deleteDoc(roomDocRef);
            } else {
                const newHostId = (isHost && updatedPlayers.length > 0) ? updatedPlayers[0].uid : room.hostId;
                await updateDoc(roomDocRef, { players: updatedPlayers, hostId: newHostId });
            }
            setView('multiplayerMenu');
        } catch (e) {
            console.error("Error leaving room: ", e);
            setError('Could not leave the room.');
        }
    };

    const copyToClipboard = (text, type) => {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand('copy');
            setCopied(type);
            setTimeout(() => setCopied(''), 2000);
        } catch (err) {
            console.error('Failed to copy: ', err);
        }
        document.body.removeChild(textArea);
    };

    if (error) {
        return <div className="w-full max-w-md mx-auto p-4 flex flex-col items-center justify-center h-full text-white"><XCircle className="h-16 w-16 text-red-500 mb-4" /><h2 className="text-2xl font-bold">{error}</h2><p className="text-gray-400">Redirecting you...</p></div>
    }
    if (!room) return <LoadingSpinner />;

    const url = new URL(window.location.href);
    url.searchParams.set('room', roomId);
    const shareLink = url.toString();


    return (
        <div className="w-full max-w-lg mx-auto p-4 flex flex-col items-center justify-center h-full">
             <div className="w-full text-center mb-6">
                <div className="w-20 h-20 mx-auto rounded-full bg-purple-500/20 flex items-center justify-center mb-4"><div className="w-16 h-16 rounded-full bg-purple-500/30 flex items-center justify-center animate-pulse"><Users className="h-8 w-8 text-purple-300"/></div></div>
                <h1 className="text-2xl font-bold text-white">{isHost ? "You are the host!" : "Waiting for host to start..."}</h1>
                <p className="text-gray-400 mt-1">Share the room code or link with your friends!</p>
            </div>
            
            <div className="bg-gray-800/50 border border-gray-700 p-3 rounded-xl flex items-center justify-center gap-2 mb-2">
                <span className="text-gray-300">Code:</span>
                <span className="text-2xl font-bold text-white tracking-widest font-mono">{roomId}</span>
                <button onClick={() => copyToClipboard(roomId, 'code')} className="bg-gray-700 hover:bg-gray-600 text-white p-2 rounded-lg transition-colors"><Copy size={18} /></button>
            </div>
            <div className="bg-gray-800/50 border border-gray-700 p-3 rounded-xl flex items-center justify-center gap-2 mb-6">
                 <span className="text-gray-300">Link:</span>
                <button onClick={() => copyToClipboard(shareLink, 'link')} className="bg-gray-700 hover:bg-gray-600 text-white p-2 rounded-lg transition-colors flex items-center gap-2">
                    <LinkIcon size={18} /> Copy Invite Link
                </button>
            </div>
            <p className="text-sm text-green-400 mb-6 h-5 transition-opacity duration-300">{copied ? `Copied ${copied} to clipboard!` : ''}</p>


            <div className="w-full bg-gray-800/50 border border-gray-700 rounded-xl p-6 mb-8"><h3 className="text-white font-bold text-lg mb-4 text-center">Players in room ({room.players.length})</h3><div className="space-y-3 max-h-48 overflow-y-auto">{room.players.map(player => (<div key={player.uid} className="bg-gray-700/50 p-3 rounded-lg flex items-center justify-between"><span className="text-white font-semibold">{player.name}</span>{player.uid === room.hostId && <Crown size={20} className="text-yellow-400" />}</div>))}</div></div>

            <div className="w-full flex flex-col space-y-3">
                {isHost && (<button onClick={handleStartGame} disabled={room.players.length < 1} className="w-full bg-gradient-to-r from-green-500 to-teal-400 text-white font-bold py-4 rounded-xl text-lg flex items-center justify-center gap-3 transition-transform transform hover:scale-105 disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed"><Play /> Start Game</button>)}
                 <button onClick={handleLeaveRoom} className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-4 rounded-lg transition-transform transform hover:scale-105"><LogOut className="inline-block mr-2" size={20}/> Leave Room</button>
            </div>
        </div>
    );
};

const Game = ({ gameMode, roomId, userId, setView, playerName }) => {
    const [gameData, setGameData] = useState(null);
    const [selectedAnswer, setSelectedAnswer] = useState(null);
    const [isAnswered, setIsAnswered] = useState(false);
    const { fetchQuestions } = useTriviaQuestions();
    const [modalContent, setModalContent] = useState(null);
    
    useEffect(() => {
        if (gameMode === 'multiplayer') {
            if (!roomId) return;
            const roomDocRef = doc(db, `artifacts/${appId}/public/data/rooms/${roomId}`);
            const unsubscribe = onSnapshot(roomDocRef, (doc) => {
                if (doc.exists()) {
                    const data = doc.data();
                    setGameData(data);
                    const myAnswer = data.answers ? data.answers[userId] : undefined;
                    if(myAnswer !== undefined) { setIsAnswered(true); setSelectedAnswer(myAnswer); } else { setIsAnswered(false); setSelectedAnswer(null); }
                    if(data.gameState === 'finished') {
                        const sortedPlayers = [...data.players].sort((a,b) => b.score - a.score);
                        setModalContent({ title: "Game Over!", body: <WinnerDisplay players={sortedPlayers} /> });
                    }
                } else {
                     setModalContent({ title: "Error", body: <p>The game room was not found.</p> });
                }
            });
            return () => unsubscribe();
        } else {
            const startSinglePlayerGame = async () => {
                const questions = await fetchQuestions();
                setGameData({ questions, currentQuestionIndex: 0, players: [{ uid: userId, name: playerName, score: 0 }], gameState: 'playing', answers: {} });
            };
            startSinglePlayerGame();
        }
    }, [gameMode, roomId, userId, playerName, fetchQuestions]);

    const handleAnswerSelect = async (answer) => {
        if (isAnswered) return;
        setSelectedAnswer(answer);
        setIsAnswered(true);
        const currentQuestion = gameData.questions[gameData.currentQuestionIndex];
        const isCorrect = answer === currentQuestion.correctAnswer;
        
        if (gameMode === 'multiplayer') {
            const roomDocRef = doc(db, `artifacts/${appId}/public/data/rooms/${roomId}`);
            const newAnswers = { ...gameData.answers, [userId]: answer };
            const payload = { answers: newAnswers };
            if (isCorrect) {
                payload.players = gameData.players.map(p => p.uid === userId ? { ...p, score: p.score + 1 } : p);
            }
            await updateDoc(roomDocRef, payload);
        } else {
            if (isCorrect) {
                setGameData(prev => ({...prev, players: [{...prev.players[0], score: prev.players[0].score + 1 }]}));
            }
        }
    };
    
    const handleNextQuestion = async () => {
        const nextIndex = gameData.currentQuestionIndex + 1;
        const isGameOver = nextIndex >= gameData.questions.length;

        if (gameMode === 'multiplayer') {
            const roomDocRef = doc(db, `artifacts/${appId}/public/data/rooms/${roomId}`);
            if (isGameOver) await updateDoc(roomDocRef, { gameState: 'finished' });
            else await updateDoc(roomDocRef, { currentQuestionIndex: nextIndex, answers: {} });
        } else {
             if (isGameOver) {
                setGameData(prev => ({...prev, gameState: 'finished' }));
                const sortedPlayers = [...gameData.players].sort((a,b) => b.score - a.score);
                setModalContent({ title: "Game Over!", body: <WinnerDisplay players={sortedPlayers} /> });
             } else {
                setGameData(prev => ({ ...prev, currentQuestionIndex: nextIndex }));
                setIsAnswered(false);
                setSelectedAnswer(null);
             }
        }
    };
    
    const handleLeaveGame = () => setView('mainMenu');
    
    if (!gameData || !gameData.questions || gameData.questions.length === 0) return <LoadingSpinner />;
    
    const currentQuestion = gameData.questions[gameData.currentQuestionIndex];
    const myPlayer = gameData.players.find(p => p.uid === userId) || gameData.players[0];
    const isHost = gameMode === 'multiplayer' ? gameData.hostId === userId : true;
    const allPlayersAnswered = gameMode === 'multiplayer' ? gameData.players.length === Object.keys(gameData.answers || {}).length : isAnswered;
    const getAnswerClass = (answer) => {
        if (!allPlayersAnswered) return 'bg-gray-700 hover:bg-gray-600 border-gray-600';
        const isCorrect = answer === currentQuestion.correctAnswer;
        if(isCorrect) return 'bg-green-500/50 border-green-500 animate-pulse-fast';
        if (answer === selectedAnswer && !isCorrect) return 'bg-red-500/50 border-red-500';
        return 'bg-gray-800 border-gray-700 opacity-70';
    };
    
    return (
        <div className="w-full max-w-4xl mx-auto p-2 sm:p-4 flex flex-col h-screen max-h-screen text-white">
            {modalContent && <CustomModal title={modalContent.title} onClose={() => { setModalContent(null); handleLeaveGame(); }}>{modalContent.body}</CustomModal>}
            <div className="flex-shrink-0 flex justify-between items-center mb-4">
                <span className="bg-purple-500/20 text-purple-300 font-bold px-4 py-2 rounded-lg text-sm sm:text-base">Question #{gameData.currentQuestionIndex + 1}</span>
                <div className="text-center"><p className="font-bold text-lg sm:text-xl">Score: {myPlayer.score}</p>{gameMode === 'multiplayer' && <p className="text-gray-400 text-xs">Room: {roomId}</p>}</div>
                <button onClick={handleLeaveGame} className="bg-gray-700 hover:bg-gray-600 font-bold py-2 px-4 rounded-lg text-sm sm:text-base">Leave</button>
            </div>
            
            <main className="flex-grow flex flex-col justify-center">
                <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-4 sm:p-6 mb-4">
                    <div className="flex gap-2 mb-4 flex-wrap"><span className="text-xs sm:text-sm bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full" dangerouslySetInnerHTML={{ __html: currentQuestion.category }}></span><span className="text-xs sm:text-sm bg-yellow-500/20 text-yellow-300 px-3 py-1 rounded-full capitalize" dangerouslySetInnerHTML={{ __html: currentQuestion.difficulty }}></span></div>
                    <h2 className="text-xl sm:text-2xl font-bold mb-6 min-h-[6rem] flex items-center" dangerouslySetInnerHTML={{ __html: currentQuestion.question }}></h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">{currentQuestion.answers.map((answer, index) => (<button key={index} onClick={() => handleAnswerSelect(answer)} disabled={isAnswered} className={`w-full p-3 sm:p-4 rounded-xl border-2 font-semibold text-left transition-all duration-300 text-sm sm:text-base ${getAnswerClass(answer)}`}><span dangerouslySetInnerHTML={{ __html: answer }}></span></button>))}</div>
                </div>
            </main>
            
            <footer className="flex-shrink-0">
                {allPlayersAnswered && (
                     <div className="text-center mb-4 p-3 rounded-lg bg-gray-800 border border-gray-700">
                        {selectedAnswer === currentQuestion.correctAnswer ? <p className="text-xl sm:text-2xl font-bold text-green-400 flex items-center justify-center gap-2"><CheckCircle /> Correct!</p> : <p className="text-xl sm:text-2xl font-bold text-red-400 flex items-center justify-center gap-2"><XCircle /> Incorrect!</p>}
                        {selectedAnswer !== currentQuestion.correctAnswer && <p className="text-gray-300 mt-2 text-sm sm:text-base">Correct answer: <span className="font-bold text-green-400" dangerouslySetInnerHTML={{__html: currentQuestion.correctAnswer}}></span></p>}
                     </div>
                )}
                {gameMode === 'multiplayer' && (<div className="bg-gray-800/50 border border-gray-700 rounded-xl p-3 mb-4"><h4 className="text-white text-center font-bold text-sm mb-2">Players</h4><div className="flex flex-wrap justify-center gap-x-3 gap-y-1 text-sm">{gameData.players.map(p => (<div key={p.uid} className={`flex items-center gap-1 p-1.5 rounded-lg transition-all ${gameData.answers && gameData.answers[p.uid] !== undefined ? 'bg-green-500/20' : 'bg-gray-700/50'}`}><span className="text-white">{p.name}</span><span className="text-gray-300 font-mono">({p.score})</span>{gameData.answers && gameData.answers[p.uid] !== undefined && <CheckCircle size={14} className="text-green-400"/>}</div>))}</div></div>)}
                {(allPlayersAnswered) && (isHost) && (<button onClick={handleNextQuestion} className="w-full bg-gradient-to-r from-purple-600 to-blue-500 text-white font-bold py-3 px-5 rounded-xl text-lg transition-transform transform hover:scale-105">{gameData.currentQuestionIndex >= gameData.questions.length - 1 ? 'Finish Game' : 'Next Question'}</button>)}
            </footer>
        </div>
    );
};

const WinnerDisplay = ({ players }) => (
    <div className="text-white"><div className="flex justify-center items-end gap-2 sm:gap-4 mb-6">{players.slice(0, 3).map((player, index) => (<div key={player.uid} className={`flex flex-col items-center ${index === 0 ? 'order-2' : (index === 1 ? 'order-1' : 'order-3')}`}><Crown className={`${index === 0 ? 'text-yellow-400 h-10 w-10' : ''}${index === 1 ? 'text-gray-300 h-8 w-8' : ''}${index === 2 ? 'text-yellow-600 h-8 w-8' : ''}`} /><div className={`p-3 rounded-t-lg ${index === 0 ? 'bg-yellow-500' : (index === 1 ? 'bg-gray-400' : 'bg-yellow-700')}`}><User size={32}/></div><div className={`text-center font-bold px-2 py-1 rounded-b-lg w-full ${index === 0 ? 'bg-yellow-600 h-24 flex items-center justify-center' : (index === 1 ? 'bg-gray-500 h-20 flex items-center justify-center' : 'bg-yellow-800 h-16 flex items-center justify-center')}`}><div><p className="text-base sm:text-lg">{player.name}</p><p className="text-lg sm:text-xl">{player.score}</p></div></div></div>))}</div><h3 className="text-lg font-bold text-center mb-2">Final Scores</h3><div className="space-y-2 max-h-40 overflow-y-auto">{players.map((player, index) => (<div key={player.uid} className="bg-gray-700 p-2 rounded-lg flex justify-between items-center text-sm"><span className="font-semibold">{index + 1}. {player.name}</span><span className="font-mono">{player.score} points</span></div>))}</div></div>
);


export default function App() {
    const [view, setView] = useState('loading');
    const [gameMode, setGameMode] = useState('single');
    const [playerName, setPlayerName] = useState('');
    const [roomId, setRoomId] = useState(null);
    const [userId, setUserId] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false);
    const [error, setError] = useState(null);
    const [directJoinRoomId, setDirectJoinRoomId] = useState(null);

    // Effect to handle joining from a URL
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const roomCodeFromUrl = urlParams.get('room');
        if (roomCodeFromUrl) {
            setDirectJoinRoomId(roomCodeFromUrl.toUpperCase());
            setGameMode('multiplayer');
        }
    }, []);

    // Effect for Firebase authentication
    useEffect(() => {
        if (!auth) { setError("Firebase not initialized."); setView('error'); return; }
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setUserId(user.uid);
            } else {
                try {
                    if (initialAuthToken) await signInWithCustomToken(auth, initialAuthToken);
                    else await signInAnonymously(auth);
                } catch (authError) {
                    console.error("Authentication failed:", authError);
                    setError("Authentication failed.");
                    setView('error');
                }
            }
            if(!isAuthReady) setIsAuthReady(true);
        });
        return () => unsubscribe();
    }, [isAuthReady]);

    // Effect to determine initial view
    useEffect(() => {
        if (isAuthReady) {
            if (directJoinRoomId) {
                setView('enterName');
            } else {
                setView('mainMenu');
            }
        }
    }, [isAuthReady, directJoinRoomId]);

    const handleJoinRoom = useCallback(async (code, pName, errorHandler = setError) => {
        const roomCode = code.trim().toUpperCase();
        if (!roomCode) return;
        const roomDocRef = doc(db, `artifacts/${appId}/public/data/rooms/${roomCode}`);
        try {
            const roomDoc = await getDoc(roomDocRef);
            if (roomDoc.exists()) {
                const roomData = roomDoc.data();
                if (!roomData.players.some(p => p.uid === userId)) {
                     await updateDoc(roomDocRef, {
                        players: arrayUnion({ uid: userId, name: pName, score: 0 })
                    });
                }
                setRoomId(roomCode);
                setView('lobby');
            } else {
                errorHandler('Room not found. Check the code and try again.');
            }
        } catch (e) {
            console.error("Error joining room: ", e);
            errorHandler('Could not join room. Please try again.');
        }
    }, [userId]);


    const renderView = () => {
        if (view === 'error') return <div className="text-red-400 text-center">{error}</div>;
        if (view === 'loading' || !isAuthReady) return <LoadingSpinner />;

        switch (view) {
            case 'mainMenu':
                return <MainMenu setView={setView} setGameMode={setGameMode} />;
            case 'enterName':
                return <EnterName setView={setView} setPlayerName={setPlayerName} gameMode={gameMode} playerName={playerName} directJoinRoomId={directJoinRoomId} handleJoinRoom={handleJoinRoom} />;
            case 'multiplayerMenu':
                return <MultiplayerMenu setView={setView} setRoomId={setRoomId} userId={userId} playerName={playerName} handleJoinRoom={handleJoinRoom} />;
            case 'lobby':
                return <Lobby setView={setView} roomId={roomId} userId={userId} />;
            case 'game':
                return <Game gameMode={gameMode} roomId={roomId} userId={userId} setView={setView} playerName={playerName}/>;
            default:
                return <MainMenu setView={setView} setGameMode={setGameMode} />;
        }
    };

    return (
        <div className="bg-gray-900 text-white font-sans w-full h-screen overflow-hidden">
             <div className="container mx-auto h-full flex flex-col items-center justify-center">
                {renderView()}
             </div>
        </div>
    );
}
