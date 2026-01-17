"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy, deleteDoc, doc } from "firebase/firestore";
import Link from "next/link";

export default function HomePage() {
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdmin = localStorage.getItem("isAdmin");
    setIsAdmin(!!checkAdmin);
    fetchExams();
  }, []);

  const fetchExams = async () => {
    try {
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

  const handleDeleteExam = async (examId: string) => {
    if (!confirm("DİKKAT! Bu sınavı ve içindeki tüm soruları kalıcı olarak silmek istediğine emin misin?")) return;
    try {
      await deleteDoc(doc(db, "exams", examId));
      setExams(prev => prev.filter(e => e.id !== examId));
      alert("Sınav silindi.");
    } catch (error) {
      console.error("Silme hatası:", error);
      alert("Bir hata oluştu.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center p-6">

      <div className="text-center mb-10 mt-6 space-y-2">
        <div className="text-6xl mb-2">🦷</div>
        <h1 className="text-3xl font-extrabold text-blue-900">Online DUS Deneme</h1>
        <p className="text-gray-500">Başarıya giden yolda kendini test et.</p>

        {isAdmin && (
          <div className="mt-4">
            <Link href="/create-exam" className="bg-green-600 text-white px-6 py-2 rounded-full font-bold hover:bg-green-700 transition-colors shadow-md">
              + Yeni Sınav Oluştur
            </Link>
          </div>
        )}
      </div>

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
            {exams.map((exam) => {
              // SÜRE KONTROLÜ
              // Eğer endDate varsa ve şu anki zaman endDate'den büyükse sınav bitmiştir.
              const endDate = exam.endDate?.toDate ? exam.endDate.toDate() : new Date(exam.endDate);
              const isExpired = new Date() > endDate;

              return (
                <div key={exam.id} className={`bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between h-full relative group transition-all ${isExpired ? 'opacity-80' : 'hover:shadow-md'}`}>

                  {isAdmin && (
                    <button
                      onClick={() => handleDeleteExam(exam.id)}
                      className="absolute top-4 right-4 text-gray-300 hover:text-red-600 transition-colors"
                      title="Sınavı Sil"
                    >
                      🗑 Sil
                    </button>
                  )}

                  <div>
                    <div className="flex justify-between items-start pr-8">
                      <h3 className="text-xl font-bold text-gray-800 mb-2">{exam.title}</h3>
                      {isExpired && (
                        <span className="bg-red-100 text-red-600 text-[10px] font-bold px-2 py-1 rounded">SÜRE DOLDU</span>
                      )}
                    </div>

                    <div className="text-sm text-gray-500 space-y-1 mb-4">
                      <p>⏱️ Süre: {exam.duration} Dakika</p>
                      <p className="flex items-center gap-1">
                        📅 Bitiş: <span className={isExpired ? "text-red-500 font-bold" : "text-gray-700"}>
                          {endDate.toLocaleString('tr-TR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </p>
                      <p className="text-xs bg-gray-100 inline-block px-2 py-1 rounded mt-1">Soru Sayısı: {exam.questions?.length || 0}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {/* BAŞLA BUTONU: Süre dolduysa Pasif, dolmadıysa Aktif */}
                    {isExpired ? (
                      <button disabled className="col-span-2 md:col-span-1 flex items-center justify-center bg-gray-300 text-white py-3 rounded-lg font-bold cursor-not-allowed">
                        Erişim Kapandı 🔒
                      </button>
                    ) : (
                      <Link
                        href={`/ogrenci/${exam.id}`}
                        className="col-span-2 md:col-span-1 flex items-center justify-center bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors"
                      >
                        Başla 🚀
                      </Link>
                    )}

                    <Link
                      href={`/siralama/${exam.id}`}
                      className="col-span-2 md:col-span-1 flex items-center justify-center bg-gray-100 text-gray-700 py-3 rounded-lg font-bold hover:bg-gray-200 transition-colors border border-gray-200"
                    >
                      🏆 Sıralama
                    </Link>
                  </div>

                  {isAdmin && (
                    <Link href={`/exam/${exam.id}`} className="block w-full text-center text-sm text-gray-500 hover:text-blue-600 mt-2">
                      Soruları Düzenle
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-16 text-center">
        <p className="text-gray-400 text-sm mb-4">Bu proje DUS öğrencileri için hazırlanmıştır.</p>
        {!isAdmin ? (
          <Link href="/login" className="text-xs text-gray-300 hover:text-gray-500 transition-colors border-b border-gray-200 pb-0.5">
            Yönetici Girişi
          </Link>
        ) : (
          <button onClick={() => { localStorage.removeItem("isAdmin"); window.location.reload(); }} className="text-xs text-red-300 hover:text-red-500">
            Yönetici Çıkışı Yap
          </button>
        )}
      </div>

    </div>
  );
}