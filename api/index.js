import express from 'express';
import Meting from '@meting/core';

const app = express();

const API_SOURCE = 'netease';

app.get('/api/search', async (req, res) => {
  try {
    const keyword = req.query.keyword || '';
    const count = parseInt(req.query.count) || 1;

    const api = new Meting(API_SOURCE);
    const result = await api.search(keyword);
    
    // 先解析 JSON
    const parsed = JSON.parse(result);
    
    // 检查返回的数据结构
    let list = [];
    if (Array.isArray(parsed)) {
      list = parsed;
    } else if (parsed.data && Array.isArray(parsed.data)) {
      list = parsed.data;
    } else {
      // 如果都不是，直接返回原始数据便于调试
      return res.json({ raw: parsed, error: 'Unexpected data structure' });
    }

    // 取前 count 条
    const limited = list.slice(0, count);

    const formatted = limited.map(v => ({
      id: v.id,
      name: v.name,
      artist: v.artist || v.artist_name,
      pic: v.pic || v.cover
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
    
    const parsed = JSON.parse(result);
    res.json(parsed);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 添加一个调试接口，查看原始返回数据
app.get('/api/debug', async (req, res) => {
  try {
    const keyword = req.query.keyword || '测试';
    const api = new Meting(API_SOURCE);
    const result = await api.search(keyword);
    
    res.json({
      raw: result,
      parsed: JSON.parse(result),
      type: typeof JSON.parse(result),
      isArray: Array.isArray(JSON.parse(result))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default app;
