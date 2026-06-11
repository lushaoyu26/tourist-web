import japan from './japan.js'
import korea from './korea.js'
import thailand from './thailand.js'
import france from './france.js'
import italy from './italy.js'
import iceland from './iceland.js'
// 東亞
import taiwan from './asia/taiwan.js'
import china from './asia/china.js'
import hongkong from './asia/hongkong.js'
import macau from './asia/macau.js'
import mongolia from './asia/mongolia.js'
// 南亞
import india from './asia/india.js'
import srilanka from './asia/srilanka.js'
import maldives from './asia/maldives.js'
import nepal from './asia/nepal.js'
import bhutan from './asia/bhutan.js'
import bangladesh from './asia/bangladesh.js'
import pakistan from './asia/pakistan.js'
// 中亞
import kazakhstan from './asia/kazakhstan.js'
import uzbekistan from './asia/uzbekistan.js'
import kyrgyzstan from './asia/kyrgyzstan.js'
import tajikistan from './asia/tajikistan.js'
import turkmenistan from './asia/turkmenistan.js'
// 西亞與中東
import turkey from './asia/turkey.js'
import georgia from './asia/georgia.js'
import armenia from './asia/armenia.js'
import azerbaijan from './asia/azerbaijan.js'
import cyprus from './asia/cyprus.js'
import uae from './asia/uae.js'
import qatar from './asia/qatar.js'
import oman from './asia/oman.js'
import kuwait from './asia/kuwait.js'
import saudiarabia from './asia/saudiarabia.js'
import jordan from './asia/jordan.js'
// 東南亞
import vietnam from './asia/vietnam.js'
import cambodia from './asia/cambodia.js'
import laos from './asia/laos.js'
import singapore from './asia/singapore.js'
import malaysia from './asia/malaysia.js'
import brunei from './asia/brunei.js'
import indonesia from './asia/indonesia.js'
import philippines from './asia/philippines.js'
import easttimor from './asia/easttimor.js'
// 美洲
import usa from './america/usa.js'
import canada from './america/canada.js'
import peru from './america/peru.js'
import brazil from './america/brazil.js'
import argentina from './america/argentina.js'
import chile from './america/chile.js'
import bolivia from './america/bolivia.js'
// 非洲
import egypt from './africa/egypt.js'
import morocco from './africa/morocco.js'
import kenya from './africa/kenya.js'
import tanzania from './africa/tanzania.js'
import southafrica from './africa/southafrica.js'
// 大洋洲
import australia from './oceania/australia.js'
import newzealand from './oceania/newzealand.js'
// 歐洲
import spain from './europe/spain.js'
import portugal from './europe/portugal.js'
import uk from './europe/uk.js'
import ireland from './europe/ireland.js'
import germany from './europe/germany.js'
import netherlands from './europe/netherlands.js'
import belgium from './europe/belgium.js'
import luxembourg from './europe/luxembourg.js'
import austria from './europe/austria.js'
import switzerland from './europe/switzerland.js'
import czechia from './europe/czechia.js'
import poland from './europe/poland.js'
import hungary from './europe/hungary.js'
import slovakia from './europe/slovakia.js'
import norway from './europe/norway.js'
import sweden from './europe/sweden.js'
import denmark from './europe/denmark.js'
import finland from './europe/finland.js'
import estonia from './europe/estonia.js'
import latvia from './europe/latvia.js'
import lithuania from './europe/lithuania.js'
import greece from './europe/greece.js'
import croatia from './europe/croatia.js'
import slovenia from './europe/slovenia.js'
import romania from './europe/romania.js'
import bulgaria from './europe/bulgaria.js'
import serbia from './europe/serbia.js'
import bosnia from './europe/bosnia.js'
import montenegro from './europe/montenegro.js'
import albania from './europe/albania.js'
import northMacedonia from './europe/north-macedonia.js'
import kosovo from './europe/kosovo.js'
import moldova from './europe/moldova.js'

// 依地理分組（導覽選單與目的地總覽頁共用）
export const GROUPS = [
  { id: 'east-asia', name: '東亞', emoji: '🏯', countries: [japan, korea, taiwan, china, hongkong, macau, mongolia] },
  {
    id: 'southeast-asia',
    name: '東南亞',
    emoji: '🌴',
    countries: [thailand, vietnam, singapore, malaysia, indonesia, philippines, cambodia, laos, brunei, easttimor],
  },
  {
    id: 'south-asia',
    name: '南亞',
    emoji: '🛕',
    countries: [india, srilanka, maldives, nepal, bhutan, bangladesh, pakistan],
  },
  {
    id: 'central-asia',
    name: '中亞',
    emoji: '🐎',
    countries: [kazakhstan, uzbekistan, kyrgyzstan, tajikistan, turkmenistan],
  },
  {
    id: 'middle-east',
    name: '西亞與中東',
    emoji: '🕌',
    countries: [turkey, georgia, armenia, azerbaijan, cyprus, uae, qatar, oman, kuwait, saudiarabia, jordan],
  },
  {
    id: 'west-europe',
    name: '西歐',
    emoji: '🗼',
    countries: [france, uk, ireland, netherlands, belgium, luxembourg, germany, austria, switzerland],
  },
  {
    id: 'south-europe',
    name: '南歐',
    emoji: '🏛️',
    countries: [italy, spain, portugal, greece, croatia, slovenia],
  },
  {
    id: 'north-europe',
    name: '北歐',
    emoji: '🌌',
    countries: [iceland, norway, sweden, denmark, finland, estonia, latvia, lithuania],
  },
  {
    id: 'central-europe',
    name: '中東歐',
    emoji: '🏰',
    countries: [czechia, poland, hungary, slovakia, romania, bulgaria, moldova],
  },
  {
    id: 'balkans',
    name: '巴爾幹',
    emoji: '⛰️',
    countries: [serbia, bosnia, montenegro, albania, northMacedonia, kosovo],
  },
  { id: 'africa', name: '非洲', emoji: '🦁', countries: [egypt, morocco, kenya, tanzania, southafrica] },
  { id: 'north-america', name: '北美洲', emoji: '🗽', countries: [usa, canada] },
  { id: 'south-america', name: '南美洲', emoji: '🗿', countries: [peru, brazil, argentina, chile, bolivia] },
  { id: 'oceania', name: '大洋洲', emoji: '🦘', countries: [australia, newzealand] },
]

