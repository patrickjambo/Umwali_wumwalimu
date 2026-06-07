import { db } from "@/db";
import { courses, modules } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { notFound } from "next/navigation";

export default async function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const p = await params;
  const validCategories = ["text", "numeric", "ibyapa"];
  if (!validCategories.includes(p.category)) {
    notFound();
  }

  // Fetch course and its modules
  const courseList = await db.select().from(courses).where(eq(courses.category, p.category as any)).limit(1);
  const course = courseList[0] || { id: "dummy", title: `Category: ${p.category}`, description: "Amasomo" };
  
  // For the sake of this mock, if no actual course exists, supply empty modules array.
  let moduleList: any[] = [];
  if (courseList.length > 0) {
    moduleList = await db.select().from(modules).where(eq(modules.courseId, course.id)).orderBy(asc(modules.order));
  } else {
    // Generate default module wrapper for UI
    moduleList = [
      { id: "ikizamini-cyose", title: "Ikizamini Rusange (All Questions)", content: "Gerageza ibibazo byose muri iyi category", passingScore: 70 },
      { id: "ikizamini-gito", title: "Ikizamini Gito (Quick Test)", content: "Ibibazo 10 by'igerageza", passingScore: 70 }
    ];
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold capitalize">{course.title}</h1>
        <p className="text-gray-500 mt-2">{course.description}</p>
      </div>

      <div className="grid gap-4">
        {moduleList.map((mod, index) => (
          <Card key={mod.id} className={index === 0 ? "border-rwandan-blue" : ""}>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>{mod.title}</span>
              </CardTitle>
              <CardDescription>{mod.content}</CardDescription>
            </CardHeader>
            <CardContent>
                 <div className="flex gap-4">
                   <Link href={`/courses/${p.category}/${mod.id}/quiz?type=${index === 0 ? 'full' : 'quick'}`}>
                     <Button className="bg-rwandan-blue hover:bg-rwandan-blue/90 text-white">Kora Ikizamini (Quiz)</Button>
                   </Link>
                 </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
