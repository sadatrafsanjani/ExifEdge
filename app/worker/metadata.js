const { parentPort, workerData } = require('worker_threads')
const { exiftool } = require('exiftool-vendored')
const readImageMetadata  = require('../core/metareader');

class MetadataReader {

    constructor(filePath) {
        this.filePath = filePath;
    }

    async read() {
        try {

            const metadata = await exiftool.read(this.filePath);
            //const metadata = readImageMetadata(workerData.filePath);

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
        finally {

            await exiftool.end();

        }
    }
}

const metadataReader = new MetadataReader(workerData.filePath);

metadataReader.read().catch(error => {
    console.error(error);
});
