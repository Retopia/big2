import React, { useState, useMemo } from 'react';
import { validPlay } from './utils';
import Card from './Card';
import styles from './HumanHand.module.css';

function HumanHand({ gameState, onPlay }) {
  const [selectedCards, setSelectedCards] = useState([]);
  const playedHand = gameState.tableCards;
  const hand = gameState.players[0].hand;
  const isMyTurn = gameState.currentPlayer === 0;
  const hasPassed = gameState.passedPlayers?.has(0);

  // Calculate if we can pass
  const canPass = isMyTurn && !hasPassed && 
    // Can't pass when table is empty (starting new round)
    playedHand.length > 0 &&
    // Can't pass on first turn if you have 3 of clubs
    !(gameState.isGameStart && hand.some(card => 
      card.rank === '3' && card.suit === 'clubs'
    ));

  // Helper function to check equality between two cards
  const areCardsEqual = (cardA, cardB) =>
    cardA.rank === cardB.rank && cardA.suit === cardB.suit;

  // Toggle card selection
  const toggleCard = (card) => {
    if (!isMyTurn || hasPassed) return;

    const isSelected = selectedCards.some(selected =>
      areCardsEqual(selected, card)
    );

    if (isSelected) {
      setSelectedCards(selectedCards.filter(
        (selected) => !areCardsEqual(selected, card)
      ));
    } else if (selectedCards.length < 5) {
      setSelectedCards([...selectedCards, card]);
    }
  };

  // Check if selected cards form a valid play
  const isValidPlay = useMemo(() => {
    if (selectedCards.length === 0) return false;
    return validPlay(playedHand, selectedCards, gameState.isGameStart);
  }, [selectedCards, playedHand, gameState.isGameStart]);

  // Handle playing cards
  const playSelectedCards = () => {
    if (!isMyTurn || hasPassed) return;
    
    if (selectedCards.length > 0 && isValidPlay) {
      onPlay(selectedCards);
      setSelectedCards([]);
    }
  };

  // Handle passing
  const handlePass = () => {
    if (!isMyTurn || hasPassed) return;
    
    // Can't pass on first turn if you have 3 of clubs
    if (gameState.isGameStart && hand.some(card => 
      card.rank === '3' && card.suit === 'clubs')) {
      return;
    }

    onPlay([]);
    setSelectedCards([]);
  };

  return (
    <div className={styles.humanHand}>
      <h3>Your Hand ({hand.length} cards)</h3>
      
      <div className={styles.cardContainer}>
        {hand.map((card, index) => {
          const isSelected = selectedCards.some(selected =>
            areCardsEqual(selected, card)
          );
          return (
            <Card
              key={index}
              card={card}
              isSelected={isSelected}
              onClick={() => toggleCard(card)}
              readOnly={!isMyTurn || hasPassed}
            />
          );
        })}
      </div>

      <div className={styles.controls}>
        <button
          onClick={playSelectedCards}
          disabled={!isMyTurn || hasPassed || !isValidPlay}
          className={styles.button}
        >
          Play Selected Cards
        </button>
        <button
          onClick={handlePass}
          disabled={!canPass}
          className={styles.button}
        >
          {playedHand.length === 0 ? "Must play when starting new round" : "Pass"}
        </button>
      </div>

      {!isMyTurn && <div className={styles.overlay}>Waiting for other players...</div>}
      {hasPassed && <div className={styles.overlay}>You passed this round</div>}
    </div>
  );
}

export default HumanHand;