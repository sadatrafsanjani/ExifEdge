const fs = require('fs')

function removeImageMetadata(inputPath, outputPath) {

    const buffer = fs.readFileSync(inputPath)

    if (isJpeg(buffer)) {
        sanitizeJpeg(buffer, outputPath)
        return
    }

    if (isPng(buffer)) {
        sanitizePng(buffer, outputPath)
        return
    }

    throw new Error('Unsupported image format')
}

function isJpeg(buffer) {

    return (
        buffer.length >= 2 &&
        buffer[0] === 0xFF &&
        buffer[1] === 0xD8
    )
}

function isPng(buffer) {

    return (
        buffer.length >= 8 &&
        buffer[0] === 0x89 &&
        buffer[1] === 0x50 &&
        buffer[2] === 0x4E &&
        buffer[3] === 0x47 &&
        buffer[4] === 0x0D &&
        buffer[5] === 0x0A &&
        buffer[6] === 0x1A &&
        buffer[7] === 0x0A
    )
}

function sanitizeJpeg(buffer, outputPath) {

    const output = []

    // JPEG Start Of Image
    output.push(Buffer.from([0xFF, 0xD8]))

    let offset = 2

    while (offset < buffer.length) {
        if (buffer[offset] !== 0xFF) {
            throw new Error('Invalid JPEG structure')
        }

        // Skip repeated 0xFF fill bytes
        let markerOffset = offset

        while (
            markerOffset < buffer.length &&
            buffer[markerOffset] === 0xFF
            ) {
            markerOffset++
        }

        if (markerOffset >= buffer.length) {
            throw new Error('Invalid JPEG marker')
        }

        const marker = buffer[markerOffset]
        offset = markerOffset + 1

        // Start Of Scan.
        // Everything from SOS to EOF is compressed image data.
        if (marker === 0xDA) {
            output.push(buffer.subarray(
                markerOffset - 1,
                buffer.length
            ))

            break
        }

        // End Of Image before SOS is invalid.
        if (marker === 0xD9) {
            throw new Error('Invalid JPEG: EOI before SOS')
        }

        // Standalone JPEG markers.
        if (
            marker === 0x01 ||
            (marker >= 0xD0 && marker <= 0xD7)
        ) {
            output.push(
                Buffer.from([0xFF, marker])
            )

            continue
        }

        if (offset + 2 > buffer.length) {
            throw new Error('Invalid JPEG segment length')
        }

        const segmentLength = buffer.readUInt16BE(offset)

        if (segmentLength < 2) {
            throw new Error('Invalid JPEG segment length')
        }

        const segmentEnd = offset + segmentLength

        if (segmentEnd > buffer.length) {
            throw new Error('JPEG segment exceeds file size')
        }

        const segment = buffer.subarray(
            markerOffset - 1,
            segmentEnd
        )

        if (shouldKeepJpegSegment(marker, buffer, offset + 2, segmentEnd)) {
            output.push(segment)
        }

        offset = segmentEnd
    }

    fs.writeFileSync(outputPath, Buffer.concat(output))
}

function shouldKeepJpegSegment(marker, buffer, dataStart, segmentEnd) {

    if (marker === 0xE0) {
        return isJfifSegment(
            buffer,
            dataStart,
            segmentEnd
        )
    }

    if (marker === 0xE2) {
        return isIccProfileSegment(
            buffer,
            dataStart,
            segmentEnd
        )
    }

    if (marker === 0xEE) {
        return isAdobeSegment(
            buffer,
            dataStart,
            segmentEnd
        )
    }


    if (marker >= 0xE1 && marker <= 0xED) {
        return false
    }

    if (marker === 0xEF) {
        return false
    }

    if (marker === 0xFE) {
        return false
    }

    return true
}

function isJfifSegment(buffer, dataStart, segmentEnd) {

    const identifier = Buffer.from('JFIF\0')

    if (dataStart + identifier.length > segmentEnd) {
        return false
    }

    return buffer.subarray(
        dataStart,
        dataStart + identifier.length
    ).equals(identifier)
}

function isIccProfileSegment(buffer, dataStart, segmentEnd) {
    const identifier = Buffer.from('ICC_PROFILE\0')

    if (dataStart + identifier.length > segmentEnd) {
        return false
    }

    return buffer.subarray(
        dataStart,
        dataStart + identifier.length
    ).equals(identifier)
}

function isAdobeSegment(buffer, dataStart, segmentEnd) {
    const identifier = Buffer.from('Adobe')

    if (dataStart + identifier.length > segmentEnd) {
        return false
    }

    return buffer.subarray(
        dataStart,
        dataStart + identifier.length
    ).equals(identifier)
}

function sanitizePng(buffer, outputPath) {
    const output = []

    // PNG signature
    output.push(buffer.subarray(0, 8))

    let offset = 8
    let foundIHDR = false
    let foundIEND = false

    while (offset < buffer.length) {
        if (offset + 12 > buffer.length) {
            throw new Error('Invalid PNG chunk')
        }

        const dataLength = buffer.readUInt32BE(offset)

        const chunkStart = offset
        const dataStart = offset + 8
        const chunkEnd = dataStart + dataLength
        const nextOffset = chunkEnd + 4

        if (nextOffset > buffer.length) {
            throw new Error('PNG chunk exceeds file size')
        }

        const type = buffer.toString(
            'ascii',
            offset + 4,
            offset + 8
        )

        const chunk = buffer.subarray(
            chunkStart,
            nextOffset
        )

        if (type === 'IHDR') {
            if (foundIHDR) {
                throw new Error('Invalid PNG: multiple IHDR chunks')
            }

            foundIHDR = true
            output.push(chunk)
        } else if (type === 'IDAT') {
            output.push(chunk)
        } else if (type === 'IEND') {
            output.push(chunk)
            foundIEND = true
            break
        } else if (shouldKeepPngChunk(type)) {
            output.push(chunk)
        }

        offset = nextOffset
    }

    if (!foundIHDR) {
        throw new Error('Invalid PNG: IHDR not found')
    }

    if (!foundIEND) {
        throw new Error('Invalid PNG: IEND not found')
    }

    fs.writeFileSync(
        outputPath,
        Buffer.concat(output)
    )
}

function shouldKeepPngChunk(type) {

    if (
        type === 'PLTE' ||
        type === 'tRNS' ||
        type === 'sRGB' ||
        type === 'gAMA' ||
        type === 'cHRM' ||
        type === 'sBIT' ||
        type === 'iCCP' ||
        type === 'pHYs'
    ) {
        return true
    }

    return false
}

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

module.exports = {
    isSupportedImage,
    removeImageMetadata
}
