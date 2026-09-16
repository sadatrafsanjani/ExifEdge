'use strict';

const fs = require('fs');

/* =========================================================================
 * TAG TABLES
 * ========================================================================= */

const EXIF_TAGS = {
    0x0100: 'ImageWidth', 0x0101: 'ImageHeight', 0x0102: 'BitsPerSample',
    0x0103: 'Compression', 0x0106: 'PhotometricInterpretation',
    0x010e: 'ImageDescription', 0x010f: 'Make', 0x0110: 'Model',
    0x0111: 'StripOffsets', 0x0112: 'Orientation', 0x0115: 'SamplesPerPixel',
    0x0116: 'RowsPerStrip', 0x0117: 'StripByteCounts', 0x011a: 'XResolution',
    0x011b: 'YResolution', 0x011c: 'PlanarConfiguration', 0x0128: 'ResolutionUnit',
    0x012d: 'TransferFunction', 0x0131: 'Software', 0x0132: 'ModifyDate',
    0x013b: 'Artist', 0x013e: 'WhitePoint', 0x013f: 'PrimaryChromaticities',
    0x0201: 'JPEGInterchangeFormat', 0x0202: 'JPEGInterchangeFormatLength',
    0x0211: 'YCbCrCoefficients', 0x0213: 'YCbCrPositioning',
    0x8298: 'Copyright', 0x829a: 'ExposureTime', 0x829d: 'FNumber',
    0x8769: 'ExifIFDPointer', 0x8822: 'ExposureProgram', 0x8824: 'SpectralSensitivity',
    0x8825: 'GPSInfoIFDPointer', 0x8827: 'ISO', 0x8830: 'SensitivityType',
    0x8831: 'StandardOutputSensitivity', 0x9000: 'ExifVersion', 0x9003: 'DateTimeOriginal',
    0x9004: 'CreateDate', 0x9010: 'OffsetTime', 0x9011: 'OffsetTimeOriginal',
    0x9012: 'OffsetTimeDigitized', 0x9101: 'ComponentsConfiguration',
    0x9102: 'CompressedBitsPerPixel', 0x9201: 'ShutterSpeedValue', 0x9202: 'ApertureValue',
    0x9203: 'BrightnessValue', 0x9204: 'ExposureCompensation', 0x9205: 'MaxApertureValue',
    0x9206: 'SubjectDistance', 0x9207: 'MeteringMode', 0x9208: 'LightSource',
    0x9209: 'Flash', 0x920a: 'FocalLength', 0x927c: 'MakerNote', 0x9286: 'UserComment',
    0xa000: 'FlashpixVersion', 0xa001: 'ColorSpace', 0xa002: 'PixelXDimension',
    0xa003: 'PixelYDimension', 0xa004: 'RelatedSoundFile', 0xa005: 'InteroperabilityIFDPointer',
    0xa20e: 'FocalPlaneXResolution', 0xa20f: 'FocalPlaneYResolution',
    0xa210: 'FocalPlaneResolutionUnit', 0xa215: 'ExposureIndex', 0xa217: 'SensingMethod',
    0xa300: 'FileSource', 0xa301: 'SceneType', 0xa401: 'CustomRendered',
    0xa402: 'ExposureMode', 0xa403: 'WhiteBalance', 0xa404: 'DigitalZoomRatio',
    0xa405: 'FocalLengthIn35mmFormat', 0xa406: 'SceneCaptureType', 0xa407: 'GainControl',
    0xa408: 'Contrast', 0xa409: 'Saturation', 0xa40a: 'Sharpness',
    0xa40c: 'SubjectDistanceRange', 0xa420: 'ImageUniqueID', 0xa430: 'CameraOwnerName',
    0xa431: 'BodySerialNumber', 0xa432: 'LensSpecification', 0xa433: 'LensMake',
    0xa434: 'LensModel', 0xa435: 'LensSerialNumber'
};

const GPS_TAGS = {
    0x0000: 'GPSVersionID', 0x0001: 'GPSLatitudeRef', 0x0002: 'GPSLatitude',
    0x0003: 'GPSLongitudeRef', 0x0004: 'GPSLongitude', 0x0005: 'GPSAltitudeRef',
    0x0006: 'GPSAltitude', 0x0007: 'GPSTimeStamp', 0x0008: 'GPSSatellites',
    0x0009: 'GPSStatus', 0x000a: 'GPSMeasureMode', 0x000b: 'GPSDOP',
    0x000c: 'GPSSpeedRef', 0x000d: 'GPSSpeed', 0x000e: 'GPSTrackRef',
    0x000f: 'GPSTrack', 0x0010: 'GPSImgDirectionRef', 0x0011: 'GPSImgDirection',
    0x0012: 'GPSMapDatum', 0x001d: 'GPSDateStamp', 0x001e: 'GPSDifferential',
    0x001f: 'GPSHPositioningError'
};

const IPTC_TAGS = {
    5: 'ObjectName', 7: 'EditStatus', 10: 'Urgency', 15: 'Category',
    20: 'SupplementalCategory', 25: 'Keywords', 40: 'SpecialInstructions',
    55: 'DateCreated', 60: 'TimeCreated', 80: 'Byline', 85: 'BylineTitle',
    90: 'City', 95: 'ProvinceState', 101: 'Country', 103: 'OriginalTransmissionReference',
    105: 'Headline', 110: 'Credit', 115: 'Source', 116: 'CopyrightNotice',
    120: 'Caption', 122: 'WriterEditor'
};

const TIFF_TYPE_SIZES = { 1: 1, 2: 1, 3: 2, 4: 4, 5: 8, 6: 1, 7: 1, 8: 2, 9: 4, 10: 8, 11: 4, 12: 8 };

/* =========================================================================
 * ENTRY POINT
 * ========================================================================= */

