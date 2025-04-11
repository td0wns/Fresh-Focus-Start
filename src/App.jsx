import React, { useEffect, useState, useRef } from "react";

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const VOWELS = ["A", "E", "I", "O", "U"];
const RARE_LETTERS = ["Q", "X", "Z", "J", "K"];
const BANNED_WORDS = ["ASS", "ARSE", "DAMN", "DICK", "FUCK", "SHIT", "PISS", "BITCH", "CUNT", "TWAT"];

const GRID_SIZE = 5;
const TOTAL_TILES = GRID_SIZE * GRID_SIZE;

function App({ onGameStart }) {
  const [letters, setLetters] = useState([]);
  const [pattern, setPattern] = useState([]);
  const [revealed, setRevealed] = useState([]);
  const [selectedTiles, setSelectedTiles] = useState([]);
  const [flashingTile, setFlashingTile] = useState(null);
  const [gamePhase, setGamePhase] = useState("waiting");
  const [patternScore, setPatternScore] = useState(0);

  const [wordInput, setWordInput] = useState("");
  const [words, setWords] = useState([]);
  const [timer, setTimer] = useState(0);
  const inputRef = useRef(null);
  const [feedback, setFeedback] = useState("");

  

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

  React.useImperativeHandle(ref, () => ({ start: initializeGame }));

  const initializeGame = () => {
    const newLetters = getRandomLetters();
    const newPattern = getRandomPattern(newLetters);
    setLetters(newLetters);
    setPattern(newPattern);
    setRevealed(Array(TOTAL_TILES).fill(false));
    setSelectedTiles([]);
    setWords([]);
    setWordInput("");
    setFeedback("");
    setGamePhase("showPattern");
    startPatternAnimation(newPattern);
  };

  const handleTileClick = (index) => {
    if (gamePhase !== "selectTiles" || revealed[index] || selectedTiles.length >= 5) return;
    const newRevealed = [...revealed];
    newRevealed[index] = true;
    const newSelected = [...selectedTiles, index];
    setRevealed(newRevealed);
    setSelectedTiles(newSelected);
    if (newSelected.length === 5) {
      setPatternScore(50);
      setGamePhase("enterWords");
      setTimer(30);
    }
  };

  const isWordValid = async (word) => {
    try {
      const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word.toLowerCase()}`);
      return res.ok;
    } catch (err) {
      return false;
    }
  };

  const handleWordSubmit = async () => {
    const raw = wordInput.trim().toUpperCase();
    if (!raw || BANNED_WORDS.includes(raw)) {
      setFeedback("🚫 Banned or empty word.");
      return;
    }

    // must include at least one revealed tile
    const revealedLetters = selectedTiles.map(i => letters[i]);
    if (!raw.split("").some(letter => revealedLetters.includes(letter))) {
      setFeedback("❌ Word doesn't use any revealed letters.");
      return;
    }

    const valid = await isWordValid(raw);
    if (!valid) {
      setFeedback("❌ Not a real word.");
    } else {
      setFeedback(`✅ "${raw}" accepted! +${raw.length * 5} points`);
    }

    setWords([...words, { word: raw, valid, score: valid ? raw.length * 5 : 0 }]);
    setWordInput("");
  };

  return (
    <div style={{ fontFamily: "sans-serif", padding: "1rem", textAlign: "center" }}>
      <h1 style={{ color: "#786daa" }}>Fresh <span style={{ color: "#84dade" }}>Focus</span></h1>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 60px)", gap: "0.5rem", marginBottom: "1rem" }}>
        {letters.map((letter, idx) => {
          const isRevealed = revealed[idx];
          const isFlashing = flashingTile === idx;
          const backgroundColor = isFlashing ? "#fff" : isRevealed ? "#ddd" : "#786daa";
          const color = isRevealed || isFlashing ? "#000" : "#fff";
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
                justifyContent: "center",
                alignItems: "center",
                fontSize: 20,
                borderRadius: 8,
                cursor: "pointer"
              }}
            >
              {isRevealed || isFlashing ? letter : ""}
            </div>
          );
        })}
      </div>

      {gamePhase === "enterWords" && (
        <>
          <p>⏱ Time Left: {timer}s</p>
          <input
            ref={inputRef}
            value={wordInput}
            onChange={(e) => setWordInput(e.target.value)}
            placeholder="Enter a word"
            style={{ padding: "0.5rem", width: "200px" }}
          />
          <button onClick={handleWordSubmit} style={{ marginLeft: "1rem", padding: "0.5rem 1rem" }}>
            Submit
          </button>
          {feedback && <p style={{ marginTop: "0.5rem", fontWeight: "bold" }}>{feedback}</p>}
          <p style={{ fontWeight: "bold", marginTop: "1rem" }}>{`Total Score: ${patternScore + words.reduce((sum, w) => sum + (w.valid ? w.score : 0), 0)}`}</p><ul style={{ marginTop: "1rem" }}>
            {words.map((w, i) => (
              <li key={i}>
                {w.word} {w.valid ? "✅" : "❌"} {w.valid && `(+${w.score})`}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}


import ReactDOM from "react-dom";

const App = React.forwardRef((props, ref) => {
  const appRef = React.useRef();
  const [showInstructions, setShowInstructions] = React.useState(true);

  return (
    <>
      {showInstructions && (
        <div style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999
        }}>
          <div style={{
            backgroundColor: "white",
            padding: "2rem",
            borderRadius: "1rem",
            maxWidth: "400px",
            textAlign: "center",
            fontFamily: "sans-serif"
          }}>
            <h2 style={{ color: "#786daa" }}>How to Play</h2>
            <p style={{ fontSize: "0.9rem", marginBottom: "1rem" }}>Watch the pattern of 5 flashing tiles.<br/><br/>Repeat it by clicking the tiles in order.<br/><br/>Use the letters from the pattern to make real words.<br/><br/>Only valid, correctly spelled words count — no repeats or banned words!<br/><br/>Ready?</p>
            <button
              onClick={() => setShowInstructions(false)}
              style={{
                backgroundColor: "#84dade",
                color: "white",
                padding: "0.5rem 1.5rem",
                border: "none",
                borderRadius: "0.5rem",
                fontWeight: "bold"
              }}
            >
              Let’s go!
            </button>
          </div>
        </div>
      )}
      <App onGameStart={() => appRef.current?.start()} ref={appRef} />
    </>
  );
}
