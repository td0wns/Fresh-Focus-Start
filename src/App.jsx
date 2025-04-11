
import React, { useEffect, useState, useRef } from "react";
import Input from "./components/ui/input";
import Button from "./components/ui/button";
import { createClient } from '@supabase/supabase-js';

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const VOWELS = ["A", "E", "I", "O", "U"];
const RARE_LETTERS = ["Q", "X", "Z", "J", "K"];
const GRID_SIZE = 5;
const TOTAL_TILES = GRID_SIZE * GRID_SIZE;

const BANNED_WORDS = [
  "ASS", "ARSE", "DAMN", "DICK", "FUCK", "SHIT", "PISS", "BITCH", "CUNT", "TWAT",
  "COCK", "WANK", "PRICK", "SLUT", "TIT", "CRAP", "BUGGER", "BOLLOCKS", "BINT",
  "NIGGER", "NEGRO", "K*KE", "KIKE", "CH*NK", "CHINK", "SP*C", "SPIC", "TRANNY", "RETARD",
  "FAGGOT", "FAG", "DYKE", "GOOK", "NAZI", "HONKEY", "CRACKER", "JUNGLEBUNNY", "TAR BABY",
  "WETBACK", "HEEB", "GYPPY", "GYPO", "MUZZIE", "MUZZY", "ZIONIST", "ISLAMOPHOBE",
  "WHORE", "HO", "SKANK", "TRAMP", "HAG", "BROAD",
  "SEX", "SEXY", "HORNY", "ORGY", "ANAL", "BDSM", "PENIS", "VAGINA", "CLIT", "DILDO", "BJ", "BOOB", "BOOBS", "CUM", "JIZZ", "RIMJOB", "HANDJOB", "BANG", "BLOWJOB", "SCREW", "HUMP", "FELLATIO", "CUNNILINGUS", "GENITAL", "NUDE", "XXX",
];

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

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export default function App() {
  const [letters, setLetters] = useState([]);
  const [pattern, setPattern] = useState([]);
  const [selectedTiles, setSelectedTiles] = useState([]);
  const [revealed, setRevealed] = useState(Array(TOTAL_TILES).fill(false));
  const [wordInput, setWordInput] = useState("");
  const [words, setWords] = useState([]);
  const inputRef = useRef(null);

  const handleTileClick = (index) => {
    if (revealed[index]) return;
    const updatedRevealed = [...revealed];
    updatedRevealed[index] = true;
    setRevealed(updatedRevealed);
    setSelectedTiles([...selectedTiles, index]);
  };

  const handleWordSubmit = async () => {
    const word = wordInput.trim().toUpperCase();
    if (!word || BANNED_WORDS.includes(word)) return;
    const valid = await isWordValid(word);
    setWords([...words, { word, valid }]);
    setWordInput("");
  };

  const startGame = () => {
    const newLetters = getRandomLetters();
    const newPattern = getRandomPattern(newLetters);
    setLetters(newLetters);
    setPattern(newPattern);
    setSelectedTiles([]);
    setRevealed(Array(TOTAL_TILES).fill(false));
    setWords([]);
    setWordInput("");
  };

  useEffect(() => {
    startGame();
  }, []);

  return (
    <div style={{ padding: 20, fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: 32, marginBottom: 10 }}>Fresh Focus</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 60px)', gap: 8, marginBottom: 20 }}>
        {letters.map((letter, i) => (
          <div
            key={i}
            onClick={() => handleTileClick(i)}
            style={{
              backgroundColor: revealed[i] ? (pattern.includes(i) ? '#c3f3c3' : '#eee') : '#999',
              color: revealed[i] ? '#000' : '#fff',
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
            {revealed[i] ? letter : ''}
          </div>
        ))}
      </div>

      <div style={{ marginBottom: 10 }}>
        <Input
          value={wordInput}
          onChange={(e) => setWordInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleWordSubmit()}
          placeholder="Enter a word"
          inputRef={inputRef}
        />
      </div>
      <Button onClick={handleWordSubmit}>Submit Word</Button>

      <div style={{ marginTop: 20 }}>
        <h2>Words:</h2>
        <ul>
          {words.map((w, idx) => (
            <li key={idx}>{w.word} {w.valid ? '✅' : '❌'}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