function readImageMetadata(input) {
    const buffer = Buffer.isBuffer(input) ? input : fs.readFileSync(input);

    if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
        return readJpegMetadata(buffer);
    }

    if (buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) {
        return readPngMetadata(buffer);
    }

    throw new Error('Unsupported image format (expected JPEG or PNG)');
}

/* =========================================================================
 * JPEG
 * ========================================================================= */

function readJpegMetadata(buffer) {
    const metadata = {
        format: 'JPEG',
        exif: {},
        gps: {},
        thumbnail: null,
        xmp: {},
        iptc: {},
        jfif: {},
        comments: [],
        app: {},
        icc: null,
        c2pa: null,
        warnings: []
    };

    const iccSegments = []; // for multi-segment ICC profile (APP2) reassembly
    const app11Segments = []; // for multi-segment C2PA/JUMBF (APP11) reassembly
    let offset = 2;

    while (offset + 2 <= buffer.length) {
        // Find the next marker (0xFF followed by a non-zero, non-0xFF byte)
        if (buffer[offset] !== 0xff) {
            offset++;
            continue;
        }
        while (offset < buffer.length && buffer[offset] === 0xff) offset++;
        if (offset >= buffer.length) break;

        const marker = buffer[offset++];

        if (marker === 0xd9 || marker === 0xda) break;          // EOI / SOS -> stop (no more markers follow SOS)
        if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue; // TEM / RSTn: no payload

        if (offset + 2 > buffer.length) break;
        const length = buffer.readUInt16BE(offset);
        if (length < 2 || offset + length > buffer.length) {
            metadata.warnings.push(`Truncated/invalid segment at offset ${offset}`);
            break;
        }

        const dataStart = offset + 2;
        const dataEnd = offset + length;
        const data = buffer.subarray(dataStart, dataEnd);

        try {
            if (marker === 0xe0) {
                readJfif(data, metadata);
            } else if (marker === 0xe1) {
                if (data.subarray(0, 6).toString('ascii') === 'Exif\0\0') {
                    readExif(data.subarray(6), metadata);
                } else if (data.subarray(0, 29).toString('ascii') === 'http://ns.adobe.com/xap/1.0/\0') {
                    Object.assign(metadata.xmp, parseXmp(data.subarray(29).toString('utf8')));
                }
            } else if (marker === 0xe2) {
                if (data.subarray(0, 12).toString('ascii') === 'ICC_PROFILE\0') {
                    // byte 12 = sequence number, byte 13 = total segment count
                    iccSegments.push(data.subarray(14));
                }
            } else if (marker === 0xeb) {
                if (data.length >= 4 && data.toString('ascii', 0, 2) === 'JP') {
                    app11Segments.push(Buffer.from(data)); // copy: `data` is a view into `buffer`
                }
            } else if (marker === 0xed) {
                readIptc(data, metadata);
            } else if (marker === 0xfe) {
                metadata.comments.push(data.toString('utf8').replace(/\0+$/, ''));
            } else if (marker >= 0xe0 && marker <= 0xef) {
                // Unrecognized APPn: keep as base64 so binary payloads survive JSON-safely
                metadata.app[`APP${marker - 0xe0}`] = data.toString('base64');
            }
        } catch (err) {
            metadata.warnings.push(`Failed to parse segment 0x${marker.toString(16)}: ${err.message}`);
        }

        offset = dataEnd;
    }

    if (iccSegments.length) {
        metadata.icc = Buffer.concat(iccSegments).toString('base64');
    }

    if (app11Segments.length) {
        metadata.c2pa = extractC2pa(app11Segments, null);
    }

    return metadata;
}

function readJfif(data, metadata) {
    if (data.length < 14 || data.subarray(0, 5).toString('ascii') !== 'JFIF\0') return;
    metadata.jfif = {
        version: `${data[5]}.${data[6]}`,
        units: data[7],
        xDensity: data.readUInt16BE(8),
        yDensity: data.readUInt16BE(10),
        xThumbnail: data[12],
        yThumbnail: data[13]
    };
}

/* =========================================================================
 * EXIF / TIFF (shared by JPEG APP1 and PNG eXIf)
 * ========================================================================= */

function readExif(data, metadata) {
    if (data.length < 8) return;

    const littleEndian = data.toString('ascii', 0, 2) === 'II';
    if (!littleEndian && data.toString('ascii', 0, 2) !== 'MM') return;

    const ctx = {
        data,
        littleEndian,
        visited: new Set(),
        readUInt16: (o) => (littleEndian ? data.readUInt16LE(o) : data.readUInt16BE(o)),
        readUInt32: (o) => (littleEndian ? data.readUInt32LE(o) : data.readUInt32BE(o))
    };

    if (ctx.readUInt16(2) !== 42) return;

    const firstIfd = ctx.readUInt32(4);

    // IFD0 (+ Exif/GPS sub-IFDs) merges into metadata.exif / metadata.gps.
    // A second chained IFD (IFD1) is a THUMBNAIL IFD and is kept separate
    // so its tags (e.g. its own ImageWidth/Compression) don't collide with
    // and silently overwrite the main image's tags.
    const nextIfdOffset = readIfd(ctx, firstIfd, metadata.exif, 'main', metadata, 0);

    if (nextIfdOffset) {
        const thumbTags = {};
        readIfd(ctx, nextIfdOffset, thumbTags, 'main', metadata, 1);
        metadata.thumbnail = thumbTags;

        const off = thumbTags.JPEGInterchangeFormat;
        const len = thumbTags.JPEGInterchangeFormatLength;
        if (typeof off === 'number' && typeof len === 'number' && off + len <= data.length) {
            metadata.thumbnail.dataBase64 = data.subarray(off, off + len).toString('base64');
        }
    }

    if (Object.keys(metadata.gps).length) {
        metadata.gps.decimal = gpsToDecimal(metadata.gps); // { latitude, longitude } | null
    }
}

