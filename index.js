import express from 'express';
import Meting from '@meting/core';

const app = express();

const API_SOURCE = 'netease'; // 你想换 QQ= 'tencent'

// 搜索
app.get('/search', async (req, res) => {
  try {
    const keyword = req.query.keyword || '';
    const count = req.query.count || 1;

    const api = new Meting(API_SOURCE);
    const result = await api.search(keyword);

    // 只取前 count 条
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

// 获取歌曲 URL
app.get('/url', async (req, res) => {
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

app.listen(3000, () => {
  console.log("Meting music API running on :3000");
});
