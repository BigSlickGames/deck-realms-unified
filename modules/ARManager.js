export class ARManager {
    constructor(mapManager) {
        this.mapManager = mapManager;
        this.stream = null;
        this.arActive = false;
        this.scanningActive = false;
        this.spawnedCards = [];

        this.initializeElements();
        this.bindEvents();
    }

    initializeElements() {
        this.arVideo = document.getElementById('arVideo');
        this.mapView = document.getElementById('mapView');
        this.arView = document.getElementById('arView');
        this.mapViewBtn = document.getElementById('mapViewBtn');
        this.arViewBtn = document.getElementById('arViewBtn');
        this.enableArBtn = document.getElementById('enableArBtn');
        this.scanQrBtn = document.getElementById('scanQrBtn');
        this.testSpawnBtn = document.getElementById('testSpawnBtn');
        this.setCenterBtn = document.getElementById('setCenterBtn');
        this.arStatus = document.getElementById('arStatus');
        this.nearestSpire = document.getElementById('nearestSpire');
        this.spireDistance = document.getElementById('spireDistance');
        this.spawnCenter = null;
    }

    bindEvents() {
        this.mapViewBtn?.addEventListener('click', () => this.switchView('map'));
        this.arViewBtn?.addEventListener('click', () => this.switchView('ar'));
        this.enableArBtn?.addEventListener('click', () => this.toggleAR());
        this.scanQrBtn?.addEventListener('click', () => this.startQRScanning());
        this.testSpawnBtn?.addEventListener('click', () => this.testSpawnCard());
        this.setCenterBtn?.addEventListener('click', () => this.setCenterLocation());
    }

    switchView(view) {
        if (view === 'map') {
            this.mapView.classList.add('active');
            this.arView.classList.remove('active');
            this.mapViewBtn.classList.add('active');
            this.arViewBtn.classList.remove('active');

            if (this.arActive) {
                this.stopARCamera();
            }
        } else if (view === 'ar') {
            this.mapView.classList.remove('active');
            this.arView.classList.add('active');
            this.mapViewBtn.classList.remove('active');
            this.arViewBtn.classList.add('active');

            if (!this.arActive) {
                this.showARPrompt();
            }
        }
    }

    showARPrompt() {
        const scanText = document.querySelector('.scan-text');
        if (scanText) {
            scanText.textContent = 'Click "Enable AR Mode" to start';
        }
    }

    async toggleAR() {
        if (this.arActive) {
            this.stopARCamera();
        } else {
            await this.startARCamera();
        }
    }

    async startARCamera() {
        try {
            const constraints = {
                video: {
                    facingMode: 'environment',
                    width: { ideal: 1920 },
                    height: { ideal: 1080 }
                }
            };

            this.stream = await navigator.mediaDevices.getUserMedia(constraints);

            if (this.arVideo) {
                this.arVideo.srcObject = this.stream;
                await this.arVideo.play();
            }

            this.arActive = true;
            this.updateARStatus('Active');
            this.enableArBtn.textContent = '⏸️ Disable AR Mode';
            this.enableArBtn.classList.add('active');
            this.scanQrBtn.disabled = false;

            this.startDistanceTracking();

            console.log('✅ AR Camera started successfully');
        } catch (error) {
            console.error('Error starting AR camera:', error);
            this.updateARStatus('Error');
            this.showCameraError(error);
        }
    }

    stopARCamera() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }

        if (this.arVideo) {
            this.arVideo.srcObject = null;
        }

        this.arActive = false;
        this.scanningActive = false;
        this.updateARStatus('Offline');
        this.enableArBtn.textContent = '🚀 Enable AR Mode';
        this.enableArBtn.classList.remove('active');
        this.scanQrBtn.disabled = true;

        if (this.distanceInterval) {
            clearInterval(this.distanceInterval);
        }

        console.log('⏸️ AR Camera stopped');
    }

    showCameraError(error) {
        let message = 'Unable to access camera. ';

        if (error.name === 'NotAllowedError') {
            message += 'Please grant camera permission and try again.';
        } else if (error.name === 'NotFoundError') {
            message += 'No camera found on this device.';
        } else if (error.name === 'NotReadableError') {
            message += 'Camera is being used by another application.';
        } else {
            message += 'Please check your camera settings.';
        }

        const scanText = document.querySelector('.scan-text');
        if (scanText) {
            scanText.textContent = message;
            scanText.style.color = '#ef4444';
        }

        setTimeout(() => {
            if (scanText) {
                scanText.textContent = 'Point camera at QR code';
                scanText.style.color = '';
            }
        }, 5000);
    }

    updateARStatus(status) {
        if (this.arStatus) {
            this.arStatus.textContent = status;

            if (status === 'Active') {
                this.arStatus.style.color = '#10b981';
            } else if (status === 'Offline') {
                this.arStatus.style.color = '#6b7280';
            } else if (status === 'Error') {
                this.arStatus.style.color = '#ef4444';
            }
        }
    }

    startDistanceTracking() {
        this.updateNearestSpire();
        this.checkNearbyCards();

        this.distanceInterval = setInterval(() => {
            this.updateNearestSpire();
            this.checkNearbyCards();
        }, 2000);
    }

    updateNearestSpire() {
        if (!this.mapManager || !this.mapManager.userLocation || !this.mapManager.spireLocations) {
            return;
        }

        const userLat = this.mapManager.userLocation.lat;
        const userLng = this.mapManager.userLocation.lng;

        let nearest = null;
        let minDistance = Infinity;

        this.mapManager.spireLocations.forEach(spire => {
            const distance = this.calculateDistance(
                userLat, userLng,
                spire.lat, spire.lng
            );

            if (distance < minDistance) {
                minDistance = distance;
                nearest = spire;
            }
        });

        if (nearest && this.nearestSpire && this.spireDistance) {
            this.nearestSpire.textContent = nearest.name;

            if (minDistance < 0.1) {
                this.spireDistance.textContent = `${Math.round(minDistance * 1000)}m`;
            } else {
                this.spireDistance.textContent = `${minDistance.toFixed(2)}km`;
            }
        }
    }

    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371;
        const dLat = this.deg2rad(lat2 - lat1);
        const dLon = this.deg2rad(lon2 - lon1);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;
        return distance;
    }

    deg2rad(deg) {
        return deg * (Math.PI / 180);
    }

    async startQRScanning() {
        if (!this.arActive) {
            alert('Please enable AR mode first');
            return;
        }

        this.scanningActive = !this.scanningActive;

        if (this.scanningActive) {
            this.scanQrBtn.textContent = '⏹️ Stop Scanning';
            this.scanQrBtn.classList.add('scanning');

            const scanArea = document.querySelector('.ar-scan-area');
            scanArea?.classList.add('scanning');

            this.simulateQRScan();
        } else {
            this.scanQrBtn.textContent = '📷 Scan QR Code';
            this.scanQrBtn.classList.remove('scanning');

            const scanArea = document.querySelector('.ar-scan-area');
            scanArea?.classList.remove('scanning');
        }
    }

    simulateQRScan() {
        setTimeout(() => {
            if (this.scanningActive) {
                const scanText = document.querySelector('.scan-text');
                if (scanText) {
                    scanText.textContent = '✓ QR Code Detected!';
                    scanText.style.color = '#10b981';
                }

                setTimeout(() => {
                    this.spawnCardFromQR();

                    if (scanText) {
                        scanText.textContent = 'Point camera at QR code';
                        scanText.style.color = '';
                    }

                    this.scanningActive = false;
                    this.scanQrBtn.textContent = '📷 Scan QR Code';
                    this.scanQrBtn.classList.remove('scanning');

                    const scanArea = document.querySelector('.ar-scan-area');
                    scanArea?.classList.remove('scanning');
                }, 1000);
            }
        }, 3000);
    }

    spawnCardFromQR() {
        const factions = ['hearts', 'spades', 'diamonds', 'clubs'];
        const suits = ['♥', '♠', '♦', '♣'];
        const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

        const randomFaction = Math.floor(Math.random() * factions.length);
        const randomValue = values[Math.floor(Math.random() * values.length)];

        const card = {
            faction: factions[randomFaction],
            suit: suits[randomFaction],
            value: randomValue,
            power: Math.floor(Math.random() * 10) + 1
        };

        this.displaySpawnedCard(card);
        console.log('🎴 Card spawned from QR code:', card);
    }

    setCenterLocation() {
        if (!this.mapManager || !this.mapManager.map) {
            alert('Please enable AR mode first');
            return;
        }

        const center = this.mapManager.map.getCenter();
        this.spawnCenter = {
            lat: center.lat(),
            lng: center.lng()
        };

        alert(`Center location set to:\nLat: ${this.spawnCenter.lat.toFixed(6)}\nLng: ${this.spawnCenter.lng.toFixed(6)}\n\nMove the map to adjust, then click again to update.`);
        console.log('📍 Spawn center set to:', this.spawnCenter);
    }

    testSpawnCard() {
        const factions = ['hearts', 'spades', 'diamonds', 'clubs'];
        const suits = ['♥', '♠', '♦', '♣'];
        const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

        if (!this.mapManager || !this.mapManager.userLocation) {
            alert('Please enable location services to spawn cards in a radius');
            return;
        }

        const userLat = this.spawnCenter ? this.spawnCenter.lat : this.mapManager.userLocation.lat;
        const userLng = this.spawnCenter ? this.spawnCenter.lng : this.mapManager.userLocation.lng;
        const radiusKm = 1;

        console.log('🎲 Spawning 10 cards in 1km radius...');

        for (let i = 0; i < 10; i++) {
            const randomFaction = Math.floor(Math.random() * factions.length);
            const randomValue = values[Math.floor(Math.random() * values.length)];

            const angle = Math.random() * 2 * Math.PI;
            const distance = Math.sqrt(Math.random()) * radiusKm;

            const latOffset = (distance * Math.cos(angle)) / 111.32;
            const lngOffset = (distance * Math.sin(angle)) / (111.32 * Math.cos(userLat * Math.PI / 180));

            const card = {
                faction: factions[randomFaction],
                suit: suits[randomFaction],
                value: randomValue,
                power: Math.floor(Math.random() * 10) + 1,
                lat: userLat + latOffset,
                lng: userLng + lngOffset
            };

            this.spawnedCards.push(card);
        }

        console.log(`✅ Spawned ${this.spawnedCards.length} cards around your location`);

        if (this.mapManager && this.mapManager.addCardMarkers) {
            this.mapManager.addCardMarkers(this.spawnedCards);
        }

        this.displaySpawnedCard({
            faction: factions[Math.floor(Math.random() * factions.length)],
            suit: suits[Math.floor(Math.random() * factions.length)],
            value: values[Math.floor(Math.random() * values.length)],
            power: Math.floor(Math.random() * 10) + 1
        });
    }

    displaySpawnedCard(card) {
        const arOverlay = document.querySelector('.ar-overlay');
        if (!arOverlay) return;

        const cardElement = document.createElement('div');
        cardElement.className = 'ar-spawned-card';
        cardElement.innerHTML = `
            <div class="spawned-card-inner ${card.faction}">
                <div class="spawned-card-suit">${card.suit}</div>
                <div class="spawned-card-value">${card.value}</div>
                <div class="spawned-card-power">⚡ ${card.power}</div>
            </div>
        `;

        cardElement.style.left = '50%';
        cardElement.style.top = '50%';

        arOverlay.appendChild(cardElement);

        setTimeout(() => {
            cardElement.style.opacity = '1';
            cardElement.style.transform = 'translate(-50%, -50%) scale(1)';
        }, 10);

        setTimeout(() => {
            cardElement.style.opacity = '0';
            cardElement.style.transform = 'translate(-50%, -50%) scale(0.8)';
            setTimeout(() => cardElement.remove(), 500);
        }, 4000);

        this.spawnedCards.push(card);
    }

    checkNearbyCards() {
        if (!this.mapManager || !this.mapManager.userLocation || this.spawnedCards.length === 0) {
            return;
        }

        const userLat = this.mapManager.userLocation.lat;
        const userLng = this.mapManager.userLocation.lng;
        const detectionRadius = 0.05;

        const nearbyCards = this.spawnedCards.filter(card => {
            if (!card.lat || !card.lng) return false;

            const distance = this.calculateDistance(userLat, userLng, card.lat, card.lng);
            return distance <= detectionRadius;
        });

        if (nearbyCards.length > 0) {
            console.log(`🎴 Found ${nearbyCards.length} cards within 50m!`);

            nearbyCards.slice(0, 5).forEach((card, index) => {
                setTimeout(() => {
                    this.displayDetectedCard(card);
                }, index * 500);
            });
        }
    }

    displayDetectedCard(card) {
        const arOverlay = document.querySelector('.ar-overlay');
        if (!arOverlay) return;

        const cardElement = document.createElement('div');
        cardElement.className = 'ar-spawned-card';
        cardElement.innerHTML = `
            <div class="spawned-card-inner ${card.faction}">
                <div class="spawned-card-suit">${card.suit}</div>
                <div class="spawned-card-value">${card.value}</div>
                <div class="spawned-card-power">⚡ ${card.power}</div>
            </div>
        `;

        const x = Math.random() * 60 + 20;
        const y = Math.random() * 60 + 20;
        cardElement.style.left = `${x}%`;
        cardElement.style.top = `${y}%`;

        arOverlay.appendChild(cardElement);

        setTimeout(() => {
            cardElement.style.opacity = '1';
            cardElement.style.transform = 'translate(-50%, -50%) scale(1)';
        }, 10);

        setTimeout(() => {
            cardElement.style.opacity = '0';
            cardElement.style.transform = 'translate(-50%, -50%) scale(0.8)';
            setTimeout(() => cardElement.remove(), 500);
        }, 4000);
    }

    destroy() {
        this.stopARCamera();

        if (this.distanceInterval) {
            clearInterval(this.distanceInterval);
        }
    }
}
