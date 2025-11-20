import { GAME_CONFIG, RANK_VALUES } from "gameConstants.js";
import { Card } from "Card.js";

/**
 * PokerBattle - Betting-based battle system with poker-style hand evaluation
 * Features ante, raise, call, fold, all-in mechanics with 3-hand showdown
 */
export class PokerBattle {
  constructor(deckManager) {
    this.deckManager = deckManager;
    this.gameState = {
      phase: "setup", // setup, betting, playing, finished
      currentHand: 0,
      totalHands: 3,
      pot: 0,
      playerBet: 0,
      enemyBet: 0,
      playerAllIn: false,
      enemyAllIn: false,
      playerFolded: false,
      enemyFolded: false,
      playerDeck: null,
      enemyDeck: null,
      playerFaction: null,
      enemyFaction: null,
      handsWon: { player: 0, enemy: 0 },
      battleHistory: [],
    };
    this.minAnte = 1000;
    this.maxRaise = 50000;
  }

  // Initialize battle with selected faction
  initializeBattleWithPlayerDeck(playerFaction, deckManager) {
    this.gameState.playerFaction = playerFaction;
    this.gameState.playerDeck = this.getPlayerActualDeck(
      playerFaction,
      deckManager
    );

    if (this.gameState.playerDeck.length === 0) {
      throw new Error(
        `No cards in ${GAME_CONFIG.FACTIONS[playerFaction].name} deck. Go to Manage to build your deck first!`
      );
    }

    this.gameState.phase = "setup";
    return {
      deckSize: this.gameState.playerDeck.length,
      isComplete: this.gameState.playerDeck.length > 0,
      faction: GAME_CONFIG.FACTIONS[playerFaction],
    };
  }

  // Get player's actual built deck (not a full 52-card deck)
  getPlayerActualDeck(faction, deckManager) {
    const deckStructure = deckManager.getDeckStructure(faction);
    const cards = [];

    Object.keys(deckStructure).forEach((rank) => {
      Object.keys(deckStructure[rank]).forEach((council) => {
        const card = deckStructure[rank][council];
        if (card) {
          cards.push(card);
        }
      });
    });

    return cards;
  }

  // Generate enemy deck
  generateEnemyDeck() {
    const factions = Object.keys(GAME_CONFIG.FACTIONS);
    this.gameState.enemyFaction =
      factions[Math.floor(Math.random() * factions.length)];

    // Generate a complete enemy deck
    this.gameState.enemyDeck = this.generateRandomDeck(
      this.gameState.enemyFaction
    );

    return {
      faction: GAME_CONFIG.FACTIONS[this.gameState.enemyFaction],
      deckSize: this.gameState.enemyDeck.length,
    };
  }

  // Generate random complete deck for enemy
  generateRandomDeck(faction) {
    const cards = [];
    const councils = Object.keys(GAME_CONFIG.COUNCILS);
    const ranks = Object.keys(GAME_CONFIG.RANKS);

    // Generate one card for each rank-council combination
    ranks.forEach((rank) => {
      councils.forEach((council) => {
        const card = Card.createPersistent(faction, rank, council);
        // Give enemy cards some random battle experience
        const battles = Math.floor(Math.random() * 20);
        const wins = Math.floor(battles * (0.3 + Math.random() * 0.4));
        card.battlesParticipated = battles;
        card.battlesWon = wins;
        cards.push(card);
      });
    });

    return cards;
  }

  // Start betting phase
  startBetting(playerAnte) {
    if (playerAnte < this.minAnte) {
      throw new Error(`Minimum ante is ${this.minAnte} chips`);
    }

    const playerProfile = this.deckManager.getPlayerProfile();
    if (playerAnte > playerProfile.bankroll) {
      throw new Error("Insufficient chips for ante");
    }

    this.gameState.phase = "betting";
    this.gameState.playerBet = playerAnte;
    this.gameState.enemyBet = playerAnte; // Enemy matches ante
    this.gameState.pot = playerAnte * 2;

    // Deduct ante from player bankroll
    this.deckManager.playerProfile.bankroll -= playerAnte;
    this.deckManager.saveToStorage();

    return {
      pot: this.gameState.pot,
      playerBet: this.gameState.playerBet,
      enemyBet: this.gameState.enemyBet,
      playerBankroll: this.deckManager.playerProfile.bankroll,
    };
  }

  // Player raises bet
  playerRaise(raiseAmount) {
    if (this.gameState.phase !== "betting") {
      throw new Error("Not in betting phase");
    }

    if (raiseAmount > this.maxRaise) {
      throw new Error(`Maximum raise is ${this.maxRaise} chips`);
    }

    const playerProfile = this.deckManager.getPlayerProfile();
    if (raiseAmount > playerProfile.bankroll) {
      throw new Error("Insufficient chips to raise");
    }

    this.gameState.playerBet += raiseAmount;
    this.gameState.pot += raiseAmount;

    // Deduct raise from player bankroll
    this.deckManager.playerProfile.bankroll -= raiseAmount;
    this.deckManager.saveToStorage();

    // Enemy decision (simplified AI)
    const enemyAction = this.getEnemyBettingAction(raiseAmount);

    return {
      ...enemyAction,
      pot: this.gameState.pot,
      playerBet: this.gameState.playerBet,
      enemyBet: this.gameState.enemyBet,
      playerBankroll: this.deckManager.playerProfile.bankroll,
    };
  }

