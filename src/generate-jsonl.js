import { ResponseProcessor } from './utils/ResponseProcessor.js';
import { PerformanceTimer } from './utils/PerformanceTimer.js';
import { VFS } from './utils/VFS.js';

class DatabaseGenerator {
    async run() {
        const vfs = new VFS;
        const processor = new ResponseProcessor();
        const outpath = './out/';
        
        const timer = new PerformanceTimer();
        timer.start();

        // build list of files to load
        const toProcess = [];
        const directories = await vfs.getDirs(outpath);

        for (const directory of directories) {
            const dirpath = outpath + directory + '/';
            const files = await vfs.getFiles(dirpath);

            for (const file of files) {
                toProcess.push(dirpath + file);
            }
        }

        // generate dataset file
        for (let i = 0; i < toProcess.length; i++) {
            console.log(`Processing ${i + 1} / ${toProcess.length}...`);

            const file = await vfs.readFile(toProcess[i]);
            const obj = { text: processor.unescape(file) };
            let entry = JSON.stringify(obj);

            if (i < toProcess.length - 1) {
                entry += '\n';
            }

            vfs.saveFile(`${outpath}generated-questions.jsonl`, entry, true);
        }

        timer.stop();
        timer.showMetrics();
    }
}

const gen = new DatabaseGenerator();
await gen.run();