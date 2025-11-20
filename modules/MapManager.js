export class MapManager {
    constructor(cardGenerator) {
        this.map = null;
        this.userMarker = null;
        this.spireMarkers = [];
        this.cardMarkers = [];
        this.userLocation = null;
        this.spiresVisible = true;
        this.cardGenerator = cardGenerator;

        this.spireLocations = [
            { name: 'Crimson Spire', faction: 'hearts', lat: 0, lng: 0, icon: '♥', color: '#ef4444' },
            { name: 'Obsidian Spire', faction: 'spades', lat: 0, lng: 0, icon: '♠', color: '#f97316' },
            { name: 'Azure Spire', faction: 'diamonds', lat: 0, lng: 0, icon: '♦', color: '#facc15' },
            { name: 'Verdant Spire', faction: 'clubs', lat: 0, lng: 0, icon: '♣', color: '#7c3aed' }
        ];

        this.initializeControls();
    }

    initializeControls() {
        const centerMapBtn = document.getElementById('centerMapBtn');
        const toggleSpiresBtn = document.getElementById('toggleSpiresBtn');

        centerMapBtn?.addEventListener('click', () => this.centerOnUser());
        toggleSpiresBtn?.addEventListener('click', () => this.toggleSpires());
    }

    async initializeMap() {
        if (!window.google || !window.google.maps) {
            console.error('Google Maps API not loaded');
            return;
        }

        try {
            const position = await this.getUserLocation();
            this.userLocation = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };

            this.generateSpireLocations();

            const mapOptions = {
                center: this.userLocation,
                zoom: 15,
                mapTypeId: 'roadmap',
                styles: this.getMapStyles(),
                disableDefaultUI: true,
                zoomControl: true,
                zoomControlOptions: {
                    position: google.maps.ControlPosition.RIGHT_CENTER
                }
            };

            this.map = new google.maps.Map(document.getElementById('googleMap'), mapOptions);

            this.addUserMarker();
            this.addSpireMarkers();
            await this.loadNearbyCards();

            console.log('✅ Google Maps initialized successfully');
        } catch (error) {
            console.error('Error initializing map:', error);
            this.showDefaultLocation();
        }
    }

    getUserLocation() {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocation not supported'));
                return;
            }

            navigator.geolocation.getCurrentPosition(resolve, reject, {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            });
        });
    }

    generateSpireLocations() {
        const offsetRange = 0.01;

        this.spireLocations = this.spireLocations.map(spire => ({
            ...spire,
            lat: this.userLocation.lat + (Math.random() - 0.5) * offsetRange,
            lng: this.userLocation.lng + (Math.random() - 0.5) * offsetRange
        }));
    }

    showDefaultLocation() {
        this.userLocation = { lat: 40.7128, lng: -74.0060 };

        const mapOptions = {
            center: this.userLocation,
            zoom: 13,
            mapTypeId: 'roadmap',
            styles: this.getMapStyles(),
            disableDefaultUI: true,
            zoomControl: true
        };

        this.map = new google.maps.Map(document.getElementById('googleMap'), mapOptions);

        this.spireLocations = [
            { name: 'Crimson Spire', faction: 'hearts', lat: 40.7158, lng: -74.0090, icon: '♥', color: '#ef4444' },
            { name: 'Obsidian Spire', faction: 'spades', lat: 40.7098, lng: -74.0030, icon: '♠', color: '#f97316' },
            { name: 'Azure Spire', faction: 'diamonds', lat: 40.7158, lng: -74.0030, icon: '♦', color: '#facc15' },
            { name: 'Verdant Spire', faction: 'clubs', lat: 40.7098, lng: -74.0090, icon: '♣', color: '#7c3aed' }
        ];

        this.addUserMarker();
        this.addSpireMarkers();
    }

    addUserMarker() {
        const userIcon = {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 12,
            fillColor: '#3b82f6',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 3
        };

        this.userMarker = new google.maps.Marker({
            position: this.userLocation,
            map: this.map,
            icon: userIcon,
            title: 'Your Location',
            animation: google.maps.Animation.DROP
        });

        const userInfoWindow = new google.maps.InfoWindow({
            content: '<div style="color: #000; padding: 8px;"><strong>📍 You are here</strong></div>'
        });

        this.userMarker.addListener('click', () => {
            userInfoWindow.open(this.map, this.userMarker);
        });
    }

    addSpireMarkers() {
        this.spireMarkers = this.spireLocations.map(spire => {
            const marker = new google.maps.Marker({
                position: { lat: spire.lat, lng: spire.lng },
                map: this.map,
                title: spire.name,
                icon: {
                    path: google.maps.SymbolPath.CIRCLE,
                    scale: 15,
                    fillColor: spire.color,
                    fillOpacity: 0.9,
                    strokeColor: '#ffffff',
                    strokeWeight: 2
                },
                animation: google.maps.Animation.BOUNCE
            });

            setTimeout(() => {
                marker.setAnimation(null);
            }, 2000);

            const infoWindow = new google.maps.InfoWindow({
                content: `
                    <div style="color: #000; padding: 12px; font-family: 'Segoe UI', sans-serif;">
                        <h3 style="margin: 0 0 8px 0; color: ${spire.color}; font-size: 1.1rem;">
                            ${spire.icon} ${spire.name}
                        </h3>
                        <p style="margin: 0; font-size: 0.9rem; color: #666;">
                            ${spire.faction.toUpperCase()} Faction Territory
                        </p>
                        <p style="margin: 8px 0 0 0; font-size: 0.85rem; color: #999;">
                            Click to explore this spire
                        </p>
                    </div>
                `
            });

            marker.addListener('click', () => {
                infoWindow.open(this.map, marker);
            });

            return { marker, spire };
        });
    }

    centerOnUser() {
        if (this.map && this.userLocation) {
            this.map.panTo(this.userLocation);
            this.map.setZoom(15);

            if (this.userMarker) {
                this.userMarker.setAnimation(google.maps.Animation.BOUNCE);
                setTimeout(() => {
                    this.userMarker.setAnimation(null);
                }, 2000);
            }
        }
    }

    toggleSpires() {
        this.spiresVisible = !this.spiresVisible;

        this.spireMarkers.forEach(({ marker }) => {
            marker.setVisible(this.spiresVisible);
        });

        const toggleBtn = document.getElementById('toggleSpiresBtn');
        if (toggleBtn) {
            toggleBtn.innerHTML = this.spiresVisible
                ? '<span>🏛️</span> Hide Spires'
                : '<span>🏛️</span> Show Spires';
        }
    }

    getMapStyles() {
        return [
            {
                featureType: 'all',
                elementType: 'geometry',
                stylers: [{ color: '#1f2937' }]
            },
            {
                featureType: 'all',
                elementType: 'labels.text.fill',
                stylers: [{ color: '#9ca3af' }]
            },
            {
                featureType: 'all',
                elementType: 'labels.text.stroke',
                stylers: [{ color: '#111827' }]
            },
            {
                featureType: 'road',
                elementType: 'geometry',
                stylers: [{ color: '#374151' }]
            },
            {
                featureType: 'road',
                elementType: 'geometry.stroke',
                stylers: [{ color: '#1f2937' }]
            },
            {
                featureType: 'water',
                elementType: 'geometry',
                stylers: [{ color: '#0f172a' }]
            },
            {
                featureType: 'poi',
                elementType: 'geometry',
                stylers: [{ color: '#374151' }]
            },
            {
                featureType: 'poi.park',
                elementType: 'geometry',
                stylers: [{ color: '#1e3a28' }]
            }
        ];
    }

    addCardMarkers(cards) {
        if (!this.map || !cards || cards.length === 0) return;

        this.clearCardMarkers();

        const factionColors = {
            'hearts': '#ef4444',
            'spades': '#f97316',
            'diamonds': '#facc15',
            'clubs': '#7c3aed'
        };

        const factionIcons = {
            'hearts': '♥',
            'spades': '♠',
            'diamonds': '♦',
            'clubs': '♣'
        };

        cards.forEach((card, index) => {
            if (!card.lat || !card.lng) return;

            const svgMarker = {
                path: 'M12 2L2 7L12 12L22 7L12 2Z',
                fillColor: factionColors[card.faction] || '#ffffff',
                fillOpacity: 0.8,
                strokeWeight: 2,
                strokeColor: '#ffffff',
                rotation: 0,
                scale: 0.8,
                anchor: new google.maps.Point(12, 12),
            };

            const marker = new google.maps.Marker({
                position: { lat: card.lat, lng: card.lng },
                map: this.map,
                icon: svgMarker,
                title: `${card.value}${factionIcons[card.faction]} - Power: ${card.power}`,
                zIndex: 1
            });

            const infoWindow = new google.maps.InfoWindow({
                content: `
                    <div style="padding: 10px; color: #1f2937;">
                        <h3 style="margin: 0 0 8px 0; color: ${factionColors[card.faction]}; font-size: 1.2rem;">
                            ${card.value}${factionIcons[card.faction]}
                        </h3>
                        <p style="margin: 0; font-size: 0.9rem;">
                            <strong>Faction:</strong> ${card.faction.toUpperCase()}
                        </p>
                        <p style="margin: 4px 0 0 0; font-size: 0.9rem;">
                            <strong>Power:</strong> ${card.power}
                        </p>
                    </div>
                `
            });

            marker.addListener('click', () => {
                infoWindow.open(this.map, marker);
            });

            this.cardMarkers.push(marker);
        });

        console.log(`🗺️ Added ${this.cardMarkers.length} card markers to map`);
    }

    clearCardMarkers() {
        this.cardMarkers.forEach(marker => marker.setMap(null));
        this.cardMarkers = [];
    }

    async loadNearbyCards(radiusKm = 5) {
        if (!this.cardGenerator || !this.userLocation) return;

        console.log(`🔍 Loading cards within ${radiusKm}km...`);

        const cards = await this.cardGenerator.getCardsInRadius(
            this.userLocation.lat,
            this.userLocation.lng,
            radiusKm
        );

        console.log(`📍 Found ${cards.length} nearby cards`);

        const mapCards = cards.map(card => ({
            ...card,
            lat: card.latitude,
            lng: card.longitude
        }));

        this.addCardMarkers(mapCards);
    }

    async collectCard(cardId) {
        if (!this.cardGenerator) return;

        const collected = await this.cardGenerator.collectCard(cardId);
        if (collected) {
            console.log('✅ Card collected:', collected);
            await this.loadNearbyCards();
        }
    }

    destroy() {
        if (this.map) {
            this.map = null;
        }
        this.userMarker = null;
        this.spireMarkers = [];
        this.clearCardMarkers();
    }
}
