export class CoinFlip {
    constructor() {
        this.modal = document.getElementById('coinFlipModal');
        this.spinningCoin = document.getElementById('spinningCoin');
        this.coinChoices = document.getElementById('coinFlipChoices');
        this.resultSection = document.getElementById('coinFlipResult');
        this.resultMessage = document.getElementById('resultMessage');
        this.turnChoices = document.getElementById('turnChoices');

        this.playerChoice = null;
        this.flipResult = null;
        this.resolveCallback = null;

        this.setupEventListeners();
    }

    setupEventListeners() {
        const choiceButtons = document.querySelectorAll('.coin-choice-btn');
        choiceButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const choice = e.currentTarget.dataset.choice;
                this.makeChoice(choice);
            });
        });

        const turnButtons = document.querySelectorAll('.turn-choice-btn');
        turnButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const turn = e.currentTarget.dataset.turn;
                this.selectTurn(turn);
            });
        });
    }

    show() {
        return new Promise((resolve) => {
            this.resolveCallback = resolve;
            this.modal.classList.remove('hidden');
            this.resetModal();
            this.startInitialSpin();
        });
    }

    hide() {
        this.modal.classList.add('hidden');
    }

    resetModal() {
        this.coinChoices.style.display = 'flex';
        this.resultSection.classList.add('hidden');
        this.turnChoices.classList.add('hidden');
        this.resultMessage.className = 'result-message';
        this.playerChoice = null;
        this.flipResult = null;
    }

    startInitialSpin() {
        this.spinningCoin.classList.remove('slowing-down');
        this.spinningCoin.classList.add('spinning');
    }

    makeChoice(choice) {
        this.playerChoice = choice;

        this.coinChoices.style.display = 'none';

        this.flipResult = Math.random() < 0.5 ? 'spade' : 'heart';

        this.performFlip();
    }

    performFlip() {
        this.spinningCoin.classList.remove('spinning');

        const rotations = 1800;
        const finalRotation = this.flipResult === 'spade' ? rotations : rotations + 180;

        this.spinningCoin.style.animation = 'none';

        setTimeout(() => {
            this.spinningCoin.style.transform = `rotateY(${finalRotation}deg)`;
            this.spinningCoin.style.transition = 'transform 2s cubic-bezier(0.25, 0.1, 0.25, 1)';
        }, 50);

        setTimeout(() => {
            this.showResult();
        }, 2100);
    }

    showResult() {
        const didWin = this.playerChoice === this.flipResult;

        this.resultSection.classList.remove('hidden');

        if (didWin) {
            this.resultMessage.textContent = `It's ${this.flipResult === 'spade' ? '♠ Spades' : '♥ Hearts'}! You won the flip!`;
            this.resultMessage.classList.add('win');

            setTimeout(() => {
                this.turnChoices.classList.remove('hidden');
            }, 500);
        } else {
            this.resultMessage.textContent = `It's ${this.flipResult === 'spade' ? '♠ Spades' : '♥ Hearts'}! You lost the flip.`;
            this.resultMessage.classList.add('lose');

            setTimeout(() => {
                this.resultMessage.textContent += '\n\nOpponent chooses to go first.';

                setTimeout(() => {
                    this.hide();
                    if (this.resolveCallback) {
                        this.resolveCallback({
                            playerWon: false,
                            playerGoesFirst: false
                        });
                    }
                }, 2000);
            }, 1500);
        }
    }

    selectTurn(turn) {
        const playerGoesFirst = turn === 'player';

        this.hide();
        if (this.resolveCallback) {
            this.resolveCallback({
                playerWon: true,
                playerGoesFirst
            });
        }
    }
}
