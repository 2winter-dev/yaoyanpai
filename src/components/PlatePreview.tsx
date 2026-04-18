import type { PlateChars, PlateKind } from '../lib/plate'
import PlateCN from './plates/PlateCN'
import PlateHK from './plates/PlateHK'
import PlateMO from './plates/PlateMO'
import PlateCrossBorder from './plates/PlateCrossBorder'
import PlateTW from './plates/PlateTW'
import PlateMotoCN from './plates/PlateMotoCN'

export default function PlatePreview(props: {
  kind: PlateKind
  chars: PlateChars
  sealed?: boolean
  animateKey?: number
  className?: string
}) {
  if (props.kind === 'blue' || props.kind === 'green_small' || props.kind === 'green_large') {
    return (
      <PlateCN
        kind={props.kind}
        chars={props.chars}
        sealed={props.sealed}
        animateKey={props.animateKey}
        className={props.className}
      />
    )
  }

  if (props.kind === 'moto') {
    return (
      <PlateMotoCN
        chars={props.chars}
        sealed={props.sealed}
        animateKey={props.animateKey}
        className={props.className}
      />
    )
  }

  if (props.kind === 'hk') {
    return (
      <PlateHK
        chars={props.chars}
        sealed={props.sealed}
        animateKey={props.animateKey}
        className={props.className}
      />
    )
  }

  if (props.kind === 'mo') {
    return (
      <PlateMO
        chars={props.chars}
        sealed={props.sealed}
        animateKey={props.animateKey}
        className={props.className}
      />
    )
  }

  if (props.kind === 'tw') {
    return (
      <PlateTW
        chars={props.chars}
        sealed={props.sealed}
        animateKey={props.animateKey}
        className={props.className}
      />
    )
  }

  return (
    <PlateCrossBorder
      kind={props.kind as 'yuez_hk' | 'yuez_mo' | 'fv' | 'fu' | 'ft'}
      chars={props.chars}
      sealed={props.sealed}
      animateKey={props.animateKey}
      className={props.className}
    />
  )
}
