import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Portfolio analytics for AI-powered insights
export const getPortfolioAnalytics = query({
  args: { userPublicKey: v.string() },
  handler: async (ctx, args) => {
    // Get user's positions
    const positions = await ctx.db
      .query("positions")
      .withIndex("by_user", (q) => q.eq("userPublicKey", args.userPublicKey))
      .collect();

    // Get user's trades
    const trades = await ctx.db
      .query("trades")
      .withIndex("by_user", (q) => q.eq("userPublicKey", args.userPublicKey))
      .collect();

    if (positions.length === 0 && trades.length === 0) {
      return null;
    }

    // Calculate portfolio metrics
    const openPositions = positions.filter(p => p.isOpen);
    const closedPositions = positions.filter(p => !p.isOpen);
    
    // Calculate total portfolio value
    const totalCollateral = openPositions.reduce((sum, pos) => {
      return sum + parseFloat(pos.collateral || "0");
    }, 0);

    // Calculate total PnL from closed positions
    const totalPnL = closedPositions.reduce((sum, pos) => {
      return sum + parseFloat(pos.pnl || "0");
    }, 0);

    // Calculate unrealized PnL (simplified - would need current prices)
    const unrealizedPnL = openPositions.reduce((sum, pos) => {
      return sum + parseFloat(pos.pnl || "0");
    }, 0);

    // Asset distribution
    const assetDistribution = positions.reduce((dist: Record<string, number>, pos) => {
      const collateral = parseFloat(pos.collateral || "0");
      dist[pos.asset] = (dist[pos.asset] || 0) + collateral;
      return dist;
    }, {});

    // Trade statistics
    const winningTrades = trades.filter(trade => {
      // Determine if trade was profitable based on type and position
      return trade.type.includes("close") && parseFloat(trade.pnl || "0") > 0;
    });

    const losingTrades = trades.filter(trade => {
      return trade.type.includes("close") && parseFloat(trade.pnl || "0") < 0;
    });

    const winRate = trades.length > 0 ? (winningTrades.length / trades.length) * 100 : 0;

    // Risk metrics
    const leverageDistribution = openPositions.reduce((dist: Record<number, number>, pos) => {
      dist[pos.leverage] = (dist[pos.leverage] || 0) + 1;
      return dist;
    }, {});

    const avgLeverage = openPositions.length > 0 
      ? openPositions.reduce((sum, pos) => sum + pos.leverage, 0) / openPositions.length
      : 0;

    // Diversification score (simplified)
    const uniqueAssets = new Set(positions.map(p => p.asset)).size;
    const diversificationScore = Math.min(100, (uniqueAssets / 5) * 100); // Max score at 5+ assets

    // Risk score calculation
    const riskFactors = {
      leverage: Math.min(100, (avgLeverage / 10) * 100), // Higher leverage = higher risk
      concentration: 100 - diversificationScore, // Less diversification = higher risk
      positionCount: Math.min(50, openPositions.length * 10), // More positions = slightly higher risk
    };

    const riskScore = Math.max(0, 100 - (
      (riskFactors.leverage * 0.4) + 
      (riskFactors.concentration * 0.4) + 
      (riskFactors.positionCount * 0.2)
    ));

    return {
      // Portfolio Overview
      totalCollateral: totalCollateral.toString(),
      totalPnL: totalPnL.toString(),
      unrealizedPnL: unrealizedPnL.toString(),
      openPositions: openPositions.length,
      totalPositions: positions.length,
      
      // Performance Metrics
      winRate: Math.round(winRate * 100) / 100,
      totalTrades: trades.length,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      
      // Risk Metrics
      riskScore: Math.round(riskScore * 100) / 100,
      diversificationScore: Math.round(diversificationScore * 100) / 100,
      avgLeverage: Math.round(avgLeverage * 100) / 100,
      
      // Distributions
      assetDistribution,
      leverageDistribution,
      
      // Time-based metrics
      lastTradeTime: trades.length > 0 ? Math.max(...trades.map(t => t.timestamp)) : null,
      firstTradeTime: trades.length > 0 ? Math.min(...trades.map(t => t.timestamp)) : null,
      
      // Calculated at
      calculatedAt: Date.now(),
    };
  },
});

