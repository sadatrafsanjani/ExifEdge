const fs = require('fs');

const EXIF_TAGS = {
    0x0100: 'ImageWidth',
    0x0101: 'ImageHeight',
    0x0102: 'BitsPerSample',
    0x0103: 'Compression',
    0x0106: 'PhotometricInterpretation',
    0x010e: 'ImageDescription',
    0x010f: 'Make',
    0x0110: 'Model',
    0x0111: 'StripOffsets',
    0x0112: 'Orientation',
    0x0115: 'SamplesPerPixel',
    0x0116: 'RowsPerStrip',
    0x0117: 'StripByteCounts',
    0x011a: 'XResolution',
    0x011b: 'YResolution',
    0x011c: 'PlanarConfiguration',
    0x0128: 'ResolutionUnit',
    0x012d: 'TransferFunction',
    0x0131: 'Software',
    0x0132: 'ModifyDate',
    0x013b: 'Artist',
    0x013e: 'WhitePoint',
    0x013f: 'PrimaryChromaticities',
    0x0211: 'YCbCrCoefficients',
    0x0213: 'YCbCrPositioning',
    0x8298: 'Copyright',
    0x829a: 'ExposureTime',
    0x829d: 'FNumber',
    0x8769: 'ExifIFDPointer',
    0x8822: 'ExposureProgram',
    0x8824: 'SpectralSensitivity',
    0x8825: 'GPSInfoIFDPointer',
    0x8827: 'ISO',
    0x8830: 'SensitivityType',
    0x8831: 'StandardOutputSensitivity',
    0x9000: 'ExifVersion',
    0x9003: 'DateTimeOriginal',
    0x9004: 'CreateDate',
    0x9010: 'OffsetTime',
    0x9011: 'OffsetTimeOriginal',
    0x9012: 'OffsetTimeDigitized',
    0x9101: 'ComponentsConfiguration',
    0x9102: 'CompressedBitsPerPixel',
    0x9201: 'ShutterSpeedValue',
    0x9202: 'ApertureValue',
    0x9203: 'BrightnessValue',
    0x9204: 'ExposureCompensation',
    0x9205: 'MaxApertureValue',
    0x9206: 'SubjectDistance',
    0x9207: 'MeteringMode',
    0x9208: 'LightSource',
    0x9209: 'Flash',
    0x920a: 'FocalLength',
    0x927c: 'MakerNote',
    0x9286: 'UserComment',
    0xa000: 'FlashpixVersion',
    0xa001: 'ColorSpace',
    0xa002: 'PixelXDimension',
    0xa003: 'PixelYDimension',
    0xa004: 'RelatedSoundFile',
    0xa005: 'InteroperabilityIFDPointer',
    0xa20e: 'FocalPlaneXResolution',
    0xa20f: 'FocalPlaneYResolution',
    0xa210: 'FocalPlaneResolutionUnit',
    0xa215: 'ExposureIndex',
    0xa217: 'SensingMethod',
    0xa300: 'FileSource',
    0xa301: 'SceneType',
    0xa401: 'CustomRendered',
    0xa402: 'ExposureMode',
    0xa403: 'WhiteBalance',
    0xa404: 'DigitalZoomRatio',
    0xa405: 'FocalLengthIn35mmFormat',
    0xa406: 'SceneCaptureType',
    0xa407: 'GainControl',
    0xa408: 'Contrast',
    0xa409: 'Saturation',
    0xa40a: 'Sharpness',
    0xa40c: 'SubjectDistanceRange',
    0xa420: 'ImageUniqueID'
};

const GPS_TAGS = {
    0x0000: 'GPSVersionID',
    0x0001: 'GPSLatitudeRef',
    0x0002: 'GPSLatitude',
    0x0003: 'GPSLongitudeRef',
    0x0004: 'GPSLongitude',
    0x0005: 'GPSAltitudeRef',
    0x0006: 'GPSAltitude',
    0x0007: 'GPSTimeStamp',
    0x0008: 'GPSSatellites',
    0x0009: 'GPSStatus',
    0x000a: 'GPSMeasureMode',
    0x000b: 'GPSDOP',
    0x000c: 'GPSSpeedRef',
    0x000d: 'GPSSpeed',
    0x000e: 'GPSTrackRef',
    0x000f: 'GPSTrack',
    0x0010: 'GPSImgDirectionRef',
    0x0011: 'GPSImgDirection',
    0x0012: 'GPSMapDatum',
    0x001d: 'GPSDateStamp',
    0x001e: 'GPSDifferential',
    0x001f: 'GPSHPositioningError'
};

