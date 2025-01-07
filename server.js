const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/api/articles', async (req, res) => {
    try {
        const browser = await puppeteer.launch({
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();

        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');

        await page.goto('https://seyler.eksisozluk.com', {
            waitUntil: 'networkidle0'
        });

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

        await browser.close();
        res.json(articles);
    } catch (error) {
        console.error('Hata:', error);
        res.status(500).json({ error: 'Veriler alınamadı' });
    }
});

app.listen(PORT, () => {
    console.log(`Server ${PORT} portunda çalışıyor`);
}); 