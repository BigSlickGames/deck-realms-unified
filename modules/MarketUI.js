import { MarketSystem } from "./MarketSystem.js";
import { GAME_CONFIG, CARD_RANKS } from "./gameConstants.js";

export class MarketUI {
  constructor(deckManager) {
    this.deckManager = deckManager;
    this.marketSystem = new MarketSystem();
    this.currentView = "browse";
    this.selectedListing = null;
    this.isInitialized = false;
  }

  async initialize() {
    const success = await this.marketSystem.initialize();
    this.isInitialized = success;
    return success;
  }

  render() {
    if (!this.isInitialized) {
      return `
        <div class="market-login-prompt">
          <p>⚠️ Market requires authentication</p>
          <p class="market-login-hint">Please sign in to access the trading market</p>
        </div>
      `;
    }

    return `
      <div class="market-container">
        <div class="market-tabs">
          <button class="market-tab ${
            this.currentView === "browse" ? "active" : ""
          }" data-view="browse">
            Browse Listings
          </button>
          <button class="market-tab ${
            this.currentView === "myListings" ? "active" : ""
          }" data-view="myListings">
            My Listings
          </button>
          <button class="market-tab ${
            this.currentView === "myOffers" ? "active" : ""
          }" data-view="myOffers">
            My Offers
          </button>
          <button class="market-tab ${
            this.currentView === "create" ? "active" : ""
          }" data-view="create">
            + Create Listing
          </button>
        </div>
        <div class="market-content">
          ${this.renderCurrentView()}
        </div>
      </div>
    `;
  }

  renderCurrentView() {
    switch (this.currentView) {
      case "browse":
        return '<div id="market-browse-view" class="market-view">Loading...</div>';
      case "myListings":
        return '<div id="market-my-listings-view" class="market-view">Loading...</div>';
      case "myOffers":
        return '<div id="market-my-offers-view" class="market-view">Loading...</div>';
      case "create":
        return this.renderCreateListingForm();
      default:
        return "<div>Unknown view</div>";
    }
  }

  renderCreateListingForm() {
    const userCards = this.deckManager.getPlayerCards();

    return `
      <div class="market-create-form">
        <h3>Create New Listing</h3>

        <div class="form-group">
          <label>Card to Trade</label>
          <select id="market-card-select" class="market-input">
            <option value="">Select a card...</option>
            ${userCards
              .map(
                (card) =>
                  `<option value="${card.suit}:${card.rank}">${this.formatCard(
                    card.suit,
                    card.rank
                  )}</option>`
              )
              .join("")}
          </select>
        </div>

        <div class="form-group">
          <label>Looking For (Optional)</label>
          <div class="market-wanted-grid">
            <select id="market-wanted-suit" class="market-input">
              <option value="">Any Suit</option>
              ${Object.keys(GAME_CONFIG.FACTIONS)
                .map(
                  (suit) =>
                    `<option value="${suit.toLowerCase()}">${suit}</option>`
                )
                .join("")}
            </select>
            <select id="market-wanted-rank" class="market-input">
              <option value="">Any Rank</option>
              ${CARD_RANKS.map(
                (rank) => `<option value="${rank}">${rank}</option>`
              ).join("")}
            </select>
          </div>
        </div>

        <div class="form-group">
          <label>Description</label>
          <textarea id="market-description" class="market-input market-textarea" placeholder="Add details about your trade..."></textarea>
        </div>

        <button id="market-create-btn" class="market-btn market-btn-primary">Create Listing</button>
      </div>
    `;
  }

  formatCard(suit, rank) {
    const faction = GAME_CONFIG.FACTIONS[suit.toUpperCase()];
    return `${faction.symbol} ${rank} of ${faction.name}`;
  }