const TIFF_TYPES = {
    1: { size: 1, name: 'BYTE' },
    2: { size: 1, name: 'ASCII' },
    3: { size: 2, name: 'SHORT' },
    4: { size: 4, name: 'LONG' },
    5: { size: 8, name: 'RATIONAL' },
    6: { size: 1, name: 'SBYTE' },
    7: { size: 1, name: 'UNDEFINED' },
    8: { size: 2, name: 'SSHORT' },
    9: { size: 4, name: 'SLONG' },
    10: { size: 8, name: 'SRATIONAL' },
    11: { size: 4, name: 'FLOAT' },
    12: { size: 8, name: 'DOUBLE' }
};

function readImageMetadata(filePath) {

    const buffer = fs.readFileSync(filePath);

    if (
        buffer.length >= 3 &&
        buffer[0] === 0xff &&
        buffer[1] === 0xd8 &&
        buffer[2] === 0xff
    ) {
        return readJpegMetadata(buffer);
    }

    if (
        buffer.length >= 8 &&
        buffer.subarray(0, 8).equals(
            Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
        )
    ) {
        return readPngMetadata(buffer);
    }

    throw new Error('Unsupported image format');
}

function readJpegMetadata(buffer) {
    const metadata = {
        format: 'JPEG',
        exif: {},
        gps: {},
        xmp: {},
        iptc: {},
        jfif: {},
        comments: [],
        app: {}
    };

    let offset = 2;

    while (offset + 4 <= buffer.length) {
        if (buffer[offset] !== 0xff) {
            offset++;
            continue;
        }

        while (
            offset < buffer.length &&
            buffer[offset] === 0xff
            ) {
            offset++;
        }

        if (offset >= buffer.length) {
            break;
        }

        const marker = buffer[offset++];

        if (marker === 0xd9 || marker === 0xda) {
            break;
        }

        if (marker >= 0xd0 && marker <= 0xd9) {
            continue;
        }

        if (offset + 2 > buffer.length) {
            break;
        }

        const length = buffer.readUInt16BE(offset);

        if (length < 2 || offset + length > buffer.length) {
            break;
        }

        const dataStart = offset + 2;
        const dataEnd = offset + length;
        const data = buffer.subarray(dataStart, dataEnd);

        if (marker === 0xe0) {
            readJfif(data, metadata);
        } else if (marker === 0xe1) {
            if (data.subarray(0, 6).toString('ascii') === 'Exif\0\0') {
                const exifData = data.subarray(6);
                readExif(exifData, metadata);
            } else if (
                data.subarray(0, 29).toString('ascii') ===
                'http://ns.adobe.com/xap/1.0/\0'
            ) {
                const xmp = data.subarray(29).toString('utf8');
                metadata.xmp = parseXmp(xmp);
            }
        } else if (marker === 0xed) {
            readIptc(data, metadata);
        } else if (marker === 0xfe) {
            metadata.comments.push(
                data.toString('utf8').replace(/\0/g, '')
            );
        } else if (marker >= 0xe0 && marker <= 0xef) {
            metadata.app[`APP${marker - 0xe0}`] = data.toString(
                'latin1'
            );
        }

        offset = dataEnd;
    }

    return metadata;
}

function readJfif(data, metadata) {
    if (data.length < 14) {
        return;
    }

    if (data.subarray(0, 5).toString('ascii') !== 'JFIF\0') {
        return;
    }

    metadata.jfif = {
        version: `${data[5]}.${data[6]}`,
        units: data[7],
        xDensity: data.readUInt16BE(8),
        yDensity: data.readUInt16BE(10),
        xThumbnail: data[12],
        yThumbnail: data[13]
    };
}

function readExif(data, metadata) {
    if (data.length < 8) {
        return;
    }

    const littleEndian = data.toString('ascii', 0, 2) === 'II';

    if (
        !littleEndian &&
        data.toString('ascii', 0, 2) !== 'MM'
    ) {
        return;
    }

    const readUInt16 = (offset) =>
        littleEndian
            ? data.readUInt16LE(offset)
            : data.readUInt16BE(offset);

    const readUInt32 = (offset) =>
        littleEndian
            ? data.readUInt32LE(offset)
            : data.readUInt32BE(offset);

    const readInt16 = (offset) =>
        littleEndian
            ? data.readInt16LE(offset)
            : data.readInt16BE(offset);

    const readInt32 = (offset) =>
        littleEndian
            ? data.readInt32LE(offset)
            : data.readInt32BE(offset);

    if (readUInt16(2) !== 42) {
        return;
    }

    const firstIfd = readUInt32(4);

    const context = {
        data,
        littleEndian,
        readUInt16,
        readUInt32,
        readInt16,
        readInt32,
        visited: new Set()
    };

    readIfd(
        context,
        firstIfd,
        metadata.exif,
        false,
        metadata
    );
}

