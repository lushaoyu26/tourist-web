import WikiImage from './WikiImage.jsx'

// 照片牆：以區域與景點的維基百科圖片組成的瀑布式相簿。

export default function PhotoWall({ region }) {
  const photos = [
    { wiki: region.wiki, name: region.name, emoji: region.emoji },
    ...region.attractions.map((a) => ({ wiki: a.wiki, name: a.name, emoji: '📸' })),
  ]

  return (
    <div className="photo-wall">
      {photos.map((p, i) => (
        <figure key={p.name} className={`photo-item photo-item-${i % 5}`}>
          <WikiImage wiki={p.wiki} alt={p.name} emoji={p.emoji} />
          <figcaption>{p.name}</figcaption>
        </figure>
      ))}
    </div>
  )
}
