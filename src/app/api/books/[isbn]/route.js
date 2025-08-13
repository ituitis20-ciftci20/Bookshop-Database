import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

// Helper function to connect to the database and get the collection
async function getBooksCollection() {
    const client = await clientPromise;
    const db = client.db("books"); // Use your database name
    return db.collection("books");
}

// Google Books API Fetcher
async function fetchBookFromGoogle(isbn) {
    // Note: It's better to store the API Key in .env.local
    const apiKey = process.env.GOOGLE_BOOKS_API_KEY;
    const url = `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}&key=${apiKey}`;
    
    const response = await fetch(url);
    if (!response.ok) {
        return null;
    }
    const data = await response.json();
    if (!data.items || data.items.length === 0) {
        return null;
    }

    const bookData = data.items[0].volumeInfo;
    return {
        isbn: isbn,
        title: bookData.title,
        authors: bookData.authors || [],
        publisher: bookData.publisher || 'N/A',
        publishedDate: bookData.publishedDate || 'N/A',
        description: bookData.description || 'Açıklama yok.',
        pageCount: bookData.pageCount || 0,
        thumbnail: bookData.imageLinks?.thumbnail || null,
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

        // Remove the internal _id before sending it to the client
        const { _id, ...bookData } = book;
        return NextResponse.json(bookData);

    } catch (error) {
        console.error("GET Error:", error);
        return NextResponse.json({ error: "Sunucu hatası oluştu." }, { status: 500 });
    }
}


// POST /api/books/{isbn} - Increment/Decrement quantity or Add a review
export async function POST(request, context)  {
    try {
        const { isbn } = context.params;
        const { action, reviewText } = await request.json(); // 'increment', 'decrement', or 'add_review'
        const booksCollection = await getBooksCollection();

        if (action === 'increment') {
            const existingBook = await booksCollection.findOne({ isbn: isbn });

            if (existingBook) {
                // Book exists, increment quantity
                const result = await booksCollection.findOneAndUpdate(
                    { isbn: isbn },
                    { $inc: { quantity: 1 } },
                    { returnDocument: 'after' }
                );
                const { _id, ...bookData } = result;
                return NextResponse.json({ book: bookData, isNew: false });
            } else {
                // Book does not exist, fetch from Google and create
                const newBookData = await fetchBookFromGoogle(isbn);
                if (!newBookData) {
                    return NextResponse.json({ error: "Bu ISBN ile Google Books API'de kitap bulunamadı." }, { status: 404 });
                }
                
                const bookToInsert = { ...newBookData, quantity: 1, reviews: [] }; // Add empty reviews array
                await booksCollection.insertOne(bookToInsert);
                
                return NextResponse.json({ book: bookToInsert, isNew: true }, { status: 201 });
            }
        } else if (action === 'decrement') {
            const existingBook = await booksCollection.findOne({ isbn: isbn });

            if (!existingBook) {
                return NextResponse.json({ error: "Azaltılacak kitap veritabanında bulunamadı." }, { status: 404 });
            }

            if (existingBook.quantity > 1) {
                // Decrement quantity
                const result = await booksCollection.findOneAndUpdate(
                    { isbn: isbn },
                    { $inc: { quantity: -1 } },
                    { returnDocument: 'after' }
                );
                const { _id, ...bookData } = result;
                return NextResponse.json(bookData);
            } else {
                // Quantity is 1, so delete the book
                await booksCollection.deleteOne({ isbn: isbn });
                return new Response(null, { status: 204 }); // 204 No Content
            }
        } else {
            return NextResponse.json({ error: "Geçersiz işlem." }, { status: 400 });
        }

    } catch (error) {
        console.error("POST Error:", error);
        return NextResponse.json({ error: "Sunucu hatası oluştu." }, { status: 500 });
    }
}
