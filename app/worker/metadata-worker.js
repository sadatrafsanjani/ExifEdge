const { parentPort, workerData } = require('worker_threads')
const { exiftool } = require('exiftool-vendored')
const { readImageMetadata, detectAIGenerated } = require('../core/metareader');


class MetadataWorker{

    constructor(filePath) {
        this.filePath = filePath;
    }

    async read() {

        try {
            // const metadata = readImageMetadata(this.filePath);
            // const aiDetection = detectAIGenerated(metadata);

            const metadata = await exiftool.read(this.filePath);

            parentPort.postMessage({
                success: true,
                metadata
            });
        }
        catch (error) {
            parentPort.postMessage({
                success: false,
                error: error.message
            });
        }
    }
}

new MetadataWorker(workerData.filePath).read();