  async loadBrowseView() {
    const container = document.getElementById("market-browse-view");
    if (!container) return;

    const { success, data, error } =
      await this.marketSystem.getActiveListings();

    if (!success) {
      container.innerHTML = `<div class="market-error">Failed to load listings: ${error?.message}</div>`;
      return;
    }

    if (data.length === 0) {
      container.innerHTML =
        '<div class="market-empty">No active listings yet. Be the first to post!</div>';
      return;
    }

    container.innerHTML = `
      <div class="market-listings-grid">
        ${data.map((listing) => this.renderListingCard(listing)).join("")}
      </div>
    `;

    data.forEach((listing) => {
      const btn = document.getElementById(`market-listing-${listing.id}`);
      if (btn) {
        btn.addEventListener("click", () => this.showListingDetail(listing));
      }
    });
  }

  renderListingCard(listing) {
    const offeredCard = this.formatCard(listing.card_suit, listing.card_rank);
    const wantedCard =
      listing.wanted_suit && listing.wanted_rank
        ? this.formatCard(listing.wanted_suit, listing.wanted_rank)
        : "Any card";

    return `
      <div class="market-listing-card">
        <div class="market-listing-header">
          <span class="market-seller">@${listing.seller.username}</span>
        </div>
        <div class="market-listing-body">
          <div class="market-card-display">
            <strong>Offering:</strong> ${offeredCard}
          </div>
          <div class="market-arrow">⇄</div>
          <div class="market-card-display">
            <strong>Wants:</strong> ${wantedCard}
          </div>
        </div>
        ${
          listing.description
            ? `<div class="market-listing-desc">${listing.description}</div>`
            : ""
        }
        <button id="market-listing-${
          listing.id
        }" class="market-btn market-btn-secondary">Make Offer</button>
      </div>
    `;
  }

