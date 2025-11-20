import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export class CardGenerator {
    constructor() {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseKey) {
            console.error('Supabase credentials not found in environment');
            return;
        }

        this.supabase = createClient(supabaseUrl, supabaseKey);

        this.factions = ['hearts', 'diamonds', 'clubs', 'spades'];
        this.suits = ['♥', '♦', '♣', '♠'];
        this.values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
        this.powerMap = {
            'A': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7,
            '8': 8, '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13
        };
    }

    generateRandomLocation(centerLat, centerLng, radiusKm) {
        const angle = Math.random() * 2 * Math.PI;
        const distance = Math.sqrt(Math.random()) * radiusKm;

        const latOffset = (distance * Math.cos(angle)) / 111.32;
        const lngOffset = (distance * Math.sin(angle)) / (111.32 * Math.cos(centerLat * Math.PI / 180));

        return {
            latitude: centerLat + latOffset,
            longitude: centerLng + lngOffset
        };
    }

    generateCard(centerLat, centerLng, radiusKm) {
        const factionIndex = Math.floor(Math.random() * this.factions.length);
        const value = this.values[Math.floor(Math.random() * this.values.length)];
        const location = this.generateRandomLocation(centerLat, centerLng, radiusKm);

        return {
            faction: this.factions[factionIndex],
            suit: this.suits[factionIndex],
            value: value,
            power: this.powerMap[value],
            latitude: location.latitude,
            longitude: location.longitude,
            is_collected: false
        };
    }

    async generateAndSaveCards(count, centerLat = 40.7128, centerLng = -74.0060, radiusKm = 50) {
        console.log(`🎴 Generating ${count} cards...`);

        const batchSize = 1000;
        const batches = Math.ceil(count / batchSize);
        let totalInserted = 0;

        for (let batch = 0; batch < batches; batch++) {
            const cardsInBatch = Math.min(batchSize, count - totalInserted);
            const cards = [];

            for (let i = 0; i < cardsInBatch; i++) {
                cards.push(this.generateCard(centerLat, centerLng, radiusKm));
            }

            const { data, error } = await this.supabase
                .from('cards')
                .insert(cards)
                .select('id');

            if (error) {
                console.error(`❌ Error inserting batch ${batch + 1}:`, error);
                throw error;
            }

            totalInserted += cardsInBatch;
            console.log(`✅ Batch ${batch + 1}/${batches} complete - ${totalInserted}/${count} cards generated`);
        }

        console.log(`🎉 Successfully generated and saved ${totalInserted} cards!`);
        return totalInserted;
    }

    async clearAllCards() {
        console.log('🗑️ Clearing all cards from database...');

        const { error } = await this.supabase
            .from('cards')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000');

        if (error) {
            console.error('❌ Error clearing cards:', error);
            throw error;
        }

        console.log('✅ All cards cleared');
    }

    async getCardCount() {
        const { count, error } = await this.supabase
            .from('cards')
            .select('*', { count: 'exact', head: true });

        if (error) {
            console.error('❌ Error getting card count:', error);
            return 0;
        }

        return count;
    }

    async getCardsInRadius(lat, lng, radiusKm) {
        const { data, error } = await this.supabase
            .from('cards')
            .select('*')
            .eq('is_collected', false);

        if (error) {
            console.error('❌ Error fetching cards:', error);
            return [];
        }

        const cardsInRadius = data.filter(card => {
            const distance = this.calculateDistance(lat, lng, card.latitude, card.longitude);
            return distance <= radiusKm;
        });

        return cardsInRadius;
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
        return R * c;
    }

    deg2rad(deg) {
        return deg * (Math.PI / 180);
    }

    async collectCard(cardId) {
        const { data, error } = await this.supabase
            .from('cards')
            .update({ is_collected: true, updated_at: new Date().toISOString() })
            .eq('id', cardId)
            .select();

        if (error) {
            console.error('❌ Error collecting card:', error);
            return null;
        }

        return data[0];
    }
}
