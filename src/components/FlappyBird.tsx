import React, { useRef, useEffect, useState } from 'react';
import { Bird, Ghost, Star } from 'lucide-react';

const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 600;
const BIRD_WIDTH = 40;
const BIRD_HEIGHT = 30;
const PIPE_WIDTH = 60;
const PIPE_GAP = 200;
const GRAVITY = 0.5;
const JUMP_STRENGTH = -10;

interface Pipe {
  x: number;
  topHeight: number;
}

const FlappyBird: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [birdY, setBirdY] = useState(CANVAS_HEIGHT / 2);
  const [birdVelocity, setBirdVelocity] = useState(0);
  const [pipes, setPipes] = useState<Pipe[]>([]);
  const [difficulty, setDifficulty] = useState(1);
  const [lastPipeSpawn, setLastPipeSpawn] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const gameLoop = (timestamp: number) => {
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Update bird position and velocity
      setBirdY(prevY => prevY + birdVelocity);
      setBirdVelocity(prevVelocity => prevVelocity + GRAVITY);

      // Draw background
      drawBackground(ctx);

      // Draw bird
      drawBird(ctx);

      // Update and draw pipes
      updatePipes(timestamp);
      drawPipes(ctx);

      // Check collisions
      if (checkCollisions()) {
        endGame();
        return;
      }

      // Update score
      updateScore();

      // Increase difficulty
      if (score > 0 && score % 10 === 0) {
        setDifficulty(prev => Math.min(prev + 1, 5));
      }

      animationFrameId = requestAnimationFrame(gameLoop);
    };

    if (gameStarted && !gameOver) {
      animationFrameId = requestAnimationFrame(gameLoop);
    }

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [gameStarted, gameOver, birdY, birdVelocity, pipes, score, difficulty, lastPipeSpawn]);

  const updatePipes = (timestamp: number) => {
    if (timestamp - lastPipeSpawn > 1500) {
      const newPipe: Pipe = {
        x: CANVAS_WIDTH,
        topHeight: Math.random() * (CANVAS_HEIGHT - PIPE_GAP - 100) + 50,
      };
      setPipes(prevPipes => [...prevPipes, newPipe]);
      setLastPipeSpawn(timestamp);
    }

    setPipes(prevPipes =>
      prevPipes
        .map(pipe => ({ ...pipe, x: pipe.x - 2 - difficulty }))
        .filter(pipe => pipe.x + PIPE_WIDTH > 0)
    );
  };

  const startGame = () => {
    setGameStarted(true);
    setGameOver(false);
    setScore(0);
    setBirdY(CANVAS_HEIGHT / 2);
    setBirdVelocity(0);
    setPipes([]);
    setDifficulty(1);
    setLastPipeSpawn(0);
  };

  const endGame = () => {
    setGameOver(true);
    setGameStarted(false);
    if (score > highScore) {
      setHighScore(score);
    }
  };

  const handleClick = () => {
    if (gameOver) {
      startGame();
    } else if (gameStarted) {
      setBirdVelocity(JUMP_STRENGTH);
    } else {
      startGame();
    }
  };

  const drawBackground = (ctx: CanvasRenderingContext2D) => {
    const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    gradient.addColorStop(0, '#87CEEB');
    gradient.addColorStop(1, '#E0F6FF');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw clouds
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.beginPath();
    ctx.arc(100, 100, 30, 0, Math.PI * 2);
    ctx.arc(130, 100, 40, 0, Math.PI * 2);
    ctx.arc(160, 100, 30, 0, Math.PI * 2);
    ctx.fill();

    // Draw ground
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(0, CANVAS_HEIGHT - 20, CANVAS_WIDTH, 20);
  };

  const drawBird = (ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.ellipse(BIRD_WIDTH, birdY, BIRD_WIDTH / 2, BIRD_HEIGHT / 2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Draw eye
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(BIRD_WIDTH + 10, birdY - 5, 5, 0, Math.PI * 2);
    ctx.fill();

    // Draw beak
    ctx.fillStyle = '#FF6347';
    ctx.beginPath();
    ctx.moveTo(BIRD_WIDTH + 20, birdY);
    ctx.lineTo(BIRD_WIDTH + 30, birdY - 5);
    ctx.lineTo(BIRD_WIDTH + 30, birdY + 5);
    ctx.closePath();
    ctx.fill();
  };

  const drawPipes = (ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = '#00FF00';
    pipes.forEach(pipe => {
      ctx.fillRect(pipe.x, 0, PIPE_WIDTH, pipe.topHeight);
      ctx.fillRect(pipe.x, pipe.topHeight + PIPE_GAP, PIPE_WIDTH, CANVAS_HEIGHT - pipe.topHeight - PIPE_GAP);
    });
  };

  const checkCollisions = () => {
    const birdTop = birdY - BIRD_HEIGHT / 2;
    const birdBottom = birdY + BIRD_HEIGHT / 2;
    const birdLeft = BIRD_WIDTH - BIRD_WIDTH / 2;
    const birdRight = BIRD_WIDTH + BIRD_WIDTH / 2;

    // Check if bird hits the ground or ceiling
    if (birdTop <= 0 || birdBottom >= CANVAS_HEIGHT - 20) {
      return true;
    }

    // Check if bird hits pipes
    for (const pipe of pipes) {
      if (
        birdRight > pipe.x &&
        birdLeft < pipe.x + PIPE_WIDTH &&
        (birdTop < pipe.topHeight || birdBottom > pipe.topHeight + PIPE_GAP)
      ) {
        return true;
      }
    }

    return false;
  };

  const updateScore = () => {
    const passedPipe = pipes.find(pipe => pipe.x + PIPE_WIDTH < BIRD_WIDTH);
    if (passedPipe) {
      setScore(prevScore => prevScore + 1);
      setPipes(prevPipes => prevPipes.filter(p => p !== passedPipe));
    }
  };

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        handleClick();
      }
    };

    window.addEventListener('keydown', handleKeyPress);

    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [gameStarted, gameOver]);

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        onClick={handleClick}
        className="border-4 border-white rounded-lg shadow-lg"
      />
      {!gameStarted && !gameOver && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-50 text-white">
          <h1 className="text-4xl font-bold mb-4">Flappy Bird</h1>
          <button
            onClick={startGame}
            className="bg-yellow-400 text-black font-bold py-2 px-4 rounded hover:bg-yellow-300"
          >
            Start Game
          </button>
        </div>
      )}
      {gameOver && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-50 text-white">
          <h2 className="text-3xl font-bold mb-2">Game Over</h2>
          <p className="text-xl mb-4">Score: {score}</p>
          <p className="text-xl mb-4">High Score: {highScore}</p>
          <button
            onClick={startGame}
            className="bg-yellow-400 text-black font-bold py-2 px-4 rounded hover:bg-yellow-300"
          >
            Play Again
          </button>
        </div>
      )}
      <div className="absolute top-4 left-4 text-white text-2xl font-bold">
        Score: {score}
      </div>
      <div className="absolute top-4 right-4 text-white text-2xl font-bold">
        Level: {difficulty}
      </div>
    </div>
  );
};

export default FlappyBird;