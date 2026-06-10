import { db } from "@/db";
import { questions } from "@/db/schema";
import { asc } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AdminQuestionsPage() {
  // Fetch some questions for demonstration
  let qList: (typeof questions.$inferSelect)[] = [];
  try {
     qList = await db.select().from(questions).orderBy(asc(questions.number)).limit(50);
  } catch (e) {
     qList = []; // If db is not yet initialized
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Urubuga rw'Ibibazo (Questions)</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ibibazo Bihari ({qList.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {qList.length === 0 ? (
            <p className="text-gray-500">Nta bibazo birashyirwamo cyangwa database ntiyacometse neza.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                  <tr>
                    <th className="px-6 py-3">No</th>
                    <th className="px-6 py-3">Ikibazo</th>
                    <th className="px-6 py-3">Icyiciro</th>
                    <th className="px-6 py-3">Igisubizo</th>
                  </tr>
                </thead>
                <tbody>
                  {qList.map(q => (
                    <tr key={q.id} className="bg-white border-b">
                      <td className="px-6 py-4">{q.number}</td>
                      <td className="px-6 py-4 font-medium max-w-xs truncate">{q.text}</td>
                      <td className="px-6 py-4 capitalize">{q.category}</td>
                      <td className="px-6 py-4 uppercase font-bold">{q.correctKey}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
