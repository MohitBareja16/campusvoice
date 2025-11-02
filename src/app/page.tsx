import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold text-gray-900">University Feedback System</h1>
        <p className="text-xl text-gray-600 max-w-2xl">Anonymous feedback platform for universities</p>
        <div className="flex gap-4 justify-center">
          <Button asChild className="bg-blue-600 hover:bg-blue-700">
            <Link href="/sign-in">Professor Sign In</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/sign-up">Create Account</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
