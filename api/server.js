// 簡易自己紹介アプリ（バックエンド）
const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 3000;

app.use(express.static('public'));
app.use(express.json());

// ファイルパス（絶対パス指定）
const filePath = path.join(__dirname, 'words.json');

// 初期化
function initializeWords() {
  try {
    fs.writeFileSync(filePath, JSON.stringify([]));
    console.log('ワードセットを初期化しました');
  } catch (error) {
    console.error('初期化エラー:', error);
  }
}

// データを安全に読み込む
function loadWords() {
  try {
    if (!fs.existsSync(filePath)) {
      initializeWords();
    }
    const data = fs.readFileSync(filePath, 'utf-8');
    console.log('データ読み込み成功:', data);
    return JSON.parse(data) || [];
  } catch (error) {
    console.error('データ読み込みエラー:', error);
    return [];
  }
}

// データを安全に保存する
function saveWords(data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data));
    console.log('データが正常に保存されました:', data);
  } catch (error) {
    console.error('データ保存エラー:', error);
  }
}

// サーバー起動時に初期化
initializeWords();

// ユーザ画面（登録用）
app.get('/user', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'user.html'));
});

// 管理画面（表示用）
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// 全ユーザー一覧画面
app.get('/user-list', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'user-list.html'));
});

// 全ユーザーデータを取得
app.get('/api/users', (req, res) => {
  try {
    const data = loadWords();
    res.json(data);
  } catch (error) {
    res.json({ message: 'データ取得エラー' });
  }
});

// URLの拡張子を省略するためのリダイレクト
app.get('/user.html', (req, res) => {
  res.redirect('/user');
});

app.get('/admin.html', (req, res) => {
  res.redirect('/admin');
});

// ワードを保存
app.post('/submit', (req, res) => {
  const { name, words } = req.body;
  console.log('受け取ったデータ:', req.body);
  const filteredWords = words.filter(word => word.trim() !== '');
  if (!name || filteredWords.length !== 5) {
    console.log('無効なデータ:', { name, words });
    return res.json({ message: '名前と5つすべてのワードを入力してください' });
  }
  const data = loadWords();
  data.push({ name, words: filteredWords, currentIndex: 0, shown: false, timestamp: Date.now() });
  saveWords(data);
  console.log('ワードが保存されました:', { name, words });
  res.json({ message: 'ワードが保存されました' });
});

// ワードを編集
app.post('/edit', (req, res) => {
  const { name, words } = req.body;
  console.log('編集リクエスト:', req.body);
  const data = loadWords();
  const index = data.findIndex(item => item.name === name);
  if (index !== -1) {
    data[index].words = words;
    saveWords(data);
    console.log('ワードが編集されました:', { name, words });
    res.json({ message: 'ワードが編集されました' });
  } else {
    res.json({ message: '指定された名前のワードが見つかりません' });
  }
});

// ランダムで次のワードセットを取得
app.get('/api/random', (req, res) => {
  try {
    let data = loadWords();
    const unshownData = data.filter(item => !item.shown);
    if (unshownData.length > 0) {
      const randomIndex = Math.floor(Math.random() * unshownData.length);
      const wordSet = unshownData[randomIndex];
      wordSet.shown = true;
      saveWords(data);
      res.json({ name: wordSet.name, words: wordSet.words });
    } else {
      res.json({ name: 'データなし', words: ['ワードがありません', 'ワードがありません', 'ワードがありません', 'ワードがありません', 'ワードがありません'] });
    }
  } catch (error) {
    console.error('エラーが発生しました:', error);
    res.json({ name: 'エラー', words: ['データ読み込みエラー'] });
  }
});

// ワードセットをリセット
app.post('/api/reset', (req, res) => {
  try {
    initializeWords();
    console.log('ワードセットをリセットしました');
    res.json({ message: 'ワードセットをリセットしました' });
  } catch (error) {
    console.error('リセットエラー:', error);
    res.json({ message: 'リセットに失敗しました' });
  }
});

app.listen(PORT, () => {
  console.log(`サーバーがポート${PORT}で起動しました`);
});
