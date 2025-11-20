import { Card } from "Card.js";
import { BATTLE_CONFIG } from "./gameConstants.js";
import { HandEvaluator } from "./HandEvaluator.js";
import { CombatResolver } from "./CombatResolver.js";

/**
 * TacticalBattle - Round-by-round strategic card placement battle system
 * 12 rounds across 3 hands with row-based placement and poker hand evaluation
 */
export class TacticalBattle {
  constructor() {
    this.gameState = {
      phase: "setup",
      currentRound: 0,
      currentHand: 0,
      totalRounds: BATTLE_CONFIG.TOTAL_ROUNDS,
      playerScore: 0,
      enemyScore: 0,
      playerHP: BATTLE_CONFIG.STARTING_HP,
      enemyHP: BATTLE_CONFIG.STARTING_HP,
      playerDeck: [],
      enemyDeck: [],
      playerFaction: null,
      enemyFaction: null,
      currentTurn: null,
      playerRows: {
        front: {},
        mid: {},
        back: {},
      },
      enemyRows: {
        front: {},
        mid: {},
        back: {},
      },
      playerHand: [],
      enemyHand: [],
      battleLog: [],
      playerStats: {
        handsFormed: {},
        totalHands: 0,
        bestHand: null,
        damageDealt: 0,
        damageTaken: 0,
        cardsDestroyed: 0,
        cardsLost: 0,
      },
      enemyStats: {
        handsFormed: {},
        totalHands: 0,
        bestHand: null,
        damageDealt: 0,
        damageTaken: 0,
        cardsDestroyed: 0,
        cardsLost: 0,
      },
    };
  }

  generateFullDeck(faction) {
    const ranks = [
      "2",
      "3",
      "4",
      "5",
      "6",
      "7",
      "8",
      "9",
      "10",
      "J",
      "Q",
      "K",
      "A",
    ];
    const deck = [];

    // Create 13 cards (one per rank) for this faction
    // Each card appears 4 times to make a 52-card deck
    ranks.forEach((rank) => {
      for (let i = 0; i < 4; i++) {
        deck.push(Card.createBattleCard(faction, rank));
      }
    });

    return this.shuffleDeck(deck);
  }

