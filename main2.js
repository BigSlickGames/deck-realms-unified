import { MapManager } from './modules/MapManager.js';
import { ARManager } from './modules/ARManager.js';
import { CardGenerator } from './modules/CardGenerator.js';

let mapManager = null;
let arManager = null;
let cardGenerator = null;

window.initMap = function() {
    console.log('✅ Google Maps API loaded');

    if (mapManager) {
        mapManager.initializeMap();
    }
};

document.addEventListener('DOMContentLoaded', async () => {
    console.log('🌐 Deck Realms - Explore Mode Initialized');

    cardGenerator = new CardGenerator();
    mapManager = new MapManager(cardGenerator);
    arManager = new ARManager(mapManager);

    if (window.google && window.google.maps) {
        mapManager.initializeMap();
    } else {
        console.log('⏳ Waiting for Google Maps API to load...');
    }

    window.mapManager = mapManager;
    window.arManager = arManager;
    window.cardGenerator = cardGenerator;

    const cardCount = await cardGenerator.getCardCount();
    console.log(`📊 Total cards in database: ${cardCount}`);
    updateCardStats();

    if (cardCount === 0) {
        console.log('🎴 No cards found. Generating 10,000 cards...');

        const centerLat = 40.7128;
        const centerLng = -74.0060;
        const radiusKm = 50;

        try {
            await cardGenerator.generateAndSaveCards(10000, centerLat, centerLng, radiusKm);
            console.log('✅ Card generation complete!');
            await updateCardStats();

            if (mapManager && mapManager.userLocation) {
                await mapManager.loadNearbyCards();
            }
        } catch (error) {
            console.error('❌ Error generating cards:', error);
        }
    }

    setupDatabaseControls();

    const backBtn = document.getElementById('backBtn');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            window.location.href = 'index1.html';
        });
    }

    console.log('✅ Initialization complete');
});

async function updateCardStats() {
    if (!cardGenerator) return;

    const totalCards = await cardGenerator.getCardCount();
    document.getElementById('totalCards').textContent = totalCards.toLocaleString();
}

function setupDatabaseControls() {
    const generateCardsBtn = document.getElementById('generateCardsBtn');
    const clearCardsBtn = document.getElementById('clearCardsBtn');
    const loadNearbyBtn = document.getElementById('loadNearbyBtn');

    generateCardsBtn?.addEventListener('click', async () => {
        if (!confirm('Generate 10,000 new cards? This may take a moment.')) return;

        generateCardsBtn.disabled = true;
        generateCardsBtn.textContent = '⏳ Generating...';

        try {
            const centerLat = mapManager?.userLocation?.lat || 40.7128;
            const centerLng = mapManager?.userLocation?.lng || -74.0060;

            await cardGenerator.generateAndSaveCards(10000, centerLat, centerLng, 50);
            await updateCardStats();

            if (mapManager) {
                await mapManager.loadNearbyCards();
            }

            alert('✅ Successfully generated 10,000 cards!');
        } catch (error) {
            console.error('❌ Error:', error);
            alert('❌ Error generating cards. Check console for details.');
        } finally {
            generateCardsBtn.disabled = false;
            generateCardsBtn.textContent = '✨ Generate 10K Cards';
        }
    });

    clearCardsBtn?.addEventListener('click', async () => {
        if (!confirm('Clear ALL cards from database? This cannot be undone!')) return;

        clearCardsBtn.disabled = true;
        clearCardsBtn.textContent = '⏳ Clearing...';

        try {
            await cardGenerator.clearAllCards();
            await updateCardStats();

            if (mapManager) {
                mapManager.clearCardMarkers();
            }

            alert('✅ All cards cleared!');
        } catch (error) {
            console.error('❌ Error:', error);
            alert('❌ Error clearing cards. Check console for details.');
        } finally {
            clearCardsBtn.disabled = false;
            clearCardsBtn.textContent = '🗑️ Clear All Cards';
        }
    });

    loadNearbyBtn?.addEventListener('click', async () => {
        if (!mapManager) return;

        loadNearbyBtn.disabled = true;
        loadNearbyBtn.textContent = '⏳ Loading...';

        try {
            await mapManager.loadNearbyCards();
            const nearbyCount = mapManager.cardMarkers.length;
            document.getElementById('nearbyCards').textContent = nearbyCount;
            alert(`✅ Loaded ${nearbyCount} nearby cards!`);
        } catch (error) {
            console.error('❌ Error:', error);
            alert('❌ Error loading cards. Check console for details.');
        } finally {
            loadNearbyBtn.disabled = false;
            loadNearbyBtn.textContent = '🔄 Reload Nearby';
        }
    });
}