// Store portfolio snapshot for historical analysis
export const storePortfolioSnapshot = mutation({
  args: {
    userPublicKey: v.string(),
    analytics: v.any(), // Portfolio analytics object
    marketConditions: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("portfolioSnapshots", {
      userPublicKey: args.userPublicKey,
      analytics: args.analytics,
      marketConditions: args.marketConditions,
      timestamp: Date.now(),
    });
  },
});

// Get portfolio performance over time
export const getPortfolioPerformance = query({
  args: { 
    userPublicKey: v.string(),
    timeframe: v.optional(v.union(v.literal("1d"), v.literal("7d"), v.literal("30d"), v.literal("all")))
  },
  handler: async (ctx, args) => {
    const timeframe = args.timeframe || "30d";
    
    let startTime = 0;
    const now = Date.now();
    
    switch (timeframe) {
      case "1d":
        startTime = now - (24 * 60 * 60 * 1000);
        break;
      case "7d":
        startTime = now - (7 * 24 * 60 * 60 * 1000);
        break;
      case "30d":
        startTime = now - (30 * 24 * 60 * 60 * 1000);
        break;
      case "all":
        startTime = 0;
        break;
    }

    // Get portfolio snapshots
    const snapshots = await ctx.db
      .query("portfolioSnapshots")
      .withIndex("by_user_time", (q) => 
        q.eq("userPublicKey", args.userPublicKey)
         .gte("timestamp", startTime)
      )
      .order("asc")
      .collect();

    // Get trades in timeframe
    const trades = await ctx.db
      .query("trades")
      .withIndex("by_user", (q) => q.eq("userPublicKey", args.userPublicKey))
      .filter((q) => q.gte(q.field("timestamp"), startTime))
      .collect();

    // Calculate performance metrics
    const performanceData = snapshots.map(snapshot => ({
      timestamp: snapshot.timestamp,
      portfolioValue: parseFloat(snapshot.analytics.totalCollateral || "0"),
      totalPnL: parseFloat(snapshot.analytics.totalPnL || "0"),
      riskScore: snapshot.analytics.riskScore || 0,
      openPositions: snapshot.analytics.openPositions || 0,
    }));

    // Calculate returns
    let returns = 0;
    if (performanceData.length >= 2) {
      const firstValue = performanceData[0].portfolioValue;
      const lastValue = performanceData[performanceData.length - 1].portfolioValue;
      returns = firstValue > 0 ? ((lastValue - firstValue) / firstValue) * 100 : 0;
    }

    return {
      timeframe,
      performanceData,
      totalTrades: trades.length,
      returns: Math.round(returns * 100) / 100,
      startTime,
      endTime: now,
    };
  },
});

// Get asset performance breakdown
export const getAssetPerformance = query({
  args: { userPublicKey: v.string() },
  handler: async (ctx, args) => {
    const trades = await ctx.db
      .query("trades")
      .withIndex("by_user", (q) => q.eq("userPublicKey", args.userPublicKey))
      .collect();

    const positions = await ctx.db
      .query("positions")
      .withIndex("by_user", (q) => q.eq("userPublicKey", args.userPublicKey))
      .collect();

    // Group by asset
    const assetStats = positions.reduce((assetStats: Record<string, any>, pos) => {
      const asset = pos.asset;
      if (!assetStats[asset]) {
        assetStats[asset] = {
          asset,
          totalPnL: 0,
          totalVolume: 0,
          winningTrades: 0,
          losingTrades: 0,
          totalTrades: 0,
          avgLeverage: 0,
          positions: [],
        };
      }

      assetStats[asset].totalPnL += parseFloat(pos.pnl || "0");
      assetStats[asset].totalVolume += parseFloat(pos.size || "0");
      assetStats[asset].avgLeverage += pos.leverage;
      assetStats[asset].positions.push(pos);

      return assetStats;
    }, {});

    // Add trade statistics
    trades.forEach(trade => {
      const asset = trade.asset;
      if (assetStats[asset]) {
        assetStats[asset].totalTrades += 1;
        if (parseFloat(trade.pnl || "0") > 0) {
          assetStats[asset].winningTrades += 1;
        } else if (parseFloat(trade.pnl || "0") < 0) {
          assetStats[asset].losingTrades += 1;
        }
      }
    });

    // Calculate final metrics
    const assetPerformance = Object.values(assetStats).map((stat: any) => ({
      asset: stat.asset,
      totalPnL: Math.round(stat.totalPnL * 100) / 100,
      totalVolume: Math.round(stat.totalVolume * 100) / 100,
      winRate: stat.totalTrades > 0 ? Math.round((stat.winningTrades / stat.totalTrades) * 10000) / 100 : 0,
      avgLeverage: stat.positions.length > 0 ? Math.round((stat.avgLeverage / stat.positions.length) * 100) / 100 : 0,
      totalTrades: stat.totalTrades,
      openPositions: stat.positions.filter((p: any) => p.isOpen).length,
    }));

    return assetPerformance.sort((a, b) => b.totalPnL - a.totalPnL);
  },
});

