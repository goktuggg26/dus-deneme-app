"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { useParams } from "next/navigation";
import Link from "next/link";

export default function ResultPage() {
    const params = useParams();
    const id = params.id as string;

    const [result, setResult] = useState<any>(null);
    const [questions, setQuestions] = useState<any[]>([]);

    // Sıralama Listesi State'i
    const [rankings, setRankings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Ders Listeleri (Sıralı Gösterim İçin)
    const TEMEL_LESSONS = [
        "Anatomi",
        "Histoloji-Embriyoloji",
        "Fizyoloji",
        "Biyokimya",
        "Mikrobiyoloji",
        "Patoloji",
        "Farmakoloji",
        "Tıbbi Biyoloji ve Genetik"
    ];

    const KLINIK_LESSONS = [
        "Restoratif Diş Tedavisi",
        "Protetik Diş Tedavisi",
        "Ağız Diş ve Çene Cerrahisi",
        "Ağız Diş ve Çene Radyolojisi",
        "Periodontoloji",
        "Ortodonti",
        "Endodonti",
        "Çocuk Diş Hekimliği"
    ];

    useEffect(() => {
        const fetchAllData = async () => {
            if (!id) return;
            try {
                // 1. ÖĞRENCİNİN KENDİ SONUCUNU ÇEK
                const resultRef = doc(db, "results", id);
                const resultSnap = await getDoc(resultRef);

                if (resultSnap.exists()) {
                    const resultData = resultSnap.data();
                    setResult(resultData);

                    // 2. SINAV SORULARINI ÇEK (Cevap anahtarı için)
                    if (resultData.examId) {
                        const examRef = doc(db, "exams", resultData.examId);
                        const examSnap = await getDoc(examRef);
                        if (examSnap.exists()) {
                            setQuestions(examSnap.data().questions || []);
                        }

                        // 3. SIRALAMAYI ÇEK
                        const qRanking = query(
                            collection(db, "results"),
                            where("examId", "==", resultData.examId),
                            orderBy("totalNet", "desc")
                        );

                        const rankSnap = await getDocs(qRanking);
                        const rankList = rankSnap.docs.map(doc => ({
                            id: doc.id,
                            ...doc.data()
                        }));
                        setRankings(rankList);
                    }
                }
            } catch (error) {
                console.error("Veri çekme hatası:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchAllData();
    }, [id]);

    if (loading) return <div className="h-screen flex items-center justify-center text-blue-600 font-bold">Sonuçlar ve Sıralama Hazırlanıyor...</div>;
    if (!result) return <div className="h-screen flex items-center justify-center">Sonuç bulunamadı.</div>;

    const userAnswers = result.userAnswers || {};
    const detailedStats = result.detailedStats || {}; // Ders detayları
    const myRank = rankings.findIndex(r => r.id === id) + 1;

    return (
        <div className="min-h-screen bg-gray-50 p-6 flex flex-col items-center">
            <div className="max-w-5xl w-full space-y-8">

                {/* --- PUAN VE SIRALAMA KARTI --- */}
                <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 space-y-6 border border-gray-100">
                    <div className="text-center">
                        <h1 className="text-3xl font-bold text-gray-800 mb-2">
                            {result.studentName ? `Tebrikler, ${result.studentName}! 🎉` : "Sınav Tamamlandı!"}
                        </h1>
                        <p className="text-gray-500">{result.examTitle}</p>

                        {/* SIRALAMA DERECESİ */}
                        <div className="mt-4 inline-block bg-yellow-100 text-yellow-800 px-6 py-2 rounded-full font-bold text-lg border border-yellow-200">
                            🏆 Sıralamanız: {myRank}. / {rankings.length} Kişi
                        </div>
                    </div>

                    {/* DUS PUANLARI (K ve T) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
                        <div className="bg-blue-600 text-white rounded-xl p-6 shadow-md text-center relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-2 opacity-20 text-6xl">K</div>
                            <span className="text-blue-100 text-sm uppercase font-bold tracking-wider">K Puanı</span>
                            <div className="text-5xl font-extrabold my-2">{Number(result.scoreK || 0).toFixed(2)}</div>
                        </div>
                        <div className="bg-purple-600 text-white rounded-xl p-6 shadow-md text-center relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-2 opacity-20 text-6xl">T</div>
                            <span className="text-purple-100 text-sm uppercase font-bold tracking-wider">T Puanı</span>
                            <div className="text-5xl font-extrabold my-2">{Number(result.scoreT || 0).toFixed(2)}</div>
                        </div>
                    </div>

                    {/* --- YENİ: DERS DETAY TABLOSU --- */}
                    <div className="overflow-x-auto mt-8">
                        <h3 className="font-bold text-lg mb-4 text-gray-800 border-l-4 border-blue-600 pl-3">
                            Ders Ders Analiz
                        </h3>
                        <table className="w-full border-collapse text-center text-sm">
                            <thead>
                                <tr className="bg-gray-100 text-gray-600">
                                    <th className="p-3 text-left pl-6">Ders Adı</th>
                                    <th className="p-3">Soru</th>
                                    <th className="p-3 text-green-600">D</th>
                                    <th className="p-3 text-red-600">Y</th>
                                    <th className="p-3 text-gray-400">B</th>
                                    <th className="p-3 font-bold text-black">NET</th>
                                    <th className="p-3">Başarı</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {/* TEMEL DERSLER */}
                                {TEMEL_LESSONS.map(lesson => {
                                    const stat = detailedStats[lesson] || { total: 0, correct: 0, incorrect: 0, empty: 0 };
                                    if (stat.total === 0) return null; // Soru yoksa gösterme

                                    const net = Math.max(0, stat.correct - (stat.incorrect / 4));
                                    const percent = (net / stat.total) * 100;

                                    return (
                                        <tr key={lesson} className="hover:bg-blue-50 transition-colors">
                                            <td className="p-3 text-left pl-6 font-medium text-gray-700 border-l-4 border-transparent hover:border-blue-400">{lesson}</td>
                                            <td className="p-3 text-gray-500">{stat.total}</td>
                                            <td className="p-3 text-green-600 font-bold">{stat.correct}</td>
                                            <td className="p-3 text-red-600">{stat.incorrect}</td>
                                            <td className="p-3 text-gray-400">{stat.empty}</td>
                                            <td className="p-3 font-bold text-blue-900">{net.toFixed(2)}</td>
                                            <td className="p-3 text-xs text-gray-500">%{percent.toFixed(0)}</td>
                                        </tr>
                                    );
                                })}

                                {/* KLİNİK DERSLER */}
                                {KLINIK_LESSONS.map(lesson => {
                                    const stat = detailedStats[lesson] || { total: 0, correct: 0, incorrect: 0, empty: 0 };
                                    if (stat.total === 0) return null;

                                    const net = Math.max(0, stat.correct - (stat.incorrect / 4));
                                    const percent = (net / stat.total) * 100;

                                    return (
                                        <tr key={lesson} className="hover:bg-orange-50 transition-colors">
                                            <td className="p-3 text-left pl-6 font-medium text-gray-700 border-l-4 border-transparent hover:border-orange-400">{lesson}</td>
                                            <td className="p-3 text-gray-500">{stat.total}</td>
                                            <td className="p-3 text-green-600 font-bold">{stat.correct}</td>
                                            <td className="p-3 text-red-600">{stat.incorrect}</td>
                                            <td className="p-3 text-gray-400">{stat.empty}</td>
                                            <td className="p-3 font-bold text-orange-900">{net.toFixed(2)}</td>
                                            <td className="p-3 text-xs text-gray-500">%{percent.toFixed(0)}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* GENEL NET TABLOSU */}
                    <div className="overflow-x-auto mt-6 pt-6 border-t border-gray-100">
                        <h4 className="font-bold text-gray-600 mb-2 pl-2 text-sm">Genel Özet</h4>
                        <table className="w-full border-collapse text-center text-sm md:text-base">
                            <thead>
                                <tr className="bg-gray-100 text-gray-600">
                                    <th className="p-3 text-left pl-6">Bölüm</th>
                                    <th className="p-3">Doğru</th>
                                    <th className="p-3">Yanlış</th>
                                    <th className="p-3">Boş</th>
                                    <th className="p-3">NET</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                <tr className="bg-blue-50/50">
                                    <td className="p-3 font-bold text-gray-700 text-left pl-6">Temel Bilimler</td>
                                    <td className="p-3 text-green-600 font-bold">{result.tbt?.correct || 0}</td>
                                    <td className="p-3 text-red-600 font-bold">{result.tbt?.incorrect || 0}</td>
                                    <td className="p-3 text-gray-400">{result.tbt?.empty || 0}</td>
                                    <td className="p-3 font-extrabold text-blue-700">{Number(result.tbt?.net || 0).toFixed(2)}</td>
                                </tr>
                                <tr className="bg-orange-50/50">
                                    <td className="p-3 font-bold text-gray-700 text-left pl-6">Klinik Bilimler</td>
                                    <td className="p-3 text-green-600 font-bold">{result.kbt?.correct || 0}</td>
                                    <td className="p-3 text-red-600 font-bold">{result.kbt?.incorrect || 0}</td>
                                    <td className="p-3 text-gray-400">{result.kbt?.empty || 0}</td>
                                    <td className="p-3 font-extrabold text-orange-700">{Number(result.kbt?.net || 0).toFixed(2)}</td>
                                </tr>
                                <tr className="bg-gray-50 font-bold border-t-2 border-gray-200">
                                    <td className="p-3 text-left pl-6">TOPLAM</td>
                                    <td className="p-3 text-green-700">{(result.tbt?.correct || 0) + (result.kbt?.correct || 0)}</td>
                                    <td className="p-3 text-red-700">{(result.tbt?.incorrect || 0) + (result.kbt?.incorrect || 0)}</td>
                                    <td className="p-3 text-gray-500">{(result.tbt?.empty || 0) + (result.kbt?.empty || 0)}</td>
                                    <td className="p-3 text-xl text-gray-800">{Number(result.totalNet || 0).toFixed(2)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* --- CANLI SIRALAMA TABLOSU --- */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                        <h2 className="text-xl font-bold text-gray-800">📊 Genel Sıralama</h2>
                        <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded border">Toplam Net'e göre</span>
                    </div>

                    <div className="max-h-[400px] overflow-y-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-gray-100 text-gray-500 text-xs uppercase sticky top-0 z-10">
                                <tr>
                                    <th className="p-4">Sıra</th>
                                    <th className="p-4">Öğrenci Adı</th>
                                    <th className="p-4 text-center">TBT Net</th>
                                    <th className="p-4 text-center">KBT Net</th>
                                    <th className="p-4 text-right">Toplam Net</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 text-sm">
                                {rankings.map((rank, index) => {
                                    const isMe = rank.id === id;
                                    return (
                                        <tr key={rank.id} className={`hover:bg-gray-50 transition-colors ${isMe ? 'bg-blue-50 ring-2 ring-inset ring-blue-200' : ''}`}>
                                            <td className="p-4 font-bold text-gray-400 w-16">
                                                {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`}
                                            </td>
                                            <td className={`p-4 font-medium ${isMe ? 'text-blue-700 font-bold' : 'text-gray-700'}`}>
                                                {rank.studentName} {isMe && "(Siz)"}
                                            </td>
                                            <td className="p-4 text-center text-gray-500">{Number(rank.tbt?.net || 0).toFixed(1)}</td>
                                            <td className="p-4 text-center text-gray-500">{Number(rank.kbt?.net || 0).toFixed(1)}</td>
                                            <td className="p-4 text-right font-bold text-gray-800">{Number(rank.totalNet || 0).toFixed(2)}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Detaylı Cevaplar Kısmı */}
                <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-gray-800 ml-2">Detaylı Cevap Anahtarı</h2>
                    {questions.map((q, index) => {
                        const userAns = userAnswers[q.id];
                        const correctAns = q.correctOption;
                        const isCorrect = userAns === correctAns;
                        const isEmpty = userAns === undefined;
                        const isWrong = !isEmpty && !isCorrect;

                        return (
                            <div key={q.id} className={`bg-white rounded-xl shadow-sm border-2 p-6 transition-all relative ${isCorrect ? 'border-green-100' : isWrong ? 'border-red-100' : 'border-gray-200'}`}>
                                <div className="absolute top-0 right-0 flex gap-1">
                                    {/* DERS ETİKETİ */}
                                    {q.lesson && (
                                        <div className="bg-blue-50 text-blue-600 text-[10px] font-bold px-2 py-1 border-l border-b border-blue-100 rounded-bl-lg uppercase">
                                            {q.lesson}
                                        </div>
                                    )}
                                    {/* KATEGORİ ETİKETİ */}
                                    <div className="bg-gray-100 text-gray-500 text-[10px] font-bold px-2 py-1 rounded-bl-lg uppercase">
                                        {q.category || "Temel"}
                                    </div>
                                </div>
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="text-lg font-semibold text-gray-800 flex-1 pr-8">
                                        <span className="text-gray-400 mr-2">#{index + 1}</span>
                                        {q.text}
                                    </h3>
                                </div>
                                {q.imageUrl && <img src={q.imageUrl} alt="Soru" className="mb-4 max-h-48 rounded-lg border border-gray-100" />}
                                <div className="space-y-2">
                                    {q.options.map((opt: string, optIndex: number) => {
                                        let styleClass = "border-gray-200 bg-gray-50 text-gray-600";
                                        if (optIndex === correctAns) styleClass = "border-green-500 bg-green-50 text-green-900 font-bold ring-1 ring-green-500";
                                        else if (userAns === optIndex && isWrong) styleClass = "border-red-500 bg-red-50 text-red-900 font-bold ring-1 ring-red-500";
                                        else if (userAns === optIndex) styleClass = "border-blue-300 bg-blue-50 text-blue-900";

                                        return (
                                            <div key={optIndex} className={`p-3 rounded-lg border flex items-center gap-3 text-sm ${styleClass}`}>
                                                <div className="w-6 h-6 rounded-full border flex items-center justify-center text-xs bg-white/50">{String.fromCharCode(65 + optIndex)}</div>
                                                <span>{opt}</span>
                                                {optIndex === correctAns && <span className="ml-auto text-green-600 text-lg">✓</span>}
                                                {userAns === optIndex && isWrong && <span className="ml-auto text-red-600 text-lg">✕</span>}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="flex justify-center pb-10">
                    <Link href="/" className="inline-block bg-gray-800 text-white px-8 py-3 rounded-xl font-bold hover:bg-black transition-colors shadow-md">
                        Ana Sayfaya Dön
                    </Link>
                </div>

            </div>
        </div>
    );
}