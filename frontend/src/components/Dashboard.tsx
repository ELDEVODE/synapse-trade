'use client';

import { useConvexUser, useConvexTransactions, useConvexContracts } from '@/hooks/useConvexStellar';

export default function Dashboard() {
  const { userStats, isLoading: userLoading } = useConvexUser();
  const { transactions, stats, isLoading: txLoading } = useConvexTransactions();
  const { favoriteContracts, interactions, isLoading: contractsLoading } = useConvexContracts();

  if (userLoading || txLoading || contractsLoading) {
    return (
      <div className="p-6 bg-white rounded-lg shadow">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!userStats) {
    return (
      <div className="p-6 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-blue-800">Connect your wallet to see your dashboard</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* User Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-blue-600">{stats?.total || 0}</div>
          <div className="text-sm text-gray-600">Total Transactions</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-green-600">{stats?.successful || 0}</div>
          <div className="text-sm text-gray-600">Successful</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-purple-600">{userStats.totalContractInteractions}</div>
          <div className="text-sm text-gray-600">Contract Calls</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-orange-600">{userStats.favoriteContracts}</div>
          <div className="text-sm text-gray-600">Favorite Contracts</div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Recent Transactions</h3>
        {transactions.length === 0 ? (
          <p className="text-gray-500">No transactions yet</p>
        ) : (
          <div className="space-y-3">
            {transactions.slice(0, 5).map((tx) => (
              <div key={tx._id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div>
                  <div className="font-mono text-sm text-gray-600">
                    {tx.hash.slice(0, 12)}...{tx.hash.slice(-8)}
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <span className="capitalize">{tx.type.replace('_', ' ')}</span>
                    {tx.amount && (
                      <span className="text-gray-500">
                        {tx.amount} {tx.asset || 'XLM'}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    tx.status === 'success' ? 'bg-green-100 text-green-800' :
                    tx.status === 'failed' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {tx.status}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {new Date(tx.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Favorite Contracts */}
      {favoriteContracts.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Favorite Contracts</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {favoriteContracts.map((favorite) => (
              <div key={favorite._id} className="p-4 border border-gray-200 rounded-lg">
                <div className="font-medium">{favorite.name || 'Unnamed Contract'}</div>
                <div className="font-mono text-sm text-gray-600 mt-1">
                  {favorite.contractAddress.slice(0, 12)}...{favorite.contractAddress.slice(-8)}
                </div>
                {favorite.contract && (
                  <div className="text-sm text-gray-500 mt-2">
                    Network: {favorite.contract.network}
                  </div>
                )}
                {favorite.notes && (
                  <div className="text-sm text-gray-700 mt-2">{favorite.notes}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Contract Interactions */}
      {interactions.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Recent Contract Interactions</h3>
          <div className="space-y-3">
            {interactions.slice(0, 5).map((interaction) => (
              <div key={interaction._id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div>
                  <div className="font-medium">{interaction.functionName}</div>
                  <div className="font-mono text-sm text-gray-600">
                    {interaction.contractAddress.slice(0, 12)}...{interaction.contractAddress.slice(-8)}
                  </div>
                </div>
                <div className="text-right">
                  <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    interaction.status === 'success' ? 'bg-green-100 text-green-800' :
                    interaction.status === 'failed' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {interaction.status}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {new Date(interaction.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transaction Statistics */}
      {stats && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Transaction Breakdown</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-lg font-bold text-blue-600">{stats.byType.payment}</div>
              <div className="text-sm text-gray-600">Payments</div>
            </div>
            <div>
              <div className="text-lg font-bold text-purple-600">{stats.byType.contract_call}</div>
              <div className="text-sm text-gray-600">Contract Calls</div>
            </div>
            <div>
              <div className="text-lg font-bold text-green-600">{stats.byType.create_account}</div>
              <div className="text-sm text-gray-600">Account Creation</div>
            </div>
            <div>
              <div className="text-lg font-bold text-gray-600">{stats.byType.other}</div>
              <div className="text-sm text-gray-600">Other</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
