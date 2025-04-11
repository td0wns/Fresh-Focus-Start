
import React, { useEffect, useState, useRef } from "react";
import Input from "./components/ui/input";
import Button from "./components/ui/button";
import { createClient } from "@supabase/supabase-js";

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const VOWELS = ["A", "E", "I", "O", "U"];
const GRID_SIZE = 5;
const TOTAL_TILES = GRID_SIZE * GRID_SIZE;

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

function getRandomLetters() {
  const letters = [];
  while (letters.length < TOTAL_TILES) {
    const char = LETTERS[Math.floor(Math.random() * LETTERS.length)];
    letters.push(char);
  }
  return letters;
}

function getRandomPattern(letters) {
  const indices = new Set();
  while (indices.size < 5) {
    indices.add(Math.floor(Math.random() * letters.length));
  }
  return Array.from(indices);
}

async function isWordValid(word) {
  try {
    const response = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${word.toLowerCase()}`
    );
    return response.ok;
  } catch {
    return false;
  }
}

export default function App() {
  const [letters, setLetters] = useState([]);
  const [pattern, setPattern] = useState([]);
  const [revealed, setRevealed] = useState(Array(TOTAL_TILES).fill(false));
  const [selected, setSelected] = useState([]);
  const [gamePhase, setGamePhase] = useState("waiting");
  const [flashingTile, setFlashingTile] = useState(null);
  const [wordInput, setWordInput] = useState("");
  const [words, setWords] = useState([]);
  const [timer, setTimer] = useState(0);
  const inputRef = useRef(null);

  const totalScore = words.reduce((acc, w) => acc + (w.valid ? w.score : 0), 0);

  const flashPattern = (indexes) => {
    let i = 0;
    setGamePhase("flashing");
    const interval = setInterval(() => {
      if (i < indexes.length) {
        setFlashingTile(indexes[i]);
        setTimeout(() => setFlashingTile(null), 400);
        i++;
      } else {
        clearInterval(interval);
        setGamePhase("selectTiles");
      }
    }, 700);
  };

  const startGame = () => {
    const newLetters = getRandomLetters();
    const newPattern = getRandomPattern(newLetters);
    setLetters(newLetters);
    setPattern(newPattern);
    setRevealed(Array(TOTAL_TILES).fill(false));
    setSelected([]);
    setWords([]);
    setWordInput("");
    setGamePhase("flashing");
    flashPattern(newPattern);
  };

  const handleTileClick = (i) => {
    if (gamePhase !== "selectTiles" || revealed[i] || selected.length >= 5) return;
    const updated = [...revealed];
    updated[i] = true;
    setRevealed(updated);
    setSelected([...selected, i]);
    if (selected.length + 1 === 5) {
      setGamePhase("wordEntry");
      setTimer(30);
    }
  };

  useEffect(() => {
    if (gamePhase === "wordEntry" && timer > 0) {
      const countdown = setInterval(() => {
        setTimer((t) => {
          if (t <= 1) {
            clearInterval(countdown);
            return 0;
          }
          return t - 1;
        });
      }, 1000);
      return () => clearInterval(countdown);
    }
  }, [gamePhase, timer]);

  const handleWordSubmit = async () => {
    const word = wordInput.trim().toUpperCase();
    if (!word || words.find((w) => w.word === word)) return;
    const valid = await isWordValid(word);
    const score = valid ? word.length * 5 : 0;
    setWords([...words, { word, valid, score }]);
    setWordInput("");
  };

  return (
    <div style={{ padding: 20, fontFamily: "sans-serif" }}>
      <h1>Fresh Focus</h1>
      {gamePhase === "waiting" && <Button onClick={startGame}>Start Game</Button>}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 60px)", gap: 8, marginTop: 20 }}>
        {letters.map((letter, i) => {
          const isFlashing = flashingTile === i;
          const isRevealed = revealed[i];
          const bg = isFlashing ? "#fff" : isRevealed ? "#c3f3c3" : "#999";
          const color = isRevealed ? "#000" : "#fff";
          return (
            <div
              key={i}
              onClick={() => handleTileClick(i)}
              style={{
                backgroundColor: bg,
                color,
                width: 60,
                height: 60,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                borderRadius: 6,
                fontWeight: "bold",
                cursor: gamePhase === "selectTiles" && !isRevealed ? "pointer" : "default"
              }}
            >
              {(isRevealed || isFlashing) ? letter : ""}
            </div>
          );
        })}
      </div>

      {gamePhase === "wordEntry" && (
        <div style={{ marginTop: 20 }}>
          <div>⏱ Time Left: {timer}s</div>
          <Input
            value={wordInput}
            onChange={(e) => setWordInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleWordSubmit()}
            placeholder="Enter word"
            inputRef={inputRef}
          />
          <Button onClick={handleWordSubmit}>Submit</Button>
          <div style={{ marginTop: 10 }}>
            <strong>Total Score: {totalScore}</strong>
            <ul>
              {words.map((w, i) => (
                <li key={i}>{w.word} {w.valid ? "✅" : "❌"} {w.valid && `+${w.score}`}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
