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
- **🔍 全站搜尋**：導覽列搜尋鈕或按 `/`（或 Cmd/Ctrl+K）開啟指令面板，1016 個城市與 175 國中英文即時模糊搜尋，鍵盤上下鍵選取、Enter 直達。
- **📊 行程方案比較**：把目前行程「存成方案」（省錢版／豪華版／給朋友…），在 `/trip` 以同一出發地與月份並排比較各方案的城市、天數與每人成本，自動標出「最省」。
- **📲 PWA + 離線地圖**：可加到主畫面像 App 一樣開啟；Service Worker 快取頁面與資源，並額外快取**已瀏覽過的地圖圖磚與維基照片**，斷網也能看回顧過的城市攻略與地圖（`public/manifest.webmanifest` + `public/sw.js`）。
- **🧮 旅伴分帳**：`/trip` 內建分帳工具，輸入每個旅伴各付了多少，立刻算出每人均攤與「誰該補給誰」（最少轉帳筆數）。
- **📅 行程匯出**：選好出發日期，一鍵把行程匯出成 `.ics` 行事曆（各站自動排成連續的全天事件，匯入 Google／Apple 日曆），或「列印／存成 PDF」帶上路。
- **🌤️ 當地即時天氣**：每個城市攻略頁顯示當地現在天氣與未來 4 天預報，串接免金鑰的 [Open-Meteo](https://open-meteo.com/) API（依城市座標、純前端、無需後端）。
- **🌐 介面雙語**：導覽列一鍵切換中文／English，記住偏好（localStorage）；切換導覽、首頁等介面字串與國家英文名（城市攻略內文維持原資料）。
- **♿ 無障礙**：略過連結（skip-link）、鍵盤焦點環（`:focus-visible`）、語意化 `<main>` 地標、`prefers-reduced-motion` 降低動態、表單與按鈕 aria 標籤。
- **💬 旅人評論與照片社群**：每個城市頁可留下星等評論、心得與照片，並看到平均評分。預設存在本機；在 Vercel 連接免費 KV 資料庫後，自動變成**所有訪客共享的社群**（後端 [api/reviews.js](api/reviews.js) + 前端優雅回退）。
- **📢 廣告版位**：城市頁與目的地頁內建 Google AdSense 就緒的廣告版位（[src/components/AdSlot.jsx](src/components/AdSlot.jsx)）——設定 `VITE_ADSENSE_CLIENT` 後自動顯示廣告，未設定時顯示乾淨的版位佔位。
- **🎟️ 在地優惠券**：每個城市頁有「在地優惠」區，列出訂房、體驗、上網卡等合作夥伴折扣，一鍵複製代碼並前往合作平台（連結自動帶入該城市關鍵字，在東京頁就搜東京）。預設為示範優惠券、連到合作夥伴官方優惠頁；在 Vercel 連接 KV 後，可用後台金鑰（`COUPONS_ADMIN_TOKEN`）經 [api/coupons.js](api/coupons.js) 管理「站方即時優惠」，支援全站／指定國家／指定城市的適用範圍。
- **🎲 隨機探索**：城市太多選擇困難？首頁與每個城市頁底部都有「隨機探索」按鈕，在 1016 個城市裡隨機跳到一個驚喜目的地。

- **怎麼去**：選出發地（台北/高雄/香港/新加坡/首爾）與月份 → 航班估價，附 Skyscanner / Google Flights 即時查價連結
- **攻略地圖**：Leaflet 互動地圖，景點列表與地圖雙向連動，每個景點可一鍵開 Google Maps
- **住宿行情**：三種等級每晚參考價 + 推薦住宿區 + Booking / Agoda / Airbnb 查價連結
- **預算估算器**：人數 × 天數 × 住宿等級 × 旅遊風格 → 即時總預算與分項圖表
- **照片牆**：自動抓取維基百科真實景點照片（免 API key）

目前收錄 **175 個目的地、1016 個區域**，涵蓋全球每一個國家（**每國至少 2 座城市**），橫跨亞洲、歐洲、非洲、美洲、大洋洲：
- **亞洲** — 東亞 8、東南亞 11、南亞 8、中亞 5、高加索與安納托利亞 5、中東 13
- **歐洲 39** — 西歐、南歐、北歐、中東歐（含俄烏白）、巴爾幹
- **非洲 49** — 北非、西非、中非、東非、南部非洲五大分區全收錄
- **美洲 30** — 北美 4、中美洲與加勒比海 14、南美洲 12
- **大洋洲 7** — 澳、紐、斐濟、巴紐、索羅門、萬那杜、新喀里多尼亞

熱門國家深度收錄：日本 27 區、美國 22 區、韓國 22 區、中國 20 區、台灣 19 區、泰國／義大利／印尼各 16-17 區、法國／西班牙／印度／德國／英國／希臘各 15 區、越南／菲律賓各 13 區。

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

驗證資料完整性：`node scripts/validate_data.mjs`（檢查 175 個目的地、1016 區的欄位結構與 GeoJSON 對應）。

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

## 🔌 接真實機票／住宿價格（選用，已內建）

航班與住宿預設為**示範估價**（依市場行情 + 淡旺季係數模擬，數值穩定可重現）。本專案**已內建真實價格串接**——只要在 Vercel 設定免費 API 金鑰即可自動啟用，沒設定時照常用示範估價（不影響運作）。

> ⚠️ **為什麼不爬蟲？** Skyscanner / Booking / Agoda / Airbnb / Trip.com / 多數台灣 OTA 的服務條款都禁止自動擷取（Booking、Ryanair 等曾對爬蟲提告），且技術上被嚴格封鎖、資料脆弱。它們提供**官方 Affiliate／合作 API**，用官方管道才是合法、穩定、還能賺分潤的做法。

**架構**：金鑰放在 Vercel Serverless Functions（[api/flights.js](api/flights.js)、[api/hotels.js](api/hotels.js)）的伺服器端環境變數，**不外洩、不踩 CORS**；前端（[src/services/flightsApi.js](src/services/flightsApi.js)、[src/services/hotelsApi.js](src/services/hotelsApi.js)）呼叫這兩個端點，拿到即時報價就顯示「🟢 即時票價／房價」，否則優雅回退示範估價。Provider 邏輯在 [api/_providers.js](api/_providers.js)，支援兩家、可用環境變數切換：

| Provider | 提供 | 申請 |
| --- | --- | --- |
| **Travelpayouts** | 機票即時價（Aviasales）+ 飯店價（Hotellook）+ Booking/Agoda/Trip 分潤連結 | [travelpayouts.com](https://www.travelpayouts.com/) |
| **Amadeus Self-Service** | 官方免費 tier，真實機票 + 飯店 offer | [developers.amadeus.com](https://developers.amadeus.com/) |

**啟用方式**：在 Vercel → Settings → Environment Variables 設定（見 [.env.example](.env.example)）：

```
PRICE_PROVIDER=travelpayouts          # 或 amadeus
TRAVELPAYOUTS_TOKEN=你的token          # Travelpayouts 路線
# 或
AMADEUS_CLIENT_ID=...                  # Amadeus 路線
AMADEUS_CLIENT_SECRET=...
```

> 本機 `npm run dev` 不會跑 serverless functions，所以本機一律顯示示範估價；部署到 Vercel 後、設好金鑰才會切換成即時資料。Airbnb 已關閉新夥伴 API（僅邀請制），故住宿維持深連結到搜尋頁。

## ➕ 新增國家／區域

在 `src/data/` 新增一個國家檔（照抄 `japan.js` 的結構），然後在 `src/data/index.js` 對應的 `GROUPS` 分組加入即可——地球上的國家會自動亮起、導覽選單與目的地總覽自動出現。`admin` 欄位必須與 GeoJSON 的 `ADMIN` 屬性一字不差（可用 `node scripts/validate_data.mjs` 驗證）。
