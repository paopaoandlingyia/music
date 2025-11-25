import express from 'express';
import Meting from '@meting/core';

const app = express();

const API_SOURCE = 'netease';

// ✅ 原有的搜索接口（保留）
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

// ✅ 原有的 URL 接口（保留）
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

// 🌟 新增：一键获取完整信息（搜索 + URL）
app.get('/music', async (req, res) => {
  try {
    const keyword = req.query.keyword || '';
    const count = parseInt(req.query.count) || 1;

    const api = new Meting(API_SOURCE);
    
    // 第一步：搜索
    const searchResult = await api.search(keyword);
    const searchParsed = JSON.parse(searchResult);
    
    let songs = [];
    if (searchParsed.result && Array.isArray(searchParsed.result.songs)) {
      songs = searchParsed.result.songs;
    } else {
      return res.status(500).json({ 
        error: 'Search failed',
        data: searchParsed 
      });
    }

    const limited = songs.slice(0, count);

    // 第二步：为每首歌获取播放链接
    const results = await Promise.all(
      limited.map(async (song) => {
        try {
          const urlResult = await api.url(song.id);
          const urlParsed = JSON.parse(urlResult);
          
          let playUrl = null;
          if (urlParsed.data && Array.isArray(urlParsed.data) && urlParsed.data.length > 0) {
            playUrl = urlParsed.data[0].url;
          }

          return {
            id: song.id,
            name: song.name,
            artist: song.ar ? song.ar.map(a => a.name).join('/') : '',
            album: song.al ? song.al.name : '',
            pic: song.al ? song.al.picUrl : '',
            duration: song.dt,
            url: playUrl  // ✅ 直接包含播放链接
          };
        } catch (err) {
          // 某首歌获取失败，返回 null url
          return {
            id: song.id,
            name: song.name,
            artist: song.ar ? song.ar.map(a => a.name).join('/') : '',
            album: song.al ? song.al.name : '',
            pic: song.al ? song.al.picUrl : '',
            duration: song.dt,
            url: null,
            error: err.message
          };
        }
      })
    );

    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 新增：歌词接口
app.get('/lyric', async (req, res) => {
  try {
    const id = req.query.id; // 获取歌曲 ID 参数
    if (!id) return res.status(400).json({ error: "missing id" });

    const api = new Meting(API_SOURCE);
    const result = await api.lyric(id); // 调用 Meting 的歌词 API 方法
    
    const parsed = JSON.parse(result); // 解析响应的 JSON 数据
    
    if (parsed.nolyric) {
      // 如果歌曲无歌词
      res.json({ lyrics: null, hint: 'No lyrics available.' });
    } else if (parsed.lrc && parsed.lrc.lyric) {
      // 提取歌词内容（lrc 格式）
      res.json({ lyrics: parsed.lrc.lyric });
    } else {
      // 意外情况
      res.status(500).json({ error: 'Unexpected lyric format', data: parsed });
    }
  } catch (error) {
    res.status(500).json({ error: error.message }); // 异常处理
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Meting music API running on port ${PORT}`);
});
