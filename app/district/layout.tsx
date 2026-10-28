import { EB_Garamond, Roboto } from 'next/font/google'

// Roboto is the default for this page; EB Garamond is exposed as a CSS variable for the title
const roboto = Roboto({ subsets: ['latin'], weight: ['400', '500', '700'] })
const ebGaramond = EB_Garamond({ subsets: ['latin'], variable: '--font-eb-garamond' })

export default function DistrictLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className={`${roboto.className} ${ebGaramond.variable}`}>
      {children}
    </div>
  )
}
