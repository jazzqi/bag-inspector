import lz4 from 'lz4js'
import prettyBytes from 'pretty-bytes'
import React, { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { open, TimeUtil } from 'rosbag'
import styles from './App.module.scss'
import Timeline from './components/timeline'
import './table.css'

import Select from 'react-select'
// import { colourOptions } from '../data';

let topic_data_map = {}

const App = (props: any) => {
  const onDrop = useCallback((acceptedFiles) => {
    const files = acceptedFiles
    parseBag(files)
  }, [])

  const { getRootProps, getInputProps, isDragActive: isDragDropActivated } = useDropzone({ onDrop })
  const [topicCounter, setTopicCounter] = useState<any>()
  const [isDragedFile, setIsDragedFile] = useState<boolean>(true)
  const [name, setName] = useState<string>('')
  const [size, setSize] = useState<number>(0)
  // const [topicCounter, set] = useState<any>()

  const [metaData, setMetaData] = useState<{ startTime: any; endTime: any; duration: number }>(undefined)
  const [topicList, setTopicList] = useState<string[]>([])

  const [progress, setProgress] = useState<number>(0)
  const [msgDefinitions, setMsgDefinitions] = useState<Map<string, string[]>>(new Map())

  const process = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    parseBag(files)
  }

  // useEffect(() => {
  //   setTimeout(() => {
  //     // parseBag(bag)
  //   }, 1000)
  // }, [])

  const clearState = () => {
    setIsDragedFile(false)
    setTopicList([])
    setMsgDefinitions(new Map())
    topic_data_map = {}
  }

  const parseBag = async (files) => {
    console.log(files)
    clearState()

    if (files.length === 0) {
      return
    }
    const bag = await open(files[0])
    setMetaData({
      startTime: bag.startTime,
      endTime: bag.endTime,
      duration: TimeUtil.compare(bag.endTime, bag.startTime),
    })

    setName(files[0].name)
    setSize(files[0].size)

    const msgTypes = new Map<string, string[]>()

    Object.entries<Connection>(bag.connections).forEach(([_, v]) => {
      msgTypes.set(v.topic, [v.callerid, v.type, v.md5sum, v.messageDefinition])
    })

    setMsgDefinitions(msgTypes)
    const topics = new Set<string>()
    const counter = {}

    await bag.readMessages(
      {
        noParse: true,
        decompress: {
          lz4: (buffer: Buffer, size: number) => {
            const buff = new Buffer(lz4.decompress(buffer))
            return buff
          },
        },
      },
      (res) => {
        const { topic, chunkOffset, totalChunks, timestamp: msg_ts } = res
        topics.add(topic)
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

        topics.add(topic)
        if (counter[topic]) {
          counter[topic] = counter[topic] + 1
        } else {
          counter[topic] = 1
        }

        setProgress(Math.round(((chunkOffset + 1) / totalChunks) * 100))
      }
    )
    setTopicCounter(counter)
    setTopicList(Array.from(topics).sort())
  }

  return (
    <div>
      <input type="file" accept=".bag" onChange={process} style={{ display: 'none' }}></input>
      {isDragedFile ? (
        <div {...getRootProps()} className={`${styles.dragdrop} ${isDragDropActivated && styles.activated}`}>
          <input {...getInputProps()} onChange={process} />
          {isDragDropActivated ? <div>可以</div> : <div>拖入 rosbag 文件</div>}
        </div>
      ) : (
        <>
          {metaData && (
            <div className={styles.baginfo}>
              {/*  */}
              <hr />
              <table>
                <tbody>
                  <tr>
                    <td colSpan={2}>Add param_aggregator information</td>
                  </tr>
                  <tr>
                    <th align="right">Name:</th>
                    <td>{name}</td>
                  </tr>
                  <tr>
                    <th align="right">Size:</th>
                    <td>
                      <div title={`${size} Bytes`}>{prettyBytes(size, { maximumFractionDigits: 2 })}</div>
                    </td>
                  </tr>
                  <tr>
                    <th align="right">Begin:</th>
                    <td>
                      <FormatedDateTime datetime={metaData.startTime}></FormatedDateTime>,&nbsp;<FormatedTimestamp datetime={metaData.startTime}></FormatedTimestamp>
                    </td>
                  </tr>
                  <tr>
                    <th align="right">End: </th>
                    <td>
                      <FormatedDateTime datetime={metaData.endTime}></FormatedDateTime>,&nbsp;<FormatedTimestamp datetime={metaData.endTime}></FormatedTimestamp>
                    </td>
                  </tr>
                  <tr>
                    <th align="right">Duration: </th>
                    <td>
                      {metaData.duration}
                      <small>s</small>
                    </td>
                  </tr>
                </tbody>
              </table>
              <hr />
              {/*  */}
              {progress < 100 && (
                <div style={{ padding: '20px' }}>
                  <em>{progress}%</em>
                </div>
              )}
              {progress === 100 && (
                <>
                  {topicList && (
                    // <select>
                    //   {topicList.map((t) => (
                    //     <option value={t}>{t}</option>
                    //   ))}
                    // </select>
                    <Select
                      //
                      defaultValue={topicList.map((t)=>({value: t, label: t}))}
                      isMulti
                      name="selected_topics"
                      // options={topicList}
                      options={topicList.map((t) => ({ value: t, label: t }))}
                      className="basic-multi-select"
                      // classNamePrefix="select"
                    />
                  )}
                  <table className={styles.topicsTable}>
                    <thead>
                      <tr>
                        <th>
                          {/* indeterminate */}
                          <input type="checkbox"></input>
                        </th>
                        <th align="left">Topic Name</th>
                        <th align="left">Caller</th>
                        <th align="left">Definition</th>
                        <th align="right">Count</th>
                        <th align="right">Frequency</th>
                        {/* <th>Distribution</th> */}
                      </tr>
                    </thead>
                    <tbody>
                      {topicList &&
                        topicList.map((t) => (
                          <tr id={t} className={styles.row}>
                            <td align="center">
                              <input type="checkbox"></input>
                            </td>
                            <td align="left">{t}</td>
                            <td align="left">{msgDefinitions.get(t)[0] ?? 'N/A'}</td>
                            <td align="left">
                              <span className={styles.msgDefinition} title={msgDefinitions.get(t)[3]}>
                                {msgDefinitions.get(t)[1]}
                              </span>
                              <small className={styles.hash} title={msgDefinitions.get(t)[2]}>
                                ({msgDefinitions.get(t)[2].slice(0, 8)})
                              </small>
                            </td>
                            <td align="right">{topicCounter[t]}</td>
                            <td align="right">
                              {Math.round(topicCounter[t] / metaData.duration)}
                              <small>Hz</small>
                            </td>
                            <Timeline></Timeline>
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
              {/*  */}
              <div>{/* <Timeline></Timeline> */}</div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

const FormatedDateTime: React.FC<{
  datetime: { sec: number; nsec: number }
}> = (props) => <span title={new Date(props.datetime.sec * 1000).toLocaleString()}>{new Date(props.datetime.sec * 1000).toISOString()}</span>

const FormatedTimestamp: React.FC<{
  datetime: { sec: number; nsec: number }
}> = (props) => (
  <span>
    <span>
      {props.datetime.sec}
      <small title="second">sec</small>
    </span>
    ,&nbsp;
    <span>
      {props.datetime.nsec}
      <small title="nanosecond">nsec</small>
    </span>
  </span>
)

interface Connection {
  topic: string
  type: string
  messageDefinition: string
  callerid: string
  md5sum: string
}

export default App
