import { SignUp } from '@clerk/nextjs'

export default function SignUpPage() {
    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
            <SignUp
                forceRedirectUrl="/setup-tenant"
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
