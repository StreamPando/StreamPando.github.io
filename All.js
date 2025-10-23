// ==============================
// Texte qui pulse
// ==============================
(function() {
    function pulseText(selector, scale = 1.3, duration = 1000) {
        const elements = document.querySelectorAll(selector);

        elements.forEach(el => {
            const initialFontSize = parseFloat(window.getComputedStyle(el).fontSize);
            const minSize = initialFontSize;
            const maxSize = initialFontSize * scale;
            let growing = true;
            let currentSize = minSize;
            const step = (maxSize - minSize) / (duration / 20);

            const delay = Math.random() * duration;

            setTimeout(() => {
                setInterval(() => {
                    if (growing) {
                        currentSize += step;
                        if (currentSize >= maxSize) growing = false;
                    } else {
                        currentSize -= step;
                        if (currentSize <= minSize) growing = true;
                    }
                    el.style.fontSize = currentSize + "px";
                }, 20);
            }, delay);
        });
    }

    // Exécute automatiquement
    document.addEventListener('DOMContentLoaded', () => {
        pulseText('.pulse', 1.3, 900);
    });
})();


// ==============================
// Couleurs aléatoires pour le fond
// ==============================
(function() {
    function generateGreenNoise(blockSize = 1) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        document.body.appendChild(canvas);

        canvas.style.position = 'fixed';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.zIndex = '-1';

        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const width = canvas.width;
        const height = canvas.height;

        const mainGreen = [65, 84, 91];
        const variants = [
            [65, 84, 91],
            [65, 84, 91],
            [90, 110, 115],
        ];

        const imageData = ctx.createImageData(width, height);
        const data = imageData.data;

        for (let y = 0; y < height; y += blockSize) {
            for (let x = 0; x < width; x += blockSize) {
                // Couleur principale avec légère variation
                let r = mainGreen[0] + Math.floor(Math.random() * 15);
                let g = mainGreen[1] + Math.floor(Math.random() * 15);
                let b = mainGreen[2] + Math.floor(Math.random() * 13);

                // Mélange aléatoire 10%
                if (Math.random() < 0.1) {
                    [r, g, b] = variants[Math.floor(Math.random() * variants.length)];
                }

                // Remplir le bloc 2x2 dans ImageData
                for (let dy = 0; dy < blockSize; dy++) {
                    for (let dx = 0; dx < blockSize; dx++) {
                        let px = x + dx;
                        let py = y + dy;
                        if (px < width && py < height) {
                            let index = (py * width + px) * 4;
                            data[index] = r;
                            data[index + 1] = g;
                            data[index + 2] = b;
                            data[index + 3] = 255; // alpha
                        }
                    }
                }
            }
        }

        ctx.putImageData(imageData, 0, 0);
    }

    generateGreenNoise(1);
})();
