import React from 'react';
import './EndGameModal.css';

export default function EndGameModal({ isOpen, isWinner, winnerName, onExit, onStay }) {
  if (!isOpen) return null;

  return (
    <div className="endgame-overlay" role="dialog" aria-modal="true">
      <div className={`endgame-card ${isWinner ? 'winner' : 'loser'}`}>
        <div className="endgame-visual" aria-hidden>
          <div className="endgame-emoji">{isWinner ? '🏆' : '😔'}</div>
        </div>
        <div className="endgame-content">
          <h2 className="endgame-title">{isWinner ? '¡Felicidades! Ganaste' : 'La partida ha terminado'}</h2>
          <p className="endgame-sub">{isWinner ? `¡Has ganado la partida, ${winnerName}!` : `Ganador: ${winnerName}`}</p>

          <div className="endgame-actions">
            <button className="btn-primary" onClick={onExit}>Salir al Lobby</button>
            <button className="btn-secondary" onClick={onStay}>{isWinner ? 'Quedarme en tablero' : 'Aceptar'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
