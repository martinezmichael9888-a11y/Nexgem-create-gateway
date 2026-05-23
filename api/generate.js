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
        const systemInstruction = `
You are a 3D graphics engine code generator. 
Your job is to output ONLY raw, valid JavaScript code using Three.js. 
Do not wrap the code in markdown code blocks (\`\`\`js). 
CRITICAL REQUIREMENT: Do NOT create a new canvas element. You MUST get the existing canvas from the page using:
const canvas = document.getElementById('three-canvas');
Then, you MUST pass this canvas to the WebGLRenderer like this:
const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
Make sure to set the renderer size using the canvas clientWidth and clientHeight, set up a perspective camera, add lights, create the requested 3D object, and include a requestAnimationFrame animation loop to make it spin.
`;

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
