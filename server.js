import express from 'express';
import Meting from '@meting/core';

const app = express();

const API_SOURCE = 'netease';

app.get('/search', async (req, res) => {
  try {
    const keyword = req.query.keyword || '';
    const count = parseInt(req.query.count) || 1;

    const api = new Meting(API_SOURCE);
    const result = await api.search(keyword);
    
    const parsed = JSON.parse(result);
    
    let songs = [];
    if (parsed.result && Array.isArray(parsed.result.songs)) {
      songs = parsed.result.songs;
    } else {
      return res.status(500).json({ 
        error: 'Unexpected data structure',
        data: parsed 
      });
    }

    const limited = songs.slice(0, count);

    const formatted = limited.map(song => ({
      id: song.id,
      name: song.name,
      artist: song.ar ? song.ar.map(a => a.name).join('/') : '',
      album: song.al ? song.al.name : '',
      pic: song.al ? song.al.picUrl : '',
      duration: song.dt
    }));

    res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/url', async (req, res) => {
  try {
    const id = req.query.id;
    if (!id) return res.status(400).json({ error: "missing id" });

    const api = new Meting(API_SOURCE);
    const result = await api.url(id);
    
    const parsed = JSON.parse(result);
    
    if (parsed.data && Array.isArray(parsed.data) && parsed.data.length > 0) {
      res.json({
        url: parsed.data[0].url,
        br: parsed.data[0].br,
        size: parsed.data[0].size,
        type: parsed.data[0].type
      });
    } else {
      res.json(parsed);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ 从环境变量读取端口，默认 3000
// ✅ 监听 0.0.0.0（重要！）
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Meting music API running on port ${PORT}`);
});