// Returns the "next IFD" offset (0 if none) so callers can decide whether/how to follow it.
function readIfd(ctx, ifdOffset, output, kind, metadata, depth) {
    if (
        depth > 10 || !Number.isInteger(ifdOffset) || ifdOffset < 0 ||
        ifdOffset + 2 > ctx.data.length || ctx.visited.has(ifdOffset)
    ) {
        return 0;
    }
    ctx.visited.add(ifdOffset);

    const count = ctx.readUInt16(ifdOffset);
    let entryOffset = ifdOffset + 2;

    for (let i = 0; i < count; i++, entryOffset += 12) {
        if (entryOffset + 12 > ctx.data.length) break;

        const tag = ctx.readUInt16(entryOffset);
        const type = ctx.readUInt16(entryOffset + 2);
        const count32 = ctx.readUInt32(entryOffset + 4);
        const typeSize = TIFF_TYPE_SIZES[type];
        if (!typeSize) continue;

        const totalSize = typeSize * count32;
        let valueOffset;
        if (totalSize <= 4) {
            valueOffset = entryOffset + 8;
        } else {
            valueOffset = ctx.littleEndian ? ctx.data.readUInt32LE(entryOffset + 8) : ctx.data.readUInt32BE(entryOffset + 8);
        }
        if (valueOffset < 0 || valueOffset + totalSize > ctx.data.length) continue;

        const value = readTiffValue(ctx, type, count32, valueOffset);
        const isGps = kind === 'gps';
        const tagName = isGps
            ? (GPS_TAGS[tag] || `GPS_0x${tag.toString(16).padStart(4, '0')}`)
            : (EXIF_TAGS[tag] || `Tag_0x${tag.toString(16).padStart(4, '0')}`);

        if (!isGps && (tag === 0x8769 || tag === 0xa005) && typeof value === 'number') {
            readIfd(ctx, value, output, kind, metadata, depth + 1); // Exif / Interop sub-IFD -> merge into same output
        } else if (!isGps && tag === 0x8825 && typeof value === 'number') {
            readIfd(ctx, value, metadata.gps, 'gps', metadata, depth + 1); // GPS sub-IFD -> separate object
        } else if (tag === 0x927c) {
            output[tagName] = { type: 'MakerNote', size: value && value.size, dataBase64: value && value.data };
        } else {
            output[tagName] = value;
        }
    }

    const nextOffsetPos = ifdOffset + 2 + count * 12;
    if (nextOffsetPos + 4 > ctx.data.length) return 0;
    return ctx.littleEndian ? ctx.data.readUInt32LE(nextOffsetPos) : ctx.data.readUInt32BE(nextOffsetPos);
}

function readTiffValue(ctx, type, count, offset) {
    const data = ctx.data;
    const le = ctx.littleEndian;

    switch (type) {
        case 1: { // BYTE
            const v = []; for (let i = 0; i < count; i++) v.push(data[offset + i]);
            return count === 1 ? v[0] : v;
        }
        case 2: // ASCII
            return data.subarray(offset, offset + count).toString('ascii').replace(/\0+$/, '');
        case 3: { // SHORT
            const v = []; for (let i = 0; i < count; i++) v.push(le ? data.readUInt16LE(offset + i * 2) : data.readUInt16BE(offset + i * 2));
            return count === 1 ? v[0] : v;
        }
        case 4: { // LONG
            const v = []; for (let i = 0; i < count; i++) v.push(le ? data.readUInt32LE(offset + i * 4) : data.readUInt32BE(offset + i * 4));
            return count === 1 ? v[0] : v;
        }
        case 5: case 10: { // RATIONAL / SRATIONAL
            const v = [];
            for (let i = 0; i < count; i++) {
                const p = offset + i * 8;
                const num = type === 5 ? (le ? data.readUInt32LE(p) : data.readUInt32BE(p)) : (le ? data.readInt32LE(p) : data.readInt32BE(p));
                const den = type === 5 ? (le ? data.readUInt32LE(p + 4) : data.readUInt32BE(p + 4)) : (le ? data.readInt32LE(p + 4) : data.readInt32BE(p + 4));
                v.push({ numerator: num, denominator: den, value: den === 0 ? null : num / den });
            }
            return count === 1 ? v[0] : v;
        }
        case 6: { // SBYTE
            const v = []; for (let i = 0; i < count; i++) v.push(data.readInt8(offset + i));
            return count === 1 ? v[0] : v;
        }
        case 7: // UNDEFINED
            return { type: 'UNDEFINED', size: count, data: data.subarray(offset, offset + count).toString('base64') };
        case 8: { // SSHORT
            const v = []; for (let i = 0; i < count; i++) v.push(le ? data.readInt16LE(offset + i * 2) : data.readInt16BE(offset + i * 2));
            return count === 1 ? v[0] : v;
        }
        case 9: { // SLONG
            const v = []; for (let i = 0; i < count; i++) v.push(le ? data.readInt32LE(offset + i * 4) : data.readInt32BE(offset + i * 4));
            return count === 1 ? v[0] : v;
        }
        case 11: { // FLOAT
            const v = []; for (let i = 0; i < count; i++) v.push(le ? data.readFloatLE(offset + i * 4) : data.readFloatBE(offset + i * 4));
            return count === 1 ? v[0] : v;
        }
        case 12: { // DOUBLE
            const v = []; for (let i = 0; i < count; i++) v.push(le ? data.readDoubleLE(offset + i * 8) : data.readDoubleBE(offset + i * 8));
            return count === 1 ? v[0] : v;
        }
        default:
            return null;
    }
}

