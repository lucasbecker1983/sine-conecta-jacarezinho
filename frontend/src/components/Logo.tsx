import { useState } from 'react'
import sineLogo from '../assets/logos/sine-logo-fullhd.png'

type Props = {
  className?: string
}

export function Logo({ className = '' }: Props) {
  const [failed, setFailed] = useState(false)
  if (failed) {
    return <div className={`flex items-center justify-center rounded-md border border-emerald-200 bg-white px-4 py-3 text-sm font-bold text-emerald-900 ${className}`}>SINE Jacarezinho</div>
  }
  return <img src={sineLogo} alt="Logotipo do SINE Jacarezinho" className={className} onError={() => setFailed(true)} />
}
