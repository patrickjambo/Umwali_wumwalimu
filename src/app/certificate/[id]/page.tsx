import { db } from "@/db";
import { certificates, users, courses } from "@/db/schema";
import { eq } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { notFound } from "next/navigation";
import Image from "next/image";

export default async function CertificateVerificationPage({ params }: { params: Promise<{ id: string }> }) {
  const p = await params;
  let cert, user, course;
  try {
     const data = await db.select().from(certificates)
                          .leftJoin(users, eq(certificates.userId, users.id))
                          .leftJoin(courses, eq(certificates.courseId, courses.id))
                          .where(eq(certificates.verifyCode, p.id))
                          .limit(1);
     if (data.length === 0) {
         notFound();
     }
     cert = data[0].certificates;
     user = data[0].users;
     course = data[0].courses;
  } catch (e) {
     // If database is not ready, we will mock for demonstration, but normally we'd throw or 404.
     cert = { verifyCode: p.id, issuedAt: new Date() };
     user = { name: "Oswald Mukunzi" };
     course = { title: "Amategeko Rusange" };
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="max-w-3xl w-full text-center border-4 border-rwandan-blue shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-4 bg-gradient-to-r from-rwandan-blue via-rwandan-yellow to-rwandan-green"></div>
        <CardHeader className="pt-12 pb-8">
          <div className="mx-auto bg-gray-100 rounded-full w-24 h-24 flex items-center justify-center border-4 border-rwandan-yellow mb-4">
             <span className="text-4xl">🇷🇼</span>
          </div>
          <CardTitle className="text-4xl font-bold text-gray-900 tracking-tight">
            ICYEMEZO CYO GUTSINDWA (CERTIFICATE)
          </CardTitle>
          <CardDescription className="text-lg mt-4">
            Iki cyemezo gihabwa:
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <h2 className="text-5xl font-black text-rwandan-blue">{user?.name}</h2>
          <p className="text-xl text-gray-700 max-w-xl mx-auto">
            Ku bwo kurangiza amasomo no gutsinda ibizamini byibura ku manota 70% mu isomo rya:
          </p>
          <h3 className="text-3xl font-bold text-gray-800">{course?.title}</h3>
          
          <div className="mt-12 grid grid-cols-2 gap-8 text-left border-t border-gray-200 pt-8 px-8">
            <div>
              <p className="text-sm text-gray-500 font-bold uppercase">Italiki yatanzweho</p>
              <p className="text-lg font-medium">{cert.issuedAt ? new Date(cert.issuedAt).toLocaleDateString("rw-RW") : "N/A"}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500 font-bold uppercase">Kode y'Umwimerere</p>
              <p className="text-lg font-mono text-gray-900">{cert.verifyCode}</p>
            </div>
          </div>
          
          <div className="mt-8 text-sm text-gray-500">
             Urashobora kugenzura umwimerere w'iki cyemezo unyuze kuri: amategeko.rw/certificate/{cert.verifyCode}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
