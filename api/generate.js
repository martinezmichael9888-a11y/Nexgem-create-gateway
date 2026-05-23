export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { prompt } = req.body;
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            return res.status(500).json({ error: 'API Key missing.' });
        }

    // Directing Gemini to act strictly as a 3D Three.js code generator
    const contextPrompt = `
System Role: You are a Three.js 3D engine compiler.
Task: Generate valid JavaScript code using Three.js to render what the user requests.
CRITICAL REQUIREMENT: Do NOT create a new canvas element. You MUST grab the existing canvas from the page using:
const canvas = document.getElementById('three-canvas');
Then, you MUST pass this canvas directly to the WebGLRenderer like this:
const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });

Rules: 
- Return ONLY raw JavaScript code inside the response. 
- Do NOT wrap it in markdown code blocks. 
- Do not include explanations or text outside the code.
- Ensure lighting, camera, an animation loop, and proper resizing based on the canvas dimensions are included.

User Request: ${prompt}
`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: contextPrompt }] }]
            })
        });

        const data = await response.json();
        let rawCode = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

        // Clean out any accidental markdown wrapper tags if the model ignores the prompt rules
        rawCode = rawCode.replace(/```javascript/g, "").replace(/```html/g, "").replace(/```/g, "").trim();

        return res.status(200).json({ code: rawCode });

    } catch (error) {
        return res.status(500).json({ error: 'Pipeline Error: ' + error.message });
    }
}
