import { signIn } from "@/lib/auth"
import { Monitor, Video } from "lucide-react"

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Personal Dashboard</h1>
        <p className="text-gray-500 text-sm mb-8">
          Connect your accounts to see your calendar events.
        </p>

        <div className="space-y-3">
          <form
            action={async () => {
              "use server"
              await signIn("microsoft-entra-id", { redirectTo: "/" })
            }}
          >
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
            >
              <Monitor size={18} />
              Sign in with Microsoft (work / M365)
            </button>
          </form>

          <form
            action={async () => {
              "use server"
              await signIn("microsoft-entra-id", { redirectTo: "/" })
            }}
          >
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-blue-300 text-blue-700 font-medium hover:bg-blue-50 transition-colors"
            >
              <Monitor size={18} />
              Sign in with Microsoft (personal / Outlook.com)
            </button>
          </form>

          <div className="relative my-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-xs text-gray-400 bg-white px-2 w-fit mx-auto">
              also connect
            </div>
          </div>

          <form
            action={async () => {
              "use server"
              await signIn("zoom", { redirectTo: "/" })
            }}
          >
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-cyan-600 text-white font-medium hover:bg-cyan-700 transition-colors"
            >
              <Video size={18} />
              Connect Zoom
            </button>
          </form>
        </div>

        <p className="mt-6 text-xs text-gray-400 text-center">
          Both Microsoft buttons use the same OAuth flow — the account picker lets you choose which account to add.
        </p>
      </div>
    </div>
  )
}
