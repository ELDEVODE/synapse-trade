import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get or create a user based on Stellar public key
export const getOrCreateUser = mutation({
  args: {
    publicKey: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    email: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_publicKey", (q) => q.eq("publicKey", args.publicKey))
      .unique();

    if (existing) {
      // Update last active time
      await ctx.db.patch(existing._id, {
        lastActive: Date.now(),
      });
      return existing._id;
    }

    // Create new user
    const userId = await ctx.db.insert("users", {
      publicKey: args.publicKey,
      firstName: args.firstName,
      lastName: args.lastName,
      email: args.email,
      createdAt: Date.now(),
      lastActive: Date.now(),
    });

    return userId;
  },
});

// Get user by public key
export const getUserByPublicKey = query({
  args: { publicKey: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_publicKey", (q) => q.eq("publicKey", args.publicKey))
      .unique();
  },
});

// Update user profile
export const updateUserProfile = mutation({
  args: {
    publicKey: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    email: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_publicKey", (q) => q.eq("publicKey", args.publicKey))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    await ctx.db.patch(user._id, {
      firstName: args.firstName,
      lastName: args.lastName,
      email: args.email,
      lastActive: Date.now(),
    });

    return user._id;
  },
});

// Get user activity stats
export const getUserStats = query({
  args: { publicKey: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_publicKey", (q) => q.eq("publicKey", args.publicKey))
      .unique();

    if (!user) {
      return null;
    }

    // Get transaction count
    const transactions = await ctx.db
      .query("transactions")
      .withIndex("by_user", (q) => q.eq("userPublicKey", args.publicKey))
      .collect();

    // Get contract interactions count
    const contractInteractions = await ctx.db
      .query("contractInteractions")
      .withIndex("by_caller", (q) => q.eq("callerPublicKey", args.publicKey))
      .collect();

    // Get favorite contracts count
    const favoriteContracts = await ctx.db
      .query("userContracts")
      .withIndex("by_favorites", (q) => 
        q.eq("userPublicKey", args.publicKey).eq("isFavorite", true)
      )
      .collect();

    return {
      user,
      totalTransactions: transactions.length,
      totalContractInteractions: contractInteractions.length,
      favoriteContracts: favoriteContracts.length,
      successfulTransactions: transactions.filter(t => t.status === "success").length,
      failedTransactions: transactions.filter(t => t.status === "failed").length,
    };
  },
});
