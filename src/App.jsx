import React, { useEffect, useState, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const VOWELS = ["A", "E", "I", "O", "U"];
const RARE_LETTERS = ["Q", "X", "Z", "J", "K"];
const BANNED_WORDS = [
  // Explicit vulgarities
  "ASS", "ASSES", "ARSE", "DAMN", "DICK", "DICKS", "DICKING", "DICKHEAD",
  "SUPERCALIFRAGILISTICEXPIALIDOCIOUS", "FUCK", "FUCKS", "FUCKED", "FUCKER", "FUCKERS", "FUCKING",
  "TIT", "TITS", "SLAG", "SLAGS", "PUTA", "ARESHOLE", "BASTARDS", "WANKER", "WANKERS", "DIPSHIT", "DIPSHITS",
  "SHIT", "SHITS", "SHITTING", "SHITTED", "PISS", "PISSED", "PISSING",
  "BITCH", "BITCHES", "BITCHY", "CUNT", "CUNTS", "CUNTING", "TWAT", "TWATS", "HELL",

  // Sexual references
  "SEX", "SEXY", "HORNY", "PENIS", "PENISES", "VAGINA", "VAGINAS", "CLIT", "CLITS",
  "DILDO", "DILDOS", "BJ", "BJS", "BOOB", "BOOBS", "CUM", "CUMS", "CUMMING", "CUMMED",
  "JIZZ", "RIMJOB", "HANDJOB", "BLOWJOB", "FELLATIO", "CUNNILINGUS", "GENITAL", "GENITALS",
  "ORGASM", "ORGASMS", "XXX", "ANAL", "BDSM", "FAP", "NIPPLE", "NIPPLES",

  // Racial/ethnic/religious slurs
  "NIGGER", "NEGRO", "CHINK", "SPIC", "KIKE", "JUNGLEBUNNY", "TARBABY", "WETBACK",
  "FAGGOT", "FAGGOTS", "FAG", "FAGS", "DYKE", "DYKES", "GOOK", "TRANNY", "TRANNIES",
  "HEEB", "GYPPY", "GYPO", "MUZZIE", "MUZZY", "ZIONIST", "ISLAMOPHOBE", "NAZI",

  // Gendered slurs / other
  "HONKEY", "BINT", "BOLLOCKS", "SLUT", "SLUTS", "SKANK", "SKANKS", "WHORE", "WHORES",
  "HO", "HOS", "TRAMP", "TRAMPS", "HAG", "HAGS"
];

const GRID_SIZE = 5;
const TOTAL_TILES = GRID_SIZE * GRID_SIZE;

function App({ gameStarted }) {
  const [letters, setLetters] = useState([]);
  const [pattern, setPattern] = useState([]);
  const [revealed, setRevealed] = useState([]);
  const [selectedTiles, setSelectedTiles] = useState([]);
  const [flashingTile, setFlashingTile] = useState(null);
  const [gamePhase, setGamePhase] = useState("waiting");
  const [wordInput, setWordInput] = useState("");
  const [words, setWords] = useState([]);
  const [timer, setTimer] = useState(0);
  const [patternScore, setPatternScore] = useState(0);
  const [wordScore, setWordScore] = useState(0);
  const [topScore, setTopScore] = useState([]);
  const inputRef = useRef(null);
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    if (gameStarted) initializeGame();
  }, [gameStarted]);

  useEffect(() => {
    if (gamePhase === "enterWords" && timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            handleGameEnd();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [gamePhase, timer]);

  const getRandomLetters = () => {
    const baseLetters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
    const vowels = ["A", "E", "I", "O", "U"];
    const rareLetters = ["Q", "X", "Z", "J", "K"];
    const uncommonLetters = ["V", "B", "Y", "G", "P"];

    const result = Array(TOTAL_TILES).fill(null);

    const vowelPositions = [];
    while (vowelPositions.length < vowels.length) {
      const index = Math.floor(Math.random() * TOTAL_TILES);
      if (!vowelPositions.includes(index)) {
        vowelPositions.push(index);
      }
    }
    vowelPositions.forEach((pos, i) => {
      result[pos] = vowels[i];
    });

    const weightedPool = [];
    for (let letter of baseLetters) {
      if (vowels.includes(letter)) continue;
      let weight = 1.0;
      if (rareLetters.includes(letter)) weight *= 0.4;
      else if (uncommonLetters.includes(letter)) weight *= 0.6;
      const count = Math.floor(weight * 100);
      weightedPool.push(...Array(count).fill(letter));
    }

    for (let i = 0; i < TOTAL_TILES; i++) {
      if (result[i] === null) {
        const randomIndex = Math.floor(Math.random() * weightedPool.length);
        result[i] = weightedPool[randomIndex];
      }
    }

    return result;
  };

  const getRandomPattern = (letters) => {
    const pattern = new Set();
    const usedLetters = new Set();

    const pos1Letters = ["A", "E", "I", "O", "U"];
    const pos23Letters = ["C", "D", "F", "H", "L", "M", "N", "R", "S", "T", "W"];
    const pos4Letters = [...pos23Letters, "P", "G", "Y", "B", "V"];
    const pos5Letters = [...pos4Letters, "K", "J", "X", "Q", "Z"];

    const patternSlots = [
      pos1Letters,
      pos23Letters,
      pos23Letters,
      pos4Letters,
      pos5Letters
    ];

    const getValidIndex = (allowedLetters) => {
      const indices = letters
        .map((l, i) =>
          allowedLetters.includes(l) &&
          !usedLetters.has(l) &&
          ![...pattern].includes(i)
            ? i
            : null
        )
        .filter((i) => i !== null);
      if (indices.length === 0) return null;
      const index = indices[Math.floor(Math.random() * indices.length)];
      return index;
    };

    for (let i = 0; i < 5; i++) {
      const validIndex = getValidIndex(patternSlots[i]);
      if (validIndex !== null) {
        pattern.add(validIndex);
        usedLetters.add(letters[validIndex]);
      } else {
        console.warn(`⚠️ Could not find valid letter for pattern slot ${i + 1}`);
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
        setTimeout(() => {
          setGamePhase("selectTiles");
        }, 500);
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
    setFeedback("");
    setPatternScore(0);
    setWordScore(0);
    setTopScore([]);
    setGamePhase("showPattern");
    startPatternAnimation(newPattern);
  };

  const handleTileClick = (index) => {
    if (gamePhase !== "selectTiles" || revealed[index] || selectedTiles.length >= 5) return;

    const newRevealed = [...revealed];
    newRevealed[index] = true;

    const newSelected = [...selectedTiles, index];
    const position = newSelected.length - 1;

    let tileScore = 0;

    if (pattern.includes(index)) tileScore += 10;
    if (pattern[position] === index) tileScore += 10;

    setRevealed(newRevealed);
    setSelectedTiles(newSelected);
    setPatternScore((prev) => prev + tileScore);

    if (newSelected.length === 5) {
      const isPerfectMatch = newSelected.every(
        (selectedIndex, idx) => pattern[idx] === selectedIndex
      );
      if (isPerfectMatch) {
        setPatternScore((prev) => prev + 50);
      }

      setTimeout(() => {
        setGamePhase("enterWords");
        setTimer(30);
      }, 500);
    }
  };

  const isWordValid = async (word) => {
    try {
      const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word.toLowerCase()}`);
      return res.ok;
    } catch {
      return false;
    }
  };

  const handleWordSubmit = async () => {
  if (isSubmitting) return; // 🚫 Prevent rapid repeat submissions
  setIsSubmitting(true);    // 🔒 Lock the button

  const raw = wordInput.trim().toUpperCase();
  if (!raw || BANNED_WORDS.includes(raw) || words.some(w => w.word === raw)) {
    setFeedback("❌ Invalid or duplicate word.");
    setIsSubmitting(false); // 🔓 Unlock if rejected early
    return;
  }

  const selectedLetters = selectedTiles.map(i => letters[i]);
  const patternLetters = pattern.map(i => letters[i]);
  const wordLetters = raw.split("");

  let baseScore = 0;
  let patternUsedCount = 0;

  for (let l of wordLetters) {
    const isPattern = patternLetters.includes(l);
    const isSelected = selectedLetters.includes(l);

    if (isPattern) {
      baseScore += 10;
      patternUsedCount++;
    } else if (isSelected) {
      baseScore += 5;
    }

    if (["P", "G", "Y", "B", "V"].includes(l) && isSelected) {
      baseScore += 5;
    }
    if (["Z", "Q", "X", "J", "K"].includes(l) && isSelected) {
      baseScore += 10;
    }
  }

  let multiplier = patternUsedCount >= 2 ? patternUsedCount : 1;
  let totalScore = baseScore * multiplier;
  if (totalScore > 500) totalScore = 500; // 🧢 Cap per-word score at 500

  const valid = await isWordValid(raw);
  if (valid) {
    setWords(prev => [...prev, { word: raw, valid, score: totalScore }]);
    setWordScore(prev => prev + totalScore);
  }

  setFeedback(valid ? `✅ "${raw}" accepted!` : "❌ Not a real word.");
  setWordInput("");
  setIsSubmitting(false); // 🔓 Unlock after all is done
};

 const handleGameEnd = async () => {
  setGamePhase("gameOver"); // ✅ Add this at the start of the function

  const totalScore = patternScore + wordScore;
  const currentMonth = new Date().toISOString().slice(0, 7);

  const { error: insertError } = await supabase
    .from("scores")
    .insert([{ score: totalScore, month: currentMonth }]);

  const { data: topScoresData, error: fetchError } = await supabase
    .from("scores")
    .select("score")
    .eq("month", currentMonth)
    .order("score", { ascending: false })
    .limit(5);

  if (!fetchError && topScoresData) {
    setTopScore(topScoresData);
  }
};


  return (
    <div style={{ fontFamily: "sans-serif", padding: "1rem", textAlign: "center" }}>
      <h1 style={{ color: "#786daa" }}>Fresh <span style={{ color: "#84dade" }}>Focus</span></h1>

      <div style={{ display: "flex", justifyContent: "center", marginBottom: "1rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 60px)", gap: "0.5rem" }}>
          {letters.map((letter, idx) => {
            const isRevealed = revealed[idx];
            const isFlashing = flashingTile === idx;
            const isPattern = pattern.includes(idx);
            const backgroundColor = isFlashing ? "#fff" : isRevealed ? (isPattern ? "#84dade" : "#ddd") : "#786daa";
            const color = isRevealed || isFlashing ? "#000" : "#fff";
            return (
              <div
                key={idx}
                onClick={() => handleTileClick(idx)}
                style={{ backgroundColor, color, width: 60, height: 60, display: "flex", justifyContent: "center", alignItems: "center", fontSize: 20, borderRadius: 8, cursor: "pointer" }}
              >
                {isRevealed || isFlashing ? letter : ""}
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "center", marginTop: "1rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 60px)", gap: "0.5rem" }}>
          {[0, 1, 2, 3, 4].map((i) => {
            const tileIndex = selectedTiles[i];
            const letter = tileIndex !== undefined ? letters[tileIndex] : "";
            const isPattern = pattern.includes(tileIndex);
            const isSelected = tileIndex !== undefined;

            const backgroundColor = isSelected
              ? isPattern
                ? "#84dade"
                : "#ddd"
              : "#000";
            const color = isSelected ? "#000" : "#fff";

            return (
              <div
                key={i}
                style={{
                  backgroundColor,
                  color,
                  width: 60,
                  height: 60,
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  fontSize: 20,
                  borderRadius: 8
                }}
              >
                {letter}
              </div>
            );
          })}
        </div>
      </div>

      {gamePhase === "enterWords" && (
        <>
          <p>⏱ Time Left: {timer}s</p>
          <p><strong>Pattern Score:</strong> {patternScore} | <strong>Word Score:</strong> {wordScore} | <strong>Total:</strong> {patternScore + wordScore}</p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleWordSubmit();
            }}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", marginTop: "1rem" }}
          >
           <input
  ref={inputRef}
  value={wordInput}
  onChange={(e) => setWordInput(e.target.value)}
  onPaste={(e) => e.preventDefault()} // 🚫 Disables pasting
  placeholder="Enter a word"
  style={{ padding: "0.5rem", width: "200px", fontSize: "16px" }}
/>
<button
  type="submit"
  disabled={isSubmitting}
  style={{
    marginLeft: "1rem",
    padding: "0.5rem 1rem",
    opacity: isSubmitting ? 0.6 : 1,
    cursor: isSubmitting ? "not-allowed" : "pointer"
  }}
>
              Submit
            </button>
          </form>
          {feedback && <p style={{ fontWeight: "bold", marginTop: "0.5rem" }}>{feedback}</p>}
          <div style={{ marginTop: "1rem" }}>
          {words
  .filter(w => w.valid) // ✅ Only show valid words
  .map((w, i) => (
    <div key={i}>{w.word} ✅ (+{w.score})</div>
))}
          </div>
        </>
      )}

     {gamePhase === "gameOver" && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}>
          <div style={{ backgroundColor: "white", padding: "2rem", borderRadius: "1rem", maxWidth: "500px", textAlign: "left" }}>
            <h2 style={{ textAlign: "center", color: "#786daa", marginBottom: "1rem" }}>Well done!</h2>
<div style={{ marginBottom: "1rem" }}>
  <p><strong>Score Breakdown:</strong></p>
  <ul style={{ paddingLeft: "1.2rem" }}>
    <li>🧠 Pattern Score: {patternScore} points</li>
    <li>📝 Word Score: {wordScore} points</li>
    <li>✨ Words that used all 5 selected letters: {
      words.filter(w => {
        const wordLetters = new Set(w.word.split(""));
        return selectedTiles.every(i => wordLetters.has(letters[i]));
      }).length
    }</li>
    <li><strong>Total:</strong> {patternScore + wordScore} points</li>
  </ul>
</div>

            {topScore.length > 0 && (
              <>
                <p><strong>Top 5 Scores This Month:</strong></p>
                <ol style={{ textAlign: "left", paddingLeft: "1.5rem" }}>
                  {topScore.map((entry, i) => (
                    <li key={i}>Score: {entry.score}</li>
                  ))}
                </ol>
              </>
            )}
            <button onClick={() => window.location.reload()} style={{ marginTop: "1rem", width: "100%", padding: "0.75rem", backgroundColor: "#84dade", color: "white", border: "none", borderRadius: "0.5rem", fontWeight: "bold", fontSize: "1rem" }}>Start New Game</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;

