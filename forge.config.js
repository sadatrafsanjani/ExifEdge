module.exports = {
    packagerConfig: {
        asar: {
            unpack: '**/node_modules/exiftool-vendored*/**'
        },
        icon: './assets/icon.ico'
    },

    makers: [
        {
            name: '@electron-forge/maker-squirrel',
            config: {
                name: 'exifedge',
                setupIcon: './assets/icon.ico',
                iconUrl: 'https://raw.githubusercontent.com/sadatarfsanjani/ExifEdge/main/assets/icon.ico'
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
};
