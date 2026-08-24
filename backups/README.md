# Firestoreバックアップ

このフォルダには、Firestore（timecard-saasプロジェクト）の内容を毎日自動でスナップショットしたJSONファイルが保存されます。

- 保存元: GitHub Actions（`.github/workflows/firestore-backup.yml`）が毎日 日本時間6:00 に自動実行
- 保存期間: 直近90日分（それより古いものは自動削除）
- 費用: 完全無料（GitHub Actions + Firestoreの読み取りのみ使用、書き込みは行いません）

## 復元が必要になったら

1. 復元したい日付の `backups/YYYY-MM-DD.json` を開く
2. 中身は `{ "data": {...}, "config": {...}, "users": {...} }` の形式
3. `data` の中身がアプリの `state`（従業員マスター・勤怠データ等）そのもの
4. 開発者（Claude）に「このバックアップファイルから復元して」と依頼するか、
   Firestoreコンソールの `timecard/data` ドキュメントを直接編集して復元する