/** Convert EXIF GPS {ref, dms:[deg,min,sec] rationals} into a signed decimal-degree number. */
function gpsToDecimal(gps) {
    if (!gps || !gps.GPSLatitude || !gps.GPSLongitude) return null;
    const toDeg = (dms) => {
        if (!Array.isArray(dms) || dms.length < 3) return null;
        const [d, m, s] = dms.map((r) => (r && typeof r.value === 'number' ? r.value : r));
        if ([d, m, s].some((n) => typeof n !== 'number' || Number.isNaN(n))) return null;
        return d + m / 60 + s / 3600;
    };
    let lat = toDeg(gps.GPSLatitude);
    let lon = toDeg(gps.GPSLongitude);
    if (lat === null || lon === null) return null;
    if (gps.GPSLatitudeRef === 'S') lat = -lat;
    if (gps.GPSLongitudeRef === 'W') lon = -lon;
    return { latitude: lat, longitude: lon };
}

/* =========================================================================
 * IPTC (embedded in JPEG APP13 "Photoshop 3.0" segment)
 * ========================================================================= */

function readIptc(data, metadata) {
    const photoshopHeader = Buffer.from('Photoshop 3.0\0', 'ascii');
    let offset = data.subarray(0, photoshopHeader.length).equals(photoshopHeader) ? photoshopHeader.length : 0;

    while (offset + 5 <= data.length) {
        if (data[offset] !== 0x1c || data[offset + 1] !== 0x02) { offset++; continue; }

        const dataset = data[offset + 2];
        const size = data.readUInt16BE(offset + 3);
        if (offset + 5 + size > data.length) break;

        const value = data.subarray(offset + 5, offset + 5 + size).toString('utf8').replace(/\0/g, '');
        const name = IPTC_TAGS[dataset] || `IPTC_${dataset}`;

        if (metadata.iptc[name] !== undefined) {
            if (!Array.isArray(metadata.iptc[name])) metadata.iptc[name] = [metadata.iptc[name]];
            metadata.iptc[name].push(value);
        } else {
            metadata.iptc[name] = value;
        }

        offset += 5 + size;
    }
}

/* =========================================================================
 * XMP (RDF/XML) — purpose-built mini parser, not a full XML parser.
 * Extracts: attributes on <rdf:Description>, leaf (non-nested) child
 * elements, and rdf:Bag/Seq/Alt list items (grouped by their parent tag).
 * ========================================================================= */

function parseXmp(xml) {
    const result = {};

    // 1. Attributes on rdf:Description tags (the common "compact" XMP form)
    for (const descMatch of xml.matchAll(/<rdf:Description\b([^>]*?)\/?>/gi)) {
        const attrs = descMatch[1];
        for (const attrMatch of attrs.matchAll(/([A-Za-z_][\w:.-]*)\s*=\s*"([^"]*)"/g)) {
            const [, key, value] = attrMatch;
            if (key.startsWith('xmlns:') || key === 'rdf:about') continue;
            result[key] = decodeXmlEntities(value);
        }
    }

    // 2. rdf:Bag / rdf:Seq / rdf:Alt list items, grouped under their parent property
    for (const listMatch of xml.matchAll(/<([\w:.-]+)>\s*<rdf:(?:Bag|Seq|Alt)>([\s\S]*?)<\/rdf:(?:Bag|Seq|Alt)>\s*<\/\1>/g)) {
        const [, prop, inner] = listMatch;
        const items = [...inner.matchAll(/<rdf:li\b[^>]*>([\s\S]*?)<\/rdf:li>/g)].map((m) => decodeXmlEntities(stripTags(m[1]).trim()));
        if (items.length) result[prop] = items.length === 1 ? items[0] : items;
    }

    // 3. Leaf element-form properties: <ns:Prop>value</ns:Prop> with NO nested tags.
    //    (Deliberately excludes elements containing '<', so wrapper/container
    //    elements like <x:xmpmeta> or <rdf:Description> never get treated as
    //    a single flattened value — only real leaf text values are captured.)
    for (const elMatch of xml.matchAll(/<([A-Za-z_][\w:.-]*)(?:\s[^>]*)?>([^<]+)<\/\1>/g)) {
        const [, key, value] = elMatch;
        if (key.startsWith('rdf:') || key === 'x:xmpmeta') continue;
        const trimmed = value.trim();
        if (trimmed) result[key] = decodeXmlEntities(trimmed);
    }

    return result;
}

function stripTags(str) {
    return str.replace(/<[^>]+>/g, ' ');
}

function decodeXmlEntities(str) {
    return str
        .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"').replace(/&apos;/g, "'")
        .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
        .replace(/&amp;/g, '&');
}

/* =========================================================================
 * C2PA / JUMBF (JPEG Universal Metadata Box Format) — embedded in JPEG via
 * APP11 markers, or in PNG via a "caBX" chunk. This is the modern,
 * cryptographically-structured "Content Credentials" provenance format,
 * and is by far the strongest available signal for AI-generation detection
 * when present (it's what ships in Grok Imagine, Adobe Firefly, DALL-E 3,
 * Bing Image Creator, etc. output).
 *
 * The box-format details below (APP11 segment header layout, JUMD toggle
 * bits, box length conventions) are reverse-engineered directly from
 * exiftool's source (ExifTool.pm's APP11 handler and Jpeg2000.pm's
 * ProcessJUMB/ProcessJUMD), since that's the most authoritative real-world
 * reference for this format. We do NOT verify the COSE/X.509 signature
 * chain — only the declared (unverified) assertions are reported.
 * ========================================================================= */

