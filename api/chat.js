export default async function handler(req, res) {
    // Only allow POST requests (secure data transmission)
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { message, assets } = req.body;
        
        // Grab the secure Gemini API Key from Vercel's environment variables
        const apiKey = process.env.GEMINI_API_KEY;
        
        if (!apiKey) {
            return res.status(500).json({ 
                error: 'Gemini Engine API Key is missing. Please configure your Vercel Environment Variables.' 
            });
        }

        // Prepare the payload context for Gemini
        const contextPrompt = `
            System Role: You are the NexGem Create Devops AI Advisor. 
            Rules: Account operating under Tier 0 Admin Rights. 50/50 Liquidation Split active.
            Staged User Assets: ${assets && assets.length > 0 ? assets.join(', ') : 'None'}.
            
            User Message: ${message}
        `;

        // Send data directly to the official Google Gemini API endpoint
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: contextPrompt }] }]
            })
        });

        const data = await response.json();
        
        // Extract the AI's reply text safely
        const aiReply = data.candidates?.[0]?.content?.parts?.[0]?.text || "Gemini engine processed your request but returned an empty structural frame.";

        return res.status(200).json({ reply: aiReply });

    } catch (error) {
        return res.status(500).json({ error: 'API Pipeline Error: ' + error.message });
    }
}
