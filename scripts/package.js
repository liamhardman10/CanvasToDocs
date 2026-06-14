// scripts/package.js
const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');

async function package() {
    console.log('📦 Packaging extension for distribution...');
    
    // Read version from package.json
    const packageJson = await fs.readJson(path.join(__dirname, '..', 'package.json'));
    const version = packageJson.version;
    const zipName = `CanvasToDocs-v${version}.zip`;
    
    // Check if dist folder exists
    const distPath = path.join(__dirname, '..', 'dist');
    if (!await fs.pathExists(distPath)) {
        console.error('❌ dist folder not found. Run `npm run build` first.');
        process.exit(1);
    }
    
    // Create releases folder
    await fs.ensureDir(path.join(__dirname, '..', 'releases'));
    
    // Create zip file
    try {
        console.log(`📝 Creating ${zipName}...`);
        execSync(`npx bestzip ${zipName} dist/*`, { 
            cwd: path.join(__dirname, '..'),
            stdio: 'inherit' 
        });
        
        // Move to releases folder
        const zipPath = path.join(__dirname, '..', zipName);
        const releasePath = path.join(__dirname, '..', 'releases', zipName);
        await fs.move(zipPath, releasePath, { overwrite: true });
        
        console.log(`✅ Package created: releases/${zipName}`);
        console.log(`📊 File size: ${(await fs.stat(releasePath)).size / 1024} KB`);
    } catch (error) {
        console.error('❌ Failed to create package:', error);
        process.exit(1);
    }
}

package();