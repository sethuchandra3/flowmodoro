class BackgroundAnimator {
    constructor() {
        this.container = document.getElementById('animated-background');
        this.init();
    }

    /**
     * Generate a harmonious color palette using HSL color space
     * Uses analogous colors (adjacent on color wheel) for harmony
     * @returns {Array} Array of HSL color strings
     */
    generateHarmoniousColors() {
        // Generate a random base hue (0-360)
        const baseHue = Math.floor(Math.random() * 360);
        const palette = [];

        // Color generation parameters
        const totalColors = 12;      // Increased number of colors
        const saturation = 85;       // Higher saturation for richer colors
        const lightness = 55;        // Darker base lightness to avoid whiteness
        const hueRange = 90;         // Wider hue range for more color variety
        const saturationVariance = 15; // Variance in saturation
        const lightnessVariance = 10;  // Variance in lightness

        // Generate main analogous colors
        for (let i = 0; i < totalColors; i++) {
            // Calculate hue shift across the range
            const hueShift = (i - (totalColors / 2)) * (hueRange / totalColors);
            const hue = (baseHue + hueShift + 360) % 360;
            
            // Vary saturation between 70-100%
            const finalSaturation = Math.min(100, Math.max(70, saturation + (Math.random() * saturationVariance - saturationVariance/2)));
            
            // Vary lightness between 45-65% to avoid white
            const finalLightness = Math.min(65, Math.max(45, lightness + (Math.random() * lightnessVariance - lightnessVariance/2)));
            
            palette.push(`hsl(${hue}, ${finalSaturation}%, ${finalLightness}%)`);
        }

        return palette;
    }

    /**
     * Calculate strategic positions for blobs to ensure full coverage
     * @returns {Object} Left and top positions as CSS values
     */
    calculateBlobPosition() {
        const positions = [
            // Corners
            { left: '-10%', top: '-10%' },
            { left: '110%', top: '-10%' },
            { left: '-10%', top: '110%' },
            { left: '110%', top: '110%' },
            // Edges
            { left: '25%', top: '-10%' },
            { left: '75%', top: '-10%' },
            { left: '-10%', top: '25%' },
            { left: '-10%', top: '75%' },
            { left: '110%', top: '25%' },
            { left: '110%', top: '75%' },
            { left: '25%', top: '110%' },
            { left: '75%', top: '110%' },
            // Center area
            { left: '25%', top: '25%' },
            { left: '75%', top: '25%' },
            { left: '25%', top: '75%' },
            { left: '75%', top: '75%' },
            { left: '50%', top: '50%' }
        ];

        return positions[Math.floor(Math.random() * positions.length)];
    }

    /**
     * Create a single blob element
     * @param {string} color - The HSL color string for the blob
     * @returns {HTMLElement} The created blob element
     */
    createBlob(color) {
        const blob = document.createElement('div');
        blob.className = 'blob';
        
        // Larger size range for better coverage
        const size = 500 + Math.random() * 400;
        blob.style.width = `${size}px`;
        blob.style.height = `${size}px`;
        
        // Position blob strategically
        const position = this.calculateBlobPosition();
        blob.style.left = position.left;
        blob.style.top = position.top;
        
        // Set the fixed color
        blob.style.backgroundColor = color;
        
        // Randomize animation duration slightly
        const duration = 45 + Math.random() * 15;
        blob.style.setProperty('--float-duration', `${duration}s`);
        
        // Random animation delay for more natural movement
        blob.style.animationDelay = `${Math.random() * -60}s`;
        
        return blob;
    }

    /**
     * Initialize the background with blobs
     */
    init() {
        // Generate harmonious colors for this session
        const colors = this.generateHarmoniousColors();
        
        // Create more blobs for fuller coverage
        const numBlobs = 20 + Math.floor(Math.random() * 5);
        
        // Create initial layer of larger, more transparent blobs for base coverage
        for (let i = 0; i < 5; i++) {
            const blob = this.createBlob(colors[i % colors.length]);
            blob.style.transform = 'scale(1.5)';
            blob.style.opacity = '0.4';
            this.container.appendChild(blob);
        }
        
        // Create main layer of blobs
        for (let i = 0; i < numBlobs; i++) {
            const color = colors[i % colors.length];
            const blob = this.createBlob(color);
            this.container.appendChild(blob);
        }

        // Add resize handler for responsiveness
        window.addEventListener('resize', () => this.handleResize());
    }

    /**
     * Handle window resize events
     */
    handleResize() {
        // Reposition blobs on resize for optimal coverage
        const blobs = this.container.getElementsByClassName('blob');
        for (const blob of blobs) {
            const position = this.calculateBlobPosition();
            blob.style.left = position.left;
            blob.style.top = position.top;
        }
    }
}

// Initialize background animation when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new BackgroundAnimator();
}); 
