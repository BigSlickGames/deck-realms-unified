import { BattleSystem } from "../deck-realms-battle-system/modules/BattleSystem.js";
import { RowHandEvaluator } from "../deck-realms-battle-system/modules/RowHandEvaluator.js";
import { applyLayoutConfig } from "../deck-realms-battle-system/modules/LayoutConfig.js";

document.addEventListener("DOMContentLoaded", () => {
  applyLayoutConfig();
  console.log("Battle System Initialized");

  const battleSystem = new BattleSystem();
  window.battleSystem = battleSystem;

  const summonFactionBtn = document.getElementById("summonFactionBtn");
  const slotMachine = document.getElementById("slotMachine");
  const startBattleBtn = document.getElementById("startBattleBtn");

  const factionData = {
    HEARTS: { symbol: "♥", color: "#ef4444", deckColor: "#dc2626" },
    DIAMONDS: { symbol: "♦", color: "#3b82f6", deckColor: "#60a5fa" },
    CLUBS: { symbol: "♣", color: "#8b5cf6", deckColor: "#a78bfa" },
    SPADES: { symbol: "♠", color: "#f97316", deckColor: "#fb923c" },
  };

  const slotOrder = ["HEARTS", "DIAMONDS", "CLUBS", "SPADES"];

  summonFactionBtn.addEventListener("click", () => {
    const playerDeckDisplay = document.querySelector(".player-deck");
    const deckStack = playerDeckDisplay.querySelector(".deck-stack");
    const deckCards = deckStack.querySelectorAll(".deck-card");

    summonFactionBtn.style.display = "none";
    deckStack.classList.remove("hidden");

    let flickCount = 0;
    const totalFlicks = 12;
    const selectedFaction =
      slotOrder[Math.floor(Math.random() * slotOrder.length)];

    const flickInterval = setInterval(() => {
      const currentFaction = slotOrder[flickCount % 4];
      const currentColor = factionData[currentFaction].deckColor;

      deckCards.forEach((card) => {
        card.style.background = `linear-gradient(145deg, ${currentColor}, ${currentColor}dd)`;
        card.style.borderColor = currentColor;
      });

      flickCount++;

      if (flickCount >= totalFlicks) {
        clearInterval(flickInterval);

        const finalColor = factionData[selectedFaction].deckColor;
        deckCards.forEach((card) => {
          card.style.background = `linear-gradient(145deg, ${finalColor}, ${finalColor}dd)`;
          card.style.borderColor = finalColor;
        });

        setTimeout(() => {
          const result = battleSystem.setPlayerFaction(selectedFaction);
          displayPlayerDeck(
            result.faction,
            factionData[selectedFaction].symbol
          );
          startBattleBtn.disabled = false;
          console.log(`Faction summoned: ${result.faction.name}`);
        }, 300);
      }
    }, 120);
  });

  function displayPlayerDeck(faction, symbol) {
    const playerDeckDisplay = document.querySelector(".player-deck");
    playerDeckDisplay.innerHTML = "";

    const deckStack = document.createElement("div");
    deckStack.className = "deck-stack";

    for (let i = 0; i < 52; i++) {
      const card = document.createElement("div");
      card.className = "deck-card";
      card.style.transform = `translate(${i * 0.15}px, ${i * 0.15}px)`;
      card.style.zIndex = i;
      card.style.background = `linear-gradient(135deg, ${faction.color}, ${adjustColor(faction.color, -20)})`;
      card.style.borderColor = faction.color;

      if (i === 51) {
        const iconEl = document.createElement("div");
        iconEl.className = "deck-top-icon";
        iconEl.textContent = symbol;
        iconEl.style.color = faction.color;
        card.appendChild(iconEl);
      }

      deckStack.appendChild(card);
    }

    playerDeckDisplay.appendChild(deckStack);
  }

  function clearPlayerDeck() {
    const playerDeckDisplay = document.querySelector(
      ".player-deck .deck-stack"
    );
    playerDeckDisplay.innerHTML = `
            <div class="deck-card"></div>
            <div class="deck-card"></div>
            <div class="deck-card"></div>
        `;
  }

  function adjustColor(color, amount) {
    const num = parseInt(color.replace("#", ""), 16);
    const r = Math.max(0, Math.min(255, (num >> 16) + amount));
    const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00ff) + amount));
    const b = Math.max(0, Math.min(255, (num & 0x0000ff) + amount));
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
  }

  function showHandTransition(handNumber) {
    const overlay = document.createElement("div");
    overlay.className = "hand-transition-overlay";
    overlay.innerHTML = `
            <div class="hand-transition-content">
                <h2 class="hand-transition-title">Hand ${handNumber}</h2>
                <p class="hand-transition-subtitle">New Hand Beginning</p>
            </div>
        `;
    document.body.appendChild(overlay);

    setTimeout(() => {
      overlay.classList.add("fade-out");
      setTimeout(() => {
        overlay.remove();
      }, 500);
    }, 2000);
  }

  startBattleBtn.addEventListener("click", () => {
    const enemyInfo = battleSystem.generateEnemyDeck();
    console.log(
      `Enemy faction: ${enemyInfo.faction.name}, Deck: ${enemyInfo.deckSize} cards`
    );

    // Show coin flip modal
    showCoinFlipModal();
  });

  function showCoinFlipModal() {
    const modal = document.getElementById("coinFlipModal");
    const spinningCoin = document.getElementById("spinningCoin");
    const choices = document.getElementById("coinFlipChoices");
    const resultDiv = document.getElementById("coinFlipResult");
    const resultMessage = document.getElementById("resultMessage");
    const turnChoices = document.getElementById("turnChoices");

    modal.classList.remove("hidden");
    choices.classList.remove("hidden");
    resultDiv.classList.add("hidden");
    turnChoices.classList.add("hidden");

    // Start spinning animation
    spinningCoin.classList.add("spinning");

    // Handle player choice
    const choiceButtons = choices.querySelectorAll(".coin-choice-btn");
    choiceButtons.forEach((btn) => {
      btn.onclick = () => handleCoinChoice(btn.dataset.choice);
    });
  }

  function handleCoinChoice(playerChoice) {
    const spinningCoin = document.getElementById("spinningCoin");
    const choices = document.getElementById("coinFlipChoices");
    const resultDiv = document.getElementById("coinFlipResult");
    const resultMessage = document.getElementById("resultMessage");
    const turnChoices = document.getElementById("turnChoices");

    // Hide choices
    choices.classList.add("hidden");

    // Spin faster for dramatic effect
    spinningCoin.classList.add("spinning-fast");

    // Randomly determine result
    const result = Math.random() < 0.5 ? "spade" : "heart";
    const won = result === playerChoice;

    // Stop spinning after delay and show result
    setTimeout(() => {
      spinningCoin.classList.remove("spinning", "spinning-fast");

      // Show final result
      if (result === "spade") {
        spinningCoin.classList.add("show-spade");
      } else {
        spinningCoin.classList.add("show-heart");
      }

      // Show result message
      resultDiv.classList.remove("hidden");

      if (won) {
        resultMessage.innerHTML = `
                    <div class="result-icon win">🎉</div>
                    <div class="result-text win">You Won!</div>
                    <div class="result-subtext">It landed on ${result === "spade" ? "♠ Spades" : "♥ Hearts"}</div>
                `;

        // Show turn choice buttons
        setTimeout(() => {
          turnChoices.classList.remove("hidden");

          const turnButtons = turnChoices.querySelectorAll(".turn-choice-btn");
          turnButtons.forEach((btn) => {
            btn.onclick = () => handleTurnChoice(btn.dataset.turn);
          });
        }, 500);
      } else {
        resultMessage.innerHTML = `
                    <div class="result-icon lose">😔</div>
                    <div class="result-text lose">You Lost!</div>
                    <div class="result-subtext">It landed on ${result === "spade" ? "♠ Spades" : "♥ Hearts"}</div>
                    <div class="result-info">Opponent goes first</div>
                `;

        // Auto-close and start battle with enemy going first
        setTimeout(() => {
          closeCoinFlipModal();
          startBattle("enemy");
        }, 2500);
      }
    }, 2000);
  }

  function handleTurnChoice(turn) {
    closeCoinFlipModal();
    startBattle(turn);
  }

  function closeCoinFlipModal() {
    const modal = document.getElementById("coinFlipModal");
    const spinningCoin = document.getElementById("spinningCoin");

    modal.classList.add("hidden");
    spinningCoin.classList.remove(
      "show-spade",
      "show-heart",
      "spinning",
      "spinning-fast"
    );
  }

  function startBattle(firstTurn) {
    console.log(
      `Battle starting! ${firstTurn === "player" ? "Player" : "Opponent"} goes first`
    );

    // Store first turn in battle system
    battleSystem.gameState.currentTurn = firstTurn;
    battleSystem.gameState.phase = "battle";

    // Start first round
    const roundInfo = battleSystem.nextRound();
    updateBattleUI();

    // Automatically start the round sequence
    startRoundSequence();
  }

  function updateBattleUI() {
    const state = battleSystem.gameState;

    // Update round info
    const currentRoundEl = document.getElementById("currentRound");
    if (currentRoundEl) {
      currentRoundEl.textContent = `${state.currentRound}/${state.totalRounds}`;
    }

    // Update cards to place display
    const cardsToPlaceEl = document.getElementById("cardsToPlace");
    if (cardsToPlaceEl) {
      const cardsInHand = state.playerHand.length;
      cardsToPlaceEl.textContent = cardsInHand > 0 ? cardsInHand : "-";
    }

    // Update HP display
    const battleScore = document.getElementById("battleScore");
    if (battleScore) {
      battleScore.textContent = `${state.playerHP} - ${state.enemyHP}`;
    }

    // Update center HP displays
    const playerHPCenter = document.getElementById("playerHPCenter");
    const enemyHPCenter = document.getElementById("enemyHPCenter");
    const roundNumberCenter = document.getElementById("roundNumberCenter");

    if (playerHPCenter) playerHPCenter.textContent = state.playerHP;
    if (enemyHPCenter) enemyHPCenter.textContent = state.enemyHP;
    if (roundNumberCenter)
      roundNumberCenter.textContent = state.currentRound || "-";

    // Update phase
    const battlePhase = document.getElementById("battlePhase");
    if (battlePhase) {
      battlePhase.textContent =
        state.phase.charAt(0).toUpperCase() + state.phase.slice(1);
    }

    // Update battle log
    updateBattleLog();

    // Update stats panels
    updateStatsDisplay();

    // Update board display
    updateBoardDisplay();

    // Setup drop zones for drag and drop
    setupDropZones();
  }

  function updateStatsDisplay() {
    const state = battleSystem.gameState;

    updatePlayerStats(state.playerStats);
    updateEnemyStats(state.enemyStats);
  }

  function updatePlayerStats(stats) {
    document.getElementById("playerBestHand").textContent =
      stats.bestHand || "-";
    document.getElementById("playerDamageDealt").textContent =
      stats.damageDealt;
    document.getElementById("playerDamageTaken").textContent =
      stats.damageTaken;
    document.getElementById("playerCardsDestroyed").textContent =
      stats.cardsDestroyed;

    const handsFormedEl = document.getElementById("playerHandsFormed");
    if (Object.keys(stats.handsFormed).length === 0) {
      handsFormedEl.innerHTML =
        '<div class="stat-item-small">No hands yet</div>';
    } else {
      handsFormedEl.innerHTML = Object.entries(stats.handsFormed)
        .sort((a, b) => b[1] - a[1])
        .map(
          ([hand, count]) => `
                    <div class="stat-item-small">
                        <span>${hand}</span>
                        <span style="font-weight: 600;">${count}</span>
                    </div>
                `
        )
        .join("");
    }
  }

  function updateEnemyStats(stats) {
    document.getElementById("enemyBestHand").textContent =
      stats.bestHand || "-";
    document.getElementById("enemyDamageDealt").textContent = stats.damageDealt;
    document.getElementById("enemyDamageTaken").textContent = stats.damageTaken;
    document.getElementById("enemyCardsDestroyed").textContent =
      stats.cardsDestroyed;

    const handsFormedEl = document.getElementById("enemyHandsFormed");
    if (Object.keys(stats.handsFormed).length === 0) {
      handsFormedEl.innerHTML =
        '<div class="stat-item-small">No hands yet</div>';
    } else {
      handsFormedEl.innerHTML = Object.entries(stats.handsFormed)
        .sort((a, b) => b[1] - a[1])
        .map(
          ([hand, count]) => `
                    <div class="stat-item-small">
                        <span>${hand}</span>
                        <span style="font-weight: 600;">${count}</span>
                    </div>
                `
        )
        .join("");
    }
  }

  function updateBattleLog() {
    const logContent = document.getElementById("battleLogContent");
    if (!logContent) return;

    const state = battleSystem.gameState;
    const lastLogs = state.battleLog.slice(-10).reverse();

    logContent.innerHTML = lastLogs
      .map(
        (log) => `
            <div class="log-entry">
                <span class="log-time">${log.timestamp}</span>
                <span class="log-message">${log.message}</span>
            </div>
        `
      )
      .join("");
  }

  function updateBoardDisplay() {
    // Update player rows
    updateRowDisplay("player", "front");
    updateRowDisplay("player", "mid");
    updateRowDisplay("player", "back");

    // Update enemy rows
    updateRowDisplay("enemy", "front");
    updateRowDisplay("enemy", "mid");
    updateRowDisplay("enemy", "back");

    // Update player hand
    updateHandDisplay();
  }

  function updateRowDisplay(side, row) {
    const state = battleSystem.gameState;
    const cards =
      side === "player" ? state.playerRows[row] : state.enemyRows[row];
    const slots = document.querySelectorAll(
      `.card-slot[data-side="${side}"][data-row="${row}"]`
    );

    slots.forEach((slot) => {
      const slotIndex = slot.dataset.slot;
      slot.innerHTML = "";
      if (cards[slotIndex]) {
        const card = cards[slotIndex];
        const cardEl = createCardElement(card);
        slot.appendChild(cardEl);
      }
    });
  }

  function updateHandDisplay() {
    const handCards = document.getElementById("handCards");
    if (!handCards) return;

    const state = battleSystem.gameState;
    handCards.innerHTML = "";

    state.playerHand.forEach((card, index) => {
      const cardEl = createCardElement(card);
      cardEl.classList.add("hand-card");
      cardEl.dataset.cardIndex = index;
      cardEl.addEventListener("click", () => selectCardForPlacement(index));
      setupDragAndDrop(cardEl, index);
      handCards.appendChild(cardEl);
    });
  }

  function createCardElement(card) {
    const cardEl = document.createElement("div");
    cardEl.className = "battle-card";
    cardEl.innerHTML = `
            <div class="card-inner">
                <div class="card-front">
                    <div class="card-rank">${card.rank}</div>
                    <div class="card-suit">${card.suit}</div>
                </div>
            </div>
        `;
    return cardEl;
  }

  let selectedCardIndex = null;
  let draggedCardIndex = null;

  function selectCardForPlacement(cardIndex) {
    selectedCardIndex = cardIndex;

    // Highlight selected card
    const handCards = document.querySelectorAll(".hand-card");
    handCards.forEach((card, i) => {
      card.classList.toggle("selected", i === cardIndex);
    });

    // Enable clicking on empty player slots
    const playerSlots = document.querySelectorAll(
      '.card-slot[data-side="player"]'
    );
    playerSlots.forEach((slot) => {
      const isEmpty = !slot.querySelector(".battle-card");
      if (isEmpty) {
        slot.classList.add("can-place");
        slot.onclick = () => placeSelectedCard(slot);
      }
    });
  }

  function placeSelectedCard(slot) {
    if (selectedCardIndex === null) return;

    const row = slot.dataset.row;
    const slotIndex = parseInt(slot.dataset.slot);
    const result = battleSystem.placeCard(
      "player",
      selectedCardIndex,
      row,
      slotIndex
    );

    if (result.success) {
      selectedCardIndex = null;

      // Remove highlighting
      document
        .querySelectorAll(".hand-card")
        .forEach((card) => card.classList.remove("selected"));
      document.querySelectorAll(".card-slot").forEach((s) => {
        s.classList.remove("can-place");
        s.onclick = null;
      });

      updateBattleUI();

      // Check if player has finished placing all their cards
      const state = battleSystem.gameState;
      if (state.playerHand.length === 0) {
        // Player is done, now enemy places their cards
        setTimeout(() => {
          placeEnemyCards();
        }, 500);
      }
    } else {
      console.error("Failed to place card:", result.error);
    }
  }

  function setupDragAndDrop(cardEl, cardIndex) {
    cardEl.draggable = true;

    cardEl.addEventListener("dragstart", (e) => {
      draggedCardIndex = cardIndex;
      cardEl.classList.add("dragging");
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/html", cardEl.innerHTML);
    });

    cardEl.addEventListener("dragend", (e) => {
      cardEl.classList.remove("dragging");
    });
  }

  function setupDropZones() {
    const playerSlots = document.querySelectorAll(
      '.card-slot[data-side="player"]'
    );

    playerSlots.forEach((slot) => {
      // Remove old listeners by cloning and replacing
      const newSlot = slot.cloneNode(true);
      slot.parentNode.replaceChild(newSlot, slot);

      // Only enable drop on empty slots
      const isEmpty = !newSlot.querySelector(".battle-card");

      if (!isEmpty) return;

      newSlot.addEventListener("dragover", handleDragOver);
      newSlot.addEventListener("dragleave", handleDragLeave);
      newSlot.addEventListener("drop", handleDrop);
    });
  }

  function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    e.currentTarget.classList.add("drag-over");
  }

  function handleDragLeave(e) {
    e.currentTarget.classList.remove("drag-over");
  }

  function handleDrop(e) {
    e.preventDefault();
    const slot = e.currentTarget;
    slot.classList.remove("drag-over");

    if (draggedCardIndex === null) return;

    const row = slot.dataset.row;
    const slotIndex = parseInt(slot.dataset.slot);
    const result = battleSystem.placeCard(
      "player",
      draggedCardIndex,
      row,
      slotIndex
    );

    if (result.success) {
      draggedCardIndex = null;
      selectedCardIndex = null;

      // Remove highlighting
      document
        .querySelectorAll(".hand-card")
        .forEach((card) => card.classList.remove("selected"));
      document.querySelectorAll(".card-slot").forEach((s) => {
        s.classList.remove("can-place");
        s.onclick = null;
      });

      updateBattleUI();

      // Check if player has finished placing all their cards
      const state = battleSystem.gameState;
      if (state.playerHand.length === 0) {
        // Player is done, now enemy places their cards
        setTimeout(() => {
          placeEnemyCards();
        }, 500);
      }
    }
  }

  function placeEnemyCards() {
    const state = battleSystem.gameState;

    while (state.enemyHand.length > 0) {
      // Simple AI: place in random available slot
      const availableRows = ["front", "mid", "back"].filter(
        (row) => Object.keys(state.enemyRows[row]).length < 10
      );

      if (availableRows.length === 0) break;

      const randomRow =
        availableRows[Math.floor(Math.random() * availableRows.length)];
      battleSystem.placeCard("enemy", 0, randomRow);
    }

    updateBattleUI();

    // Check if round is complete - if so, auto-end round after delay
    if (state.playerHand.length === 0 && state.enemyHand.length === 0) {
      setTimeout(() => {
        endCurrentRound();
      }, 1500);
    }
  }

  function startRoundSequence() {
    const state = battleSystem.gameState;

    // Deal cards immediately
    const result = battleSystem.drawCards(state.currentRound);
    updateBattleUI();
    console.log(`Dealt ${result.playerCards.length} cards to each player`);
  }

  function displayHandStamps() {
    const state = battleSystem.gameState;

    ["player", "enemy"].forEach((side) => {
      ["front", "mid", "back"].forEach((row) => {
        const rowElement = document.querySelector(
          `.battle-row[data-side="${side}"][data-row="${row}"]`
        );
        const stampElement = rowElement?.querySelector(".hand-stamp");

        if (!stampElement) return;

        const rowCards = state[`${side}Rows`][row];
        if (Object.keys(rowCards).length === 0) {
          stampElement.classList.remove("active");
          stampElement.textContent = "";
          return;
        }

        const evaluation = RowHandEvaluator.evaluateRowByGroups(rowCards, row);
        const handType = evaluation.handType;

        const handClass = handType.toLowerCase().replace(/ /g, "-");
        stampElement.className = `hand-stamp ${handClass} active`;
        stampElement.textContent = handType.toUpperCase();
      });
    });
  }

  function endCurrentRound() {
    const combatResults = battleSystem.resolveCombat();
    updateBattleUI();
    displayHandStamps();
    console.log("Combat resolved:", combatResults);

    // Check if game is over due to HP reaching 0
    const state = battleSystem.gameState;
    if (state.playerHP <= 0 || state.enemyHP <= 0) {
      setTimeout(() => {
        showGameEndModal(state.playerHP > 0);
      }, 2000);
      return;
    }

    // Wait a moment to show combat results, then proceed to next round
    setTimeout(() => {
      proceedToNextRound();
    }, 2000);
  }

  function proceedToNextRound() {
    const state = battleSystem.gameState;

    const roundInfo = battleSystem.nextRound();

    // If nextRound returns a winner object (game ended after 12 rounds), show it
    if (roundInfo.winner) {
      alert(
        `Game Over! Winner: ${roundInfo.winner}. Reason: ${roundInfo.reason}`
      );
      return;
    }

    // Show hand transition message if new hand
    if (roundInfo.isNewHand) {
      showHandTransition(roundInfo.hand);
      // Wait for transition to finish before starting next round
      setTimeout(() => {
        updateBattleUI();
        startRoundSequence();
      }, 2500);
    } else {
      updateBattleUI();
      startRoundSequence();
    }

    console.log("Next round:", roundInfo);
  }

  function showGameEndModal(playerWon) {
    const modal = document.getElementById("gameEndModal");
    const icon = document.getElementById("gameEndIcon");
    const title = document.getElementById("gameEndTitle");

    if (playerWon) {
      icon.textContent = "🎉";
      title.textContent = "Congratulations! You won!";
      title.className = "game-end-title victory";
    } else {
      icon.textContent = "😔";
      title.textContent = "Oh No! You didn't win this time.";
      title.className = "game-end-title defeat";
    }

    modal.classList.remove("hidden");
  }

  const playAgainBtn = document.getElementById("playAgainBtn");
  const exitGameBtn = document.getElementById("exitGameBtn");

  playAgainBtn.addEventListener("click", () => {
    location.reload();
  });

  exitGameBtn.addEventListener("click", () => {
    const modal = document.getElementById("gameEndModal");
    modal.classList.add("hidden");
  });
});
