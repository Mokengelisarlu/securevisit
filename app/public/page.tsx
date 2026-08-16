import Image from 'next/image';
import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="relative h-screen min-h-screen overflow-hidden bg-[#f8fafc] text-slate-950">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(13,189,181,0.16),_transparent_25%),radial-gradient(circle_at_top_right,_rgba(15,23,42,0.10),_transparent_20%)]" />
      <div className="relative z-10 mx-auto flex h-full max-w-[1600px] flex-col px-6 py-6 lg:px-12">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3 px-4 py-2">
            <Image src="/icon-96x96.png" alt="SecureVisit logo" width={36} height={36} className="rounded-xl object-contain" />
            <div className="leading-tight">
              <p className="font-bold  text-slate-950">SecureVisit</p>
            </div>
          </div>
        </header>

        <section className="mt-8 grid flex-1 grid-cols-1 items-center gap-12 overflow-hidden lg:grid-cols-[1.1fr_0.9fr]">
          <div className="flex h-full min-h-[calc(100vh-96px)] flex-col justify-center gap-8">
            <div className="max-w-2xl space-y-6">
              <h1 className=" font-semibold leading-[0.95] tracking-[-0.03em] text-slate-950 sm:text-2xl lg:text-[3rem]">
                Votre plateforme de gestion des visiteurs.
              </h1>

              <p className="max-w-xl text-base leading-8 text-slate-600 sm:text-lg">
                Gérez les entrées, les sorties et les rendez-vous de vos visiteurs en toute facilité.
              </p>
            </div>

            <div className="flex items-center gap-4">
              <Link
                href="/sign-up?after=setup"
                className="inline-flex items-center justify-center rounded-full bg-[#0DBDB5] px-8 py-4 text-base font-semibold text-white shadow-[0_24px_64px_-32px_rgba(13,189,181,0.9)] transition hover:bg-[#0ab7aa]"
              >
                Créer un compte
              </Link>
            </div>
          </div>

          <div className="relative flex h-full min-h-[calc(100vh-96px)] items-center justify-center">
            <div className="absolute -left-8 top-14 h-40 w-40 rounded-full bg-[#0DBDB5]/10 blur-3xl" />
            <div className="absolute bottom-10 right-8 h-44 w-44 rounded-full bg-slate-900/5 blur-3xl" />
            <div className="relative h-full w-full max-w-4xl overflow-hidden rounded-[40px] border border-slate-200 bg-white shadow-[0_40px_90px_-40px_rgba(15,23,42,0.25)] dashboard-loop">
              <Image
                src="/dashboard.png"
                alt="Tableau de bord SecureVisit"
                width={1600}
                height={1000}
                className="w-full h-auto object-contain"
                priority
              />
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
