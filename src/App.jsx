import React, { useEffect, useState, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const VOWELS = ["A", "E", "I", "O", "U"];
const RARE_LETTERS = ["Q", "X", "Z", "J", "K"];
const GRID_SIZE = 5;
const TOTAL_TILES = GRID_SIZE * GRID_SIZE;

function App() {
  const [showInstructions, setShowInstructions] = useState(true);
  const [letters, setLetters] = useState([]);
  const [pattern, setPattern] = useState([]);
  const [revealed, setRevealed] = useState([]);
  const [selectedTiles, setSelectedTiles] = useState([]);
  const [flashingTile, setFlashingTile] = useState(null);
  const [gamePhase, setGamePhase] = useState("waiting");

  const [wordInput, setWordInput] = useState("");
  const [words, setWords] = useState([]);
  const [timer, setTimer] = useState(0);
  const inputRef = useRef(null);

  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
  const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

 const SUPABASE_URL = "https://uxobxjuwajzvcjveyrxe.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV4b2J4anV3YWp6dmNqdmV5cnhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQwNDExNTUsImV4cCI6MjA1OTYxNzE1NX0._HP4241yGwbu14uqWsdqcYFxUsIa0W5y-hO6fAUCiwk";

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  const getRandomLetters = () => {
    const result = [];
    const weightedLetters = [];
    for (let char of LETTERS) {
      let weight = 1;
      if (RARE_LETTERS.includes(char)) weight *= 0.5;
      if (["V", "B", "Y", "G", "P"].includes(char)) weight *= 0.7;
      weightedLetters.push(...Array(Math.floor(weight * 100)).fill(char));
    }
    const vowel = VOWELS[Math.floor(Math.random() * VOWELS.length)];
    result.push(vowel);
    while (result.length < TOTAL_TILES) {
      const char = weightedLetters[Math.floor(Math.random() * weightedLetters.length)];
      result.push(char);
    }
    return result.slice(0, TOTAL_TILES);
  };

  const getRandomPattern = (letters) => {
    const pattern = new Set();
    const usedLetters = new Set();
    while (pattern.size < 5) {
      const index = Math.floor(Math.random() * TOTAL_TILES);
      const letter = letters[index];
      if (!usedLetters.has(letter)) {
        pattern.add(index);
        usedLetters.add(letter);
      }
    }
    return Array.from(pattern);
  };

  const startPatternAnimation = (patternArray) => {
    let index = 0;
    const interval = setInterval(() => {
      if (index < patternArray.length) {
        setFlashingTile(patternArray[index]);
        setTimeout(() => setFlashingTile(null), 500);
        index++;
      } else {
        clearInterval(interval);
        setGamePhase("selectTiles");
      }
    }, 800);
  };

  const initializeGame = () => {
    const newLetters = getRandomLetters();
    const newPattern = getRandomPattern(newLetters);
    setLetters(newLetters);
    setPattern(newPattern);
    setRevealed(Array(TOTAL_TILES).fill(false));
    setSelectedTiles([]);
    setWords([]);
    setWordInput("");
    setGamePhase("showPattern");
    startPatternAnimation(newPattern);
  };

  const handleTileClick = (index) => {
    if (gamePhase !== "selectTiles" || revealed[index] || selectedTiles.length >= 5) return;
    const newRevealed = [...revealed];
    newRevealed[index] = true;
    setRevealed(newRevealed);
    const newSelected = [...selectedTiles, index];
    setSelectedTiles(newSelected);

    if (newSelected.length === 5) {
      setGamePhase("enterWords");
      setTimer(30);
    }
  };

  const handleWordSubmit = () => {
    if (!wordInput.trim()) return;
    const word = wordInput.trim().toUpperCase();
    const valid = word.length >= 3;
    const score = valid ? word.length * 5 : 0;
    setWords([...words, { word, valid, score }]);
    setWordInput("");
  };

  useEffect(() => {
    if (gamePhase === "enterWords" && timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [gamePhase, timer]);

  return (
    <>
      {showInstructions && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}>
          <div style={{ backgroundColor: "white", padding: "1.5rem", borderRadius: "0.5rem", maxWidth: "400px", width: "100%" }}>
            <h1 style={{ fontSize: "1.875rem", fontWeight: "bold", textAlign: "center", marginBottom: "1rem" }}>
              <span style={{ color: '#786daa' }}>Fresh </span>
              <span style={{ color: '#84dade' }}>Focus</span>
            </h1>
            <ul style={{ fontSize: "0.875rem", marginBottom: "1rem" }}>
              <li>Watch the pattern of 5 flashing tiles.</li>
              <li>Repeat the pattern by choosing the right tiles.</li>
              <li>Use the letters to form valid words.</li>
            </ul>
            <button onClick={() => { initializeGame(); setShowInstructions(false); }} style={{ width: "100%", backgroundColor: "#786daa", color: "white", padding: "0.5rem", borderRadius: "0.25rem" }}>Start Game</button>
          </div>
        </div>
      )}
      <div style={{ padding: "1rem", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <h1 style={{ fontSize: "1.875rem", fontWeight: "bold", marginBottom: "1rem" }}>
          <span style={{ color: '#786daa' }}>Fresh </span>
          <span style={{ color: '#84dade' }}>Focus</span>
        </h1>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 60px)", gap: "0.5rem" }}>
          {letters.map((letter, idx) => {
            const isRevealed = revealed[idx];
            const isFlashing = flashingTile === idx;
            const backgroundColor = isFlashing ? "#ffffff" : isRevealed ? "#dedede" : "#786daa";
            const color = isRevealed || isFlashing ? "black" : "white";
            return (
              <div
                key={idx}
                onClick={() => handleTileClick(idx)}
                style={{
                  backgroundColor,
                  color,
                  width: 60,
                  height: 60,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 24,
                  borderRadius: 8,
                  cursor: gamePhase === "selectTiles" && !revealed[idx] ? "pointer" : "default"
                }}
              >
                {isRevealed || isFlashing ? letter : ""}
              </div>
            );
          })}
        </div>

        {gamePhase === "enterWords" && (
          <div style={{ marginTop: "1.5rem", textAlign: "center" }}>
            <p>⏱ Time Left: {timer}s</p>
            <input
              ref={inputRef}
              value={wordInput}
              onChange={(e) => setWordInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleWordSubmit()}
              placeholder="Enter a word"
              style={{
                padding: "0.5rem",
                borderRadius: "0.25rem",
                border: "1px solid #ccc",
                marginBottom: "0.5rem"
              }}
            />
            <br />
            <button
              onClick={handleWordSubmit}
              style={{
                backgroundColor: "#84dade",
                color: "white",
                padding: "0.5rem 1rem",
                border: "none",
                borderRadius: "0.25rem"
              }}
            >
              Submit Word
            </button>
            <div style={{ marginTop: "1rem" }}>
              <h3>Words:</h3>
              <ul>
                {words.map((w, idx) => (
                  <li key={idx}>
                    {w.word} {w.valid ? "✅" : "❌"}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default App;
