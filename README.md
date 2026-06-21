# 🌏 漫遊地球 WanderGlobe

互動式 3D 旅遊攻略網站 —— 轉動地球，找到你的下一場旅行。

## ✨ 功能

| 層級 | 頁面 | 內容 |
| --- | --- | --- |
| 1️⃣ 首頁 | 3D 立體地球 | 滑鼠懸停國家立即「浮起」並顯示介紹卡片，點擊進入國家頁 |
| 2️⃣ 國家頁 | 區域總覽 | 國情速覽（貨幣/簽證/時區/最佳季節）+ 各區域卡片 |
| 3️⃣ 區域頁 | 完整攻略 | 航班估價、攻略地圖、美食、住宿行情、行程、預算估算器、照片牆 |
| 🧳 行程規劃 | 自由組合 | 跨國跨城自由加入城市，排序、設天數，即時估算整趟每人預算 |

- **行程規劃器**：任何城市攻略頁點「＋ 加入行程」，到 `/trip` 自由排序、調整停留天數，即時算出機票＋各站住宿餐飲門票的整趟每人預算，可一鍵複製行程文字。行程存在瀏覽器 localStorage，重新整理不流失。
- **🔗 行程分享連結**：在 `/trip` 點「複製分享連結」，把排好的城市、天數與出發地／月份編進網址；朋友點開連結就看到同一份行程與預算估算，不需登入、不需後端。
- **🌙 深色模式**：導覽列一鍵切換亮／暗色，首次依系統偏好（`prefers-color-scheme`）自動套用，之後記住選擇（localStorage）。整套以 CSS 變數驅動，重新整理不閃白。
- **🗓️ 全年旅遊指數**：每個城市攻略頁頂端有一條 12 個月色帶，依 `bestSeason` 自動標出最佳（綠）／過渡季（黃）／淡季（灰），並圈出當月，一眼挑對出發時間。
- **🎲 隨機探索**：城市太多選擇困難？首頁與每個城市頁底部都有「隨機探索」按鈕，在 769 個城市裡隨機跳到一個驚喜目的地。

- **怎麼去**：選出發地（台北/高雄/香港/新加坡/首爾）與月份 → 航班估價，附 Skyscanner / Google Flights 即時查價連結
- **攻略地圖**：Leaflet 互動地圖，景點列表與地圖雙向連動，每個景點可一鍵開 Google Maps
- **住宿行情**：三種等級每晚參考價 + 推薦住宿區 + Booking / Agoda / Airbnb 查價連結
- **預算估算器**：人數 × 天數 × 住宿等級 × 旅遊風格 → 即時總預算與分項圖表
- **照片牆**：自動抓取維基百科真實景點照片（免 API key）

目前收錄 **175 個目的地、769 個區域**，幾乎涵蓋全球每一個國家，橫跨亞洲、歐洲、非洲、美洲、大洋洲：
- **亞洲** — 東亞 8、東南亞 11、南亞 8、中亞 5、高加索與安納托利亞 5、中東 13
- **歐洲 39** — 西歐、南歐、北歐、中東歐（含俄烏白）、巴爾幹
- **非洲 49** — 北非、西非、中非、東非、南部非洲五大分區全收錄
- **美洲 30** — 北美 4、中美洲與加勒比海 14、南美洲 12
- **大洋洲 7** — 澳、紐、斐濟、巴紐、索羅門、萬那杜、新喀里多尼亞

熱門國家深度收錄：美國 22 區、日本 20 區、中國 20 區、義大利 16 區、法國／西班牙／印度／德國／英國／希臘／韓國／台灣各 15 區、泰國 14 區。

> **紅色警示國**：有戰爭或外交部紅色「不宜前往」警示的國家（俄羅斯、烏克蘭、白俄羅斯、北韓、緬甸、阿富汗、伊朗、伊拉克、敘利亞、葉門、黎巴嫩、以色列、巴勒斯坦、馬利、蘇丹、索馬利亞、剛果民主共和國、海地等）仍收錄，但頁面頂端有醒目的紅色警示橫幅（透過資料的 `advisory` 欄位驅動），內容客觀中立、偏重歷史人文與世界遺產，而非鼓勵旅遊。
> **未收錄**：新加坡、香港、澳門、馬爾地夫因面積太小在 110m 地圖上沒有形狀（地球不會亮起，但攻略頁完整）。

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
    asia/      # 亞洲 48 個目的地資料檔
    europe/    # 歐洲 39 國資料檔
    america/   # 美洲 30 國資料檔
    africa/    # 非洲 49 國資料檔
    oceania/   # 大洋洲 7 國資料檔
  services/    # 航班估價、住宿行情、行程預算、外部平台深度連結
  components/  # 3D 地球、攻略地圖、航班/住宿面板、預算估算器、照片牆
  hooks/       # useTrip 行程組合狀態（localStorage 持久化）
  pages/       # 首頁、目的地總覽、國家頁、區域頁、行程規劃
  styles/      # 全站設計系統
public/data/   # 世界各國 GeoJSON（Natural Earth 110m）
scripts/       # 開發輔助（頁面截圖、資料結構驗證）
```

驗證資料完整性：`node scripts/validate_data.mjs`（檢查 175 個目的地、769 區的欄位結構與 GeoJSON 對應）。

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
