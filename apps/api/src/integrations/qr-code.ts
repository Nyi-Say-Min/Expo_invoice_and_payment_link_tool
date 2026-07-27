import QRCode from 'qrcode'

export function createQrCodeDataUrl(value: string) {
  return QRCode.toDataURL(value, {
    errorCorrectionLevel: 'M',
    margin: 2,
    width: 320,
  })
}
