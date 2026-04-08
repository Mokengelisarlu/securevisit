export default function Page() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Intégrations</h1>
                <p className="text-gray-500">Gérez vos connexions avec des services tiers.</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border p-12 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-teal-50 rounded-full flex items-center justify-center mb-4">
                    <div className="w-8 h-8 text-teal-500" />
                </div>
                <h2 className="text-xl font-semibold mb-2">Contenu à venir</h2>
                <p className="text-gray-500 max-w-sm">Cette page est en cours de développement.</p>
            </div>
        </div>
    );
}
