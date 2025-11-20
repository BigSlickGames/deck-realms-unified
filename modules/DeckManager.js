import { Card } from "./Card.js";
import { GAME_CONFIG, CARD_RANKS, FACTION_NAMES } from "./gameConstants.js";

export class DeckManager {
  constructor() {
    this.playerDecks = {
      HEARTS: this.createEmptyDeckStructure(),
      DIAMONDS: this.createEmptyDeckStructure(),
      CLUBS: this.createEmptyDeckStructure(),
      SPADES: this.createEmptyDeckStructure(),
    };
    this.cardCollection = {
      HEARTS: [],
      DIAMONDS: [],
      CLUBS: [],
      SPADES: [],
    };
    this.generatedFactions = new Set();
    this.deckAntes = {
      HEARTS: 1000,
      DIAMONDS: 1000,
      CLUBS: 1000,
      SPADES: 1000,
    };
    this.playerProfile = {
      bankroll: 250000,
      xp: 13045,
      level: 12,
    };
    this.loadFromStorage();
  }

  // Create empty deck structure with slots for each rank-council combination
  createEmptyDeckStructure() {
    const deck = {};
    const councils = Object.keys(GAME_CONFIG.COUNCILS);

    CARD_RANKS.forEach((rank) => {
      deck[rank] = {};
      councils.forEach((council) => {
        deck[rank][council] = null; // Empty slot
      });
    });

    return deck;
  }

  // Generate cards for collection
  generateCards(faction, count = 20) {
    // Check if cards have already been generated for this faction
    if (this.generatedFactions.has(faction)) {
      throw new Error(
        `Cards have already been generated for ${GAME_CONFIG.FACTIONS[faction].name}. You can only generate cards once per faction.`
      );
    }

    const cards = [];
    const councils = Object.keys(GAME_CONFIG.COUNCILS);

    for (let i = 0; i < count; i++) {
      // Randomly select a council
      const council = councils[Math.floor(Math.random() * councils.length)];

      // Generate rank based on rarity weights
      const rank = this.generateWeightedRank();

      const card = Card.createPersistent(faction, rank, council);
      cards.push(card);
    }

    // Add to collection
    this.cardCollection[faction].push(...cards);

    // Mark this faction as having generated cards
    this.generatedFactions.add(faction);

    this.saveToStorage();

    return cards;
  }

  // Generate a complete deck (52 cards) for a faction
  generateCompleteDeck(faction) {
    // Check if cards have already been generated for this faction
    if (this.generatedFactions.has(faction)) {
      console.log(`Deck already exists for ${faction}. Skipping generation.`);
      return;
    }

    console.log(`Generating complete deck for ${faction}...`);
    const cards = [];
    const councils = Object.keys(GAME_CONFIG.COUNCILS);

    // Generate one card for each rank-council combination (52 total)
    CARD_RANKS.forEach((rank) => {
      councils.forEach((council) => {
        const card = Card.createPersistent(faction, rank, council);
        cards.push(card);

        // Automatically add to deck
        this.playerDecks[faction][rank][council] = card;
      });
    });

    // Mark this faction as having generated cards
    this.generatedFactions.add(faction);

    this.saveToStorage();

    console.log(`Generated ${cards.length} cards for ${faction} deck`);
    return cards;
  }

  // Buy card pack from shop
  buyCardPack(skipGenerationCheck = false) {
    const packCost = 5000;
    const packSize = 10;

    if (this.playerProfile.bankroll < packCost) {
      throw new Error("Insufficient chips to buy pack!");
    }

    // Deduct cost
    this.playerProfile.bankroll -= packCost;

    // Generate 10 completely random cards from all factions and councils
    const packCards = [];
    const councils = Object.keys(GAME_CONFIG.COUNCILS);
    const factions = Object.keys(GAME_CONFIG.FACTIONS);

    for (let i = 0; i < packSize; i++) {
      // Completely random faction selection
      const randomFaction =
        factions[Math.floor(Math.random() * factions.length)];
      // Completely random council selection
      const council = councils[Math.floor(Math.random() * councils.length)];
      // Weighted random rank selection
      const rank = this.generateWeightedRank();

      const card = Card.createPersistent(randomFaction, rank, council);
      packCards.push(card);
    }

    // Add cards to their respective faction collections
    packCards.forEach((card) => {
      this.cardCollection[card.faction].push(card);
    });

    this.saveToStorage();
    return {
      cards: packCards,
      cost: packCost,
      newBankroll: this.playerProfile.bankroll,
    };
  }

  // Merge duplicate cards for XP
  mergeCards(cardId1, cardId2) {
    const card1 = this.getCard(cardId1);
    const card2 = this.getCard(cardId2);

    if (!card1 || !card2) {
      throw new Error("One or both cards not found");
    }

    if (
      card1.rank !== card2.rank ||
      card1.council !== card2.council ||
      card1.faction !== card2.faction
    ) {
      throw new Error("Cards must be identical to merge");
    }

    // Add XP to first card
    card1.addXP(100);

    // Remove second card from collection
    for (const faction of FACTION_NAMES) {
      const index = this.cardCollection[faction].findIndex(
        (card) => card.id === cardId2
      );
      if (index !== -1) {
        this.cardCollection[faction].splice(index, 1);
        break;
      }
    }

    this.saveToStorage();
    return card1;
  }

