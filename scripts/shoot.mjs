// 開發輔助腳本：用系統 Chrome 對指定頁面截圖並收集 console 錯誤
// 用法：node scripts/shoot.mjs <url> <輸出檔> [等待毫秒] [捲動位置]
import puppeteer from 'puppeteer-core'

const [url, out, waitMs = '4000', scrollY = '0'] = process.argv.slice(2)

const browser = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: 'new',
  args: ['--enable-unsafe-swiftshader', '--hide-scrollbars', '--window-size=1440,900'],
  defaultViewport: { width: 1440, height: 900 },
})

const page = await browser.newPage()
const logs = []
page.on('console', (msg) => {
  if (['error', 'warning'].includes(msg.type())) logs.push(`[${msg.type()}] ${msg.text()}`)
})
page.on('pageerror', (err) => logs.push(`[pageerror] ${err.message}`))

await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 })
await new Promise((r) => setTimeout(r, Number(waitMs)))
if (Number(scrollY) > 0) {
  await page.evaluate((y) => window.scrollTo(0, y), Number(scrollY))
  await new Promise((r) => setTimeout(r, 1200))
}
await page.screenshot({ path: out })
console.log('saved:', out)
if (logs.length) console.log(logs.slice(0, 20).join('\n'))
await browser.close()
