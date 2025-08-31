"use client";

import Link from 'next/link'
import Logo from './Logo'

export default function Header() {
  return (
    <header className="border-b border-white/20 shadow-lg sticky top-0 z-50 backdrop-blur-md bg-white/80 supports-[backdrop-filter]:bg-white/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo Section */}
          <div className="flex items-center space-x-3">
            <Logo className="w-16 h-16" />
            <div className="flex flex-col">
              <span className="text-2xl font-bold text-gray-900 tracking-tight">STEPTIONS</span>
              <span className="text-xs text-gray-500 -mt-1">by Decenzio</span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#about" className="text-gray-600 hover:text-gray-900 transition-colors font-medium">About</a>
            <a href="#how-it-works" className="text-gray-600 hover:text-gray-900 transition-colors font-medium">How It Works</a>
            <a href="#team" className="text-gray-600 hover:text-gray-900 transition-colors font-medium">Team</a>
          </nav>

          {/* CTA Section */}
          <div className="flex items-center space-x-4">
            <Link href="/app">
              <button className="bg-gradient-to-r from-blue-600/90 to-blue-700/90 backdrop-blur-sm text-white px-6 py-2.5 rounded-lg font-semibold text-sm hover:from-blue-700/95 hover:to-blue-800/95 transform hover:-translate-y-0.5 transition-all shadow-lg hover:shadow-xl border border-white/20">
                Open App
              </button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}