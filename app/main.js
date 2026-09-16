if (require('electron-squirrel-startup')) {
    return;
}

const { app, BrowserWindow, dialog, ipcMain, Menu } = require('electron')
const path = require('path')
const { pathToFileURL } = require('url')
const { removeImageMetadata, isSupportedImage } = require('./core/metaremover')
const { Worker } = require('worker_threads')

let mainWindow = null;
let selectedImagePath = null

function createWindow() {

    mainWindow = new BrowserWindow({
        width: 1000,
        height: 700,
        icon: path.join(__dirname, '..', 'assets', 'icon.ico'),
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false
        }
    });

    //mainWindow.webContents.openDevTools();
    mainWindow.loadFile('./app/index.html');
}


ipcMain.handle('select-image', async () => {

    const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openFile'],
        filters: [
            {
                name: 'Images',
                extensions: ['jpg', 'jpeg', 'png']
            }
        ]
    })

    if (result.canceled || result.filePaths.length === 0) {
        return null
    }

    const filePath = result.filePaths[0];

    if (!isSupportedImage(filePath)) {

        return {
            error: 'Unsupported image format. Please select a JPEG or PNG image.'
        }
    }

    selectedImagePath = filePath;

    return {
        url: pathToFileURL(filePath).href
    }
})

ipcMain.handle('clean-image', async () => {

    if (!selectedImagePath) {
        return null
    }

    const directory = path.dirname(selectedImagePath)
    const extension = path.extname(selectedImagePath)
    const filename = path.basename(selectedImagePath, extension)

    const outputPath = path.join(directory, `${filename}_clean${extension}`)

    removeImageMetadata(selectedImagePath, outputPath)

    return {
        path: outputPath,
        url: pathToFileURL(outputPath).href
    }
})

ipcMain.handle('cancel-image', async () => {

    if (!selectedImagePath) {
        return null
    }

    selectedImagePath = null;
})

app.whenReady().then(() => {

    createWindow();
    Menu.setApplicationMenu(null);

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow()
        }
    })
})

app.on('window-all-closed', () => {

    if (process.platform !== 'darwin') {
        app.quit()
    }
})

ipcMain.handle('read-metadata', async () => {

    if (!selectedImagePath) {
        return null
    }

    return new Promise((resolve) => {

        let settled = false
        const settle = (result) => {
            if (settled) return
            settled = true
            resolve(result)
        }

        let worker
        try {
            worker = new Worker(
                path.join(__dirname, './worker/metadata-worker.js'),
                {
                    workerData: {
                        filePath: selectedImagePath
                    }
                }
            )
        }
        catch (error) {
            settle({ success: false, error: error.message })
            return
        }

        worker.once('message', (result) => {
            settle(result)
            worker.terminate()
        })

        worker.once('error', (error) => {
            settle({ success: false, error: error.message })
            worker.terminate()
        })

        worker.once('exit', (code) => {

            if (code !== 0) {
                settle({ success: false, error: `Worker stopped unexpectedly (exit code ${code})` })
            }
        })
    })
})