export const COUNTRIES = GROUPS.flatMap((g) => g.countries)

// 首頁底部精選快捷
export const FEATURED_IDS = ['japan', 'korea', 'thailand', 'vietnam', 'turkey', 'usa', 'france', 'italy', 'switzerland', 'iceland']

export const COUNTRY_BY_ID = Object.fromEntries(COUNTRIES.map((c) => [c.id, c]))
export const COUNTRY_BY_ADMIN = Object.fromEntries(COUNTRIES.map((c) => [c.admin, c]))

export function getCountry(id) {
  return COUNTRY_BY_ID[id] || null
}

export function getRegion(countryId, regionId) {
  const country = getCountry(countryId)
  if (!country) return { country: null, region: null }
  const region = country.regions.find((r) => r.id === regionId) || null
  return { country, region }
}

// GeoJSON ADMIN 英文名 → 中文（用於地球上尚未收錄攻略的國家）
export const ADMIN_ZH = {
  'United States of America': '美國', Canada: '加拿大', Mexico: '墨西哥', Brazil: '巴西',
  Argentina: '阿根廷', Chile: '智利', Peru: '秘魯', Colombia: '哥倫比亞', Cuba: '古巴',
  Russia: '俄羅斯', Ukraine: '烏克蘭', Belarus: '白俄羅斯',
  China: '中國', Taiwan: '台灣', Mongolia: '蒙古', 'North Korea': '北韓',
  Vietnam: '越南', Laos: '寮國', Cambodia: '柬埔寨', Myanmar: '緬甸',
  Malaysia: '馬來西亞', Indonesia: '印尼', Philippines: '菲律賓', Brunei: '汶萊',
  India: '印度', Nepal: '尼泊爾', Bhutan: '不丹', 'Sri Lanka': '斯里蘭卡',
  Bangladesh: '孟加拉', Pakistan: '巴基斯坦', Kazakhstan: '哈薩克', Uzbekistan: '烏茲別克',
  'Saudi Arabia': '沙烏地阿拉伯', 'United Arab Emirates': '阿聯', Qatar: '卡達',
  Israel: '以色列', Jordan: '約旦', Iran: '伊朗', Iraq: '伊拉克', Egypt: '埃及',
  Turkey: '土耳其', Georgia: '喬治亞', Armenia: '亞美尼亞', Azerbaijan: '亞塞拜然',
  Morocco: '摩洛哥', Tunisia: '突尼西亞', Algeria: '阿爾及利亞', Libya: '利比亞',
  Kenya: '肯亞', Tanzania: '坦尚尼亞', Ethiopia: '衣索比亞', 'South Africa': '南非',
  Namibia: '納米比亞', Botswana: '波札那', Madagascar: '馬達加斯加', Nigeria: '奈及利亞',
  Australia: '澳洲', 'New Zealand': '紐西蘭', 'Papua New Guinea': '巴布亞紐幾內亞',
  Fiji: '斐濟', Greenland: '格陵蘭', Afghanistan: '阿富汗', Syria: '敘利亞',
  Yemen: '葉門', Oman: '阿曼', Kuwait: '科威特',
  Venezuela: '委內瑞拉', Ecuador: '厄瓜多', Bolivia: '玻利維亞',
  Paraguay: '巴拉圭', Uruguay: '烏拉圭', Panama: '巴拿馬', 'Costa Rica': '哥斯大黎加',
  Guatemala: '瓜地馬拉', Honduras: '宏都拉斯', Nicaragua: '尼加拉瓜', Belize: '貝里斯',
  'El Salvador': '薩爾瓦多', 'Dominican Republic': '多明尼加', Haiti: '海地',
  Jamaica: '牙買加', 'Trinidad and Tobago': '千里達', Senegal: '塞內加爾',
  Ghana: '迦納', 'Ivory Coast': '象牙海岸', Cameroon: '喀麥隆', Uganda: '烏干達',
  Rwanda: '盧安達', Zambia: '尚比亞', Zimbabwe: '辛巴威', Mozambique: '莫三比克',
  Angola: '安哥拉', Sudan: '蘇丹', 'South Sudan': '南蘇丹', Somalia: '索馬利亞',
  Chad: '查德', Niger: '尼日', Mali: '馬利', Mauritania: '茅利塔尼亞',
  Kyrgyzstan: '吉爾吉斯', Tajikistan: '塔吉克', Turkmenistan: '土庫曼',
}
