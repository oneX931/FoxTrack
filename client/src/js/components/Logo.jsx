import logoMark from '../../assets/logo-160.png'

export function Logo({ withWordmark = true, className = '' }) {
  return (
    <span className={`brand ${className}`.trim()}>
      <img className="brand__mark" src={logoMark} alt="" />
      {withWordmark && <span className="brand__word">FoxTrack</span>}
    </span>
  )
}
