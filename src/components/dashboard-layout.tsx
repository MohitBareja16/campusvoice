"use client"

import type React from "react"
import { useSession, signOut } from "next-auth/react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Home, Settings, LogOut, User } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

interface DashboardLayoutProps {
  children: React.ReactNode
  title: string
}

export function DashboardLayout({ children, title }: DashboardLayoutProps) {
  const pathname = usePathname()
  const { data: session, status } = useSession()

  const navigation = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: Home,
      current: pathname === "/dashboard",
    },
    {
      name: "Settings",
      href: "/dashboard/settings",
      icon: Settings,
      // Use startsWith to keep the link active on sub-routes
      current: pathname.startsWith("/dashboard/settings"),
    },
  ]

  const user = session?.user;

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="flex flex-col w-64 bg-white border-r border-gray-200">
        <div className="flex items-center h-16 px-6 border-b border-gray-200">
          <h1 className="text-xl font-semibold text-gray-900">Feedback System</h1>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                  item.current
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                )}
              >
                <Icon className="w-5 h-5 mr-3" />
                {item.name}
              </Link>
            )
          })}
        </nav>

        {/* User section */}
        <div className="p-4 border-t border-gray-200">
          {status === 'loading' ? (
            // Loading skeleton while session is being fetched
            <div className="flex items-center animate-pulse">
              <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
              <div className="ml-3 space-y-2">
                <div className="h-4 w-24 bg-gray-200 rounded"></div>
                <div className="h-3 w-16 bg-gray-200 rounded"></div>
              </div>
            </div>
          ) : (
            // Render user info once session is loaded
            <>
              <div className="flex items-center mb-3">
                <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
                  <User className="w-4 h-4 text-blue-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">{user?.username || 'Professor'}</p>
                  <p className="text-xs text-gray-500">Professor</p>
                </div>
              </div>
              <Button
                onClick={() => signOut()}
                variant="ghost"
                size="sm"
                className="w-full justify-start text-gray-600 hover:text-gray-900"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <h2 className="text-2xl font-semibold text-gray-900">{title}</h2>
        </header>
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  )
}

