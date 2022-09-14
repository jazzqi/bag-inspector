import lz4 from 'lz4js'
import React, { useCallback, useEffect, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { open, TimeUtil } from 'rosbag'
import ReactSwitch from 'react-switch'
import Select from 'react-select'

import BagMetaTable from './components/bag-meta-table'
import TopicInfoTable from './components/topic-info-table'
import Timeline from './components/timeline-echarts'

import styles from './App.module.scss'

import { calculateTimestamp, convertTimestampToMillisecond } from './utils'

import './table.css'

const Switch = ReactSwitch as any

const App = (props: any) => {
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
  const [userSelectedTopicList, setUserSelectedTopicList] = useState<string[]>([])
  const [filteredTopicList, setFilteredTopicList] = useState<string[]>([])
  const [toggleTimelineMode, setToggleTimelineMode] = useState<boolean>(true)

  const clearState = () => {
    setTopicInfos([])
  }

  const parseContent = async (files) => {
    if (files.length === 0) return

    clearState()

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

    setMetainfo({
      fileName: files[0].name,
      fileSize: files[0].size,
      startTime: fileHandler.startTime, // 名义起始时间戳
      endTime: fileHandler.endTime, // 名义起始时间戳
      duration: TimeUtil.compare(fileHandler.endTime, fileHandler.startTime),
      relativeStartTime: 0,
      relativeEndTime: 0,
    })

    // 收集 Topic 信息
    Object.entries<CONNECTION>(fileHandler.connections).forEach(([_, v]) => {
      if (!tmp_topic_infos.find((i) => i.topic_name === v.topic)) {
        tmp_topic_infos.push({
          topic_name: v.topic,
          caller: v.callerid,
          md5: v.md5sum,
          md5_sliced: v.md5sum.slice(0, 8),
          type: v.type,
          definition: v.messageDefinition,
          count: 0,
          frequency: 0,
        })
      } else {
        console.log('REPEATED TOPIC', v.topic)
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

    // todo should persists those data on cloud
    setMetainfo({
      fileName: files[0].name,
      fileSize: files[0].size,
      startTime: fileHandler.startTime, // 名义起始时间戳
      endTime: fileHandler.endTime, // 名义起始时间戳
      duration: TimeUtil.compare(fileHandler.endTime, fileHandler.startTime),
      absoluteStartTime: absolute_timespan[0], // 实际起始时间戳
      absoluteEndTime: absolute_timespan[1], // 实际结束时间戳
      relativeStartTime: 0, // 相对起始时间戳 0
      relativeEndTime: tmp_latest_relative_timestamp_ms, // 相对结束时间戳
      actualDuration: TimeUtil.compare(absolute_timespan[1], absolute_timespan[0]),
    })
    setTopicInfos(tmp_topic_infos)
    setNeoMessageTimeSeries(tmp_neo_msg_time_series)
  }

  // 恢复 localstorage 中存储的 topics
  useEffect(() => {
    const selected_topics = JSON.parse(localStorage.getItem('selected-topics')) || []
    if (selected_topics && selected_topics.length && selected_topics.length > 0) {
      setUserSelectedTopicList(selected_topics)
      setFilteredTopicList(selected_topics)
    } else {
      setFilteredTopicList(topicInfos.map((i) => i.topic_name))
    }
  }, [topicInfos])

  // 处理用户筛选 topic
  const handleSelectChange = (selected_options) => {
    const selected_topics = selected_options.map((i) => i.value)
    localStorage.setItem('selected-topics', JSON.stringify(selected_topics))
    setUserSelectedTopicList(selected_topics)

    if (selected_options.length > 0) {
      setFilteredTopicList(selected_topics)
    } else {
      setFilteredTopicList(topicInfos.map((i) => i.topic_name))
    }
  }

  let filteredTopicInfos = topicInfos
  if (userSelectedTopicList.length > 0) {
    filteredTopicInfos = topicInfos.filter((i) => userSelectedTopicList.includes(i.topic_name))
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

        <>
          {metainfo && (
            <div className={styles.baginfo}>
              <>
                <hr />
                {progress === 100 && (
                  <>
                    <label className={styles.switch}>
                      <Switch
                        height={14}
                        width={28}
                        handleDiameter={12}
                        uncheckedIcon={false}
                        checkedIcon={true}
                        onChange={() => {
                          setToggleTimelineMode(!toggleTimelineMode)
                        }}
                        checked={!toggleTimelineMode}
                      />
                      <span> Timeline Mode</span>
                    </label>
                  </>
                )}
                <div className={styles.pd}>
                  <BagMetaTable metainfo={metainfo}></BagMetaTable>
                </div>
              </>
              <hr />
              <div className={styles.pd}>
                {progress < 100 && (
                  <div className={styles.pd}>
                    <em>{progress}%</em>
                  </div>
                )}

                {progress === 100 && topicInfos && (
                  <Select
                    isMulti
                    name="selected_topics"
                    options={topicInfos.map((t) => ({ value: t.topic_name, label: t.topic_name }))}
                    defaultValue={userSelectedTopicList.map((t) => ({ value: t, label: t }))}
                    className="basic-multi-select"
                    classNamePrefix="select"
                    onChange={handleSelectChange}
                    placeholder="Filter Topic Name"
                    blurInputOnSelect={false}
                    closeMenuOnSelect={false}
                  />
                )}

                {progress === 100 && toggleTimelineMode && (
                  <>
                    <TopicInfoTable messageSeries={neoMessageTimeSeries} filteredTopicInfos={filteredTopicInfos} metainfo={metainfo}></TopicInfoTable>
                  </>
                )}

                {/* Timeline Component */}
                {progress === 100 && !toggleTimelineMode ? <Timeline maxTimestamp={metainfo.relativeEndTime} neoMessageSeries={neoMessageTimeSeries} filteredTopicList={filteredTopicList}></Timeline> : null}
              </div>
            </div>
          )}
        </>
      </div>
    </div>
  )
}

export default App
