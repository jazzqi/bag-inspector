import { Binary, deserialize, serialize } from 'bson'
import { Buffer } from 'buffer'
import lz4 from 'lz4js'
import React, { useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { open, TimeUtil } from 'rosbag'
import * as rosbag from 'rosbag'

import styles from './App.module.scss'

import Inspector from './components/inspector/inspector'
import { calculateTimestamp, convertTimestampToMillisecond } from './utils'
import { decode, encode } from 'cbor-x'
;(window as any).rosbag = rosbag

const downloadFile = (content: string | Blob, filename: string) => {
  if (localStorage.getItem('export')) {
    const invisible_link = document.createElement('a')
    invisible_link.href = typeof content === 'string' ? content : URL.createObjectURL(content)
    invisible_link.download = filename
    invisible_link.click()
    // Revoke object URL if it was created from a Blob
    if (!(typeof content === 'string')) {
      URL.revokeObjectURL(invisible_link.href)
    }
  }
}

const App: React.FC = () => {
  const onDrop = (acceptedFiles: File[]) => {
    console.log('drop bag!')
    const files = acceptedFiles
    parseContent(files)
  }

  const readBag = async (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log('read bag!')
    if (event.target.files) {
      parseContent(Array.from(event.target.files))
    } else {
      parseContent([])
    }
  }

  // todo implement fetch bag from oss
  const fetchRemoteBag = async (src: string) => {
    // Not implemented yet - this is a placeholder for future OSS integration
  }

  const { getRootProps, getInputProps, isDragActive: isDragDropActivated } = useDropzone({ onDrop, noClick: true, maxFiles: 1 })

  const [metainfo, setMetainfo] = useState<META_INFO | undefined>(undefined)
  const [topicInfos, setTopicInfos] = useState<TOPIC_INFOS>([])
  const [neoMessageTimeSeries, setNeoMessageTimeSeries] = useState<NEO_TIME_SERIES<Uint32Array>>({})
  const [messageDefinition, setMessageDefinition] = useState<MSG_DEFINITION_INFOS>({})

  const [progress, setProgress] = useState<number>(0)

  const clearState = () => {
    setTopicInfos([])
  }

  const parseContent = async (files: File[]) => {
    if (files.length === 0) return

    clearState()

    /**
     * Meta 内容
     */
    let tmp_meta_info: META_INFO | undefined = undefined
    /**
     * TOPIC 列表
     */
    const tmp_topic_infos: TOPIC_INFOS = []
    /**
     * MSG 格式定义列表
     */
    const tmp_message_definition: MSG_DEFINITION_INFOS = {}
    /**
     * 消息的相对结束时间
     */
    let tmp_latest_relative_timestamp_ms: number = 0
    /**
     * 消息时序
     */
    const tmp_neo_msg_time_series_array: NEO_TIME_SERIES<Array<number>> = {}
    /**
     * 消息时序
     */
    const tmp_neo_msg_time_series_typed_array: NEO_TIME_SERIES<Uint32Array> = {}
    /**
     * 消息时序
     */
    const tmp_neo_msg_time_series_bson: NEO_TIME_SERIES<Binary> = {}

    const fileHandler = await open(files[0])

    ;(window as any).bagfile = files[0]

    console.log(files[0])

    tmp_meta_info = {
      fileName: files[0].name,
      fileSize: files[0].size,
      startTime: fileHandler.startTime ?? { sec: 0, nsec: 0 }, // 名义起始时间戳
      endTime: fileHandler.endTime ?? { sec: 0, nsec: 0 }, // 名义起始时间戳
      duration: TimeUtil.compare(fileHandler.endTime ?? { sec: 0, nsec: 0 }, fileHandler.startTime ?? { sec: 0, nsec: 0 }),
      relativeStartTime: 0,
      relativeEndTime: 0,
    } as META_INFO
    setMetainfo(tmp_meta_info)

    // 收集 Topic 信息
    Object.entries(fileHandler.connections as { [key: string]: CONNECTION }).forEach(([_, v]) => {
      if (!tmp_topic_infos.find((i) => i.topic_name === v.topic)) {
        tmp_topic_infos.push({
          topic_name: v.topic,
          caller: v.callerid,
          md5: v.md5sum,
          type: v.type,
          count: 0,
          frequency: 0,
        })
      } else {
        console.log('Collected TOPIC', v.topic)
      }
      if (!tmp_message_definition[v.md5sum]) {
        tmp_message_definition[v.md5sum] = v.messageDefinition
      }
    })

    console.log('msg definition', tmp_message_definition)
    setMessageDefinition(tmp_message_definition)

    let blob2 = new Blob([JSON.stringify(tmp_message_definition)], {
      type: 'application/json', //将会被放入到blob中的数组内容的MIME类型
    })
    let objectUrl2 = URL.createObjectURL(blob2) //生成一个url
    downloadFile(objectUrl2, 'message-definition.json')

    const actual_timespan = [
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

        if (TimeUtil.compare(msg_timestamp, actual_timespan[0]) < 0) {
          actual_timespan[0] = msg_timestamp
        }
        if (TimeUtil.compare(msg_timestamp, actual_timespan[1]) > 0) {
          actual_timespan[1] = msg_timestamp
        }

        const relative_timestamp = calculateTimestamp(actual_timespan[0], msg_timestamp)
        const relative_timestamp_ms = convertTimestampToMillisecond(relative_timestamp)

        if (tmp_neo_msg_time_series_array[topic]) {
          tmp_neo_msg_time_series_array[topic].push(relative_timestamp_ms)
        } else {
          tmp_neo_msg_time_series_array[topic] = [relative_timestamp_ms]
        }
        if (relative_timestamp_ms > tmp_latest_relative_timestamp_ms) {
          tmp_latest_relative_timestamp_ms = relative_timestamp_ms
        }

        setProgress(Math.round(((chunkOffset + 1) / totalChunks) * 100))
      }
    )

    tmp_meta_info = {
      ...tmp_meta_info,
      actualStartTime: actual_timespan[0], // 实际起始时间戳
      actualEndTime: actual_timespan[1], // 实际结束时间戳
      relativeStartTime: 0, // 相对起始时间戳 0
      relativeEndTime: tmp_latest_relative_timestamp_ms, // 相对结束时间戳
      actualDuration: TimeUtil.compare(actual_timespan[1], actual_timespan[0]),
    }
    // todo should persists those data on cloud
    // 要兼容历史数据
    const serialized_info = JSON.stringify({
      version: 1,
      meta_info: tmp_meta_info,
      topic_infos: tmp_topic_infos,
    })

    let blob1 = new Blob([serialized_info], {
      type: 'application/json', //将会被放入到blob中的数组内容的MIME类型
    })
    let objectUrl1 = URL.createObjectURL(blob1) //生成一个url
    downloadFile(objectUrl1, 'data.json')

    // localStorage.setItem('tmp_neo_msg_time_series', tmp_neo_msg_time_series)
    // 存储
    localStorage.setItem('info', serialized_info)
    // write arraybufffer

    setMetainfo(tmp_meta_info)
    setTopicInfos(tmp_topic_infos.map((i) => ({ ...i, md5_sliced: i.md5.slice(0, 8) })))

    // should save this in bjson format
    // 转换为 TypedArray
    for (const key in tmp_neo_msg_time_series_array) {
      tmp_neo_msg_time_series_typed_array[key] = new Uint32Array(tmp_neo_msg_time_series_array[key])
    }
    // setNeoMessageTimeSeries(tmp_neo_msg_time_series_typed_array)
    console.log(tmp_neo_msg_time_series_typed_array)

    let serializedAsCborBuffer = encode(tmp_neo_msg_time_series_typed_array)
    console.log('cbor bin', serializedAsCborBuffer)
    let data = decode(serializedAsCborBuffer)
    console.log('cbor structure', data)

    // 转换为 bson 格式的二进制文件
    for (const key in tmp_neo_msg_time_series_typed_array) {
      tmp_neo_msg_time_series_bson[key] = new Binary(Buffer.from(tmp_neo_msg_time_series_typed_array[key].buffer))
    }

    // test those bson codes
    const serialized_time_series = serialize(tmp_neo_msg_time_series_bson)
    const deserialized_data = deserialize(serialized_time_series, { promoteBuffers: true })
    // todo

    // convert back to normal Uint32Array
    const deserialized_data_typed_array: NEO_TIME_SERIES<Uint32Array> = {}
    for (const key in deserialized_data) {
      const { byteOffset: byte_offset, length: content_length } = deserialized_data[key]
      const byte_end = byte_offset + content_length
      // console.log(byte_offset, byte_end, deserialized_data[key].buffer.slice(byte_offset, byte_end))
      deserialized_data_typed_array[key] = new Uint32Array(deserialized_data[key].buffer.slice(byte_offset, byte_end))
    }

    let blob3 = new Blob([new Uint8Array(serialized_time_series)], {
      type: 'application/bson', //将会被放入到blob中的数组内容的MIME类型
    })

    console.log('blob binary', blob3)

    let objectUrl3 = URL.createObjectURL(blob3) //生成一个url
    downloadFile(objectUrl3, 'time-series.bson')

    setNeoMessageTimeSeries(deserialized_data_typed_array)
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

        {metainfo && <Inspector metainfo={metainfo} progress={progress} topicInfos={topicInfos} neoMessageTimeSeries={neoMessageTimeSeries} messageDefinition={messageDefinition}></Inspector>}
      </div>
    </div>
  )
}

export default App
