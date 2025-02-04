// utils.js
export const SUITS = ['spades', 'hearts', 'diamonds', 'clubs'];
export const RANKS = [
  '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', '2'
];

// Suit order: clubs < diamonds < hearts < spades
export const SUIT_ORDER = {
  clubs: 0,
  diamonds: 1,
  hearts: 2,
  spades: 3
};

// Rank order: 3 is smallest, 2 is biggest.
export const RANK_ORDER = {
  '3': 0,
  '4': 1,
  '5': 2,
  '6': 3,
  '7': 4,
  '8': 5,
  '9': 6,
  '10': 7,
  'J': 8,
  'Q': 9,
  'K': 10,
  'A': 11,
  '2': 12
};

// Create a deck of cards
export function createDeck() {
  const deck = [];
  for (let suit of SUITS) {
    for (let rank of RANKS) {
      deck.push({ suit, rank });
    }
  }
  return deck;
}

export function compareCards(a, b) {
  // First, compare by rank.
  if (RANK_ORDER[a.rank] !== RANK_ORDER[b.rank]) {
    return RANK_ORDER[a.rank] - RANK_ORDER[b.rank];
  }
  // If ranks are equal, compare by suit.
  return SUIT_ORDER[a.suit] - SUIT_ORDER[b.suit];
}

// Shuffle the deck (Fisher-Yates shuffle)
export function shuffle(deck) {
  const newDeck = [...deck];
  for (let i = newDeck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
  }
  return newDeck;
}

// Deal cards to players. Returns an array with 4 hands.
export function dealCards(deck) {
  const hands = [[], [], [], []];
  deck.forEach((card, index) => {
    hands[index % 4].push(card);
  });
  hands.forEach(hand => hand.sort(compareCards));
  return hands;
}

// Check if all cards are sequential
function isStraight(hand) {
  for (let i = 1; i < 5; i++) {
    if (RANK_ORDER[hand[i].rank] !== RANK_ORDER[hand[i - 1].rank] + 1) {
      return false;
    }
  }
  return true;
}

// Check if all cards are of the same suit
function isFlush(hand) {
  const firstSuit = hand[0].suit;
  return hand.every(card => card.suit === firstSuit);
}

// Count occurrences of each rank
function getRankCounts(hand) {
  const counts = {};
  hand.forEach(card => {
    counts[card.rank] = (counts[card.rank] || 0) + 1;
  });
  return counts;
}

// Check for four of a kind
function isFourOfAKind(rankCounts) {
  return Object.values(rankCounts).includes(4);
}

// Check for full house (three of a kind + pair)
function isFullHouse(rankCounts) {
  const counts = Object.values(rankCounts);
  return counts.includes(3) && counts.includes(2);
}

// Check for royal flush (A, K, Q, J, 10 of same suit)
function isRoyalFlush(hand) {
  const royalRanks = ['10', 'J', 'Q', 'K', 'A'];
  return isFlush(hand) &&
    hand.every((card, i) => card.rank === royalRanks[i]);
}

// Return codes
// -1 not a 5 card combo
// 0 - straight
// 1 - flush
// 2 - full house
// 3 - 4 of a kind + 1
// 4 - straight flush
// 5 - royal flush
export function classifyCombo(hand) {
  if (hand.length !== 5) {
    return -1;
  }

  // Sort cards by rank and suit
  hand.sort(compareCards);

  // Check for royal flush first (highest ranking hand)
  if (isRoyalFlush(hand)) {
    return 5;
  }

  const straight = isStraight(hand);
  const flush = isFlush(hand);

  // Check for straight flush
  if (straight && flush) {
    return 4;
  }

  const rankCounts = getRankCounts(hand);

  // Check for four of a kind
  if (isFourOfAKind(rankCounts)) {
    return 3;
  }

  // Check for full house
  if (isFullHouse(rankCounts)) {
    return 2;
  }

  // Check for flush
  if (flush) {
    return 1;
  }

  // Check for straight
  if (straight) {
    return 0;
  }

  // Not a valid combo
  return -1;
}