  shuffleDeck(deck) {
    const shuffled = [...deck];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  setPlayerFaction(faction) {
    this.gameState.playerFaction = faction;
    this.gameState.playerDeck = this.generateFullDeck(faction);
    return {
      faction: faction,
      deckSize: this.gameState.playerDeck.length,
    };
  }

  generateEnemyDeck() {
    const factions = ["HEARTS", "DIAMONDS", "CLUBS", "SPADES"];
    const randomFaction = factions[Math.floor(Math.random() * factions.length)];
    this.gameState.enemyFaction = randomFaction;
    this.gameState.enemyDeck = this.generateFullDeck(randomFaction);
    return {
      faction: randomFaction,
      deckSize: this.gameState.enemyDeck.length,
    };
  }

  getGameState() {
    return { ...this.gameState };
  }

  drawCards(roundNum) {
    const cardsPerRound = BATTLE_CONFIG.CARDS_PER_ROUND[roundNum];

    if (!cardsPerRound) {
      console.error(`No card count defined for round ${roundNum}`);
      return {
        playerCards: [],
        enemyCards: [],
        playerHandSize: this.gameState.playerHand.length,
        enemyHandSize: this.gameState.enemyHand.length,
      };
    }

    const playerCards = this.gameState.playerDeck.splice(0, cardsPerRound);
    const enemyCards = this.gameState.enemyDeck.splice(0, cardsPerRound);

    this.gameState.playerHand.push(...playerCards);
    this.gameState.enemyHand.push(...enemyCards);

    this.addLog(
      `Round ${roundNum}: Dealt ${cardsPerRound} cards to each player (Player deck: ${this.gameState.playerDeck.length} remaining)`
    );

    return {
      playerCards,
      enemyCards,
      playerHandSize: this.gameState.playerHand.length,
      enemyHandSize: this.gameState.enemyHand.length,
    };
  }

  arrayToRowObject(cardsArray) {
    const rowObj = {};
    cardsArray.forEach((card, index) => {
      rowObj[index] = card;
    });
    return rowObj;
  }

  placeCard(player, cardIndex, row, slotIndex) {
    const hand =
      player === "player"
        ? this.gameState.playerHand
        : this.gameState.enemyHand;
    const rows =
      player === "player"
        ? this.gameState.playerRows
        : this.gameState.enemyRows;

    if (cardIndex < 0 || cardIndex >= hand.length) {
      return { success: false, error: "Invalid card index" };
    }

    if (!rows[row]) {
      return { success: false, error: "Invalid row" };
    }

    const rowCards = rows[row];
    const filledSlots = Object.keys(rowCards).length;

    if (filledSlots >= 10) {
      return { success: false, error: "Row is full" };
    }

    if (slotIndex !== undefined && rowCards[slotIndex]) {
      return { success: false, error: "Slot is occupied" };
    }

    const card = hand.splice(cardIndex, 1)[0];

    if (slotIndex !== undefined) {
      rowCards[slotIndex] = card;
    } else {
      for (let i = 0; i < 10; i++) {
        if (!rowCards[i]) {
          rowCards[i] = card;
          break;
        }
      }
    }

    this.addLog(
      `${player === "player" ? "Player" : "Enemy"} placed ${card.rank} in ${row} row`
    );

    return { success: true, card, row };
  }

  evaluateAllRows() {
    const playerEvals = {
      front: HandEvaluator.evaluateRow(
        Object.values(this.gameState.playerRows.front)
      ),
      mid: HandEvaluator.evaluateRow(
        Object.values(this.gameState.playerRows.mid)
      ),
      back: HandEvaluator.evaluateRow(
        Object.values(this.gameState.playerRows.back)
      ),
    };

    const enemyEvals = {
      front: HandEvaluator.evaluateRow(
        Object.values(this.gameState.enemyRows.front)
      ),
      mid: HandEvaluator.evaluateRow(
        Object.values(this.gameState.enemyRows.mid)
      ),
      back: HandEvaluator.evaluateRow(
        Object.values(this.gameState.enemyRows.back)
      ),
    };

    return { playerEvals, enemyEvals };
  }

  resolveCombat() {
    const playerRowsSlots = {
      front: this.gameState.playerRows.front,
      mid: this.gameState.playerRows.mid,
      back: this.gameState.playerRows.back,
    };

    const enemyRowsSlots = {
      front: this.gameState.enemyRows.front,
      mid: this.gameState.enemyRows.mid,
      back: this.gameState.enemyRows.back,
    };

    const results = CombatResolver.resolveCombatPhase(
      playerRowsSlots,
      enemyRowsSlots
    );

    // Apply damage
    const netPlayerDamage = Math.max(
      0,
      results.totalPlayerDamage - results.totalPlayerShield
    );
    const netEnemyDamage = Math.max(
      0,
      results.totalEnemyDamage - results.totalEnemyShield
    );

    this.gameState.playerHP -= netPlayerDamage;
    this.gameState.enemyHP -= netEnemyDamage;

    // Apply destruction
    if (
      results.front.cardsDestroyed > 0 &&
      results.front.winner === "attacker"
    ) {
      const remaining = CombatResolver.applyDestruction(
        Object.values(this.gameState.enemyRows.front),
        results.front.destructionTargets
      );
      this.gameState.enemyRows.front = this.arrayToRowObject(remaining);
    } else if (results.front.cardsDestroyed > 0) {
      const remaining = CombatResolver.applyDestruction(
        Object.values(this.gameState.playerRows.front),
        results.front.destructionTargets
      );
      this.gameState.playerRows.front = this.arrayToRowObject(remaining);
    }

    if (results.mid.cardsDestroyed > 0 && results.mid.winner === "attacker") {
      const remaining = CombatResolver.applyDestruction(
        Object.values(this.gameState.enemyRows.mid),
        results.mid.destructionTargets
      );
      this.gameState.enemyRows.mid = this.arrayToRowObject(remaining);
    } else if (results.mid.cardsDestroyed > 0) {
      const remaining = CombatResolver.applyDestruction(
        Object.values(this.gameState.playerRows.mid),
        results.mid.destructionTargets
      );
      this.gameState.playerRows.mid = this.arrayToRowObject(remaining);
    }

    if (results.back.cardsDestroyed > 0 && results.back.winner === "attacker") {
      const remaining = CombatResolver.applyDestruction(
        Object.values(this.gameState.enemyRows.back),
        results.back.destructionTargets
      );
      this.gameState.enemyRows.back = this.arrayToRowObject(remaining);
    } else if (results.back.cardsDestroyed > 0) {
      const remaining = CombatResolver.applyDestruction(
        Object.values(this.gameState.playerRows.back),
        results.back.destructionTargets
      );
      this.gameState.playerRows.back = this.arrayToRowObject(remaining);
    }

    // Track stats
    this.updateCombatStats(results, netPlayerDamage, netEnemyDamage);

    this.addLog(
      `Combat resolved: Player took ${netPlayerDamage} damage, Enemy took ${netEnemyDamage} damage`
    );
    this.addLog(
      `Player HP: ${this.gameState.playerHP}, Enemy HP: ${this.gameState.enemyHP}`
    );

    return {
      ...results,
      netPlayerDamage,
      netEnemyDamage,
      playerHP: this.gameState.playerHP,
      enemyHP: this.gameState.enemyHP,
    };
  }

  updateCombatStats(results, playerDamageTaken, enemyDamageTaken) {
    // Track damage
    this.gameState.playerStats.damageTaken += playerDamageTaken;
    this.gameState.playerStats.damageDealt += enemyDamageTaken;
    this.gameState.enemyStats.damageTaken += enemyDamageTaken;
    this.gameState.enemyStats.damageDealt += playerDamageTaken;

    // Track card destruction
    ["front", "mid", "back"].forEach((row) => {
      const rowResult = results[row];
      if (rowResult.winner === "attacker") {
        this.gameState.playerStats.cardsDestroyed += rowResult.cardsDestroyed;
        this.gameState.enemyStats.cardsLost += rowResult.cardsDestroyed;
      } else {
        this.gameState.enemyStats.cardsDestroyed += rowResult.cardsDestroyed;
        this.gameState.playerStats.cardsLost += rowResult.cardsDestroyed;
      }

      // Track hands formed
      const playerHandType = rowResult.attackerEval.handType;
      const enemyHandType = rowResult.defenderEval.handType;

      if (playerHandType) {
        this.gameState.playerStats.handsFormed[playerHandType] =
          (this.gameState.playerStats.handsFormed[playerHandType] || 0) + 1;
        this.gameState.playerStats.totalHands++;

        // Update best hand
        const handHierarchy = BATTLE_CONFIG.HAND_HIERARCHY;
        if (
          !this.gameState.playerStats.bestHand ||
          handHierarchy[playerHandType] >
            handHierarchy[this.gameState.playerStats.bestHand]
        ) {
          this.gameState.playerStats.bestHand = playerHandType;
        }
      }

      if (enemyHandType) {
        this.gameState.enemyStats.handsFormed[enemyHandType] =
          (this.gameState.enemyStats.handsFormed[enemyHandType] || 0) + 1;
        this.gameState.enemyStats.totalHands++;

        // Update best hand
        const handHierarchy = BATTLE_CONFIG.HAND_HIERARCHY;
        if (
          !this.gameState.enemyStats.bestHand ||
          handHierarchy[enemyHandType] >
            handHierarchy[this.gameState.enemyStats.bestHand]
        ) {
          this.gameState.enemyStats.bestHand = enemyHandType;
        }
      }
    });
  }

  nextRound() {
    this.gameState.currentRound++;

    if (this.gameState.currentRound > BATTLE_CONFIG.TOTAL_ROUNDS) {
      this.gameState.phase = "ended";
      return this.determineWinner();
    }

    // Check if we're starting a new hand (every 4 rounds)
    const isNewHand =
      this.gameState.currentRound % BATTLE_CONFIG.ROUNDS_PER_HAND === 1;
    if (isNewHand) {
      this.gameState.currentHand =
        Math.floor(
          (this.gameState.currentRound - 1) / BATTLE_CONFIG.ROUNDS_PER_HAND
        ) + 1;
      this.addLog(`--- Starting Hand ${this.gameState.currentHand} ---`);
    }

    this.gameState.phase = "drawing";
    this.addLog(`--- Round ${this.gameState.currentRound} ---`);

    return {
      round: this.gameState.currentRound,
      hand: this.gameState.currentHand,
      phase: this.gameState.phase,
      isNewHand: isNewHand && this.gameState.currentHand > 1,
    };
  }

  clearBoard() {
    this.gameState.playerRows = {
      front: {},
      mid: {},
      back: {},
    };
    this.gameState.enemyRows = {
      front: {},
      mid: {},
      back: {},
    };
    this.addLog("Board cleared for new hand");
  }

  determineWinner() {
    if (this.gameState.playerHP <= 0 && this.gameState.enemyHP <= 0) {
      return { winner: "draw", reason: "Both players defeated" };
    }

    if (this.gameState.playerHP <= 0) {
      return { winner: "enemy", reason: "Player HP reduced to 0" };
    }

    if (this.gameState.enemyHP <= 0) {
      return { winner: "player", reason: "Enemy HP reduced to 0" };
    }

    const playerTotalPower = this.calculateTotalPower(
      this.gameState.playerRows
    );
    const enemyTotalPower = this.calculateTotalPower(this.gameState.enemyRows);

    if (playerTotalPower > enemyTotalPower) {
      return {
        winner: "player",
        reason: "Higher realm power",
        playerPower: playerTotalPower,
        enemyPower: enemyTotalPower,
      };
    } else if (enemyTotalPower > playerTotalPower) {
      return {
        winner: "enemy",
        reason: "Higher realm power",
        playerPower: playerTotalPower,
        enemyPower: enemyTotalPower,
      };
    } else {
      return {
        winner: "draw",
        reason: "Equal realm power",
        playerPower: playerTotalPower,
        enemyPower: enemyTotalPower,
      };
    }
  }

  calculateTotalPower(rows) {
    const frontEval = HandEvaluator.evaluateRow(Object.values(rows.front));
    const midEval = HandEvaluator.evaluateRow(Object.values(rows.mid));
    const backEval = HandEvaluator.evaluateRow(Object.values(rows.back));

    const frontScore = HandEvaluator.calculateRowScore(frontEval, "front");
    const midScore = HandEvaluator.calculateRowScore(midEval, "mid");
    const backScore = HandEvaluator.calculateRowScore(backEval, "back");

    return frontScore + midScore + backScore;
  }

  addLog(message) {
    const timestamp = new Date().toLocaleTimeString();
    this.gameState.battleLog.push({ timestamp, message });
  }

  resetBattle() {
    this.gameState = {
      phase: "setup",
      currentRound: 0,
      currentHand: 0,
      totalRounds: BATTLE_CONFIG.TOTAL_ROUNDS,
      playerScore: 0,
      enemyScore: 0,
      playerHP: BATTLE_CONFIG.STARTING_HP,
      enemyHP: BATTLE_CONFIG.STARTING_HP,
      playerDeck: [],
      enemyDeck: [],
      playerFaction: null,
      enemyFaction: null,
      currentTurn: null,
      playerRows: {
        front: {},
        mid: {},
        back: {},
      },
      enemyRows: {
        front: {},
        mid: {},
        back: {},
      },
      playerHand: [],
      enemyHand: [],
      battleLog: [],
      playerStats: {
        handsFormed: {},
        totalHands: 0,
        bestHand: null,
        damageDealt: 0,
        damageTaken: 0,
        cardsDestroyed: 0,
        cardsLost: 0,
      },
      enemyStats: {
        handsFormed: {},
        totalHands: 0,
        bestHand: null,
        damageDealt: 0,
        damageTaken: 0,
        cardsDestroyed: 0,
        cardsLost: 0,
      },
    };
  }
}
