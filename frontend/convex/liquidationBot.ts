import { v } from "convex/values";
import { action, query, mutation } from "./_generated/server";
import { api } from "./_generated/api";

// Liquidation bot that monitors positions and uses AI for risk assessment
export const monitorPositions = action({
  args: {},
  handler: async (ctx) => {
    try {
      // Get all open positions
      const openPositions = await ctx.runQuery(api.liquidationBot.getOpenPositions);
      
      console.log(`Monitoring ${openPositions.length} open positions`);
      
      for (const position of openPositions) {
        // Check if position needs liquidation
        const shouldLiquidate = await ctx.runQuery(
          api.liquidationBot.checkLiquidationStatus,
          { positionId: position.positionId }
        );
        
        if (shouldLiquidate) {
          // Generate AI risk assessment before liquidation
          const riskAssessment = await ctx.runAction(api.ai.generateRiskAssessment, {
            positionId: position.positionId,
            userPublicKey: position.userPublicKey,
            asset: position.asset,
            size: position.size,
            collateral: position.collateral,
            leverage: position.leverage,
            entryPrice: position.entryPrice,
            currentPrice: position.currentPrice || "0",
          });
          
          console.log(`AI Risk Assessment for Position ${position.positionId}:`, riskAssessment);
          
          // Store liquidation event
          await ctx.runMutation(api.liquidationBot.recordLiquidation, {
            positionId: position.positionId,
            userPublicKey: position.userPublicKey,
            asset: position.asset,
            size: position.size,
            collateral: position.collateral,
            liquidationPrice: position.currentPrice || "0",
            reason: "maintenance_margin",
            txHash: `liquidated_${Date.now()}`, // In production, this would be the actual tx hash
          });
          
          // Update position status
          await ctx.runMutation(api.liquidationBot.closePosition, {
            positionId: position.positionId,
          });
          
          console.log(`Position ${position.positionId} liquidated due to insufficient margin`);
        }
      }
      
      return { positionsMonitored: openPositions.length };
    } catch (error) {
      console.error("Liquidation bot error:", error);
      throw error;
    }
  },
});

// Get all open positions
export const getOpenPositions = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("positions")
      .withIndex("by_open", (q) => q.eq("isOpen", true))
      .collect();
  },
});

// Check if a position should be liquidated
export const checkLiquidationStatus = query({
  args: { positionId: v.string() },
  handler: async (ctx, args) => {
    const position = await ctx.db
      .query("positions")
      .withIndex("by_position", (q) => q.eq("positionId", args.positionId))
      .first();
    
    if (!position || !position.isOpen) {
      return false;
    }
    
    // Get current market data for the asset
    const marketData = await ctx.db
      .query("marketData")
      .withIndex("by_asset", (q) => q.eq("asset", position.asset))
      .first();
    
    if (!marketData) {
      return false;
    }
    
    // Calculate current position value and required margin
    const currentPrice = parseFloat(marketData.price);
    const entryPrice = parseFloat(position.entryPrice);
    const size = parseFloat(position.size);
    const collateral = parseFloat(position.collateral);
    const leverage = position.leverage;
    
    // Calculate position value
    const positionValue = Math.abs(size) * currentPrice;
    const requiredMargin = positionValue / leverage;
    
    // Check if collateral is below required margin
    return collateral < requiredMargin;
  },
});

// Record liquidation event
export const recordLiquidation = mutation({
  args: {
    positionId: v.string(),
    userPublicKey: v.string(),
    asset: v.string(),
    size: v.string(),
    collateral: v.string(),
    liquidationPrice: v.string(),
    reason: v.string(),
    txHash: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("liquidations", {
      positionId: args.positionId,
      userPublicKey: args.userPublicKey,
      asset: args.asset,
      size: args.size,
      collateral: args.collateral,
      liquidationPrice: args.liquidationPrice,
      reason: args.reason,
      txHash: args.txHash,
      timestamp: Date.now(),
    });
  },
});

// Close a position (mark as closed)
export const closePosition = mutation({
  args: { positionId: v.string() },
  handler: async (ctx, args) => {
    const position = await ctx.db
      .query("positions")
      .withIndex("by_position", (q) => q.eq("positionId", args.positionId))
      .first();
    
    if (position) {
      await ctx.db.patch(position._id, {
        isOpen: false,
        lastUpdated: Date.now(),
      });
    }
  },
});

// Get liquidation history for a user
export const getLiquidationHistory = query({
  args: { userPublicKey: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("liquidations")
      .withIndex("by_user", (q) => q.eq("userPublicKey", args.userPublicKey))
      .order("desc")
      .collect();
  },
});

// Get liquidation history for an asset
export const getAssetLiquidations = query({
  args: { asset: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("liquidations")
      .withIndex("by_asset", (q) => q.eq("asset", args.asset))
      .order("desc")
      .collect();
  },
});
