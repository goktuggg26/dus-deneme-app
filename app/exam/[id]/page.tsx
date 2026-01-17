"use client";

import { useState, useEffect } from "react";
import { db, storage } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

// --- DERS LİSTESİ SABİTLERİ ---
const LESSONS = {
  Temel: [
    "Anatomi",
    "Histoloji-Embriyoloji",
    "Fizyoloji",
    "Biyokimya",
    "Mikrobiyoloji",
    "Patoloji",
    "Farmakoloji",
    "Tıbbi Biyoloji ve Genetik"
  ],
  Klinik: [
    "Restoratif Diş Tedavisi",
    "Protetik Diş Tedavisi",
    "Ağız Diş ve Çene Cerrahisi",
    "Ağız Diş ve Çene Radyolojisi",
    "Periodontoloji",
    "Ortodonti",
    "Endodonti",
    "Çocuk Diş Hekimliği"
  ]
};

export default function ExamDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();

  const [examTitle, setExamTitle] = useState("");
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Form Verileri
  const [qText, setQText] = useState("");
  const [category, setCategory] = useState<"Temel" | "Klinik">("Temel");
  const [selectedLesson, setSelectedLesson] = useState(LESSONS.Temel[0]);
  const [options, setOptions] = useState(["", "", "", "", ""]);
  const [correct, setCorrect] = useState(0);
  const [imageFile, setImageFile] = useState<File | null>(null);

  // YENİ: Düzenleme Modu için State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState(""); // Düzenlerken eski resmi korumak için

  // Hızlı Yapıştırma State'i
  const [pasteText, setPasteText] = useState("");
  const [showPaste, setShowPaste] = useState(false);

  useEffect(() => {
    const isAdmin = localStorage.getItem("isAdmin");
    if (!isAdmin) {
      router.push("/login");
    }
  }, [router]);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, "exams", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setExamTitle(data.title);
          setQuestions(data.questions || []);
        }
      } catch (error) {
        console.error("Veri çekme hatası:", error);
      }
    };
    fetchData();
  }, [id]);

  // Kategori değişince Ders Listesini Güncelle (Ama düzenleme modundaysak dokunma)
  useEffect(() => {
    if (!editingId) {
      setSelectedLesson(LESSONS[category][0]);
    }
  }, [category]);

  // --- SORUYU DÜZENLEME MODUNA ALMA ---
  const handleEditClick = (q: any) => {
    setEditingId(q.id); // Düzenlenen sorunun ID'sini tut
    setQText(q.text);
    setCategory(q.category);
    // React state güncellemesi hemen olmayacağı için listeden manuel seçiyoruz
    setSelectedLesson(q.lesson || LESSONS[q.category][0]);
    setOptions([...q.options]);
    setCorrect(q.correctOption);
    setExistingImageUrl(q.imageUrl || ""); // Varsa eski resmi sakla

    // Sayfayı yukarı kaydır (Form görünsün diye)
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // --- DÜZENLEMEYİ İPTAL ETME ---
  const handleCancelEdit = () => {
    setEditingId(null);
    setQText("");
    setOptions(["", "", "", "", ""]);
    setCorrect(0);
    setImageFile(null);
    setExistingImageUrl("");
    setCategory("Temel");
    setSelectedLesson(LESSONS.Temel[0]);
  };

  // --- KAYDETME VE GÜNCELLEME (TEK FONKSİYON) ---
  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (options.some(opt => opt.trim() === "") || qText.trim() === "") {
        alert("Lütfen soru metnini ve tüm şıkları doldurun.");
        setLoading(false);
        return;
      }

      let imageUrl = existingImageUrl; // Varsayılan olarak eski resim kalsın

      // Eğer yeni bir resim seçildiyse onu yükle ve URL'yi değiştir
      if (imageFile) {
        const storageRef = ref(storage, `questions/${id}/${Date.now()}_${imageFile.name}`);
        const snapshot = await uploadBytes(storageRef, imageFile);
        imageUrl = await getDownloadURL(snapshot.ref);
      }

      const questionObj = {
        id: editingId ? editingId : Date.now().toString(), // ID varsa koru, yoksa yeni üret
        text: qText,
        category: category,
        lesson: selectedLesson,
        options: options,
        correctOption: correct,
        imageUrl: imageUrl,
        createdAt: new Date().toISOString()
      };

      let updatedQuestions;

      if (editingId) {
        // --- GÜNCELLEME İŞLEMİ ---
        updatedQuestions = questions.map(q => q.id === editingId ? questionObj : q);
        alert("Soru güncellendi! ✅");
      } else {
        // --- YENİ EKLEME İŞLEMİ ---
        updatedQuestions = [...questions, questionObj];
        alert("Soru eklendi! 🎉");
      }

      // Veritabanını Güncelle
      const examRef = doc(db, "exams", id);
      await updateDoc(examRef, { questions: updatedQuestions });

      setQuestions(updatedQuestions);
      handleCancelEdit(); // Formu sıfırla

    } catch (error) {
      console.error(error);
      alert("Hata oluştu: " + error);
    } finally {
      setLoading(false);
    }
  };

  // --- HIZLI AYRIŞTIRMA ---
  const handleSmartParse = () => {
    if (!pasteText.trim()) return;
    let text = pasteText;
    let detectedCorrect = 0;
    const answerMatch = text.match(/(?:Doğru\s*)?Cevap:\s*([A-E])/i);
    if (answerMatch) {
      const letter = answerMatch[1].toUpperCase();
      detectedCorrect = letter.charCodeAt(0) - 65;
      text = text.replace(answerMatch[0], "");
    }
    const parts = text.split(/[A-E]\)/);
    if (parts.length < 6) {
      alert("Format anlaşılamadı. Lütfen A) B) C) D) E) şıklarının olduğundan emin olun.");
      return;
    }
    let questionPart = parts[0].trim();
    questionPart = questionPart.replace(/^\d+\.\s*(Soru:)?\s*/i, "");
    const newOptions = [parts[1].trim(), parts[2].trim(), parts[3].trim(), parts[4].trim(), parts[5].trim()];

    setQText(questionPart);
    setOptions(newOptions);
    setCorrect(detectedCorrect);
    setShowPaste(false);
    setPasteText("");
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleDeleteQuestion = async (qId: string) => {
    if (!confirm("Bu soruyu silmek istediğine emin misin?")) return;
    const updatedQuestions = questions.filter(q => q.id !== qId);
    const examRef = doc(db, "exams", id);
    await updateDoc(examRef, { questions: updatedQuestions });
    setQuestions(updatedQuestions);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 flex flex-col items-center">
      <div className="max-w-6xl w-full space-y-6">

        <div className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <Link href="/" className="text-gray-500 hover:text-blue-600 font-medium">← Geri Dön</Link>
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-gray-800">{examTitle || "Yükleniyor..."}</h1>
            <Link href={`/ogrenci/${id}`} target="_blank" className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white text-sm font-bold rounded-lg hover:bg-purple-700 transition-all shadow-md hover:shadow-lg">
              <span>🚀</span> Öğrenci Ekranını Aç
            </Link>
          </div>
          <div className="w-20"></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* SOL: Soru Ekleme/Düzenleme Formu */}
          <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-fit sticky top-6">

            {/* EDİT MODU UYARISI */}
            {editingId && (
              <div className="mb-4 bg-yellow-50 border border-yellow-200 p-3 rounded-lg text-yellow-700 text-sm flex justify-between items-center">
                <span>✏️ Düzenleme Modu Aktif</span>
                <button onClick={handleCancelEdit} className="text-xs underline font-bold hover:text-red-600">İptal Et</button>
              </div>
            )}

            {/* HIZLI YAPIŞTIRMA (Sadece yeni eklerken görünsün) */}
            {!editingId && (
              <div className="mb-6 border-b border-gray-100 pb-4">
                <button onClick={() => setShowPaste(!showPaste)} className="w-full bg-orange-100 text-orange-700 py-2 rounded-lg font-bold hover:bg-orange-200 transition-colors flex items-center justify-center gap-2">
                  ⚡️ Hızlı Soru Yapıştır
                </button>
                {showPaste && (
                  <div className="mt-3 bg-gray-50 p-3 rounded-lg border border-orange-200 animate-fadeIn">
                    <textarea value={pasteText} onChange={(e) => setPasteText(e.target.value)} placeholder={`Örnek Format: 6. Soru...`} className="w-full h-32 p-2 text-xs border border-gray-300 rounded text-black mb-2" />
                    <button onClick={handleSmartParse} className="w-full bg-orange-600 text-white py-1.5 rounded text-sm font-bold hover:bg-orange-700">Formu Otomatik Doldur</button>
                  </div>
                )}
              </div>
            )}

            <h2 className="font-bold text-lg mb-4 text-blue-900">{editingId ? "Soruyu Düzenle" : "Yeni Soru Ekle"}</h2>

            <form onSubmit={handleSaveQuestion} className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bölüm</label>
                  <select value={category} onChange={(e) => setCategory(e.target.value as "Temel" | "Klinik")} className="w-full border border-gray-300 rounded-lg p-2 text-black bg-white focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value="Temel">Temel Bilimler</option>
                    <option value="Klinik">Klinik Bilimler</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ders</label>
                  <select value={selectedLesson} onChange={(e) => setSelectedLesson(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2 text-black bg-white focus:ring-2 focus:ring-blue-500 outline-none">
                    {LESSONS[category].map((lesson) => (<option key={lesson} value={lesson}>{lesson}</option>))}
                  </select>
                </div>
              </div>

              <div className="bg-gray-50 p-3 rounded-lg border border-dashed border-gray-300">
                <label className="block text-sm font-medium text-gray-700 mb-1">Görsel (Opsiyonel)</label>
                <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files ? e.target.files[0] : null)} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                {existingImageUrl && !imageFile && (
                  <p className="text-xs text-blue-600 mt-2">ℹ️ Mevcut görsel korunacak.</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Soru Metni</label>
                <textarea value={qText} onChange={(e) => setQText(e.target.value)} className="w-full border border-gray-300 rounded-lg p-3 h-24 text-black focus:ring-2 focus:ring-blue-500 outline-none resize-none" placeholder="Soruyu buraya yazın..." />
              </div>

              <div className="space-y-2">
                {options.map((opt, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className={`w-8 h-8 flex items-center justify-center rounded-full font-bold text-sm ${correct === index ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-500'}`}>{String.fromCharCode(65 + index)}</div>
                    <input type="text" value={opt} onChange={(e) => updateOption(index, e.target.value)} className="flex-1 border border-gray-300 rounded-lg p-2 text-sm text-black outline-none focus:border-blue-500" placeholder={`${String.fromCharCode(65 + index)} şıkkı`} />
                    <input type="radio" name="correctOpt" checked={correct === index} onChange={() => setCorrect(index)} className="w-4 h-4 cursor-pointer" />
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                {editingId && (
                  <button type="button" onClick={handleCancelEdit} className="w-1/3 bg-gray-200 text-gray-700 py-3 rounded-lg font-bold hover:bg-gray-300">İptal</button>
                )}
                <button disabled={loading} className={`flex-1 text-white py-3 rounded-lg font-bold transition-colors ${editingId ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'}`}>
                  {loading ? "Kaydediliyor..." : editingId ? "Değişiklikleri Güncelle" : "Soruyu Kaydet"}
                </button>
              </div>
            </form>
          </div>

          {/* SAĞ: Soru Listesi */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="font-bold text-lg text-gray-800">Eklenen Sorular ({questions.length})</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[700px] overflow-y-auto pr-2 pb-10">
              {questions.map((q, i) => (
                <div key={q.id} className={`bg-white p-4 rounded-xl border relative group h-fit transition-all ${editingId === q.id ? 'border-2 border-yellow-400 ring-2 ring-yellow-100' : 'border-gray-200'}`}>

                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-bold text-gray-400">#{i + 1}</span>
                    <div className="text-right">
                      <span className={`text-[10px] uppercase px-2 py-1 rounded font-bold block ${q.category === 'Klinik' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                        {q.category || "Temel"}
                      </span>
                      <span className="text-[10px] text-gray-500 font-medium block mt-1">
                        {q.lesson || "Genel"}
                      </span>
                    </div>
                  </div>

                  {/* Butonlar Grubu (Hover'da görünür) */}
                  <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleEditClick(q)}
                      className="bg-blue-50 text-blue-600 p-1.5 rounded hover:bg-blue-100 text-xs font-bold flex items-center gap-1"
                      title="Düzenle"
                    >
                      ✏️ Düzenle
                    </button>
                    <button
                      onClick={() => handleDeleteQuestion(q.id)}
                      className="bg-red-50 text-red-600 p-1.5 rounded hover:bg-red-100 text-xs font-bold"
                      title="Sil"
                    >
                      🗑
                    </button>
                  </div>

                  {q.imageUrl && (
                    <img src={q.imageUrl} alt="Görsel" className="w-full h-24 object-contain bg-gray-50 rounded-lg mb-2" />
                  )}

                  <p className="text-gray-800 font-medium text-sm line-clamp-3 mb-2">{q.text}</p>

                  <div className="space-y-1">
                    {q.options.map((opt: string, idx: number) => (
                      <div key={idx} className={`text-xs p-1 rounded px-2 flex gap-2 ${idx === q.correctOption ? 'bg-green-50 text-green-700 border border-green-200' : 'text-gray-500'}`}>
                        <span className="font-bold">{String.fromCharCode(65 + idx)})</span> {opt}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}