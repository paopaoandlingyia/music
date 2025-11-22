import express from 'express';
import Meting from '@meting/core';

const app = express();

const API_SOURCE = 'netease';

app.get('/api/search', async (req, res) => {
  try {
    const keyword = req.query.keyword || '';
    const count = req.query.count || 1;

    const api = new Meting(API_SOURCE);
    const result = await api.search(keyword);
    const list = JSON.parse(result).slice(0, count);

    const formatted = list.map(v => ({
      id: v.id,
      name: v.name,
      artist: v.artist,
      pic: v.pic
    }));

    res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/url', async (req, res) => {
  try {
    const id = req.query.id;
    if (!id) return res.status(400).json({ error: "missing id" });

    const api = new Meting(API_SOURCE);
    const result = await api.url(id);

    res.json(JSON.parse(result));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Vercel 需要导出 app
export default app;
