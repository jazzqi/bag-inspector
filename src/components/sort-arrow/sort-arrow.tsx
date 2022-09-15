import React from 'react'
import styles from './sort-arrow.module.scss'

export enum SORT_ORDINAL {
  'ASC' = 'ASC',
  'DESC' = 'DESC',
}

const SortArrow = (props: { ordinal: SORT_ORDINAL | undefined; onClick: () => void }) => {
  // ▶
  // const icon = props.ordinal === SORT_ORDINAL.DESC ? '⯅' : '⯆'
  let ordinalStyle = ''

  if (props.ordinal === SORT_ORDINAL.ASC) {
    ordinalStyle = styles.asc
  } else if (props.ordinal === SORT_ORDINAL.DESC) {
    ordinalStyle = styles.desc
  } else {
    ordinalStyle = ''
  }
  //
  const icon = '▶'
  return (
    <a className={`${styles.arrow} ${props.ordinal && styles.enableSort} ${ordinalStyle}`} href="##" onClick={props.onClick}>
      {icon}
    </a>
  )
}

export { SortArrow }


