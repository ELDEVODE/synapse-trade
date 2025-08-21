import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Record a new transaction
export const recordTransaction = mutation({
  args: {
    hash: v.string(),
    userPublicKey: v.string(),
    type: v.union(
      v.literal("payment"),
      v.literal("contract_call"),
      v.literal("create_account"),
      v.literal("other")
    ),
    amount: v.optional(v.string()),
    asset: v.optional(v.string()),
    sourceAccount: v.string(),
    destinationAccount: v.optional(v.string()),
    contractAddress: v.optional(v.string()),
    functionName: v.optional(v.string()),
    status: v.union(v.literal("pending"), v.literal("success"), v.literal("failed")),
    ledger: v.optional(v.number()),
    stellarCreatedAt: v.optional(v.string()),
    memo: v.optional(v.string()),
    fee: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if transaction already exists
    const existing = await ctx.db
      .query("transactions")
      .withIndex("by_hash", (q) => q.eq("hash", args.hash))
      .unique();

    if (existing) {
      // Update existing transaction
      await ctx.db.patch(existing._id, {
        status: args.status,
        ledger: args.ledger,
        stellarCreatedAt: args.stellarCreatedAt,
      });
      return existing._id;
    }

    // Create new transaction record
    const transactionId = await ctx.db.insert("transactions", {
      ...args,
      createdAt: Date.now(),
    });

    // Create notification if transaction failed
    if (args.status === "failed") {
      await ctx.db.insert("notifications", {
        userPublicKey: args.userPublicKey,
        type: "transaction_failed",
        title: "Transaction Failed",
        message: `Transaction ${args.hash.slice(0, 8)}... failed to process`,
        isRead: false,
        priority: "medium",
        relatedTxHash: args.hash,
        createdAt: Date.now(),
      });
    } else if (args.status === "success") {
      await ctx.db.insert("notifications", {
        userPublicKey: args.userPublicKey,
        type: "transaction_confirmed",
        title: "Transaction Confirmed",
        message: `Transaction ${args.hash.slice(0, 8)}... confirmed successfully`,
        isRead: false,
        priority: "low",
        relatedTxHash: args.hash,
        createdAt: Date.now(),
      });
    }

    return transactionId;
  },
});

// Get transactions for a user
export const getUserTransactions = query({
  args: {
    userPublicKey: v.string(),
    limit: v.optional(v.number()),
    status: v.optional(v.union(v.literal("pending"), v.literal("success"), v.literal("failed"))),
  },
  handler: async (ctx, args) => {
    const transactions = await ctx.db
      .query("transactions")
      .withIndex("by_user", (q) => q.eq("userPublicKey", args.userPublicKey))
      .order("desc")
      .take(args.limit || 50);

    // Filter by status if specified
    if (args.status) {
      return transactions.filter(tx => tx.status === args.status);
    }

    return transactions;
  },
});

// Get transaction by hash
export const getTransactionByHash = query({
  args: { hash: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("transactions")
      .withIndex("by_hash", (q) => q.eq("hash", args.hash))
      .unique();
  },
});

// Update transaction status
export const updateTransactionStatus = mutation({
  args: {
    hash: v.string(),
    status: v.union(v.literal("pending"), v.literal("success"), v.literal("failed")),
    ledger: v.optional(v.number()),
    stellarCreatedAt: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const transaction = await ctx.db
      .query("transactions")
      .withIndex("by_hash", (q) => q.eq("hash", args.hash))
      .unique();

    if (!transaction) {
      throw new Error("Transaction not found");
    }

    await ctx.db.patch(transaction._id, {
      status: args.status,
      ledger: args.ledger,
      stellarCreatedAt: args.stellarCreatedAt,
    });

    return transaction._id;
  },
});

// Get recent transactions across all users (admin view)
export const getRecentTransactions = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("transactions")
      .order("desc")
      .take(args.limit || 20);
  },
});

// Get transaction statistics
export const getTransactionStats = query({
  args: {
    userPublicKey: v.optional(v.string()),
    timeframe: v.optional(v.union(v.literal("24h"), v.literal("7d"), v.literal("30d"))),
  },
  handler: async (ctx, args) => {
    let transactions;

    if (args.userPublicKey) {
      transactions = await ctx.db
        .query("transactions")
        .withIndex("by_user", (q) => q.eq("userPublicKey", args.userPublicKey!))
        .collect();
    } else {
      transactions = await ctx.db
        .query("transactions")
        .collect();
    }

    // Filter by timeframe if specified
    let filteredTransactions = transactions;
    if (args.timeframe) {
      const now = Date.now();
      let cutoff = now;
      
      switch (args.timeframe) {
        case "24h":
          cutoff = now - 24 * 60 * 60 * 1000;
          break;
        case "7d":
          cutoff = now - 7 * 24 * 60 * 60 * 1000;
          break;
        case "30d":
          cutoff = now - 30 * 24 * 60 * 60 * 1000;
          break;
      }
      
      filteredTransactions = transactions.filter(t => t.createdAt >= cutoff);
    }

    const stats = {
      total: filteredTransactions.length,
      successful: filteredTransactions.filter(t => t.status === "success").length,
      failed: filteredTransactions.filter(t => t.status === "failed").length,
      pending: filteredTransactions.filter(t => t.status === "pending").length,
      byType: {
        payment: filteredTransactions.filter(t => t.type === "payment").length,
        contract_call: filteredTransactions.filter(t => t.type === "contract_call").length,
        create_account: filteredTransactions.filter(t => t.type === "create_account").length,
        other: filteredTransactions.filter(t => t.type === "other").length,
      },
    };

    return stats;
  },
});
