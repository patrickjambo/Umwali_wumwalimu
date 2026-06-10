import { db } from "@/db";
import { certificates, users } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AdminCertificatesPage() {
  let certList: { user: typeof users.$inferSelect | null; id: string; userId: string; courseId: string; verifyCode: string; pdfUrl: string | null; issuedAt: Date | null }[] = [];
  try {
     const data = await db.select().from(certificates)
                          .leftJoin(users, eq(certificates.userId, users.id))
                          .orderBy(asc(certificates.issuedAt))
                          .limit(100);
     certList = data.map(row => ({ ...row.certificates, user: row.users }));
  } catch (e) {
     certList = [];
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Ibyemezo (Certificates)</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ibyemezo Byatanzwe ({certList.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {certList.length === 0 ? (
            <p className="text-gray-500">Nta byemezo biratangwa cyangwa database ntiyacometse neza.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                  <tr>
                    <th className="px-6 py-3">Code Umwimerere (Verify Code)</th>
                    <th className="px-6 py-3">Umunyeshuri</th>
                    <th className="px-6 py-3">Italiki cyatangiweho</th>
                  </tr>
                </thead>
                <tbody>
                  {certList.map((cert) => (
                    <tr key={cert.id} className="bg-white border-b">
                      <td className="px-6 py-4 font-mono">{cert.verifyCode}</td>
                      <td className="px-6 py-4 font-medium text-gray-900">{cert.user?.name || 'Unknown'}</td>
                      <td className="px-6 py-4">
                        {cert.issuedAt ? new Date(cert.issuedAt).toLocaleDateString("rw-RW") : "N/A"}
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
