"use client";

import React, { useState, useEffect } from "react";
import { useWallet } from "@/hooks/useWallet";

export const ConsumerLandingPage: React.FC = () => {
  const { isConnected, publicKey, isLoading, error, connect } = useWallet();
  const [currentFeature, setCurrentFeature] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  const features = [
    {
      icon: "🤖",
      title: "AI-Powered Trading",
      description: "Advanced AI analyzes market conditions and provides intelligent trading recommendations with risk management insights.",
      benefits: ["Smart position sizing", "Risk assessment", "Market sentiment analysis", "Portfolio optimization"]
    },
    {
      icon: "⚡",
      title: "Lightning Fast",
      description: "Built on Stellar's high-performance network with sub-second transaction times and minimal fees.",
      benefits: ["Sub-second execution", "Low fees", "High throughput", "Global accessibility"]
    },
    {
      icon: "🛡️",
      title: "Secure & Decentralized",
      description: "Your funds are secured by smart contracts on the Stellar blockchain with no central authority.",
      benefits: ["Non-custodial", "Smart contract security", "Transparent operations", "Audit-ready code"]
    },
    {
      icon: "📊",
      title: "Advanced Analytics",
      description: "Comprehensive performance metrics, risk analysis, and portfolio insights to optimize your trading strategy.",
      benefits: ["Real-time P&L", "Risk metrics", "Performance tracking", "Historical analysis"]
    }
  ];

  const stats = [
    { label: "Up to 10x", value: "Leverage" },
    { label: "< 1s", value: "Execution Time" },
    { label: "$0.01", value: "Transaction Fee" },
    { label: "24/7", value: "Market Access" }
  ];

  const testimonials = [
    {
      name: "Alex Chen",
      role: "Professional Trader",
      content: "The AI insights have completely transformed my trading strategy. The risk management features are incredible.",
      avatar: "👨‍💼"
    },
    {
      name: "Sarah Johnson",
      role: "DeFi Enthusiast",
      content: "Finally, a perpetual futures platform that's both powerful and user-friendly. The Stellar integration is seamless.",
      avatar: "👩‍💻"
    },
    {
      name: "Mike Rodriguez",
      role: "Crypto Investor",
      content: "The low fees and fast execution make this my go-to platform for leveraged trading. Highly recommended!",
      avatar: "👨‍🎓"
    }
  ];

  useEffect(() => {
    setIsVisible(true);
    const interval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % features.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [features.length]);

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-cyan-900/20">
          <div className="absolute inset-0 opacity-20" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}></div>
        </div>

        <div className="relative z-10 px-6 py-20">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <div className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                <h1 className="text-5xl md:text-7xl font-bold mb-6">
                  <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
                    Synapse Trade
                  </span>
                </h1>
                <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
                  The future of decentralized perpetual futures trading. 
                  <span className="text-purple-400 font-semibold"> AI-powered</span>, 
                  <span className="text-blue-400 font-semibold"> lightning-fast</span>, and 
                  <span className="text-green-400 font-semibold"> secure</span>.
                </p>
              </div>

              <div className={`transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-800 rounded-2xl p-8 max-w-md mx-auto">
                  {isLoading ? (
                    <div className="flex items-center justify-center space-x-2 text-white p-4">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-500"></div>
                      <span>Checking wallet connection...</span>
                    </div>
                  ) : isConnected && publicKey ? (
                    <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-purple-400 font-medium">Wallet Connected</p>
                          <p className="text-sm text-gray-400 mt-1 font-mono">
                            {`${publicKey.slice(0, 6)}...${publicKey.slice(-6)}`}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center">
                      <p className="text-gray-400 mb-4">
                        Connect your Stellar wallet to start trading
                      </p>
                      <button
                        onClick={connect}
                        disabled={isLoading}
                        className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isLoading ? "Connecting..." : "Connect Freighter Wallet"}
                      </button>
                      {error && (
                        <p className="text-red-400 text-sm mt-2">{error}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className={`grid grid-cols-2 md:grid-cols-4 gap-6 mb-16 transition-all duration-1000 delay-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-3xl md:text-4xl font-bold text-purple-400 mb-2">
                    {stat.label}
                  </div>
                  <div className="text-gray-400">{stat.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Why Choose <span className="text-purple-400">Synapse Trade</span>?
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Experience the next generation of decentralized trading with cutting-edge AI and blockchain technology.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Feature Display */}
            <div className="relative">
              <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800 min-h-[400px] flex flex-col justify-center">
                <div className="text-6xl mb-6 text-center">
                  {features[currentFeature].icon}
                </div>
                <h3 className="text-2xl font-bold mb-4 text-center">
                  {features[currentFeature].title}
                </h3>
                <p className="text-gray-400 text-center mb-6">
                  {features[currentFeature].description}
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {features[currentFeature].benefits.map((benefit, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                      <span className="text-sm text-gray-300">{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Feature Navigation Dots */}
              <div className="flex justify-center mt-6 space-x-2">
                {features.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentFeature(index)}
                    className={`w-3 h-3 rounded-full transition-colors ${
                      index === currentFeature ? 'bg-purple-400' : 'bg-gray-600'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Feature List */}
            <div className="space-y-6">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className={`p-6 rounded-xl border transition-all cursor-pointer ${
                    index === currentFeature
                      ? 'border-purple-500 bg-purple-500/10'
                      : 'border-gray-800 bg-gray-900/50 hover:border-gray-700'
                  }`}
                  onClick={() => setCurrentFeature(index)}
                >
                  <div className="flex items-center space-x-4">
                    <div className="text-3xl">{feature.icon}</div>
                    <div>
                      <h4 className="text-xl font-semibold mb-2">{feature.title}</h4>
                      <p className="text-gray-400 text-sm">{feature.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="py-20 px-6 bg-gray-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              How It <span className="text-purple-400">Works</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Get started with decentralized perpetual futures trading in just a few simple steps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Connect Wallet",
                description: "Connect your Stellar wallet using Freighter or any compatible wallet to access the platform.",
                icon: "🔗"
              },
              {
                step: "02",
                title: "AI Analysis",
                description: "Our AI analyzes market conditions and provides intelligent trading recommendations with risk insights.",
                icon: "🤖"
              },
              {
                step: "03",
                title: "Trade & Earn",
                description: "Execute trades with up to 10x leverage, manage risk with AI assistance, and track performance in real-time.",
                icon: "📈"
              }
            ].map((step, index) => (
              <div key={index} className="text-center">
                <div className="relative mb-6">
                  <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto text-2xl">
                    {step.icon}
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-sm font-bold">
                    {step.step}
                  </div>
                </div>
                <h3 className="text-xl font-semibold mb-4">{step.title}</h3>
                <p className="text-gray-400">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Testimonials */}
      <div className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              What Traders <span className="text-purple-400">Say</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Join thousands of traders who have revolutionized their trading with Synapse Trade.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-gray-900 rounded-xl p-6 border border-gray-800">
                <div className="flex items-center mb-4">
                  <div className="text-3xl mr-4">{testimonial.avatar}</div>
                  <div>
                    <h4 className="font-semibold">{testimonial.name}</h4>
                    <p className="text-sm text-gray-400">{testimonial.role}</p>
                  </div>
                </div>
                <p className="text-gray-300 italic">&quot;{testimonial.content}&quot;</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20 px-6 bg-gradient-to-r from-purple-900/20 to-blue-900/20">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Start <span className="text-purple-400">Trading</span>?
          </h2>
          <p className="text-xl text-gray-400 mb-8">
            Join the future of decentralized trading. Connect your wallet and start trading with AI-powered insights.
          </p>
          <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-800 rounded-2xl p-8 max-w-md mx-auto">
            {isLoading ? (
              <div className="flex items-center justify-center space-x-2 text-white p-4">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-500"></div>
                <span>Checking wallet connection...</span>
              </div>
            ) : isConnected && publicKey ? (
              <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-400 font-medium">Wallet Connected</p>
                    <p className="text-sm text-gray-400 mt-1 font-mono">
                      {`${publicKey.slice(0, 6)}...${publicKey.slice(-6)}`}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-gray-400 mb-4">
                  Connect your Stellar wallet to start trading
                </p>
                <button
                  onClick={connect}
                  disabled={isLoading}
                  className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? "Connecting..." : "Connect Freighter Wallet"}
                </button>
                {error && (
                  <p className="text-red-400 text-sm mt-2">{error}</p>
                )}
              </div>
            )}
          </div>
          <div className="mt-8 text-sm text-gray-500">
            <p>🔒 Non-custodial • ⚡ Lightning fast • 🤖 AI-powered • 🛡️ Secure</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="py-12 px-6 border-t border-gray-800">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-6 md:mb-0">
              <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                Synapse Trade
              </h3>
              <p className="text-gray-400 mt-2">Decentralized Perpetual Futures on Stellar</p>
            </div>
            <div className="flex space-x-6 text-sm text-gray-400">
              <a href="#" className="hover:text-white transition-colors">Documentation</a>
              <a href="#" className="hover:text-white transition-colors">Support</a>
              <a href="#" className="hover:text-white transition-colors">GitHub</a>
              <a href="#" className="hover:text-white transition-colors">Discord</a>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-center text-sm text-gray-500">
            <p>© 2024 Synapse Trade. Built on Stellar Network. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
