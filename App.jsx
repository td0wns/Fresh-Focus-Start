import React, { useEffect, useState, useRef } from "react";
import Input from "./components/ui/input";
import Button from "./components/ui/button";
import { createClient } from '@supabase/supabase-js';

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const VOWELS = ["A", "E", "I", "O", "U"];
const RARE_LETTERS = ["Q", "X", "Z", "J", "K"];
const GRID_SIZE = 5;
const TOTAL_TILES = GRID_SIZE * GRID_SIZE;

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

function getRandomLetters() {
  const letterCounts = {};
  const result = [];
  const usedReducedLetters = new Set();
  const weightedLetters = [];

  for (let char of LETTERS) {
    let weight = 1;
    if (RARE_LETTERS.includes(char)) weight *= 0.5;
    if (["V", "B", "Y", "G", "P"].includes(char)) weight *= 0.7;
    weightedLetters.push(...Array(Math.floor(weight * 100)).fill(char));
  }

  const vowel = VOWELS[Math.floor(Math.random() * VOWELS.length)];
  result.push(vowel);
  letterCounts[vowel] = 1;

  while (result.length < TOTAL_TILES) {
    const char = weightedLetters[Math.floor(Math.random() * weightedLetters.length)];
    if ((letterCounts[char] || 0) >= 2) continue;
    if ((RARE_LETTERS.includes(char) || ["V", "B", "Y", "G", "P"].includes(char)) && usedReducedLetters.has(char)) continue;
    const reduction = letterCounts[char] ? Math.max(0.1, 1 - 0.1 * letterCounts[char]) : 1;
    if (Math.random() < reduction) {
      result.push(char);
      letterCounts[char] = (letterCounts[char] || 0) + 1;
      if (RARE_LETTERS.includes(char) || ["V", "B", "Y", "G", "P"].includes(char)) {
        usedReducedLetters.add(char);
      }
    }
  }
  return result.slice(0, TOTAL_TILES);
}

function getRandomPattern(letters) {
  const pattern = new Set();
  const usedLetters = new Set();
  let attempts = 0;
  while (pattern.size < 5 && attempts < 1000) {
    const index = Math.floor(Math.random() * TOTAL_TILES);
    const letter = letters[index];
    if (!usedLetters.has(letter)) {
      pattern.add(index);
      usedLetters.add(letter);
    }
    attempts++;
  }
  const patternLetters = Array.from(pattern).map(i => letters[i]);
  if (!patternLetters.some(l => VOWELS.includes(l))) {
    const vowelIndices = letters.map((l, i) => VOWELS.includes(l) ? i : -1).filter(i => i !== -1);
    const replacementIndex = vowelIndices[Math.floor(Math.random() * vowelIndices.length)];
    pattern.delete(Array.from(pattern)[Math.floor(Math.random() * pattern.size)]);
    pattern.add(replacementIndex);
  }
  return Array.from(pattern);
}

async function isWordValid(word) {
  try {
    const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word.toLowerCase()}`);
    if (!response.ok) return false;
    const data = await response.json();
    return Array.isArray(data);
  } catch (error) {
    console.error("Dictionary check failed:", error);
    return false;
  }
}

export default function App() {
  const [letters, setLetters] = useState([]);
  const [pattern, setPattern] = useState([]);
  const [revealed, setRevealed] = useState([]);
  const [selectedTiles, setSelectedTiles] = useState([]);
  const [wordInput, setWordInput] = useState("");
  const [words, setWords] = useState([]);
  const [timer, setTimer] = useState(0);
  const [gamePhase, setGamePhase] = useState("waiting");
  const [flashingTile, setFlashingTile] = useState(null);
  const [patternScore, setPatternScore] = useState(0);
  const inputRef = useRef(null);

  const totalWordScore = words.reduce((sum, w) => sum + (w.valid ? w.score : 0), 0);
  const totalScore = patternScore + totalWordScore;

  const startPatternAnimation = (patternArray) => {
    let index = 0;
    const interval = setInterval(() => {
      if (index < patternArray.length) {
        setFlashingTile(patternArray[index]);
        setTimeout(() => setFlashingTile(null), 400);
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
    setWordInput("");
    setWords([]);
    setTimer(0);
    setPatternScore(0);
    setGamePhase("showPattern");
    startPatternAnimation(newPattern);
  };

  useEffect(() => {
    if (gamePhase === "startTimer") {
      setTimer(30);
      setTimeout(() => setGamePhase("enterWords"), 100);
    }

    if (gamePhase === "enterWords") {
      if (timer === 0) return;
      const countdown = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            clearInterval(countdown);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(countdown);
    }
  }, [gamePhase]);

  const handleTileClick = (index) => {
    if (gamePhase !== "selectTiles" || revealed[index] || selectedTiles.length >= 5) return;
    const newRevealed = [...revealed];
    newRevealed[index] = true;
    setRevealed(newRevealed);
    const newSelected = [...selectedTiles, index];

    let scoreIncrement = 0;
    if (pattern.includes(index)) {
      scoreIncrement += 10;
      const position = newSelected.length - 1;
      if (pattern[position] === index) {
        scoreIncrement += 10;
      }
    }

    if (newSelected.length === 5) {
      const fullMatch = pattern.every((val, i) => newSelected[i] === val);
      if (fullMatch) {
        scoreIncrement += 50;
      }
      setGamePhase("startTimer");
      setTimer(60);
    }

    setSelectedTiles(newSelected);
    setPatternScore((prev) => prev + scoreIncrement);
  };

  const handleWordSubmit = async () => {
    if (!wordInput.trim()) return;
    const word = wordInput.trim().toUpperCase();
    const valid = await isWordValid(word);
    let score = 0;
    if (valid) score = word.length * 5;
    setWords((prev) => [...prev, { word, valid, score }]);
    setWordInput("");
  };

  return (
    <div style={{ padding: 20, fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: 32, marginBottom: 10 }}>Fresh Focus</h1>
      {gamePhase === "waiting" && (
        <Button onClick={initializeGame}>Start Game</Button>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 60px)', gap: 8, marginTop: 20 }}>
        {letters.map((letter, i) => {
          const isFlashing = flashingTile === i;
          const isRevealed = revealed[i];
          const backgroundColor = isFlashing
            ? "#fff"
            : isRevealed
            ? pattern.includes(i)
              ? "#c3f3c3"
              : "#eee"
            : "#999";
          return (
            <div
              key={i}
              onClick={() => handleTileClick(i)}
              style={{
                backgroundColor,
                color: isRevealed ? '#000' : '#fff',
                height: 60,
                width: 60,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 6,
                cursor: 'pointer',
                fontSize: 20
              }}
            >
              {(isRevealed || isFlashing) ? letter : ''}
            </div>
          );
        })}
      </div>

      {gamePhase === "enterWords" && (
        <div style={{ marginTop: 20 }}>
          <div>Time Left: {timer}s</div>
          <div>Pattern Score: {patternScore}</div>
          <Input
            ref={inputRef}
            value={wordInput}
            onChange={(e) => setWordInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleWordSubmit()}
            placeholder="Enter word..."
            spellCheck={true}
            className="border px-2 py-1 rounded"
            disabled={timer === 0}
          />
          <Button onClick={handleWordSubmit}>Submit Word</Button>
          <div>Total Score: {totalScore}</div>
          <ul>
            {words.map((w, idx) => (
              <li key={idx}>{w.word} {w.valid ? '✅' : '❌'} {w.valid && `+${w.score}`}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
