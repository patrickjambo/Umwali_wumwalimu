import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="px-4 lg:px-6 h-14 flex items-center bg-rwandan-blue text-white">
        <Link className="flex items-center justify-center" href="#">
          <span className="font-bold text-xl ml-2">Amategeko y'Umuhanda</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Link className="text-sm font-medium hover:underline underline-offset-4" href="/login">
            Kwiyandikisha / Injira
          </Link>
        </nav>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-brand-50">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                  Uburyo Bwiza bwo Kwiga Amategeko y'Umuhanda mu Rwanda
                </h1>
                <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400">
                  Iga amategeko y'umuhanda, kora imyitozo, kandi unutsinde ibizamini byo kubona uruhushya rwo gutwara ibinyabiziga (Provisoire).
                </p>
              </div>
              <div className="space-x-4">
                <Link href="/register">
                  <Button size="lg" className="bg-rwandan-blue hover:bg-rwandan-blue/90 text-white">Tangira Ubu</Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
        
        <section className="w-full py-12 md:py-24 lg:py-32 bg-white">
          <div className="container px-4 md:px-6">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl text-center mb-12">Uko Bikora (How it works)</h2>
            <div className="grid gap-8 sm:grid-cols-3 items-start justify-center text-center">
              <div className="flex flex-col items-center space-y-2">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-rwandan-yellow text-2xl font-bold text-black border-4 border-rwandan-blue">1</div>
                <h3 className="text-xl font-bold">Kwiyandikisha</h3>
                <p className="text-sm text-gray-500">Iremere konti kugira ngo utangire gukurikirana amasomo yawe.</p>
              </div>
              <div className="flex flex-col items-center space-y-2">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-rwandan-yellow text-2xl font-bold text-black border-4 border-rwandan-blue">2</div>
                <h3 className="text-xl font-bold">Kwiga (Study)</h3>
                <p className="text-sm text-gray-500">Soma ibika, reba ibyapa, kandi wige inama z'amategeko y'umuhanda zasobanuwe neza.</p>
              </div>
              <div className="flex flex-col items-center space-y-2">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-rwandan-yellow text-2xl font-bold text-black border-4 border-rwandan-blue">3</div>
                <h3 className="text-xl font-bold">Kwitwara Neza (Certify)</h3>
                <p className="text-sm text-gray-500">Kora ibizamini, utsinde kuko buri kiciro uri busabwe amanota 70% kugera ubonye icyemezo.</p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t bg-gray-50">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          © 2026 Amategeko y'Umuhanda. All rights reserved.
        </p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link className="text-xs hover:underline underline-offset-4" href="#">
            Ibijyanye n'iyi paji
          </Link>
          <Link className="text-xs hover:underline underline-offset-4" href="#">
            Ubufasha
          </Link>
        </nav>
      </footer>
    </div>
  )
}
