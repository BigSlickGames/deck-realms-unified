import { DeckManager } from "./modules/DeckManager.js";
import { DeckUI } from "./modules/DeckUI.js";
import { MarketUI } from "./modules/MarketUI.js";

document.addEventListener("DOMContentLoaded", async () => {
  console.log("🎮 Deck Realms - Card Manager Initialized");

  const deckManager = new DeckManager();
  const deckUI = new DeckUI(deckManager);
  const marketUI = new MarketUI(deckManager);

  window.deckManager = deckManager;
  window.deckUI = deckUI;
  window.marketUI = marketUI;

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

  console.log("✅ Initialization complete");
});
