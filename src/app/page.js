'use client';

import { useState } from 'react';

// A component to display book information
const BookInfoCard = ({ book }) => {
    if (!book) return null;
    return (
        <div className="mt-6 p-4 border rounded-lg bg-gray-50 shadow-md animate-fade-in">
            <div className="flex flex-col md:flex-row gap-6">
                <img 
                    src={book.thumbnail || 'https://placehold.co/128x192/e2e8f0/334155?text=Kapak+Yok'} 
                    alt={`Kapak: ${book.title}`} 
                    className="w-32 h-48 object-cover rounded-md shadow-lg mx-auto md:mx-0"
                />
                <div className="flex-1">
                    <h3 className="text-2xl font-bold text-gray-800">{book.title}</h3>
                    <p className="text-md text-gray-600 mt-1">{book.authors?.join(', ')}</p>
                    <p className="text-sm text-gray-500 mt-1">{book.publisher} ({book.publishedDate})</p>
                    <p className="mt-4 text-lg font-semibold text-indigo-600">
                        Depodaki Miktar: <span className="text-2xl">{book.quantity}</span>
                    </p>
                </div>
            </div>
            <p className="text-sm text-gray-700 mt-4 pt-4 border-t">{book.description || "Açıklama mevcut değil."}</p>
        </div>
    );
};

// Main page component
export default function HomePage() {
    const [barcode, setBarcode] = useState('');
    const [book, setBook] = useState(null);
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [reviewText, setReviewText] = useState('');

    const handleResponse = (data, successMessage) => {
        if (data.error) {
            setMessage(`Hata: ${data.error}`);
            setBook(null);
        } else {
            setMessage(successMessage);
            setBook(data);
        }
    };

    const clearState = () => {
        setBook(null);
        setMessage('');
        setReviewText('');
    }

    const handleGetBook = async () => {
        if (!barcode) {
            setMessage('Lütfen bir barkod numarası girin.');
            return;
        }
        setIsLoading(true);
        clearState();
        try {
            const res = await fetch(`/api/books/${barcode}`);
            const data = await res.json();
            if (!res.ok) {
                 handleResponse({ error: data.error || `Kitap bulunamadı.` }, '');
            } else {
                 handleResponse(data, 'Kitap bilgisi başarıyla getirildi.');
            }
        } catch (error) {
            setMessage('Bir sunucu hatası oluştu.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddBook = async () => {
        if (!barcode) {
            setMessage('Lütfen bir barkod numarası girin.');
            return;
        }
        setIsLoading(true);
        clearState();
        try {
            const res = await fetch(`/api/books/${barcode}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'increment' })
            });
            const data = await res.json();
            const successMsg = data.isNew ? 'Yeni kitap başarıyla eklendi.' : 'Kitap miktarı 1 artırıldı.';
            handleResponse(data.book, successMsg);
        } catch (error) {
            setMessage('Bir sunucu hatası oluştu.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRemoveBook = async () => {
        if (!barcode) {
            setMessage('Lütfen bir barkod numarası girin.');
            return;
        }
        setIsLoading(true);
        clearState();
        try {
            const res = await fetch(`/api/books/${barcode}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'decrement' })
            });
            
            if (res.status === 204) { // No content, book deleted
                setMessage('Kitap miktarı sıfıra ulaştı ve depodan silindi.');
                setBook(null);
                setBarcode('');
                return;
            }

            const data = await res.json();
             if (!res.ok) {
                 handleResponse({ error: data.error || `Kitap bulunamadı.` }, '');
            } else {
                 handleResponse(data, 'Kitap miktarı 1 azaltıldı.');
            }

        } catch (error) {
            setMessage('Bir sunucu hatası oluştu.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddReview = async (e) => {
        e.preventDefault();
        if (!reviewText.trim()) {
            setMessage('Yorum alanı boş bırakılamaz.');
            return;
        }
        setIsLoading(true);
        try {
            const res = await fetch(`/api/books/${book.isbn}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'add_review', reviewText: reviewText })
            });
            const data = await res.json();
            if (!res.ok) {
                setMessage(`Hata: ${data.error}`);
            } else {
                setBook(data.book); // Update book state with new review
                setMessage('Yorum başarıyla eklendi.');
                setReviewText(''); // Clear input field
            }
        } catch (error) {
            setMessage('Yorum eklenirken bir hata oluştu.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
            <div className="w-full max-w-2xl mx-auto bg-white rounded-xl shadow-lg p-8">
                <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">Kitap Depo Yönetimi</h1>
                <p className="text-center text-gray-500 mb-8">Kitapları yönetmek için barkod (ISBN) okutun.</p>

                <div className="flex flex-col sm:flex-row gap-2">
                    <input
                        type="text"
                        value={barcode}
                        onChange={(e) => setBarcode(e.target.value)}
                        placeholder="Barkod (ISBN) numarasını girin..."
                        className="flex-grow p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                    />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
                    <button onClick={handleGetBook} disabled={isLoading} className="p-3 bg-blue-600 text-white rounded-md font-semibold hover:bg-blue-700 disabled:bg-blue-300 transition">
                        {isLoading ? 'Aranıyor...' : 'Bilgi Getir'}
                    </button>
                    <button onClick={handleAddBook} disabled={isLoading} className="p-3 bg-green-600 text-white rounded-md font-semibold hover:bg-green-700 disabled:bg-green-300 transition">
                        {isLoading ? 'İşleniyor...' : 'Ekle / Artır'}
                    </button>
                    <button onClick={handleRemoveBook} disabled={isLoading} className="p-3 bg-red-600 text-white rounded-md font-semibold hover:bg-red-700 disabled:bg-red-300 transition">
                        {isLoading ? 'İşleniyor...' : 'Azalt / Sil'}
                    </button>
                </div>

                {message && (
                    <div className={`mt-6 p-3 rounded-md text-center text-sm ${message.startsWith('Hata:') ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                        {message}
                    </div>
                )}

                {isLoading && !book && <div className="text-center mt-4">Yükleniyor...</div>}
                
                <BookInfoCard book={book} />
            </div>
        </div>
    );
}
