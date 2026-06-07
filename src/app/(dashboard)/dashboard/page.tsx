import { auth } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function DashboardPage() {
  const session = await auth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Muraho, {session?.user?.name?.split(' ')[0] || 'Mukunzi'}!</h1>
        <p className="text-gray-500">Wiyandikishije kugira ngo wige amategeko y'umuhanda.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Category A: Amategeko Rusange</CardTitle>
            <CardDescription>Ibibazo by'amagambo gusa</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-2">0%</div>
            <Progress value={0} className="h-2" />
            <Link href="/courses/text" className="mt-4 inline-block w-full">
              <Button className="w-full bg-brand-600 hover:bg-brand-700 text-white">Komeza Kwiga</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Category B: Ingero n'Ibipimo</CardTitle>
            <CardDescription>Ibibazo birimo imibare</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-2">0%</div>
            <Progress value={0} className="h-2" />
            <Link href="/courses/numeric" className="mt-4 inline-block w-full">
              <Button className="w-full bg-brand-600 hover:bg-brand-700 text-white">Komeza Kwiga</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Category C: Ibyapa</CardTitle>
            <CardDescription>Ibimenyetso (Road Signs)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-2">0%</div>
            <Progress value={0} className="h-2" />
            <Link href="/courses/ibyapa" className="mt-4 inline-block w-full">
              <Button className="w-full bg-brand-600 hover:bg-brand-700 text-white">Komeza Kwiga</Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4">Ibizamini Uheruka Gukora</h2>
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-12 text-center text-gray-500">
            Nta bizamini urakora. Tangira amasomo kugira ngo ukore ibizamini.
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
