"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { collection, query, orderBy, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

// Sınav verisinin tipini tanımlayalım (Swift'teki struct gibi)
interface Exam {
  id: string;
  title: string;
  duration: number;
  isActive: boolean;
}

export default function Home() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);

  // Sayfa açıldığında sınavları çek
  useEffect(() => {
    const fetchExams = async () => {
      try {
        // Sınavları oluşturulma tarihine göre sıralayıp çek
        const q = query(collection(db, "exams"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        
        const examsList: Exam[] = [];
        querySnapshot.forEach((doc) => {
          examsList.push({ id: doc.id, ...doc.data() } as Exam);
        });
        
        setExams(examsList);
      } catch (error) {
        console.error("Sınavlar çekilirken hata oluştu:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchExams();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center p-6">
      <main className="max-w-4xl w-full space-y-10">
        
        {/* Başlık Alanı */}
        <div className="text-center space-y-2 mt-10">
          <h1 className="text-4xl font-bold text-blue-900 tracking-tight">
            DusNote Sınav Sistemi
          </h1>
          <p className="text-gray-500 text-lg">
            Türkiye Geneli Deneme Sınavı Yönetim Paneli
          </p>
        </div>

        {/* Üst Butonlar */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link 
            href="/create-exam" 
            className="bg-white border-2 border-blue-100 rounded-xl hover:border-blue-500 hover:shadow-lg transition-all p-6 flex items-center justify-center gap-4 group"
          >
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors text-xl">
              📝
            </div>
            <span className="font-semibold text-gray-700 text-lg">Yeni Sınav Oluştur</span>
          </Link>

          <Link 
  href="/results" 
  className="h-32 bg-white border-2 border-green-100 rounded-xl hover:border-green-500 hover:shadow-lg transition-all group p-6 flex flex-col items-center justify-center gap-3"
>
  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center group-hover:bg-green-600 group-hover:text-white transition-colors text-2xl">
    📊
  </div>
  <span className="font-semibold text-gray-700">Sonuçları Gör</span>
</Link>
        </div>

        {/* Sınav Listesi */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-800 border-b pb-2">Oluşturulmuş Sınavlar</h2>
          
          {loading ? (
            <p className="text-gray-500 text-center py-4">Yükleniyor...</p>
          ) : exams.length === 0 ? (
            <div className="text-center py-10 bg-white rounded-xl border border-dashed border-gray-300">
              <p className="text-gray-500">Henüz hiç sınav oluşturulmamış.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {exams.map((exam) => (
                <Link 
                  key={exam.id} 
                  href={`/exam/${exam.id}`} // Tıklayınca detay sayfasına gidecek
                  className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-blue-300 transition-all flex justify-between items-center"
                >
                  <div>
                    <h3 className="font-bold text-lg text-gray-800">{exam.title}</h3>
                    <p className="text-sm text-gray-500">Süre: {exam.duration} dk</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400">
                    ➔
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

      </main>
    </div>
  );
}