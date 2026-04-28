'use client'

const NETWORK_LOGOS_IMAGEKIT = {
  MTN: 'https://ik.imagekit.io/xs2qmlcz4a/762bca19-1c1e-4259-baec-42732b1a71e8.jpeg',
  Glo: 'https://ik.imagekit.io/xs2qmlcz4a/c0d0befa-fbc5-4aa5-8599-6dee3ff46074.jpeg?updatedAt=1773710291719',
  Airtel: 'https://ik.imagekit.io/xs2qmlcz4a/Airtel%20Nigeria,%20We\'ve%20got%20you%20covered!.jpeg',
  '9mobile': 'https://ik.imagekit.io/xs2qmlcz4a/a2f2094e-d34e-4565-aae2-caead8b6a2d7.jpeg',
}

const NETWORK_LOGOS_DATA = {
  MTN: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/363626242-rBdgomkgtOMLfkDzQnGdyi7hj8KqMC.png',
  Glo: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/543724522-BFrD8xRMXoODvmSGYgmNtxtdIWNhB4.png',
  Airtel: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/310824042-EQvhgU84dsiLhqgJHpvFjMpPwk5r4L.png',
  '9mobile': 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/2125146808-0Hh3X6Ls4H9FiSup84yFTJgTN0fITE.png',
}

const NETWORK_LOGOS_AIRTIME = {
  MTN: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/1445124671-C7H3UNXD6gyAJSKidQr3Q7JEeo5XJx.png',
  Glo: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/42956634-nOjllh52FNYREDYTf03gDOtne94gwJ.jpg',
  Airtel: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/1978024544-1ZeyeoeytXpZgqsiA9JxNHTtwq6ssJ.png',
  '9mobile': 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/1278367722-Z4x8KeGQMdLmbhtx0YDANy81gaZY7R.png',
}

interface NetworkLogoProps {
  network: string
  size: 'tab' | 'confirm' | 'receipt' | 'small'
  active?: boolean
  page?: 'data' | 'airtime' | 'recharge'
}

export function NetworkLogo({ network, size, active, page = 'airtime' }: NetworkLogoProps) {
  // Select logo URLs based on page type
  let logoUrl = ''
  if (page === 'data') {
    logoUrl = NETWORK_LOGOS_DATA[network as keyof typeof NETWORK_LOGOS_DATA]
  } else if (page === 'airtime' || page === 'recharge') {
    logoUrl = NETWORK_LOGOS_AIRTIME[network as keyof typeof NETWORK_LOGOS_AIRTIME]
  } else {
    logoUrl = NETWORK_LOGOS_IMAGEKIT[network as keyof typeof NETWORK_LOGOS_IMAGEKIT]
  }

  // For data, airtime, and recharge pages with circular logos, use img tag
  if (page === 'data' || page === 'airtime' || page === 'recharge') {
    if (size === 'tab') {
      return (
        <img
          src={logoUrl}
          alt={network}
          style={{
            width: '72px',
            height: '72px',
            minWidth: '72px',
            minHeight: '72px',
            borderRadius: '50%',
            objectFit: 'cover',
            objectPosition: 'center',
            display: 'block',
            flexShrink: 0,
          }}
        />
      )
    }

    if (size === 'small') {
      return (
        <img
          src={logoUrl}
          alt={network}
          style={{
            width: '18px',
            height: '18px',
            minWidth: '18px',
            minHeight: '18px',
            borderRadius: '50%',
            objectFit: 'cover',
            objectPosition: 'center',
            display: 'block',
            flexShrink: 0,
          }}
        />
      )
    }

    if (size === 'confirm') {
      return (
        <img
          src={logoUrl}
          alt={network}
          style={{
            width: '48px',
            height: '48px',
            minWidth: '48px',
            minHeight: '48px',
            borderRadius: '50%',
            objectFit: 'cover',
            objectPosition: 'center',
            display: 'block',
            flexShrink: 0,
          }}
        />
      )
    }

    // receipt size
    return (
      <img
        src={logoUrl}
        alt={network}
        style={{
          width: '56px',
          height: '56px',
          minWidth: '56px',
          minHeight: '56px',
          borderRadius: '50%',
          objectFit: 'cover',
          objectPosition: 'center',
          display: 'block',
          flexShrink: 0,
          filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.12))',
        }}
      />
    )
  }

  // Fallback for other uses - use background-image
  if (size === 'tab') {
    return (
      <div
        style={{
          width: '72px',
          height: '72px',
          minWidth: '72px',
          minHeight: '72px',
          borderRadius: '50%',
          backgroundImage: `url(${logoUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          flexShrink: 0,
        }}
      />
    )
  }

  if (size === 'confirm') {
    return (
      <div
        style={{
          width: '48px',
          height: '48px',
          minWidth: '48px',
          minHeight: '48px',
          borderRadius: '50%',
          backgroundImage: `url(${logoUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          flexShrink: 0,
        }}
      />
    )
  }

  // receipt size
  return (
    <div
      style={{
        width: '56px',
        height: '56px',
        minWidth: '56px',
        minHeight: '56px',
        borderRadius: '50%',
        backgroundImage: `url(${logoUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        flexShrink: 0,
        filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.12))',
      }}
    />
  )
}
