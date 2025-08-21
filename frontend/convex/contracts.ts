import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Register a new contract deployment
export const registerContract = mutation({
  args: {
    address: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    deployerPublicKey: v.string(),
    deploymentTxHash: v.string(),
    abi: v.optional(v.string()),
    sourceCode: v.optional(v.string()),
    network: v.union(v.literal("testnet"), v.literal("mainnet")),
    version: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if contract already exists
    const existing = await ctx.db
      .query("contracts")
      .withIndex("by_address", (q) => q.eq("address", args.address))
      .unique();

    if (existing) {
      throw new Error("Contract with this address already exists");
    }

    // Create contract record
    const contractId = await ctx.db.insert("contracts", {
      ...args,
      isActive: true,
      deployedAt: Date.now(),
      lastInteraction: Date.now(),
    });

    // Automatically add to deployer's favorites
    await ctx.db.insert("userContracts", {
      userPublicKey: args.deployerPublicKey,
      contractAddress: args.address,
      name: args.name,
      isFavorite: true,
      addedAt: Date.now(),
    });

    return contractId;
  },
});

// Get all contracts
export const getContracts = query({
  args: {
    network: v.optional(v.union(v.literal("testnet"), v.literal("mainnet"))),
    isActive: v.optional(v.boolean()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let contracts;

    if (args.network) {
      contracts = await ctx.db
        .query("contracts")
        .withIndex("by_network", (q) => q.eq("network", args.network!))
        .order("desc")
        .collect();
    } else {
      contracts = await ctx.db
        .query("contracts")
        .order("desc")
        .collect();
    }

    // Filter by isActive if specified
    if (args.isActive !== undefined) {
      contracts = contracts.filter(contract => contract.isActive === args.isActive);
    }

    // Apply limit
    return contracts.slice(0, args.limit || 50);
  },
});

// Get contract by address
export const getContractByAddress = query({
  args: { address: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("contracts")
      .withIndex("by_address", (q) => q.eq("address", args.address))
      .unique();
  },
});

// Get contracts deployed by a user
export const getUserContracts = query({
  args: { deployerPublicKey: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("contracts")
      .withIndex("by_deployer", (q) => q.eq("deployerPublicKey", args.deployerPublicKey))
      .order("desc")
      .collect();
  },
});

// Record contract interaction
export const recordContractInteraction = mutation({
  args: {
    contractAddress: v.string(),
    functionName: v.string(),
    callerPublicKey: v.string(),
    txHash: v.string(),
    parameters: v.optional(v.string()),
    result: v.optional(v.string()),
    gasUsed: v.optional(v.number()),
    status: v.union(v.literal("pending"), v.literal("success"), v.literal("failed")),
    errorMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if interaction already exists
    const existing = await ctx.db
      .query("contractInteractions")
      .withIndex("by_tx_hash", (q) => q.eq("txHash", args.txHash))
      .unique();

    if (existing) {
      // Update existing interaction
      await ctx.db.patch(existing._id, {
        result: args.result,
        gasUsed: args.gasUsed,
        status: args.status,
        errorMessage: args.errorMessage,
      });
      return existing._id;
    }

    // Create new interaction record
    const interactionId = await ctx.db.insert("contractInteractions", {
      ...args,
      createdAt: Date.now(),
    });

    // Update contract's last interaction time
    const contract = await ctx.db
      .query("contracts")
      .withIndex("by_address", (q) => q.eq("address", args.contractAddress))
      .unique();

    if (contract) {
      await ctx.db.patch(contract._id, {
        lastInteraction: Date.now(),
      });
    }

    // Create notification for contract interaction
    if (args.status === "success") {
      await ctx.db.insert("notifications", {
        userPublicKey: args.callerPublicKey,
        type: "contract_interaction",
        title: "Contract Interaction Success",
        message: `Successfully called ${args.functionName} on contract ${args.contractAddress.slice(0, 8)}...`,
        isRead: false,
        priority: "low",
        relatedTxHash: args.txHash,
        relatedContractAddress: args.contractAddress,
        createdAt: Date.now(),
      });
    }

    return interactionId;
  },
});

// Get contract interactions
export const getContractInteractions = query({
  args: {
    contractAddress: v.optional(v.string()),
    callerPublicKey: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    if (args.contractAddress) {
      return await ctx.db
        .query("contractInteractions")
        .withIndex("by_contract", (q) => q.eq("contractAddress", args.contractAddress!))
        .order("desc")
        .take(args.limit || 50);
    } else if (args.callerPublicKey) {
      return await ctx.db
        .query("contractInteractions")
        .withIndex("by_caller", (q) => q.eq("callerPublicKey", args.callerPublicKey!))
        .order("desc")
        .take(args.limit || 50);
    } else {
      return await ctx.db
        .query("contractInteractions")
        .order("desc")
        .take(args.limit || 50);
    }
  },
});

// Add contract to user's favorites
export const addToFavorites = mutation({
  args: {
    userPublicKey: v.string(),
    contractAddress: v.string(),
    name: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if already in user's list
    const existing = await ctx.db
      .query("userContracts")
      .withIndex("by_user_contract", (q) => 
        q.eq("userPublicKey", args.userPublicKey).eq("contractAddress", args.contractAddress)
      )
      .unique();

    if (existing) {
      // Update to favorite
      await ctx.db.patch(existing._id, {
        isFavorite: true,
        name: args.name || existing.name,
        notes: args.notes || existing.notes,
      });
      return existing._id;
    }

    // Add new favorite
    return await ctx.db.insert("userContracts", {
      userPublicKey: args.userPublicKey,
      contractAddress: args.contractAddress,
      name: args.name,
      notes: args.notes,
      isFavorite: true,
      addedAt: Date.now(),
    });
  },
});

// Get user's favorite contracts
export const getUserFavorites = query({
  args: { userPublicKey: v.string() },
  handler: async (ctx, args) => {
    const favorites = await ctx.db
      .query("userContracts")
      .withIndex("by_favorites", (q) => 
        q.eq("userPublicKey", args.userPublicKey).eq("isFavorite", true)
      )
      .collect();

    // Get contract details for each favorite
    const favoriteContracts = await Promise.all(
      favorites.map(async (favorite) => {
        const contract = await ctx.db
          .query("contracts")
          .withIndex("by_address", (q) => q.eq("address", favorite.contractAddress))
          .unique();
        
        return {
          ...favorite,
          contract,
        };
      })
    );

    return favoriteContracts.filter(f => f.contract !== null);
  },
});