  // Get player profile
  getPlayerProfile() {
    return { ...this.playerProfile };
  }

  // Update player profile
  updatePlayerProfile(updates) {
    this.playerProfile = { ...this.playerProfile, ...updates };
    this.saveToStorage();
  }

  // Generate a rank based on weighted probabilities
  generateWeightedRank() {
    // Create weighted array based on rank weights
    const weightedRanks = [];

    Object.entries(GAME_CONFIG.RANKS).forEach(([rank, config]) => {
      // Add rank multiple times based on its weight
      for (let i = 0; i < config.weight; i++) {
        weightedRanks.push(rank);
      }
    });

    // Randomly select from weighted array
    const randomIndex = Math.floor(Math.random() * weightedRanks.length);
    return weightedRanks[randomIndex];
  }

  // Add card to player deck
  addCardToDeck(faction, cardId) {
    const cardIndex = this.cardCollection[faction].findIndex(
      (card) => card.id === cardId
    );
    if (cardIndex === -1) {
      throw new Error("Card not found in collection.");
    }

    const card = this.cardCollection[faction][cardIndex];

    // Check if slot is already occupied
    if (this.playerDecks[faction][card.rank][card.council] !== null) {
      throw new Error(
        `Slot already occupied! You can only have one ${card.rank} from ${card.council} council.`
      );
    }

    // Remove from collection and add to deck slot
    this.cardCollection[faction].splice(cardIndex, 1);
    this.playerDecks[faction][card.rank][card.council] = card;
    this.saveToStorage();

    return card;
  }

  // Remove card from player deck
  removeCardFromDeck(faction, cardId) {
    let foundCard = null;
    let foundRank = null;
    let foundCouncil = null;

    // Find the card in the deck structure
    Object.keys(this.playerDecks[faction]).forEach((rank) => {
      Object.keys(this.playerDecks[faction][rank]).forEach((council) => {
        const card = this.playerDecks[faction][rank][council];
        if (card && card.id === cardId) {
          foundCard = card;
          foundRank = rank;
          foundCouncil = council;
        }
      });
    });

    if (!foundCard) {
      throw new Error("Card not found in deck.");
    }

    // Remove from deck slot and add back to collection
    this.playerDecks[faction][foundRank][foundCouncil] = null;
    this.cardCollection[faction].push(foundCard);
    this.saveToStorage();

    return foundCard;
  }

  // Get player deck for faction
  getPlayerDeck(faction) {
    const deckCards = [];

    Object.keys(this.playerDecks[faction]).forEach((rank) => {
      Object.keys(this.playerDecks[faction][rank]).forEach((council) => {
        const card = this.playerDecks[faction][rank][council];
        if (card) {
          deckCards.push(card.getDisplayInfo());
        } else {
          // Add empty slot info
          deckCards.push({
            id: `empty_${rank}_${council}`,
            rank: rank,
            council: council,
            isEmpty: true,
            faction: faction,
          });
        }
      });
    });

    return deckCards;
  }

  // Get deck structure for display
  getDeckStructure(faction) {
    return this.playerDecks[faction];
  }

  // Get collection for faction
  getCollection(faction) {
    return this.cardCollection[faction].map((card) => card.getDisplayInfo());
  }

  // Get all cards for faction (both in deck and collection)
  // Added from Explore version
  getAllCards(faction) {
    const allCards = [...this.cardCollection[faction]];

    Object.keys(this.playerDecks[faction]).forEach((rank) => {
      Object.keys(this.playerDecks[faction][rank]).forEach((council) => {
        const card = this.playerDecks[faction][rank][council];
        if (card) {
          allCards.push(card);
        }
      });
    });

    return allCards.map((card) => card.getDisplayInfo());
  }

  // Get deck statistics
  getDeckStats(faction) {
    const filledSlots = [];

    Object.keys(this.playerDecks[faction]).forEach((rank) => {
      Object.keys(this.playerDecks[faction][rank]).forEach((council) => {
        const card = this.playerDecks[faction][rank][council];
        if (card) {
          filledSlots.push(card);
        }
      });
    });

    return {
      totalCards: filledSlots.length,
      maxCards: 52, // 13 ranks × 4 councils
      councils: this.getCouncilDistribution(filledSlots),
      ranks: this.getRankDistribution(filledSlots),
    };
  }

  // Get council distribution
  getCouncilDistribution(cards) {
    const distribution = {};
    Object.keys(GAME_CONFIG.COUNCILS).forEach((council) => {
      distribution[council] = cards.filter(
        (card) => card.council === council
      ).length;
    });
    return distribution;
  }

