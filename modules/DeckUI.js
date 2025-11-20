import { GAME_CONFIG, FACTION_NAMES } from './gameConstants.js';
import { BattleSystem } from './BattleSystem.js';
import { CoinFlip } from './CoinFlip.js';

export class DeckUI {
    constructor(deckManager) {
        this.deckManager = deckManager;
        this.currentFaction = null;
        this.battleSystem = new BattleSystem(deckManager);
        this.coinFlip = new CoinFlip();
        this.battleState = {
            phase: 'setup', // setup, dealing, playing, finished
            currentRound: 0,
            playerScore: 0,
            enemyScore: 0,
            playerHand: [],
            enemyHand: [],
            selectedFaction: null
        };
        
        this.initializeElements();
        this.bindEvents();
        this.updateAllFactionCounters();
        this.updatePlayerProfile();
    }
    
    initializeElements() {
        // Main navigation elements
        this.gameInterface = document.getElementById('gameInterface');
        
        // System tabs
        this.systemTabs = document.querySelectorAll('.system-tab');
        this.gameSystems = document.querySelectorAll('.game-system');
        
        // Battle system elements
        this.battleFactionSelect = document.getElementById('battleFactionSelect');
        this.playerDeckCount = document.getElementById('playerDeckCount');
        this.startBattleBtn = document.getElementById('startBattleBtn');
        this.battleStatusBar = document.getElementById('battleStatusBar');
        this.currentRound = document.getElementById('currentRound');
        this.battleScore = document.getElementById('battleScore');
        this.battlePhase = document.getElementById('battlePhase');
        this.playerHand = document.getElementById('handCards');
        this.battleLogContent = document.getElementById('battleLogContent');
        
        // Management system elements
        this.factionSelect = document.getElementById('factionSelect');
        this.currentFactionTitle = document.getElementById('currentFactionTitle');
        this.currentFactionSymbol = document.getElementById('currentFactionSymbol');
        this.deckCount = document.getElementById('deckCount');
        this.currentDeck = document.getElementById('currentDeck');
        this.cardCollection = document.getElementById('cardCollection');
        this.generateCardsBtn = document.getElementById('generateCardsBtn');
        this.sortFilter = document.getElementById('sortFilter');
        this.selectedCardStats = document.getElementById('selectedCardStats');
        this.cardActions = document.getElementById('cardActions');
        this.moveToDeckBtn = document.getElementById('moveToDeckBtn');
        this.moveToCollectionBtn = document.getElementById('moveToCollectionBtn');
        this.promoteCardBtn = document.getElementById('promoteCardBtn');
        
        // Shop elements
        this.shopBtn = document.getElementById('shopBtn');
        this.shopModal = document.getElementById('shopModal');
        this.closeShopBtn = document.getElementById('closeShopBtn');
        this.buyPackBtn = document.getElementById('buyPackBtn');
        
        // Faction counters
        this.factionCounters = {
            HEARTS: document.getElementById('heartsQuickCount'),
            DIAMONDS: document.getElementById('diamondsQuickCount'),
            CLUBS: document.getElementById('clubsQuickCount'),
            SPADES: document.getElementById('spadesQuickCount')
        };

        // Ante selector elements
        this.anteValue = document.getElementById('anteValue');
        this.anteUp = document.getElementById('anteUp');
        this.anteDown = document.getElementById('anteDown');

        // Battle control elements
        this.dealCardsBtn = document.getElementById('dealCardsBtn');
        this.endRoundBtn = document.getElementById('endRoundBtn');
        this.nextRoundBtn = document.getElementById('nextRoundBtn');

        // Reset button
        this.resetDataBtn = document.getElementById('resetDataBtn');
    }
    
