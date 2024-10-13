"use client"

import React, { useState, useEffect, useCallback, useRef } from "react"
import { motion, useAnimation } from "framer-motion"
import { Shield, Zap, Award } from "lucide-react"

const COLORS = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A"]
const POWER_UPS = ["shield", "slowdown", "multiplier"]

interface Gate {
  id: number
  color: string
  x: number
}

interface PowerUp {
  id: number
  type: string
  x: number
}

export default function ColorDash() {
  const [score, setScore] = useState(0)
  const [highScore, setHighScore] = useState(0)
  const [currentColor, setCurrentColor] = useState(COLORS[0])
  const [gameStarted, setGameStarted] = useState(false)
  const [gameOver, setGameOver] = useState(false)
  const [gameSpeed, setGameSpeed] = useState(2000)
  const [gates, setGates] = useState<Gate[]>([])
  const [powerUps, setPowerUps] = useState<PowerUp[]>([])
  const [activePowerUp, setActivePowerUp] = useState<string | null>(null)
  const [scoreMultiplier, setScoreMultiplier] = useState(1)

  const dotRef = useRef<HTMLDivElement>(null)
  const gameAreaRef = useRef<HTMLDivElement>(null)
  const dotAnimation = useAnimation()
  const requestRef = useRef<number>()
  const previousTimeRef = useRef<number>()
  const gateIdRef = useRef(0)
  const powerUpIdRef = useRef(0)

  const animateDot = useCallback(() => {
    dotAnimation.start({
      y: [0, 50, 0],
      transition: { duration: 2, repeat: Infinity, ease: "easeInOut" },
    })
  }, [dotAnimation])

  const generateGate = useCallback(() => {
    const newGate: Gate = {
      id: gateIdRef.current++,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      x: 400,
    }
    setGates((prevGates) => [...prevGates, newGate])
  }, [])

  const generatePowerUp = useCallback(() => {
    if (Math.random() < 0.1) {
      const newPowerUp: PowerUp = {
        id: powerUpIdRef.current++,
        type: POWER_UPS[Math.floor(Math.random() * POWER_UPS.length)],
        x: 400,
      }
      setPowerUps((prevPowerUps) => [...prevPowerUps, newPowerUp])
    }
  }, [])

  const endGame = useCallback(() => {
    setGameOver(true)
    setGameStarted(false)
    if (score > highScore) {
      setHighScore(score)
    }
  }, [score, highScore])

  const activatePowerUp = useCallback((type: string) => {
    setActivePowerUp(type)
    if (type === "slowdown") {
      setGameSpeed((prevSpeed) => prevSpeed * 1.5)
    } else if (type === "multiplier") {
      setScoreMultiplier(2)
    }
    setTimeout(() => {
      setActivePowerUp(null)
      if (type === "slowdown") {
        setGameSpeed((prevSpeed) => prevSpeed / 1.5)
      } else if (type === "multiplier") {
        setScoreMultiplier(1)
      }
    }, 5000)
  }, [])

  const checkCollisions = useCallback(() => {
    if (dotRef.current && gameAreaRef.current) {
      const dotRect = dotRef.current.getBoundingClientRect()
      const gameAreaRect = gameAreaRef.current.getBoundingClientRect()

      setGates((prevGates) =>
        prevGates.filter((gate) => {
          const gateRect = {
            left: gameAreaRect.left + gate.x,
            right: gameAreaRect.left + gate.x + 16,
            top: gameAreaRect.top,
            bottom: gameAreaRect.bottom,
          }

          if (
            dotRect.right > gateRect.left &&
            dotRect.left < gateRect.right &&
            dotRect.bottom > gateRect.top &&
            dotRect.top < gateRect.bottom
          ) {
            if (gate.color !== currentColor && activePowerUp !== "shield") {
              endGame()
              return false
            } else {
              setScore((prevScore) => prevScore + 10 * scoreMultiplier)
              return false
            }
          }
          return true
        })
      )

      setPowerUps((prevPowerUps) =>
        prevPowerUps.filter((powerUp) => {
          const powerUpRect = {
            left: gameAreaRect.left + powerUp.x,
            right: gameAreaRect.left + powerUp.x + 24,
            top: gameAreaRect.top + gameAreaRect.height / 2 - 12,
            bottom: gameAreaRect.top + gameAreaRect.height / 2 + 12,
          }

          if (
            dotRect.right > powerUpRect.left &&
            dotRect.left < powerUpRect.right &&
            dotRect.bottom > powerUpRect.top &&
            dotRect.top < powerUpRect.bottom
          ) {
            activatePowerUp(powerUp.type)
            return false
          }
          return true
        })
      )
    }
  }, [currentColor, activePowerUp, scoreMultiplier, endGame, activatePowerUp])

  const moveObjects = useCallback(() => {
    setGates((prevGates) =>
      prevGates
        .map((gate) => ({ ...gate, x: gate.x - 2 }))
        .filter((gate) => gate.x > -50)
    )

    setPowerUps((prevPowerUps) =>
      prevPowerUps
        .map((powerUp) => ({ ...powerUp, x: powerUp.x - 2 }))
        .filter((powerUp) => powerUp.x > -50)
    )

    checkCollisions()
  }, [checkCollisions])

  useEffect(() => {
    if (gameStarted && !gameOver) {
      animateDot()
      const gateInterval = setInterval(generateGate, 2000)
      const powerUpInterval = setInterval(generatePowerUp, 5000)
      const moveInterval = setInterval(moveObjects, 16) // 60 FPS

      return () => {
        clearInterval(gateInterval)
        clearInterval(powerUpInterval)
        clearInterval(moveInterval)
      }
    }
  }, [gameStarted, gameOver, animateDot, generateGate, generatePowerUp, moveObjects])

  const startGame = () => {
    setGameStarted(true)
    setGameOver(false)
    setScore(0)
    setGameSpeed(2000)
    setGates([])
    setPowerUps([])
    setActivePowerUp(null)
    setScoreMultiplier(1)
    setCurrentColor(COLORS[0])
    gateIdRef.current = 0
    powerUpIdRef.current = 0
  }

  const changeColor = (color: string) => {
    if (gameStarted && !gameOver) {
      setCurrentColor(color)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold">Color Dash</h1>
          <div className="text-xl">Score: {score}</div>
        </div>

        <div
          ref={gameAreaRef}
          className="relative w-full h-48 bg-gray-800 rounded-lg overflow-hidden mb-4"
        >
          <motion.div
            ref={dotRef}
            className="absolute w-8 h-8 rounded-full"
            style={{ backgroundColor: currentColor, left: '10%' }}
            animate={dotAnimation}
          />
          {gates.map((gate) => (
            <div
              key={gate.id}
              className="absolute top-0 w-4 h-full"
              style={{ backgroundColor: gate.color, left: `${gate.x}px` }}
            />
          ))}
          {powerUps.map((powerUp) => (
            <div
              key={powerUp.id}
              className="absolute top-1/2 -mt-3 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center"
              style={{ left: `${powerUp.x}px` }}
            >
              {powerUp.type === "shield" && <Shield size={16} />}
              {powerUp.type === "slowdown" && <Zap size={16} />}
              {powerUp.type === "multiplier" && <Award size={16} />}
            </div>
          ))}
        </div>

        <div className="flex justify-around mb-6">
          {COLORS.map((color) => (
            <button
              key={color}
              className="w-12 h-12 rounded-full focus:outline-none focus:ring-2 focus:ring-white"
              style={{ backgroundColor: color }}
              onClick={() => changeColor(color)}
              aria-label={`Change to ${color}`}
            />
          ))}
        </div>

        {activePowerUp && (
          <div className="mb-4 text-center">
            Active Power-up: {activePowerUp}
          </div>
        )}

        {gameOver && (
          <div className="mb-4 text-center">
            <h2 className="text-2xl font-bold">Game Over</h2>
            <p>Your score: {score}</p>
            <p>High score: {highScore}</p>
          </div>
        )}

        <button
          className="w-full py-3 bg-green-500 hover:bg-green-600 rounded-lg text-xl font-semibold transition duration-300"
          onClick={startGame}
        >
          {gameStarted ? "Restart Game" : "Start Game"}
        </button>

        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-2">How to Play:</h2>
          <ul className="list-disc list-inside">
            <li>Click the colored buttons to change the dot's color</li>
            <li>Match the dot's color with the incoming gates</li>
            <li>Collect power-ups for special abilities</li>
            <li>Survive as long as you can and beat your high score!</li>
          </ul>
        </div>
      </div>
    </div>
  )
}