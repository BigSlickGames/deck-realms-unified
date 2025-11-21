import { DeckManager } from "./modules/DeckManager.js";
import { DeckUI } from "./modules/DeckUI.js";
import { MarketUI } from "./modules/MarketUI.js";
import { PackOpening } from "./modules/PackOpening.js";

document.addEventListener("DOMContentLoaded", async () => {
  console.log("🎮 Deck Realms - Card Manager Initialized");

  const deckManager = new DeckManager();
  const deckUI = new DeckUI(deckManager);
  const marketUI = new MarketUI(deckManager);
  const packOpening = new PackOpening(deckManager);

  window.deckManager = deckManager;
  window.deckUI = deckUI;
  window.marketUI = marketUI;
  window.packOpening = packOpening;

  const gameInterface = document.getElementById("gameInterface");
  gameInterface.classList.remove("hidden");
  gameInterface.style.display = "block";

  deckUI.switchToSystem("manage");
  deckUI.selectFaction("HEARTS");

  await marketUI.initialize();
  const marketWindow = document.getElementById("marketWindow");
  if (marketWindow) {
    marketWindow.innerHTML = marketUI.render();
    marketUI.attachEventListeners();
    if (marketUI.isInitialized && marketUI.currentView === "browse") {
      marketUI.loadBrowseView();
    }
  }

  const consoleBuySingleBtn = document.getElementById("consoleBuySingleBtn");
  const consoleBuy5Btn = document.getElementById("consoleBuy5Btn");
  const consoleBuy10Btn = document.getElementById("consoleBuy10Btn");

  if (consoleBuySingleBtn) {
    consoleBuySingleBtn.addEventListener("click", () => {
      const result = packOpening.buyCards(1);
      if (!result.success) {
        alert(result.message);
      }
      deckUI.updatePlayerProfile();
      deckUI.updateCollectionDisplay();
    });
  }

  if (consoleBuy5Btn) {
    consoleBuy5Btn.addEventListener("click", () => {
      const result = packOpening.buyCards(5);
      if (!result.success) {
        alert(result.message);
      }
      deckUI.updatePlayerProfile();
      deckUI.updateCollectionDisplay();
    });
  }

  if (consoleBuy10Btn) {
    consoleBuy10Btn.addEventListener("click", () => {
      const result = packOpening.buyCards(10);
      if (!result.success) {
        alert(result.message);
      }
      deckUI.updatePlayerProfile();
      deckUI.updateCollectionDisplay();
    });
  }

  console.log("✅ Initialization complete");
});
