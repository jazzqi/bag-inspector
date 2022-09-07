import lz4 from 'lz4js'
import React, { useCallback, useEffect, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { open, TimeUtil } from 'rosbag'
import styles from './App.module.scss'
import Timeline from './components/timeline-echarts'
// import { intersection } from 'lodash'
import './table.css'

import Select from 'react-select'
import BagMeta from './components/bag-meta'
import { Connection, SORT_BY, SORT_ORDINAL } from './types'
import { SortArrow } from './components/sort-arrow'
import { calculateTimestamp, convertTimestampToMillisecond, openDataURI } from './utils'

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
  const [selectedTopicList, setSelectedTopicList] = useState<string[]>([])

  const [readProgress, setReadProgress] = useState<number>(0)
  // const [topicDefinitions, setTopicDefinitions] = useState<Map<string, string[]>>(new Map())

  const [sortBy, setSortBy] = useState<SORT_BY | undefined>()

  const setSort = useCallback(
    (trigger: string) => {
      if (sortBy && sortBy.by === trigger) {
        if (sortBy.ordinal === SORT_ORDINAL.DESC) {
          setSortBy(undefined)
        } else if (sortBy.ordinal === SORT_ORDINAL.ASC) {
          const newSortBy = { ...sortBy, ordinal: SORT_ORDINAL.DESC }
          setSortBy(newSortBy)
        } else {
          setSortBy({ by: trigger, ordinal: SORT_ORDINAL.ASC })
        }
      } else {
        const newSortBy = { by: trigger, ordinal: SORT_ORDINAL.ASC }
        setSortBy(newSortBy)
      }
    },
    [sortBy]
  )

  type COUNTER = { [key: string]: number }
  // type SERIES = Array<Uint32Array>
  type SERIES = Uint32Array

  const [topicInfoList, setTopicInfoList] = useState<any[]>([])
  const [messageCounter, setMessageCounter] = useState<COUNTER>({})
  const [topicArray, setTopicArray] = useState<Array<string>>([])
  const [messageSeries, setMessageSeries] = useState<SERIES>(new Uint32Array())
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

    // const topicMap = new Map<string, string[]>()
    const columns = [
      // {topic_name, caller, definition, count, frequency},
    ]

    const msg_counter: COUNTER = {}
    let topic_array: Array<string> = []
    const msg_series: Array<number> = []

    Object.entries<Connection>(fileHandler.connections).forEach(([_, v]) => {
      if (!columns.find((i) => i.topic_name === v.topic)) {
        columns.push({
          topic_name: v.topic,
          caller: v.callerid,
          md5: v.md5sum,
          md5_sliced: v.md5sum.slice(0, 8),
          type: v.type,
          definition: v.messageDefinition,
          count: 0,
          frequency: 0,
        })
        msg_counter[v.topic] = 0
        topic_array.push(v.topic)
      } else {
        console.log('REPEATED TOPIC', v.topic)
      }
    })

    setTopicInfoList(columns)

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

        msg_counter[topic] = msg_counter[topic] + 1

        const relative_timestamp = calculateTimestamp(actual_timespan[0], msg_timestamp)
        const relative_timestamp_ms = convertTimestampToMillisecond(relative_timestamp)

        const topic_index = topic_array.findIndex((i) => i === topic)
        // console.log(topic_index, topic)
        msg_series.push(topic_index, relative_timestamp_ms)

        setReadProgress(Math.round(((chunkOffset + 1) / totalChunks) * 100))
      }
    )
    console.log(topic_array)
    setMessageCounter(msg_counter)
    setTopicArray(topic_array)
    setMessageSeries(new Uint32Array(msg_series))
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
  }

  // 恢复 localstorage 中存储的 topics
  useEffect(() => {
    const selected_topics = JSON.parse(localStorage.getItem('selected-topics')) || []
    if (selected_topics && selected_topics.length && selected_topics.length > 0) {
      setSelectedTopicList(selected_topics)
    }
  }, [])

  const handleChange = (selected_options) => {
    const selected_topics = selected_options.map((i) => i.value)
    localStorage.setItem('selected-topics', JSON.stringify(selected_topics))
    setSelectedTopicList(selected_topics)
  }

  let filteredMap = topicInfoList
  if (selectedTopicList.length > 0) {
    filteredMap = topicInfoList.filter((i) => selectedTopicList.includes(i.topic_name))
  }

  // if change anything like topics update the value
  // 

  return (
    <div>
      <input type="file" accept=".bag, .mfbag" onChange={readBag} style={{ display: 'none' }}></input>
      <input
        type="checkbox"
        value="showwheat"
        onClick={() => {
          setToggle(!toggle)
        }}
      />
      {isDragedFile ? (
        <div {...getRootProps()} className={`${styles.dragdrop} ${isDragDropActivated && styles.activated}`}>
          <input {...getInputProps()} onChange={readBag} />
          {isDragDropActivated ? <div>可以</div> : <div>拖入 rosbag 文件</div>}
        </div>
      ) : (
        <>
          {metainfo && (
            <div className={styles.baginfo}>
              <hr />
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
                {readProgress === 100 && toggle && (
                  <>
                    {topicInfoList && (
                      <Select
                        isMulti
                        name="selected_topics"
                        options={topicInfoList.map((t) => ({ value: t.topic_name, label: t.topic_name }))}
                        defaultValue={selectedTopicList.map((t) => ({ value: t, label: t }))}
                        className="basic-multi-select"
                        classNamePrefix="select"
                        onChange={handleChange}
                        placeholder="Filter Topic Name"
                        blurInputOnSelect={false}
                        closeMenuOnSelect={false}
                      />
                    )}
                    <table className={styles.topicsTable}>
                      <thead>
                        <tr>
                          <th align="left">
                            <SortArrow
                              ordinal={sortBy?.by === 'topic_name' ? sortBy.ordinal : undefined}
                              onClick={() => {
                                setSort('topic_name')
                              }}
                            />{' '}
                            &nbsp; Topic Name
                          </th>

                          <th align="left">
                            <SortArrow
                              ordinal={sortBy?.by === 'definition' ? sortBy.ordinal : undefined}
                              onClick={() => {
                                setSort('definition')
                              }}
                            />
                            &nbsp; Definition
                          </th>
                          <th align="left">
                            <SortArrow
                              ordinal={sortBy?.by === 'caller' ? sortBy.ordinal : undefined}
                              onClick={() => {
                                setSort('caller')
                              }}
                            />
                            &nbsp; Caller
                          </th>
                          <th align="right">
                            <SortArrow
                              ordinal={sortBy?.by === 'count' ? sortBy.ordinal : undefined}
                              onClick={() => {
                                setSort('count')
                              }}
                            />
                            &nbsp; Count
                          </th>
                          <th align="right">
                            <SortArrow
                              ordinal={sortBy?.by === 'frequency' ? sortBy.ordinal : undefined}
                              onClick={() => {
                                setSort('frequency')
                              }}
                            />
                            &nbsp; Frequency
                          </th>
                          {/* <th>Distribution</th> */}
                        </tr>
                      </thead>
                      <tbody>
                        {/* sort((a,b)=> a[sortBy] > b[sortBy]) */}
                        {filteredMap.map((t) => (
                          <tr key={t.topic_name} id={t.topic_name} className={styles.row}>
                            <td align="left">{t.topic_name}</td>
                            <td align="left">
                              {/* <a href={`data::text/plain;charset=utf-8,${encodeURIComponent(t.definition)}`} target={`_blank_{t.topic_name}`} rel="noreferrer"> */}
                              <a
                                href="###"
                                onClick={() => {
                                  openDataURI(t.type, `data::text/plain;charset=utf-8,${encodeURIComponent(t.definition)}`)
                                }}
                                title="Click to see raw definition"
                              >
                                {t.type}
                              </a>
                              &nbsp;
                              <small className={styles.hash} title={t.md5}>
                                {t.md5_sliced}
                              </small>
                            </td>
                            <td align="left">{t.caller ?? 'N/A'}</td>
                            <td align="right">{messageCounter[t.topic_name] || 0}</td>
                            <td align="right">
                              {((messageCounter[t.topic_name] || 0) / metainfo.duration).toFixed(1)}
                              <small>Hz</small>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </>
                )}

                {/* Timeline Component */}
                {readProgress === 100 && !toggle ? <Timeline messageSeries={messageSeries} topicArray={topicArray}></Timeline> : null}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default App
