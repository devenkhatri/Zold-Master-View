"use client";

import { useState } from 'react';
import { hashPassword } from '@/lib/auth-utils';
import { Copy, Check } from 'lucide-react';

export default function HashPasswordTool() {
  const [password, setPassword] = useState('');
  const [hashedPassword, setHashedPassword] = useState('');
  const [copied, setCopied] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleGenerateHash = async () => {
    if (!password) return;
    const hashed = await hashPassword(password);
    setHashedPassword(hashed);
    setCopied(false);
  };

  const copyToClipboard = () => {
    if (!hashedPassword) return;
    navigator.clipboard.writeText(hashedPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 mx-auto">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Password Hash Generator
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Generate bcrypt hashes for user passwords
          </p>
        </div>

        <div className="mt-8 space-y-6">
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Enter password to hash"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div>
            <button
              onClick={handleGenerateHash}
              disabled={!password}
              className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white ${
                password
                  ? 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                  : 'bg-gray-400 cursor-not-allowed'
              }`}
            >
              Generate Hash
            </button>
          </div>

          {hashedPassword && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hashed Password
              </label>
              <div className="mt-1 flex rounded-md shadow-sm">
                <div className="relative flex items-stretch flex-grow focus-within:z-10">
                  <input
                    type="text"
                    className="focus:ring-blue-500 focus:border-blue-500 block w-full rounded-none rounded-l-md pl-3 pr-12 sm:text-sm border-gray-300 bg-gray-50"
                    value={hashedPassword}
                    readOnly
                  />
                </div>
                <button
                  type="button"
                  onClick={copyToClipboard}
                  className="-ml-px relative inline-flex items-center space-x-2 px-4 py-2 border border-gray-300 text-sm font-medium rounded-r-md text-gray-700 bg-gray-50 hover:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                >
                  {copied ? (
                    <Check className="h-5 w-5 text-green-500" />
                  ) : (
                    <Copy className="h-5 w-5 text-gray-500" />
                  )}
                  <span>{copied ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
              <p className="mt-2 text-sm text-gray-500">
                Copy this hash to your Google Sheet for the user's password
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
