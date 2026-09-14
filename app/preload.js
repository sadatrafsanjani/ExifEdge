const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
    selectImage: () => ipcRenderer.invoke('select-image'),
    cleanImage: () => ipcRenderer.invoke('clean-image'),
    cancelImage: () => ipcRenderer.invoke('cancel-image'),
    readMetadata: () => ipcRenderer.invoke('read-metadata'),
})
