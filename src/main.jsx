import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

function AppWrapper() {
  const [gameStarted, setGameStarted] = React.useState(false);
  const [showDetails, setShowDetails] = React.useState(false);

  return (
    <>
      {!gameStarted ? (
        <div style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(0,0,0,0.6)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999
        }}>
          <div style={{
            backgroundColor: "white",
            padding: "2rem",
            borderRadius: "1rem",
            maxWidth: "500px",
            textAlign: "left",
            fontFamily: "sans-serif"
          }}>
            <h2 style={{ textAlign: "center", color: "#786daa", marginBottom: "1rem" }}>How to Play</h2>
            <ul style={{ paddingLeft: "1.2rem", fontSize: "0.95rem" }}>
              <li>Watch the pattern of 5 flashing tiles.</li>
              <li>Repeat the pattern by clicking the tiles in order.</li>
              <li>Use the revealed letters to make real words.</li>
              <li>You score points based on pattern accuracy and valid words.</li>
              <li>No repeats, no made-up or banned words allowed.</li>
            </ul>

            <button
              onClick={() => setShowDetails(!showDetails)}
              style={{
                marginTop: "1rem",
                width: "100%",
                padding: "0.5rem",
                backgroundColor: "#ddd",
                border: "none",
                borderRadius: "0.5rem",
                fontSize: "0.95rem",
                fontWeight: "bold"
              }}
            >
              {showDetails ? "Hide Detailed Scoring" : "Detailed Scoring"}
            </button>

            {showDetails && (
  <div style={{ marginTop: "1rem", fontSize: "0.85rem", lineHeight: "1.5" }}>
    <strong>Pattern Score</strong><br />
    +10 points for each correct tile in the pattern (no matter the order)<br />
    +10 bonus for each tile placed in the exact correct position<br />
    +50 bonus if you get all 5 tiles in the correct order<br />
    <em>Maximum pattern score: 5 tiles × (10 + 10) + 50 = 150 points</em><br /><br />

    <strong>Word Score</strong><br />
    +10 points for each pattern tile letter used in your word<br />
    +5 points for each non-pattern revealed tile letter used<br />
    +5 bonus for each use of <strong>P, G, Y, B, V</strong><br />
    +10 bonus for each use of <strong>Z, Q, X, J, K</strong><br />
    Bonus letters stack every time they appear in a word<br /><br />

    <strong>Pattern Letter Multiplier</strong><br />
    If your word uses:<br />
    – 2 different pattern letters: ×2<br />
    – 3 different pattern letters: ×3<br />
    – 4 different pattern letters: ×4<br />
    – All 5 pattern letters: ×5<br /><br />
    <em>The more unique pattern letters you use, the more your word score multiplies!</em>
  </div>
)}

            <button
              onClick={() => setGameStarted(true)}
              style={{
                marginTop: "1rem",
                width: "100%",
                padding: "0.75rem",
                backgroundColor: "#786daa",
                color: "white",
                border: "none",
                borderRadius: "0.5rem",
                fontWeight: "bold",
                fontSize: "1rem"
              }}
            >
              Let’s go!
            </button>
          </div>
        </div>
      ) : (
        <App gameStarted={true} />
      )}
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<AppWrapper />);