// ---- Minimal CBOR decoder (major types 0-7; RFC 8949) ----
function decodeCbor(buf) {
    function readLength(ai, o) {
        if (ai < 24) return [ai, o];
        if (ai === 24) return [buf.readUInt8(o), o + 1];
        if (ai === 25) return [buf.readUInt16BE(o), o + 2];
        if (ai === 26) return [buf.readUInt32BE(o), o + 4];
        if (ai === 27) return [Number(buf.readBigUInt64BE(o)), o + 8];
        return [-1, o]; // ai === 31: indefinite length, handled by caller
    }
    function decode(o) {
        const first = buf[o]; o++;
        const major = first >> 5;
        const ai = first & 0x1f;

        if (major === 7) {
            if (ai === 20) return [false, o];
            if (ai === 21) return [true, o];
            if (ai === 22 || ai === 23) return [null, o];
            if (ai === 25) return [null, o + 2]; // half-float: rare in practice, not decoded
            if (ai === 26) return [buf.readFloatBE(o), o + 4];
            if (ai === 27) return [buf.readDoubleBE(o), o + 8];
            if (ai < 20) return [ai, o];
            throw new Error(`Unsupported CBOR simple value ai=${ai}`);
        }

        if (ai === 31) { // indefinite-length collections, terminated by 0xff
            if (major === 2 || major === 3) {
                const parts = []; let cur = o;
                while (buf[cur] !== 0xff) { const [v, n] = decode(cur); parts.push(v); cur = n; }
                return [major === 2 ? Buffer.concat(parts) : parts.join(''), cur + 1];
            }
            if (major === 4) {
                const arr = []; let cur = o;
                while (buf[cur] !== 0xff) { const [v, n] = decode(cur); arr.push(v); cur = n; }
                return [arr, cur + 1];
            }
            if (major === 5) {
                const map = {}; let cur = o;
                while (buf[cur] !== 0xff) { const [k, n1] = decode(cur); const [v, n2] = decode(n1); map[k] = v; cur = n2; }
                return [map, cur + 1];
            }
        }

        const [len, no] = readLength(ai, o);
        if (major === 0) return [len, no];
        if (major === 1) return [-1 - len, no];
        if (major === 2) return [buf.subarray(no, no + len), no + len];
        if (major === 3) return [buf.subarray(no, no + len).toString('utf8'), no + len];
        if (major === 4) {
            let cur = no; const arr = [];
            for (let i = 0; i < len; i++) { const [v, n] = decode(cur); arr.push(v); cur = n; }
            return [arr, cur];
        }
        if (major === 5) {
            let cur = no; const map = {};
            for (let i = 0; i < len; i++) { const [k, n1] = decode(cur); const [v, n2] = decode(n1); map[k] = v; cur = n2; }
            return [map, cur];
        }
        if (major === 6) return decode(no); // tag: skip tag number (e.g. 18 = COSE_Sign1), decode inner value
        throw new Error(`Unsupported CBOR major type ${major}`);
    }
    return decode(0)[0];
}

// ---- Generic JUMBF box walker (ISO/IEC 19566-5), used for both JPEG APP11
//      payloads and PNG "caBX" chunks. Mirrors exiftool's ProcessJpeg2000Box. ----
function parseJumbfBox(buf, offset) {
    if (offset + 8 > buf.length) return null;

    let boxLen = buf.readUInt32BE(offset);
    const type = buf.subarray(offset + 4, offset + 8).toString('ascii');
    let headerLen = 8;

    if (boxLen === 1) { // extended 64-bit length follows
        if (offset + 16 > buf.length) return null;
        const hi = buf.readUInt32BE(offset + 8);
        const lo = buf.readUInt32BE(offset + 12);
        if (hi !== 0) return null; // > 4GB, not realistic here
        boxLen = lo;
        headerLen = 16;
    } else if (boxLen === 0) {
        boxLen = buf.length - offset; // extends to end of parent
    }

    if (boxLen < headerLen) return null;

    const declaredEnd = offset + boxLen;
    const availableEnd = Math.min(declaredEnd, buf.length);
    const truncated = declaredEnd > buf.length;
    const content = buf.subarray(offset + headerLen, availableEnd);
    const nextOffset = declaredEnd; // even if truncated, advance as declared so siblings after a still-available run can be attempted

    if (type === 'jumb') {
        const node = { kind: 'superbox', label: null, children: [] };
        if (truncated) node.truncated = true;
        let o = 0, first = true;
        while (o < content.length) {
            const child = parseJumbfBox(content, o);
            if (!child) break;
            if (first && child.node.kind === 'description') node.label = child.node.label;
            else if (child.node.kind !== 'description') node.children.push(child.node);
            first = false;
            o = child.nextOffset;
        }
        return { node, nextOffset };
    }

    if (type === 'jumd') {
        // Per exiftool's ProcessJUMD: 16-byte content-type UUID, 1-byte toggle
        // flags (bit0=Requestable, bit1=Label, bit2=ID[4B], bit3=Signature[32B]).
        if (content.length < 17) return { node: { kind: 'description', label: null }, nextOffset };
        const flags = content[16];
        let label = null;
        if (flags & 0x02) {
            const nul = content.indexOf(0, 17);
            if (nul !== -1) label = content.subarray(17, nul).toString('utf8');
        }
        return { node: { kind: 'description', label }, nextOffset };
    }

    const node = { kind: 'content', boxType: type };
    if (truncated) node.truncated = true;
    if (type === 'cbor') {
        try { node.data = decodeCbor(content); } catch (err) { node.decodeError = err.message; }
    } else if (type === 'json') {
        try { node.data = JSON.parse(content.toString('utf8')); } catch (err) { node.decodeError = err.message; }
    }
    return { node, nextOffset };
}

