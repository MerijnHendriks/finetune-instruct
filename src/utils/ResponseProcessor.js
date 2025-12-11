export class ResponseProcessor {
    /**
     * Unescape a piece of text.
     * 
     * @param {string} text - The text to unescape.
     * @returns The unescaped text.
     */
    unescape(text) {
        return text
            .replace(/\\n/g, '\n')
            .replace(/\\t/g, '    ')
            .replace(/\\"/g, '"');
    }

    /**
     * Extracts the complete message from the response body.
     *
     * @param {string} body The response body.
     * @returns {string} The full message.
     */
    processOpenAiStream(body) {
        const lines = body.split('"chat.completion.chunk"');
        let message = '';

        // extract message
        for (const line of lines) {
            if (line.includes('"delta":{"content":"') && line.includes('"}}]')) {
                message += line
                    .split('content":"')[1]
                    .split('"}}],')[0];
            }
        }

        return message;
    }

    /**
     * Extracts the complete message from the response body.
     *
     * @param {string} body The response body.
     * @returns {string} The full message.
     */
    processOllamaStream(body) {
        const lines = body.split(':false}');
        let message = '';

        // extract message
        for (const line of lines) {
            message += line
                .split('content":"')[1]
                .split('"},"done"')[0];
        }

        return message;
    }

    /**
     * Extracts the complete message from the response body.
     *
     * @param {string} body The response body.
     * @returns {string} The full message.
     */
    processOpenAiResponse(body) {
        return body
            .split('content":"')[1]
            .split('"}}],')[0];
    }

    /**
     * Extracts the complete message from the response body.
     *
     * @param {string} body The response body.
     * @returns {string} The full message.
     */
    processOllamaResponse(body) {
        return body
            .split('{"role":"assistant","content":"')[1]
            .split('"},"done"')[0];
    }

    /**
     * Extracts the message from responses.
     * 
     * @param {string} api Current API in use.
     * @param {boolean} stream If streaming is enabled.
     * @param {string} text The text to extract the message from.
     * @returns {string} The message.
     */
    extractMessage(api, stream, text) {
        let message = '';

        // Extract message
        switch (api) {
            case 'openai/v1':
                message = stream
                    ? this.processOpenAiStream(text)
                    : this.processOpenAiResponse(text);
                break;

            case 'ollama':
                message = stream
                    ? this.processOllamaStream(text)
                    : this.processOllamaResponse(text);
                break;
        }

        // Unescape text
        message = this.unescape(message);

        // Remove initial newlines
        message = message.trim();

        return message;
    }
}