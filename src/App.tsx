import React, { useState, useCallback } from 'react'
import lz4 from 'lz4js'
import './App.css'
import './table.css'
import { open, TimeUtil } from 'rosbag'
import { useDropzone } from 'react-dropzone'
let topics_all = {}

const App = (props: any) => {
  const onDrop = useCallback((acceptedFiles) => {
    const files = acceptedFiles
    parseBag(files)
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop })
  const [topicCounter, setTopicCounter] = useState<any>()
  const [isDragedFile, setIsDragedFile] = useState<boolean>(true)

  const [bagMetadata, setBagMetadata] = useState<{ startTime: any; endTime: any; duration: number }>(undefined)
  const [topicNameList, setTopicNameList] = useState<string[]>([])

  const [progress, setProgress] = useState<number>(0)
  const [tpoicSum, setTopicSum] = useState<number>(0)
  const [msgDefinitions, setMsgDefinitions] = useState<Map<string, string[]>>(new Map())

  const process = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    parseBag(files)
  }

  const parseBag = async (files) => {
    setIsDragedFile(false)
    setTopicNameList([])
    setMsgDefinitions(new Map())
    topics_all = {}

    if (files.length === 0) {
      return
    }
    const bag = await open(files[0])
    let sum = (bag.endTime.sec - bag.startTime.sec) * 500 + parseInt(((bag.endTime.sec - bag.startTime.sec) / 2000000) as any)
    setTopicSum(sum)
    setBagMetadata({
      startTime: bag.startTime,
      endTime: bag.endTime,
      duration: TimeUtil.compare(bag.endTime, bag.startTime),
    })

    const msgTypes = new Map<string, string[]>()

    interface Connection {
      topic: string
      type: string
      messageDefinition: string
      callerid: string
      md5sum: string
    }
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
        const { topic, chunkOffset, totalChunks, timestamp } = res
        topics.add(topic)
        // 取 500 HZ 的数据
        // (timestamp.sec - bag.startTime.sec) * 500  秒 * 500
        // ((timestamp.nsec - bag.startTime.nsec) / 2000000) 纳秒除以 500
        let num = (timestamp.sec - bag.startTime.sec) * 500 + parseInt(((timestamp.nsec - bag.startTime.nsec) / 2000000) as any)

        if (topics_all[topic]) {
          let temp = topics_all[topic]
          if (temp[temp.length - 1] !== num) {
            temp.push(num)
            topics_all[topic] = temp
          }
        } else {
          topics_all[topic] = [num]
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
    setTopicNameList(Array.from(topics).sort())
  }

  return (
    <div>
      <div style={{ display: 'none', width: '100%' }}>
        <div className="file">
          CHOOSE BAG:
          <input type="file" accept=".bag" onChange={process}></input>
        </div>
      </div>
      {isDragedFile ? (
        <div {...getRootProps()} className="dragFile">
          <input {...getInputProps()} onChange={process} />
          {isDragActive ? <p>可以</p> : <p>拖入 rosbag 文件</p>}
        </div>
      ) : (
        <>
          {bagMetadata && (
            <div className="baginfo">
              <div style={{ height: '80px' }}>
                <div className="metadata">
                  <hr />
                  <div>
                    <b>Start Time:</b>
                    <FormatedDateTime datetime={bagMetadata.startTime}></FormatedDateTime>
                  </div>
                  <div>
                    <b>End Time: </b>
                    <FormatedDateTime datetime={bagMetadata.endTime}></FormatedDateTime>
                  </div>
                  <div>
                    <b>Duration: </b>
                    {bagMetadata.duration}s
                  </div>
                  <hr />
                </div>
              </div>
              {progress < 100 ? (
                <div style={{ padding: '20px' }}>{progress}%</div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th></th>
                      <th>Topic Name</th>
                      <th>Caller</th>
                      <th>Definition</th>
                      <th>Count</th>
                      <th>Frequency</th>
                      {/* <th>Distribution</th> */}
                    </tr>
                  </thead>
                  <tbody>
                    {topicNameList &&
                      topicNameList.map((t) => (
                        <tr id={t}>
                          <td>
                            <input type="checkbox"></input>
                          </td>
                          <td>{t}</td>
                          <td>{msgDefinitions.get(t)[0] ?? 'N/A'}</td>
                          <td>
                            <span className="msgDefinition" title={msgDefinitions.get(t)[3]}>
                              {msgDefinitions.get(t)[1]}
                            </span>
                            <small title={msgDefinitions.get(t)[2]}>({msgDefinitions.get(t)[2].slice(0, 8)})</small>
                          </td>
                          <td>{topicCounter[t]}</td>
                          <td>
                            {Math.round(topicCounter[t] / bagMetadata.duration)}
                            <small>Hz</small>
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
                              {topics_all[t].map((str) => (
                                <i style={{ position: 'absolute', float: 'left', left: `${str * 0.08}px`, width: '0.08px', height: `20px`, backgroundColor: 'blue' }} />
                              ))}
                            </div> */}
                          {/* </td> */}
                        </tr>
                      ))}
                  </tbody>
                </table>
              )}

              <h2>todo message distribution graph</h2>
            </div>
          )}
        </>
      )}
    </div>
  )
}

const FormatedDateTime: React.FC<{
  datetime: { sec: number; nsec: number }
}> = (props) => <span>{`${new Date(props.datetime.sec * 1000).toLocaleString()} sec: ${props.datetime.sec} nsec: ${props.datetime.nsec}`}</span>

export default App