// Helper function to get all combinations of size n from array
function getCombinations(array, n) {
  if (n === 1) return array.map(item => [item]);

  const combinations = [];
  for (let i = 0; i <= array.length - n; i++) {
    const current = array[i];
    const remaining = array.slice(i + 1);
    const subCombinations = getCombinations(remaining, n - 1);

    for (const subComb of subCombinations) {
      combinations.push([current, ...subComb]);
    }
  }
  return combinations;
}

// Helper function to find all pairs in a hand
function findPairs(hand) {
  const pairs = [];
  const combinations = getCombinations(hand, 2);

  for (const combo of combinations) {
    if (combo[0].rank === combo[1].rank) {
      pairs.push(combo);
    }
  }
  return pairs;
}

// Helper function to find all triples in a hand
function findTriples(hand) {
  const triples = [];
  const combinations = getCombinations(hand, 3);

  for (const combo of combinations) {
    if (combo[0].rank === combo[1].rank &&
      combo[1].rank === combo[2].rank) {
      triples.push(combo);
    }
  }
  return triples;
}

// Helper function to find all valid 5-card combinations
function findFiveCardCombos(hand) {
  const validCombos = [];
  const combinations = getCombinations(hand, 5);

  for (const combo of combinations) {
    const comboType = classifyCombo(combo);
    if (comboType !== -1) {
      validCombos.push(combo);
    }
  }
  return validCombos;
}

export function calculatePossiblePlays(hand, playedHand = [], isGameStart = false) {
  // Sort the hand for easier processing
  const sortedHand = [...hand].sort(compareCards);
  let possiblePlays = [];

  // Generate all possible combinations
  // Singles
  possiblePlays.push(...sortedHand.map(card => [card]));

  // Pairs
  possiblePlays.push(...findPairs(sortedHand));

  // Triples
  possiblePlays.push(...findTriples(sortedHand));

  // 5-card combos
  possiblePlays.push(...findFiveCardCombos(sortedHand));

  // Filter based on game conditions
  if (playedHand.length > 0) {
    // Must be able to beat the played hand
    possiblePlays = possiblePlays.filter(play => compareCombo(play, playedHand) > 0);
  } else if (isGameStart) {
    // Must contain 3 of clubs
    possiblePlays = possiblePlays.filter(play =>
      play.some(card => card.rank === '3' && card.suit === 'clubs')
    );
  }

  return possiblePlays;
}

/**
 * Compares two card combinations
 * @param {Array} combo1 First combination of cards
 * @param {Array} combo2 Second combination of cards (the one to beat)
 * @returns {number} 1 if combo1 wins, -1 if combo2 wins, 0 if invalid comparison
 */
