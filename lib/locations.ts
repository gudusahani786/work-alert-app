// Location data: Country > Region (Do / City / State) > City / District
// Naya shehar jodna ho to bas yahan add kar do, baaki app khud update ho jayega.

export const REMOTE = 'Remote'

const seoul = ['Jongno-gu','Jung-gu','Yongsan-gu','Seongdong-gu','Gwangjin-gu','Dongdaemun-gu','Jungnang-gu','Seongbuk-gu','Gangbuk-gu','Dobong-gu','Nowon-gu','Eunpyeong-gu','Seodaemun-gu','Mapo-gu','Yangcheon-gu','Gangseo-gu','Guro-gu','Geumcheon-gu','Yeongdeungpo-gu','Dongjak-gu','Gwanak-gu','Seocho-gu','Gangnam-gu','Songpa-gu','Gangdong-gu']
const busan = ['Jung-gu','Seo-gu','Dong-gu','Yeongdo-gu','Busanjin-gu','Dongnae-gu','Nam-gu','Buk-gu','Haeundae-gu','Saha-gu','Geumjeong-gu','Gangseo-gu','Yeonje-gu','Suyeong-gu','Sasang-gu','Gijang-gun']

export const LOCATIONS: Record<string, Record<string, string[]>> = {
  'South Korea': {
    Seoul: seoul,
    Busan: busan,
    Daegu: ['Jung-gu','Dong-gu','Seo-gu','Nam-gu','Buk-gu','Suseong-gu','Dalseo-gu','Dalseong-gun'],
    Incheon: ['Jung-gu','Dong-gu','Michuhol-gu','Yeonsu-gu','Namdong-gu','Bupyeong-gu','Gyeyang-gu','Seo-gu','Ganghwa-gun','Ongjin-gun'],
    Gwangju: ['Dong-gu','Seo-gu','Nam-gu','Buk-gu','Gwangsan-gu'],
    Daejeon: ['Dong-gu','Jung-gu','Seo-gu','Yuseong-gu','Daedeok-gu'],
    Ulsan: ['Jung-gu','Nam-gu','Dong-gu','Buk-gu','Ulju-gun'],
    Sejong: ['Sejong City'],
    'Gyeonggi-do': ['Suwon','Seongnam','Goyang','Yongin','Bucheon','Ansan','Anyang','Namyangju','Hwaseong','Pyeongtaek','Uijeongbu','Siheung','Gimpo','Paju','Gwangmyeong','Gwacheon','Guri','Osan','Icheon','Yangju','Hanam','Uiwang','Gunpo','Anseong','Yeoju','Dongducheon','Pocheon','Gapyeong-gun','Yangpyeong-gun','Yeoncheon-gun'],
    'Gangwon-do': ['Chuncheon','Wonju','Gangneung','Sokcho','Donghae','Samcheok','Taebaek','Pyeongchang-gun','Jeongseon-gun','Hongcheon-gun','Hoengseong-gun'],
    'Chungcheongbuk-do': ['Cheongju','Chungju','Jecheon','Eumseong-gun','Jincheon-gun','Okcheon-gun','Boeun-gun','Goesan-gun','Yeongdong-gun','Jeungpyeong-gun','Danyang-gun'],
    'Chungcheongnam-do': ['Cheonan','Asan','Gongju','Seosan','Boryeong','Nonsan','Dangjin','Gyeryong','Hongseong-gun','Yesan-gun','Taean-gun','Buyeo-gun','Seocheon-gun','Cheongyang-gun','Geumsan-gun'],
    'Jeollabuk-do': ['Jeonju','Gunsan','Iksan','Jeongeup','Namwon','Gimje','Wanju-gun','Jinan-gun','Muju-gun','Jangsu-gun','Imsil-gun','Sunchang-gun','Gochang-gun','Buan-gun'],
    'Jeollanam-do': ['Mokpo','Yeosu','Suncheon','Naju','Gwangyang','Damyang-gun','Gokseong-gun','Gurye-gun','Goheung-gun','Boseong-gun','Hwasun-gun','Jangheung-gun','Gangjin-gun','Haenam-gun','Yeongam-gun','Muan-gun','Hampyeong-gun','Yeonggwang-gun','Jangseong-gun','Wando-gun','Jindo-gun','Sinan-gun'],
    'Gyeongsangbuk-do': ['Pohang','Gumi','Gyeongju','Andong','Gimcheon','Yeongju','Yeongcheon','Sangju','Mungyeong','Gyeongsan','Uiseong-gun','Cheongsong-gun','Yeongyang-gun','Yeongdeok-gun','Cheongdo-gun','Goryeong-gun','Seongju-gun','Chilgok-gun','Yecheon-gun','Bonghwa-gun','Uljin-gun','Ulleung-gun'],
    'Gyeongsangnam-do': ['Changwon','Gimhae','Jinju','Yangsan','Geoje','Tongyeong','Sacheon','Miryang','Namhae-gun','Hadong-gun','Sancheong-gun','Hamyang-gun','Geochang-gun','Hapcheon-gun','Uiryeong-gun','Haman-gun','Changnyeong-gun','Goseong-gun'],
    Jeju: ['Jeju City','Seogwipo'],
  },
  Nepal: {
    'Koshi Province': ['Biratnagar','Dharan','Itahari','Birtamod','Ilam'],
    'Madhesh Province': ['Janakpur','Birgunj','Kalaiya','Jaleshwar'],
    'Bagmati Province': ['Kathmandu','Lalitpur','Bhaktapur','Hetauda','Bharatpur','Banepa','Dhulikhel'],
    'Gandaki Province': ['Pokhara','Baglung','Gorkha','Damauli'],
    'Lumbini Province': ['Butwal','Bhairahawa','Nepalgunj','Tulsipur','Ghorahi'],
    'Karnali Province': ['Birendranagar','Jumla'],
    'Sudurpashchim Province': ['Dhangadhi','Mahendranagar','Tikapur'],
  },
  India: {
    Maharashtra: ['Mumbai','Pune','Nagpur','Nashik'],
    Karnataka: ['Bengaluru','Mysuru'],
    'Tamil Nadu': ['Chennai','Coimbatore'],
    Telangana: ['Hyderabad'],
    'West Bengal': ['Kolkata'],
    Gujarat: ['Ahmedabad','Surat'],
    'Uttar Pradesh': ['Lucknow','Noida','Varanasi'],
    Delhi: ['New Delhi'],
    Rajasthan: ['Jaipur'],
    Kerala: ['Kochi','Thiruvananthapuram'],
    Bihar: ['Patna'],
  },
  Japan: {
    Tokyo: ['Shinjuku','Shibuya','Minato','Chiyoda'],
    Osaka: ['Osaka City'],
    Kyoto: ['Kyoto City'],
    Fukuoka: ['Fukuoka City'],
  },
  'United States': {
    California: ['Los Angeles','San Francisco','San Diego'],
    'New York': ['New York City'],
    Texas: ['Austin','Houston','Dallas'],
    Washington: ['Seattle'],
    Illinois: ['Chicago'],
  },
}

