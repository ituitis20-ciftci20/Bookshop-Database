'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function AllBooksPage() {
    const [books, setBooks] = useState([]);
    const [priceChanges, setPriceChanges] = useState({});
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [message, setMessage] = useState('');

    // Fetch books from the API
    const fetchBooks = async (page) => {
        setIsLoading(true);
        setMessage('');
        try {
            const res = await fetch(`/api/books?page=${page}&limit=10`);
            if (!res.ok) {
                throw new Error('Kitaplar getirilemedi.');
            }
            const data = await res.json();
            setBooks(data.books);
            setCurrentPage(data.currentPage);
            setTotalPages(data.totalPages);
        } catch (error) {
            setMessage(`Hata: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    // Initial fetch
    useEffect(() => {
        fetchBooks(currentPage);
    }, [currentPage]);

    // Handle price input change
    const handlePriceChange = (isbn, value) => {
        setPriceChanges(prev => ({ ...prev, [isbn]: value }));
    };

    // Handle saving all price changes
    const handleUpdatePrices = async () => {
        setIsLoading(true);
        setMessage('');
        const updates = Object.entries(priceChanges)
            .map(([isbn, price]) => ({ isbn, price }));

        if (updates.length === 0) {
            setMessage('Güncellenecek bir fiyat değişikliği yok.');
            setIsLoading(false);
            return;
        }

        try {
            const res = await fetch('/api/books/update-prices', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates)
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || 'Fiyatlar güncellenemedi.');
            }
            
            setMessage(`${data.modifiedCount} kitabın fiyatı başarıyla güncellendi.`);
            setPriceChanges({}); // Clear changes
            fetchBooks(currentPage); // Refresh data
        } catch (error) {
            setMessage(`Hata: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 p-4 sm:p-8">
            <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-lg p-6 sm:p-8">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold text-gray-800">Tüm Kitaplar</h1>
                    <Link href="/" className="px-4 py-2 bg-indigo-600 text-white rounded-md font-semibold hover:bg-indigo-700 transition">
                        Ana Sayfaya Dön
                    </Link>
                </div>

                {message && (
                    <div className={`mb-4 p-3 rounded-md text-center text-sm ${message.startsWith('Hata:') ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                        {message}
                    </div>
                )}

                <div className="flex justify-end mb-4">
                    <button 
                        onClick={handleUpdatePrices} 
                        disabled={isLoading || Object.keys(priceChanges).length === 0} 
                        className="px-6 py-2 bg-green-600 text-white rounded-md font-semibold hover:bg-green-700 disabled:bg-green-300 transition"
                    >
                        {isLoading ? 'Kaydediliyor...' : 'Fiyatları Kaydet'}
                    </button>
                </div>

                {isLoading ? (
                    <div className="text-center py-10">Yükleniyor...</div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="min-w-full bg-white border">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="py-3 px-4 border-b text-left text-sm font-semibold text-gray-600">Kapak</th>
                                        <th className="py-3 px-4 border-b text-left text-sm font-semibold text-gray-600">Başlık</th>
                                        <th className="py-3 px-4 border-b text-left text-sm font-semibold text-gray-600">ISBN</th>
                                        <th className="py-3 px-4 border-b text-left text-sm font-semibold text-gray-600">Stok</th>
                                        <th className="py-3 px-4 border-b text-left text-sm font-semibold text-gray-600">Fiyat (TL)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {books.map(book => (
                                        <tr key={book.isbn} className="hover:bg-gray-50">
                                            <td className="py-2 px-4 border-b">
                                                <img src={book.thumbnail || 'https://placehold.co/40x60/e2e8f0/334155?text=N/A'} alt={book.title} className="w-10 h-15 object-cover rounded"/>
                                            </td>
                                            <td className="py-2 px-4 border-b font-medium text-gray-800">{book.title}</td>
                                            <td className="py-2 px-4 border-b text-gray-600">{book.isbn}</td>
                                            <td className="py-2 px-4 border-b text-gray-600">{book.quantity}</td>
                                            <td className="py-2 px-4 border-b">
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    placeholder="Fiyat Girin"
                                                    value={priceChanges[book.isbn] !== undefined ? priceChanges[book.isbn] : (book.price || '')}
                                                    onChange={(e) => handlePriceChange(book.isbn, e.target.value)}
                                                    className="w-28 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <div className="flex justify-between items-center mt-6">
                            <button 
                                onClick={() => setCurrentPage(p => p - 1)} 
                                disabled={currentPage <= 1 || isLoading}
                                className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 disabled:opacity-50 transition"
                            >
                                Önceki
                            </button>
                            <span className="text-gray-700">
                                Sayfa {currentPage} / {totalPages}
                            </span>
                            <button 
                                onClick={() => setCurrentPage(p => p + 1)} 
                                disabled={currentPage >= totalPages || isLoading}
                                className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 disabled:opacity-50 transition"
                            >
                                Sonraki
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
