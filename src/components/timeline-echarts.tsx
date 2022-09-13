import React, { Component } from 'react'
import 'echarts-gl'
import ReactEcharts from 'echarts-for-react'

class Timeline extends Component<{ neoMessageSeries: any; messageSeries: any; filteredTopicList: any }> {
  getOption = () => {
    console.log(this.props.messageSeries)
    console.log(this.props.filteredTopicList)
    //

    const max_timestamp = this.props.messageSeries[this.props.messageSeries.length - 1]

    const y_size = this.props.filteredTopicList.length
    const y_axis_data = this.props.filteredTopicList

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
      // data: this.props.neoMessageSeries,
    }
    const xAxis2 = {
      position: 'top',
      // use min and max
      min: 0,
      max: max_timestamp,
      axisLine: { show: true },
      axisLabel: { formatter: '{value}ms', fontFamily: 'monospace', fontSize: '11', color: 'black' },
      axisTick: { inside: true },
      minorTick: { show: true, inside: true },
    }

    // const data = this.props.filteredTopicList.map((topic) => this.props.neoMessageSeries[topic])

    // console.log(this.props.filteredTopicList)
    // console.log(data)

    // const xx = this.props.filteredTopicList.map((topic) => {
    //   return [topic, ...(this.props.neoMessageSeries[topic] || [])]
    // })
    // console.log(xx)

    let buffer_length = 0
    this.props.filteredTopicList.forEach((topic) => {
      // if (this.props.neoMessageSeries[topic]) {
      buffer_length += this.props.neoMessageSeries[topic]?.length || 0
      // }
    })
    console.log(buffer_length)

    const buffer_data = new Uint32Array(buffer_length * 2)
    let buffer_write_pointer = 0

     this.props.filteredTopicList.forEach((topic, index) => {
      if (this.props.neoMessageSeries[topic]) {
        // const one_dimension_data = new Uint32Array(this.props.neoMessageSeries[topic].length * 2)
        console.log(topic, index)
        this.props.neoMessageSeries[topic].forEach((ts, index2) => {
          // one_dimension_data[index2 * 2] = index
          // one_dimension_data[index2 * 2 + 1] = ts
          buffer_data[buffer_write_pointer] = index
          buffer_data[buffer_write_pointer+1] = ts
          buffer_write_pointer += 2
        })
      }
    })
    console.log(buffer_length)
    console.log(buffer_write_pointer)
    console.log(buffer_data)

    // maybe we should use legency data and series
    const option = {
      // dataset: {
      //   sourceHeader: 'auto',
      //   source: xx,
      // },
      tooltip: {
        show: true,
        formatter: (p) => {
          if (p.length > 0) {
            return null
          } else {
            const [, ts] = p.data
            return `${p.name}<br/><b>${ts}ms</b>`
          }
        },
      },
      dataZoom: [
        //
        { type: 'slider', id: '11', top: 'auto', labelFormatter: '{value}ms', showDataShadow: false },
        { type: 'slider', id: '12', bottom: 'auto', labelFormatter: '{value}ms', showDataShadow: false },
        { type: 'inside' },
      ],
      grid: {
        bottom: 75,
        top: 75,
        left: 420,
      },
      xAxis: [xAxis, xAxis2],
      yAxis: {
        type: 'category',
        data: y_axis_data,
        // name:'topic_index',
        inverse: true,
        axisTick: { alignWithLabel: true },
        splitArea: { show: true },
        axisLine: { show: false, lineStyle: { color: '#eaeaea' } },
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
          inside: false,
          // formatter: (i) => {
          //   console.log('axiy', i)
          //   return i
          // },
        },
      },
      // 使用多个 series 分别显示不同 topic
      series: [
        {
          name: 'scatter',
          type: 'scatter',
          symbol: 'rect',
          seriesLayoutBy: 'column',
          large: true,
          symbolSize: [1, 18],
          data: buffer_data,
          // data: this.props.messageSeries,
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
      y_size,
      option,
    }
  }

  render() {
    const { option, y_size } = this.getOption()
    const height = y_size * 30 + 150
    return <ReactEcharts option={option} style={{ height: `${height}px`, left: 20, top: 20, bottom: 20, width: '90vw', background: 'white' }} opts={{ renderer: 'canvas' }} />
  }
}

export default React.memo(Timeline)
