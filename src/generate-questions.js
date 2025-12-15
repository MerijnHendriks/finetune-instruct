import { HttpClient } from './utils/HttpClient.js';
import { PerformanceTimer } from './utils/PerformanceTimer.js';
import { ResponseProcessor } from './utils/ResponseProcessor.js';
import { VFS } from './utils/VFS.js';

class InstructGenerator {
    constructor(config) {
        this.vfs = new VFS();
        this.processor = new ResponseProcessor();

        // Load config
        this.count = config.count;
        this.host = config.host;
        this.port = config.port;
        this.connections = config.connections;
        this.api = config.api;
        this.stream = config.stream;
        this.model = config.model;
        this.temp = config.temp;
        this.top_p = config.top_p;
        this.outpath = `${config.out}/${this.model.replaceAll(':', '-')}/`;

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
    async queryModel(prompt, useSystem, seed) {
        const maxToken = 1024;
        const body = {
            model: this.model,
            seed: seed,
            temperature: this.temp,
            top_p: this.top_p,
            messages: [],
            stream: this.stream,
            stream_options: {
                include_obfuscation: false
            },
            max_completion_tokens: maxToken,
            max_tokens: maxToken
        };

        if (useSystem) {
            body.messages.push({
                role: 'system',
                content: ''
            });
        }

        body.messages.push({
            role: 'assistant',
            content: prompt
        });

        return await this.client.post(body);
    }

    /**
     * Generates and instruction question from API.
     * 
     * @param {string} role Which role the system should have.
     * @param {string} prompt The text to send to the model.
     * @param {number} i Current request index.
     */
    async generateMessage(prompt, useSystem, i) {
        while (true) {
            console.log(`Generating ${i + 1} / ${this.count}...`);

            // Generate message
            let message = '';

            try {
                const text = await this.queryModel(prompt, useSystem, i);
                message = this.processor.extractMessage(this.api, this.stream, text);
            } catch (err) {
                console.log(`ERROR at ${i}: ${err}`);
            }

            if (message !== '' && message !== 'assistant') {
                // Success
                const savepath = `${this.outpath}msg-${i + 1}.txt`;
                await this.vfs.saveFile(savepath, message);
                break;
            }

            // Failed, regenerate
            console.log('Empty message, regenerating.');
        }
    }

    /**
     * Generates instruction questions from API.
     */
    async generateQuestions() {
        // Create file directory (if it doesn't exist)
        await this.vfs.createDir(this.outpath);

        // set prompt to use
        let prompt = '';
        let useSystem = false;
        switch (this.model) {
            case 'mistral:7b-instruct-v0.1-q8_0':
                prompt = '<s>[INST]';
                useSystem = true;
                break;

            case 'mistral:7b-instruct-v0.2-q8_0':
                prompt = '<s>[INST]';
                useSystem = true;
                break;

            case 'mistral:7b-instruct-v0.3-q8_0':
            case 'ministral-3:3b-instruct-2512-q8_0':
            case 'ministral-3:3b-reasoning-2512-q8_0':
            case 'ministral-3:8b-instruct-2512-q8_0':
            case 'ministral-3:8b-reasoning-2512-q8_0':
            case 'ministral-3:14b-instruct-2512-q8_0':
            case 'ministral-3:14b-reasoning-2512-q8_0':
                prompt = '<s>[INST]';
                useSystem = false;
                break;

            case 'magistral-small:24b-2509-q4_k_m':
                prompt = '<s>[SYSTEM_PROMPT] [/SYSTEM_PROMPT] [INST]';
                useSystem = true;
                break;

            case 'llama3:8b-instruct-q8_0':
            case 'llama3:70b-instruct-q8_0':
            case 'llama3.1:8b-instruct-q8_0':
            case 'llama3.1:70b-instruct-q8_0':
            case 'llama3.1:405b-instruct-q8_0':
            case 'llama3.2:1b-instruct-q8_0':
            case 'llama3.2:3b-instruct-q8_0':
            case 'llama3.3:70b-instruct-q8_0':
                prompt = '<|begin_of_text|><|start_header_id|>user<|end_header_id|>';
                useSystem = false;
                break;
        }

        // Get starting index
        const start = await this.vfs.getFilesCount(this.outpath);
        let index = start;

        while (index < this.count) {
            // Get tasks count
            const tasksAmount = (index - this.connections > this.count)
                ? this.count - index
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
                await this.generateMessage(prompt, useSystem, i);
            });

            // Run tasks in parallel
            await Promise.all(tasks);
            index += tasksAmount;

            // Stop measuring metrics
            timer.stop();
            timer.showMetrics();
        }

        console.log('Done.');
    }
}

class Config {
    constructor() {
        const DEBUG = false;

        /** Amount of samples to generate. */
        this.count = (!DEBUG)
            ? 1000000
            : 10;

        /** The output directory. */
        this.out = "./out/";

        /** The host to connect to. */
        this.host = "127.0.0.1";

        /** The port to connect to. */
        this.port = 8080;

        /** Maximum amount of parallel connections. */
        this.connections = (!DEBUG) ? 48 : 1;

        /** The API to use. (can be "openai/v1" or "ollama") */
        this.api = "openai/v1";

        /** If we use SSE when receiving the response */
        this.stream = false;

        /** The model to use (in ollama naming format) */
        this.model = 'mistral:7b-instruct-v0.2-q8_0';

        /** Model temperature. */
        this.temp = 0.5;

        /** Model top_p sampler. */
        this.top_p = 1;
    }
}

// Run generator
const config = new Config();
const generator = new InstructGenerator(config);
await generator.init();
await generator.generateQuestions();