function readIfd(
    context,
    ifdOffset,
    output,
    gps,
    metadata,
    depth = 0
) {
    if (
        depth > 10 ||
        !Number.isInteger(ifdOffset) ||
        ifdOffset < 0 ||
        ifdOffset + 2 > context.data.length ||
        context.visited.has(ifdOffset)
    ) {
        return;
    }

    context.visited.add(ifdOffset);

    const count = context.readUInt16(ifdOffset);

    let entryOffset = ifdOffset + 2;

    for (let i = 0; i < count; i++) {
        if (entryOffset + 12 > context.data.length) {
            break;
        }

        const tag = context.readUInt16(entryOffset);
        const type = context.readUInt16(entryOffset + 2);
        const countValue = context.readUInt32(entryOffset + 4);

        const typeInfo = TIFF_TYPES[type];

        if (!typeInfo) {
            entryOffset += 12;
            continue;
        }

        const totalSize = typeInfo.size * countValue;

        let valueOffset;

        if (totalSize <= 4) {
            valueOffset = entryOffset + 8;
        } else {
            if (entryOffset + 12 > context.data.length) {
                break;
            }

            valueOffset = context.littleEndian
                ? context.data.readUInt32LE(entryOffset + 8)
                : context.data.readUInt32BE(entryOffset + 8);
        }

        if (
            valueOffset < 0 ||
            valueOffset + totalSize > context.data.length
        ) {
            entryOffset += 12;
            continue;
        }

        let value = readTiffValue(
            context,
            type,
            countValue,
            valueOffset
        );

        const tagName = gps
            ? GPS_TAGS[tag] || `GPS_0x${tag.toString(16).padStart(4, '0')}`
            : EXIF_TAGS[tag] || `Tag_0x${tag.toString(16).padStart(4, '0')}`;

        if (
            tag === 0x8769 ||
            tag === 0xa005 ||
            tag === 0x8825
        ) {
            if (typeof value === 'number') {
                if (tag === 0x8825) {
                    readIfd(
                        context,
                        value,
                        metadata.gps,
                        true,
                        metadata,
                        depth + 1
                    );
                } else {
                    readIfd(
                        context,
                        value,
                        output,
                        false,
                        metadata,
                        depth + 1
                    );
                }
            }
        } else if (tag === 0x927c) {
            output[tagName] = {
                type: 'MakerNote',
                size: typeof value === 'object' && value !== null
                    ? value.size
                    : 0,
                data: typeof value === 'object' && value !== null
                    ? value.data
                    : null
            };
        } else {
            output[tagName] = value;
        }

        entryOffset += 12;
    }

    if (ifdOffset + 2 + count * 12 + 4 <= context.data.length) {
        const nextOffsetPosition =
            ifdOffset + 2 + count * 12;

        const nextOffset = context.littleEndian
            ? context.data.readUInt32LE(nextOffsetPosition)
            : context.data.readUInt32BE(nextOffsetPosition);

        if (nextOffset !== 0) {
            readIfd(
                context,
                nextOffset,
                output,
                gps,
                metadata,
                depth + 1
            );
        }
    }
}

