import { promises as fs } from 'fs';

export class VFS {
    /**
     * Read file from disk.
     *
     * @param {string} filepath The file location.
     * @returns {Promise<string>} The file contents.
     */
    async readFile(filepath) {
        const file = await fs.readFile(filepath);
        return file.toString();
    }

    /**
     * Read json from disk.
     *
     * @param {string} filepath The file location.
     * @returns {Promise<object>} Parsed json object
     */
    async readJsonFile(filepath) {
        const text = this.readFile(filepath);
        return JSON.parse(text);
    }

    /**
     * Saves the message to disk.
     *
     * @param {string} filepath The file location.
     * @param {string} message The message to save.
     */
    async saveFile(filepath, message, append = false) {
        const options = {
            flag: append ? 'a' : 'w'
        };

        await fs.writeFile(filepath, message, options);
    }

    /**
     * Get the amount of files in the directory.
     *
     * @param {string} filepath - The directory.
     * @returns {Promise<number>} The amount of files in the directory.
     */
    async getFilesCount(filepath) {
        const files = await fs.readdir(filepath);
        return files.length;
    }

    /**
     * Create a directory
     *
     * @param {string} filepath - The directory to create.
     */
    async createDir(filepath) {
        await fs.mkdir(filepath, { recursive: true });
    }

    /**
     * Get directories inside a directory.
     * 
     * @param {string} filepath - The directory to read.
     * @returns List of directories.
     */
    async getDirs(filepath) {
        const items = await fs.readdir(filepath, { withFileTypes: true })
        return items.filter(item => item.isDirectory()).map(item => item.name);
    }

    /**
     * Get files inside a directory.
     * 
     * @param {string} filepath - The directory to read.
     * @returns List of files.
     */
    async getFiles(filepath) {
        const items = await fs.readdir(filepath, { withFileTypes: true })
        return items.filter(item => item.isFile()).map(item => item.name);
    }
}