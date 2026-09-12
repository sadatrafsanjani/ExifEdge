const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
    selectImage: () => ipcRenderer.invoke('select-image'),
    cleanImageV1: () => ipcRenderer.invoke('clean-image-v1'),
    cancelImage: () => ipcRenderer.invoke('cancel-image')
})
