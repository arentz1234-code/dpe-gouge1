'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';

export default function Navbar() {
  const { data: session, status } = useSession();

  return (
    <nav className="border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between h-16 items-center">
          <Link href="/" className="text-2xl font-bold">
            <span className="text-[#00a67c]">Rate</span>
            <span>MyDPE</span>
          </Link>

          <div className="flex items-center gap-4">
            <Link
              href="/add-examiner"
              className="px-4 py-2 bg-[#1a1a1a] text-white rounded hover:bg-black"
            >
              + Add a DPE
            </Link>
            {status === 'loading' ? null : session ? (
              <>
                <span className="text-gray-600 dark:text-gray-400">
                  Hi, {session.user.username}
                </span>
                <button
                  onClick={() => signOut()}
                  className="text-gray-600 hover:text-gray-900 dark:text-gray-400"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="text-gray-600 hover:text-gray-900 dark:text-gray-400">
                  Log In
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 bg-[#00a67c] text-white rounded hover:bg-[#008f6b]"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
