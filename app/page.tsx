"use client";

import { useState } from "react";
import Link from "next/link";
import Header from "@/app/components/Header";
import { Button } from "@/app/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/app/components/ui/accordion";
import { newsletterService } from "@/app/services/supabase";

export default function LandingPage() {
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);
  const [email, setEmail] = useState("");
  const [isJoiningWaitlist, setIsJoiningWaitlist] = useState(false);
  const [waitlistMessage, setWaitlistMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenFAQ(openFAQ === index ? null : index);
  };

  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsJoiningWaitlist(true);
    setWaitlistMessage(null);

    const result = await newsletterService.subscribe(email);

    if (result.success) {
      setWaitlistMessage({
        type: "success",
        text: "🎉 You're on the app launch waitlist! We'll email you updates.",
      });
      setEmail("");
    } else {
      setWaitlistMessage({
        type: "error",
        text: result.error || "Failed to join the waitlist. Please try again.",
      });
    }

    setIsJoiningWaitlist(false);
  };

  const faqs = [
    {
      question: "What is STEPTION PROTOCOL?",
      answer:
        "STEPTION PROTOCOL is a decentralized options trading platform offering advanced features for trading, liquidity provision, and portfolio management.",
    },
    {
      question: "How do I earn rewards?",
      answer:
        "You can earn rewards by providing liquidity to options markets. Rewards are based on the APY and lockup period of the liquidity pools.",
    },
    {
      question: "What assets are supported?",
      answer:
        "STEPTION PROTOCOL supports leading cryptocurrencies such as Bitcoin, Ethereum, and more.",
    },
    {
      question: "Is STEPTION PROTOCOL secure?",
      answer:
        "Yes, STEPTION PROTOCOL uses advanced security protocols and smart contract audits to ensure the safety of your funds and trading activities.",
    },
    {
      question: "How do I get started?",
      answer:
        "Simply click 'Open App' in the header, connect your wallet, and start trading options or providing liquidity to earn rewards.",
    },
  ];

  return (
    <div className="bg-white text-gray-900 font-sans">
      <Header />
      {/* Hero Section */}
      <section id="hero" className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 min-h-screen flex items-center">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full">
          <div className="text-center">
            <div className="mb-8">
              <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-yellow-50 text-yellow-700 border border-white/20 backdrop-blur-sm">
                Built on Stellar Network
              </span>
            </div>
            <h1 className="text-6xl sm:text-7xl lg:text-8xl font-bold text-white mb-10 leading-tight tracking-tight">
              The First Options Protocol on{" "}
              <span className="bg-gradient-to-r from-yellow-300 to-yellow-400 bg-clip-text text-transparent">
                Stellar
              </span>
            </h1>
            <p className="text-3xl lg:text-4xl text-blue-100 mb-16 max-w-5xl mx-auto leading-relaxed font-light">
              Insure any asset. Hedge price risk. Earn yield.
            </p>
            <div className="flex flex-col sm:flex-row gap-8 justify-center items-center mb-20">
              <Link href="/app">
                <Button size="xl" className="bg-white text-yellow-700 hover:bg-yellow-50 px-12 py-6 text-xl font-semibold shadow-2xl hover:shadow-3xl transform hover:-translate-y-1 transition-all duration-300">
                  Launch Application
                </Button>
              </Link>
              <Button size="xl" className="border-2 border-white/70 text-white hover:bg-white hover:text-yellow-700 px-12 py-6 text-xl font-semibold bg-transparent backdrop-blur-sm hover:shadow-xl transition-all duration-300">
                View Documentation
              </Button>
            </div>
            
            {/* Trust Indicators */}
            <div className="pt-12 border-t border-white/20">
              <p className="text-blue-200 text-lg font-medium mb-6">Trusted by Web3 Professionals</p>
              <div className="flex justify-center items-center space-x-10 opacity-70">
                <div className="text-white/80 text-lg font-medium">Stellar Network</div>
                <div className="w-2 h-2 bg-white/50 rounded-full"></div>
                <div className="text-white/80 text-lg font-medium">Soroban Smart Contracts</div>
                <div className="w-2 h-2 bg-white/50 rounded-full"></div>
                <div className="text-white/80 text-lg font-medium">Decentralized</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="flex flex-col items-center text-white/60 hover:text-white/80 transition-colors cursor-pointer">
            <span className="text-sm font-medium mb-2">Scroll to explore</span>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-32 px-4 sm:px-6 lg:px-8 bg-white relative">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-8 leading-tight">
                Professional Options Trading on{" "}
                <span className="bg-gradient-to-r from-yellow-500 to-yellow-600 bg-clip-text text-transparent">
                  Stellar
                </span>
              </h2>
              <div className="space-y-6 text-lg text-gray-600 leading-relaxed">
                <p>
                  STEPTION PROTOCOL brings institutional-grade options trading to the Stellar ecosystem. 
                  Our platform combines the security and speed of Stellar with advanced DeFi 
                  options protocols.
                </p>
                <p>
                  Built for both beginners and professional traders, STEPTION PROTOCOL offers 
                  comprehensive tools for portfolio management, risk hedging, and yield generation 
                  through our innovative liquidity pools.
                </p>
              </div>
              
              {/* Key Features */}
              <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mt-1">
                    <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Stellar Integration</h3>
                    <p className="text-sm text-gray-600">Native to Stellar network</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mt-1">
                    <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Low Fees</h3>
                    <p className="text-sm text-gray-600">Minimal transaction costs</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mt-1">
                    <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Secure</h3>
                    <p className="text-sm text-gray-600">Audited smart contracts</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mt-1">
                    <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">User-Friendly</h3>
                    <p className="text-sm text-gray-600">Intuitive interface design</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-3xl transform rotate-2"></div>
              <div className="relative bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
                <img
                  src="/examples.png"
                  alt="STEPTION PROTOCOL Trading Interface"
                  className="w-full h-auto"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

            {/* App Launch Waitlist */}
            <div className="max-w-lg mx-auto mb-20">
        <div className="bg-gray-50 p-8 rounded-2xl border border-gray-200">
          <form onSubmit={handleWaitlistSubmit} className="space-y-4">
            <Input
              type="email"
              placeholder="Enter your email to join the waitlist"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isJoiningWaitlist}
              required
              className="w-full text-base px-4 py-3 rounded-lg border-gray-300 focus:border-yellow-500 focus:ring-yellow-500"
            />
            <Button 
              type="submit" 
              size="lg" 
              disabled={isJoiningWaitlist}
              className="w-full bg-yellow-500 hover:bg-yellow-600 text-white py-3 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isJoiningWaitlist ? "Joining..." : "Join App Launch Waitlist"}
            </Button>
            {waitlistMessage && (
              <div
                className={`p-4 rounded-lg text-sm ${
                  waitlistMessage.type === "success"
                    ? "bg-green-50 text-green-800 border border-green-200"
                    : "bg-red-50 text-red-800 border border-red-200"
                }`}
              >
                {waitlistMessage.text}
              </div>
            )}
          </form>
        </div>
      </div>

      {/* What Options Are */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              What Are Options?
            </h2>
            <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
              Options are financial instruments that give you the right to buy or sell an asset 
              at a predetermined price before a specific date. With STEPTION PROTOCOL, trade call and put 
              options on leading assets.
            </p>
          </div>
          <div className="relative">
            <img
              src="/how-option.png"
              alt="Options trading explanation diagram"
              className="rounded-2xl shadow-2xl mx-auto max-w-full border border-gray-200"
            />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-32 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-8 leading-tight">
              Three Simple Steps to Get Started
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Experience professional-grade options trading with our streamlined process
            </p>
          </div>
          
          <div className="relative">
            {/* Connection Line */}
            <div className="hidden lg:block absolute top-24 left-1/2 transform -translate-x-1/2 w-full max-w-4xl">
              <svg className="w-full h-2" viewBox="0 0 100 2" fill="none">
                <defs>
                  <linearGradient id="line-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="50%" stopColor="var(--yellow-500)" />
                    <stop offset="100%" stopColor="#10b981" />
                  </linearGradient>
                </defs>
                <line x1="0" y1="1" x2="100" y2="1" stroke="url(#line-gradient)" strokeWidth="2" strokeDasharray="5,5">
                  <animate attributeName="stroke-dashoffset" values="0;10" dur="2s" repeatCount="indefinite" />
                </line>
              </svg>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              {/* Step 1 */}
              <div className="relative group">
                <Card className="h-full border-0 bg-gradient-to-br from-yellow-50 via-yellow-100 to-yellow-200 hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2">
                  <CardHeader className="pb-6 text-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-yellow-500 to-yellow-700 rounded-2xl flex items-center justify-center mb-6 mx-auto group-hover:scale-110 transition-transform duration-300 shadow-lg">
                      <span className="text-white font-bold text-2xl">1</span>
                    </div>
                    <CardTitle className="text-2xl font-bold text-gray-900 mb-4">
                      Connect & Trade
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-center">
                    <p className="text-gray-600 leading-relaxed mb-6">
                      Connect your Stellar wallet and start trading call or put options with 
                      customizable parameters. Access professional-grade tools with an intuitive interface.
                    </p>
                    <div className="flex justify-center space-x-4 text-sm text-gray-500">
                      <span className="flex items-center">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
                        Instant Setup
                      </span>
                      <span className="flex items-center">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
                        Secure
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Step 2 */}
              <div className="relative group">
                <Card className="h-full border-0 bg-gradient-to-br from-yellow-50 via-yellow-100 to-yellow-200 hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2">
                  <CardHeader className="pb-6 text-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-yellow-500 to-yellow-700 rounded-2xl flex items-center justify-center mb-6 mx-auto group-hover:scale-110 transition-transform duration-300 shadow-lg">
                      <span className="text-white font-bold text-2xl">2</span>
                    </div>
                    <CardTitle className="text-2xl font-bold text-gray-900 mb-4">
                      Provide Liquidity
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-center">
                    <p className="text-gray-600 leading-relaxed mb-6">
                      Earn passive income by providing liquidity to options markets. Choose from 
                      flexible lockup periods and enjoy competitive APY rates while supporting the ecosystem.
                    </p>
                    <div className="flex justify-center space-x-4 text-sm text-gray-500">
                      <span className="flex items-center">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
                        High APY
                      </span>
                      <span className="flex items-center">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
                        Flexible
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Step 3 */}
              <div className="relative group">
                <Card className="h-full border-0 bg-gradient-to-br from-yellow-50 via-yellow-100 to-yellow-200 hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2">
                  <CardHeader className="pb-6 text-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-yellow-500 to-yellow-700 rounded-2xl flex items-center justify-center mb-6 mx-auto group-hover:scale-110 transition-transform duration-300 shadow-lg">
                      <span className="text-white font-bold text-2xl">3</span>
                    </div>
                    <CardTitle className="text-2xl font-bold text-gray-900 mb-4">
                      Monitor & Optimize
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-center">
                    <p className="text-gray-600 leading-relaxed mb-6">
                      Track your positions, monitor P&L, and optimize your investment strategy with 
                      real-time analytics. Make data-driven decisions with comprehensive portfolio insights.
                    </p>
                    <div className="flex justify-center space-x-4 text-sm text-gray-500">
                      <span className="flex items-center">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
                        Real-time
                      </span>
                      <span className="flex items-center">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
                        Analytics
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
            
            {/* CTA Section */}
            <div className="text-center mt-16">
              <Link href="/app">
                <Button size="lg" className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white hover:from-yellow-600 hover:to-yellow-700 px-10 py-4 text-lg font-semibold shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300">
                  Start Your Journey
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-32 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-8 leading-tight">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-gray-600">
              Everything you need to know about STEPTION PROTOCOL and options trading on Stellar
            </p>
          </div>
          <Accordion type="single" collapsible className="space-y-6">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="bg-gray-50 border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden"
              >
                <AccordionTrigger className="text-lg font-semibold text-gray-900 hover:text-yellow-500 px-8 py-6 text-left [&[data-state=open]]:text-yellow-500 [&[data-state=open]]:bg-yellow-50 transition-colors">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-gray-600 px-8 pb-6 leading-relaxed border-t border-gray-200 bg-white">
                  <div className="pt-4">
                    {faq.answer}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
          
          {/* CTA */}
          <div className="text-center mt-16 p-8 bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-2xl border border-gray-200">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Still have questions?</h3>
            <p className="text-gray-600 mb-6">Our team is here to help you get started with options trading on Stellar.</p>
            <a href="mailto:hello@decenzio.com">
              <Button className="bg-yellow-500 hover:bg-yellow-600 text-white px-8 py-3 font-semibold">
                Contact Support
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section id="team" className="py-32 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-8 leading-tight">
              Powered by
            </h2>
            <div className="flex justify-center mb-8">
              <a 
                href="https://decenzio.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:opacity-80 transition-opacity duration-300"
              >
                <img 
                  src="/DCNZ_Primary-Logo_Black.svg" 
                  alt="Decenzio Logo" 
                  className="h-16 w-auto"
                />
              </a>
            </div>
            <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
              Forward-thinking Web3 house backed by execution driven builders.{" "}
              <a 
                href="https://decenzio.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-yellow-500 hover:text-yellow-600 font-semibold transition-colors duration-300"
              >
                Learn more
              </a>
            </p>
          </div>
                    
          {/* Team Members */}
          <div className="text-center mb-12">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Born at HackPera Istanbul</h3>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto mb-8 leading-relaxed">
              STEPTION PROTOCOL was conceived and built during the HackPera Istanbul hackathon, where our team of three 
              passionate developers came together to create the first options trading protocol on Stellar. 
              Our innovative approach earned us 4th place in the competitive DeFi category.
            </p>
             {/* Hackathon Achievement Badge */}
            <div className="mb-12">
              <a 
                href="https://x.com/riseinweb3/status/1942963776036249812" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-block transition-transform hover:scale-105"
              >
                <div className="inline-flex items-center px-6 py-3 rounded-full bg-gradient-to-r from-yellow-50 to-yellow-100 border-2 border-yellow-500 shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
                  <span className="text-2xl mr-3">🏆</span>
                  <div className="text-left">
                    <div className="text-lg font-bold text-gray-900">STEPTION PROTOCOL</div>
                    <div className="text-sm text-gray-700">4th Place Winner - DeFi Category</div>
                    <div className="text-xs text-gray-600">HackPera Istanbul Hackathon</div>
                  </div>
                </div>
              </a>
            </div>
            <h4 className="text-xl font-semibold text-gray-900 mb-8">Meet the Hackathon Team</h4>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
            <Card className="text-center group hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border-0 bg-white shadow-lg">
              <CardContent className="pt-12 pb-8">
                <div className="relative mb-8">
                  <div className="absolute inset-0 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-full transform rotate-3 group-hover:rotate-6 transition-transform"></div>
                  <img
                    src="/team/romi.jpg"
                    alt="Romi - Web3 Specialist"
                    className="relative rounded-full mx-auto w-32 h-32 object-cover shadow-xl border-4 border-white group-hover:scale-105 transition-transform"
                  />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Romi</h3>
                <p className="text-yellow-500 font-semibold text-lg mb-3">Web3 Specialist</p>
                <p className="text-gray-600 text-sm mb-4">Expert in blockchain architecture and decentralized protocols</p>
                <a 
                  href="https://x.com/romispectrum" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-blue-500 hover:text-blue-600 text-sm font-medium transition-colors"
                >
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                  @romispectrum
                </a>
              </CardContent>
            </Card>
            
            <Card className="text-center group hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border-0 bg-white shadow-lg">
              <CardContent className="pt-12 pb-8">
                <div className="relative mb-8">
                  <div className="absolute inset-0 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-full transform rotate-3 group-hover:rotate-6 transition-transform"></div>
                  <img
                    src="/team/murphy.jpeg"
                    alt="Murphy - Frontend Developer"
                    className="relative rounded-full mx-auto w-32 h-32 object-cover shadow-xl border-4 border-white group-hover:scale-105 transition-transform"
                  />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Murphy</h3>
                <p className="text-yellow-500 font-semibold text-lg mb-3">Frontend Developer</p>
                <p className="text-gray-600 text-sm mb-4">Specialized in modern React applications and user experience design</p>
                <a 
                  href="https://twitter.com/murphy__ts"
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-blue-500 hover:text-blue-600 text-sm font-medium transition-colors"
                >
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                  @murphy__ts
                </a>
              </CardContent>
            </Card>
            
            <Card className="text-center group hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border-0 bg-white shadow-lg">
              <CardContent className="pt-12 pb-8">
                <div className="relative mb-8">
                  <div className="absolute inset-0 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-full transform rotate-3 group-hover:rotate-6 transition-transform"></div>
                  <img
                    src="/team/filip.jpeg"
                    alt="Filip - Smart Contract Developer"
                    className="relative rounded-full mx-auto w-32 h-32 object-cover shadow-xl border-4 border-white group-hover:scale-105 transition-transform"
                  />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Filip</h3>
                <p className="text-yellow-500 font-semibold text-lg mb-3">Smart Contract Developer</p>
                <p className="text-gray-600 text-sm mb-4">Expert in Stellar smart contracts and DeFi protocol development</p>
                <a 
                  href="https://x.com/Ph1l1pH_" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-blue-500 hover:text-blue-600 text-sm font-medium transition-colors"
                >
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                  @Ph1l1pH_
                </a>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Newsletter & Socials */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Stay Updated
            </h2>
            <p className="text-xl text-gray-600 leading-relaxed">
              Subscribe to our newsletter and follow us on social media for the latest updates and news.
            </p>
          </div>

          {/* Contact & Social Media */}
          <div className="border-t border-gray-200 pt-16">
            <h3 className="text-2xl font-bold text-center mb-12 text-gray-900">Connect With Us</h3>
            <div className="max-w-md mx-auto space-y-4">
              {/* Email Contact */}
              <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer border border-gray-200">
                <CardContent className="p-6">
                  <a
                    href="mailto:hello@decenzio.com"
                    className="flex items-center space-x-4"
                  >
                    <div className="bg-gray-100 p-4 rounded-full group-hover:bg-yellow-50 transition-colors">
                      <svg
                        className="w-6 h-6 text-gray-600 group-hover:text-yellow-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-gray-900 text-base group-hover:text-yellow-500">
                        Email Us
                      </div>
                      <div className="text-gray-600 text-sm">
                        hello@decenzio.com
                      </div>
                    </div>
                  </a>
                </CardContent>
              </Card>

              {/* X (Twitter) */}
              <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer border border-gray-200">
                <CardContent className="p-6">
                  <a
                    href="https://x.com/DecenzioHQ"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-4"
                  >
                    <div className="bg-black p-4 rounded-full group-hover:bg-gray-800 transition-colors">
                      <svg
                        className="w-6 h-6 text-white"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-gray-900 text-base group-hover:text-yellow-500">
                        Follow on X
                      </div>
                      <div className="text-gray-600 text-sm">@DecenzioHQ</div>
                    </div>
                  </a>
                </CardContent>
              </Card>

              {/* LinkedIn */}
              <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer border border-gray-200">
                <CardContent className="p-6">
                  <a
                    href="https://www.linkedin.com/company/decenzio/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-4"
                  >
                    <div className="bg-blue-600 p-4 rounded-full group-hover:bg-blue-700 transition-colors">
                      <svg
                        className="w-6 h-6 text-white"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                      </svg>
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-gray-900 text-base group-hover:text-yellow-500">
                        Connect on LinkedIn
                      </div>
                      <div className="text-gray-600 text-sm">Decenzio</div>
                    </div>
                  </a>
                </CardContent>
              </Card>

              {/* GitHub */}
              <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer border border-gray-200">
                <CardContent className="p-6">
                  <a
                    href="https://github.com/decenzio"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-4"
                  >
                    <div className="bg-gray-900 p-4 rounded-full group-hover:bg-gray-800 transition-colors">
                      <svg
                        className="w-6 h-6 text-white"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                      </svg>
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-gray-900 text-base group-hover:text-yellow-500">
                        View on GitHub
                      </div>
                      <div className="text-gray-600 text-sm">@decenzio</div>
                    </div>
                  </a>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
            {/* Footer */}
      <footer className="bg-gradient-to-b from-gray-900 to-black text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            {/* Company Info */}
            <div className="md:col-span-2">
              <div className="flex items-center mb-6">
                <div className="w-24 h-24 mr-4">
                  <img 
                    src="/DCNZ-DRK_Primary-Logo-Outline_White.svg" 
                    alt="Decenzio Logo" 
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-yellow-400 bg-clip-text text-transparent">
                    STEPTION PROTOCOL
                  </h3>
                  <p className="text-gray-400 text-sm">Powered by Decenzio</p>
                </div>
              </div>
              <p className="text-gray-300 text-lg mb-8 leading-relaxed max-w-md">
                The first comprehensive options protocol on Stellar, enabling advanced DeFi strategies 
                with institutional-grade security.
              </p>
              <div className="flex space-x-6">
                <a href="https://x.com/DecenzioHQ" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors" aria-label="X (Twitter)">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>
                <a href="https://t.me/+hg7HLvnTKIg3MzE0" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-400 transition-colors" aria-label="Telegram">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.244-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                  </svg>
                </a>
                <a href="https://github.com/decenzio" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-yellow-500 transition-colors" aria-label="GitHub">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-lg font-semibold mb-6 text-white">Platform</h3>
              <ul className="space-y-4">
                <li>
                  <a href="#features" className="text-gray-400 hover:text-yellow-500 transition-colors hover:translate-x-1 transform inline-block">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#how-it-works" className="text-gray-400 hover:text-yellow-500 transition-colors hover:translate-x-1 transform inline-block">
                    How It Works
                  </a>
                </li>
                <li>
                  <a href="/app" className="text-gray-400 hover:text-yellow-500 transition-colors hover:translate-x-1 transform inline-block">
                    Launch App
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-yellow-500 transition-colors hover:translate-x-1 transform inline-block">
                    API Documentation
                  </a>
                </li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h3 className="text-lg font-semibold mb-6 text-white">Support</h3>
              <ul className="space-y-4">
                <li>
                  <a href="mailto:hello@decenzio.com" className="text-gray-400 hover:text-white transition-colors hover:translate-x-1 transform inline-block">
                    Contact Us
                  </a>
                </li>
                <li>
                  <a href="#faq" className="text-gray-400 hover:text-white transition-colors hover:translate-x-1 transform inline-block">
                    FAQ
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-yellow-500 transition-colors hover:translate-x-1 transform inline-block">
                    Help Center
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-yellow-500 transition-colors hover:translate-x-1 transform inline-block">
                    Community
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-16 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © 2025 STEPTION PROTOCOL by Decenzio. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="/privacy" className="text-gray-400 hover:text-white text-sm transition-colors">Privacy Policy</a>
              <a href="/terms" className="text-gray-400 hover:text-white text-sm transition-colors">Terms of Service</a>
              <a href="/security" className="text-gray-400 hover:text-white text-sm transition-colors">Security</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
