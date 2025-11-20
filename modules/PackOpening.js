import { GAME_CONFIG } from './gameConstants.js';
import { Card } from './Card.js';

export class PackOpening {
    constructor(deckManager) {
        this.deckManager = deckManager;
        this.currentPackCards = [];

        this.packOpeningModal = document.getElementById('packOpeningModal');
        this.cardPack = document.getElementById('cardPack');
        this.cardRevealGrid = document.getElementById('cardRevealGrid');
        this.packDoneBtn = document.getElementById('packDoneBtn');

        this.bindEvents();
    }

    bindEvents() {
        this.cardPack?.addEventListener('click', () => this.ripOpenPack());
        this.packDoneBtn?.addEventListener('click', () => this.closePackOpening());
    }

    buyCards(count) {
        const cost = count * 1000;
        const profile = this.deckManager.getPlayerProfile();

        if (profile.bankroll < cost) {
            return { success: false, message: `Insufficient chips! Need ${cost.toLocaleString()} chips.` };
        }

        this.deckManager.playerProfile.bankroll -= cost;
        this.deckManager.saveToStorage();

        const cards = [];
        const councils = Object.keys(GAME_CONFIG.COUNCILS);
        const factions = Object.keys(GAME_CONFIG.FACTIONS);

        for (let i = 0; i < count; i++) {
            const randomFaction = factions[Math.floor(Math.random() * factions.length)];
            const council = councils[Math.floor(Math.random() * councils.length)];
            const rank = this.deckManager.generateWeightedRank();

            const card = new Card(randomFaction, rank, council);
            cards.push(card);
        }

        cards.forEach(card => {
            this.deckManager.cardCollection[card.faction].push(card);
        });

        this.deckManager.saveToStorage();
        this.currentPackCards = cards;
        this.showPackOpeningModal();

        return { success: true, cards };
    }

    showPackOpeningModal() {
        this.packOpeningModal?.classList.remove('hidden');
        this.cardPack?.classList.remove('opening');
        this.cardRevealGrid?.classList.add('hidden');
        this.packDoneBtn?.classList.add('hidden');
        this.cardRevealGrid.innerHTML = '';
        this.cardPack.style.display = 'block';
    }

    ripOpenPack() {
        this.cardPack?.classList.add('opening');

        setTimeout(() => {
            this.cardPack.style.display = 'none';
            this.revealCards();
        }, 1100);
    }

    revealCards() {
        this.cardRevealGrid?.classList.remove('hidden');
        this.packDoneBtn?.classList.remove('hidden');

        this.currentPackCards.forEach((card, index) => {
            setTimeout(() => {
                const cardEl = document.createElement('div');
                cardEl.className = 'revealed-card';

                const factionInfo = GAME_CONFIG.FACTIONS[card.faction];

                cardEl.innerHTML = `
                    <div class="revealed-flip-card">
                        <div class="revealed-flip-inner">
                            <div class="revealed-flip-front">
                                <div class="revealed-card-display" style="background: linear-gradient(135deg, ${factionInfo.color}22, ${factionInfo.color}44); border: 2px solid ${factionInfo.color};">
                                    <div class="revealed-card-header">
                                        <span class="revealed-rank">${card.rank}</span>
                                        <span class="revealed-symbol" style="color: ${factionInfo.color}">${factionInfo.symbol}</span>
                                    </div>
                                    <div class="revealed-card-center">
                                        <div class="revealed-large-symbol" style="color: ${factionInfo.color}">${factionInfo.symbol}</div>
                                        <div class="revealed-faction-name">${factionInfo.name}</div>
                                        <div class="revealed-council-badge">${card.council}</div>
                                    </div>
                                    <div class="revealed-card-footer">
                                        <span class="revealed-symbol" style="color: ${factionInfo.color}">${factionInfo.symbol}</span>
                                        <span class="revealed-rank">${card.rank}</span>
                                    </div>
                                </div>
                            </div>
                            <div class="revealed-flip-back">
                                <div class="revealed-card-display card-back-design">
                                    <div class="card-back-pattern"></div>
                                    <div class="card-back-logo">Deck Realms</div>
                                </div>
                            </div>
                        </div>
                    </div>
                `;

                this.cardRevealGrid.appendChild(cardEl);

                cardEl.querySelector('.revealed-flip-card').addEventListener('click', (e) => {
                    e.currentTarget.classList.toggle('flipped');
                });
            }, index * 300);
        });
    }

    closePackOpening() {
        this.packOpeningModal?.classList.add('hidden');
        this.cardPack.style.display = 'block';

        const cardCount = this.currentPackCards.length;
        this.currentPackCards = [];

        return cardCount;
    }
}