    bindEvents() {
        // System tabs
        this.systemTabs?.forEach(tab => {
            tab.addEventListener('click', (e) => {
                const system = e.currentTarget.dataset.system;
                this.switchToSystem(system);
            });
        });
        
        // Quick action buttons
        document.querySelectorAll('.quick-action-btn')?.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const system = e.currentTarget.dataset.system;
                this.switchToSystem(system);
            });
        });
        
        // Battle system events
        this.battleFactionSelect?.addEventListener('change', () => this.updateBattleFactionInfo());
        this.startBattleBtn?.addEventListener('click', () => this.startBattle());
        
        // Management system events
        this.factionSelect?.addEventListener('change', () => this.selectFaction(this.factionSelect.value));
        this.generateCardsBtn?.addEventListener('click', () => this.generateCards());
        this.sortFilter?.addEventListener('change', () => this.updateCollectionDisplay());
        this.moveToDeckBtn?.addEventListener('click', () => this.moveSelectedCardToDeck());
        this.moveToCollectionBtn?.addEventListener('click', () => this.moveSelectedCardToCollection());

        // Ante selector events
        this.anteUp?.addEventListener('click', () => this.adjustAnte(100));
        this.anteDown?.addEventListener('click', () => this.adjustAnte(-100));
        this.promoteCardBtn?.addEventListener('click', () => this.promoteSelectedCard());

        // Battle control events
        this.dealCardsBtn?.addEventListener('click', () => this.dealCards());
        this.endRoundBtn?.addEventListener('click', () => this.endRound());
        this.nextRoundBtn?.addEventListener('click', () => this.nextRound());
        
        // Shop events
        this.shopBtn?.addEventListener('click', () => this.showShop());
        this.closeShopBtn?.addEventListener('click', () => this.hideShop());
        this.buyPackBtn?.addEventListener('click', () => this.buyPack());

        // Reset button
        this.resetDataBtn?.addEventListener('click', () => this.confirmReset());

        // Initialize with Hearts faction
        this.selectFaction('HEARTS');
    }
    
    enterGame() {
        this.gameInterface?.classList.remove('hidden');
        this.switchToSystem('command');
    }
    
    switchToSystem(systemName) {
        // Update tabs
        this.systemTabs?.forEach(tab => {
            tab.classList.remove('active');
            if (tab.dataset.system === systemName) {
                tab.classList.add('active');
            }
        });
        
        // Update systems
        this.gameSystems?.forEach(system => {
            system.classList.remove('active');
            if (system.id === `${systemName}System`) {
                system.classList.add('active');
            }
        });

        // Handle faction background videos when switching systems
        const factionVideos = {
            HEARTS: document.getElementById('heartsBackgroundVideo'),
            DIAMONDS: document.getElementById('diamondsBackgroundVideo'),
            CLUBS: document.getElementById('clubsBackgroundVideo'),
            SPADES: document.getElementById('spadesBackgroundVideo')
        };

        if (systemName === 'manage' && this.currentFaction) {
            const currentVideo = factionVideos[this.currentFaction];
            if (currentVideo) {
                currentVideo.classList.remove('hidden');
                currentVideo.classList.add('active');
                currentVideo.play().catch(err => console.log('Video autoplay prevented'));
            }
        } else {
            Object.values(factionVideos).forEach(video => {
                if (video) {
                    video.classList.remove('active');
                    video.classList.add('hidden');
                }
            });
        }

        // Update quick stats when returning to command
        if (systemName === 'command') {
            this.updateQuickStats();
        }
    }
    
    // Battle System Methods
    updateBattleFactionInfo() {
        const selectedFaction = this.battleFactionSelect?.value;
        
        if (!selectedFaction) {
            this.playerDeckCount.textContent = 'Select faction';
            this.startBattleBtn.disabled = true;
            return;
        }
        
        const deckStats = this.deckManager.getDeckStats(selectedFaction);
        this.playerDeckCount.textContent = `${deckStats.totalCards} cards`;
        
        // Enable battle button if player has cards
        this.startBattleBtn.disabled = deckStats.totalCards === 0;
        
        if (deckStats.totalCards === 0) {
            this.addBattleLogEntry('No cards in selected faction deck. Build your deck first!');
        } else {
            this.addBattleLogEntry(`${GAME_CONFIG.FACTIONS[selectedFaction].name} deck ready with ${deckStats.totalCards} cards.`);
        }
    }
    
    async startBattle() {
        const selectedFaction = this.battleFactionSelect?.value;
        if (!selectedFaction) return;

        this.battleState.selectedFaction = selectedFaction;

        if (this.coinFlip) {
            this.coinFlip.show((flipResult) => {
                this.battleState.turnOrder = flipResult.turnOrder;
                this.battleState.playerTurn = flipResult.turnOrder === 'first';

                this.addBattleLogEntry(
                    flipResult.won
                        ? `You won the flip! ${flipResult.turnOrder === 'first' ? 'You go first!' : 'Enemy goes first.'}`
                        : `Enemy won the flip. Enemy goes first.`
                );

                this.initializeBattleAfterFlip();
            });
        } else {
            this.battleState.turnOrder = 'first';
            this.battleState.playerTurn = true;
            this.initializeBattleAfterFlip();
        }
    }

    async initializeBattleAfterFlip() {
        const selectedFaction = this.battleState.selectedFaction;

        this.battleState.phase = 'ready';
        this.battleState.currentRound = 1;
        this.battleState.playerScore = 0;
        this.battleState.enemyScore = 0;
        this.battleState.cardsDealt = 0;

        this.updateBattleStatus();
        this.startBattleBtn.disabled = true;
        this.startBattleBtn.textContent = 'BATTLE IN PROGRESS...';

        try {
            this.battleSystem.initializeBattleWithPlayerDeck(selectedFaction, this.deckManager);
            this.battleSystem.generateEnemyDeck();

            this.addBattleLogEntry('Battle initialized! Preparing for combat...');

            await this.startBattleCountdown();

            this.battleState.phase = 'playing';
            this.updateBattleStatus();
            this.dealCardsBtn.disabled = false;
            this.addBattleLogEntry('🎴 Click "Deal Cards" to start dealing.');
            this.initializeDragAndDrop();

        } catch (error) {
            this.addBattleLogEntry(`Error: ${error.message}`);
            this.resetBattleUI();
        }
    }
    
    async startBattleCountdown() {
        const faction = GAME_CONFIG.FACTIONS[this.battleState.selectedFaction];
        
        // Create countdown overlay
        const overlay = document.createElement('div');
        overlay.className = 'countdown-overlay';
        overlay.innerHTML = `
            <div class="countdown-content">
                <div class="countdown-number">3</div>
                <div class="countdown-text">Prepare for Battle!</div>
            </div>
        `;
        document.body.appendChild(overlay);
        
        // Countdown from 3
        for (let i = 3; i > 0; i--) {
            const numberEl = overlay.querySelector('.countdown-number');
            const textEl = overlay.querySelector('.countdown-text');
            
            numberEl.textContent = i;
            numberEl.style.animation = 'none';
            numberEl.offsetHeight; // Force reflow
            numberEl.style.animation = 'countdownPulse 1s ease-out';
            
            if (i === 1) {
                textEl.textContent = 'FOR THE REALM!';
            }
            
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        // Battle cry
        overlay.innerHTML = `
            <div class="battle-cry">
                <div class="cry-text">FOR THE REALM!</div>
                <div class="cry-faction">FOR ${faction.name.toUpperCase()}!</div>
                <div class="faction-symbol-large" style="color: ${faction.color}">${faction.symbol}</div>
            </div>
        `;
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        document.body.removeChild(overlay);
    }
    
    dealCards() {
        if (this.battleState.phase !== 'playing') return;

        const cardsPerDeal = 2;

        const playerDeck = this.battleSystem.getPlayerActualDeck(this.battleState.selectedFaction, this.deckManager);
        const enemyDeck = this.battleSystem.gameState.enemyDeck;

        const playerCards = this.drawRandomCards(playerDeck, cardsPerDeal);
        const enemyCards = this.drawRandomCards(enemyDeck, cardsPerDeal);

        if (this.playerHand) {
            this.playerHand.innerHTML = '';
        }

        playerCards.forEach((card, index) => {
            const cardEl = this.createDraggableCard(card, index);
            this.playerHand?.appendChild(cardEl);
            if (!this.battleState.playerHand) {
                this.battleState.playerHand = [];
            }
            this.battleState.playerHand.push(card);
        });

        this.addBattleLogEntry(`Dealt ${cardsPerDeal} cards to you and enemy.`);
        this.addBattleLogEntry('Place your cards, then deal again or end round.');

        this.dealCardsBtn.disabled = false;
        this.endRoundBtn.disabled = false;

        this.initializeDragAndDrop();

        if (enemyCards && enemyCards.length > 0) {
            this.addBattleLogEntry(`Enemy has ${enemyCards.length} cards in hand to place.`);
            if (!this.battleState.enemyHand) {
                this.battleState.enemyHand = [];
            }
            enemyCards.forEach(card => this.battleState.enemyHand.push(card));
        }
    }
    
    createDraggableCard(card, index) {
        const cardEl = document.createElement('div');
        cardEl.className = 'battle-card draggable';
        cardEl.draggable = true;
        cardEl.dataset.cardId = card.id;
        cardEl.style.animationDelay = `${index * 0.2}s`;
        
        const faction = GAME_CONFIG.FACTIONS[card.faction];
        
        cardEl.innerHTML = `
            <div class="card-face" style="border-color: ${faction.color}">
                <div class="card-header">
                    <div class="card-rank">${card.rank}</div>
                    <div class="card-suit" style="color: ${faction.color}">${faction.symbol}</div>
                </div>
                <div class="card-body">
                    <div class="card-council">${card.council}</div>
                    <div class="card-promotion">${card.promotionLevel.name}</div>
                    <div class="card-stars">${'⭐'.repeat(card.promotionLevel.stars)}</div>
                </div>
            </div>
        `;
        
        return cardEl;
    }
    
    dealAndPlaceEnemyCards(cardCount) {
        // Generate enemy cards for this dealing step
        const enemyFactions = Object.keys(GAME_CONFIG.FACTIONS);
        const randomFaction = enemyFactions[Math.floor(Math.random() * enemyFactions.length)];
        const enemyDeck = this.battleSystem.generateRandomDeck(randomFaction);
        const enemyCards = this.drawRandomCards(enemyDeck, cardCount);
        
        // Get available enemy slots
        const enemySlots = document.querySelectorAll('.card-slot[data-side="enemy"]');
        const availableSlots = Array.from(enemySlots).filter(slot => 
            !slot.hasChildNodes() || slot.children.length === 0
        );
        
        // Auto-place enemy cards with animation delay
        enemyCards.forEach((card, index) => {
            if (index < availableSlots.length) {
                setTimeout(() => {
                    const cardElement = this.createEnemyCard(card);
                    cardElement.style.animation = 'enemyCardPlace 0.5s ease-out';
                    availableSlots[index].appendChild(cardElement);
                    
                    // Add to enemy hand tracking
                    if (!this.battleState.enemyHand) {
                        this.battleState.enemyHand = [];
                    }
                    this.battleState.enemyHand.push(card);
                }, index * 200); // Stagger the placement
            }
        });
        
        this.addBattleLogEntry(`Enemy places ${cardCount} cards automatically`);
    }
    
    initializeDragAndDrop() {
        // Add drag events to cards
        document.querySelectorAll('.battle-card.draggable').forEach(card => {
            card.addEventListener('dragstart', this.handleDragStart.bind(this));
            card.addEventListener('dragend', this.handleDragEnd.bind(this));
        });
        
        // Add drop events to player card slots
        document.querySelectorAll('.card-slot[data-side="player"]').forEach(slot => {
            slot.addEventListener('dragover', this.handleDragOver.bind(this));
            slot.addEventListener('drop', this.handleDrop.bind(this));
            slot.addEventListener('dragenter', this.handleDragEnter.bind(this));
            slot.addEventListener('dragleave', this.handleDragLeave.bind(this));
        });
    }
    
    handleDragStart(e) {
        e.dataTransfer.setData('text/plain', e.target.dataset.cardId);
        e.target.classList.add('dragging');
        
        // Highlight available drop zones
        document.querySelectorAll('.card-slot[data-side="player"]').forEach(slot => {
            if (!slot.hasChildNodes() || slot.children.length === 0) {
                slot.classList.add('drop-zone-active');
            }
        });
    }
    
    handleDragEnd(e) {
        e.target.classList.remove('dragging');
        document.querySelectorAll('.drop-zone-active').forEach(slot => {
            slot.classList.remove('drop-zone-active');
        });
    }
    
    handleDragOver(e) {
        e.preventDefault();
    }
    
    handleDragEnter(e) {
        if (!e.target.hasChildNodes() || e.target.children.length === 0) {
            e.target.classList.add('drop-zone-hover');
        }
    }
    
    handleDragLeave(e) {
        e.target.classList.remove('drop-zone-hover');
    }
    
    handleDrop(e) {
        e.preventDefault();
        
        const cardId = e.dataTransfer.getData('text/plain');
        const cardElement = document.querySelector(`[data-card-id="${cardId}"]`);
        
        if (cardElement && (!e.target.hasChildNodes() || e.target.children.length === 0)) {
            // Move card to battlefield
            e.target.appendChild(cardElement);
            cardElement.classList.remove('draggable');
            cardElement.draggable = false;
            cardElement.classList.add('placed');
            
            this.addBattleLogEntry('Card placed on battlefield!');
            
            // Check if all cards are placed (optional - could auto-battle)
            this.checkBattleReady();
        }
        
        e.target.classList.remove('drop-zone-hover', 'drop-zone-active');
    }
    
    dealNextStep() {
        const sequence = this.battleState.handSequence;
        
        if (sequence.currentStep >= sequence.steps.length) {
            // All cards dealt for this round, execute battle
            this.executeBattleRound();
            return;
        }
        
        const currentStep = sequence.steps[sequence.currentStep];
        const cardsToDeal = currentStep.cards;
        
        // Get player deck
        const playerDeck = this.getPlayerDeckCards(this.battleState.selectedFaction);
        
        if (playerDeck.length === 0) {
            this.addBattleLogEntry('No cards available to deal!');
            this.resetBattleUI();
            return;
        }
        
        // Deal cards to hand
        const newCards = this.drawRandomCards(playerDeck, cardsToDeal);
        this.battleState.playerHand.push(...newCards);
        
        // Add cards to hand UI
        newCards.forEach((card, index) => {
            const cardElement = this.createDraggableCard(card, sequence.totalCardsDealt + index);
            this.playerHand.appendChild(cardElement);
        });
        
        // Auto-deal and place enemy cards
        this.dealAndPlaceEnemyCards(cardsToDeal);
        
        sequence.totalCardsDealt += cardsToDeal;
        
        // Initialize drag and drop for new cards
        this.initializeDragAndDrop();
        
        this.addBattleLogEntry(`Dealing ${cardsToDeal} cards: ${currentStep.description}`);
        
        // Update phase to waiting for placement
        this.battleState.phase = 'placing';
        this.updateBattleStatus();
        
        // Show continue button if not first step
        if (sequence.currentStep > 0) {
            this.showContinueButton();
        }
    }
    
    showContinueButton() {
        // Remove existing continue button if any
        const existingBtn = document.getElementById('continueBtn');
        if (existingBtn) {
            existingBtn.remove();
        }
        
        const continueBtn = document.createElement('button');
        continueBtn.id = 'continueBtn';
        continueBtn.className = 'continue-btn';
        continueBtn.textContent = 'Continue to Next Cards';
        continueBtn.onclick = () => this.continueToNextStep();
        
        // Add to hand area
        const handArea = this.playerHand.parentElement;
        handArea.appendChild(continueBtn);
    }
    
    continueToNextStep() {
        // Remove continue button
        const continueBtn = document.getElementById('continueBtn');
        if (continueBtn) {
            continueBtn.remove();
        }
        
        // Move to next step
        this.battleState.handSequence.currentStep++;
        this.dealNextStep();
    }
    
    checkBattleReady() {
        const handCards = document.querySelectorAll('#handCards .battle-card.draggable');
        
        // If no cards left in hand, show continue button or finish round
        if (handCards.length === 0) {
            const sequence = this.battleState.handSequence;
            
            if (sequence.currentStep < sequence.steps.length - 1) {
                // More cards to deal, show continue button
                this.showContinueButton();
            } else {
                // All cards dealt and placed, execute round
                setTimeout(() => this.executeBattleRound(), 1000);
            }
        }
    }
    
    async executeBattleRound() {
        this.battleState.phase = 'battling';
        this.updateBattleStatus();
        
        this.addBattleLogEntry(`Executing Round ${this.battleState.currentRound}...`);
        
        // Get placed player cards
        const playerCards = this.getPlacedPlayerCards();
        
        // Generate enemy cards for this round
        const enemyCards = this.generateEnemyHand();
        
        // Place enemy cards on battlefield
        this.placeEnemyCards(enemyCards);
        
        // Calculate round result
        const result = this.calculateRoundResult(playerCards, enemyCards);
        
        // Update scores
        if (result.winner === 'player') {
            this.battleState.playerScore++;
        } else {
            this.battleState.enemyScore++;
        }
        
        this.updateBattleStatus();
        this.addBattleLogEntry(`Round ${this.battleState.currentRound}: ${result.message}`);
        
        // Check if battle is over
        if (this.battleState.currentRound >= 3) {
            this.finishBattle();
        } else {
            // Prepare next round
            setTimeout(() => this.prepareNextRound(), 2000);
        }
    }
    
    getPlacedPlayerCards() {
        const placedCards = [];
        document.querySelectorAll('.card-slot[data-side="player"] .battle-card.placed').forEach(cardEl => {
            const cardId = cardEl.dataset.cardId;
            const card = this.battleState.playerHand.find(c => c.id === cardId);
            if (card) {
                placedCards.push(card);
            }
        });
        return placedCards;
    }
    
    generateEnemyHand() {
        const enemyFactions = Object.keys(GAME_CONFIG.FACTIONS);
        const randomFaction = enemyFactions[Math.floor(Math.random() * enemyFactions.length)];
        const enemyDeck = this.battleSystem.generateRandomDeck(randomFaction);
        
        return this.drawRandomCards(enemyDeck, 5);
    }
    
    placeEnemyCards(enemyCards) {
        const enemySlots = document.querySelectorAll('.card-slot[data-side="enemy"]');
        const availableSlots = Array.from(enemySlots).filter(slot => 
            !slot.hasChildNodes() || slot.children.length === 0
        );
        
        enemyCards.forEach((card, index) => {
            if (index < availableSlots.length) {
                const cardElement = this.createEnemyCard(card);
                availableSlots[index].appendChild(cardElement);
            }
        });
    }
    
    createEnemyCard(card) {
        const cardEl = document.createElement('div');
        cardEl.className = 'battle-card enemy-card';
        
        const faction = GAME_CONFIG.FACTIONS[card.faction];
        
        cardEl.innerHTML = `
            <div class="card-face" style="border-color: ${faction.color}">
                <div class="card-header">
                    <div class="card-rank">${card.rank}</div>
                    <div class="card-suit" style="color: ${faction.color}">${faction.symbol}</div>
                </div>
                <div class="card-body">
                    <div class="card-council">${card.council}</div>
                    <div class="card-promotion">${card.promotionLevel.name}</div>
                    <div class="card-stars">${'⭐'.repeat(card.promotionLevel.stars)}</div>
                </div>
            </div>
        `;
        
        return cardEl;
    }
    
    calculateRoundResult(playerCards, enemyCards) {
        const playerStrength = this.calculateHandStrength(playerCards);
        const enemyStrength = this.calculateHandStrength(enemyCards);
        
        if (playerStrength > enemyStrength) {
            return {
                winner: 'player',
                message: `You win! (${playerStrength} vs ${enemyStrength})`,
                playerStrength,
                enemyStrength
            };
        } else {
            return {
                winner: 'enemy',
                message: `Enemy wins! (${enemyStrength} vs ${playerStrength})`,
                playerStrength,
                enemyStrength
            };
        }
    }
    
    calculateHandStrength(cards) {
        let strength = 0;
        const rankCounts = {};
        const councilCounts = {};
        
        cards.forEach(card => {
            const rank = card.rank;
            const council = card.council;
            
            rankCounts[rank] = (rankCounts[rank] || 0) + 1;
            councilCounts[council] = (councilCounts[council] || 0) + 1;
            
            // Base rank value
            strength += this.getRankValue(rank);
            
            // Promotion bonus
            strength += (card.promotionLevel.stars || 0) * 5;
        });
        
        // Check for combinations
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
        else if (rankValues.filter(count => count === 2).length === 2) {
            strength += 100;
        }
        // One pair - 50 bonus
        else if (rankValues.includes(2)) {
            strength += 50;
        }
        
        return strength;
    }
    
    getRankValue(rank) {
        const rankValues = {
            '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
            'J': 11, 'Q': 12, 'K': 13, 'A': 14
        };
        return rankValues[rank] || 0;
    }
    
    prepareNextRound() {
        this.battleState.currentRound++;
        this.battleState.phase = 'dealing';
        
        // Reset hand sequence for new round
        this.battleState.handSequence = {
            currentStep: 0,
            steps: [
                { cards: 2, description: 'Opening hand' },
                { cards: 3, description: 'Mid-game reinforcement' },
                { cards: 1, description: 'Strategic card' },
                { cards: 1, description: 'Final card' }
            ],
            totalCardsDealt: 0
        };
        
        // Clear hand
        this.battleState.playerHand = [];
        this.battleState.enemyHand = [];
        
        // Clear battlefield
        document.querySelectorAll('.card-slot .battle-card').forEach(card => {
            card.remove();
        });
        
        // Clear hand UI
        this.playerHand.innerHTML = '';
        
        // Remove any continue button
        const continueBtn = document.getElementById('continueBtn');
        if (continueBtn) {
            continueBtn.remove();
        }
        
        this.addBattleLogEntry(`Round ${this.battleState.currentRound} begins!`);
        
        // Start new dealing sequence
        this.dealNextStep();
    }
    
    finishBattle() {
        this.battleState.phase = 'finished';
        this.updateBattleStatus();
        
        const winner = this.battleState.playerScore > this.battleState.enemyScore ? 'Player' : 'Enemy';
        const finalScore = `${this.battleState.playerScore} - ${this.battleState.enemyScore}`;
        
        this.addBattleLogEntry(`BATTLE COMPLETE! ${winner} wins ${finalScore}!`);
        
        // Award XP if player wins
        if (this.battleState.playerScore > this.battleState.enemyScore) {
            this.deckManager.playerProfile.xp += 500;
            this.deckManager.saveToStorage();
            this.updatePlayerProfile();
            this.addBattleLogEntry('Victory! +500 XP awarded!');
        }
        
        // Reset battle UI
        setTimeout(() => this.resetBattleUI(), 3000);
    }
    
    endRound() {
        this.addBattleLogEntry(`Round ${this.battleState.currentRound} ended!`);

        const playerCardsPlaced = document.querySelectorAll('.card-slot[data-side="player"] .battle-card').length;
        const enemyCardsPlaced = document.querySelectorAll('.card-slot[data-side="enemy"] .battle-card').length;

        this.addBattleLogEntry(`Player cards placed: ${playerCardsPlaced}`);
        this.addBattleLogEntry(`Enemy cards placed: ${enemyCardsPlaced}`);

        if (playerCardsPlaced > enemyCardsPlaced) {
            this.battleState.playerScore++;
            this.addBattleLogEntry('🏆 You win this round!');
        } else if (enemyCardsPlaced > playerCardsPlaced) {
            this.battleState.enemyScore++;
            this.addBattleLogEntry('💀 Enemy wins this round!');
        } else {
            this.addBattleLogEntry('⚔️ Round is a draw!');
        }

        this.updateBattleStatus();
        this.dealCardsBtn.disabled = true;
        this.endRoundBtn.disabled = true;

        if (this.battleState.currentRound < 3) {
            this.nextRoundBtn.disabled = false;
        } else {
            this.finishBattle();
        }
    }

    nextRound() {
        document.querySelectorAll('.card-slot .battle-card').forEach(card => card.remove());
        this.playerHand.innerHTML = '';

        this.battleState.currentRound++;
        this.battleState.playerHand = [];
        this.battleState.enemyHand = [];

        this.updateBattleStatus();
        this.addBattleLogEntry(`🎲 Round ${this.battleState.currentRound} begins!`);

        this.dealCardsBtn.disabled = false;
        this.nextRoundBtn.disabled = true;
    }

    finishBattle() {
        this.addBattleLogEntry('⚔️ BATTLE FINISHED! ⚔️');

        if (this.battleState.playerScore > this.battleState.enemyScore) {
            this.addBattleLogEntry('🎉 YOU WIN THE BATTLE!');
        } else if (this.battleState.enemyScore > this.battleState.playerScore) {
            this.addBattleLogEntry('💀 ENEMY WINS THE BATTLE!');
        } else {
            this.addBattleLogEntry('⚖️ BATTLE ENDS IN A DRAW!');
        }

        this.battleState.phase = 'finished';
        this.updateBattleStatus();
    }

    resetBattleUI() {
        this.battleState.phase = 'setup';
        this.battleState.currentRound = 0;
        this.battleState.playerScore = 0;
        this.battleState.enemyScore = 0;
        this.battleState.playerHand = [];
        this.battleState.enemyHand = [];
        this.battleState.handSequence = null;

        this.startBattleBtn.disabled = false;
        this.startBattleBtn.textContent = '⚔️ START BATTLE';
        this.battleFactionSelect.disabled = false;

        this.dealCardsBtn.disabled = true;
        this.endRoundBtn.disabled = true;
        this.nextRoundBtn.disabled = true;

        document.querySelectorAll('.card-slot .battle-card').forEach(card => card.remove());
        this.playerHand.innerHTML = '';

        const continueBtn = document.getElementById('continueBtn');
        if (continueBtn) {
            continueBtn.remove();
        }

        this.updateBattleStatus();
        this.addBattleLogEntry('Battle system reset. Ready for new battle!');
    }
    
    updateBattleStatus() {
        if (this.currentRound) {
            this.currentRound.textContent = this.battleState.currentRound || '-';
        }
        if (this.battleScore) {
            this.battleScore.textContent = `${this.battleState.playerScore} - ${this.battleState.enemyScore}`;
        }
        if (this.battlePhase) {
            this.battlePhase.textContent = this.battleState.phase.charAt(0).toUpperCase() + this.battleState.phase.slice(1);
        }
    }
    
    addBattleLogEntry(message) {
        if (!this.battleLogContent) return;
        
        const logEntry = document.createElement('div');
        logEntry.className = 'log-entry';
        
        const time = new Date().toLocaleTimeString();
        logEntry.innerHTML = `
            <span class="log-time">${time}</span>
            <span class="log-message">${message}</span>
        `;
        
        this.battleLogContent.appendChild(logEntry);
        this.battleLogContent.scrollTop = this.battleLogContent.scrollHeight;
    }
    
    getPlayerDeckCards(faction) {
        const deckStructure = this.deckManager.getDeckStructure(faction);
        const cards = [];
        
        Object.keys(deckStructure).forEach(rank => {
            Object.keys(deckStructure[rank]).forEach(council => {
                const card = deckStructure[rank][council];
                if (card) {
                    cards.push(card);
                }
            });
        });
        
        return cards;
    }
    
    drawRandomCards(deck, count) {
        const shuffled = [...deck].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, count);
    }
    
    // Management System Methods
    selectFaction(faction) {
        this.currentFaction = faction;

        if (!faction) return;

        const factionInfo = GAME_CONFIG.FACTIONS[faction];

        // Update faction display
        if (this.currentFactionTitle) {
            this.currentFactionTitle.innerHTML = `
                <span class="panel-icon">${factionInfo.symbol}</span>
                <h3>${factionInfo.name} Deck</h3>
            `;
        }

        // Toggle faction background videos
        const factionVideos = {
            HEARTS: document.getElementById('heartsBackgroundVideo'),
            DIAMONDS: document.getElementById('diamondsBackgroundVideo'),
            CLUBS: document.getElementById('clubsBackgroundVideo'),
            SPADES: document.getElementById('spadesBackgroundVideo')
        };

        const detailsPanel = document.getElementById('detailsPanel');
        const idleVideos = {
            HEARTS: detailsPanel?.querySelector('.hearts-idle'),
            DIAMONDS: detailsPanel?.querySelector('.diamonds-idle'),
            CLUBS: detailsPanel?.querySelector('.clubs-idle'),
            SPADES: detailsPanel?.querySelector('.spades-idle')
        };

        // Hide all videos first
        Object.values(factionVideos).forEach(video => {
            if (video) {
                video.classList.remove('active');
                video.classList.add('hidden');
            }
        });

        Object.values(idleVideos).forEach(video => {
            if (video) {
                video.classList.remove('active');
                video.classList.add('hidden');
            }
        });

        // Show videos for selected faction
        const bgVideo = factionVideos[faction];
        const idleVideo = idleVideos[faction];

        if (bgVideo) {
            bgVideo.classList.remove('hidden');
            bgVideo.classList.add('active');
            bgVideo.play().catch(err => console.log('Video autoplay prevented'));
        }

        if (idleVideo) {
            idleVideo.classList.remove('hidden');
            idleVideo.classList.add('active');
            idleVideo.play().catch(err => console.log('Video autoplay prevented'));
        }

        this.updateDeckDisplay();
        this.updateCollectionDisplay();
        this.updateGenerateButton();
        this.updateAnteDisplay();
        this.clearCardSelection();
    }

    updateAnteDisplay() {
        if (!this.currentFaction || !this.anteValue) return;
        const currentAnte = this.deckManager.getAnte(this.currentFaction);
        this.anteValue.textContent = currentAnte.toLocaleString();
    }

    adjustAnte(amount) {
        if (!this.currentFaction) return;

        const currentAnte = this.deckManager.getAnte(this.currentFaction);
        const newAnte = currentAnte + amount;
        const finalAnte = this.deckManager.setAnte(this.currentFaction, newAnte);

        this.updateAnteDisplay();
        this.updatePlayerProfile();
    }
    
    updateDeckDisplay() {
        if (!this.currentFaction || !this.currentDeck) return;
        
        const deckStructure = this.deckManager.getDeckStructure(this.currentFaction);
        const deckStats = this.deckManager.getDeckStats(this.currentFaction);
        const ranks = Object.keys(GAME_CONFIG.RANKS);
        
        // Update deck count
        if (this.deckCount) {
            this.deckCount.textContent = `${deckStats.totalCards}/52`;
        }
        
        // Update completion bar
        const completionFill = document.getElementById('completionFill');
        if (completionFill) {
            const percentage = (deckStats.totalCards / 52) * 100;
            completionFill.style.width = `${percentage}%`;
        }
        
        // Clear and populate deck grid
        this.currentDeck.innerHTML = '';
        
        if (deckStats.totalCards === 0) {
            this.currentDeck.innerHTML = `
                <div class="empty-deck">
                    <div class="empty-icon">🎴</div>
                    <h4>Empty Deck</h4>
                    <p>Add cards from your collection to build this deck</p>
                </div>
            `;
            return;
        }
        
        // Display cards in rank rows with council columns
        ranks.forEach(rank => {
            const rankGroup = document.createElement('div');
            rankGroup.className = 'rank-row';
            
            const rankLabel = document.createElement('div');
            rankLabel.className = 'rank-label';
            rankLabel.textContent = rank;
            rankGroup.appendChild(rankLabel);
            
            const councilSlots = document.createElement('div');
            councilSlots.className = 'council-slots';
            
            Object.keys(GAME_CONFIG.COUNCILS).forEach(council => {
                const card = deckStructure[rank][council];
                if (card) {
                    const cardElement = this.createCardElement(card.getDisplayInfo(), 'deck');
                    councilSlots.appendChild(cardElement);
                } else {
                    const emptySlot = this.createEmptySlot(rank, council);
                    councilSlots.appendChild(emptySlot);
                }
            });
            
            rankGroup.appendChild(councilSlots);
            this.currentDeck.appendChild(rankGroup);
        });
    }
    
    updateCollectionDisplay() {
        if (!this.currentFaction || !this.cardCollection) return;
        
        const collection = this.deckManager.getCollection(this.currentFaction);
        const sortedCollection = this.sortCollection(collection);
        
        this.cardCollection.innerHTML = '';
        
        if (sortedCollection.length === 0) {
            this.cardCollection.innerHTML = `
                <div class="empty-collection">
                    <div class="empty-icon">📦</div>
                    <h4>No Cards in Collection</h4>
                    <p>Generate cards or buy packs to start building your collection</p>
                </div>
            `;
            return;
        }
        
        sortedCollection.forEach(card => {
            const cardElement = this.createCardElement(card, 'collection');
            this.cardCollection.appendChild(cardElement);
        });
    }
    
    createCardElement(card, location) {
        const cardEl = document.createElement('div');
        cardEl.className = `card-item ${this.currentFaction.toLowerCase()} ${location}`;
        cardEl.dataset.cardId = card.id;
        
        const faction = GAME_CONFIG.FACTIONS[this.currentFaction];
        
        cardEl.innerHTML = `
            <div class="card-header">
                <span class="card-rank">${card.rank}</span>
                <span class="card-suit" style="color: ${faction.color}">${faction.symbol}</span>
            </div>
            <div class="card-body">
                <div class="card-council">${card.council}</div>
                <div class="card-promotion">${card.promotionLevel}</div>
                <div class="card-stars">${'⭐'.repeat(card.stars || 0)}</div>
            </div>
        `;
        
        cardEl.addEventListener('click', () => this.selectCard(card));
        
        return cardEl;
    }
    
    createEmptySlot(rank, council) {
        const slotEl = document.createElement('div');
        slotEl.className = `card-item empty-slot ${this.currentFaction.toLowerCase()}`;
        
        const faction = GAME_CONFIG.FACTIONS[this.currentFaction];
        
        slotEl.innerHTML = `
            <div class="card-header">
                <span class="card-rank">${rank}</span>
                <span class="card-suit" style="color: ${faction.color}">${faction.symbol}</span>
            </div>
            <div class="card-body">
                <div class="card-council">${council}</div>
                <div class="empty-label">Empty</div>
            </div>
        `;
        
        return slotEl;
    }
    
    selectCard(card) {
        this.selectedCard = card;
        this.showCardDetails(card);
        
        // Update card actions visibility
        if (this.cardActions) {
            this.cardActions.style.display = 'flex';
        }
        
        // Update button states
        const isInDeck = this.isCardInDeck(card.id);
        
        if (this.moveToDeckBtn) {
            this.moveToDeckBtn.style.display = isInDeck ? 'none' : 'flex';
        }
        if (this.moveToCollectionBtn) {
            this.moveToCollectionBtn.style.display = isInDeck ? 'flex' : 'none';
        }
        if (this.promoteCardBtn) {
            this.promoteCardBtn.style.display = card.canPromote ? 'flex' : 'none';
        }
    }
    
    showCardDetails(card) {
        if (!this.selectedCardStats) return;

        const faction = GAME_CONFIG.FACTIONS[this.currentFaction];

        this.selectedCardStats.innerHTML = `
            <div class="card-detail-view">
                <div class="flip-card-container">
                    <div class="flip-card" id="flipCard">
                        <div class="flip-card-inner">
                            <div class="flip-card-front">
                                <div class="detail-card-display" style="background: linear-gradient(135deg, ${faction.color}22, ${faction.color}44); border: 2px solid ${faction.color};">
                                    <div class="detail-card-header">
                                        <span class="detail-rank">${card.rank}</span>
                                        <span class="detail-symbol" style="color: ${faction.color}">${faction.symbol}</span>
                                    </div>
                                    <div class="detail-card-center">
                                        <div class="detail-large-symbol" style="color: ${faction.color}">${faction.symbol}</div>
                                        <div class="detail-faction-name">${card.faction}</div>
                                        <div class="detail-council-badge">${card.council}</div>
                                    </div>
                                    <div class="detail-card-footer">
                                        <span class="detail-symbol" style="color: ${faction.color}">${faction.symbol}</span>
                                        <span class="detail-rank">${card.rank}</span>
                                    </div>
                                    <div class="detail-card-stars">${'⭐'.repeat(card.stars || 0)}</div>
                                </div>
                            </div>
                            <div class="flip-card-back">
                                <div class="detail-card-display card-back-design">
                                    <div class="card-back-pattern"></div>
                                    <div class="card-back-logo">Deck Realms</div>
                                    <div class="card-back-decorative"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <button class="flip-card-btn" id="flipCardBtn">
                        <span class="flip-icon">🔄</span>
                        Flip Card
                    </button>
                </div>

                <div class="card-stats-grid">
                    <div class="stat-item">
                        <span class="stat-label">Promotion</span>
                        <span class="stat-value">${card.promotionLevel}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Stars</span>
                        <span class="stat-value">${card.stars || 0} ⭐</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Battles Won</span>
                        <span class="stat-value">${card.battlesWon || 0}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Experience</span>
                        <span class="stat-value">${card.xp || 0} XP</span>
                    </div>
                </div>
                ${card.canPromote ? '<div class="promote-indicator">🚀 Ready to Promote!</div>' : ''}
            </div>
        `;

        const flipCardBtn = document.getElementById('flipCardBtn');
        const flipCard = document.getElementById('flipCard');

        if (flipCardBtn && flipCard) {
            flipCardBtn.addEventListener('click', () => {
                flipCard.classList.toggle('flipped');
            });
        }
    }
    
    clearCardSelection() {
        this.selectedCard = null;
        
        if (this.selectedCardStats) {
            this.selectedCardStats.innerHTML = `
                <div class="no-selection">
                    <div class="selection-icon">🎯</div>
                    <h4>Select a Card</h4>
                    <p>Click on any card to view detailed information</p>
                </div>
            `;
        }
        
        if (this.cardActions) {
            this.cardActions.style.display = 'none';
        }
    }
    
    isCardInDeck(cardId) {
        const deckStructure = this.deckManager.getDeckStructure(this.currentFaction);
        
        for (const rank of Object.keys(deckStructure)) {
            for (const council of Object.keys(deckStructure[rank])) {
                const card = deckStructure[rank][council];
                if (card && card.id === cardId) {
                    return true;
                }
            }
        }
        
        return false;
    }
    
    moveSelectedCardToDeck() {
        if (!this.selectedCard) return;
        
        try {
            this.deckManager.addCardToDeck(this.currentFaction, this.selectedCard.id);
            this.updateDeckDisplay();
            this.updateCollectionDisplay();
            this.updateAllFactionCounters();
            this.clearCardSelection();
            this.showMessage('Card added to deck!', 'success');
        } catch (error) {
            this.showMessage(error.message, 'error');
        }
    }
    
    moveSelectedCardToCollection() {
        if (!this.selectedCard) return;
        
        try {
            this.deckManager.removeCardFromDeck(this.currentFaction, this.selectedCard.id);
            this.updateDeckDisplay();
            this.updateCollectionDisplay();
            this.updateAllFactionCounters();
            this.clearCardSelection();
            this.showMessage('Card removed from deck!', 'success');
        } catch (error) {
            this.showMessage(error.message, 'error');
        }
    }
    
    promoteSelectedCard() {
        if (!this.selectedCard) return;
        
        try {
            const success = this.deckManager.promoteCard(this.selectedCard.id);
            if (success) {
                this.updateDeckDisplay();
                this.updateCollectionDisplay();
                this.showCardDetails(this.deckManager.getCard(this.selectedCard.id).getDisplayInfo());
                this.showMessage('Card promoted!', 'success');
            }
        } catch (error) {
            this.showMessage(error.message, 'error');
        }
    }
    
    generateCards() {
        if (!this.currentFaction) return;
        
        try {
            const cards = this.deckManager.generateCards(this.currentFaction, 20);
            this.updateCollectionDisplay();
            this.updateAllFactionCounters();
            this.updateGenerateButton();
            this.showMessage(`Generated ${cards.length} new cards!`, 'success');
        } catch (error) {
            this.showMessage(error.message, 'error');
        }
    }
    
    updateGenerateButton() {
        if (!this.currentFaction || !this.generateCardsBtn) return;
        
        const canGenerate = this.deckManager.canGenerateCards(this.currentFaction);
        this.generateCardsBtn.disabled = !canGenerate;
        
        if (canGenerate) {
            this.generateCardsBtn.innerHTML = '<span class="btn-icon">✨</span>Generate';
            this.generateCardsBtn.style.opacity = '1';
        } else {
            this.generateCardsBtn.innerHTML = '<span class="btn-icon">✓</span>Generated';
            this.generateCardsBtn.style.opacity = '0.5';
        }
    }
    
    sortCollection(collection) {
        const sortBy = this.sortFilter?.value || 'rank';
        
        return [...collection].sort((a, b) => {
            switch (sortBy) {
                case 'rank':
                    return Object.keys(GAME_CONFIG.RANKS).indexOf(a.rank) - Object.keys(GAME_CONFIG.RANKS).indexOf(b.rank);
                case 'council':
                    return a.council.localeCompare(b.council);
                case 'promotion':
                    return (b.stars || 0) - (a.stars || 0);
                case 'xp':
                    return (b.xp || 0) - (a.xp || 0);
                default:
                    return 0;
            }
        });
    }
    
    updateAllFactionCounters() {
        FACTION_NAMES.forEach(faction => {
            const stats = this.deckManager.getDeckStats(faction);
            const counter = this.factionCounters[faction];
            
            if (counter) {
                counter.textContent = `${stats.totalCards}/52`;
            }
        });
    }
    
    updateQuickStats() {
        this.updateAllFactionCounters();
    }
    
    updatePlayerProfile() {
        const profile = this.deckManager.getPlayerProfile();

        const bankrollEl = document.querySelector('.bankroll');
        const xpEl = document.querySelector('.xp');
        const avgAnteEl = document.getElementById('avgAnteDisplay');

        if (bankrollEl) {
            bankrollEl.textContent = `💰 ${profile.bankroll.toLocaleString()}`;
        }
        if (xpEl) {
            xpEl.textContent = `⭐ ${profile.xp.toLocaleString()} XP`;
        }
        if (avgAnteEl) {
            const avgAnte = this.deckManager.getAverageAnte();
            avgAnteEl.textContent = `🎲 Avg Ante: ${avgAnte.toLocaleString()}`;
        }
    }
    
    // Shop Methods
    showShop() {
        this.shopModal?.classList.remove('hidden');
        this.updatePlayerProfile();
    }
    
    hideShop() {
        this.shopModal?.classList.add('hidden');
    }
    
    buyPack() {
        try {
            const result = this.deckManager.buyCardPack(true);
            this.updateCollectionDisplay();
            this.updateAllFactionCounters();
            this.updatePlayerProfile();
            this.hideShop();

            const factionCounts = {};
            result.cards.forEach(card => {
                const factionName = GAME_CONFIG.FACTIONS[card.faction].name;
                factionCounts[factionName] = (factionCounts[factionName] || 0) + 1;
            });

            const factionBreakdown = Object.entries(factionCounts)
                .map(([faction, count]) => `${count} ${faction}`)
                .join(', ');

            this.showMessage(`Pack opened! Got ${result.cards.length} cards: ${factionBreakdown}`, 'success');
        } catch (error) {
            this.showMessage(error.message, 'error');
        }
    }

    confirmReset() {
        if (confirm('⚠️ WARNING: This will delete ALL your decks, cards, and progress!\n\nAre you absolutely sure you want to reset everything?')) {
            this.deckManager.resetData();
            this.updateDeckDisplay();
            this.updateCollectionDisplay();
            this.updateAllFactionCounters();
            this.updatePlayerProfile();
            this.showMessage('All data has been reset!', 'info');
            location.reload();
        }
    }
    
    showMessage(message, type = 'info') {
        const messageEl = document.createElement('div');
        messageEl.className = `message ${type}`;
        messageEl.textContent = message;
        
        Object.assign(messageEl.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '15px 20px',
            borderRadius: '10px',
            color: 'white',
            fontWeight: '600',
            zIndex: '9999',
            transform: 'translateX(100%)',
            transition: 'transform 0.3s ease'
        });
        
        if (type === 'success') {
            messageEl.style.background = 'linear-gradient(45deg, #4ecdc4, #45b7d1)';
        } else if (type === 'error') {
            messageEl.style.background = 'linear-gradient(45deg, #ff6b6b, #ff4757)';
        } else {
            messageEl.style.background = 'linear-gradient(45deg, #ffa726, #ff9f43)';
        }
        
        document.body.appendChild(messageEl);
        
        setTimeout(() => {
            messageEl.style.transform = 'translateX(0)';
        }, 100);
        
        setTimeout(() => {
            messageEl.style.transform = 'translateX(100%)';
            setTimeout(() => {
                document.body.removeChild(messageEl);
            }, 300);
        }, 3000);
    }
}