function readTiffValue(context, type, count, offset) {

    const data = context.data;

    if (type === 1) {
        const values = [];

        for (let i = 0; i < count; i++) {
            values.push(data[offset + i]);
        }

        return count === 1 ? values[0] : values;
    }

    if (type === 2) {
        return data
            .subarray(offset, offset + count)
            .toString('ascii')
            .replace(/\0+$/, '');
    }

    if (type === 3) {
        const values = [];

        for (let i = 0; i < count; i++) {
            values.push(
                context.littleEndian
                    ? data.readUInt16LE(offset + i * 2)
                    : data.readUInt16BE(offset + i * 2)
            );
        }

        return count === 1 ? values[0] : values;
    }

    if (type === 4) {
        const values = [];

        for (let i = 0; i < count; i++) {
            values.push(
                context.littleEndian
                    ? data.readUInt32LE(offset + i * 4)
                    : data.readUInt32BE(offset + i * 4)
            );
        }

        return count === 1 ? values[0] : values;
    }

    if (type === 5 || type === 10) {

        const values = [];

        for (let i = 0; i < count; i++) {

            const position = offset + i * 8;

            const numerator =
                type === 5
                    ? (
                        context.littleEndian
                            ? data.readUInt32LE(position)
                            : data.readUInt32BE(position)
                    )
                    : (
                        context.littleEndian
                            ? data.readInt32LE(position)
                            : data.readInt32BE(position)
                    );

            const denominator =
                type === 5
                    ? (
                        context.littleEndian
                            ? data.readUInt32LE(position + 4)
                            : data.readUInt32BE(position + 4)
                    )
                    : (
                        context.littleEndian
                            ? data.readInt32LE(position + 4)
                            : data.readInt32BE(position + 4)
                    );

            values.push({
                numerator,
                denominator,
                value: denominator === 0
                    ? null
                    : numerator / denominator
            });
        }

        return count === 1 ? values[0] : values;
    }

    if (type === 6) {

        const values = [];

        for (let i = 0; i < count; i++) {
            values.push(data.readInt8(offset + i));
        }

        return count === 1 ? values[0] : values;
    }

    if (type === 7) {

        return {
            type: 'UNDEFINED',
            size: count,
            data: data
                .subarray(offset, offset + count)
                .toString('base64')
        };
    }

    if (type === 8) {

        const values = [];

        for (let i = 0; i < count; i++) {
            values.push(
                context.littleEndian
                    ? data.readInt16LE(offset + i * 2)
                    : data.readInt16BE(offset + i * 2)
            );
        }

        return count === 1 ? values[0] : values;
    }

    if (type === 9) {

        const values = [];

        for (let i = 0; i < count; i++) {
            values.push(
                context.littleEndian
                    ? data.readInt32LE(offset + i * 4)
                    : data.readInt32BE(offset + i * 4)
            );
        }

        return count === 1 ? values[0] : values;
    }

    if (type === 11) {

        const values = [];

        for (let i = 0; i < count; i++) {
            values.push(
                context.littleEndian
                    ? data.readFloatLE(offset + i * 4)
                    : data.readFloatBE(offset + i * 4)
            );
        }

        return count === 1 ? values[0] : values;
    }

    if (type === 12) {

        const values = [];

        for (let i = 0; i < count; i++) {
            values.push(
                context.littleEndian
                    ? data.readDoubleLE(offset + i * 8)
                    : data.readDoubleBE(offset + i * 8)
            );
        }

        return count === 1 ? values[0] : values;
    }

    return null;
}

function readIptc(data, metadata) {
    const photoshop = Buffer.from('Photoshop 3.0\0', 'ascii');

    let offset = 0;

    if (data.subarray(0, photoshop.length).equals(photoshop)) {
        offset = photoshop.length;
    }

    while (offset + 5 <= data.length) {
        if (
            data[offset] !== 0x1c ||
            data[offset + 1] !== 0x02
        ) {
            offset++;
            continue;
        }

        const dataset = data[offset + 2];
        const size = data.readUInt16BE(offset + 3);

        if (offset + 5 + size > data.length) {
            break;
        }

        const value = data
            .subarray(offset + 5, offset + 5 + size)
            .toString('utf8')
            .replace(/\0/g, '');

        const names = {
            5: 'ObjectName',
            7: 'EditStatus',
            10: 'Urgency',
            15: 'Category',
            20: 'SupplementalCategory',
            25: 'Keywords',
            40: 'SpecialInstructions',
            55: 'DateCreated',
            60: 'TimeCreated',
            80: 'Byline',
            85: 'BylineTitle',
            90: 'City',
            95: 'ProvinceState',
            101: 'Country',
            103: 'OriginalTransmissionReference',
            105: 'Headline',
            110: 'Credit',
            115: 'Source',
            116: 'CopyrightNotice',
            120: 'Caption',
            122: 'WriterEditor'
        };

        const name =
            names[dataset] ||
            `IPTC_${dataset}`;

        if (metadata.iptc[name]) {
            if (!Array.isArray(metadata.iptc[name])) {
                metadata.iptc[name] = [
                    metadata.iptc[name]
                ];
            }

            metadata.iptc[name].push(value);
        } else {
            metadata.iptc[name] = value;
        }

        offset += 5 + size;
    }
}

