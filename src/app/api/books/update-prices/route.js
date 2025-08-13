import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

// Helper function to connect to the database and get the collection
async function getBooksCollection() {
    const client = await clientPromise;
    const db = client.db("books"); // Use your database name
    return db.collection("books");
}

/**
 * Handles POST requests to bulk update book prices.
 * @param {Request} request - The incoming request object.
 * @returns {NextResponse} A response indicating the result of the operation.
 */
export async function POST(request) {
    try {
        const updates = await request.json(); // Expects an array of { isbn, price }
        
        if (!Array.isArray(updates) || updates.length === 0) {
            return NextResponse.json({ error: "Güncellenecek veri bulunamadı." }, { status: 400 });
        }

        const booksCollection = await getBooksCollection();
        
        const bulkOps = updates.map(update => ({
            updateOne: {
                filter: { isbn: update.isbn },
                update: { $set: { price: parseFloat(update.price) || null } }
            }
        }));

        const result = await booksCollection.bulkWrite(bulkOps);

        return NextResponse.json({ message: "Fiyatlar başarıyla güncellendi.", modifiedCount: result.modifiedCount });

    } catch (error) {
        console.error("Update Prices Error:", error);
        return NextResponse.json({ error: "Fiyatlar güncellenirken bir sunucu hatası oluştu." }, { status: 500 });
    }
}
