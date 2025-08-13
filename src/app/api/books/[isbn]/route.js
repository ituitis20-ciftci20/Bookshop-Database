import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

// Helper function to connect to the database and get the collection
async function getBooksCollection() {
    const client = await clientPromise;
    const db = client.db("books"); // Use your database name
    return db.collection("books");
}

/**
 * Converts a string into a URL-friendly slug with proper Turkish character mapping.
 * @param {string} text - The text to slugify.
 * @returns {string} The slugified text.
 */
function slugify(text) {
    if (!text) return '';

    const turkishMap = {
        'ç': 'c', 'Ç': 'C',
        'ğ': 'g', 'Ğ': 'G',
        'ı': 'i', 'İ': 'I',
        'ö': 'o', 'Ö': 'O',
        'ş': 's', 'Ş': 'S',
        'ü': 'u', 'Ü': 'U'
    };

    let str = text.replace(/[çÇğĞıİöÖşŞüÜ]/g, (match) => turkishMap[match]);

    return str.toString().toLowerCase()
        .replace(/\s+/g, '-')           // Replace spaces with -
        .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
        .replace(/\-\-+/g, '-')         // Replace multiple - with single -
        .replace(/^-+/, '')             // Trim - from start of text
        .replace(/-+$/, '');            // Trim - from end of text
}

// Google Books API Fetcher
async function fetchBookFromGoogle(isbn) {
    const apiKey = process.env.GOOGLE_BOOKS_API_KEY;
    const url = `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}&key=${apiKey}`;
    
    const response = await fetch(url);
    if (!response.ok) return null;
    
    const data = await response.json();
    if (!data.items || data.items.length === 0) return null;

    const bookData = data.items[0].volumeInfo;
    const title = bookData.title;

    return {
        isbn: isbn,
        title: title,
        slug: slugify(title),
        authors: bookData.authors || [],
        publisher: bookData.publisher || 'N/A',
        publishedDate: bookData.publishedDate || 'N/A',
        description: bookData.description || 'Açıklama yok.',
        pageCount: bookData.pageCount || 0,
        thumbnail: bookData.imageLinks?.thumbnail || null,
        price: null, // Add price field with initial value null
    };
}

// GET /api/books/{isbn} - Read book info from DB
export async function GET(request, context)  {
    try {
        const { isbn } = context.params;
        const booksCollection = await getBooksCollection();
        const book = await booksCollection.findOne({ isbn: isbn });

        if (!book) {
            return NextResponse.json({ error: "Kitap veritabanında bulunamadı." }, { status: 404 });
        }

        const { _id, ...bookData } = book;
        return NextResponse.json(bookData);

    } catch (error) {
        console.error("GET Error:", error);
        return NextResponse.json({ error: "Sunucu hatası oluştu." }, { status: 500 });
    }
}

// POST /api/books/{isbn} - Increment/Decrement quantity
export async function POST(request, context)  {
    try {
        const { isbn } = context.params;
        const { action } = await request.json();
        const booksCollection = await getBooksCollection();

        if (action === 'increment') {
            const existingBook = await booksCollection.findOne({ isbn: isbn });

            if (existingBook) {
                const result = await booksCollection.findOneAndUpdate(
                    { isbn: isbn },
                    { $inc: { quantity: 1 } },
                    { returnDocument: 'after' }
                );
                const { _id, ...bookData } = result;
                return NextResponse.json({ book: bookData, isNew: false });
            } else {
                const newBookData = await fetchBookFromGoogle(isbn);
                if (!newBookData) {
                    return NextResponse.json({ error: "Bu ISBN ile Google Books API'de kitap bulunamadı." }, { status: 404 });
                }
                
                const bookToInsert = { ...newBookData, quantity: 1 }; // price is already in newBookData
                await booksCollection.insertOne(bookToInsert);
                
                return NextResponse.json({ book: bookToInsert, isNew: true }, { status: 201 });
            }
        } else if (action === 'decrement') {
            const existingBook = await booksCollection.findOne({ isbn: isbn });

            if (!existingBook) {
                return NextResponse.json({ error: "Azaltılacak kitap veritabanında bulunamadı." }, { status: 404 });
            }

            if (existingBook.quantity > 1) {
                const result = await booksCollection.findOneAndUpdate(
                    { isbn: isbn },
                    { $inc: { quantity: -1 } },
                    { returnDocument: 'after' }
                );
                const { _id, ...bookData } = result;
                return NextResponse.json(bookData);
            } else {
                await booksCollection.deleteOne({ isbn: isbn });
                return new Response(null, { status: 204 });
            }
        } else {
            return NextResponse.json({ error: "Geçersiz işlem." }, { status: 400 });
        }

    } catch (error) {
        console.error("POST Error:", error);
        return NextResponse.json({ error: "Sunucu hatası oluştu." }, { status: 500 });
    }
}
