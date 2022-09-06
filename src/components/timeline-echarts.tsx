import React, { Component } from 'react'
import 'echarts-gl'
import ReactEcharts from 'echarts-for-react'

class Timeline extends Component<{ messageSeries: any; messageArray: any }> {
  getOption = () => {
    // let count = 1000
    // while (count > 0) {
    //   data.push(['sample', Math.random() * 500, Math.random() * 1000])
    //   count--
    // }

    // const data = this.props.messageSeries.map((i) => {
    //   return new Uint32Array([i[0], i[1]]) // topic, ts
    // })

    const max_timestamp = this.props.messageSeries[this.props.messageSeries.length - 1]

    const data_size = this.props.messageArray.length

    const xAxis = {
      position: 'bottom',
      min: 0,
      max: max_timestamp,
      axisLine: { show: true },
      axisLabel: { formatter: '{value}ms', fontFamily: 'monospace', fontSize: '11', color: 'black' },
      axisTick: { inside: true },
      minorTick: { show: true, inside: true },
      minorSplitLine: { show: true, lineStyle: { color: '#efefef' } },
      splitLine: { show: true, lineStyle: { color: '#e6e6e6' } },
      axisPointer: { show: true, label: { show: true, precision: 0, formatter: '{value}ms' } },
    }
    const xAxis2 = {
      position: 'top',
      //
      min: 0,
      max: max_timestamp,
      axisLine: { show: true },
      axisLabel: { formatter: '{value}ms', fontFamily: 'monospace', fontSize: '11', color: 'black' },
      axisTick: { inside: true },
      minorTick: { show: true, inside: true },
    }

    const option = {
      tooltip: {
        show: true,
        formatter: (p) => {
          if (p.length > 0) {
            return null
          } else {
            const [_, ts] = p.data
            const name = p.name
            return `${name} ${ts} ${this.props.messageArray[name]}<br/><b>${ts}ms</b>`
          }
        },
      },
      dataZoom: [{ type: 'slider', top: 'auto' }, { type: 'slider', id: '12', bottom: 'auto' }, { type: 'inside' }],
      grid: {
        bottom: 75,
        top: 75,
        left: 420,
      },
      xAxis: [xAxis, xAxis2],
      yAxis: {
        type: 'category',
        inverse: true,
        axisTick: { alignWithLabel: true },
        splitArea: { show: true },
        axisPointer: {
          show: true,
          type: 'shadow',
          shadowStyle: {
            shadowColor: 'rgba(0, 0, 0, 0.3)',
            shadowBlur: 1,
          },
          label: { show: false },
        },
        axisLabel: {
          width: 620,
          overflow: 'truncate',
          fontFamily: 'monospace',
          fontSize: '11',
          color: 'black',
          formatter: (i) => this.props.messageArray[i],
          inside: false,
        },
        // data: data,
      },
      series: [
        {
          name: 'scatter',
          type: 'scatter',
          symbol: 'rect',
          large: true,
          symbolSize: [1, 18],
          data: this.props.messageSeries,
          dimensions: [
            { name: 'topic_index', type: 'int' },
            { name: 'timestamp', type: 'int' },
          ],
          encode: {
            x: 'timestamp',
            y: 'topic_index',
          },
          itemStyle: {
            color: '#77bef7',
            opacity: 0.8,
          },
        },
      ],
    }
    return {
      data_size,
      option,
    }
  }

  render() {
    const { option, data_size } = this.getOption()
    return <ReactEcharts option={option} style={{ height: `${data_size * 30 + 150}px`, left: 20, top: 20, width: '90vw', background: 'white' }} opts={{ renderer: 'canvas' }} />
  }
}

export default React.memo(Timeline)
