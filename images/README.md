# Images Folder Structure

This folder contains all the images used to showcase the LyricArt designs on the website.

## Folder Structure

```
images/
├── designs/
│   ├── guitars/     # Guitar-shaped word art designs
│   ├── pianos/      # Piano-shaped word art designs  
│   ├── cassettes/   # Cassette tape-shaped word art designs
│   └── featured/    # Featured/highlighted designs
└── README.md        # This file
```

## Image Guidelines

### File Formats
- **PNG**: For web display (transparent background preferred)
- **JPG**: For web display (when transparency not needed)
- **SVG**: For scalable vector graphics (if available)

### Image Specifications
- **Thumbnail size**: 300x300px (for product cards)
- **Featured size**: 500x500px (for hero section)
- **Aspect ratio**: 1:1 (square) recommended
- **File size**: Keep under 500KB for web performance

### Naming Convention
Use descriptive names that match the song and artist:
- `led-zeppelin-stairway-to-heaven-guitar.png`
- `taylor-swift-love-story-piano.png`
- `metallica-nothing-else-matters-guitar.png`

### Usage in Code
Images are referenced in the JavaScript designs array:
```javascript
{
    id: 1,
    artist: "LED ZEPPELIN",
    song: "STAIRWAY TO HEAVEN",
    shape: "Guitar",
    formats: ["SVG", "PDF", "PNG", "EPS"],
    price: 3.00,
    image: "images/designs/guitars/led-zeppelin-stairway-to-heaven-guitar.png"
}
```

## Source Files
The original design files are stored in the `MUSIC LYRICS WORD ART GUITARS/` folder (excluded from git) and should be processed into web-ready images before placing them in this folder. 