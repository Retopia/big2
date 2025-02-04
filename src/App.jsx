// Big2Game.jsx
import React, { useState, useEffect } from 'react';
import { createDeck, shuffle, dealCards, calculatePossiblePlays } from './utils';
import { createAI, AI_TYPES } from './ai';
import Card from './Card';
import HumanHand from './HumanHand';
import styles from "./App.module.css";

const INITIAL_STATE = () => {
  const deck = shuffle(createDeck());
  const [hand1, hand2, hand3, hand4] = dealCards(deck);

  // Create AI instances
  const ai1 = createAI(AI_TYPES.AGGRESSIVE);
  const ai2 = createAI(AI_TYPES.CONSERVATIVE);
  const ai3 = createAI(AI_TYPES.COMBO);

  const hands = [hand1, hand2, hand3, hand4];
  const startingPlayerIndex = hands.findIndex(hand =>
    hand.some(card => card.rank === '3' && card.suit === 'clubs')
  );

  return {
    players: [
      { id: 0, name: 'Player 1', hand: hand1, isHuman: true, rank: null },
      { id: 1, name: ai1.name, hand: hand2, isHuman: false, ai: ai1, rank: null },
      { id: 2, name: ai2.name, hand: hand3, isHuman: false, ai: ai2, rank: null },
      { id: 3, name: ai3.name, hand: hand4, isHuman: false, ai: ai3, rank: null },
    ],
    currentPlayer: startingPlayerIndex,
    tableCards: [],
    isGameStart: true,
    passedPlayers: new Set(),
    lastValidPlayerId: null,
    currentRank: 1,
  };
};

