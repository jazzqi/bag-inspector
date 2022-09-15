import lz4 from 'lz4js'
import React, { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { open, TimeUtil } from 'rosbag'

import styles from './App.module.scss'

import Main from './components/main/main'
import { calculateTimestamp, convertTimestampToMillisecond } from './utils'

const App: React.FC = () => {
  const onDrop = useCallback((acceptedFiles) => {
    console.log('drop bag!')
    const files = acceptedFiles
    parseContent(files)
  }, [])

  const readBag = async (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log('read bag!')
    const files = event.target.files
    parseContent(files)
  }

  const { getRootProps, getInputProps, isDragActive: isDragDropActivated } = useDropzone({ onDrop, noClick: true, maxFiles: 1 })

  const [metainfo, setMetainfo] = useState<META_INFO>(undefined)
  const [topicInfos, setTopicInfos] = useState<TOPIC_INFOS>([])
  const [neoMessageTimeSeries, setNeoMessageTimeSeries] = useState<NEO_TIME_SERIES>(new Map())

  const [progress, setProgress] = useState<number>(0)

  const clearState = () => {
    setTopicInfos([])
  }

  const parseContent = async (files) => {
    if (files.length === 0) return

    clearState()

    /**
     * Meta 内容
     */
    let tmp_meta_info: META_INFO = undefined
    /**
     * Table 内容
     */
    const tmp_topic_infos: TOPIC_INFOS = []
    /**
     * 消息的相对结束时间
     */
    let tmp_latest_relative_timestamp_ms: number = 0
    /**
     * 消息时序
     */
    const tmp_neo_msg_time_series: NEO_TIME_SERIES = new Map()

    const fileHandler = await open(files[0])

    tmp_meta_info = {
      fileName: files[0].name,
      fileSize: files[0].size,
      startTime: fileHandler.startTime, // 名义起始时间戳
      endTime: fileHandler.endTime, // 名义起始时间戳
      duration: TimeUtil.compare(fileHandler.endTime, fileHandler.startTime),
      relativeStartTime: 0,
      relativeEndTime: 0,
    }
    setMetainfo(tmp_meta_info)

    // 收集 Topic 信息
    Object.entries<CONNECTION>(fileHandler.connections).forEach(([_, v]) => {
      if (!tmp_topic_infos.find((i) => i.topic_name === v.topic)) {
        tmp_topic_infos.push({
          topic_name: v.topic,
          caller: v.callerid,
          md5: v.md5sum,
          // md5_sliced: v.md5sum.slice(0, 8),
          type: v.type,
          definition: '', //v.messageDefinition,
          count: 0,
          frequency: 0,
        })
      } else {
        console.log('Collected TOPIC', v.topic)
      }
    })

    const absolute_timespan = [
      { sec: Date.now() * 2, nsec: 0 },
      { sec: 1, nsec: 1 },
    ]

    // 收集消息时间戳分布
    await fileHandler.readMessages(
      {
        noParse: true,
        decompress: {
          lz4: (buffer: Buffer, size: number) => Buffer.from(lz4.decompress(buffer)),
        },
      },
      (res) => {
        const { topic, chunkOffset, totalChunks, timestamp: msg_timestamp } = res

        if (TimeUtil.compare(msg_timestamp, absolute_timespan[0]) < 0) {
          absolute_timespan[0] = msg_timestamp
        }
        if (TimeUtil.compare(msg_timestamp, absolute_timespan[1]) > 0) {
          absolute_timespan[1] = msg_timestamp
        }

        const relative_timestamp = calculateTimestamp(absolute_timespan[0], msg_timestamp)
        const relative_timestamp_ms = convertTimestampToMillisecond(relative_timestamp)

        if (tmp_neo_msg_time_series[topic]) {
          tmp_neo_msg_time_series[topic].push(relative_timestamp_ms)
        } else {
          tmp_neo_msg_time_series[topic] = [relative_timestamp_ms]
        }
        if (relative_timestamp_ms > tmp_latest_relative_timestamp_ms) {
          tmp_latest_relative_timestamp_ms = relative_timestamp_ms
        }

        setProgress(Math.round(((chunkOffset + 1) / totalChunks) * 100))
      }
    )

    // 转换为 TypedArray
    for (const key in tmp_neo_msg_time_series) {
      tmp_neo_msg_time_series[key] = new Uint32Array(tmp_neo_msg_time_series[key])
    }

    tmp_meta_info = {
      absoluteStartTime: absolute_timespan[0], // 实际起始时间戳
      absoluteEndTime: absolute_timespan[1], // 实际结束时间戳
      relativeStartTime: 0, // 相对起始时间戳 0
      relativeEndTime: tmp_latest_relative_timestamp_ms, // 相对结束时间戳
      actualDuration: TimeUtil.compare(absolute_timespan[1], absolute_timespan[0]),
      ...tmp_meta_info,
    }
    // todo should persists those data on cloud
    // 要兼容历史数据
    const info = JSON.stringify({
      meta_info: tmp_meta_info,
      topic_infos: tmp_topic_infos,
    })

    // localStorage.setItem('tmp_neo_msg_time_series', tmp_neo_msg_time_series)
    // 存储
    localStorage.setItem('info', info)
    // write arraybufffer

    setMetainfo(tmp_meta_info)
    setTopicInfos(tmp_topic_infos.map((i) => ({ ...i, md5_sliced: i.md5.slice(0, 8) })))
    setNeoMessageTimeSeries(tmp_neo_msg_time_series)
  }

  return (
    <div>
      {/* <input type="file" accept=".bag, .mfbag" onChange={readBag} style={{ display: 'none' }}></input> */}

      <div {...getRootProps()} className={styles.dragdropContainer}>
        <input {...getInputProps()} onChange={readBag} />

        {!metainfo && (
          <div className={`${styles.dragdropZone} ${isDragDropActivated && styles.activated}`}>
            <div>Drag and drop rosbag</div>
          </div>
        )}

        <Main metainfo={metainfo} progress={progress} topicInfos={topicInfos} neoMessageTimeSeries={neoMessageTimeSeries}></Main>
      </div>
    </div>
  )
}

export default App
