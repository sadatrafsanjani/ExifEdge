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
        height: 650,
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

    const filePath = result.filePaths[0]
    const metadata = await exiftool.read(filePath)
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