export function compareCombo(combo1, combo2) {
  // Must be same length except for special case of 5-card combo vs single
  if (combo1.length !== combo2.length) {
    if (combo2.length === 1 && combo1.length === 5) {
      const comboType = classifyCombo(combo1);
      // Only 4 of a kind + 1, straight flush, or royal flush can beat singles
      return comboType >= 3 ? 1 : -1;
    }
    return 0; // Invalid comparison
  }

  // Handle singles
  if (combo1.length === 1) {
    return compareCards(combo1[0], combo2[0]) > 0 ? 1 : -1;
  }

  // Handle doubles
  if (combo1.length === 2) {
    // Both must be valid pairs
    if (combo1[0].rank !== combo1[1].rank || combo2[0].rank !== combo2[1].rank) {
      return 0;
    }

    const sorted1 = [...combo1].sort(compareCards);
    const sorted2 = [...combo2].sort(compareCards);
    return compareCards(sorted1[1], sorted2[1]) > 0 ? 1 : -1;
  }

  // Handle triples
  if (combo1.length === 3) {
    // Both must be valid triples
    if (!(combo1[0].rank === combo1[1].rank && combo1[1].rank === combo1[2].rank) ||
      !(combo2[0].rank === combo2[1].rank && combo2[1].rank === combo2[2].rank)) {
      return 0;
    }

    const sorted1 = [...combo1].sort(compareCards);
    const sorted2 = [...combo2].sort(compareCards);
    return compareCards(sorted1[2], sorted2[2]) > 0 ? 1 : -1;
  }

  // Handle 5 card combos
  if (combo1.length === 5) {
    const combo1Type = classifyCombo(combo1);
    const combo2Type = classifyCombo(combo2);

    // Both must be valid combos
    if (combo1Type === -1 || combo2Type === -1) {
      return 0;
    }

    // If different types, higher type wins
    if (combo1Type !== combo2Type) {
      return combo1Type > combo2Type ? 1 : -1;
    }

    // Same type - compare based on combo type
    const sorted1 = [...combo1].sort(compareCards);
    const sorted2 = [...combo2].sort(compareCards);

    // For straight, straight flush, and royal flush, compare highest card
    if (combo1Type === 0 || combo1Type === 4 || combo1Type === 5) {
      return compareCards(sorted1[4], sorted2[4]) > 0 ? 1 : -1;
    }

    // For flush, compare suits first, then highest card if same suit
    if (combo1Type === 1) {
      const suit1 = sorted1[0].suit;
      const suit2 = sorted2[0].suit;

      if (SUIT_ORDER[suit1] !== SUIT_ORDER[suit2]) {
        return SUIT_ORDER[suit1] > SUIT_ORDER[suit2] ? 1 : -1;
      }
      return compareCards(sorted1[4], sorted2[4]) > 0 ? 1 : -1;
    }

    // For full house, compare three of a kind
    if (combo1Type === 2) {
      const counts1 = getRankCounts(sorted1);
      const counts2 = getRankCounts(sorted2);

      const threeRank1 = Object.entries(counts1)
        .find(([rank, count]) => count === 3)[0];
      const threeRank2 = Object.entries(counts2)
        .find(([rank, count]) => count === 3)[0];

      return RANK_ORDER[threeRank1] > RANK_ORDER[threeRank2] ? 1 : -1;
    }

    // For four of a kind, compare the four of a kind rank
    if (combo1Type === 3) {
      const counts1 = getRankCounts(sorted1);
      const counts2 = getRankCounts(sorted2);

      const fourRank1 = Object.entries(counts1)
        .find(([rank, count]) => count === 4)[0];
      const fourRank2 = Object.entries(counts2)
        .find(([rank, count]) => count === 4)[0];

      return RANK_ORDER[fourRank1] > RANK_ORDER[fourRank2] ? 1 : -1;
    }
  }

  return 0; // Invalid comparison
}

// The order of suits from least to greatest is clubs -> diamonds -> hearts -> spades (alphabetical order)
// 3 is the smallest, 2 is the biggest
// Order of 5 card combos straight -> flush -> full house -> 4 of a kind + 1 -> straight flush -> royal flush
// Special cases: 4 of a kind + 1, straight flush, and royal flush can also be played on singles
export function validPlay(playedHand, handToPlay, isGameStart = false) {
  // Empty table - either game start or everyone passed
  if (playedHand.length === 0) {
    if (isGameStart) {
      // First play of the game must contain 3 of clubs
      const hasThreeOfClubs = handToPlay.some(
        card => card.rank === '3' && card.suit === 'clubs'
      );

      if (!hasThreeOfClubs) {
        return false;
      }
    }

    // Validate single
    if (handToPlay.length === 1) {
      return true;
    }

    // Validate double
    if (handToPlay.length === 2) {
      return handToPlay[0].rank === handToPlay[1].rank;
    }

    // Validate triple
    if (handToPlay.length === 3) {
      return handToPlay[0].rank === handToPlay[1].rank &&
        handToPlay[1].rank === handToPlay[2].rank;
    }

    // Validate combo
    if (handToPlay.length === 5) {
      return classifyCombo(handToPlay) !== -1;
    }

    return false;
  }

  // Ensure the combo to play is larger
  const comparison = compareCombo(handToPlay, playedHand);
  return comparison > 0;
}