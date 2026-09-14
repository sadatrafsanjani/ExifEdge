const { parentPort, workerData } = require('worker_threads')
const { exiftool } = require('exiftool-vendored')

async function readMetadata() {

    try {
        const metadata = await exiftool.read(workerData.filePath)

        parentPort.postMessage({
            success: true,
            metadata
        })
    }
    catch (error) {
        parentPort.postMessage({
            success: false,
            error: error.message
        })
    }
    finally {
        await exiftool.end()
    }
}

readMetadata();