  async showListingDetail(listing) {
    this.selectedListing = listing;

    const modal = document.createElement("div");
    modal.className = "market-modal-overlay";
    modal.innerHTML = `
      <div class="market-modal">
        <div class="market-modal-header">
          <h3>Make an Offer</h3>
          <button class="market-modal-close">&times;</button>
        </div>
        <div class="market-modal-body">
          <div class="market-listing-detail">
            <p><strong>Seller:</strong> @${listing.seller.username}</p>
            <p><strong>Offering:</strong> ${this.formatCard(
              listing.card_suit,
              listing.card_rank
            )}</p>
            <p><strong>Wants:</strong> ${
              listing.wanted_suit && listing.wanted_rank
                ? this.formatCard(listing.wanted_suit, listing.wanted_rank)
                : "Any card"
            }</p>
            ${
              listing.description
                ? `<p><strong>Details:</strong> ${listing.description}</p>`
                : ""
            }
          </div>

          <div class="form-group">
            <label>Your Offer</label>
            <select id="market-offer-card-select" class="market-input">
              <option value="">Select a card to offer...</option>
              ${this.deckManager
                .getPlayerCards()
                .map(
                  (card) =>
                    `<option value="${card.suit}:${
                      card.rank
                    }">${this.formatCard(card.suit, card.rank)}</option>`
                )
                .join("")}
            </select>
          </div>

          <div class="form-group">
            <label>Message (Optional)</label>
            <textarea id="market-offer-message" class="market-input market-textarea" placeholder="Add a message to your offer..."></textarea>
          </div>

          <button id="market-submit-offer-btn" class="market-btn market-btn-primary">Submit Offer</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    modal.querySelector(".market-modal-close").addEventListener("click", () => {
      document.body.removeChild(modal);
    });

    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal);
      }
    });

    document
      .getElementById("market-submit-offer-btn")
      .addEventListener("click", async () => {
        const cardSelect = document.getElementById("market-offer-card-select");
        const message = document.getElementById("market-offer-message").value;

        if (!cardSelect.value) {
          alert("Please select a card to offer");
          return;
        }

        const [suit, rank] = cardSelect.value.split(":");
        const { success, error } = await this.marketSystem.makeOffer(
          listing.id,
          suit,
          rank,
          message
        );

        if (success) {
          alert("Offer submitted successfully!");
          document.body.removeChild(modal);
        } else {
          alert(`Failed to submit offer: ${error?.message}`);
        }
      });
  }

  async loadMyListingsView() {
    const container = document.getElementById("market-my-listings-view");
    if (!container) return;

    const { success, data, error } = await this.marketSystem.getMyListings();

    if (!success) {
      container.innerHTML = `<div class="market-error">Failed to load listings: ${error?.message}</div>`;
      return;
    }

    if (data.length === 0) {
      container.innerHTML =
        '<div class="market-empty">You have no listings yet.</div>';
      return;
    }

    container.innerHTML = `
      <div class="market-listings-list">
        ${data.map((listing) => this.renderMyListing(listing)).join("")}
      </div>
    `;

    data.forEach((listing) => {
      const viewBtn = document.getElementById(`view-offers-${listing.id}`);
      const cancelBtn = document.getElementById(`cancel-listing-${listing.id}`);

      if (viewBtn) {
        viewBtn.addEventListener("click", () =>
          this.showListingOffers(listing)
        );
      }

      if (cancelBtn) {
        cancelBtn.addEventListener("click", async () => {
          if (confirm("Cancel this listing?")) {
            await this.marketSystem.cancelListing(listing.id);
            this.loadMyListingsView();
          }
        });
      }
    });
  }

  renderMyListing(listing) {
    return `
      <div class="market-my-listing">
        <div class="market-listing-info">
          <strong>${this.formatCard(
            listing.card_suit,
            listing.card_rank
          )}</strong>
          <span class="market-status-${listing.status}">${listing.status}</span>
        </div>
        <div class="market-listing-wanted">
          Wants: ${
            listing.wanted_suit && listing.wanted_rank
              ? this.formatCard(listing.wanted_suit, listing.wanted_rank)
              : "Any card"
          }
        </div>
        ${
          listing.status === "active"
            ? `
          <div class="market-listing-actions">
            <button id="view-offers-${listing.id}" class="market-btn market-btn-small">View Offers</button>
            <button id="cancel-listing-${listing.id}" class="market-btn market-btn-small market-btn-danger">Cancel</button>
          </div>
        `
            : ""
        }
      </div>
    `;
  }

  async showListingOffers(listing) {
    const { success, data, error } =
      await this.marketSystem.getOffersForListing(listing.id);

    if (!success) {
      alert(`Failed to load offers: ${error?.message}`);
      return;
    }

    const modal = document.createElement("div");
    modal.className = "market-modal-overlay";
    modal.innerHTML = `
      <div class="market-modal market-modal-wide">
        <div class="market-modal-header">
          <h3>Offers for ${this.formatCard(
            listing.card_suit,
            listing.card_rank
          )}</h3>
          <button class="market-modal-close">&times;</button>
        </div>
        <div class="market-modal-body">
          ${
            data.length === 0
              ? '<div class="market-empty">No offers yet.</div>'
              : `<div class="market-offers-list">${data
                  .map((offer) => this.renderOffer(offer, listing))
                  .join("")}</div>`
          }
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    modal.querySelector(".market-modal-close").addEventListener("click", () => {
      document.body.removeChild(modal);
    });

    data.forEach((offer) => {
      const acceptBtn = document.getElementById(`accept-offer-${offer.id}`);
      const rejectBtn = document.getElementById(`reject-offer-${offer.id}`);
      const counterBtn = document.getElementById(`counter-offer-${offer.id}`);

      if (acceptBtn) {
        acceptBtn.addEventListener("click", async () => {
          if (confirm("Accept this offer and complete the trade?")) {
            const result = await this.marketSystem.acceptOffer(offer.id);
            if (result.success) {
              alert("Trade completed!");
              document.body.removeChild(modal);
              this.loadMyListingsView();
            }
          }
        });
      }

      if (rejectBtn) {
        rejectBtn.addEventListener("click", async () => {
          await this.marketSystem.rejectOffer(offer.id);
          document.body.removeChild(modal);
          this.showListingOffers(listing);
        });
      }

      if (counterBtn) {
        counterBtn.addEventListener("click", () => {
          this.showCounterOfferForm(offer, listing, modal);
        });
      }
    });
  }

  renderOffer(offer, listing) {
    return `
      <div class="market-offer-card">
        <div class="market-offer-header">
          <strong>@${offer.buyer.username}</strong>
          <span class="market-status-${offer.status}">${offer.status}</span>
        </div>
        <div class="market-offer-body">
          <p><strong>Offers:</strong> ${this.formatCard(
            offer.offered_suit,
            offer.offered_rank
          )}</p>
          ${
            offer.message
              ? `<p class="market-offer-message">"${offer.message}"</p>`
              : ""
          }
        </div>
        ${
          offer.status === "pending"
            ? `
          <div class="market-offer-actions">
            <button id="accept-offer-${offer.id}" class="market-btn market-btn-small market-btn-success">Accept</button>
            <button id="counter-offer-${offer.id}" class="market-btn market-btn-small">Counter</button>
            <button id="reject-offer-${offer.id}" class="market-btn market-btn-small market-btn-danger">Reject</button>
          </div>
        `
            : ""
        }
      </div>
    `;
  }

  showCounterOfferForm(offer, listing, parentModal) {
    const counterModal = document.createElement("div");
    counterModal.className = "market-modal-overlay";
    counterModal.innerHTML = `
      <div class="market-modal">
        <div class="market-modal-header">
          <h3>Counter Offer</h3>
          <button class="market-modal-close">&times;</button>
        </div>
        <div class="market-modal-body">
          <p>Original offer: ${this.formatCard(
            offer.offered_suit,
            offer.offered_rank
          )}</p>

          <div class="form-group">
            <label>Request Different Card</label>
            <select id="counter-card-select" class="market-input">
              <option value="">Select a card...</option>
              ${this.deckManager
                .getPlayerCards()
                .map(
                  (card) =>
                    `<option value="${card.suit}:${
                      card.rank
                    }">${this.formatCard(card.suit, card.rank)}</option>`
                )
                .join("")}
            </select>
          </div>

          <div class="form-group">
            <label>Message</label>
            <textarea id="counter-message" class="market-input market-textarea" placeholder="Explain your counter offer..."></textarea>
          </div>

          <button id="submit-counter-btn" class="market-btn market-btn-primary">Submit Counter Offer</button>
        </div>
      </div>
    `;

    document.body.appendChild(counterModal);

    counterModal
      .querySelector(".market-modal-close")
      .addEventListener("click", () => {
        document.body.removeChild(counterModal);
      });

    document
      .getElementById("submit-counter-btn")
      .addEventListener("click", async () => {
        const cardSelect = document.getElementById("counter-card-select");
        const message = document.getElementById("counter-message").value;

        if (!cardSelect.value) {
          alert("Please select a card");
          return;
        }

        const [suit, rank] = cardSelect.value.split(":");
        const result = await this.marketSystem.createCounterOffer(
          offer.id,
          suit,
          rank,
          message
        );

        if (result.success) {
          alert("Counter offer sent!");
          document.body.removeChild(counterModal);
          document.body.removeChild(parentModal);
        } else {
          alert(`Failed: ${result.error?.message}`);
        }
      });
  }

  async loadMyOffersView() {
    const container = document.getElementById("market-my-offers-view");
    if (!container) return;

    const { success, data, error } = await this.marketSystem.getMyOffers();

    if (!success) {
      container.innerHTML = `<div class="market-error">Failed to load offers: ${error?.message}</div>`;
      return;
    }

    if (data.length === 0) {
      container.innerHTML =
        '<div class="market-empty">You have no offers yet.</div>';
      return;
    }

    container.innerHTML = `
      <div class="market-offers-list">
        ${data.map((offer) => this.renderMyOffer(offer)).join("")}
      </div>
    `;

    for (const offer of data) {
      const checkCounterBtn = document.getElementById(
        `check-counter-${offer.id}`
      );
      if (checkCounterBtn && offer.status === "countered") {
        checkCounterBtn.addEventListener("click", async () => {
          const { success, data: counter } =
            await this.marketSystem.getCounterOffer(offer.id);
          if (success && counter) {
            this.showCounterOfferResponse(counter, offer);
          }
        });
      }
    }
  }

  renderMyOffer(offer) {
    return `
      <div class="market-my-offer">
        <div class="market-offer-header">
          <span class="market-status-${offer.status}">${offer.status}</span>
        </div>
        <div class="market-offer-info">
          <p><strong>You offered:</strong> ${this.formatCard(
            offer.offered_suit,
            offer.offered_rank
          )}</p>
          <p><strong>For:</strong> ${this.formatCard(
            offer.listing.card_suit,
            offer.listing.card_rank
          )}</p>
          ${
            offer.message
              ? `<p class="market-offer-message">"${offer.message}"</p>`
              : ""
          }
        </div>
        ${
          offer.status === "countered"
            ? `
          <button id="check-counter-${offer.id}" class="market-btn market-btn-small">View Counter Offer</button>
        `
            : ""
        }
      </div>
    `;
  }

  showCounterOfferResponse(counter, originalOffer) {
    const modal = document.createElement("div");
    modal.className = "market-modal-overlay";
    modal.innerHTML = `
      <div class="market-modal">
        <div class="market-modal-header">
          <h3>Counter Offer Received</h3>
          <button class="market-modal-close">&times;</button>
        </div>
        <div class="market-modal-body">
          <p><strong>Your original offer:</strong> ${this.formatCard(
            originalOffer.offered_suit,
            originalOffer.offered_rank
          )}</p>
          <p><strong>They want instead:</strong> ${this.formatCard(
            counter.counter_suit,
            counter.counter_rank
          )}</p>
          ${
            counter.message
              ? `<p class="market-counter-message">"${counter.message}"</p>`
              : ""
          }

          <div class="market-counter-actions">
            <button id="accept-counter-btn" class="market-btn market-btn-success">Accept Counter</button>
            <button id="reject-counter-btn" class="market-btn market-btn-danger">Reject</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    modal.querySelector(".market-modal-close").addEventListener("click", () => {
      document.body.removeChild(modal);
    });

    document
      .getElementById("accept-counter-btn")
      .addEventListener("click", async () => {
        const result = await this.marketSystem.acceptCounterOffer(counter.id);
        if (result.success) {
          alert("Trade completed!");
          document.body.removeChild(modal);
          this.loadMyOffersView();
        }
      });

    document
      .getElementById("reject-counter-btn")
      .addEventListener("click", async () => {
        await this.marketSystem.rejectCounterOffer(counter.id);
        document.body.removeChild(modal);
        this.loadMyOffersView();
      });
  }

  attachEventListeners() {
    const tabs = document.querySelectorAll(".market-tab");
    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        this.currentView = tab.dataset.view;
        this.refreshView();
      });
    });

    if (this.currentView === "create") {
      const createBtn = document.getElementById("market-create-btn");
      if (createBtn) {
        createBtn.addEventListener("click", async () => {
          const cardSelect = document.getElementById("market-card-select");
          const wantedSuit =
            document.getElementById("market-wanted-suit").value;
          const wantedRank =
            document.getElementById("market-wanted-rank").value;
          const description =
            document.getElementById("market-description").value;

          if (!cardSelect.value) {
            alert("Please select a card to trade");
            return;
          }

          const [suit, rank] = cardSelect.value.split(":");
          const { success, error } = await this.marketSystem.createListing(
            suit,
            rank,
            wantedSuit,
            wantedRank,
            description
          );

          if (success) {
            alert("Listing created successfully!");
            this.currentView = "myListings";
            this.refreshView();
          } else {
            alert(`Failed to create listing: ${error?.message}`);
          }
        });
      }
    }
  }

  refreshView() {
    const container = document.querySelector(
      '.console-window-content[data-window="4"]'
    );
    if (container) {
      container.innerHTML = this.render();
      this.attachEventListeners();

      if (this.currentView === "browse") {
        this.loadBrowseView();
      } else if (this.currentView === "myListings") {
        this.loadMyListingsView();
      } else if (this.currentView === "myOffers") {
        this.loadMyOffersView();
      }
    }
  }
}