// Reassemble APP11 JUMBF segments per exiftool's algorithm (ExifTool.pm ~line 8289):
// each physical APP11 segment is prefixed with CI("JP"+2B) + seq(4B BE) + the
// inner box's own len(4B)+type(4B) header, repeated on every segment of the
// same box instance; segments are grouped by `type` and ordered by `seq`.
function reassembleJumbfSegments(segments) {
    const chunksByType = new Map(); // type -> { headerBytes, targetLen, chunks: Map<seq, Buffer> }
    const completed = [];

    for (const seg of segments) {
        if (seg.length < 16 || seg.toString('ascii', 0, 2) !== 'JP') continue;

        let len = seg.readUInt32BE(8);
        let type = seg.subarray(12, 16).toString('ascii');
        const seq = seg.readUInt32BE(4);

        // Known Microsoft encoder bug: len/type written little-endian (type reads "bmuj")
        if (type === 'bmuj') {
            type = 'jumb';
            len = seg.readUInt32LE(8);
        }

        let headerLen = 8;
        if (len === 1 && seg.length >= 24) {
            headerLen = 16; // extended 64-bit length present
        }
        if (len < headerLen) continue;

        if (!chunksByType.has(type)) {
            chunksByType.set(type, { headerBytes: seg.subarray(8, 8 + headerLen), targetLen: len, chunks: new Map() });
        }
        const entry = chunksByType.get(type);
        entry.chunks.set(seq, seg.subarray(8 + headerLen));

        // Completeness check: total bytes collected (header + all present chunks)
        // equals the declared length, AND there's no gap in [1..maxSeq] (index 0
        // may legitimately be absent if a producer numbers its sequence from 1).
        const maxSeq = Math.max(...entry.chunks.keys());
        let gapFound = false;
        for (let i = 1; i <= maxSeq; i++) { if (!entry.chunks.has(i)) { gapFound = true; break; } }
        let size = entry.headerBytes.length;
        for (const buf of entry.chunks.values()) size += buf.length;

        if (!gapFound && size === entry.targetLen) {
            const ordered = [];
            for (let i = 0; i <= maxSeq; i++) { const c = entry.chunks.get(i); if (c) ordered.push(c); }
            completed.push({ type, buffer: Buffer.concat([entry.headerBytes, ...ordered]), truncated: false });
            chunksByType.delete(type);
        }
    }

    // Anything still incomplete after the last segment (file truncated mid-box,
    // a corrupted encoder, or a missing continuation segment) is still worth
    // extracting best-effort rather than discarding: parseJumbfBox already
    // clamps a box's declared length to whatever bytes are actually available.
    for (const [type, entry] of chunksByType) {
        if (!entry.chunks.size) continue;
        const maxSeq = Math.max(...entry.chunks.keys());
        const ordered = [];
        for (let i = 0; i <= maxSeq; i++) { const c = entry.chunks.get(i); if (c) ordered.push(c); }
        completed.push({ type, buffer: Buffer.concat([entry.headerBytes, ...ordered]), truncated: true });
    }

    return completed;
}

// Flatten a parsed JUMBF tree into { manifests: [...] } keyed by C2PA manifest.
function flattenC2paTree(node, labelPath, manifests, currentManifest) {
    const path = node.label ? [...labelPath, node.label] : labelPath;

    if (node.kind === 'superbox') {
        // A direct child of the store box whose label looks like a manifest URN
        // starts a new manifest. (C2PA manifest labels are "urn:c2pa:..." or
        // "urn:uuid:...".)
        let manifest = currentManifest;
        if (node.label && /^urn:/i.test(node.label) && labelPath.length <= 1) {
            manifest = { label: node.label, assertions: {}, claim: null };
            manifests.push(manifest);
        }
        for (const child of node.children) flattenC2paTree(child, path, manifests, manifest);
    } else if (node.kind === 'content' && node.boxType === 'cbor' && node.data && currentManifest) {
        const leafLabel = path[path.length - 1] || 'unknown';
        if (leafLabel === 'c2pa.claim' || leafLabel === 'c2pa.claim.v2') {
            currentManifest.claim = node.data;
        } else {
            currentManifest.assertions[leafLabel] = node.data;
        }
    }
}

/** Extract and decode all C2PA JUMBF manifests from JPEG APP11 segments / a PNG caBX chunk. */
function extractC2pa(app11Segments, pngC2paChunk) {
    const jumbfStreams = [];
    let anyTruncated = false;

    if (app11Segments && app11Segments.length) {
        for (const entry of reassembleJumbfSegments(app11Segments)) {
            jumbfStreams.push(entry.buffer);
            if (entry.truncated) anyTruncated = true;
        }
    }
    if (pngC2paChunk) jumbfStreams.push(pngC2paChunk); // PNG caBX holds the raw JUMBF box directly, no APP11 framing

    const manifests = [];
    for (const stream of jumbfStreams) {
        let o = 0;
        while (o < stream.length) {
            const r = parseJumbfBox(stream, o);
            if (!r) break;
            if (r.node.truncated) anyTruncated = true;
            flattenC2paTree(r.node, [], manifests, null);
            o = r.nextOffset;
        }
    }
    if (!manifests.length) return null;
    const result = { manifests };
    if (anyTruncated) result.truncated = true; // some box(es) were cut off; extracted data may be incomplete
    return result;
}

/* =========================================================================
 * PNG
 * ========================================================================= */

function readPngMetadata(buffer) {
    const metadata = {
        format: 'PNG',
        chunks: [],
        text: {},
        exif: {},
        gps: {},
        xmp: {},
        icc: null,
        image: {},
        c2pa: null,
        warnings: []
    };

    let offset = 8;

    while (offset + 12 <= buffer.length) {
        const length = buffer.readUInt32BE(offset);
        const type = buffer.subarray(offset + 4, offset + 8).toString('ascii');
        const dataStart = offset + 8;
        const dataEnd = dataStart + length;

        if (length > buffer.length || dataEnd + 4 > buffer.length) {
            metadata.warnings.push(`Truncated/invalid PNG chunk '${type}' at offset ${offset}`);
            break;
        }

        const data = buffer.subarray(dataStart, dataEnd);
        metadata.chunks.push({ type, size: length });

        try {
            if (type === 'IHDR' && data.length >= 13) {
                metadata.image = {
                    width: data.readUInt32BE(0), height: data.readUInt32BE(4),
                    bitDepth: data[8], colorType: data[9],
                    compression: data[10], filter: data[11], interlace: data[12]
                };
            } else if (type === 'tEXt' || type === 'zTXt' || type === 'iTXt') {
                readPngText(type, data, metadata);
            } else if (type === 'eXIf') {
                readExif(data, metadata);
            } else if (type === 'iCCP') {
                const nul = data.indexOf(0);
                metadata.icc = { name: data.subarray(0, nul).toString('latin1'), compressed: true };
            } else if (type === 'pHYs' && data.length >= 9) {
                metadata.image.physicalPixelDimensions = {
                    pixelsPerUnitX: data.readUInt32BE(0), pixelsPerUnitY: data.readUInt32BE(4), unit: data[8]
                };
            } else if (type === 'caBX') {
                // PNG C2PA embedding: the raw JUMBF box stream, no APP11-style framing
                metadata.c2pa = extractC2pa(null, data);
            } else if (type === 'tIME' && data.length >= 7) {
                metadata.image.lastModified = {
                    year: data.readUInt16BE(0), month: data[2], day: data[3],
                    hour: data[4], minute: data[5], second: data[6]
                };
            }
        } catch (err) {
            metadata.warnings.push(`Failed to parse chunk '${type}': ${err.message}`);
        }

        offset = dataEnd + 4;
        if (type === 'IEND') break;
    }

    return metadata;
}

