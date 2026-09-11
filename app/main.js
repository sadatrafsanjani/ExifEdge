const { app, BrowserWindow, dialog, ipcMain, Menu } = require('electron')
const path = require('path')
const { pathToFileURL } = require('url')
const { exiftool } = require('exiftool-vendored')

function createWindow() {

    const win = new BrowserWindow({
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
    win.loadFile('./app/index.html');
}

ipcMain.handle('select-image', async () => {

    const result = await dialog.showOpenDialog({
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

    return {
        url: pathToFileURL(filePath).href,
        metadata: metadata
    }
})

ipcMain.handle('clean-image', async () => {

    console.log("Clean");

    return true;
})

ipcMain.handle('cancel-image', async () => {

    console.log("Cancel");
})

app.whenReady().then(() => {

    createWindow()

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