  // Player calls current bet
  playerCall() {
    if (this.gameState.phase !== "betting") {
      throw new Error("Not in betting phase");
    }

    const callAmount = this.gameState.enemyBet - this.gameState.playerBet;
    if (callAmount <= 0) {
      throw new Error("No bet to call");
    }

    const playerProfile = this.deckManager.getPlayerProfile();
    if (callAmount > playerProfile.bankroll) {
      throw new Error("Insufficient chips to call");
    }

    this.gameState.playerBet = this.gameState.enemyBet;
    this.gameState.pot += callAmount;

    // Deduct call amount from player bankroll
    this.deckManager.playerProfile.bankroll -= callAmount;
    this.deckManager.saveToStorage();

    // Move to playing phase
    this.gameState.phase = "playing";

    return {
      action: "call",
      amount: callAmount,
      pot: this.gameState.pot,
      playerBankroll: this.deckManager.playerProfile.bankroll,
      phase: "playing",
    };
  }

  // Player goes all-in
  playerAllIn() {
    if (this.gameState.phase !== "betting") {
      throw new Error("Not in betting phase");
    }

    const playerProfile = this.deckManager.getPlayerProfile();
    const allInAmount = playerProfile.bankroll;

    this.gameState.playerBet += allInAmount;
    this.gameState.pot += allInAmount;
    this.gameState.playerAllIn = true;

    // Deduct all chips from player
    this.deckManager.playerProfile.bankroll = 0;
    this.deckManager.saveToStorage();

    // Enemy decision on all-in
    const enemyAction = this.getEnemyAllInResponse();

    return {
      ...enemyAction,
      pot: this.gameState.pot,
      playerBet: this.gameState.playerBet,
      enemyBet: this.gameState.enemyBet,
      playerBankroll: 0,
    };
  }

  // Player folds
  playerFold() {
    if (this.gameState.phase !== "betting") {
      throw new Error("Not in betting phase");
    }

    this.gameState.playerFolded = true;
    this.gameState.phase = "finished";

    // Enemy wins the pot (but we don't track enemy chips)
    return {
      action: "fold",
      result: "Enemy wins by fold",
      potLost: this.gameState.pot,
    };
  }

  // Enemy betting AI
  getEnemyBettingAction(playerRaise) {
    const deckQuality = this.calculateDeckQuality(this.gameState.enemyDeck);
    const aggressiveness = Math.random();

    if (playerRaise > 10000 && deckQuality < 0.6) {
      // Enemy folds on large raises with weak deck
      this.gameState.enemyFolded = true;
      this.gameState.phase = "finished";

      // Player wins the pot
      this.deckManager.playerProfile.bankroll += this.gameState.pot;
      this.deckManager.saveToStorage();

      return {
        action: "fold",
        result: "Enemy folds - You win!",
        potWon: this.gameState.pot,
      };
    } else if (aggressiveness > 0.7 && deckQuality > 0.7) {
      // Enemy raises back
      const enemyRaise = Math.floor(playerRaise * (0.5 + Math.random() * 1.5));
      this.gameState.enemyBet += enemyRaise;
      this.gameState.pot += enemyRaise;

      return {
        action: "raise",
        amount: enemyRaise,
        message: `Enemy raises by ${enemyRaise} chips!`,
      };
    } else {
      // Enemy calls
      const callAmount = this.gameState.playerBet - this.gameState.enemyBet;
      this.gameState.enemyBet = this.gameState.playerBet;
      this.gameState.pot += callAmount;
      this.gameState.phase = "playing";

      return {
        action: "call",
        amount: callAmount,
        message: "Enemy calls!",
        phase: "playing",
      };
    }
  }

  // Enemy response to all-in
  getEnemyAllInResponse() {
    const deckQuality = this.calculateDeckQuality(this.gameState.enemyDeck);
    const callProbability = deckQuality * 0.8; // Strong decks more likely to call

    if (Math.random() < callProbability) {
      // Enemy calls all-in
      const callAmount = this.gameState.playerBet - this.gameState.enemyBet;
      this.gameState.enemyBet = this.gameState.playerBet;
      this.gameState.pot += callAmount;
      this.gameState.enemyAllIn = true;
      this.gameState.phase = "playing";

      return {
        action: "call",
        amount: callAmount,
        message: "Enemy calls your all-in!",
        phase: "playing",
      };
    } else {
      // Enemy folds to all-in
      this.gameState.enemyFolded = true;
      this.gameState.phase = "finished";

      // Player wins the pot
      this.deckManager.playerProfile.bankroll += this.gameState.pot;
      this.deckManager.saveToStorage();

      return {
        action: "fold",
        result: "Enemy folds to all-in - You win!",
        potWon: this.gameState.pot,
      };
    }
  }

