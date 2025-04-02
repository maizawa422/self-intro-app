// 簡易自己紹介アプリ（バックエンド）
const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: '*', methods: ['GET', 'POST'] }));
app.use(express.static(path.join(__dirname, '../public')));
app.use(express.json());

// ファイルパス（絶対パス指定）
const filePath = path.join('/tmp', 'words.json');

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
  res.sendFile(path.join(__dirname, '../public', 'user.html'));
});

// 管理画面（表示用）
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'admin.html'));
});

// 全ユーザー一覧画面
app.get('/user-list', (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'user-list.html'));
});

// 全ユーザーデータを取得
app.get('/api/users', (req, res) => {
  try {
    const data = loadWords();
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: 'データ取得エラー' });
  }
});

// ワードを保存
app.post('/api/submit', (req, res) => {
  const { name, words } = req.body;
  console.log('受け取ったデータ:', req.body);
  const filteredWords = words.filter(word => word.trim() !== '');
  if (!name || filteredWords.length !== 5) {
    console.log('無効なデータ:', { name, words });
    return res.status(400).json({ message: '名前と5つすべてのワードを入力してください' });
  }
  const data = loadWords();
  data.push({ name, words: filteredWords, currentIndex: 0, shown: false, timestamp: Date.now() });
  saveWords(data);
  console.log('ワードが保存されました:', { name, words });
  res.json({ message: 'ワードが保存されました' });
});

// ワードを編集
app.post('/api/edit', (req, res) => {
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
    res.status(404).json({ message: '指定された名前のワードが見つかりません' });
  }
});

// ワードセットを削除（重複を1つだけ削除）
app.post('/api/delete', (req, res) => {
  const { names } = req.body;
  try {
    let data = loadWords();
    names.forEach(name => {
      const index = data.findIndex(item => item.name === name);
      if (index !== -1) {
        data.splice(index, 1); // 最初に見つかった1件のみ削除
      }
    });
    saveWords(data);
    console.log('削除しました:', names);
    res.json({ message: '選択したワードセットを削除しました' });
  } catch (error) {
    console.error('削除エラー:', error);
    res.status(500).json({ message: '削除に失敗しました' });
  }
});

// ワードセットの表示フラグをリセット（再表示）
app.post('/api/reset-shown', (req, res) => {
  const { names } = req.body;
  try {
    let data = loadWords();
    data.forEach(item => {
      if (names.includes(item.name)) {
        item.shown = false; // 表示済みフラグをリセット
      }
    });
    saveWords(data);
    console.log('表示フラグをリセットしました:', names);
    res.json({ message: '選択したワードセットを再表示しました' });
  } catch (error) {
    console.error('再表示エラー:', error);
    res.status(500).json({ message: '再表示に失敗しました' });
  }
});

// ランダムで次のワードセットを取得
app.get('/api/random', (req, res) => {
  try {
    let data = loadWords();
    let unshownData = data.filter(item => !item.shown);

    if (unshownData.length === 0) {
      res.json({ name: 'データなし', words: ['ワードがありません', 'ワードがありません', 'ワードがありません', 'ワードがありません', 'ワードがありません'] });
      return;
    }

    const randomIndex = Math.floor(Math.random() * unshownData.length);
    const wordSet = unshownData[randomIndex];
    wordSet.shown = true;
    saveWords(data);
    res.json({ name: wordSet.name, words: wordSet.words });
  } catch (error) {
    console.error('エラーが発生しました:', error);
    res.status(500).json({ name: 'エラー', words: ['データ読み込みエラー'] });
  }
});

// ワードセットをリセット
app.post('/api/reset', (req, res) => {
  try {
    initializeWords();
    saveWords([]);
    console.log('ワードセットをリセットしました');
    res.json({ message: 'ワードセットをリセットしました' });
  } catch (error) {
    console.error('リセットエラー:', error);
    res.status(500).json({ message: 'リセットに失敗しました' });
  }
});

app.listen(PORT, () => {
  console.log(`サーバーがポート${PORT}で起動しました`);
});
