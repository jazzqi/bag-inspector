import React from 'react'
import styles from './timeline.module.scss'

const Timeline: React.FC<{ begin?: number; end?: number; duration?: number }> = (props) => {
//   const availWidth = window.screen.availWidth * window.devicePixelRatio
  const availWidth = 1000 * window.devicePixelRatio
  const count = parseInt((Math.random() * availWidth).toString())
  const arr = new Array(count).fill(true)
  const dur = 32.32423  // mock
  const height = 35 * 2
  const scale_mark_x = height - 8 * 2
  const scale_mark_s = height - 4 * 2

  return (
    <svg className={styles.timeline} viewBox={`0 0 ${availWidth} ${height}`} preserveAspectRatio="xMidYMid meet">
      <g className={styles.markGroup}>
        {arr.map((i) => {
          const seed = Math.random() * availWidth
          //   const seed = 0.5 * availWidth
          return <line x1={seed} y1="0" x2={seed} y2={height} stroke={'rgba(0, 0, 255, 0.1)'}></line>
        })}
      </g>
      <g className={styles.scaleGroup}>
        <line x1={0} x2={availWidth} y1={height} y2={height} stroke="black"></line>
        <line x1={1} x2={1} y1={scale_mark_x} y2={height} stroke="black"></line>
        <line x1={360} x2={360} y1={scale_mark_s} y2={height} stroke="black"></line>
        <line x1={960} x2={960} y1={scale_mark_s} y2={height} stroke="black"></line>
        <line x1={1360} x2={1360} y1={scale_mark_s} y2={height} stroke="black"></line>
        <line x1={1919} x2={1919} y1={scale_mark_x} y2={height} stroke="black"></line>
      </g>
    </svg>
  )
}

export default Timeline
