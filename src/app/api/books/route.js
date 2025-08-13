import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

// Helper function to connect to the database and get the collection
async function getBooksCollection() {
    const client = await clientPromise;
    const db = client.db("books"); // Use your database name
    return db.collection("books");
}

/**
 * Handles GET requests to fetch all books with pagination.
 * @param {Request} request - The incoming request object.
 * @returns {NextResponse} A response containing the books for the page, total books, and total pages.
 */
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1', 10);
        const limit = parseInt(searchParams.get('limit') || '10', 10);
        const skip = (page - 1) * limit;

        const booksCollection = await getBooksCollection();
        
        const totalBooks = await booksCollection.countDocuments();
        const books = await booksCollection.find().skip(skip).limit(limit).toArray();

        // Remove the internal _id from each book object
        const booksData = books.map(book => {
            const { _id, ...bookData } = book;
            return bookData;
        });

        return NextResponse.json({
            totalBooks,
            totalPages: Math.ceil(totalBooks / limit),
            currentPage: page,
            books: booksData,
        });

    } catch (error) {
        console.error("Get All Books Error:", error);
        return NextResponse.json({ error: "Kitaplar getirilirken bir sunucu hatası oluştu." }, { status: 500 });
    }
}
