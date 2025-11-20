import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export class MarketSystem {
  constructor() {
    this.currentUser = null;
  }

  async initialize() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      this.currentUser = user;
      await this.ensureProfile(user);
    }
    return this.currentUser !== null;
  }

  async ensureProfile(user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (!profile) {
      const username = user.email?.split('@')[0] || `player_${user.id.slice(0, 8)}`;
      await supabase
        .from('profiles')
        .insert({ id: user.id, username });
    }
  }

  async createListing(cardSuit, cardRank, wantedSuit, wantedRank, description) {
    if (!this.currentUser) return { success: false, error: 'Not authenticated' };

    const { data, error } = await supabase
      .from('market_listings')
      .insert({
        seller_id: this.currentUser.id,
        card_suit: cardSuit,
        card_rank: cardRank,
        wanted_suit: wantedSuit || null,
        wanted_rank: wantedRank || null,
        description: description || '',
        status: 'active'
      })
      .select()
      .single();

    return { success: !error, data, error };
  }

  async getActiveListings() {
    const { data, error } = await supabase
      .from('market_listings')
      .select(`
        *,
        seller:profiles!seller_id(username)
      `)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    return { success: !error, data: data || [], error };
  }

  async getMyListings() {
    if (!this.currentUser) return { success: false, data: [], error: 'Not authenticated' };

    const { data, error } = await supabase
      .from('market_listings')
      .select('*')
      .eq('seller_id', this.currentUser.id)
      .order('created_at', { ascending: false });

    return { success: !error, data: data || [], error };
  }

  async cancelListing(listingId) {
    if (!this.currentUser) return { success: false, error: 'Not authenticated' };

    const { error } = await supabase
      .from('market_listings')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', listingId)
      .eq('seller_id', this.currentUser.id);

    return { success: !error, error };
  }

  async makeOffer(listingId, offeredSuit, offeredRank, message) {
    if (!this.currentUser) return { success: false, error: 'Not authenticated' };

    const { data, error } = await supabase
      .from('trade_offers')
      .insert({
        listing_id: listingId,
        buyer_id: this.currentUser.id,
        offered_suit: offeredSuit,
        offered_rank: offeredRank,
        message: message || '',
        status: 'pending'
      })
      .select()
      .single();

    return { success: !error, data, error };
  }

  async getOffersForListing(listingId) {
    const { data, error } = await supabase
      .from('trade_offers')
      .select(`
        *,
        buyer:profiles!buyer_id(username)
      `)
      .eq('listing_id', listingId)
      .order('created_at', { ascending: false });

    return { success: !error, data: data || [], error };
  }

  async getMyOffers() {
    if (!this.currentUser) return { success: false, data: [], error: 'Not authenticated' };

    const { data, error } = await supabase
      .from('trade_offers')
      .select(`
        *,
        listing:market_listings(*)
      `)
      .eq('buyer_id', this.currentUser.id)
      .order('created_at', { ascending: false });

    return { success: !error, data: data || [], error };
  }

  async acceptOffer(offerId) {
    if (!this.currentUser) return { success: false, error: 'Not authenticated' };

    const { data: offer, error: fetchError } = await supabase
      .from('trade_offers')
      .select('*, listing:market_listings(*)')
      .eq('id', offerId)
      .single();

    if (fetchError || !offer) return { success: false, error: fetchError };

    const { error: updateOfferError } = await supabase
      .from('trade_offers')
      .update({ status: 'accepted', updated_at: new Date().toISOString() })
      .eq('id', offerId);

    if (updateOfferError) return { success: false, error: updateOfferError };

    const { error: updateListingError } = await supabase
      .from('market_listings')
      .update({ status: 'completed', updated_at: new Date().toISOString() })
      .eq('id', offer.listing_id);

    return { success: !updateListingError, data: offer, error: updateListingError };
  }

  async rejectOffer(offerId) {
    if (!this.currentUser) return { success: false, error: 'Not authenticated' };

    const { error } = await supabase
      .from('trade_offers')
      .update({ status: 'rejected', updated_at: new Date().toISOString() })
      .eq('id', offerId);

    return { success: !error, error };
  }

  async createCounterOffer(offerId, counterSuit, counterRank, message) {
    if (!this.currentUser) return { success: false, error: 'Not authenticated' };

    const { error: updateError } = await supabase
      .from('trade_offers')
      .update({ status: 'countered', updated_at: new Date().toISOString() })
      .eq('id', offerId);

    if (updateError) return { success: false, error: updateError };

    const { data, error } = await supabase
      .from('counter_offers')
      .insert({
        original_offer_id: offerId,
        counter_suit: counterSuit,
        counter_rank: counterRank,
        message: message || '',
        status: 'pending'
      })
      .select()
      .single();

    return { success: !error, data, error };
  }

  async getCounterOffer(offerId) {
    const { data, error } = await supabase
      .from('counter_offers')
      .select('*')
      .eq('original_offer_id', offerId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    return { success: !error, data, error };
  }

  async acceptCounterOffer(counterId) {
    if (!this.currentUser) return { success: false, error: 'Not authenticated' };

    const { data: counter, error: fetchError } = await supabase
      .from('counter_offers')
      .select('*, offer:trade_offers(*, listing:market_listings(*))')
      .eq('id', counterId)
      .single();

    if (fetchError || !counter) return { success: false, error: fetchError };

    const { error: updateCounterError } = await supabase
      .from('counter_offers')
      .update({ status: 'accepted' })
      .eq('id', counterId);

    if (updateCounterError) return { success: false, error: updateCounterError };

    const { error: updateOfferError } = await supabase
      .from('trade_offers')
      .update({ status: 'accepted', updated_at: new Date().toISOString() })
      .eq('id', counter.original_offer_id);

    if (updateOfferError) return { success: false, error: updateOfferError };

    const { error: updateListingError } = await supabase
      .from('market_listings')
      .update({ status: 'completed', updated_at: new Date().toISOString() })
      .eq('id', counter.offer.listing_id);

    return { success: !updateListingError, data: counter, error: updateListingError };
  }

  async rejectCounterOffer(counterId) {
    if (!this.currentUser) return { success: false, error: 'Not authenticated' };

    const { error } = await supabase
      .from('counter_offers')
      .update({ status: 'rejected' })
      .eq('id', counterId);

    return { success: !error, error };
  }
}
