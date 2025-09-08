import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { api } from "./_generated/api";

// Position Management Functions

// Create or update a position
export const upsertPosition = mutation({
  args: {
    positionId: v.string(),
    userPublicKey: v.string(),
    asset: v.string(),
    size: v.string(),
    collateral: v.string(),
    entryPrice: v.string(),
    leverage: v.number(),
    timestamp: v.optional(v.number()),
    isOpen: v.optional(v.boolean()),
    pnl: v.optional(v.string()),
    liquidationPrice: v.optional(v.string()),
    fundingRate: v.optional(v.string()),
    txHash: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if position already exists
    const existingPosition = await ctx.db
      .query("positions")
      .withIndex("by_position", (q) => q.eq("positionId", args.positionId))
      .first();

    const positionData = {
      positionId: args.positionId,
      userPublicKey: args.userPublicKey,
      asset: args.asset,
      size: args.size,
      collateral: args.collateral,
      entryPrice: args.entryPrice,
      leverage: args.leverage,
      timestamp: args.timestamp || Date.now(),
      isOpen: args.isOpen ?? true,
      pnl: args.pnl || "0",
      liquidationPrice: args.liquidationPrice,
      fundingRate: args.fundingRate,
      lastUpdated: Date.now(),
    };

    if (existingPosition) {
      // Update existing position
      await ctx.db.patch(existingPosition._id, positionData);
      
      // Also record the trade history
      if (args.txHash) {
        await ctx.db.insert("trades", {
          userPublicKey: args.userPublicKey,
          positionId: args.positionId,
          type: parseFloat(args.size) > 0 ? "open_long" : "open_short",
          asset: args.asset,
          size: args.size,
          price: args.entryPrice,
          collateral: args.collateral,
          leverage: args.leverage,
          pnl: args.pnl,
          txHash: args.txHash,
          timestamp: args.timestamp || Date.now(),
        });
      }
      
      return existingPosition._id;
    } else {
      // Create new position
      const newPositionId = await ctx.db.insert("positions", positionData);
      
      // Record the trade history
      if (args.txHash) {
        await ctx.db.insert("trades", {
          userPublicKey: args.userPublicKey,
          positionId: args.positionId,
          type: parseFloat(args.size) > 0 ? "open_long" : "open_short",
          asset: args.asset,
          size: args.size,
          price: args.entryPrice,
          collateral: args.collateral,
          leverage: args.leverage,
          pnl: args.pnl,
          txHash: args.txHash,
          timestamp: args.timestamp || Date.now(),
        });
      }
      
      return newPositionId;
    }
  },
});

// Close a position
export const closePosition = mutation({
  args: {
    positionId: v.string(),
    closePrice: v.string(),
    pnl: v.string(),
    txHash: v.string(),
    timestamp: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const position = await ctx.db
      .query("positions")
      .withIndex("by_position", (q) => q.eq("positionId", args.positionId))
      .first();

    if (!position) {
      throw new Error("Position not found");
    }

    // Update position as closed
    await ctx.db.patch(position._id, {
      isOpen: false,
      pnl: args.pnl,
      lastUpdated: Date.now(),
    });

    // Record the close trade
    await ctx.db.insert("trades", {
      userPublicKey: position.userPublicKey,
      positionId: args.positionId,
      type: parseFloat(position.size) > 0 ? "close_long" : "close_short",
      asset: position.asset,
      size: position.size,
      price: args.closePrice,
      collateral: position.collateral,
      leverage: position.leverage,
      pnl: args.pnl,
      txHash: args.txHash,
      timestamp: args.timestamp || Date.now(),
    });

    return position._id;
  },
});

