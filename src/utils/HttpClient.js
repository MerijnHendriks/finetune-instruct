import { Agent, request } from 'http';

export class HttpClient {
    constructor(host, port, path, connections)
    {
        this.host = host;
        this.port = port;
        this.path = path;
        this.agent = new Agent({ keepAlive: true, maxConnections: connections });
    }

    /**
     * Handles response stream.
     *
     * @param {any} res The response.
     * @returns {Promise<string>} The response body.
     */
    streamResponse(res) {
        const chunks = [];

        res.setEncoding('utf8');

        // promisify code
        const streamResponseAsync = (resolve, reject) => {
            res.on('error', () => {
                reject(err);
            });

            res.on('data', (chunk) => {
                chunks.push(Buffer.from(chunk));
            });

            res.on('end', () => {
                resolve(Buffer.concat(chunks).toString());
            });
        };

        return new Promise(streamResponseAsync);
    }

    /**
     * Makes a POST request with a JSON body, expecting a JSON response.
     *
     * @param {string} body The request body.
     * @returns {Promise<object>} The response.
     */
    postRequest(body) {
        const mime = 'application/json; charset=utf-8';
        const payload = JSON.stringify(body);
        const options = {
            agent: this.agent,
            host: this.host,
            port: this.port,
            path: this.path,
            method: 'POST',
            headers: {
                'Accept': mime,
                'Content-Type': mime,
                'Content-Length': Buffer.byteLength(payload)
            }
        };

        // promisify code
        const postRequestAsync = (resolve, reject) => {
            const req = request(options, (res) => {
                resolve(res);
            });

            req.on('error', (err) => {
                reject(err);
            });

            req.write(payload);
            req.end();
        };

        return new Promise(postRequestAsync);
    }

    /**
     * Makes a POST request with a JSON body, returning the response body contents.
     *
     * @param {string} body The request body.
     * @returns {Promise<string>} The response body contents.
     */
    async post(body) {
        const res = await this.postRequest(body);
        return await this.streamResponse(res);
    }
}