function readPngText(type, data, metadata) {
    if (type === 'tEXt') {
        const sep = data.indexOf(0);
        if (sep === -1) return;
        metadata.text[data.subarray(0, sep).toString('latin1')] = data.subarray(sep + 1).toString('latin1');
        return;
    }

    if (type === 'iTXt') {
        let o = 0;
        const keywordEnd = data.indexOf(0, o);
        if (keywordEnd === -1) return;
        const keyword = data.subarray(o, keywordEnd).toString('utf8');
        o = keywordEnd + 1;
        if (o + 2 > data.length) return;

        const compressionFlag = data[o++];
        const compressionMethod = data[o++];

        const languageEnd = data.indexOf(0, o);
        if (languageEnd === -1) return;
        o = languageEnd + 1;

        const translatedEnd = data.indexOf(0, o);
        if (translatedEnd === -1) return;
        o = translatedEnd + 1;

        if (compressionFlag !== 0 || compressionMethod !== 0) {
            metadata.text[keyword] = { compressed: true, note: 'zlib-compressed iTXt not decoded' };
            return;
        }

        const value = data.subarray(o).toString('utf8');
        metadata.text[keyword] = value;

        if (keyword.toLowerCase().includes('xml') || value.includes('<x:xmpmeta') || value.includes('<rdf:RDF')) {
            Object.assign(metadata.xmp, parseXmp(value));
        }
        return;
    }

    if (type === 'zTXt') {
        const sep = data.indexOf(0);
        if (sep === -1 || sep + 2 > data.length) return;
        const keyword = data.subarray(0, sep).toString('latin1');
        try {
            const zlib = require('zlib');
            const decompressed = zlib.inflateSync(data.subarray(sep + 2)).toString('latin1');
            metadata.text[keyword] = decompressed;
        } catch {
            metadata.text[keyword] = { compressed: true, dataBase64: data.subarray(sep + 2).toString('base64') };
        }
    }
}

/* =========================================================================
 * AI-GENERATION DETECTION (metadata-based heuristics)
 *
 * IMPORTANT CAVEATS (read before trusting the output):
 *  - This can only detect AI generation when the file's metadata says so,
 *    either because a tool voluntarily tags its output (most AI image
 *    generators / editors do, and the C2PA/IPTC "DigitalSourceType" field
 *    is becoming a real standard for this) OR because the file was never
 *    stripped of that metadata.
 *  - Metadata is trivially removed or forged (screenshotting an AI image,
 *    "Save As", most social platforms re-encoding uploads, or simply
 *    running `exiftool -all=`). So: a positive match is fairly reliable
 *    signal; a NEGATIVE result (no signature found) does NOT mean the
 *    image is real/human-made — it only means no known AI marker survived.
 *  - This is not a pixel-level / model-based AI-image detector. For that
 *    you'd need a classifier that looks at the actual image content.
 * ========================================================================= */

const AI_TOOL_SIGNATURES = [
    'midjourney', 'dall-e', 'dall·e', 'dalle', 'openai',
    'stable diffusion', 'stability.ai', 'stablediffusion',
    'automatic1111', 'comfyui', 'invokeai', 'sdxl', 'sd-webui',
    'adobe firefly', 'firefly generative',
    'leonardo.ai', 'leonardo ai', 'nightcafe', 'playground ai', 'playground.ai',
    'ideogram', 'runwayml', 'runway ml', 'craiyon',
    'bing image creator', 'microsoft designer', 'copilot designer',
    'google imagefx', 'imagen', 'gemini generated', 'grok imagine',
    'flux.1', 'flux dev', 'flux schnell', 'black forest labs',
    'canva magic media', 'kandinsky', 'deepai', 'artbreeder', 'wombo dream',
    'recraft', 'ai generated', 'ai-generated', 'generative fill', 'generative ai'
];

// The IPTC/C2PA-standard field for provenance of the pixels.
// https://cv.iptc.org/newscodes/digitalsourcetype/
const AI_DIGITAL_SOURCE_TYPES = [
    'trainedalgorithmicmedia',       // wholly AI-generated
    'compositewithtrainedalgorithmicmedia', // AI content composited with other material
    'algorithmicmedia'
];

function matchesAiSignature(str) {
    if (!str || typeof str !== 'string') return null;
    const lower = str.toLowerCase();
    return AI_TOOL_SIGNATURES.find((sig) => lower.includes(sig)) || null;
}

/**
 * Returns true/false: whether any known AI-generation signal was found in
 * the metadata (C2PA manifest, EXIF/XMP tool tags, or Stable-Diffusion-style
 * PNG text chunks). See analyzeAIGeneration() for the full breakdown (which
 * signal matched, confidence score, caveats) if you need more than a boolean.
 *
 * IMPORTANT: false does NOT mean "verified real/authentic" — it only means
 * no known AI marker survived in this file's metadata. Metadata is trivially
 * stripped (screenshots, re-saves, most social platforms re-encoding
 * uploads), so treat false as "no evidence found," not "proven human-made."
 */
