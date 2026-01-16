"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
import Link from "next/link";

export default function HomePage() {
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchExams = async () => {
      try {
        // Sınavları çekiyoruz
        const q = query(collection(db, "exams"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        const examList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setExams(examList);
      } catch (error) {
        console.error("Hata:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchExams();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center p-6">

      {/* BAŞLIK VE LOGO ALANI */}
      <div className="text-center mb-10 mt-6 space-y-2">
        <div className="text-6xl mb-2">🦷</div>
        <h1 className="text-3xl font-extrabold text-blue-900">Online DUS Deneme</h1>
        <p className="text-gray-500">Başarıya giden yolda kendini test et.</p>
      </div>

      {/* SINAV LİSTESİ */}
      <div className="w-full max-w-4xl">
        <h2 className="text-xl font-bold text-gray-800 mb-4 ml-2 border-l-4 border-blue-600 pl-3">Aktif Sınavlar</h2>

        {loading ? (
          <div className="text-center py-10 text-gray-400">Yükleniyor...</div>
        ) : exams.length === 0 ? (
          <div className="bg-white p-8 rounded-xl shadow-sm text-center text-gray-500">
            Henüz aktif bir sınav bulunmuyor.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {exams.map((exam) => (
              <div key={exam.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex flex-col justify-between h-full">
                <div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">{exam.title}</h3>
                  <div className="text-sm text-gray-500 space-y-1 mb-4">
                    <p>⏱️ Süre: {exam.duration} Dakika</p>
                    {/* Tarihi güvenli gösterme */}
                    <p>📅 Tarih: {exam.startTime?.toDate ? exam.startTime.toDate().toLocaleDateString('tr-TR') : new Date(exam.startTime).toLocaleDateString('tr-TR')}</p>
                  </div>
                </div>

                {/* BURASI ÇOK ÖNEMLİ: Link direkt öğrenci sayfasına gidiyor */}
                <Link
                  href={`/ogrenci/${exam.id}`}
                  className="block w-full text-center bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors"
                >
                  Sınava Başla 🚀
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ALT BİLGİ VE YÖNETİCİ LİNKİ */}
      <div className="mt-16 text-center">
        <p className="text-gray-400 text-sm mb-4">Bu proje DUS öğrencileri için hazırlanmıştır.</p>

        {/* GİZLİ YÖNETİCİ KAPISI */}
        <Link href="/login" className="text-xs text-gray-300 hover:text-gray-500 transition-colors border-b border-gray-200 pb-0.5">
          Yönetici Girişi
        </Link>
      </div>

    </div>
  );
}