// Kimi-K2 API Coding Assistant for LyricArt Studio Website
// Free API access for coding help and development assistance

const axios = require('axios');
const readline = require('readline');

class KimiK2CodingAssistant {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.baseURL = 'https://platform.moonshot.ai/v1';
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
    }

    // Chat with Kimi-K2 for coding help
    async chatWithKimi(message, context = '') {
        try {
            const response = await axios.post(`${this.baseURL}/chat/completions`, {
                model: 'kimi-k2-instruct',
                messages: [
                    {
                        role: 'system',
                        content: `You are Kimi, an expert coding assistant helping with a LyricArt Studio Website project. 
                        
                        Project Context:
                        - Node.js Express application
                        - Music lyric design marketplace
                        - 400+ design entries in JSON database
                        - OpenDragon image viewer integration
                        - Tailwind CSS for styling
                        - Deployed on Railway
                        
                        Provide specific, actionable code suggestions and explanations.`
                    },
                    {
                        role: 'user',
                        content: context ? `${context}\n\nQuestion: ${message}` : message
                    }
                ],
                temperature: 0.6,
                max_tokens: 2000
            }, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                }
            });

            return response.data.choices[0].message.content;
        } catch (error) {
            console.error('Error calling Kimi-K2 API:', error.response?.data || error.message);
            return null;
        }
    }

    // Get coding suggestions for specific features
    async getFeatureSuggestions(feature) {
        const prompts = {
            'shopping-cart': 'Help me implement a shopping cart for my LyricArt Studio Website. I need to add items, manage quantities, and handle checkout. Provide complete code examples.',
            'user-auth': 'I need to add user authentication to my LyricArt Studio Website. Help me implement user registration, login, and session management with JWT tokens.',
            'payment': 'I want to integrate Stripe payment processing into my LyricArt Studio Website. Show me how to handle payments for design purchases.',
            'search': 'Help me improve the search functionality in my LyricArt Studio Website. I want advanced filtering and real-time search results.',
            'responsive': 'My LyricArt Studio Website needs better mobile responsiveness. Help me improve the CSS and layout for mobile devices.',
            'database': 'I need help optimizing my designs database and adding new features like user favorites and purchase history.',
            'performance': 'Help me optimize the performance of my LyricArt Studio Website. I want faster loading times and better user experience.',
            'security': 'What security measures should I implement for my LyricArt Studio Website? Help me add input validation, CSRF protection, and secure file handling.'
        };

        const prompt = prompts[feature];
        if (!prompt) {
            return 'Feature not found. Available: ' + Object.keys(prompts).join(', ');
        }

        return await this.chatWithKimi(prompt);
    }

    // Debug code issues
    async debugCode(code, error) {
        const prompt = `I'm having an issue with this code in my LyricArt Studio Website:

\`\`\`javascript
${code}
\`\`\`

Error: ${error}

Please help me debug this issue and provide a solution.`;
        
        return await this.chatWithKimi(prompt);
    }

    // Code review and improvements
    async reviewCode(code, fileType = 'javascript') {
        const prompt = `Please review this ${fileType} code from my LyricArt Studio Website and suggest improvements:

\`\`\`${fileType}
${code}
\`\`\`

Focus on:
- Code quality and best practices
- Performance optimizations
- Security considerations
- Maintainability
- Error handling`;
        
        return await this.chatWithKimi(prompt);
    }

    // Interactive coding session
    async startInteractiveSession() {
        console.log('🤖 Welcome to Kimi-K2 Coding Assistant for LyricArt Studio!\n');
        console.log('Available commands:');
        console.log('1. feature <name> - Get suggestions for specific features');
        console.log('2. debug <code> <error> - Debug code issues');
        console.log('3. review <code> - Review and improve code');
        console.log('4. chat <message> - General coding help');
        console.log('5. help - Show this help');
        console.log('6. exit - Exit the assistant\n');

        const askQuestion = () => {
            this.rl.question('\nWhat would you like help with? (type "help" for options): ', async (answer) => {
                const [command, ...args] = answer.trim().split(' ');
                
                switch(command.toLowerCase()) {
                    case 'feature':
                        const feature = args[0];
                        if (feature) {
                            console.log(`\n🔍 Getting suggestions for ${feature}...`);
                            const suggestions = await this.getFeatureSuggestions(feature);
                            console.log('\n💡 Kimi-K2 Suggestions:');
                            console.log(suggestions);
                        } else {
                            console.log('Please specify a feature: shopping-cart, user-auth, payment, search, responsive, database, performance, security');
                        }
                        break;
                    case 'debug':
                        if (args.length >= 2) {
                            const code = args[0];
                            const error = args.slice(1).join(' ');
                            console.log('\n🐛 Debugging code issue...');
                            const solution = await this.debugCode(code, error);
                            console.log('\n🔧 Kimi-K2 Debug Solution:');
                            console.log(solution);
                        } else {
                            console.log('Usage: debug <code> <error_message>');
                        }
                        break;
                    case 'review':
                        if (args.length >= 1) {
                            const code = args.join(' ');
                            console.log('\n📝 Reviewing code...');
                            const review = await this.reviewCode(code);
                            console.log('\n📋 Kimi-K2 Code Review:');
                            console.log(review);
                        } else {
                            console.log('Usage: review <code>');
                        }
                        break;
                    case 'chat':
                        if (args.length >= 1) {
                            const message = args.join(' ');
                            console.log('\n💬 Chatting with Kimi-K2...');
                            const response = await this.chatWithKimi(message);
                            console.log('\n🤖 Kimi-K2 Response:');
                            console.log(response);
                        } else {
                            console.log('Usage: chat <your_message>');
                        }
                        break;
                    case 'help':
                        console.log('\nAvailable features for suggestions:');
                        console.log('- shopping-cart: Shopping cart functionality');
                        console.log('- user-auth: User authentication system');
                        console.log('- payment: Stripe payment integration');
                        console.log('- search: Advanced search functionality');
                        console.log('- responsive: Mobile responsiveness');
                        console.log('- database: Database optimization');
                        console.log('- performance: Performance improvements');
                        console.log('- security: Security enhancements');
                        break;
                    case 'exit':
                        console.log('👋 Goodbye! Happy coding with Kimi-K2!');
                        this.rl.close();
                        return;
                    default:
                        console.log('Unknown command. Type "help" for options.');
                }
                
                askQuestion();
            });
        };

        askQuestion();
    }
}

// Example usage
async function setupKimiAssistant() {
    const apiKey = process.env.KIMI_API_KEY;
    
    if (!apiKey) {
        console.log('❌ KIMI_API_KEY environment variable not set!');
        console.log('Please set your Kimi-K2 API key:');
        console.log('1. Sign up at https://platform.moonshot.ai/');
        console.log('2. Get your API key');
        console.log('3. Set environment variable: export KIMI_API_KEY=your_key_here');
        return;
    }

    const assistant = new KimiK2CodingAssistant(apiKey);
    await assistant.startInteractiveSession();
}

// Start the assistant if run directly
if (require.main === module) {
    setupKimiAssistant();
}

module.exports = { KimiK2CodingAssistant, setupKimiAssistant }; 