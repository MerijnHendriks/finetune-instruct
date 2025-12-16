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
    async queryModel(seed, prompt, role, useSystem, systemPrompt) {
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
                content: systemPrompt
            });
        }

        body.messages.push({
            role: role,
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
    async generateMessage(i, prompt, role, useSystem, systemPrompt) {
        while (true) {
            console.log(`Generating ${i + 1} / ${this.count}...`);

            // Generate message
            let message = '';

            try {
                const text = await this.queryModel(i, prompt, role, useSystem, systemPrompt);
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

        // Set prompt to use
        let prompt = '';
        let role = '';
        let useSystem = false;
        let systemPrompt = '';
        switch (this.model) {
            // NOTE: Seems to output a lot of math questions.
            case 'mistral:7b-v0.1':
                prompt = '<s>[INST]';
                role = 'assistant';
                useSystem = true;
                systemPrompt = '';
                this.temp = 0.5;
                this.top_p = 1;
                break;

            // NOTE: Questions are decent, but the output format is weird.
            //       Sometimes includes multi-turn.
            case 'mistral:7b-v0.2':
                prompt = '<s>[INST]';
                useSystem = true;
                systemPrompt = '';
                this.temp = 0.5;
                this.top_p = 1;
                break;

            // NOTE: Usable output, apache 2.0 licensed.
            case 'mistral:7b-v0.3':
                prompt = '<s>[INST]';
                role = 'assistant';
                useSystem = false;
                systemPrompt = '';
                this.temp = 0.5;
                this.top_p = 1;
                break;

            // NOTE: Usable output, apache 2.0 licensed.
            //       Instruct and reasoning variant of same size produce same output.
            case 'ministral-3:3b-2512':
            case 'ministral-3:8b-2512':
            case 'ministral-3:14b-2512':
                prompt = '<s>[INST]';
                role = 'assistant';
                useSystem = true;
                systemPrompt = '';
                this.temp = 0.5;
                this.top_p = 1;
                break;

            // NOTE: Usable output, apache 2.0 licensed.
            //       Relative high chance of getting generic hello message.
            case 'devtral-small:24b-2505':
            case 'devtral-small:24b-2507':
            case 'devtral-small-2:24b-2512':
                prompt = '<s>[INST]';
                role = 'assistant';
                useSystem = true;
                systemPrompt = ' ';
                this.temp = 0.5;
                this.top_p = 1;
                break;

            // NOTE: Usable output, apache 2.0 licensed.
            //       Relative high chance of getting generic hello message.
            case 'mistral-small-3:24b-2501':
            case 'mistral-small-3:24b-2503':
            case 'mistral-small-3:24b-2506':
                prompt = '<s>[INST]';
                role = 'assistant';
                useSystem = true;
                systemPrompt = ' ';
                this.temp = 0.5;
                this.top_p = 1;
                break;

            // NOTE: Produced quite a lot of garbage.
            case 'magistral-small:24b-2506':
            case 'magistral-small:24b-2507':
                prompt = '<s>[SYSTEM_PROMPT] [/SYSTEM_PROMPT] [INST]';
                role = 'assistant';
                useSystem = true;
                systemPrompt = ' ';
                this.temp = 0.5;
                this.top_p = 1;
                break;

            // NOTE: Usable output, apache 2.0 licensed.
            //       Sometimes includes multi-turn.
            case 'magistral-small:24b-2509':
                prompt = '<s>[SYSTEM_PROMPT] [/SYSTEM_PROMPT] [INST]';
                role = 'assistant';
                useSystem = true;
                systemPrompt = ' ';
                this.temp = 0.5;
                this.top_p = 1;
                break;

            // NOTE: Usable output, llama3 licensed.
            //       Sometimes includes multi-turn.
            case 'llama3:8b':
            case 'llama3:70b':
                prompt = '<|begin_of_text|><|start_header_id|>user<|end_header_id|>\n\n';
                role = 'assistant';
                useSystem = false;
                systemPrompt = '';
                this.temp = 0.5;
                this.top_p = 1;
                break;

            // NOTE: Produces mostly math questions.
            case 'llama3.1:8b':
                prompt = '<|begin_of_text|><|start_header_id|>user<|end_header_id|>\n\n';
                role = 'assistant';
                useSystem = false;
                systemPrompt = '';
                this.temp = 0.5;
                this.top_p = 1;
                break;

            // NOTE: Rarely produced questions, usually text dumps.
            case 'llama3.2:3b':
                prompt = '<|begin_of_text|><|start_header_id|>user<|end_header_id|>\n\n';
                role = 'assistant';
                useSystem = true;
                systemPrompt = '';
                this.temp = 0.5;
                this.top_p = 1;
                break;

            // NOTE: Usable output, llama3 licensed.
            /* QUICK STUDY
             * - 0 \n: varied questions
             * - 1 \n: mostly travel and history questions
             * - 2 \n: same as no newline
             */
            case 'llama3.2:1b':
                prompt = '<|begin_of_text|><|start_header_id|>user<|end_header_id|>\n\n';
                role = 'assistant';
                useSystem = true;
                systemPrompt = '';
                this.temp = 0.5;
                this.top_p = 1;
                break;

            // NOTE: Produced too much garbage to be useful
            case 'userlm:8b':
                prompt = '<|begin_of_text|><|start_header_id|>user<|end_header_id|>\n\n';
                role = 'assistant';
                useSystem = false;
                systemPrompt = '';
                this.temp = 0.5;
                this.top_p = 1;
                break;

            default:
                console.log('Unknown model.');
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
                await this.generateMessage(i, prompt, role, useSystem, systemPrompt);
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
        const DEBUG = true;

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
        this.model = 'devtral-small-2:24b-2512';
    }
}

// Run generator
const config = new Config();
const generator = new InstructGenerator(config);
await generator.init();
await generator.generateQuestions();