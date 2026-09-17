const { parentPort, workerData } = require('worker_threads')
const { exiftool } = require('exiftool-vendored')

class MetadataWorker{

    constructor(filePath) {
        this.filePath = filePath;
    }

    async read() {

        try {

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
