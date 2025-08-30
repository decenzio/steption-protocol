"use client";

import { useState } from "react";
import Link from "next/link";
import Header from "@/app/components/Header";
import Logo from "@/app/components/Logo";
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

export default function LandingPage() {
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenFAQ(openFAQ === index ? null : index);
  };

  const faqs = [
    {
      question: "What is STEPTIONS?",
      answer:
        "STEPTIONS is a decentralized options trading platform offering advanced features for trading, liquidity provision, and portfolio management.",
    },
    {
      question: "How do I earn rewards?",
      answer:
        "You can earn rewards by providing liquidity to options markets. Rewards are based on the APY and lockup period of the liquidity pools.",
    },
    {
      question: "What assets are supported?",
      answer:
        "STEPTIONS supports leading cryptocurrencies such as Bitcoin, Ethereum, and more.",
    },
    {
      question: "Is STEPTIONS secure?",
      answer:
        "Yes, STEPTIONS uses advanced security protocols and smart contract audits to ensure the safety of your funds and trading activities.",
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
      <section className="relative overflow-hidden">
        {/* Background with gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              The First Options Protocol on{" "}
              <span className="bg-gradient-to-r from-orange-400 to-orange-300 bg-clip-text text-transparent">
                Stellar
              </span>
            </h1>
            <p className="text-xl lg:text-2xl text-blue-100 mb-8 max-w-4xl mx-auto leading-relaxed">
              Insure any asset. Hedge price risk. Earn yield.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/app">
                <Button size="lg" className="bg-white text-blue-700 hover:bg-gray-50 px-8 py-4 text-lg font-semibold shadow-xl">
                  Start Trading
                </Button>
              </Link>
              <Button size="lg" className="border-2 border-white text-white hover:bg-white hover:text-blue-700 px-8 py-4 text-lg font-semibold bg-transparent">
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              About STEPTIONS
            </h2>
            <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
              STEPTIONS is a decentralized options platform built for beginners and pros alike. 
              Enjoy smooth trading, earn from liquidity pools, and manage your portfolio with confidence.
            </p>
          </div>
          <div className="relative">
            <img
              src="/examples.png"
              alt="Trading interface illustration"
              className="rounded-2xl shadow-2xl mx-auto max-w-full border border-gray-200"
            />
          </div>
        </div>
      </section>

      {/* What Options Are */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              What Are Options?
            </h2>
            <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
              Options are financial instruments that give you the right to buy or sell an asset 
              at a predetermined price before a specific date. With STEPTIONS, trade call and put 
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
      <section id="how-it-works" className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              How It Works
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
            <Card className="relative group hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-blue-50 to-blue-100">
              <CardHeader className="pb-4">
                <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <span className="text-white font-bold text-xl">1</span>
                </div>
                <CardTitle className="text-2xl font-bold text-gray-900 mb-2">
                  Trade Options
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 leading-relaxed">
                  Choose call or put options and customize trading parameters to suit your strategy. 
                  Access professional-grade tools with intuitive design.
                </p>
              </CardContent>
            </Card>
            
            <Card className="relative group hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-orange-50 to-orange-100">
              <CardHeader className="pb-4">
                <div className="w-12 h-12 bg-orange-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <span className="text-white font-bold text-xl">2</span>
                </div>
                <CardTitle className="text-2xl font-bold text-gray-900 mb-2">
                  Provide Liquidity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 leading-relaxed">
                  Earn rewards by providing liquidity to options markets with flexible lockup periods. 
                  Generate passive income while supporting the ecosystem.
                </p>
              </CardContent>
            </Card>
            
            <Card className="relative group hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-green-50 to-green-100">
              <CardHeader className="pb-4">
                <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <span className="text-white font-bold text-xl">3</span>
                </div>
                <CardTitle className="text-2xl font-bold text-gray-900 mb-2">
                  Manage Portfolio
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 leading-relaxed">
                  Track positions, monitor P&L, and optimize your investments with professional tools. 
                  Make data-driven decisions with real-time analytics.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-gray-600">
              Everything you need to know about STEPTIONS
            </p>
          </div>
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow"
              >
                <AccordionTrigger className="text-lg font-semibold text-gray-900 hover:text-blue-600 px-6 py-4 text-left">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-gray-600 px-6 pb-4 leading-relaxed">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Team Section */}
      <section id="team" className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Backed by Decenzio
            </h2>
            <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
              Forward-thinking Web3 house backed by execution driven builders
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
            <Card className="text-center group hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-white to-gray-50">
              <CardContent className="pt-8">
                <div className="relative mb-6">
                  <img
                    src="/team/romi.jpg"
                    alt="Romi - Web3 Specialist"
                    className="rounded-full mx-auto w-32 h-32 object-cover shadow-lg group-hover:scale-105 transition-transform border-4 border-white"
                  />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Romi</h3>
                <p className="text-blue-600 font-semibold text-lg">Web3 Specialist</p>
              </CardContent>
            </Card>
            <Card className="text-center group hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-white to-gray-50">
              <CardContent className="pt-8">
                <div className="relative mb-6">
                  <img
                    src="/team/murphy.jpeg"
                    alt="Murphy - Frontend Developer"
                    className="rounded-full mx-auto w-32 h-32 object-cover shadow-lg group-hover:scale-105 transition-transform border-4 border-white"
                  />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Murphy</h3>
                <p className="text-blue-600 font-semibold text-lg">Frontend Developer</p>
              </CardContent>
            </Card>
            <Card className="text-center group hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-white to-gray-50">
              <CardContent className="pt-8">
                <div className="relative mb-6">
                  <img
                    src="/team/filip.jpeg"
                    alt="Filip - Smart Contract Developer"
                    className="rounded-full mx-auto w-32 h-32 object-cover shadow-lg group-hover:scale-105 transition-transform border-4 border-white"
                  />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Filip</h3>
                <p className="text-blue-600 font-semibold text-lg">Smart Contract Developer</p>
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

          {/* Newsletter Subscription */}
          <div className="max-w-lg mx-auto mb-20">
            <div className="bg-gray-50 p-8 rounded-2xl border border-gray-200">
              <div className="space-y-4">
                <Input
                  type="email"
                  placeholder="Enter your email address"
                  className="w-full text-base px-4 py-3 rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
                <Button size="lg" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg font-semibold">
                  Subscribe to Newsletter
                </Button>
              </div>
            </div>
          </div>

          {/* Contact & Social Media */}
          <div className="border-t border-gray-200 pt-16">
            <h3 className="text-2xl font-bold text-center mb-12 text-gray-900">Connect With Decenzio</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Email Contact */}
              <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer border border-gray-200">
                <CardContent className="p-6">
                  <a
                    href="mailto:hello@decenzio.com"
                    className="flex items-center space-x-4"
                  >
                    <div className="bg-gray-100 p-4 rounded-full group-hover:bg-blue-100 transition-colors">
                      <svg
                        className="w-6 h-6 text-gray-600 group-hover:text-blue-600"
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
                      <div className="font-semibold text-gray-900 text-base group-hover:text-blue-600">
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
                      <div className="font-semibold text-gray-900 text-base group-hover:text-blue-600">
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
                      <div className="font-semibold text-gray-900 text-base group-hover:text-blue-600">
                        Connect on LinkedIn
                      </div>
                      <div className="text-gray-600 text-sm">Decenzio</div>
                    </div>
                  </a>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Company Info */}
            <div className="md:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <Logo />
                <span className="text-2xl font-bold">STEPTIONS</span>
              </div>
              <p className="text-gray-400 mb-4 max-w-md">
                The first options protocol on Stellar. Empowering traders with professional-grade 
                options trading tools and liquidity solutions.
              </p>
              <div className="flex space-x-4">
                <a href="https://x.com/steptions" target="_blank" rel="noopener noreferrer" 
                   className="text-gray-400 hover:text-white transition-colors"
                   aria-label="Follow us on X (Twitter)">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>
                <a href="https://t.me/steptions" target="_blank" rel="noopener noreferrer" 
                   className="text-gray-400 hover:text-white transition-colors"
                   aria-label="Join our Telegram">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                  </svg>
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li><a href="#about" className="text-gray-400 hover:text-white transition-colors">About</a></li>
                <li><a href="#how-it-works" className="text-gray-400 hover:text-white transition-colors">How It Works</a></li>
                <li><a href="#team" className="text-gray-400 hover:text-white transition-colors">Team</a></li>
                <li><Link href="/app" className="text-gray-400 hover:text-white transition-colors">Open App</Link></li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Contact</h3>
              <ul className="space-y-2">
                <li>
                  <a href="mailto:hello@steptions.com" className="text-gray-400 hover:text-white transition-colors">
                    hello@steptions.com
                  </a>
                </li>
                <li>
                  <a href="https://docs.steptions.com" target="_blank" rel="noopener noreferrer" 
                     className="text-gray-400 hover:text-white transition-colors">
                    Documentation
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © 2025 STEPTIONS. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="/privacy" className="text-gray-400 hover:text-white text-sm transition-colors">Privacy Policy</a>
              <a href="/terms" className="text-gray-400 hover:text-white text-sm transition-colors">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
