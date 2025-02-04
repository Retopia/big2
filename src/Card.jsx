// Card.jsx
import React from 'react';
import styles from './Card.module.css';

const suitSymbols = {
  clubs: '♣',
  diamonds: '♦',
  hearts: '♥',
  spades: '♠'
};

const getSuitColorClass = (suit) => {
  return suit === 'hearts' || suit === 'diamonds' ? styles.red : styles.black;
};

const Card = ({ card, onClick, isSelected, readOnly = false, isFlipped = false }) => {
  const colorClass = getSuitColorClass(card.suit);
  
  return (
    <div
      className={`${styles.card} ${isSelected ? styles.selected : ''} 
                 ${readOnly ? styles.readOnly : ''} ${isFlipped ? styles.flipped : ''}`}
      onClick={readOnly ? undefined : onClick}
    >
      {/* Front of card */}
      <div className={styles.cardFront}>
        {/* Top left corner */}
        <div className={`${styles.corner} ${styles.topLeft} ${colorClass}`}>
          <div className={styles.rank}>{card.rank}</div>
          <div className={styles.suit}>{suitSymbols[card.suit]}</div>
        </div>

        {/* Center symbol */}
        <div className={`${styles.center} ${colorClass}`}>
          {suitSymbols[card.suit]}
        </div>

        {/* Bottom right corner */}
        <div className={`${styles.corner} ${styles.bottomRight} ${colorClass}`}>
          <div className={styles.rank}>{card.rank}</div>
          <div className={styles.suit}>{suitSymbols[card.suit]}</div>
        </div>
      </div>

      {/* Back of card */}
      <div className={styles.cardBack}>
        <div className={styles.pattern}></div>
      </div>
    </div>
  );
};

export default Card;