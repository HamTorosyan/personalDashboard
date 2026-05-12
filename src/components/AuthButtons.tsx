"use client"

import { useSession, signIn, signOut } from "next-auth/react"
import { Monitor, Video, LogOut } from "lucide-react"
import type { MicrosoftAccountToken } from "@/lib/types"

export default function AuthButtons() {
  const { data: session } = useSession()

  const msAccounts = session?.microsoftAccounts ?? []
  const hasZoom = !!session?.zoomAccessToken

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Microsoft accounts */}
      {msAccounts.length === 0 ? (
        <button
          onClick={() => signIn("microsoft-entra-id")}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <Monitor size={14} />
          Connect Microsoft
        </button>
      ) : (
        <>
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-100 text-blue-800 text-sm font-medium">
            <Monitor size={14} />
            {msAccounts.length === 1 ? "1 Microsoft account" : `${msAccounts.length} Microsoft accounts`}
          </span>
          {msAccounts.length < 2 && (
            <button
              onClick={() => signIn("microsoft-entra-id")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-blue-300 text-blue-700 text-sm hover:bg-blue-50 transition-colors"
            >
              + Add account
            </button>
          )}
        </>
      )}

      {/* Zoom */}
      {!hasZoom ? (
        <button
          onClick={() => signIn("zoom")}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-cyan-600 text-white text-sm font-medium hover:bg-cyan-700 transition-colors"
        >
          <Video size={14} />
          Connect Zoom
        </button>
      ) : (
        <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-cyan-100 text-cyan-800 text-sm font-medium">
          <Video size={14} />
          Zoom connected
        </span>
      )}

      {/* Sign out (only shown when any account is connected) */}
      {(msAccounts.length > 0 || hasZoom) && (
        <button
          onClick={() => signOut()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-gray-300 text-gray-600 text-sm hover:bg-gray-100 transition-colors"
        >
          <LogOut size={14} />
          Sign out
        </button>
      )}
    </div>
  )
}
