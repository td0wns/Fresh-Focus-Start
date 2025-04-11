import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

function AppWrapper() {
  const [gameStarted, setGameStarted] = React.useState(false);

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
