"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, orderBy, doc, getDoc } from "firebase/firestore";
import { useParams } from "next/navigation";
import Link from "next/link";

export default function LeaderboardPage() {
    const params = useParams();
    const examId = params.examId as string;

    const [rankings, setRankings] = useState<any[]>([]);
    const [filteredRankings, setFilteredRankings] = useState<any[]>([]);
    const [examTitle, setExamTitle] = useState("");
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        const fetchData = async () => {
            if (!examId) return;

            try {
                // 1. Sınav Adını Çek
                const examRef = doc(db, "exams", examId);
                const examSnap = await getDoc(examRef);
                if (examSnap.exists()) {
                    setExamTitle(examSnap.data().title);
                }

                // 2. Tüm Sonuçları Çek ve Sırala (Toplam Net'e göre)
                const q = query(
                    collection(db, "results"),
                    where("examId", "==", examId),
                    orderBy("totalNet", "desc")
                );

                const snapshot = await getDocs(q);
                const list = snapshot.docs.map(doc => ({
                    id: doc.id, // Sonuç ID'si (Öğrenci detayına gitmek isterse diye)
                    ...doc.data()
                }));

                setRankings(list);
                setFilteredRankings(list);
            } catch (error) {
                console.error("Veri çekme hatası:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [examId]);

    // Arama Fonksiyonu
    useEffect(() => {
        const results = rankings.filter(r =>
            r.studentName.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredRankings(results);
    }, [searchTerm, rankings]);

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center p-6">

            <div className="max-w-4xl w-full space-y-6">

                {/* Başlık Alanı */}
                <div className="flex flex-col md:flex-row items-center justify-between bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                            🏆 Genel Sıralama
                        </h1>
                        <p className="text-gray-500 mt-1">{examTitle}</p>
                    </div>
                    <Link href="/" className="mt-4 md:mt-0 px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors text-sm font-bold">
                        ← Ana Sayfaya Dön
                    </Link>
                </div>

                {/* Tablo ve Arama */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden min-h-[500px]">

                    {/* Arama Çubuğu */}
                    <div className="p-4 border-b border-gray-100 bg-gray-50">
                        <input
                            type="text"
                            placeholder="Öğrenci Adı Ara..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full md:w-1/3 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-black"
                        />
                    </div>

                    {loading ? (
                        <div className="p-10 text-center text-gray-500 font-bold">Veriler Yükleniyor...</div>
                    ) : filteredRankings.length === 0 ? (
                        <div className="p-10 text-center text-gray-400">Henüz sonuç yok veya aranan isim bulunamadı.</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-gray-100 text-gray-500 text-xs uppercase sticky top-0">
                                    <tr>
                                        <th className="p-4">Sıra</th>
                                        <th className="p-4">Öğrenci Adı</th>
                                        <th className="p-4 text-center hidden md:table-cell">TBT Net</th>
                                        <th className="p-4 text-center hidden md:table-cell">KBT Net</th>
                                        <th className="p-4 text-center">Toplam Net</th>
                                        <th className="p-4 text-right">Tarih</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 text-sm">
                                    {filteredRankings.map((rank, index) => {
                                        // Gerçek sıralama (Rankings listesindeki indexi)
                                        // Filterelenmiş listede olsak bile gerçek sırasını bulalım
                                        const realRank = rankings.findIndex(r => r.id === rank.id) + 1;

                                        return (
                                            <tr key={rank.id} className="hover:bg-blue-50 transition-colors group">
                                                <td className="p-4 font-bold text-gray-500 w-16">
                                                    {realRank === 1 ? '🥇' : realRank === 2 ? '🥈' : realRank === 3 ? '🥉' : `${realRank}.`}
                                                </td>
                                                <td className="p-4 font-bold text-gray-800 capitalize">
                                                    {rank.studentName}
                                                </td>
                                                <td className="p-4 text-center text-gray-500 hidden md:table-cell">{Number(rank.tbt?.net || 0).toFixed(1)}</td>
                                                <td className="p-4 text-center text-gray-500 hidden md:table-cell">{Number(rank.kbt?.net || 0).toFixed(1)}</td>
                                                <td className="p-4 text-center font-bold text-blue-700 bg-blue-50/50 rounded-lg">{Number(rank.totalNet || 0).toFixed(2)}</td>
                                                <td className="p-4 text-right text-xs text-gray-400">
                                                    {rank.date?.toDate ? rank.date.toDate().toLocaleDateString('tr-TR') : "-"}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}