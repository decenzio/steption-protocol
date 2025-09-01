"use client";

import { useState, useEffect } from "react";
import { login, signup, logout } from "../services/passkeys";
import { isLoggedIn } from "../services/storage";
import Link from "next/link";

import Logo from './Logo'

export default function HeaderApp() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check authentication status on mount
  useEffect(() => {
    setIsAuthenticated(isLoggedIn());
  }, []);

  const handleLogin = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await login();
      if (result.success) {
        setIsAuthenticated(true);
        console.log("Login successful:", result.contractId);
      } else {
        setError(result.error || "Login failed");
      }
    } catch (err) {
      setError("Login failed");
      console.error("Login error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await signup();
      if (result.success) {
        setIsAuthenticated(true);
        console.log("Signup successful:", result.contractId);
      } else {
        setError(result.error || "Signup failed");
      }
    } catch (err) {
      setError("Signup failed");
      console.error("Signup error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    setIsAuthenticated(false);
    setError(null);
  };

  return (
    <header className="border-b border-white/20 shadow-lg sticky top-0 z-50 backdrop-blur-md bg-white/80 supports-[backdrop-filter]:bg-white/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo Section */}
          <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
            <Logo className="w-16 h-16" />
            <div className="flex flex-col">
              <span className="text-2xl font-bold text-gray-900 tracking-tight">STEPTION PROTOCOL</span>
              <span className="text-xs text-gray-500 -mt-1">by Decenzio</span>
            </div>
          </Link>

          {/* Navigation & Auth */}
          <div className="flex items-center space-x-6">
            {error && (
              <div className="text-red-600 text-sm bg-red-50 px-3 py-1 rounded-md border border-red-200">
                {error}
              </div>
            )}

            <div className="flex items-center space-x-3">
              {isAuthenticated ? (
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-600 font-medium">Connected</span>
                  <button
                    onClick={handleLogout}
                    disabled={isLoading}
                    className="bg-gray-100/80 backdrop-blur-sm text-gray-700 hover:bg-gray-200/80 px-4 py-2 rounded-lg font-semibold text-sm transition-colors disabled:opacity-50 border border-white/20"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <>
                  <button
                    onClick={handleLogin}
                    disabled={isLoading}
                    className="border border-white/30 backdrop-blur-sm text-gray-700 hover:bg-white/20 px-4 py-2 rounded-lg font-semibold text-sm transition-colors disabled:opacity-50"
                  >
                    {isLoading ? "Connecting..." : "Login"}
                  </button>
                  <button
                    onClick={handleSignup}
                    disabled={isLoading}
                    className="bg-blue-600/90 backdrop-blur-sm text-white hover:bg-blue-700/95 px-4 py-2 rounded-lg font-semibold text-sm transition-colors shadow-md disabled:opacity-50 border border-white/20"
                  >
                    {isLoading ? "Creating..." : "Register"}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
