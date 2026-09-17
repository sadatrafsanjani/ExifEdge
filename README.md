# ExifEdge

ExifEdge is a desktop privacy tool for removing privacy-sensitive metadata from images while preserving the actual image.

## Status
The development is in progress. The first version will be released very soon.

## Visual

![ExifEdge](screenshots/screenshot-1.png)
![ExifEdge](screenshots/screenshot-2.png)

## Supported Formats

- JPEG / JPG
- PNG

## Current Features

- Select JPEG and PNG images
- AI generated image identification
- Analyze image metadata
- Display detected metadata
- Classify metadata by privacy risk
- Show privacy risk summary
- Identify location, device, identity, time, software/history, AI/provenance, and other privacy metadata
- Remove privacy-sensitive metadata
- Save a clean copy without modifying the original image

## Planned Features

- Human face obscuring
- Credit card obscuring
- Vehicle numberplate obscuring
- ID card obscuring
- Batch image processing
- Drag-and-drop image support
- Output folder selection
- Additional image formats in future versions

## Development

```bash
npm install
npm start
```

## Goal

ExifEdge aims to provide a simple desktop application for removing privacy-sensitive metadata from images 
without relying on a graphical wrapper around external metadata tools.

## Privacy

This project do not collect any user data or telemetry. See the [PRIVACY](PRIVACY) file for details.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.


