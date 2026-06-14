// scripts/build.js - Debug version
console.log('🚀 Build script started');

const fs = require('fs');
const path = require('path');

console.log('✅ fs module loaded');

const distDir = path.join(process.cwd(), 'dist');
console.log('📁 Dist directory:', distDir);

// Create dist directory
if (!fs.existsSync(distDir)) {
    console.log('Creating dist folder...');
    fs.mkdirSync(distDir, { recursive: true });
}

// Function to copy directory recursively
function copyDir(src, dest) {
    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
    }
    
    const entries = fs.readdirSync(src, { withFileTypes: true });
    
    for (let entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        
        if (entry.isDirectory()) {
            copyDir(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
            console.log(`  Copied: ${entry.name}`);
        }
    }
}

// Copy files
try {
    console.log('\n📄 Copying manifest.json...');
    fs.copyFileSync('manifest.json', path.join(distDir, 'manifest.json'));
    
    console.log('📄 Copying popup.html...');
    fs.copyFileSync('popup.html', path.join(distDir, 'popup.html'));
    
    console.log('📁 Copying js folder...');
    copyDir('js', path.join(distDir, 'js'));
    
    console.log('📁 Copying icons folder...');
    copyDir('icons', path.join(distDir, 'icons'));
    
    console.log('\n✅ Build completed successfully!');
    console.log(`📦 Files are in: ${distDir}`);
    
    // List the files
    console.log('\nContents of dist folder:');
    const files = fs.readdirSync(distDir);
    files.forEach(file => {
        console.log(`  - ${file}`);
    });
    
} catch (err) {
    console.error('\n❌ Error during build:', err.message);
    process.exit(1);
}