function detectAIGenerated(metadata) {
    return analyzeAIGeneration(metadata).isAiGenerated;
}

function analyzeAIGeneration(metadata) {
    const reasons = [];
    let score = 0;

    const addReason = (text, weight) => {
        reasons.push(text);
        score += weight;
    };

    // --- 0. C2PA "Content Credentials" JUMBF manifest (JPEG APP11 / PNG caBX).
    //         The strongest possible signal: a structured, purpose-built
    //         provenance record. NOTE: we don't verify the COSE/X.509 signature
    //         chain, so this reports what the file *claims*, not a proven fact —
    //         the signature may be self-signed/untrusted (common in dev/local tools).
    if (metadata.c2pa && Array.isArray(metadata.c2pa.manifests)) {
        for (const manifest of metadata.c2pa.manifests) {
            const claimGenerator = manifest.claim && manifest.claim.claim_generator_info
                ? [].concat(manifest.claim.claim_generator_info).map((g) => g && g.name).filter(Boolean).join(', ')
                : null;

            const foundInManifest = new Set();
            const visit = (val) => {
                if (val == null) return;
                if (typeof val === 'string') {
                    const v = val.toLowerCase();
                    if (AI_DIGITAL_SOURCE_TYPES.some((t) => v.includes(t))) foundInManifest.add(`digitalSourceType=${val}`);
                    const match = matchesAiSignature(val);
                    if (match) foundInManifest.add(`mentions "${match}"`);
                } else if (Array.isArray(val)) {
                    val.forEach(visit);
                } else if (typeof val === 'object') {
                    Object.values(val).forEach(visit);
                }
            };
            visit(manifest.assertions);
            visit(claimGenerator);

            if (foundInManifest.size) {
                addReason(
                    `C2PA manifest "${manifest.label}"${claimGenerator ? ` (claim_generator: ${claimGenerator})` : ''} declares: ${[...foundInManifest].join('; ')} — unverified signature, but this is a structured provenance claim, not just a loose text tag`,
                    100
                );
            }
        }
    }

    // --- 1. XMP-embedded C2PA / IPTC DigitalSourceType (strongest text-metadata signal) ---
    const xmpEntries = Object.entries(metadata.xmp || {});
    for (const [key, value] of xmpEntries) {
        if (/digitalsourcetype/i.test(key) && typeof value === 'string') {
            const v = value.toLowerCase();
            if (AI_DIGITAL_SOURCE_TYPES.some((t) => v.includes(t))) {
                addReason(`XMP/IPTC DigitalSourceType declares this as algorithmically generated media (${value})`, 100);
            }
        }
    }

    // --- 2. EXIF fields that commonly carry the generating tool's name ---
    const exifFieldsToCheck = ['Software', 'Artist', 'ImageDescription', 'Copyright', 'UserComment', 'CameraOwnerName'];
    for (const field of exifFieldsToCheck) {
        const value = metadata.exif && metadata.exif[field];
        const str = typeof value === 'string' ? value : null;
        const match = matchesAiSignature(str);
        if (match) addReason(`EXIF field "${field}" mentions AI tool "${match}" (value: "${str}")`, 70);
    }

    // --- 3. XMP fields (CreatorTool, dc:creator, etc.) ---
    for (const [key, value] of xmpEntries) {
        const str = typeof value === 'string' ? value : Array.isArray(value) ? value.join(' ') : null;
        const match = matchesAiSignature(str);
        if (match) addReason(`XMP field "${key}" mentions AI tool "${match}" (value: "${str}")`, 70);
    }

    // --- 4. PNG tEXt/iTXt/zTXt keys & values — this is how most local Stable
    //         Diffusion UIs (AUTOMATIC1111, ComfyUI, InvokeAI, etc.) embed
    //         the full generation recipe (prompt/steps/sampler/seed/model).
    const knownGenerationKeys = ['parameters', 'prompt', 'workflow', 'negative_prompt', 'sd-metadata', 'dream'];
    for (const [key, rawValue] of Object.entries(metadata.text || {})) {
        const value = typeof rawValue === 'string' ? rawValue : '';
        if (knownGenerationKeys.includes(key.toLowerCase())) {
            addReason(`PNG text chunk "${key}" contains AI generation parameters (Stable-Diffusion-style tool)`, 90);
        }
        const match = matchesAiSignature(key) || matchesAiSignature(value);
        if (match) addReason(`PNG text chunk "${key}" mentions AI tool "${match}"`, 70);
    }

    // --- 5. Weak circumstantial signal: no camera info at all. Never enough
    //         on its own (screenshots, scans, vector exports, etc. also lack
    //         it), so it only nudges the score a little and is reported
    //         separately rather than folded into reasons/score noise.
    const hasCameraInfo = !!(metadata.exif && (metadata.exif.Make || metadata.exif.Model || metadata.exif.FNumber || metadata.exif.ExposureTime));
    const hasAnyExif = metadata.exif && Object.keys(metadata.exif).length > 0;

    let verdict;
    if (score >= 90) verdict = 'likely_ai_generated';
    else if (score >= 40) verdict = 'possibly_ai_generated';
    else verdict = 'no_ai_signature_found';

    return {
        isAiGenerated: score > 0,
        verdict,
        confidence: Math.min(score, 100),
        reasons,
        note: hasAnyExif && !hasCameraInfo && reasons.length === 0
            ? 'No AI tool signature found, but the file also has no camera EXIF data — inconclusive either way (could be AI, a screenshot, a scan, or software with metadata stripped).'
            : (reasons.length === 0
                ? 'No known AI-generation markers found in metadata. This does NOT confirm the image is authentic — metadata is easy to strip or was never present.'
                : 'Absence of further camera/EXIF data on top of the reasons above is consistent with, but not by itself proof of, AI generation.')
    };
}

module.exports = { readImageMetadata, detectAIGenerated };
