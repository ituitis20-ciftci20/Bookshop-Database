import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

// Helper function to connect to the database and get the collection
async function getBooksCollection() {
    const client = await clientPromise;
    const db = client.db("books"); // Use your database name
    return db.collection("books");
}

/**
 * Handles GET requests to search for books by a slug.
 * @param {Request} request - The incoming request object.
 * @param {object} context - The context object containing route parameters.
 * @param {string} context.params.slug - The slug to search for.
 * @returns {NextResponse} A response containing the found books or an error.
 */
export async function GET(request, context) {
    try {
        const { slug } = context.params;
        const booksCollection = await getBooksCollection();

        // Use a regular expression for a case-insensitive search to find all matching books.
        // This allows for partial matches, e.g., searching for "yuzuk" could find "yuzuklerin-efendisi".
        const books = await booksCollection.find({ slug: new RegExp(slug, 'i') }).toArray();

        if (!books || books.length === 0) {
            return NextResponse.json({ error: "Bu isimle eşleşen kitap bulunamadı." }, { status: 404 });
        }

        // Remove the internal _id from each book object before sending it to the client
        const booksData = books.map(book => {
            const { _id, ...bookData } = book;
            return bookData;
        });

        return NextResponse.json(booksData);

    } catch (error) {
        console.error("Search GET Error:", error);
        return NextResponse.json({ error: "Arama sırasında sunucu hatası oluştu." }, { status: 500 });
    }
}
