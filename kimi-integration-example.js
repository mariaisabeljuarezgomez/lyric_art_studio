// Example integration of Kimi-K2 API into LyricArt Studio Website
// This would add AI-powered features to your music lyric design platform

const axios = require('axios');

class KimiK2Integration {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.baseURL = 'https://platform.moonshot.ai/v1';
    }

    // AI-powered design suggestions
    async getDesignSuggestions(artist, song, genre) {
        try {
            const response = await axios.post(`${this.baseURL}/chat/completions`, {
                model: 'kimi-k2-instruct',
                messages: [
                    {
                        role: 'system',
                        content: 'You are an expert music lyric designer. Suggest creative design concepts for music lyrics.'
                    },
                    {
                        role: 'user',
                        content: `Create design suggestions for "${song}" by ${artist} in ${genre} style. Focus on typography, layout, and visual elements that match the song's mood.`
                    }
                ],
                temperature: 0.6,
                max_tokens: 500
            }, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                }
            });

            return response.data.choices[0].message.content;
        } catch (error) {
            console.error('Error getting design suggestions:', error);
            return null;
        }
    }

    // AI-powered customer support
    async getCustomerSupportResponse(userQuestion) {
        try {
            const response = await axios.post(`${this.baseURL}/chat/completions`, {
                model: 'kimi-k2-instruct',
                messages: [
                    {
                        role: 'system',
                        content: 'You are a helpful customer support representative for LyricArt Studio, a music lyric design marketplace.'
                    },
                    {
                        role: 'user',
                        content: userQuestion
                    }
                ],
                temperature: 0.6,
                max_tokens: 300
            }, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                }
            });

            return response.data.choices[0].message.content;
        } catch (error) {
            console.error('Error getting support response:', error);
            return null;
        }
    }

    // AI-powered design customization
    async customizeDesign(designDescription, userPreferences) {
        try {
            const response = await axios.post(`${this.baseURL}/chat/completions`, {
                model: 'kimi-k2-instruct',
                messages: [
                    {
                        role: 'system',
                        content: 'You are a music lyric design expert. Help customize designs based on user preferences.'
                    },
                    {
                        role: 'user',
                        content: `Customize this design: "${designDescription}" with these preferences: ${userPreferences}. Provide specific recommendations for colors, fonts, layout, and styling.`
                    }
                ],
                temperature: 0.6,
                max_tokens: 400
            }, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                }
            });

            return response.data.choices[0].message.content;
        } catch (error) {
            console.error('Error customizing design:', error);
            return null;
        }
    }
}

// Example usage in your Express server
function setupKimiIntegration(app) {
    const kimi = new KimiK2Integration(process.env.KIMI_API_KEY);

    // API endpoint for design suggestions
    app.post('/api/ai/design-suggestions', async (req, res) => {
        const { artist, song, genre } = req.body;
        const suggestions = await kimi.getDesignSuggestions(artist, song, genre);
        res.json({ suggestions });
    });

    // API endpoint for customer support
    app.post('/api/ai/support', async (req, res) => {
        const { question } = req.body;
        const response = await kimi.getCustomerSupportResponse(question);
        res.json({ response });
    });

    // API endpoint for design customization
    app.post('/api/ai/customize', async (req, res) => {
        const { designDescription, userPreferences } = req.body;
        const customization = await kimi.customizeDesign(designDescription, userPreferences);
        res.json({ customization });
    });
}

module.exports = { KimiK2Integration, setupKimiIntegration }; 