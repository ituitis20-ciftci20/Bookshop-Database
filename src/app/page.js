'use client';

import { useState } from 'react';
import Link from 'next/link';

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
                    <div className="flex items-baseline gap-4 mt-4">
                        <p className="text-lg font-semibold text-indigo-600">
                            Stok: <span className="text-2xl">{book.quantity}</span>
                        </p>
                        {book.price !== null && (
                             <p className="text-lg font-semibold text-green-600">
                                Fiyat: <span className="text-2xl">{book.price} TL</span>
                            </p>
                        )}
                    </div>
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
    
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);

    const handleResponse = (data, successMessage) => {
        if (data.error) {
            setMessage(`Hata: ${data.error}`);
            setBook(null);
            setSearchResults([]);
        } else {
            setMessage(successMessage);
            if (Array.isArray(data)) {
                setSearchResults(data);
                setBook(null);
            } else {
                setBook(data);
                setSearchResults([]);
            }
        }
    };

    const clearState = () => {
        setBook(null);
        setMessage('');
        setSearchResults([]);
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
            
            if (res.status === 204) {
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

    const slugify = (text) => {
        if (!text) return '';
        const turkishMap = {
            'ç': 'c', 'Ç': 'C', 'ğ': 'g', 'Ğ': 'G', 'ı': 'i', 'İ': 'I',
            'ö': 'o', 'Ö': 'O', 'ş': 's', 'Ş': 'S', 'ü': 'u', 'Ü': 'U'
        };
        let str = text.replace(/[çÇğĞıİöÖşŞüÜ]/g, (match) => turkishMap[match]);
        return str.toString().toLowerCase()
            .replace(/\s+/g, '-').replace(/[^\w\-]+/g, '').replace(/\-\-+/g, '-')
            .replace(/^-+/, '').replace(/-+$/, '');
    }

    const handleSearchByName = async (e) => {
        e.preventDefault();
        if (!searchTerm) {
            setMessage('Lütfen aramak için bir kitap adı girin.');
            return;
        }
        setIsLoading(true);
        clearState();
        const slug = slugify(searchTerm);
        try {
            const res = await fetch(`/api/books/search/${slug}`);
            const data = await res.json();
            if (!res.ok) {
                handleResponse({ error: data.error }, '');
            } else {
                handleResponse(data, `${data.length} adet kitap bulundu.`);
            }
        } catch (error) {
            setMessage('Arama sırasında bir sunucu hatası oluştu.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 font-sans">
            <div className="w-full max-w-2xl mx-auto bg-white rounded-xl shadow-lg p-8">
                <div className="flex justify-between items-center mb-2">
                    <h1 className="text-3xl font-bold text-center text-gray-800">Kitap Depo Yönetimi</h1>
                    <Link href="/books" className="px-4 py-2 bg-purple-600 text-white rounded-md font-semibold hover:bg-purple-700 transition">
                        Tüm Kitaplar
                    </Link>
                </div>
                <p className="text-center text-gray-500 mb-8">Kitapları yönetmek için barkod (ISBN) okutun veya adıyla arayın.</p>

                {/* Barcode Section */}
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
                        Bilgi Getir
                    </button>
                    <button onClick={handleAddBook} disabled={isLoading} className="p-3 bg-green-600 text-white rounded-md font-semibold hover:bg-green-700 disabled:bg-green-300 transition">
                        Ekle / Artır
                    </button>
                    <button onClick={handleRemoveBook} disabled={isLoading} className="p-3 bg-red-600 text-white rounded-md font-semibold hover:bg-red-700 disabled:bg-red-300 transition">
                        Azalt / Sil
                    </button>
                </div>

                {/* Search by Name Section */}
                <form onSubmit={handleSearchByName} className="mt-8 pt-6 border-t">
                    <h2 className="text-xl font-bold text-center text-gray-700 mb-4">Veya Kitap Adıyla Ara</h2>
                    <div className="flex flex-col sm:flex-row gap-2">
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Kitap adını girin..."
                            className="flex-grow p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                        />
                    </div>
                    <div className="mt-4">
                        <button type="submit" disabled={isLoading} className="w-full p-3 bg-purple-600 text-white rounded-md font-semibold hover:bg-purple-700 disabled:bg-purple-300 transition">
                            {isLoading ? 'Aranıyor...' : 'Kitap Adıyla Ara'}
                        </button>
                    </div>
                </form>

                {message && (
                    <div className={`mt-6 p-3 rounded-md text-center text-sm ${message.startsWith('Hata:') ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                        {message}
                    </div>
                )}

                {isLoading && !book && searchResults.length === 0 && <div className="text-center mt-4">Yükleniyor...</div>}
                
                {book && <BookInfoCard book={book} />}

                {searchResults.length > 0 && (
                    <div className="mt-6">
                        <h3 className="text-xl font-bold mb-2">Arama Sonuçları:</h3>
                        {searchResults.map((b, index) => (
                            <BookInfoCard key={index} book={b} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
