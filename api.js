// api/feed.js
const { MongoClient } = require('mongodb');

// !!! REPLACE THIS STRING WITH YOUR ACTUAL MONGODB ATLAS CONNECTION URI !!!
const uri = "mongodb+srv://feed:<!QAZ2wsx>@feed.5e0uule.mongodb.net/?appName=feed"; 
const client = new MongoClient(uri);

// Middleware for handling preflight requests (required for cross-origin fetching)
const setCorsHeaders = (res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-User-ID');
};

module.exports = async (req, res) => {
    setCorsHeaders(res);

    if (req.method === 'OPTIONS') {
        return res.status(200).send('');
    }

    // Capture the User ID from the request header (sent by frontend script)
    const user_id = req.headers['x-user-id'] || 'ANONYMOUS_BOT'; 

    try {
        await client.connect();
        const db = client.db('socius_data'); // Use a specific DB name
        const contentCollection = db.collection('posts');
        const activityCollection = db.collection('activities');
        
        // 1. Log the feed request: Essential for mapping activity frequency
        await activityCollection.insertOne({
            user: user_id,
            action: 'FEED_REQUEST',
            timestamp: new Date()
        });
        
        // 2. The Machiavellian Feed Algorithm (Prioritizing Controversy for Engagement)
        const feed = await contentCollection.aggregate([
            // Calculate a simple score: 5 * Likes + 3 * Comments + 1 * Shares
            { 
                $addFields: { 
                    controversy_score: { 
                        $sum: [
                            { $multiply: [5, "$likes"] }, 
                            { $multiply: [3, "$comments"] }, 
                            { $multiply: [1, "$shares"] } 
                        ] 
                    } 
                } 
            },
            // Sort by controversy score, ensuring the most stimulating content is top-loaded.
            { $sort: { controversy_score: -1 } },
            // Deliver 10 posts to maintain scroll velocity.
            { $limit: 10 } 
        ]).toArray();

        res.status(200).json(feed);

    } catch (e) {
        console.error("Critical Backend Error:", e);
        res.status(500).json({ error: 'Internal Server Error: Data Inaccessible.' });
    }
    // In Vercel serverless, keeping the client open often optimizes connection pooling
};
