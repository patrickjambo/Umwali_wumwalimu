import { db } from "@/db";
import { users } from "@/db/schema";
import { asc } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AdminStudentsPage() {
  let studentList: (typeof users.$inferSelect)[] = [];
  try {
     studentList = await db.select().from(users).orderBy(asc(users.createdAt)).limit(100);
  } catch (e) {
     studentList = [];
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Abanyeshuri (Students)</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Abanyeshuri Biyandikishije ({studentList.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {studentList.length === 0 ? (
            <p className="text-gray-500">Nta banyeshuri baraboneka cyangwa database ntiyacometse neza.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                  <tr>
                    <th className="px-6 py-3">Amazina</th>
                    <th className="px-6 py-3">Email</th>
                    <th className="px-6 py-3">Uruhare (Role)</th>
                    <th className="px-6 py-3">Italiki yiyandikishije</th>
                  </tr>
                </thead>
                <tbody>
                  {studentList.map((user) => (
                    <tr key={user.id} className="bg-white border-b">
                      <td className="px-6 py-4 font-medium text-gray-900">{user.name}</td>
                      <td className="px-6 py-4">{user.email}</td>
                      <td className="px-6 py-4 capitalize">{user.role || 'student'}</td>
                      <td className="px-6 py-4">
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString("rw-RW") : "N/A"}
                      </td>
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
