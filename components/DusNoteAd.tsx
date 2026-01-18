"use client";
import { useState } from 'react';
import Link from 'next/link';

export default function DusNoteAd() {
    const [showDetails, setShowDetails] = useState(false);

    const features = [
        {
            icon: "🧠",
            title: "Akıllı Tekrar Sistemi",
            desc: "Algoritmamız, zayıf olduğun konuları tespit eder ve unutmaman için tekrar karşına çıkarır."
        },
        {
            icon: "📅",
            title: "Kişisel Çalışma Planı",
            desc: "Hedeflediğin puana ve kalan zamana göre sana özel dinamik çalışma takvimi oluşturulur."
        },
        {
            icon: "📝",
            title: "Gelişmiş Not Alma",
            desc: "Kendi notlarını oluştur, önemli yerleri vurgula ve sesli notlar ekleyerek verimini artır."
        },
        {
            icon: "📊",
            title: "Detaylı İstatistikler",
            desc: "Hangi derste ne kadar ilerlediğini ve performansını grafiklerle anlık olarak takip et."
        }
    ];

    return (
        <div className="w-full max-w-4xl mb-12 transform transition-all duration-300 hover:shadow-xl">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 p-1 shadow-lg">
                {/* Background Pattern Effect */}
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 rounded-full bg-white opacity-10 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 rounded-full bg-white opacity-10 blur-3xl"></div>

                <div className="relative bg-white rounded-xl p-6 md:p-8 flex flex-col gap-8 h-full">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                        <div className="space-y-4 text-center md:text-left flex-1 z-10">
                            <div className="inline-block px-3 py-1 bg-indigo-50 text-indigo-600 text-xs font-bold rounded-full border border-indigo-100 mb-2">
                                ✨ DUS Hazırlığında Yeni Dönem
                            </div>
                            <h3 className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 leading-tight">
                                DusNote ile Başarıyı Not Al!
                            </h3>
                            <p className="text-gray-600 text-lg">
                                Kişiye özel çalışma planı, akıllı tekrar sistemi ve gelişmiş not tutma araçlarıyla
                                DUS sürecini profesyonelce yönet.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start pt-2">
                                <Link
                                    href="https://apps.apple.com/tr/app/dusnote/id6757265879?l=tr"
                                    target="_blank"
                                    className="inline-flex items-center justify-center px-8 py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl hover:shadow-lg hover:from-indigo-700 hover:to-purple-700 transition-all transform hover:-translate-y-0.5"
                                >
                                    Ücretsiz İndir
                                </Link>
                                <button
                                    onClick={() => setShowDetails(!showDetails)}
                                    className="inline-flex items-center justify-center px-8 py-3.5 bg-white text-gray-700 border border-gray-200 font-bold rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all"
                                >
                                    {showDetails ? "Gizle" : "Nasıl Çalışır?"}
                                </button>
                            </div>
                        </div>

                        <div className="relative flex-shrink-0 z-10">
                            <div className="w-40 h-40 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-3xl rotate-3 flex items-center justify-center shadow-inner border border-indigo-100">
                                <span className="text-7xl filter drop-shadow-md">📘</span>
                            </div>
                            <div className="absolute -bottom-4 -right-4 bg-white p-3 rounded-2xl shadow-lg border border-gray-100 flex items-center gap-2 animate-bounce-slow">
                                <span className="text-yellow-500 text-xl">⭐</span>
                                <div className="flex flex-col">
                                    <span className="text-xs font-bold text-gray-800">4.9/5</span>
                                    <span className="text-[10px] text-gray-500">Kullanıcı Oyu</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* How it Works Section */}
                    {showDetails && (
                        <div className="border-t border-gray-100 pt-8 mt-2 animate-fadeIn">
                            <h4 className="text-xl font-bold text-gray-800 mb-6 text-center md:text-left">Öne Çıkan Özellikler</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {features.map((feature, idx) => (
                                    <div key={idx} className="flex gap-4 p-4 rounded-xl bg-gray-50 border border-gray-100 items-start hover:bg-indigo-50 transition-colors duration-300">
                                        <div className="text-3xl bg-white w-12 h-12 rounded-lg flex items-center justify-center shadow-sm flex-shrink-0">
                                            {feature.icon}
                                        </div>
                                        <div>
                                            <h5 className="font-bold text-gray-900 mb-1">{feature.title}</h5>
                                            <p className="text-sm text-gray-600 leading-relaxed">{feature.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
