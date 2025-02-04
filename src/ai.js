// ai.js
import { RANK_ORDER } from './utils';

class AIStrategy {
  constructor(name) {
    this.name = name;
  }

  // Default implementation just takes first possible play
  selectPlay(possiblePlays, hand, tableCards) {
    return possiblePlays[0];
  }

  // Utility methods that can be used by all strategies
  getHighestRank(cards) {
    return Math.max(...cards.map(card => RANK_ORDER[card.rank]));
  }

  getLowestRank(cards) {
    return Math.min(...cards.map(card => RANK_ORDER[card.rank]));
  }
}

export class AggressiveAI extends AIStrategy {
  constructor() {
    super('Aggressive AI');
  }

  selectPlay(possiblePlays, hand, tableCards) {
    // Sort by highest value first
    return possiblePlays.sort((a, b) => {
      const maxA = this.getHighestRank(a);
      const maxB = this.getHighestRank(b);
      return maxB - maxA;
    })[0];
  }
}

export class ConservativeAI extends AIStrategy {
  constructor() {
    super('Conservative AI');
  }

  selectPlay(possiblePlays, hand, tableCards) {
    // Play lowest value cards when possible
    return possiblePlays.sort((a, b) => {
      const maxA = this.getHighestRank(a);
      const maxB = this.getHighestRank(b);
      return maxA - maxB;
    })[0];
  }
}

export class ComboAI extends AIStrategy {
  constructor() {
    super('Combo AI');
  }

  selectPlay(possiblePlays, hand, tableCards) {
    // Prefer larger combinations
    return possiblePlays.sort((a, b) => b.length - a.length)[0];
  }
}

// Factory function to create AI instances
export function createAI(type) {
  switch (type) {
    case 'aggressive':
      return new AggressiveAI();
    case 'conservative':
      return new ConservativeAI();
    case 'combo':
      return new ComboAI();
    default:
      return new AIStrategy('Basic AI');
  }
}

// AI strategies map for easy lookup
export const AI_TYPES = {
  AGGRESSIVE: 'aggressive',
  CONSERVATIVE: 'conservative',
  COMBO: 'combo',
  BASIC: 'basic'
};