function App() {
  const [gameState, setGameState] = useState(INITIAL_STATE);
  const [debugMode, setDebugMode] = useState(false);
  const [isGameActive, setIsGameActive] = useState(true);

  // Function to update game state after a move
  // Add these debug logs in the playMove function
  const playMove = (playerId, playedCards) => {
    if (isGameActive) {
      setGameState(prevState => {
        console.log('--- Turn Debug Info ---');
        console.log('Current player:', playerId);
        console.log('Played cards:', playedCards);
        console.log(
          'Active players (prev state):',
          prevState.players.filter(p => p.hand.length > 0 && p.rank === null)
        );
        console.log('Passed players:', Array.from(prevState.passedPlayers));
        console.log('Last valid player:', prevState.lastValidPlayerId);

        const isPassing = playedCards.length === 0;
        // Start with a copy of the passed players from the previous state.
        const updatedPassedPlayers = new Set(prevState.passedPlayers);
        if (isPassing) {
          updatedPassedPlayers.add(playerId);
        }

        // Update the player's hand if they're playing cards.
        const updatedPlayers = prevState.players.map(player => {
          if (player.id === playerId && !isPassing) {
            const newHand = player.hand.filter(card =>
              !playedCards.some(
                played => played.suit === card.suit && played.rank === card.rank
              )
            );
            // If the player just finished their hand, assign them the current rank.
            if (newHand.length === 0 && player.hand.length > 0) {
              return { ...player, hand: newHand, rank: prevState.currentRank };
            }
            return { ...player, hand: newHand };
          }
          return player;
        });

        // Recalculate active players based on the updated state.
        const activePlayersUpdated = updatedPlayers.filter(
          p => p.hand.length > 0 && p.rank === null
        );

        // Remove players who have finished from the passed set.
        const filteredPassedPlayers = new Set();
        updatedPassedPlayers.forEach(id => {
          const player = updatedPlayers.find(p => p.id === id);
          if (player && player.hand.length > 0 && player.rank === null) {
            filteredPassedPlayers.add(id);
          }
        });

        // Decide if the table should be cleared.
        let shouldClearTable = false;
        if (prevState.lastValidPlayerId !== null) {
          const passCount = filteredPassedPlayers.size;
          shouldClearTable = passCount >= activePlayersUpdated.length - 1;
          console.log('Pass count:', passCount);
          console.log('Active players count:', activePlayersUpdated.length);
          console.log('Should clear table:', shouldClearTable);
        }

        // Determine the next player.
        let nextPlayer = (prevState.currentPlayer + 1) % prevState.players.length;
        const startingPlayer = nextPlayer;
        if (shouldClearTable && prevState.lastValidPlayerId !== null) {
          // First check if lastValidPlayerId is still a valid player
          if (updatedPlayers[prevState.lastValidPlayerId].hand.length > 0 &&
            updatedPlayers[prevState.lastValidPlayerId].rank === null) {
            nextPlayer = prevState.lastValidPlayerId;
          } else {
            // If last valid player is no longer valid, find the next valid player
            nextPlayer = prevState.lastValidPlayerId;
            const startingPlayer = nextPlayer;

            do {
              nextPlayer = (nextPlayer + 1) % prevState.players.length;

              // Check if current player is valid
              if (updatedPlayers[nextPlayer].hand.length > 0 &&
                updatedPlayers[nextPlayer].rank === null) {
                break; // Found a valid player
              }

            } while (nextPlayer !== startingPlayer);

            // If no valid player found in the loop, find the first valid player from the beginning
            if (nextPlayer === startingPlayer) {
              for (let i = 0; i < prevState.players.length; i++) {
                if (updatedPlayers[i].hand.length > 0 &&
                  updatedPlayers[i].rank === null) {
                  nextPlayer = i;
                  break;
                }
              }
            }
          }

          console.log('Table cleared, next player after looping:', nextPlayer);

          // Verify the selected next player is actually valid
          if (updatedPlayers[nextPlayer].hand.length === 0 ||
            updatedPlayers[nextPlayer].rank !== null) {
            console.warn('Warning: Selected next player is invalid, game might be finished');
          }
        }
        else {
          let madeFullLoop = false;
          // Skip players who have passed, have no cards, or already finished.
          while (
            filteredPassedPlayers.has(nextPlayer) ||
            updatedPlayers[nextPlayer].hand.length === 0 ||
            updatedPlayers[nextPlayer].rank !== null
          ) {
            nextPlayer = (nextPlayer + 1) % prevState.players.length;
            if (nextPlayer === startingPlayer) {
              madeFullLoop = true;
              break;
            }
          }
          console.log('Next player after skipping:', nextPlayer);
          console.log('Made full loop:', madeFullLoop);
          if (madeFullLoop) {
            shouldClearTable = true;
            filteredPassedPlayers.clear();
            nextPlayer = prevState.lastValidPlayerId || 0;
            console.log('Forced table clear, next player:', nextPlayer);
          }
        }

        // Update the finishing rank if a player just won.
        const newRank = updatedPlayers.some(
          p => p.hand.length === 0 && p.rank === prevState.currentRank
        )
          ? prevState.currentRank + 1
          : prevState.currentRank;

        // If 3 players are finished, auto-assign the remaining player 4th place.
        const finishedPlayers = updatedPlayers.filter(p => p.rank !== null).length;
        if (finishedPlayers === 3) {
          const lastPlayer = updatedPlayers.find(p => p.rank === null);
          if (lastPlayer) {
            lastPlayer.rank = 4;
          }
        }

        // Calculate the new last valid player.
        let newLastValidPlayerId;
        if (isPassing) {
          newLastValidPlayerId = prevState.lastValidPlayerId;
        } else {
          const playerJustWon = updatedPlayers[playerId].hand.length === 0;
          if (!playerJustWon) {
            newLastValidPlayerId = playerId;
          } else {
            // Find the next active player from the updated players.
            let nextId = (playerId + 1) % prevState.players.length;
            const startId = nextId;
            do {
              if (activePlayersUpdated.some(p => p.id === nextId)) {
                newLastValidPlayerId = nextId;
                break;
              }
              nextId = (nextId + 1) % prevState.players.length;
            } while (nextId !== startId);
            if (newLastValidPlayerId === undefined) {
              newLastValidPlayerId = activePlayersUpdated[0]?.id ?? null;
            }
          }
        }

        const newState = {
          ...prevState,
          players: updatedPlayers,
          currentPlayer: nextPlayer,
          tableCards: shouldClearTable
            ? []
            : isPassing
              ? prevState.tableCards
              : playedCards,
          isGameStart: false,
          passedPlayers: shouldClearTable ? new Set() : filteredPassedPlayers,
          lastValidPlayerId: isPassing ? newLastValidPlayerId : playerId,
          currentRank: newRank,
        };

        console.log('New game state:', {
          currentPlayer: newState.currentPlayer,
          tableCards: newState.tableCards,
          passedPlayers: Array.from(newState.passedPlayers),
          lastValidPlayerId: newState.lastValidPlayerId,
        });

        return newState;
      });
    }
  };

  // AI Move with slight delay
  useEffect(() => {
    const currentPlayer = gameState.players[gameState.currentPlayer];

    let rankCount = 0;
    gameState.players.forEach(player => {
      if (player.rank !== null) {
        rankCount++;
      }
    });

    if (rankCount === 4) {
      setIsGameActive(false)
    }

    if (!currentPlayer.isHuman && isGameActive) {
      console.log('AI Turn Debug:', {
        playerId: currentPlayer.id,
        handSize: currentPlayer.hand.length,
        hasPassed: gameState.passedPlayers.has(currentPlayer.id),
        tableCards: gameState.tableCards
      });

      const timer = setTimeout(() => {
        // Only attempt move if player has cards and hasn't passed
        if (currentPlayer.hand.length > 0 &&
          !gameState.passedPlayers.has(currentPlayer.id) &&
          currentPlayer.rank === null) {

          // Check for empty table first
          if (gameState.tableCards.length === 0) {
            const anyValidPlay = calculatePossiblePlays(
              currentPlayer.hand,
              [], // Empty table
              gameState.isGameStart // Keep isGameStart check for 3 of clubs rule
            );
            if (anyValidPlay.length > 0) {
              const selectedPlay = currentPlayer.ai.selectPlay(
                anyValidPlay,
                currentPlayer.hand,
                []
              );
              playMove(currentPlayer.id, selectedPlay);
              return;
            }
          }

          // If table not empty, try to play over existing cards
          const possiblePlays = calculatePossiblePlays(
            currentPlayer.hand,
            gameState.tableCards,
            gameState.isGameStart
          );

          console.log('AI possible plays:', possiblePlays.length);

          // Alternate AI logic goes here
          if (possiblePlays.length > 0) {
            const selectedPlay = currentPlayer.ai.selectPlay(
              possiblePlays,
              currentPlayer.hand,
              gameState.tableCards
            );

            playMove(currentPlayer.id, selectedPlay);
          } else {
            playMove(currentPlayer.id, []);  // Pass if no valid plays
          }
        } else {
          playMove(currentPlayer.id, []);  // Skip if already passed or no cards
        }
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [gameState.currentPlayer, gameState.players]);

  // Human player move handler
  const handleHumanMove = (cards) => {
    const currentPlayer = gameState.players[gameState.currentPlayer];
    if (currentPlayer.isHuman) {
      if (currentPlayer.hand.length > 0) {
        console.log(`${currentPlayer.name} plays: `, cards);
        playMove(currentPlayer.id, cards);
      }
    }
  };

  return (
    <div>
      <h1>Big 2 Game</h1>
      <div>
        <h2>Current Turn: {gameState.players[gameState.currentPlayer].name}</h2>
      </div>

      {/* Display human player's hand */}
      {isGameActive && <HumanHand gameState={gameState} onPlay={handleHumanMove} />}

      {/* Display table cards */}
      <div>
        <h3>Cards on Table:</h3>
        <div className={styles.container}>
          {gameState.tableCards.map((card) => (
            <Card key={`${card.suit}_${card.rank}`} card={card} readOnly />
          ))}
        </div>
      </div>

      {/* Display players and their status */}
      <div>
        <h3>
          Players
          <button
            onClick={() => setDebugMode(!debugMode)}
            style={{ marginLeft: '10px', fontSize: '12px' }}
          >
            {debugMode ? 'Hide Cards' : 'Show Cards'}
          </button>
        </h3>
        {gameState.players.map(player => (
          <div key={player.id}>
            <div>
              {player.name}
              {player.rank ? (
                ` - ${player.rank}${player.rank === 1 ? 'st' :
                  player.rank === 2 ? 'nd' :
                    player.rank === 3 ? 'rd' : 'th'
                } Place`
              ) : (
                ` - Cards Left: ${player.hand.length}${gameState.passedPlayers.has(player.id) ? " (Passed)" : ""
                }`
              )}
            </div>
            {/* Show AI cards in debug mode */}
            {debugMode && !player.isHuman && player.hand.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', marginTop: '8px', marginBottom: '16px' }}>
                {player.hand.map((card, index) => (
                  <Card
                    key={`${player.id}-${card.suit}-${card.rank}`}
                    card={card}
                    readOnly
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
