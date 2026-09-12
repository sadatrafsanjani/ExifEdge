const { app, BrowserWindow, dialog, ipcMain, Menu } = require('electron')
const path = require('path')
const { pathToFileURL } = require('url')
const { exiftool } = require('exiftool-vendored')
const fs = require('fs')
const { removeImageMetadata } = require('./core/engine')

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

    //win.webContents.openDevTools();
    Menu.setApplicationMenu(null);
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

    const metadata = await exiftool.read(filePath);
    selectedImagePath = filePath;

    return {
        url: pathToFileURL(filePath).href,
        metadata: metadata
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

    selectedImagePath = null;
})

app.whenReady().then(() => {

    createWindow();

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


function isSupportedImage(filePath) {

    const buffer = fs.readFileSync(filePath)

    const isJpeg =
        buffer.length >= 2 &&
        buffer[0] === 0xFF &&
        buffer[1] === 0xD8

    const isPng =
        buffer.length >= 8 &&
        buffer[0] === 0x89 &&
        buffer[1] === 0x50 &&
        buffer[2] === 0x4E &&
        buffer[3] === 0x47 &&
        buffer[4] === 0x0D &&
        buffer[5] === 0x0A &&
        buffer[6] === 0x1A &&
        buffer[7] === 0x0A

    return isJpeg || isPng
}
