"use client";
import { db } from "@/lib/firebase";
import { Timestamp, addDoc, collection } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";


export default function CreateExamPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    // EKSİK OLAN KISIM EKLENDİ: Form verilerini tutan state
    const [formData, setFormData] = useState({
        title: "",
        duration: 120,
        date: ""
    });

    // --- KORUMA KODU ---
    useEffect(() => {
        // Sadece tarayıcıda çalışması için kontrol
        const isAdmin = localStorage.getItem("isAdmin");
        if (!isAdmin) {
            router.push("/login");
        }
    }, [router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // 1. Veriyi hazırla
            const examData = {
                title: formData.title,
                duration: Number(formData.duration), // Yazım hatası düzeltildi
                startTime: Timestamp.fromDate(new Date(formData.date)),
                isActive: true,
                createdAt: Timestamp.now()
            };

            // 2. Firebase'e 'exams' koleksiyonuna kaydet
            const docRef = await addDoc(collection(db, "exams"), examData);

            alert(`Sınav başarıyla oluşturuldu! ID: ${docRef.id}`);
            router.push("/"); // Ana sayfaya yönlendir

        } catch (error) {
            console.error("Hata:", error);
            alert("Bir hata oluştu: " + error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md space-y-6">
                <h1 className="text-2xl font-bold text-gray-800 text-center">Yeni Sınav Oluştur</h1>

                <form onSubmit={handleSubmit} className="space-y-4">

                    {/* Sınav Adı */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Sınav Adı</label>
                        <input
                            type="text"
                            required
                            placeholder="Örn: DUS Deneme - 1"
                            className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none text-black"
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
                    </div>

                    {/* Tarih */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Başlangıç Tarihi</label>
                        <input
                            type="datetime-local"
                            required
                            className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none text-black"
                            onChange={(e) => setFormData({ ...formData, date: e.target.value })} />
                    </div>

                    {/* Süre */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Süre (Dakika)</label>
                        <input
                            type="number"
                            required
                            defaultValue={120}
                            className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none text-black"
                            onChange={(e) => setFormData({ ...formData, duration: Number(e.target.value) })} />
                    </div>

                    {/* Buton */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-400"
                    >
                        {loading ? "Kaydediliyor..." : "Sınavı Oluştur"}
                    </button>

                </form>
            </div>
        </div>
    );
}
