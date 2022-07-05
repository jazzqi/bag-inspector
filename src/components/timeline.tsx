import React from 'react'
import styles from './timeline.module.scss'

const Timeline: React.FC<{ begin?: number; end?: number; duration?: number }> = (props) => {
  const availWidth = window.screen.availWidth
  const count = parseInt((Math.random() * availWidth).toString())
  const arr = new Array(count).fill(true)
  const dur = 32.32423;

  return (
    <svg className={styles.timeline} viewBox={`0 0 ${availWidth} 25`} preserveAspectRatio="xMidYMid meet">
      <g className={styles.markGroup}>
        {arr.map((i) => {
          // const seed = Math.random() * availWidth
          const seed = 0.5 * availWidth
          return <line x1={seed} y1="0" x2={seed} y2="25" stroke={'rgba(0, 0, 255, 0.01)'}></line>
        })}
      </g>
      <g className={styles.scaleGroup}>
        <line x1={0} x2={availWidth} y1="25" y2="25" stroke="black"></line>
        <line x1={1} x2={1} y1="20" y2="25" stroke="black"></line>
        <line x1={960} x2={960} y1="20" y2="25" stroke="black"></line>
        <line x1={1919} x2={1919} y1="20" y2="25" stroke="black"></line>
      </g>
    </svg>
  )
}

export default Timeline
