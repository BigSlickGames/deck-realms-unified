import { GAME_CONFIG } from './gameConstants.js';

export class Card {
    constructor(faction, rank, council) {
        this.id = this.generateId();
        this.faction = faction;
        this.rank = rank;
        this.council = council;
        this.promotionLevel = GAME_CONFIG.PROMOTION_LEVELS.COMMON;
        this.battlesWon = 0;
        this.battlesParticipated = 0;
        this.xp = 0;
        this.createdAt = new Date();
    }
    
    generateId() {
        return 'card_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
    }
    
    // Get card display information
    getDisplayInfo() {
        const factionInfo = GAME_CONFIG.FACTIONS[this.faction];
        const rankInfo = GAME_CONFIG.RANKS[this.rank];
        
        return {
            id: this.id,
            faction: factionInfo.name,
            factionSymbol: factionInfo.symbol,
            rank: this.rank,
            rankName: rankInfo.name,
            council: this.council,
            promotionLevel: this.promotionLevel.name,
            stars: this.promotionLevel.stars,
            battlesWon: this.battlesWon,
            battlesParticipated: this.battlesParticipated,
            xp: this.xp,
            canPromote: this.canPromote()
        };
    }
    
    // Check if card can be promoted
    canPromote() {
        const nextLevel = this.getNextPromotionLevel();
        if (!nextLevel) return false;
        
        return this.battlesWon >= nextLevel.battlesRequired;
    }
    
    // Get next promotion level
    getNextPromotionLevel() {
        const levels = Object.values(GAME_CONFIG.PROMOTION_LEVELS);
        const currentIndex = levels.findIndex(level => level.stars === this.promotionLevel.stars);
        
        if (currentIndex === -1 || currentIndex === levels.length - 1) {
            return null; // Already at max level or error
        }
        
        return levels[currentIndex + 1];
    }
    
    // Promote the card
    promote() {
        if (!this.canPromote()) {
            throw new Error('Card cannot be promoted yet. Needs more battle victories.');
        }
        
        const nextLevel = this.getNextPromotionLevel();
        if (nextLevel) {
            this.promotionLevel = nextLevel;
            return true;
        }
        
        return false;
    }
    
    // Record battle participation
    participateInBattle(won = false) {
        this.battlesParticipated++;
        if (won) {
            this.battlesWon++;
        }
    }
    
    // Get card power/strength (for future battle calculations)
    getPower() {
        let basePower = this.getRankValue();
        let promotionBonus = this.promotionLevel.stars * 2;
        
        return basePower + promotionBonus;
    }
    
    // Get numeric value of rank for calculations
    getRankValue() {
        const rankValues = {
            '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
            'J': 11, 'Q': 12, 'K': 13, 'A': 14
        };
        
        return rankValues[this.rank] || 0;
    }
    
    // Serialize card for storage
    toJSON() {
        return {
            id: this.id,
            faction: this.faction,
            rank: this.rank,
            council: this.council,
            promotionLevel: this.promotionLevel,
            battlesWon: this.battlesWon,
            battlesParticipated: this.battlesParticipated,
            xp: this.xp,
            createdAt: this.createdAt
        };
    }
    
    // Create card from stored data
    static fromJSON(data) {
        // Validate that the rank exists in GAME_CONFIG.RANKS
        if (!data.rank || !GAME_CONFIG.RANKS[data.rank]) {
            throw new Error(`Invalid or missing rank: ${data.rank}`);
        }
        
        const card = new Card(data.faction, data.rank, data.council);
        card.id = data.id;
        card.promotionLevel = data.promotionLevel;
        card.battlesWon = data.battlesWon;
        card.battlesParticipated = data.battlesParticipated;
        card.xp = data.xp || 0;
        card.createdAt = new Date(data.createdAt);
        
        return card;
    }
}