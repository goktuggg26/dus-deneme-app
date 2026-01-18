"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, addDoc } from "firebase/firestore";
import { useParams, useRouter } from "next/navigation";

export default function StudentExamPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [examData, setExamData] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);

  const [studentName, setStudentName] = useState("");
  const [isExamStarted, setIsExamStarted] = useState(false);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<{ [key: string]: number }>({});
  const [timeLeft, setTimeLeft] = useState(0);

  // --- MOBİLDE NAVİGASYON AÇIK MI? ---
  const [isNavOpen, setIsNavOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        const examSnap = await getDoc(doc(db, "exams", id));
        if (examSnap.exists()) {
          const data = examSnap.data();

          // GÜVENLİK KONTROLÜ
          if (data.endDate) {
              const endDate = data.endDate.toDate ? data.endDate.toDate() : new Date(data.endDate);
              if (new Date() > endDate) {
                  alert("Üzgünüz, bu sınavın erişim süresi dolmuştur.");
                  router.push("/"); 
                  return;
              }
          }

          setExamData(data);
          setTimeLeft(data.duration * 60);
          setQuestions(data.questions || []);
        } else {
          alert("Sınav bulunamadı!");
          router.push("/");
        }
      } catch (err) {
        console.error("Veri hatası:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, router]);

  useEffect(() => {
    if (loading || !isExamStarted || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          finishExam(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [loading, isExamStarted, timeLeft]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleSelectOption = (optionIndex: number) => {
    const currentQ = questions[currentIndex];
    setAnswers(prev => ({ ...prev, [currentQ.id]: optionIndex }));
  };

  const startExam = () => {
    if (studentName.trim() === "") {
      alert("Lütfen adınızı giriniz.");
      return;
    }
    setIsExamStarted(true);
  };

  const finishExam = async (forceFinish = false) => {
    if (!forceFinish && timeLeft > 0 && !confirm("Sınavı bitirmek istediğinize emin misiniz?")) return;
    setLoading(true);

    let tbtCorrect = 0, tbtIncorrect = 0, tbtEmpty = 0;
    let kbtCorrect = 0, kbtIncorrect = 0, kbtEmpty = 0;
    let detailedStats: any = {};

    questions.forEach(q => {
      const userAnswer = answers[q.id];
      const category = q.category || "Temel";
      const lesson = q.lesson || "Genel";
      const isCorrect = userAnswer === q.correctOption;
      const isEmpty = userAnswer === undefined;
      
      if (category === "Temel") {
        if (isEmpty) tbtEmpty++; else if (isCorrect) tbtCorrect++; else tbtIncorrect++;
      } else {
        if (isEmpty) kbtEmpty++; else if (isCorrect) kbtCorrect++; else kbtIncorrect++;
      }

      if (!detailedStats[lesson]) detailedStats[lesson] = { correct: 0, incorrect: 0, empty: 0, total: 0, category: category };
      detailedStats[lesson].total += 1;
      if (isEmpty) detailedStats[lesson].empty++;
      else if (isCorrect) detailedStats[lesson].correct++;
      else detailedStats[lesson].incorrect++;
    });

    const tbtNet = Math.max(0, tbtCorrect - (tbtIncorrect / 4));
    const kbtNet = Math.max(0, kbtCorrect - (kbtIncorrect / 4));
    const totalNet = tbtNet + kbtNet;
    const scoreK = (tbtNet * 0.4) + (kbtNet * 0.6);
    const scoreT = (tbtNet * 0.6) + (kbtNet * 0.4);

    try {
      const resultData = {
        examId: id,
        examTitle: examData.title,
        studentName: studentName,
        tbt: { correct: tbtCorrect, incorrect: tbtIncorrect, empty: tbtEmpty, net: tbtNet },
        kbt: { correct: kbtCorrect, incorrect: kbtIncorrect, empty: kbtEmpty, net: kbtNet },
        detailedStats: detailedStats,
        scoreK, scoreT, totalNet,
        date: new Date(),
        userAnswers: answers
      };
      const docRef = await addDoc(collection(db, "results"), resultData);
      router.push(`/sonuc/${docRef.id}`);
    } catch (error) {
      console.error(error);
      alert("Hata oluştu.");
      setLoading(false);
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center text-blue-600 font-bold">Yükleniyor...</div>;

  if (!isExamStarted) {
    return (
      <div className="min-h-[100dvh] bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center space-y-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto text-3xl">📝</div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{examData?.title}</h1>
            <p className="text-gray-500 mt-2">{questions.length} Soru • {examData?.duration} Dakika</p>
          </div>
          <input
            type="text"
            placeholder="Adınız Soyadınız"
            value={studentName}
            onChange={(e) => setStudentName(e.target.value)}
            className="w-full border border-gray-300 rounded-lg p-3 text-center text-black"
          />
          <button onClick={startExam} className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold">Sınavı Başlat</button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;

  return (
    // DÜZELTME: h-screen yerine h-[100dvh] kullanarak mobilde adres çubuğu sorununu çözüyoruz
    <div className="h-[100dvh] flex flex-col bg-gray-50 overflow-hidden">

      {/* ÜST BAR */}
      <div className="bg-white border-b border-gray-200 px-4 md:px-6 py-3 flex justify-between items-center shrink-0 h-16">
        <div className="overflow-hidden">
          <h1 className="font-bold text-gray-800 truncate text-sm md:text-base">{examData?.title}</h1>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-600">
              {currentQuestion?.category || "Genel"}
            </span>
            {currentQuestion?.lesson && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-100 truncate max-w-[150px]">
                {currentQuestion.lesson}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
             <div className={`font-mono text-lg md:text-xl font-bold px-3 py-1 rounded-lg ${timeLeft < 300 ? 'bg-red-100 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                {formatTime(timeLeft)}
            </div>
            <button onClick={() => setIsNavOpen(!isNavOpen)} className="md:hidden p-2 text-gray-600 bg-gray-100 rounded-lg text-sm font-bold">
                {isNavOpen ? "Kapat" : "Listeyi Gör"}
            </button>
        </div>
      </div>

      {/* ANA İÇERİK */}
      <div className="flex-1 overflow-hidden relative flex">

        {/* SOL: SORU ALANI */}
        <div className={`flex-1 overflow-y-auto p-4 md:p-8 transition-all ${isNavOpen ? 'hidden md:block' : 'block'}`}>
          <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-200 p-5 md:p-10 min-h-[500px] flex flex-col">
            <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-6 flex gap-3">
              <span className="text-blue-600 shrink-0">#{currentIndex + 1}</span>
              <span>{currentQuestion?.text}</span>
            </h2>

            {currentQuestion?.imageUrl && (
              <div className="mb-6 flex justify-center">
                <img src={currentQuestion.imageUrl} alt="Görsel" className="max-h-[250px] md:max-h-[300px] rounded-lg border object-contain" />
              </div>
            )}

            <div className="space-y-3 flex-1 pb-4">
              {currentQuestion?.options.map((opt: string, idx: number) => {
                const isSelected = answers[currentQuestion.id] === idx;
                return (
                  <button
                    key={idx}
                    onClick={() => handleSelectOption(idx)}
                    className={`w-full text-left p-4 rounded-xl border-2 flex items-center gap-4 transition-all
                            ${isSelected ? 'border-blue-500 bg-blue-50 text-blue-900' : 'border-gray-100 hover:bg-gray-50 text-gray-700'}`}
                  >
                    <div className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center font-bold text-sm border
                            ${isSelected ? 'bg-blue-500 text-white border-blue-500' : 'bg-white border-gray-300'}`}>
                      {String.fromCharCode(65 + idx)}
                    </div>
                    <span className="font-medium text-sm md:text-base">{opt}</span>
                  </button>
                );
              })}
            </div>

            {/* İLERİ GERİ BUTONLARI */}
            <div className="flex justify-between mt-4 pt-4 border-t border-gray-100">
              <button
                onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                disabled={currentIndex === 0}
                className="px-6 py-3 rounded-lg text-gray-600 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 font-bold"
              >
                ← Önceki
              </button>
              
              {/* YENİ ÖZELLİK: SON SORUDA "BİTİR" BUTONU ÇIKIYOR */}
              {isLastQuestion ? (
                  <button
                    onClick={() => finishExam(false)}
                    className="px-8 py-3 rounded-lg bg-green-600 text-white hover:bg-green-700 font-bold shadow-lg animate-pulse"
                  >
                    SINAVI BİTİR ✅
                  </button>
              ) : (
                  <button
                    onClick={() => setCurrentIndex(prev => Math.min(questions.length - 1, prev + 1))}
                    className="px-6 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-bold"
                  >
                    Sonraki →
                  </button>
              )}
            </div>
          </div>
        </div>

        {/* SAĞ: SORU NAVİGASYON PALETİ */}
        <div className={`w-full md:w-80 bg-white border-l border-gray-200 flex flex-col absolute md:relative z-20 h-full transition-transform ${isNavOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}`}>
          <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
            <h3 className="font-bold text-gray-700">Soru Listesi</h3>
            {/* Mobilde Menüyü Kapatma Çarpısı */}
            <button onClick={() => setIsNavOpen(false)} className="md:hidden text-gray-500 font-bold text-xl">&times;</button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 pb-24"> {/* pb-24: Mobilde altta kalan buton için boşluk */}
            <div className="grid grid-cols-5 gap-2">
              {questions.map((q, idx) => {
                const isAnswered = answers[q.id] !== undefined;
                const isCurrent = idx === currentIndex;

                return (
                  <button
                    key={q.id}
                    onClick={() => {
                      setCurrentIndex(idx);
                      setIsNavOpen(false);
                    }}
                    className={`h-10 rounded-lg text-sm font-bold transition-all border
                                    ${isCurrent ? 'border-2 border-blue-600 bg-blue-50 text-blue-700 ring-2 ring-blue-100' :
                        isAnswered ? 'bg-blue-500 text-white border-blue-500' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}
                                `}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-4 border-t border-gray-200 bg-gray-50 absolute bottom-0 w-full">
            <button
              onClick={() => finishExam(false)}
              className="w-full py-3 bg-red-100 text-red-600 border border-red-200 rounded-xl font-bold hover:bg-red-200"
            >
              SINAVI BİTİR
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}