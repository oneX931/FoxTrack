const MAX_SIZE = 256
const QUALITY = 0.85

export function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

/** Downscales/crops an image to a square JPEG data URL small enough to store as an avatar. */
export async function prepareAvatarImage(file) {
  const dataUrl = await readFileAsDataUrl(file)
  const image = await new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Не удалось прочитать изображение'))
    img.src = dataUrl
  })

  const side = Math.min(image.width, image.height)
  const sx = (image.width - side) / 2
  const sy = (image.height - side) / 2
  const size = Math.min(MAX_SIZE, side)

  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  ctx.drawImage(image, sx, sy, side, side, 0, 0, size, size)

  return canvas.toDataURL('image/jpeg', QUALITY)
}
