"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, addDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function CreateExamPage() {
  const [title, setTitle] = useState("");
  const [duration, setDuration] = useState(120); // Varsayılan 120 dk
  const [endDate, setEndDate] = useState(""); // YENİ: Bitiş Tarihi
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Yönetici koruması
    const isAdmin = localStorage.getItem("isAdmin");
    if (!isAdmin) {
      router.push("/login");
    }
  }, [router]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !endDate) {
      alert("Lütfen sınav adını ve son erişim tarihini giriniz.");
      return;
    }

    setLoading(true);

    try {
      // Sınavı veritabanına ekle
      const docRef = await addDoc(collection(db, "exams"), {
        title: title,
        duration: Number(duration),
        createdAt: new Date(),
        startTime: new Date(), // Oluşturulma tarihi
        endDate: new Date(endDate), // YENİ: Bitiş Tarihi (Sistemin kontrol edeceği yer)
        questions: []
      });

      // Oluşturunca direkt soru ekleme sayfasına git
      router.push(`/exam/${docRef.id}`);

    } catch (error) {
      console.error("Hata:", error);
      alert("Bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md space-y-6">
        <h1 className="text-2xl font-bold text-gray-800 text-center">Yeni Sınav Oluştur</h1>

        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sınav Adı</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-3 outline-none focus:ring-2 focus:ring-green-500 text-black"
              placeholder="Örn: 1. Geneli Deneme Sınavı"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sınav Süresi (Dakika)</label>
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-full border border-gray-300 rounded-lg p-3 outline-none focus:ring-2 focus:ring-green-500 text-black"
            />
          </div>

          {/* YENİ: BİTİŞ TARİHİ SEÇİMİ */}
          <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
            <label className="block text-sm font-bold text-yellow-800 mb-1">Son Erişim Tarihi ⏳</label>
            <input
              type="datetime-local"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-3 outline-none focus:ring-2 focus:ring-green-500 text-black"
            />
            <p className="text-xs text-yellow-700 mt-2">
              Bu tarihten sonra öğrenciler sınava <b>giremeyecek</b>, ancak sonuçlarını görebilecekler.
            </p>
          </div>

          <button disabled={loading} className="w-full bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 transition-colors">
            {loading ? "Oluşturuluyor..." : "Oluştur ve Soru Ekle →"}
          </button>
        </form>

        <Link href="/" className="block text-center text-sm text-gray-500 hover:text-gray-800">
          İptal ve Ana Sayfaya Dön
        </Link>
      </div>
    </div>
  );
}