module.exports = async function handler(req, res) {
    // N'accepte que les requêtes POST depuis votre site
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Méthode non autorisée' });
    }

    // Récupère la clé secrète depuis Vercel
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
        return res.status(500).json({ error: 'Clé API manquante sur le serveur' });
    }

    try {
        const { prompt, systemInstruction, responseSchema } = req.body;

        const payload = {
            contents: [{ parts: [{ text: prompt }] }],
            systemInstruction: { parts: [{ text: systemInstruction }] }
        };

        // Si c'est le diagnostic, on demande à Gemini de formater en JSON
        if (responseSchema) {
            payload.generationConfig = {
                responseMimeType: "application/json",
                responseSchema: responseSchema
            };
        }

        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error?.message || "Erreur de l'API Google");
        }

        // Renvoie la réponse au site web
        const text = data.candidates[0].content.parts[0].text;
        res.status(200).json({ text: text });

    } catch (error) {
        console.error("Backend Error:", error);
        res.status(500).json({ error: error.message });
    }
}
