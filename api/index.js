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
    
    // 第一次解析
    const parsed = JSON.parse(result);
    
    // 获取歌曲列表（在 result.songs 路径下）
    let songs = [];
    if (parsed.result && Array.isArray(parsed.result.songs)) {
      songs = parsed.result.songs;
    } else {
      return res.status(500).json({ 
        error: 'Unexpected data structure',
        data: parsed 
      });
    }

    // 取前 count 条
    const limited = songs.slice(0, count);

    // 格式化输出
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

app.get('/api/url', async (req, res) => {
  try {
    const id = req.query.id;
    if (!id) return res.status(400).json({ error: "missing id" });

    const api = new Meting(API_SOURCE);
    const result = await api.url(id);
    
    const parsed = JSON.parse(result);
    
    // 网易云返回的 URL 数据结构
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

// 调试接口（可选，部署后可以删除）
app.get('/api/debug', async (req, res) => {
  try {
    const keyword = req.query.keyword || '测试';
    const api = new Meting(API_SOURCE);
    const result = await api.search(keyword);
    
    const parsed = JSON.parse(result);
    
    res.json({
      raw: result.substring(0, 500) + '...', // 只显示前500字符
      structure: {
        hasResult: !!parsed.result,
        hasSongs: !!(parsed.result && parsed.result.songs),
        songsCount: parsed.result?.songs?.length || 0,
        firstSong: parsed.result?.songs?.[0] || null
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default app;
