const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/api/articles', async (req, res) => {
    try {
        console.log('İstek başladı');
        const response = await axios.get('https://seyler.eksisozluk.com', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'tr,en-US;q=0.7,en;q=0.3',
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
            }
        });

        console.log('Yanıt alındı:', response.status);
        const $ = cheerio.load(response.data);

        // HTML yapısını analiz edelim
        console.log('Body içeriği:', $('body').html().substring(0, 1000));

        const articles = [];

        // Ana içerik alanını bulalım
        const mainContent = $('#content, .main-content, main');
        console.log('Ana içerik alanı bulundu mu:', mainContent.length > 0);

        // Tüm makale kartlarını seçelim
        const articleCards = mainContent.find('article, .story-card, .content-item');
        console.log('Bulunan makale kartı sayısı:', articleCards.length);

        articleCards.each((i, element) => {
            const el = $(element);
            console.log(`\nMakale ${i + 1} analizi:`);
            console.log('Element HTML:', el.html().substring(0, 200));

            const titleEl = el.find('h1, h2, .title').first();
            const title = titleEl.text().trim();
            console.log('Başlık:', title);

            const linkEl = el.find('a').first();
            const link = linkEl.attr('href');
            console.log('Link:', link);

            const imageEl = el.find('img').first();
            const image = imageEl.attr('src') || imageEl.attr('data-src');
            console.log('Resim:', image);

            const summaryEl = el.find('p, .summary, .excerpt').first();
            const summary = summaryEl.text().trim();
            console.log('Özet:', summary);

            if (title && link) {
                articles.push({
                    title,
                    link: link.startsWith('http') ? link : `https://seyler.eksisozluk.com${link}`,
                    image: image || '',
                    summary: summary || ''
                });
            }
        });

        console.log('\nToplam makale sayısı:', articles.length);
        res.json(articles);
    } catch (error) {
        console.error('Hata detayı:', error);
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