// Get user positions
export const getUserPositions = query({
  args: { 
    userPublicKey: v.string(),
    includeOpen: v.optional(v.boolean()),
    includeClosed: v.optional(v.boolean()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const includeOpen = args.includeOpen ?? true;
    const includeClosed = args.includeClosed ?? false;
    const limit = args.limit || 100;

    let query = ctx.db
      .query("positions")
      .withIndex("by_user", (q) => q.eq("userPublicKey", args.userPublicKey));

    // Filter by open/closed status
    if (includeOpen && !includeClosed) {
      query = query.filter((q) => q.eq(q.field("isOpen"), true));
    } else if (!includeOpen && includeClosed) {
      query = query.filter((q) => q.eq(q.field("isOpen"), false));
    }

    const positions = await query
      .order("desc")
      .take(limit);

    return positions;
  },
});

// Get single position by ID
export const getPosition = query({
  args: { positionId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("positions")
      .withIndex("by_position", (q) => q.eq("positionId", args.positionId))
      .first();
  },
});

// Update position PnL and metrics
export const updatePositionMetrics = mutation({
  args: {
    positionId: v.string(),
    currentPrice: v.string(),
    pnl: v.string(),
    liquidationPrice: v.optional(v.string()),
    fundingRate: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const position = await ctx.db
      .query("positions")
      .withIndex("by_position", (q) => q.eq("positionId", args.positionId))
      .first();

    if (!position) {
      throw new Error("Position not found");
    }

    await ctx.db.patch(position._id, {
      pnl: args.pnl,
      liquidationPrice: args.liquidationPrice,
      fundingRate: args.fundingRate,
      lastUpdated: Date.now(),
    });

    return position._id;
  },
});

// Get positions by asset
export const getPositionsByAsset = query({
  args: { 
    asset: v.string(),
    isOpen: v.optional(v.boolean()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 100;
    
    let query = ctx.db
      .query("positions")
      .withIndex("by_asset", (q) => q.eq("asset", args.asset));

    if (args.isOpen !== undefined) {
      query = query.filter((q) => q.eq(q.field("isOpen"), args.isOpen));
    }

    return await query
      .order("desc")
      .take(limit);
  },
});

// Get portfolio summary
export const getPortfolioSummary = query({
  args: { userPublicKey: v.string() },
  handler: async (ctx, args) => {
    const positions = await ctx.db
      .query("positions")
      .withIndex("by_user", (q) => q.eq("userPublicKey", args.userPublicKey))
      .collect();

    const openPositions = positions.filter(p => p.isOpen);
    const closedPositions = positions.filter(p => !p.isOpen);

    // Calculate totals
    const totalPnL = positions.reduce((sum, p) => sum + parseFloat(p.pnl || "0"), 0);
    const totalCollateral = openPositions.reduce((sum, p) => sum + parseFloat(p.collateral || "0"), 0);
    const totalExposure = openPositions.reduce((sum, p) => {
      return sum + (parseFloat(p.size || "0") * parseFloat(p.entryPrice || "0"));
    }, 0);

    // Asset breakdown
    const assetBreakdown = openPositions.reduce((breakdown, position) => {
      const asset = position.asset;
      if (!breakdown[asset]) {
        breakdown[asset] = {
          asset,
          positions: 0,
          totalSize: 0,
          totalCollateral: 0,
          avgLeverage: 0,
          pnl: 0,
        };
      }
      
      breakdown[asset].positions += 1;
      breakdown[asset].totalSize += parseFloat(position.size || "0");
      breakdown[asset].totalCollateral += parseFloat(position.collateral || "0");
      breakdown[asset].avgLeverage += position.leverage || 1;
      breakdown[asset].pnl += parseFloat(position.pnl || "0");
      
      return breakdown;
    }, {} as Record<string, any>);

    // Calculate average leverage for each asset
    Object.values(assetBreakdown).forEach((asset: any) => {
      asset.avgLeverage = asset.positions > 0 ? asset.avgLeverage / asset.positions : 0;
    });

    return {
      totalPositions: positions.length,
      openPositions: openPositions.length,
      closedPositions: closedPositions.length,
      totalPnL,
      totalCollateral,
      totalExposure,
      marginUtilization: totalCollateral > 0 ? (totalExposure / totalCollateral) * 100 : 0,
      assetBreakdown: Object.values(assetBreakdown),
      recentPositions: positions
        .sort((a, b) => b.lastUpdated - a.lastUpdated)
        .slice(0, 5),
    };
  },
});

// Sync position from blockchain
export const syncPositionFromBlockchain = mutation({
  args: {
    positionId: v.string(),
    userPublicKey: v.string(),
    blockchainData: v.any(), // Raw blockchain position data
    txHash: v.string(),
  },
  handler: async (ctx, args) => {
    const { blockchainData } = args;
    
    // Convert blockchain data to our format
    const positionData = {
      positionId: args.positionId,
      userPublicKey: args.userPublicKey,
      asset: blockchainData.asset || "BTC",
      size: blockchainData.size?.toString() || "0",
      collateral: blockchainData.collateral?.toString() || "0",
      entryPrice: blockchainData.entry_price?.toString() || "0",
      leverage: blockchainData.leverage || 1,
      timestamp: blockchainData.timestamp || Date.now(),
      isOpen: blockchainData.is_open ?? true,
      pnl: "0", // PnL will be calculated separately
      lastUpdated: Date.now(),
    };

    // Check if position exists
    const existingPosition = await ctx.db
      .query("positions")
      .withIndex("by_position", (q) => q.eq("positionId", args.positionId))
      .first();

    if (existingPosition) {
      await ctx.db.patch(existingPosition._id, positionData);
      return existingPosition._id;
    } else {
      const newPositionId = await ctx.db.insert("positions", positionData);
      
      // Record the trade
      await ctx.db.insert("trades", {
        userPublicKey: args.userPublicKey,
        positionId: args.positionId,
        type: parseFloat(positionData.size) > 0 ? "open_long" : "open_short",
        asset: positionData.asset,
        size: positionData.size,
        price: positionData.entryPrice,
        collateral: positionData.collateral,
        leverage: positionData.leverage,
        pnl: "0",
        txHash: args.txHash,
        timestamp: positionData.timestamp,
      });
      
      return newPositionId;
    }
  },
});

// Bulk sync positions from blockchain
export const bulkSyncPositions = mutation({
  args: {
    userPublicKey: v.string(),
    positions: v.array(v.any()),
    syncTimestamp: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<{
    syncedCount: number;
    failedCount: number;
    results: Array<{ success: boolean; positionId?: string; error?: string; positionData?: any }>;
    timestamp: number;
  }> => {
    const results: Array<{ success: boolean; positionId?: string; error?: string; positionData?: any }> = [];
    
    for (const blockchainPosition of args.positions) {
      try {
        const positionId: string = await ctx.runMutation(api.positions.syncPositionFromBlockchain, {
          positionId: blockchainPosition.id?.toString() || Date.now().toString(),
          userPublicKey: args.userPublicKey,
          blockchainData: blockchainPosition,
          txHash: blockchainPosition.txHash || "sync",
        });
        results.push({ success: true, positionId });
      } catch (error) {
        results.push({ 
          success: false, 
          error: error instanceof Error ? error.message : "Unknown error",
          positionData: blockchainPosition 
        });
      }
    }
    
    return {
      syncedCount: results.filter(r => r.success).length,
      failedCount: results.filter(r => !r.success).length,
      results,
      timestamp: args.syncTimestamp || Date.now(),
    };
  },
});
