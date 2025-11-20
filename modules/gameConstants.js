// Game constants and configuration
export const GAME_CONFIG = {
    FACTIONS: {
        HEARTS: { name: 'Hearts', symbol: '♥', color: '#dc143c', spire: 'Crimson Spire' },
        DIAMONDS: { name: 'Diamonds', symbol: '♦', color: '#87ceeb', spire: 'Golden Spire' },
        CLUBS: { name: 'Clubs', symbol: '♣', color: '#6a0dad', spire: 'Shadow Spire' },
        SPADES: { name: 'Spades', symbol: '♠', color: '#ff8c00', spire: 'Iron Spire' }
    },
    
    COUNCILS: {
        NORTH: 'North Council',
        SOUTH: 'South Council',
        EAST: 'East Council',
        WEST: 'West Council'
    },
    
    RANKS: {
        2: { name: '2', weight: 70 },
        3: { name: '3', weight: 60 },
        4: { name: '4', weight: 50 },
        5: { name: '5', weight: 40 },
        6: { name: '6', weight: 30 },
        7: { name: '7', weight: 30 },
        8: { name: '8', weight: 30 },
        9: { name: '9', weight: 20 },
        10: { name: '10', weight: 20 },
        J: { name: 'Jack', weight: 10 },
        Q: { name: 'Queen', weight: 10 },
        K: { name: 'King', weight: 10 },
        A: { name: 'Ace', weight: 5 }
    },
    
    PROMOTION_LEVELS: {
        COMMON: { stars: 0, battlesRequired: 0, name: 'Common' },
        ONE_STAR: { stars: 1, battlesRequired: 10, name: '1-Star' },
        TWO_STAR: { stars: 2, battlesRequired: 20, name: '2-Star' },
        THREE_STAR: { stars: 3, battlesRequired: 30, name: '3-Star' },
        FOUR_STAR: { stars: 4, battlesRequired: 40, name: '4-Star' },
        FIVE_STAR: { stars: 5, battlesRequired: 50, name: '5-Star' },
        ELITE: { stars: 6, battlesRequired: 60, name: 'Elite' }
    },
    
    DECK_SIZE: {
        CARDS_PER_FACTION: 40,
        TOTAL_CARDS: 160, // 40 cards × 4 factions
        LEGION_SIZE: 13 // Cards per council
    }
};

export const CARD_RANKS = Object.keys(GAME_CONFIG.RANKS);
export const FACTION_NAMES = Object.keys(GAME_CONFIG.FACTIONS);