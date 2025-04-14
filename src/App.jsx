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
  "ASS", "ARSE", "DAMN", "DICK", "FUCK", "SHIT", "PISS", "BITCH", "CUNT", "TWAT", "CRAP", "HELL",
  "SEX", "SEXY", "HORNY", "PENIS", "VAGINA", "CLIT", "DILDO", "BJ", "BOOB", "BOOBS", "CUM",
  "JIZZ", "RIMJOB", "HANDJOB", "BLOWJOB", "SCREW", "HUMP", "FELLATIO", "CUNNILINGUS", "GENITAL",
  "NUDE", "XXX", "ORGASM", "ANAL", "BDSM", "FAP", "MOAN", "NIPPLE",
  "NIGGER", "NEGRO", "CHINK", "SPIC", "KIKE", "K*KE", "JUNGLEBUNNY", "TARBABY", "WETBACK", 
  "FAGGOT", "FAG", "DYKE", "GOOK", "TRANNY", "HEEB", "GYPPY", "GYPO", "MUZZIE", "MUZZY", 
  "ZIONIST", "ISLAMOPHOBE", "NAZI", "HONKEY", "CRACKER", "BINT", "BOLLOCKS", "SLUT", 
  "SKANK", "WHORE", "HO", "TRAMP", "HAG", "BROAD"
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
const [topScore, setTopScore] = useState([]); // now it's a list
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
setTopScore([]); // reset top scores as an empty array
    setGamePhase("showPattern");
    startPatternAnimation(newPattern);
  };

  const handleTileClick = (index) => {
    if (gamePhase !== "selectTiles" || revealed[index] || selectedTiles.length >= 5) return;
    const newRevealed = [...revealed];
    newRevealed[index] = true;
    const newSelected = [...selectedTiles, index];
    let tileScore = 0;
    if (pattern.includes(index)) {
      tileScore += 10;
      const position = newSelected.length - 1;
      if (pattern[position] === index) tileScore += 10;
    }
    setRevealed(newRevealed);
    setSelectedTiles(newSelected);
    setPatternScore((prev) => prev + tileScore);
    if (newSelected.length === 5) {
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
    const raw = wordInput.trim().toUpperCase();
    if (!raw || BANNED_WORDS.includes(raw) || words.some(w => w.word === raw)) {
      setFeedback("❌ Invalid or duplicate word.");
      return;
    }
    const patternLetters = selectedTiles.filter(i => pattern.includes(i)).map(i => letters[i]);
    const nonPatternLetters = selectedTiles.filter(i => !pattern.includes(i)).map(i => letters[i]);
    const usedPattern = [...new Set(raw.split("").filter(l => patternLetters.includes(l)))];
    const usedNonPattern = [...new Set(raw.split("").filter(l => nonPatternLetters.includes(l)))];
    if (usedPattern.length === 0 && usedNonPattern.length === 0) {
      setFeedback("❌ Word doesn't use any revealed letters.");
      return;
    }
    const valid = await isWordValid(raw);
    let score = usedPattern.length * 10 + usedNonPattern.length * 5;
    if (usedPattern.length === 5) score *= 2;
    setWords(prev => [...prev, { word: raw, valid, score }]);
    if (valid) setWordScore(prev => prev + score);
    setFeedback(valid ? `✅ "${raw}" accepted!` : "❌ Not a real word.");
    setWordInput("");
  };

 const handleGameEnd = async () => {
  const totalScore = patternScore + wordScore;
  const currentMonth = new Date().toISOString().slice(0, 7); // "2025-04"
  console.log("Saving score:", totalScore, "for month:", currentMonth);

  // Insert score into Supabase
  const { data: insertData, error: insertError } = await supabase
    .from("scores")
    .insert([{ score: totalScore, month: currentMonth }])
    .select();

  if (insertError) {
    console.error("❌ Insert error:", insertError.message);
  } else {
    console.log("✅ Score inserted:", insertData);
  }

  // Fetch top 5 scores for this month
  const { data: topScoresData, error: fetchError } = await supabase
    .from("scores")
    .select("score")
    .eq("month", currentMonth)
    .order("score", { ascending: false })
    .limit(5);

  if (fetchError) {
    console.error("❌ Fetch error:", fetchError.message);
  } else {
    console.log("🏆 Top 5 scores:", topScoresData);
    setTopScore(topScoresData); // Store full top list, not just one score
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
                style={{ backgroundColor, color, width: 60, height: 60, display: "flex", justifyContent: "center", alignItems: "center", fontSize: 20, borderRadius: 8, cursor: "pointer" }}>
                {isRevealed || isFlashing ? letter : ""}
              </div>
            );
          })}
        </div>
      </div>

      {gamePhase === "enterWords" && (
        <>
          <p>⏱ Time Left: {timer}s</p>
          <p><strong>Pattern Score:</strong> {patternScore} | <strong>Word Score:</strong> {wordScore} | <strong>Total:</strong> {patternScore + wordScore}</p>
          <input ref={inputRef} value={wordInput} onChange={(e) => setWordInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleWordSubmit()} placeholder="Enter a word" style={{ padding: "0.5rem", width: "200px" }} />
          <button onClick={handleWordSubmit} style={{ marginLeft: "1rem", padding: "0.5rem 1rem" }}>Submit</button>
          {feedback && <p style={{ fontWeight: "bold", marginTop: "0.5rem" }}>{feedback}</p>}
          <div style={{ marginTop: "1rem" }}>{words.map((w, i) => (<div key={i}>{w.word} {w.valid ? "✅" : "❌"} {w.valid && `(+${w.score})`}</div>))}</div>
        </>
      )}

      {gamePhase === "enterWords" && timer === 0 && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}>
          <div style={{ backgroundColor: "white", padding: "2rem", borderRadius: "1rem", maxWidth: "500px", textAlign: "left" }}>
            <h2 style={{ textAlign: "center", color: "#786daa", marginBottom: "1rem" }}>Well done!</h2>
            <p><strong>Scoring system:</strong></p>
            <ul style={{ paddingLeft: "1.2rem" }}>
              <li>Each correct pattern tile: 10 pts + 10 bonus if in correct order.</li>
              <li>Words: 10 pts for each pattern letter, 5 pts for other revealed letters.</li>
              <li>Double points if your word uses all 5 pattern letters.</li>
            </ul>
            <p><strong>Your Score:</strong> {patternScore + wordScore}</p>
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
