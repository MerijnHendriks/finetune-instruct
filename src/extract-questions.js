import { HttpClient } from './utils/HttpClient.js';
import { PerformanceTimer } from './utils/PerformanceTimer.js';
import { ResponseProcessor } from './utils/ResponseProcessor.js';
import { VFS } from './utils/VFS.js';

class QuestionExtractor {
    constructor(config) {
        this.vfs = new VFS();
        this.processor = new ResponseProcessor();
        this.extracted = [];

        // Load config
        this.host = config.host;
        this.port = config.port;
        this.connections = config.connections;
        this.api = config.api;
        this.stream = config.stream;
        this.model = config.model;
        this.out = config.out;

        // Lazyload client
        this.client = null;
    }

    /**
     * Lazy-initializes the generator.
     */
    async init() {
        // Initialize client
        switch (this.api)
        {
            case 'openai/v1':
                this.client = new HttpClient(this.host, this.port, '/v1/chat/completions', this.connections);
                break;

            case 'ollama':
                // NOTE: harcoded port is intentional, ollama only supports this port.
                this.client = new HttpClient(this.host, 11434, '/api/chat', this.connections);
                break;
        }
    }

    /**
     * Gets the starting index for generateDataset.
     *
     * @param {string} role Which role the system should have.
     * @param {string} prompt The text to send to the model.
     * @returns {Promise<string>} The response.
     */
    async queryModel(text) {
        const maxToken = 1024;
        const body = {
            model: this.model,
            // seed: seed,
            temperature: 0.0,
            top_p: 1.0,
            messages: [
                {
                    role: 'system',
                    content: 'Extract the question with additional details from the text. Return exactly the question text without any additional commentary or formatting. If there is no question in the text, reply with the full text."'
                },
                {
                    role: 'user',
                    content: text
                }
            ],
            stream: this.stream,
            stream_options: {
                include_obfuscation: false
            },
            max_completion_tokens: maxToken,
            max_tokens: maxToken
        };

        return await this.client.post(body);
    }

    /**
     * Generates and instruction question from API.
     * 
     * @param {string} text - The text to extract the question from.
     * @param {number} i - Current request index.
     */
    async extractQuestion(text, i, count) {
        console.log(`Generating ${i + 1} / ${count}...`);

        while (true) {
            // Generate message
            let message = '';

            try {
                const question = await this.queryModel(text);
                message = this.processor.extractMessage(this.api, this.stream, question);
            } catch (err) {
                console.log(`ERROR: ${err}`);
            }

            if (message !== '') {
                // Success
                this.extracted.push({ index: i, text: message });
                break;
            }

            // Failed, regenerate
            console.log('Empty message, regenerating.');
        }
    }

    async extractQuestions() {
        const file = await this.vfs.readFile(`${config.out}/generated-questions.jsonl`);
        const lines = file.toString().split('\n');
        const count = lines.length;
        let index = 0;

        while (index < count) {
            // Get tasks count
            const tasksAmount = (index - this.connections > count)
                ? count - index
                : this.connections;

            // Start measuring metrics
            const timer = new PerformanceTimer(tasksAmount);
            timer.start();

            // Generate tasks   
            const indexes = [];
            for (let i = 0; i < tasksAmount; i++) {
                indexes.push(i + index);
            }

            const tasks = indexes.map(async (i) => {
                const entry = JSON.parse(lines[i]);
                await this.extractQuestion(entry.text, i, count);
            });

            // Run tasks in parallel
            await Promise.all(tasks);
            index += tasksAmount;

            // Stop measuring metrics
            timer.stop();
            timer.showMetrics();
        }

        // Sort to original order
        this.extracted.sort((a, b) => a.index - b.index);

        // Save
        const text = JSON.stringify(this.extracted);
        this.vfs.saveFile(`${config.out}/extracted-questions.jsonl`, text);

        console.log('Done.');
    }
}

class Config {
    constructor() {
        const DEBUG = true;

        /** The output directory. */
        this.out = "./out/";

        /** The host to connect to. */
        this.host = "127.0.0.1";

        /** The port to connect to. */
        this.port = 8080;

        /** Maximum amount of parallel connections. */
        this.connections = (!DEBUG)
            ? 32
            : 1;

        /** The API to use. (can be "openai/v1" or "ollama") */
        this.api = "openai/v1";

        /** If we use SSE when receiving the response */
        this.stream = false;

        /**
         * The model to use when using Ollama.
         * 
         * Recommended for use:
         *
         * **Model**      | **Size** | **Identifier**
         * -------------- | -------- | ------------------------
         * Granite 4.0 H  | 8B       | granite4:tiny-h-q8_0
         * Granite 4.0 H  | 32B      | granite4:small-h-q8_0
         * 
         * To install, run in powershell:
         * ollama run <model>
         */
        this.model = "granite4:tiny-h-q8_0";
    }
}

// Run generator
const config = new Config();
const generator = new QuestionExtractor(config);
await generator.init();
await generator.extractQuestions();