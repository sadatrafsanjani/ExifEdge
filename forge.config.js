module.exports = {
    packagerConfig: {
        asar: true,
        icon: './assets/icon'
    },

    makers: [
        {
            name: '@electron-forge/maker-squirrel',
            config: {
                name: 'exifedge'
            }
        }
    ],

    publishers: [
        {
            name: '@electron-forge/publisher-github',
            config: {
                repository: {
                    owner: 'sadatarfsanjani',
                    name: 'ExifEdge'
                }
            }
        }
    ]
}
