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
import { Connection, SORT_BY, SORT_ORDINAL } from './types'

let topic_data_map = {}

const Arrow = (props: { ordinal: SORT_ORDINAL | undefined; onClick: () => void }) => {
  // ▶
  // const icon = props.ordinal === SORT_ORDINAL.DESC ? '⯅' : '⯆'
  let ordinalStyle = ''

  if (props.ordinal === SORT_ORDINAL.ASC) {
    ordinalStyle = styles.asc
  } else if (props.ordinal === SORT_ORDINAL.DESC) {
    ordinalStyle = styles.desc
  } else {
    ordinalStyle = ''
  }
  //
  const icon = '▶'
  return (
    <a className={`${styles.arrow} ${props.ordinal && styles.enableSort} ${ordinalStyle}`} href="##" onClick={props.onClick}>
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
  const [isDragedFile, setIsDragedFile] = useState<boolean>(true)
  const [fileName, setFileName] = useState<string>('')
  const [fileSize, setFileSize] = useState<number>(0)

  const [bagMeta, setBagMeta] = useState<{ startTime: any; endTime: any; duration: number }>(undefined)
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

  const [topicInfoList, setTopicInfoList] = useState<any[]>([])
  const [messageNumberCounter, setMessageNumberCounter] = useState<any>({})
  //

  const readBag = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    parseContent(files)
  }

  const clearState = () => {
    setIsDragedFile(false)
    setTopicInfoList([])
    // setTopicDefinitions(new Map())
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

    // const topicMap = new Map<string, string[]>()
    const columns = [
      // {topic_name, caller, definition, count, frequency},
    ]

    Object.entries<Connection>(bag.connections).forEach(([_, v]) => {
      // topicMap.set(v.topic, [v.callerid, v.type, v.md5sum, v.messageDefinition])
      columns.push({
        topic_name: v.topic,
        caller: v.callerid,
        md5: v.md5sum,
        type: v.type,
        definition: v.messageDefinition,
        count: 0,
        frequency: 0,
      })
    })
    // setTopicDefinitions(topicMap)

    setTopicInfoList(columns)
    // setTopicInfoList(Array.from(topic_list).sort())

    // const topic_list = new Set<string>()
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
        // 最高支持 100Hz 可视化分辨率

        // topic_list.add(topic)

        // 取 500 HZ 的数据
        // (timestamp.sec - bag.startTime.sec) * 500  秒 * 500
        // ((timestamp.nsec - bag.startTime.nsec) / 2000000) 纳秒除以 500
        // let num = (msg_ts.sec - bag.startTime.sec) * 500 + parseInt(((msg_ts.nsec - bag.startTime.nsec) / 2000000) as any)

        // if (topic_data_map[topic]) {
        //   let temp = topic_data_map[topic]
        //   if (temp[temp.length - 1] !== num) {
        //     temp.push(num)
        //     topic_data_map[topic] = temp
        //   }
        // } else {
        //   topic_data_map[topic] = [num]
        // }

        // topic_list.add(topic)
        // if (msg_number_counter[topic]) {
        //   msg_number_counter[topic] = msg_number_counter[topic] + 1
        // } else {
        //   msg_number_counter[topic] = 1
        // }

        setReadProgress(Math.round(((chunkOffset + 1) / totalChunks) * 100))
      }
    )
    setMessageNumberCounter(msg_number_counter)
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

  // const filteredMap = topicInfoList && (selectedTopicList.length > 0 ? intersection(topicInfoList, selectedTopicList) : topicInfoList)
  // console.log(filteredMap)
  const filteredMap = topicInfoList.filter((i) => {
    //
    return selectedTopicList.includes(i.topic_name)
  })


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
                    {topicInfoList && (
                      <Select
                        isMulti
                        name="selected_topics"
                        options={topicInfoList.map((t) => ({ value: t, label: t }))}
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
                            <Arrow
                              ordinal={sortBy?.by === 'topic_name' ? sortBy.ordinal : undefined}
                              onClick={() => {
                                // setSortBy({ by: 'topic_name', ordinal: SORT_ORDINAL.DESC })
                                setSort('topic_name')
                              }}
                            />{' '}
                            &nbsp; Topic Name
                          </th>
                          <th align="left">
                            <Arrow
                              ordinal={sortBy?.by === 'caller' ? sortBy.ordinal : undefined}
                              onClick={() => {
                                setSort('caller')
                              }}
                            />
                            &nbsp; Caller
                          </th>
                          <th align="left">
                            <Arrow
                              ordinal={sortBy?.by === 'definition' ? sortBy.ordinal : undefined}
                              onClick={() => {
                                setSort('definition')
                              }}
                            />
                            &nbsp; Definition
                          </th>
                          <th align="right">
                            <Arrow
                              ordinal={sortBy?.by === 'count' ? sortBy.ordinal : undefined}
                              onClick={() => {
                                setSort('count')
                              }}
                            />
                            &nbsp; Count
                          </th>
                          <th align="right">
                            <Arrow
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
                        {filteredMap.map((t) => (
                          <tr id={t.topic_name} className={styles.row}>
                            <td align="left">{t.topic_name}</td>
                            <td align="left">{t.caller ?? 'N/A'}</td>
                            <td align="left">
                              <span className={styles.msgDefinition} title={t.definition}>
                                {t.type}
                              </span>
                              <small className={styles.hash} title={t.md5}>
                                ({t.md5.slice(0, 8)})
                              </small>
                            </td>
                            <td align="right">
                              {messageNumberCounter[t.topic_name]}</td>
                            <td align="right">
                              {Math.round(messageNumberCounter[t.topic_name] / bagMeta.duration)}
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
