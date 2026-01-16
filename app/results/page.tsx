"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, getDocs } from "firebase/firestore";
import Link from "next/link";
import { useRouter } from "next/navigation"; // <-- useRouter eklendi

export default function AllResultsPage() {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter(); // <-- Router tanımlandı

  // --- KORUMA KODU (BURASI EKLENDİ) ---
  useEffect(() => {
    const isAdmin = localStorage.getItem("isAdmin");
    if (!isAdmin) {
      router.push("/login");
    }
  }, [router]);
  // ------------------------------------

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const q = query(collection(db, "results"), orderBy("date", "desc"));
        const snapshot = await getDocs(q);
        const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setResults(list);
      } catch (error) {
        console.error("Hata:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, []);

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "-";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString("tr-TR");
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 flex flex-col items-center">
      <div className="max-w-6xl w-full space-y-6">

        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-blue-900">Sınav Sıralaması</h1>
          <Link href="/" className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors">
            ← Ana Sayfa
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-10 text-center text-gray-500">Yükleniyor...</div>
          ) : results.length === 0 ? (
            <div className="p-10 text-center text-gray-500">Henüz hiç sınav sonucu yok.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-100 text-gray-600 text-sm uppercase">
                  <tr>
                    <th className="p-4 font-semibold">Tarih</th>
                    <th className="p-4 font-semibold">Öğrenci Adı</th>
                    <th className="p-4 font-semibold">Sınav Adı</th>
                    <th className="p-4 font-semibold text-center">Doğru</th>
                    <th className="p-4 font-semibold text-center">Yanlış</th>
                    <th className="p-4 font-semibold text-center">Boş</th>
                    <th className="p-4 font-semibold text-right">Puan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {results.map((res) => (
                    <tr key={res.id} className="hover:bg-blue-50 transition-colors group">
                      <td className="p-4 text-gray-500 text-sm whitespace-nowrap">{formatDate(res.date)}</td>

                      {/* ÖĞRENCİ ADI */}
                      <td className="p-4 font-bold text-gray-800 capitalize">
                        {res.studentName || <span className="text-gray-400 italic">İsimsiz</span>}
                      </td>

                      <td className="p-4 font-medium text-gray-600">{res.examTitle}</td>
                      <td className="p-4 text-center text-green-600 font-bold">{res.correct}</td>
                      <td className="p-4 text-center text-red-600 font-bold">{res.incorrect}</td>
                      <td className="p-4 text-center text-gray-400">{res.empty}</td>
                      <td className="p-4 text-right">
                        <span className={`px-3 py-1 rounded-full text-sm font-bold ${res.score >= 50 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {Math.round(res.score)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}