// Risk analysis for AI insights
export const getRiskAnalysis = query({
  args: { userPublicKey: v.string() },
  handler: async (ctx, args) => {
    const positions = await ctx.db
      .query("positions")
      .withIndex("by_user_open", (q) => 
        q.eq("userPublicKey", args.userPublicKey)
         .eq("isOpen", true)
      )
      .collect();

    if (positions.length === 0) {
      return {
        overallRisk: "low",
        riskScore: 100,
        factors: [],
        recommendations: [],
        positionRisks: [],
      };
    }

    // Analyze individual position risks
    const positionRisks = positions.map(pos => {
      const leverage = pos.leverage;
      const size = parseFloat(pos.size || "0");
      const collateral = parseFloat(pos.collateral || "0");
      
      let riskLevel = "low";
      let riskScore = 100;
      
      // Risk factors
      if (leverage > 5) {
        riskLevel = leverage > 10 ? "high" : "medium";
        riskScore -= (leverage - 1) * 5;
      }
      
      if (size > collateral * 2) {
        riskLevel = "high";
        riskScore -= 20;
      }

      return {
        positionId: pos.positionId,
        asset: pos.asset,
        riskLevel,
        riskScore: Math.max(0, riskScore),
        factors: [
          leverage > 5 ? `High leverage (${leverage}x)` : null,
          size > collateral * 2 ? "Large position size" : null,
        ].filter(Boolean),
      };
    });

    // Overall risk assessment
    const avgRiskScore = positionRisks.reduce((sum, pr) => sum + pr.riskScore, 0) / positionRisks.length;
    const highRiskPositions = positionRisks.filter(pr => pr.riskLevel === "high").length;
    
    let overallRisk = "low";
    if (avgRiskScore < 50 || highRiskPositions > 2) {
      overallRisk = "high";
    } else if (avgRiskScore < 75 || highRiskPositions > 0) {
      overallRisk = "medium";
    }

    // Risk factors
    const factors = [];
    if (highRiskPositions > 0) {
      factors.push(`${highRiskPositions} high-risk position${highRiskPositions > 1 ? 's' : ''}`);
    }
    
    const avgLeverage = positions.reduce((sum, pos) => sum + pos.leverage, 0) / positions.length;
    if (avgLeverage > 5) {
      factors.push(`High average leverage (${Math.round(avgLeverage * 10) / 10}x)`);
    }

    const uniqueAssets = new Set(positions.map(p => p.asset)).size;
    if (uniqueAssets < 3 && positions.length > 3) {
      factors.push("Low diversification");
    }

    // Recommendations
    const recommendations = [];
    if (overallRisk === "high") {
      recommendations.push("Consider reducing position sizes or leverage");
      recommendations.push("Implement stop-loss orders on high-risk positions");
    }
    if (uniqueAssets < 3) {
      recommendations.push("Diversify across more assets to reduce concentration risk");
    }
    if (avgLeverage > 7) {
      recommendations.push("Consider reducing leverage to manage risk");
    }

    return {
      overallRisk,
      riskScore: Math.round(avgRiskScore),
      factors,
      recommendations,
      positionRisks,
      calculatedAt: Date.now(),
    };
  },
});