import React from 'react'
import Sketch from 'react-p5'
import p5Types from 'p5'

let x = 50
let y = 50

const Timeline: React.FC<{}> = (props) => {
  const setup = (p5: p5Types, canvasParentRef: Element) => {
    // use parent to render the canvas in this ref
    // (without that p5 will render the canvas outside of your component)
    p5.createCanvas(window.innerWidth, window.innerHeight).parent(canvasParentRef)
  }

  const draw = (p5: p5Types) => {
    p5.background(0)
    p5.ellipse(x, y, 70, 70)
    // NOTE: Do not use setState in the draw function or in functions that are executed
    // in the draw function...
    // please use normal variables or class properties for these purposes
    if (x < window.innerWidth) {
      x += 5
    } else {
      x = 0
    }
  }

  return <Sketch setup={setup} draw={draw} />
}

export default Timeline
