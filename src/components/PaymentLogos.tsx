/** Real brand logo tiles for UPI apps and wallets */

type LogoProps = { className?: string; size?: number }

const LOGO_SRC: Record<string, string> = {
  gpay: '/logos/gpay.svg',
  phonepe: '/logos/phonepe.png',
  paytm: '/logos/paytm.svg',
  bhim: '/logos/bhim.svg',
  amazon: '/logos/amazon.svg',
  cred: '/logos/cred.png',
  mobikwik: '/logos/mobikwik.svg',
  freecharge: '/logos/freecharge.png',
  jio: '/logos/jio.png',
}

function BrandImg({ id, size = 28, className }: LogoProps & { id: string }) {
  const src = LOGO_SRC[id]
  if (!src) return null
  return (
    <img
      src={src}
      alt=""
      width={size}
      height={size}
      draggable={false}
      className={['block object-cover select-none', className].filter(Boolean).join(' ')}
      style={{ width: size, height: size }}
    />
  )
}

export function GPayLogo(p: LogoProps) {
  return <BrandImg id="gpay" {...p} />
}
export function PhonePeLogo(p: LogoProps) {
  return <BrandImg id="phonepe" {...p} />
}
export function PaytmLogo(p: LogoProps) {
  return <BrandImg id="paytm" {...p} />
}
export function BhimLogo(p: LogoProps) {
  return <BrandImg id="bhim" {...p} />
}
export function AmazonPayLogo(p: LogoProps) {
  return <BrandImg id="amazon" {...p} />
}
export function CredLogo(p: LogoProps) {
  return <BrandImg id="cred" {...p} />
}
export function MobiKwikLogo(p: LogoProps) {
  return <BrandImg id="mobikwik" {...p} />
}
export function FreechargeLogo(p: LogoProps) {
  return <BrandImg id="freecharge" {...p} />
}
export function JioMoneyLogo(p: LogoProps) {
  return <BrandImg id="jio" {...p} />
}

export const UPI_LOGOS: Record<string, (p: LogoProps) => JSX.Element> = {
  gpay: GPayLogo,
  phonepe: PhonePeLogo,
  paytm: PaytmLogo,
  bhim: BhimLogo,
  amazon: AmazonPayLogo,
  cred: CredLogo,
}

export const WALLET_LOGOS: Record<string, (p: LogoProps) => JSX.Element> = {
  paytm: PaytmLogo,
  phonepe: PhonePeLogo,
  amazon: AmazonPayLogo,
  mobikwik: MobiKwikLogo,
  freecharge: FreechargeLogo,
  jio: JioMoneyLogo,
}