export const COUNTRIES = Object.keys(LOCATIONS)

export function regionsOf(country: string): string[] {
  return Object.keys(LOCATIONS[country] ?? {})
}

export function citiesOf(country: string, region: string): string[] {
  return LOCATIONS[country]?.[region] ?? []
}

export type LocationParts = {
  country?: string | null
  region?: string | null
  city?: string | null
}

// "Naju, Jeollanam-do, South Korea"
export function composeLocation(p: LocationParts): string {
  if (p.country === REMOTE) return REMOTE
  return [p.city, p.region, p.country].filter(Boolean).join(', ')
}

// Server-side check: region/city us country ke andar hi hone chahiye
export function validateLocation(
  p: { country: string; region: string; city: string },
  opts: { required: boolean; allowRemote: boolean },
): string | null {
  const { country, region, city } = p
  if (!country) return opts.required ? 'Please select a country.' : null
  if (country === REMOTE) return opts.allowRemote ? null : 'Remote is not allowed here.'
  if (!LOCATIONS[country]) return 'Invalid country.'
  if (opts.required && !region) return 'Please select a region.'
  if (region && !LOCATIONS[country][region]) return 'Invalid region.'
  if (city && !(LOCATIONS[country][region] ?? []).includes(city)) return 'Invalid city.'
  return null
}
