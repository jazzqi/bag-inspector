import lz4 from 'lz4js'
import React, { useCallback, useEffect, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import Switch from 'react-switch'
import { open, TimeUtil } from 'rosbag'
import styles from './App.module.scss'
import Timeline from './components/timeline-echarts'

// import { intersection } from 'lodash'
import './table.css'

import Select from 'react-select'
import BagMeta from './components/bag-meta'
import { Table as TopicInfoTable } from './components/table'
import { Connection } from './types'
import { calculateTimestamp, convertTimestampToMillisecond } from './utils'

const App = (props: any) => {
  const onDrop = useCallback((acceptedFiles) => {
    const files = acceptedFiles
    parseContent(files)
  }, [])

  const { getRootProps, getInputProps, isDragActive: isDragDropActivated } = useDropzone({ onDrop })
  const [isDragedFile, setIsDragedFile] = useState<boolean>(true)

  const [metainfo, setMetainfo] = useState<{
    fileName: string
    fileSize: number
    startTime: any
    endTime: any
    duration: number
    actualStartTime?: any
    actualEndTime?: any
    actualDuration?: number
  }>(undefined)
  const [userSelectedTopicList, setUserSelectedTopicList] = useState<string[]>([])
  const [filteredTopicList, setFilteredTopicList] = useState<string[]>([])

  const [readProgress, setReadProgress] = useState<number>(0)
  // const [topicDefinitions, setTopicDefinitions] = useState<Map<string, string[]>>(new Map())

  // type SERIES = Array<Uint32Array>
  type TIME_SERIES = Uint32Array

  const [topicInfoList, setTopicInfoList] = useState<any[]>([])
  const [topicArray, setTopicArray] = useState<Array<string>>([])
  const [messageTimeSeries, setMessageTimeSeries] = useState<TIME_SERIES>(new Uint32Array())
  const [neoMessageTimeSeries, setNeoMessageTimeSeries] = useState<NEO_TIME_SERIES>(new Map())
  const [toggle, setToggle] = useState<boolean>(true)

  const readBag = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    parseContent(files)
  }

  const clearState = () => {
    setIsDragedFile(false)
    setTopicInfoList([])
    // setTopicDefinitions(new Map())
  }

  const parseContent = async (files) => {
    clearState()

    if (files.length === 0) return

    const fileHandler = await open(files[0])

    setMetainfo({
      fileName: files[0].name,
      fileSize: files[0].size,
      startTime: fileHandler.startTime, // 名义起始时间戳
      endTime: fileHandler.endTime, // 名义起始时间戳
      duration: TimeUtil.compare(fileHandler.endTime, fileHandler.startTime),
    })

    /**
     * Table 内容
     */
    const table_columns = [
      // {topic_name, caller, definition, count, frequency},
    ]

    /**
     * Topic 列表
     */
    let topic_array: Array<string> = []
    /**
     * 消息时序
     */
    // const msg_time_series: Array<number> = []
    /**
     * todo 新的 消息时序
     */
    const neo_msg_time_series: NEO_TIME_SERIES = new Map()

    Object.entries<Connection>(fileHandler.connections).forEach(([_, v]) => {
      if (!table_columns.find((i) => i.topic_name === v.topic)) {
        table_columns.push({
          topic_name: v.topic,
          caller: v.callerid,
          md5: v.md5sum,
          md5_sliced: v.md5sum.slice(0, 8),
          type: v.type,
          definition: v.messageDefinition,
          count: 0,
          frequency: 0,
        })
        topic_array.push(v.topic)
      } else {
        console.log('REPEATED TOPIC', v.topic)
      }
    })

    setTopicInfoList(table_columns)

    const actual_timespan = [
      { sec: Date.now() * 2, nsec: 0 },
      { sec: 1, nsec: 1 },
    ]

    topic_array.sort()

    await fileHandler.readMessages(
      {
        noParse: true,
        decompress: {
          lz4: (buffer: Buffer, size: number) => Buffer.from(lz4.decompress(buffer)),
        },
      },
      (res) => {
        const { topic, chunkOffset, totalChunks, timestamp: msg_timestamp } = res

        if (TimeUtil.compare(msg_timestamp, actual_timespan[0]) < 0) {
          actual_timespan[0] = msg_timestamp
        }
        if (TimeUtil.compare(msg_timestamp, actual_timespan[1]) > 0) {
          actual_timespan[1] = msg_timestamp
        }

        const relative_timestamp = calculateTimestamp(actual_timespan[0], msg_timestamp)
        const relative_timestamp_ms = convertTimestampToMillisecond(relative_timestamp)

        // const topic_index = topic_array.findIndex((i) => i === topic)

        // todo here should only push timestamp to per topic array
        // msg_time_series.push(topic_index, relative_timestamp_ms)

        if (neo_msg_time_series[topic]) {
          neo_msg_time_series[topic].push(relative_timestamp_ms)
        } else {
          neo_msg_time_series[topic] = [relative_timestamp_ms]
        }

        setReadProgress(Math.round(((chunkOffset + 1) / totalChunks) * 100))
      }
    )

    for (const key in neo_msg_time_series) {
      neo_msg_time_series[key] = new Uint32Array(neo_msg_time_series[key])
    }

    console.log(neo_msg_time_series)

    setTopicArray(topic_array)
    // setMessageTimeSeries(new Uint32Array(msg_time_series))
    setNeoMessageTimeSeries(neo_msg_time_series)

    setMetainfo({
      fileName: files[0].name,
      fileSize: files[0].size,
      startTime: fileHandler.startTime, // 名义起始时间戳
      endTime: fileHandler.endTime, // 名义起始时间戳
      duration: TimeUtil.compare(fileHandler.endTime, fileHandler.startTime),
      actualStartTime: actual_timespan[0], // 实际起始时间戳
      actualEndTime: actual_timespan[1], // 实际起始时间戳
      actualDuration: TimeUtil.compare(actual_timespan[1], actual_timespan[0]),
    })

    console.log(topic_array)
  }

  // 恢复 localstorage 中存储的 topics
  useEffect(() => {
    const selected_topics = JSON.parse(localStorage.getItem('selected-topics')) || []
    if (selected_topics && selected_topics.length && selected_topics.length > 0) {
      setUserSelectedTopicList(selected_topics)
      setFilteredTopicList(selected_topics)
    } else {
      setFilteredTopicList(topicArray)
    }
  }, [topicArray])

  const handleChange = (selected_options) => {
    const selected_topics = selected_options.map((i) => i.value)
    localStorage.setItem('selected-topics', JSON.stringify(selected_topics))
    setUserSelectedTopicList(selected_topics)

    if (selected_options.length > 0) {
      setFilteredTopicList(selected_topics)
    } else {
      setFilteredTopicList(topicInfoList.map((i) => i.topic_name))
    }
  }

  let filteredMap = topicInfoList
  if (userSelectedTopicList.length > 0) {
    filteredMap = topicInfoList.filter((i) => userSelectedTopicList.includes(i.topic_name))
  }

  // if change anything like topics update the value
  //

  return (
    <div>
      <input type="file" accept=".bag, .mfbag" onChange={readBag} style={{ display: 'none' }}></input>

      {isDragedFile ? (
        <div {...getRootProps()} className={`${styles.dragdrop} ${isDragDropActivated && styles.activated}`}>
          <input {...getInputProps()} onChange={readBag} />
          {isDragDropActivated ? <div></div> : <div>拖入 rosbag 文件</div>}
        </div>
      ) : (
        <>
          {metainfo && (
            <div className={styles.baginfo}>
              <hr />
              {readProgress === 100 && (
                <>
                  <label className={styles.switch}>
                    <Switch
                      height={14}
                      width={28}
                      handleDiameter={12}
                      uncheckedIcon={false}
                      checkedIcon={true}
                      onChange={() => {
                        setToggle(!toggle)
                      }}
                      checked={!toggle}
                    />
                    <span> Timeline Mode</span>
                  </label>
                </>
              )}
              <div className={styles.pd}>
                <BagMeta metainfo={metainfo}></BagMeta>
              </div>
              <hr />
              <div className={styles.pd}>
                {readProgress < 100 && (
                  <div className={styles.pd}>
                    <em>{readProgress}%</em>
                  </div>
                )}

                {readProgress === 100 && topicInfoList && (
                  <Select
                    isMulti
                    name="selected_topics"
                    options={topicInfoList.map((t) => ({ value: t.topic_name, label: t.topic_name }))}
                    defaultValue={userSelectedTopicList.map((t) => ({ value: t, label: t }))}
                    className="basic-multi-select"
                    classNamePrefix="select"
                    onChange={handleChange}
                    placeholder="Filter Topic Name"
                    blurInputOnSelect={false}
                    closeMenuOnSelect={false}
                  />
                )}

                {readProgress === 100 && toggle && (
                  <>
                    <TopicInfoTable messageSeries={neoMessageTimeSeries} filteredMap={filteredMap} metainfo={metainfo}></TopicInfoTable>
                  </>
                )}

                {/* Timeline Component */}
                {readProgress === 100 && !toggle ? <Timeline messageSeries={messageTimeSeries} neoMessageSeries={neoMessageTimeSeries} filteredTopicList={filteredTopicList}></Timeline> : null}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default App

export type NEO_TIME_SERIES = Map<string, Array<number> | Uint32Array>