  // Get rank distribution
  getRankDistribution(cards) {
    const distribution = {};
    CARD_RANKS.forEach((rank) => {
      distribution[rank] = cards.filter((card) => card.rank === rank).length;
    });
    return distribution;
  }

  // Get a specific card by ID
  getCard(cardId) {
    for (const faction of FACTION_NAMES) {
      // Search in deck structure
      for (const rank of Object.keys(this.playerDecks[faction])) {
        for (const council of Object.keys(this.playerDecks[faction][rank])) {
          const card = this.playerDecks[faction][rank][council];
          if (card && card.id === cardId) {
            return card;
          }
        }
      }

      // Search in collection
      const card = this.cardCollection[faction].find(
        (card) => card.id === cardId
      );
      if (card) return card;
    }
    return null;
  }

  // Promote a card
  promoteCard(cardId) {
    const card = this.getCard(cardId);
    if (!card) {
      throw new Error("Card not found");
    }

    const success = card.promote();
    if (success) {
      this.saveToStorage();
    }

    return success;
  }

  // Check if cards can be generated for a faction
  canGenerateCards(faction) {
    return !this.generatedFactions.has(faction);
  }

  // Record battle result for cards
  recordBattleResult(cardIds, won = false) {
    cardIds.forEach((cardId) => {
      const card = this.getCard(cardId);
      if (card) {
        card.participateInBattle(won);
      }
    });

    this.saveToStorage();
  }

  // Save to localStorage
  saveToStorage() {
    const data = {
      playerDecks: {},
      cardCollection: {},
      generatedFactions: Array.from(this.generatedFactions),
      deckAntes: this.deckAntes,
      playerProfile: this.playerProfile,
      lastSaved: new Date().toISOString(),
    };

    // Convert cards to JSON
    FACTION_NAMES.forEach((faction) => {
      data.playerDecks[faction] = {};
      Object.keys(this.playerDecks[faction]).forEach((rank) => {
        data.playerDecks[faction][rank] = {};
        Object.keys(this.playerDecks[faction][rank]).forEach((council) => {
          const card = this.playerDecks[faction][rank][council];
          data.playerDecks[faction][rank][council] = card
            ? card.toJSON()
            : null;
        });
      });

      data.cardCollection[faction] = this.cardCollection[faction].map((card) =>
        card.toJSON()
      );
    });

    localStorage.setItem("deckRealms_data", JSON.stringify(data));
  }

  // Load from localStorage
  loadFromStorage() {
    try {
      const savedData = localStorage.getItem("deckRealms_data");
      if (savedData) {
        const data = JSON.parse(savedData);

        // Load generated factions
        this.generatedFactions = new Set(data.generatedFactions || []);

        // Load deck antes
        if (data.deckAntes) {
          this.deckAntes = { ...this.deckAntes, ...data.deckAntes };
        }

        FACTION_NAMES.forEach((faction) => {
          if (data.playerDecks && data.playerDecks[faction]) {
            this.playerDecks[faction] = {};
            Object.keys(data.playerDecks[faction]).forEach((rank) => {
              this.playerDecks[faction][rank] = {};
              Object.keys(data.playerDecks[faction][rank]).forEach(
                (council) => {
                  const cardData = data.playerDecks[faction][rank][council];
                  this.playerDecks[faction][rank][council] = cardData
                    ? Card.fromJSON(cardData)
                    : null;
                }
              );
            });
          } else {
            this.playerDecks[faction] = this.createEmptyDeckStructure();
          }

          if (data.cardCollection && data.cardCollection[faction]) {
            this.cardCollection[faction] = data.cardCollection[faction].map(
              (cardData) => Card.fromJSON(cardData)
            );
          }
        });

        if (data.playerProfile) {
          this.playerProfile = { ...data.playerProfile };
        }
      }
    } catch (error) {
      console.error("Error loading data from storage:", error);
      this.resetData();
    }
  }

  // Reset all data
  resetData() {
    FACTION_NAMES.forEach((faction) => {
      this.playerDecks[faction] = this.createEmptyDeckStructure();
      this.cardCollection[faction] = [];
    });
    this.generatedFactions = new Set();
    localStorage.removeItem("deckRealms_data");
  }

  // Get ante for a faction
  getAnte(faction) {
    return this.deckAntes[faction] || 1000;
  }

  // Set ante for a faction
  setAnte(faction, amount) {
    const minAnte = 100;
    const maxAnte = 50000;
    const clampedAmount = Math.max(minAnte, Math.min(maxAnte, amount));
    this.deckAntes[faction] = clampedAmount;
    this.saveToStorage();
    return clampedAmount;
  }

  // Get average ante across all decks
  getAverageAnte() {
    const totalAnte = Object.values(this.deckAntes).reduce(
      (sum, ante) => sum + ante,
      0
    );
    return Math.round(totalAnte / 4);
  }

  // Get all antes
  getAllAntes() {
    return { ...this.deckAntes };
  }
}