  // Calculate deck quality for AI decisions
  calculateDeckQuality(deck) {
    if (!deck || deck.length === 0) return 0;

    let totalPower = 0;
    let promotionBonus = 0;

    deck.forEach((card) => {
      totalPower += card.getPower ? card.getPower() : RANK_VALUES[card.rank];
      promotionBonus +=
        (card.promotionLevel ? card.promotionLevel.stars : 0) * 2;
    });

    const averagePower = totalPower / deck.length;
    const completeness = deck.length / 52;

    return (averagePower / 20 + promotionBonus / 100 + completeness) / 3;
  }

  // Start the 3-hand battle
  startBattle() {
    if (this.gameState.phase !== "playing") {
      throw new Error("Not ready to battle");
    }

    const results = [];

    // Play 3 hands
    for (let hand = 0; hand < 3; hand++) {
      const handResult = this.playHand(hand + 1);
      results.push(handResult);

      if (handResult.winner === "player") {
        this.gameState.handsWon.player++;
      } else {
        this.gameState.handsWon.enemy++;
      }
    }

    // Determine overall winner
    const overallWinner =
      this.gameState.handsWon.player > this.gameState.handsWon.enemy
        ? "player"
        : "enemy";

    if (overallWinner === "player") {
      // Player wins the pot
      this.deckManager.playerProfile.bankroll += this.gameState.pot;
      this.deckManager.playerProfile.xp += Math.floor(this.gameState.pot / 10);

      // Record battle wins for cards used
      const usedCardIds = [];
      results.forEach((hand) => {
        hand.playerHand.forEach((card) => {
          if (card.id && !usedCardIds.includes(card.id)) {
            usedCardIds.push(card.id);
          }
        });
      });
      this.deckManager.recordBattleResult(usedCardIds, true);
    }

    this.deckManager.saveToStorage();
    this.gameState.phase = "finished";

    return {
      hands: results,
      overallWinner,
      handsWon: this.gameState.handsWon,
      potAmount: this.gameState.pot,
      playerBankroll: this.deckManager.playerProfile.bankroll,
    };
  }

  // Play a single hand
  playHand(handNumber) {
    // Draw 5 random cards from each deck
    const playerHand = this.drawRandomCards(this.gameState.playerDeck, 5);
    const enemyHand = this.drawRandomCards(this.gameState.enemyDeck, 5);

    // Calculate hand strength
    const playerStrength = this.calculateHandStrength(playerHand);
    const enemyStrength = this.calculateHandStrength(enemyHand);

    const winner = playerStrength > enemyStrength ? "player" : "enemy";

    return {
      handNumber,
      playerHand,
      enemyHand,
      playerStrength,
      enemyStrength,
      winner,
      margin: Math.abs(playerStrength - enemyStrength),
    };
  }

  // Draw random cards from deck
  drawRandomCards(deck, count) {
    const shuffled = [...deck].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }

  // Calculate hand strength (simplified poker-style)
  calculateHandStrength(hand) {
    let strength = 0;
    const rankCounts = {};
    const councilCounts = {};

    // Count ranks and councils
    hand.forEach((card) => {
      const rank = card.rank;
      const council = card.council;

      rankCounts[rank] = (rankCounts[rank] || 0) + 1;
      if (council) {
        councilCounts[council] = (councilCounts[council] || 0) + 1;
      }

      // Base rank value
      strength += RANK_VALUES[rank];

      // Promotion bonus
      if (card.promotionLevel) {
        strength += card.promotionLevel.stars * 5;
      }
    });

    // Check for poker-style combinations
    const rankValues = Object.values(rankCounts);
    const councilValues = Object.values(councilCounts);

    // Five of a kind (same council) - 1000 bonus
    if (councilValues.includes(5)) {
      strength += 1000;
    }
    // Four of a kind (same rank) - 500 bonus
    else if (rankValues.includes(4)) {
      strength += 500;
    }
    // Full house (3 of rank + 2 of rank) - 300 bonus
    else if (rankValues.includes(3) && rankValues.includes(2)) {
      strength += 300;
    }
    // Three of a kind - 200 bonus
    else if (rankValues.includes(3)) {
      strength += 200;
    }
    // Two pair - 100 bonus
    else if (rankValues.filter((count) => count === 2).length === 2) {
      strength += 100;
    }
    // One pair - 50 bonus
    else if (rankValues.includes(2)) {
      strength += 50;
    }

    return strength;
  }

  // Get current game state
  getGameState() {
    return { ...this.gameState };
  }

  // Reset battle
  resetBattle() {
    this.gameState = {
      phase: "setup",
      currentHand: 0,
      totalHands: 3,
      pot: 0,
      playerBet: 0,
      enemyBet: 0,
      playerAllIn: false,
      enemyAllIn: false,
      playerFolded: false,
      enemyFolded: false,
      playerDeck: null,
      enemyDeck: null,
      playerFaction: null,
      enemyFaction: null,
      handsWon: { player: 0, enemy: 0 },
      battleHistory: [],
    };
  }
}
