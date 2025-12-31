/* 
 * MixiChat UI Logic
 */

document.addEventListener('DOMContentLoaded', () => {

    // Navbar Scroll Effect
    const navbar = document.querySelector('.navbar');
    if (navbar) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        });
    }

    // Simple animation for connection stats (Simulation)
    const stats = document.querySelectorAll('.stat-item h3');
    if (stats.length > 0) {
        stats.forEach(stat => {
            const value = stat.innerText;
            if (value.includes('k')) return; // perform simple count up for numbers
            if (value.includes('.')) return;

            let count = 0;
            const target = parseInt(value);
            if (isNaN(target)) return;

            const interval = setInterval(() => {
                count += Math.ceil(target / 50);
                if (count >= target) {
                    count = target;
                    clearInterval(interval);
                }
                stat.innerText = count + '+';
            }, 30);
        });
    }

    // Theme Toggle Logic
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        const body = document.body;
        const icon = themeToggle.querySelector('i');

        // Check saved preference
        if (localStorage.getItem('theme') === 'light') {
            body.classList.add('light-mode');
            icon.classList.remove('fa-sun');
            icon.classList.add('fa-moon');
        }

        themeToggle.addEventListener('click', () => {
            body.classList.toggle('light-mode');
            if (body.classList.contains('light-mode')) {
                localStorage.setItem('theme', 'light');
                icon.classList.remove('fa-sun');
                icon.classList.add('fa-moon');
            } else {
                localStorage.setItem('theme', 'dark');
                icon.classList.remove('fa-moon');
                icon.classList.add('fa-sun');
            }
        });
    }

    // Font Zoom Logic
    const zoomIn = document.getElementById('zoom-in');
    const zoomOut = document.getElementById('zoom-out');
    const zoomLevel = document.getElementById('zoom-level');

    if (zoomIn && zoomOut && zoomLevel) {
        const htmlElement = document.documentElement;
        let currentFontSize = 16;

        function updateZoomDisplay() {
            const percentage = Math.round((currentFontSize / 16) * 100);
            zoomLevel.innerText = percentage + '%';
            htmlElement.style.setProperty('--base-font-size', currentFontSize + 'px');
        }

        zoomIn.addEventListener('click', () => {
            if (currentFontSize < 24) {
                currentFontSize += 1;
                updateZoomDisplay();
            }
        });

        zoomOut.addEventListener('click', () => {
            if (currentFontSize > 12) {
                currentFontSize -= 1;
                updateZoomDisplay();
            }
        });
    }

    // Live User Counter Simulation
    function initLiveCounter() {
        const counterElements = document.querySelectorAll('.live-counter');
        const baseCount = 18450; // Starting baseline

        // Function to format number with commas
        const formatNumber = (num) => {
            return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        };

        // Initialize with random variance
        let currentCount = baseCount + Math.floor(Math.random() * 2000);

        const updateCounters = () => {
            counterElements.forEach(el => {
                el.innerText = formatNumber(currentCount);
                // Optional: add a small 'punch' animation class if value changes significantly
            });
        };

        updateCounters();

        // Update every 3-5 seconds
        setInterval(() => {
            // Randomly add or subtract users
            const change = Math.floor(Math.random() * 150) - 50;
            currentCount += change;

            // Keep within bounds
            if (currentCount < 10000) currentCount = 10000;
            if (currentCount > 50000) currentCount = 50000;

            updateCounters();
        }, 3000);
    }

    initLiveCounter();

    console.log('MixiChat Theme Loaded');
});
