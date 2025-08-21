import { v } from "convex/values";
import { action, query, mutation } from "./_generated/server";
import { api } from "./_generated/api";

// Market data service that integrates with Reflector oracle and AI
export const updateMarketData = action({
  args: {
    asset: v.string(),
    price: v.string(),
    priceChange24h: v.optional(v.string()),
    volume24h: v.optional(v.string()),
    fundingRate: v.optional(v.string()),
    source: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      // Update market data
      const marketDataId = await ctx.runMutation(api.marketData.upsertMarketData, {
        asset: args.asset,
        price: args.price,
        priceChange24h: args.priceChange24h,
        volume24h: args.volume24h,
        fundingRate: args.fundingRate,
        source: args.source,
      });
      
      // Generate AI trading signal for this asset
      const tradingSignal = await ctx.runAction(api.ai.generateTradingSignal, {
        asset: args.asset,
        currentPrice: args.price,
        priceChange24h: args.priceChange24h,
        volume24h: args.volume24h,
        fundingRate: args.fundingRate,
      });
      
      console.log(`AI Trading Signal for ${args.asset}:`, tradingSignal);
      
      return { marketDataId, tradingSignal };
    } catch (error) {
      console.error("Market data update error:", error);
      throw error;
    }
  },
});

// Upsert market data
export const upsertMarketData = mutation({
  args: {
    asset: v.string(),
    price: v.string(),
    priceChange24h: v.optional(v.string()),
    volume24h: v.optional(v.string()),
    fundingRate: v.optional(v.string()),
    source: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if market data already exists for this asset
    const existingData = await ctx.db
      .query("marketData")
      .withIndex("by_asset", (q) => q.eq("asset", args.asset))
      .first();
    
    if (existingData) {
      // Update existing data
      await ctx.db.patch(existingData._id, {
        price: args.price,
        priceChange24h: args.priceChange24h,
        volume24h: args.volume24h,
        fundingRate: args.fundingRate,
        lastUpdated: Date.now(),
      });
      return existingData._id;
    } else {
      // Insert new data
      return await ctx.db.insert("marketData", {
        asset: args.asset,
        price: args.price,
        priceChange24h: args.priceChange24h,
        volume24h: args.volume24h,
        fundingRate: args.fundingRate,
        lastUpdated: Date.now(),
        source: args.source,
      });
    }
  },
});

// Get current market data for an asset
export const getMarketData = query({
  args: { asset: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("marketData")
      .withIndex("by_asset", (q) => q.eq("asset", args.asset))
      .first();
  },
});

// Get all market data
export const getAllMarketData = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("marketData")
      .order("desc")
      .collect();
  },
});

// Get market data for multiple assets
export const getMarketDataForAssets = query({
  args: { assets: v.array(v.string()) },
  handler: async (ctx, args) => {
    const results = [];
    for (const asset of args.assets) {
      const data = await ctx.db
        .query("marketData")
        .withIndex("by_asset", (q) => q.eq("asset", asset))
        .first();
      if (data) {
        results.push(data);
      }
    }
    return results;
  },
});

// Get market data updated within a time range
export const getRecentMarketData = query({
  args: { hours: v.number() },
  handler: async (ctx, args) => {
    const cutoffTime = Date.now() - (args.hours * 60 * 60 * 1000);
    return await ctx.db
      .query("marketData")
      .withIndex("by_last_updated", (q) => q.gte("lastUpdated", cutoffTime))
      .order("desc")
      .collect();
  },
});

// Update funding rate for an asset
export const updateFundingRate = mutation({
  args: {
    asset: v.string(),
    rate: v.string(),
    period: v.string(),
  },
  handler: async (ctx, args) => {
    // Store funding rate history
    await ctx.db.insert("fundingRates", {
      asset: args.asset,
      rate: args.rate,
      timestamp: Date.now(),
      period: args.period,
    });
    
    // Update current market data with new funding rate
    const marketData = await ctx.db
      .query("marketData")
      .withIndex("by_asset", (q) => q.eq("asset", args.asset))
      .first();
    
    if (marketData) {
      await ctx.db.patch(marketData._id, {
        fundingRate: args.rate,
        lastUpdated: Date.now(),
      });
    }
    
    return { success: true };
  },
});

// Get funding rate history for an asset
export const getFundingRateHistory = query({
  args: { 
    asset: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 100;
    return await ctx.db
      .query("fundingRates")
      .withIndex("by_asset", (q) => q.eq("asset", args.asset))
      .order("desc")
      .take(limit);
  },
});

// Get current funding rates for all assets
export const getCurrentFundingRates = query({
  args: {},
  handler: async (ctx) => {
    const marketData = await ctx.db
      .query("marketData")
      .collect();
    
    return marketData
      .filter(data => data.fundingRate)
      .map(data => ({
        asset: data.asset,
        fundingRate: data.fundingRate,
        lastUpdated: data.lastUpdated,
      }));
  },
});
