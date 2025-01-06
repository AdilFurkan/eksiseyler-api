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
        const response = await axios.get('https://seyler.eksisozluk.com', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            }
        });

        const $ = cheerio.load(response.data);
        const articles = [];

        $('article.story').each((i, element) => {
            const titleElement = $(element).find('h1 a');
            const imageElement = $(element).find('img');
            const summaryElement = $(element).find('p.summary');

            articles.push({
                title: titleElement.text().trim(),
                link: `https://seyler.eksisozluk.com${titleElement.attr('href')}`,
                image: imageElement.attr('src') || '',
                summary: summaryElement.text().trim()
            });
        });

        res.json(articles);
    } catch (error) {
        console.error('Hata:', error);
        res.status(500).json({ error: 'Veriler alınamadı' });
    }
});

app.listen(PORT, () => {
    console.log(`Server ${PORT} portunda çalışıyor`);
}); 