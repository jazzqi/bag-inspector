import lz4 from 'lz4js'
import React, { useCallback, useEffect, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { open, TimeUtil } from 'rosbag'
import styles from './App.module.scss'
import Timeline from './components/timeline'
import { intersection } from 'lodash'
import './table.css'

import Select from 'react-select'
import BagMeta from './components/bag-meta'

let topic_data_map = {}

const Arrow = (props: { direction: 'up' | 'down'; onClick: () => void }) => {
  // ▶
  const icon = props.direction === 'up' ? '⯅' : '⯆'
  return (
    <a className={styles.arrow} href="##" onClick={props.onClick}>
      {icon}
    </a>
  )
}

const App = (props: any) => {
  const onDrop = useCallback((acceptedFiles) => {
    const files = acceptedFiles
    parseContent(files)
  }, [])

  const { getRootProps, getInputProps, isDragActive: isDragDropActivated } = useDropzone({ onDrop })
  const [messageNumberCounter, setMessageNumberCounter] = useState<any>()
  const [isDragedFile, setIsDragedFile] = useState<boolean>(true)
  const [fileName, setFileName] = useState<string>('')
  const [fileSize, setFileSize] = useState<number>(0)

  const [bagMeta, setBagMeta] = useState<{ startTime: any; endTime: any; duration: number }>(undefined)
  const [topicList, setTopicList] = useState<string[]>([])
  const [selectedTopicList, setSelectedTopicList] = useState<string[]>([])

  const [readProgress, setReadProgress] = useState<number>(0)
  const [topicDefinitions, setTopicDefinitions] = useState<Map<string, string[]>>(new Map())

  const [sortBy, setSortBy] = useState<SORT_BY | undefined>()

  const readBag = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    parseContent(files)
  }

  const clearState = () => {
    setIsDragedFile(false)
    setTopicList([])
    setTopicDefinitions(new Map())
    topic_data_map = {}
  }

  const parseContent = async (files) => {
    console.log(files)
    clearState()

    if (files.length === 0) return

    const bag = await open(files[0])
    setBagMeta({
      startTime: bag.startTime,
      endTime: bag.endTime,
      duration: TimeUtil.compare(bag.endTime, bag.startTime),
    })
    setFileName(files[0].name)
    setFileSize(files[0].size)

    const topicMap = new Map<string, string[]>()

    Object.entries<Connection>(bag.connections).forEach(([_, v]) => {
      topicMap.set(v.topic, [v.callerid, v.type, v.md5sum, v.messageDefinition])
    })
    setTopicDefinitions(topicMap)

    const topic_list = new Set<string>()
    const msg_number_counter = {}

    await bag.readMessages(
      {
        noParse: true,
        decompress: {
          lz4: (buffer: Buffer, size: number) => Buffer.from(lz4.decompress(buffer)),
        },
      },
      (res) => {
        const { topic, chunkOffset, totalChunks, timestamp: msg_ts } = res
        topic_list.add(topic)
        // 最高支持 100Hz 可视化分辨率

        // 取 500 HZ 的数据
        // (timestamp.sec - bag.startTime.sec) * 500  秒 * 500
        // ((timestamp.nsec - bag.startTime.nsec) / 2000000) 纳秒除以 500
        let num = (msg_ts.sec - bag.startTime.sec) * 500 + parseInt(((msg_ts.nsec - bag.startTime.nsec) / 2000000) as any)

        if (topic_data_map[topic]) {
          let temp = topic_data_map[topic]
          if (temp[temp.length - 1] !== num) {
            temp.push(num)
            topic_data_map[topic] = temp
          }
        } else {
          topic_data_map[topic] = [num]
        }

        topic_list.add(topic)
        if (msg_number_counter[topic]) {
          msg_number_counter[topic] = msg_number_counter[topic] + 1
        } else {
          msg_number_counter[topic] = 1
        }

        setReadProgress(Math.round(((chunkOffset + 1) / totalChunks) * 100))
      }
    )
    setMessageNumberCounter(msg_number_counter)
    setTopicList(Array.from(topic_list).sort())
  }

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

  const filteredMap = topicList && (selectedTopicList.length > 0 ? intersection(topicList, selectedTopicList) : topicList)
  console.log(filteredMap)

  return (
    <div>
      <input type="file" accept=".bag, .mfbag" onChange={readBag} style={{ display: 'none' }}></input>
      {isDragedFile ? (
        <div {...getRootProps()} className={`${styles.dragdrop} ${isDragDropActivated && styles.activated}`}>
          <input {...getInputProps()} onChange={readBag} />
          {isDragDropActivated ? <div>可以</div> : <div>拖入 rosbag 文件</div>}
        </div>
      ) : (
        <>
          {bagMeta && (
            <div className={styles.baginfo}>
              <hr />
              <div className={styles.pd}>
                <BagMeta name={fileName} size={fileSize} startTime={bagMeta.startTime} endTime={bagMeta.endTime} duration={bagMeta.duration}></BagMeta>
              </div>
              <hr />
              <div className={styles.pd}>
                {readProgress < 100 && (
                  <div className={styles.pd}>
                    <em>{readProgress}%</em>
                  </div>
                )}
                {readProgress === 100 && (
                  <>
                    {topicList && (
                      <Select
                        isMulti
                        name="selected_topics"
                        options={topicList.map((t) => ({ value: t, label: t }))}
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
                          {/* <th> */}
                          {/* indeterminate */}
                          {/* <input type="checkbox"></input> */}
                          {/* </th> */}
                          <th align="left">
                            <Arrow
                              direction="down"
                              onClick={() => {
                                setSortBy({ by: 'topic_name', order: SORT_DIRECTION.DESC })
                              }}
                            />
                            Topic Name
                          </th>
                          <th align="left">
                            <Arrow direction="up" onClick={() => {}} /> Caller
                          </th>
                          <th align="left">
                            <Arrow direction="down" onClick={() => {}} /> Definition
                          </th>
                          <th align="right">
                            <Arrow direction="down" onClick={() => {}} /> Count
                          </th>
                          <th align="right">
                            <Arrow direction="down" onClick={() => {}} /> Frequency
                          </th>
                          {/* <th>Distribution</th> */}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredMap.map((t) => (
                            <tr id={t} className={styles.row}>
                              {/* <td align="center">
                              <input type="checkbox"></input>
                            </td> */}
                              <td align="left">{t}</td>
                              <td align="left">{topicDefinitions.get(t)[0] ?? 'N/A'}</td>
                              <td align="left">
                                <span className={styles.msgDefinition} title={topicDefinitions.get(t)[3]}>
                                  {topicDefinitions.get(t)[1]}
                                </span>
                                <small className={styles.hash} title={topicDefinitions.get(t)[2]}>
                                  ({topicDefinitions.get(t)[2].slice(0, 8)})
                                </small>
                              </td>
                              <td align="right">{messageNumberCounter[t]}</td>
                              <td align="right">
                                {Math.round(messageNumberCounter[t] / bagMeta.duration)}
                                <small>Hz</small>
                              </td>
                              <td align="right">
                                <Timeline></Timeline>
                              </td>
                              {/* <td> */}
                              {/* <div
                              style={{
                                position: 'relative',
                                height: `21px`,
                                marginRight: '400px',
                                width: `${tpoicSum * 0.08}px`,
                                backgroundColor: '#D3D3D3',
                              }}
                            >
                              {topic_data_map[t].map((str) => (
                                <i style={{ position: 'absolute', float: 'left', left: `${str * 0.08}px`, width: '0.08px', height: `20px`, backgroundColor: 'blue' }} />
                              ))}
                            </div> */}
                              {/* </td> */}
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default App