function parseXmp(xml) {
    const result = {};
    const attributes = xml.match(
        /([A-Za-z_][\w:.-]*)\s*=\s*["']([^"']*)["']/g
    );

    if (attributes) {
        for (const attribute of attributes) {
            const match = attribute.match(
                /([A-Za-z_][\w:.-]*)\s*=\s*["']([^"']*)["']/
            );

            if (match) {
                result[match[1]] = match[2];
            }
        }
    }

    const elements = xml.match(
        /<([A-Za-z_][\w:.-]*)[^>]*>([\s\S]*?)<\/\1>/g
    );

    if (elements) {
        for (const element of elements) {
            const match = element.match(
                /<([A-Za-z_][\w:.-]*)[^>]*>([\s\S]*?)<\/\1>/
            );

            if (match) {
                const value = match[2]
                    .replace(/<[^>]+>/g, '')
                    .trim();

                if (value) {
                    result[match[1]] = value;
                }
            }
        }
    }

    return result;
}

function readPngMetadata(buffer) {
    const metadata = {
        format: 'PNG',
        chunks: [],
        text: {},
        exif: {},
        xmp: {},
        icc: null,
        image: {}
    };

    let offset = 8;

    while (offset + 12 <= buffer.length) {
        const length = buffer.readUInt32BE(offset);
        const type = buffer
            .subarray(offset + 4, offset + 8)
            .toString('ascii');

        const dataStart = offset + 8;
        const dataEnd = dataStart + length;

        if (
            dataEnd + 4 > buffer.length ||
            length > buffer.length
        ) {
            break;
        }

        const data = buffer.subarray(
            dataStart,
            dataEnd
        );

        metadata.chunks.push({
            type,
            size: length
        });

        if (type === 'IHDR') {
            if (data.length >= 13) {
                metadata.image = {
                    width: data.readUInt32BE(0),
                    height: data.readUInt32BE(4),
                    bitDepth: data[8],
                    colorType: data[9],
                    compression: data[10],
                    filter: data[11],
                    interlace: data[12]
                };
            }
        } else if (
            type === 'tEXt' ||
            type === 'zTXt' ||
            type === 'iTXt'
        ) {
            readPngText(type, data, metadata);
        } else if (type === 'eXIf') {
            readExif(data, metadata);
        } else if (type === 'iCCP') {
            metadata.icc = data
                .subarray(0, data.indexOf(0))
                .toString('latin1');
        } else if (type === 'pHYs') {
            if (data.length >= 9) {
                metadata.image.physicalPixelDimensions = {
                    pixelsPerUnitX: data.readUInt32BE(0),
                    pixelsPerUnitY: data.readUInt32BE(4),
                    unit: data[8]
                };
            }
        }

        offset = dataEnd + 4;

        if (type === 'IEND') {
            break;
        }
    }

    return metadata;
}

function readPngText(type, data, metadata) {
    if (type === 'tEXt') {
        const separator = data.indexOf(0);

        if (separator === -1) {
            return;
        }

        const keyword = data
            .subarray(0, separator)
            .toString('latin1');

        const value = data
            .subarray(separator + 1)
            .toString('latin1');

        metadata.text[keyword] = value;

        return;
    }

    if (type === 'iTXt') {
        let offset = 0;

        const keywordEnd = data.indexOf(0, offset);

        if (keywordEnd === -1) {
            return;
        }

        const keyword = data
            .subarray(offset, keywordEnd)
            .toString('utf8');

        offset = keywordEnd + 1;

        if (offset + 2 > data.length) {
            return;
        }

        const compressionFlag = data[offset++];
        const compressionMethod = data[offset++];

        const languageEnd = data.indexOf(0, offset);

        if (languageEnd === -1) {
            return;
        }

        offset = languageEnd + 1;

        const translatedEnd = data.indexOf(0, offset);

        if (translatedEnd === -1) {
            return;
        }

        offset = translatedEnd + 1;

        let value = data
            .subarray(offset)
            .toString('utf8');

        if (
            compressionFlag === 0 &&
            compressionMethod === 0
        ) {
            metadata.text[keyword] = value;

            if (
                keyword.toLowerCase().includes('xml') ||
                value.includes('<x:xmpmeta') ||
                value.includes('<rdf:RDF')
            ) {
                metadata.xmp = parseXmp(value);
            }
        }

        return;
    }

    if (type === 'zTXt') {
        const separator = data.indexOf(0);

        if (separator === -1 || separator + 2 > data.length) {
            return;
        }

        const keyword = data
            .subarray(0, separator)
            .toString('latin1');

        metadata.text[keyword] = {
            compressed: true,
            compressionMethod: data[separator + 1],
            data: data
                .subarray(separator + 2)
                .toString('base64')
        };
    }
}

module.exports = readImageMetadata;
