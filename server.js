const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Basit bir health check endpoint'i
app.get('/', (req, res) => {
    res.json({ status: 'OK' });
});

app.get('/api/articles', async (req, res) => {
    let browser;
    try {
        console.log('Chrome başlatılıyor...');
        console.log('Sistem bilgisi:', {
            platform: process.platform,
            arch: process.arch,
            node: process.version,
            env: process.env.NODE_ENV
        });

        const launchOptions = {
            headless: 'new',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--single-process',
                '--disable-extensions'
            ],
            executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/google-chrome',
            ignoreHTTPSErrors: true
        };

        console.log('Launch options:', launchOptions);
        browser = await puppeteer.launch(launchOptions);

        const page = await browser.newPage();
        console.log('Yeni sayfa açıldı');

        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');
        console.log('User agent ayarlandı');

        try {
            console.log('Sayfaya gidiliyor...');
            await page.goto('https://seyler.eksisozluk.com', {
                waitUntil: 'networkidle0',
                timeout: 60000
            });
            console.log('Sayfa yüklendi');

            // Sayfanın yüklendiğinden emin olmak için biraz bekleyelim
            await page.waitForTimeout(5000);

            const pageContent = await page.content();
            console.log('Sayfa içeriği alındı, ilk 500 karakter:', pageContent.substring(0, 500));

            const articles = await page.evaluate(() => {
                const items = [];
                const elements = document.querySelectorAll('article.story, .content-card');
                console.log('Bulunan element sayısı:', elements.length);

                elements.forEach((el) => {
                    const titleEl = el.querySelector('h1, h2, .title');
                    const linkEl = el.querySelector('a');
                    const imageEl = el.querySelector('img');
                    const summaryEl = el.querySelector('p.summary, .description');

                    if (titleEl && linkEl) {
                        items.push({
                            title: titleEl.textContent.trim(),
                            link: linkEl.href,
                            image: imageEl ? imageEl.src : '',
                            summary: summaryEl ? summaryEl.textContent.trim() : ''
                        });
                    }
                });
                return items;
            });

            console.log(`${articles.length} makale bulundu`);
            await browser.close();
            res.json(articles);
        } catch (pageError) {
            console.error('Sayfa işleme hatası:', pageError);
            throw pageError;
        }
    } catch (error) {
        console.error('Ana hata:', error);
        if (browser) {
            try {
                await browser.close();
            } catch (closeError) {
                console.error('Browser kapatma hatası:', closeError);
            }
        }
        res.status(500).json({
            error: 'Veriler alınamadı',
            message: error.message,
            stack: error.stack,
            details: error.toString()
        });
    }
});

// Error handler middleware
app.use((err, req, res, next) => {
    console.error('Genel hata yakalayıcı:', err);
    res.status(500).json({
        error: 'Sunucu hatası',
        message: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

app.listen(PORT, () => {
    console.log(`Server ${PORT} portunda çalışıyor`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM sinyali alındı, uygulama kapatılıyor...');
    process.exit(0);
}); 