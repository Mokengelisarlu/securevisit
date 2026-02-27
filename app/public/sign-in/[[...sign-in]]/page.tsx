import { SignIn } from '@clerk/nextjs'

export default function SignInPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <SignIn
        afterSignInUrl="/setup-tenant"
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "bg-white shadow-lg",
          },
        }}
      />
    </div>
  )
}
