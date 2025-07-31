# 🛡️ Image Protection Toggle Guide

## Quick Commands

### Using Node.js Script
```bash
# Check current status
node toggle-image-protection.js status

# Turn OFF protection (for debugging)
``````node toggle-image-protection.js disable``````

# Turn ON protection (for production)
node toggle-image-protection.js enable
```

### Using Windows Batch File
```bash
# Check current status
toggle-protection.bat status

# Turn OFF protection (for debugging)
toggle-protection.bat disable

# Turn ON protection (for production)
toggle-protection.bat enable
```

## What This Does

The script automatically comments/uncomments these protection scripts across all pages:
- `../public/global-image-protection.js`
- `../public/openseadragon-viewer.js`

### Pages Affected:
- `pages/homepage.html`
- `pages/browse_gallery.html`
- `pages/my_collection.html`
- `pages/admin-custom-designs.html`
- `pages/admin-login.html`
- `pages/artist_profiles.html`

## When to Use

### 🔧 **DISABLE Protection** (for debugging):
- When you need to use F12 developer tools
- When debugging JavaScript issues
- When testing website functionality
- When troubleshooting problems

### 🛡️ **ENABLE Protection** (for production):
- When the website is live
- To prevent image downloading
- To block developer tools access
- For security purposes

## Important Notes

1. **Restart Server**: After enabling protection, restart your server:
   ```bash
   npm start
   ```

2. **Browser Cache**: Clear browser cache after toggling protection

3. **Safe to Use**: The script is safe and only modifies HTML comments

## Emergency Commands

If you get locked out by protection:

1. **Via Terminal**:
   ```bash
   node toggle-image-protection.js disable
   ```

2. **Via File Editor**: Manually comment out these lines in any HTML file:
   ```html
   <!-- <script src="../public/global-image-protection.js"></script> -->
   <!-- <script src="../public/openseadragon-viewer.js"></script> -->
   ```

## Troubleshooting

- **Script not found**: Make sure you're in the project root directory
- **Permission denied**: Run as administrator on Windows
- **Protection not working**: Restart the server after enabling
- **Still can't use F12**: Clear browser cache and refresh page 