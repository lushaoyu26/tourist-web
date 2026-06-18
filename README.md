# 🌏 漫遊地球 WanderGlobe

互動式 3D 旅遊攻略網站 —— 轉動地球，找到你的下一場旅行。

## ✨ 功能

| 層級 | 頁面 | 內容 |
| --- | --- | --- |
| 1️⃣ 首頁 | 3D 立體地球 | 滑鼠懸停國家立即「浮起」並顯示介紹卡片，點擊進入國家頁 |
| 2️⃣ 國家頁 | 區域總覽 | 國情速覽（貨幣/簽證/時區/最佳季節）+ 各區域卡片 |
| 3️⃣ 區域頁 | 完整攻略 | 航班估價、攻略地圖、美食、住宿行情、行程、預算估算器、照片牆 |

- **怎麼去**：選出發地（台北/高雄/香港/新加坡/首爾）與月份 → 航班估價，附 Skyscanner / Google Flights 即時查價連結
- **攻略地圖**：Leaflet 互動地圖，景點列表與地圖雙向連動，每個景點可一鍵開 Google Maps
- **住宿行情**：三種等級每晚參考價 + 推薦住宿區 + Booking / Agoda / Airbnb 查價連結
- **預算估算器**：人數 × 天數 × 住宿等級 × 旅遊風格 → 即時總預算與分項圖表
- **照片牆**：自動抓取維基百科真實景點照片（免 API key）

目前收錄 **162 個目的地、270 個區域**，幾乎涵蓋全球每個國家，橫跨亞洲、歐洲、非洲、美洲、大洋洲：
- **亞洲** — 東亞 7、東南亞 10、南亞 7、中亞 5、西亞與中東 11
- **歐洲 36** — 西歐、南歐、北歐、中東歐、巴爾幹
- **非洲 49** — 北非、西非、中非、東非、南部非洲五大分區全收錄
- **美洲 30** — 北美 4、中美洲與加勒比海 14、南美洲 12
- **大洋洲 7** — 澳、紐、斐濟、巴紐、索羅門、萬那杜、新喀里多尼亞

> **紅色警示國**：有戰爭或外交部紅色「不宜前往」警示的國家（馬利、尼日、查德、利比亞、蘇丹、南蘇丹、索馬利亞、中非、剛果民主共和國、海地等）仍收錄，但頁面頂端有醒目的紅色警示橫幅（透過資料的 `advisory` 欄位驅動），內容偏重歷史人文而非鼓勵旅遊。
> **完全未收錄**：俄羅斯、烏克蘭、白俄羅斯、緬甸、北韓、阿富汗、伊朗、伊拉克、敘利亞、葉門、黎巴嫩、以色列、巴勒斯坦（戰爭／嚴重警示）。新加坡、香港、澳門、馬爾地夫因面積太小在 110m 地圖上沒有形狀（地球不會亮起，攻略頁完整）。

## 🚀 開始使用

```bash
npm install
npm run dev      # 開發模式 → http://localhost:5173
npm run build    # 正式建置 → dist/
npm run preview  # 預覽建置結果
```

## 🛠 技術架構

- **Vite + React 18** — 前端框架
- **react-globe.gl（Three.js）** — 首頁 3D 地球與國家多邊形浮起效果
- **react-leaflet + CARTO Voyager 圖磚** — 區域攻略地圖
- **React Router 6** — 三層路由（地球 → 國家 → 區域）
- **Wikipedia REST API** — 景點照片（自動處理縮圖尺寸與降級）
- **純 CSS 設計系統** — 無 UI 框架，玻璃擬態 + 響應式

## 📁 專案結構

```
src/
  data/        # 各國旅遊內容（國家 → 區域 → 景點/美食/交通/住宿/行程）
    asia/      # 亞洲 37 個目的地資料檔
    europe/    # 歐洲 33 國資料檔
    america/   # 美洲 30 國資料檔
    africa/    # 非洲 49 國資料檔
    oceania/   # 大洋洲 7 國資料檔
  services/    # 航班估價、住宿行情、外部平台深度連結
  components/  # 3D 地球、攻略地圖、航班/住宿面板、預算估算器、照片牆
  pages/       # 首頁、目的地總覽、國家頁、區域頁
  styles/      # 全站設計系統
public/data/   # 世界各國 GeoJSON（Natural Earth 110m）
scripts/       # 開發輔助（頁面截圖、資料結構驗證）
```

驗證資料完整性：`node scripts/validate_data.mjs`（檢查 162 個目的地、270 區的欄位結構與 GeoJSON 對應）。

## 🌐 部署上線

純靜態網站，免費平台皆可部署。SPA 路由設定已就緒（`public/_redirects` 給 Netlify／Cloudflare Pages、`vercel.json` 給 Vercel）。

**方法一：Netlify Drop（最快，免帳號設定）**
1. `npm run build`
2. 打開 [app.netlify.com/drop](https://app.netlify.com/drop)，把 `dist/` 資料夾拖進去 → 立刻取得公開網址

**方法二：GitHub + Vercel（推薦，自動更新）**
1. `git init && git add -A && git commit -m "init"`，推到 GitHub
2. 到 [vercel.com](https://vercel.com) 用 GitHub 登入 → Import 專案 → Deploy（自動偵測 Vite）
3. 之後每次 push，網站自動更新

**方法三：Vercel CLI（不需 GitHub）**
```bash
npx vercel --prod   # 第一次會引導登入，跟著按 Enter 即可
```

## 🔌 接真實 API

航班與住宿目前為**示範估價**（依市場行情 + 淡旺季係數模擬，數值穩定可重現），要接真實資料：

- **機票**：修改 [src/services/flights.js](src/services/flights.js) 的 `getFlightOptions()`，可接 Skyscanner（RapidAPI）、Amadeus 或 Kiwi Tequila
- **住宿**：修改 [src/services/hotels.js](src/services/hotels.js)，可接 Booking.com Affiliate API

## ➕ 新增國家／區域

在 `src/data/` 新增一個國家檔（照抄 `japan.js` 的結構），然後在 `src/data/index.js` 對應的 `GROUPS` 分組加入即可——地球上的國家會自動亮起、導覽選單與目的地總覽自動出現。`admin` 欄位必須與 GeoJSON 的 `ADMIN` 屬性一字不差（可用 `node scripts/validate_data.mjs` 驗證）。
