import React, { Component } from 'react'
import ReactEcharts from 'echarts-for-react'

class Timeline extends Component<{ messageCounter: any; messageSeries: any; messageArray: any }> {
  getOption = () => {
    console.log(this.props.messageCounter)
    // Prime Costs and Prices for ACME Fashion\nCollection "Spring-Summer, 2016"
    // Data from https://playground.anychart.com/gallery/7.12.0/Error_Charts/Marker_Chart

    // const data = [
    //   ['Blouse "Blue Viola"', 101.88, 99.75, 76.75, 116.75, 69.88, 119.88],
    //   ['Dress "Daisy"', 155.8, 144.03, 126.03, 156.03, 129.8, 188.8],
    // ]

    // let count = 1000
    // while (count > 0) {
    //   data.push(['sample', Math.random() * 500, Math.random() * 1000])
    //   count--
    // }

    const data = this.props.messageSeries.map((i) => {
      return ['ts', i[0], i[1], i[2]]
    })

    console.log(data)

    const xAxis = {
      position: 'bottom',
      minorSplitLine: { show: true },
      min: 1660718340,
      max: 1660718355,
      axisLine: { show: true },
      axisLabel: { formatter: '{value} ms' },
      axisTick: { inside: true },
      minorTick: { show: true, inside: true },
      // splitArea: {
      //   show:true
      // },
    }
    const xAxis2 = {
      position: 'top',
      //
      min: 1660718340,
      max: 1660718355,
      axisLine: { show: true },
      axisLabel: { formatter: '{value} ms' },
      axisTick: { inside: true },
      minorTick: { show: true, inside: true },
      // splitArea: {
      //   show:true
      // },
    }

    const option = {
      tooltip: {},
      dataZoom: [{ type: 'slider', top: 5 }, { type: 'slider', id: '12', bottom: 'auto' }, { type: 'inside' }],
      grid: {
        bottom: 75,
        top: 75,
      },
      xAxis: [xAxis, xAxis2],
      yAxis: {
        type: 'category',
        axisLabel: {
          width: 120,
          overflow: 'truncate',
          // align: '',
          fontFamily:'monospace',
          fontSize: '10',
          formatter: (i) => {
            return this.props.messageArray[i]
          },
          inside: false,
        },
      },
      series: [
        {
          type: 'scatter',
          symbol: 'rect',
          symbolSize: [1, 20],
          data: data,
          encode: {
            x: 2,
            y: 1,
            // tooltip: [2, 1, 3, 4, 5, 6],
            itemName: 0,
          },
          itemStyle: {
            color: '#77bef7',
            opacity: 0.6,
          },
        },
      ],
    }
    return option
  }

  render() {
    return <ReactEcharts option={this.getOption()} style={{ height: '1600px', left: 20, top: 20, width: '90vw', background: 'white' }} opts={{ renderer: 'svg' }} />
  }
}

export default React.memo(Timeline)
