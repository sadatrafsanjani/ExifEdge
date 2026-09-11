const selectButton = document.getElementById('selectButton');
const imagePreview = document.getElementById('imagePreview');
const metadata = document.getElementById('metadata');
const cleanButton = document.getElementById('cleanButton');
const cancelButton = document.getElementById('cancelButton');

selectButton.addEventListener('click', async () => {

    const image = await window.electronAPI.selectImage()

    if (!image) {
        return
    }

    imagePreview.src = image.url;
    imagePreview.classList.remove('d-none');
    cleanButton.classList.remove('d-none');
    cancelButton.classList.remove('d-none');
    cleanButton.disabled = false;
    cancelButton.disabled = false;


    displayPrivacyRisk(image.metadata);

    metadata.innerHTML = ''

    Object.entries(image.metadata).forEach(([key, value]) => {

        const row = document.createElement('div')
        row.className = 'mb-2'

        const displayValue = typeof value === 'object' ? JSON.stringify(value) : value

        row.innerHTML = `
            <strong>${key}:</strong>
            <span>${displayValue}</span>
        `

        metadata.appendChild(row)
    })
})


function displayPrivacyRisk(metadata) {

    const counts = classifyMetadata(metadata)
    const privacyRisk = document.getElementById('privacyRisk')

    privacyRisk.innerHTML = `
        <div class="fw-bold mb-2 border-bottom">Privacy Risk</div>

        <div class="small">
            <div class="d-flex justify-content-between">
                <span>🔴 Location</span>
                <span>${counts.Location} items</span>
            </div>

            <div class="d-flex justify-content-between">
                <span>🔴 Device</span>
                <span>${counts.Device} items</span>
            </div>

            <div class="d-flex justify-content-between">
                <span>🔴 Identity</span>
                <span>${counts.Identity} items</span>
            </div>

            <div class="d-flex justify-content-between">
                <span>🔴 Time</span>
                <span>${counts.Time} items</span>
            </div>

            <div class="d-flex justify-content-between">
                <span>🟠 Software / History</span>
                <span>${counts['Software / History']} items</span>
            </div>

            <div class="d-flex justify-content-between">
                <span>🟠 AI / Provenance</span>
                <span>${counts['AI / Provenance']} items</span>
            </div>

            <div class="d-flex justify-content-between">
                <span>🟠 Other</span>
                <span>${counts.Other} items</span>
            </div>
        </div>
    `
}


function classifyMetadata(metadata) {

    const counts = {
        Location: 0,
        Device: 0,
        Identity: 0,
        Time: 0,
        'Software / History': 0,
        'AI / Provenance': 0,
        Other: 0
    }

    for (const [key, value] of Object.entries(metadata)) {
        const k = key.toLowerCase()

        // Location
        if (
            k.includes('gps') ||
            k.includes('latitude') ||
            k.includes('longitude') ||
            k.includes('altitude') ||
            k.includes('city') ||
            k.includes('state') ||
            k.includes('country') ||
            k.includes('location') ||
            k.includes('address')
        ) {
            counts.Location++
            continue
        }

        // Device
        if (
            k === 'make' ||
            k === 'model' ||
            k.includes('lens') ||
            k.includes('serial') ||
            k.includes('makernote') ||
            k.includes('device')
        ) {
            counts.Device++
            continue
        }

        // Identity
        if (
            k === 'artist' ||
            k === 'author' ||
            k === 'creator' ||
            k === 'ownername' ||
            k === 'copyright' ||
            k === 'byline' ||
            k === 'credit' ||
            k === 'source' ||
            k === 'title'
        ) {
            counts.Identity++
            continue
        }

        // Time
        if (
            k.includes('datetime') ||
            k.includes('createdate') ||
            k.includes('modifydate') ||
            k.includes('digitized') ||
            k.includes('gpstime') ||
            k.includes('datestamp') ||
            k === 'fileaccessdate' ||
            k === 'filecreatedate' ||
            k === 'filemodifydate'
        ) {
            counts.Time++
            continue
        }

        // Software / History
        if (
            k === 'software' ||
            k === 'creatortool' ||
            k.includes('processing') ||
            k.includes('history') ||
            k.includes('photoshop') ||
            k.includes('lightroom') ||
            k.includes('application') ||
            k.includes('xmp toolkit')
        ) {
            counts['Software / History']++
            continue
        }

        // AI / Provenance
        if (
            k.startsWith('c2pa') ||
            k.startsWith('jumd') ||
            k.includes('provenance') ||
            k.includes('contentcredential') ||
            k === 'claim_generator_info' ||
            k === 'created_assertions' ||
            k === 'gathered_assertions' ||
            k === 'exclusions' ||
            k === 'actions' ||
            k === 'signature' ||
            (k === 'name' && String(value).toLowerCase() === 'jumbf manifest')
        ) {
            counts['AI / Provenance']++
            continue
        }

        // Other privacy metadata
        if (
            k === 'imagedescription' ||
            k === 'description' ||
            k === 'usercomment' ||
            k === 'comment' ||
            k === 'keywords' ||
            k === 'rating' ||
            k === 'subject' ||
            k.includes('uniqueid') ||
            k.includes('uuid') ||
            k.includes('instanceid')
        ) {
            counts.Other++
        }
    }

    return counts
}


cleanButton.addEventListener('click', async () => {

    const result = await window.electronAPI.cleanImage();

    if (result) {
        console.log('Clean image:', result)
    }
})


cancelButton.addEventListener('click', async () => {

    await window.electronAPI.cancelImage();
})
