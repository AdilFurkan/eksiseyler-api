const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/api/articles', async (req, res) => {
    let browser;
    try {
        browser = await puppeteer.launch({
            headless: 'new',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu'
            ],
            executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/google-chrome'
        });

        const page = await browser.newPage();

        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');

        console.log('Sayfaya gidiliyor...');
        await page.goto('https://seyler.eksisozluk.com', {
            waitUntil: 'networkidle0',
            timeout: 30000
        });

        console.log('Sayfa yüklendi, içerik analiz ediliyor...');
        const articles = await page.evaluate(() => {
            const items = [];
            document.querySelectorAll('article.story, .content-card').forEach((el) => {
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
    } catch (error) {
        console.error('Hata:', error);
        if (browser) {
            await browser.close();
        }
        res.status(500).json({
            error: 'Veriler alınamadı',
            message: error.message,
            stack: error.stack
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server ${PORT} portunda çalışıyor`);
}); 