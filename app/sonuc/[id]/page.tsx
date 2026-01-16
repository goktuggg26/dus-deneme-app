"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { useParams } from "next/navigation";
import Link from "next/link";

export default function ResultPage() {
    const params = useParams();
    const id = params.id as string;
    const [result, setResult] = useState<any>(null);
    const [questions, setQuestions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchResultAndQuestions = async () => {
            if (!id) return;
            try {
                const resultRef = doc(db, "results", id);
                const resultSnap = await getDoc(resultRef);

                if (resultSnap.exists()) {
                    const resultData = resultSnap.data();
                    setResult(resultData);

                    if (resultData.examId) {
                        const qRef = collection(db, "exams", resultData.examId, "questions");
                        const qSnap = await getDocs(qRef);
                        const qList = qSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                        // Sıralama önemli, aynı sırada göstermek için
                        qList.sort((a: any, b: any) => a.createdAt?.seconds - b.createdAt?.seconds);
                        setQuestions(qList);
                    }
                }
            } catch (error) {
                console.error("Veri çekme hatası:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchResultAndQuestions();
    }, [id]);

    if (loading) return <div className="h-screen flex items-center justify-center text-blue-600 font-bold">Sonuçlar hazırlanıyor...</div>;
    if (!result) return <div className="h-screen flex items-center justify-center">Sonuç bulunamadı.</div>;

    const userAnswers = result.userAnswers || {};

    return (
        <div className="min-h-screen bg-gray-50 p-6 flex flex-col items-center">
            <div className="max-w-5xl w-full space-y-8">

                {/* --- PUAN VE NET TABLOSU --- */}
                <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 space-y-8 border border-gray-100">
                    <div className="text-center">
                        <h1 className="text-3xl font-bold text-gray-800 mb-2">
                            {result.studentName ? `Tebrikler, ${result.studentName}! 🎉` : "Sınav Tamamlandı!"}
                        </h1>
                        <p className="text-gray-500">{result.examTitle}</p>
                    </div>

                    {/* DUS PUANLARI (K ve T) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
                        <div className="bg-blue-600 text-white rounded-xl p-6 shadow-md text-center relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-2 opacity-20 text-6xl">K</div>
                            <span className="text-blue-100 text-sm uppercase font-bold tracking-wider">K Puanı (Klinik Ağırlıklı)</span>
                            <div className="text-5xl font-extrabold my-2">{Number(result.scoreK || 0).toFixed(2)}</div>
                        </div>
                        <div className="bg-purple-600 text-white rounded-xl p-6 shadow-md text-center relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-2 opacity-20 text-6xl">T</div>
                            <span className="text-purple-100 text-sm uppercase font-bold tracking-wider">T Puanı (Temel Ağırlıklı)</span>
                            <div className="text-5xl font-extrabold my-2">{Number(result.scoreT || 0).toFixed(2)}</div>
                        </div>
                    </div>

                    {/* NET TABLOSU */}
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-center text-sm md:text-base">
                            <thead>
                                <tr className="bg-gray-100 text-gray-600">
                                    <th className="p-3 rounded-tl-lg">Bölüm</th>
                                    <th className="p-3">Doğru</th>
                                    <th className="p-3">Yanlış</th>
                                    <th className="p-3">Boş</th>
                                    <th className="p-3 rounded-tr-lg">NET</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {/* TEMEL BİLİMLER SATIRI */}
                                <tr className="bg-blue-50/50">
                                    <td className="p-3 font-bold text-gray-700 text-left pl-6">Temel Bilimler (TBT)</td>
                                    <td className="p-3 text-green-600 font-bold">{result.tbt?.correct || 0}</td>
                                    <td className="p-3 text-red-600 font-bold">{result.tbt?.incorrect || 0}</td>
                                    <td className="p-3 text-gray-400">{result.tbt?.empty || 0}</td>
                                    <td className="p-3 font-extrabold text-blue-700 text-lg">{Number(result.tbt?.net || 0).toFixed(2)}</td>
                                </tr>
                                {/* KLİNİK BİLİMLER SATIRI */}
                                <tr className="bg-orange-50/50">
                                    <td className="p-3 font-bold text-gray-700 text-left pl-6">Klinik Bilimler (KBT)</td>
                                    <td className="p-3 text-green-600 font-bold">{result.kbt?.correct || 0}</td>
                                    <td className="p-3 text-red-600 font-bold">{result.kbt?.incorrect || 0}</td>
                                    <td className="p-3 text-gray-400">{result.kbt?.empty || 0}</td>
                                    <td className="p-3 font-extrabold text-orange-700 text-lg">{Number(result.kbt?.net || 0).toFixed(2)}</td>
                                </tr>
                                {/* TOPLAM SATIRI */}
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

                    <div className="flex justify-center">
                        <Link href="/" className="inline-block bg-gray-800 text-white px-8 py-3 rounded-xl font-bold hover:bg-black transition-colors shadow-md">
                            Ana Sayfaya Dön
                        </Link>
                    </div>
                </div>

                {/* --- DETAYLI CEVAP ANAHTARI --- */}
                <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-gray-800 ml-2">Detaylı Cevap Anahtarı</h2>

                    {questions.map((q, index) => {
                        const userAns = userAnswers[q.id];
                        const correctAns = q.correctOption;

                        const isCorrect = userAns === correctAns;
                        const isEmpty = userAns === undefined;
                        const isWrong = !isEmpty && !isCorrect;

                        return (
                            <div key={q.id} className={`bg-white rounded-xl shadow-sm border-2 p-6 transition-all relative overflow-hidden ${isCorrect ? 'border-green-100' : isWrong ? 'border-red-100' : 'border-gray-200'}`}>

                                {/* Kategori Etiketi */}
                                <div className="absolute top-0 right-0 bg-gray-100 text-gray-500 text-[10px] font-bold px-2 py-1 rounded-bl-lg uppercase">
                                    {q.category || "Temel"}
                                </div>

                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="text-lg font-semibold text-gray-800 flex-1 pr-8">
                                        <span className="text-gray-400 mr-2">#{index + 1}</span>
                                        {q.text}
                                    </h3>
                                </div>

                                {q.imageUrl && (
                                    <div className="mb-4">
                                        <img src={q.imageUrl} alt="Soru görseli" className="max-h-48 rounded-lg border border-gray-100" />
                                    </div>
                                )}

                                <div className="space-y-2">
                                    {q.options.map((opt: string, optIndex: number) => {
                                        let styleClass = "border-gray-200 bg-gray-50 text-gray-600";

                                        if (optIndex === correctAns) {
                                            styleClass = "border-green-500 bg-green-50 text-green-900 font-bold ring-1 ring-green-500";
                                        }
                                        else if (userAns === optIndex && isWrong) {
                                            styleClass = "border-red-500 bg-red-50 text-red-900 font-bold ring-1 ring-red-500";
                                        }
                                        else if (userAns === optIndex) {
                                            styleClass = "border-blue-300 bg-blue-50 text-blue-900";
                                        }

                                        return (
                                            <div key={optIndex} className={`p-3 rounded-lg border flex items-center gap-3 text-sm ${styleClass}`}>
                                                <div className="w-6 h-6 rounded-full border flex items-center justify-center text-xs bg-white/50">
                                                    {String.fromCharCode(65 + optIndex)}
                                                </div>
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

            </div>
        </div>
    );
}