import React, { useCallback, useEffect, useState } from 'react'

import Select from 'react-select'
import ReactSwitch from 'react-switch'

import BagMetaTable from '../bag-meta-table'
import TopicInfoTable from '../topic-info-table/topic-info-table'
import Timeline from '../timeline-echarts'

import styles from './inspector.module.scss'

const Switch = ReactSwitch as any

const Inspector: React.FC<INSPECTOR_PROPS> = (props) => {
  const { metainfo, progress, topicInfos, neoMessageTimeSeries, messageDefinition } = props

  const [toggleTimelineMode, setToggleTimelineMode] = useState<boolean>(true)
  const [userSelectedTopicList, setUserSelectedTopicList] = useState<string[]>([])
  const [filteredTopicList, setFilteredTopicList] = useState<string[]>([])

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

  let filteredTopicInfos = topicInfos
  if (userSelectedTopicList.length > 0) {
    filteredTopicInfos = topicInfos.filter((i) => userSelectedTopicList.includes(i.topic_name))
  }

  // 处理用户筛选 topic
  const handleSelectChange = useCallback(
    (selected_options) => {
      const selected_topics = selected_options.map((i) => i.value)
      localStorage.setItem('selected-topics', JSON.stringify(selected_topics))
      setUserSelectedTopicList(selected_topics)

      if (selected_options.length > 0) {
        setFilteredTopicList(selected_topics)
      } else {
        setFilteredTopicList(topicInfos.map((i) => i.topic_name))
      }
    },
    [topicInfos]
  )

  return (
    <>
      <div className={styles.baginfo}>
        <>
          <hr />

          {/* Toggle View Mode Switcher */}
          {progress === 100 && (
            <label className={styles.switch}>
              <Switch
                height={16}
                width={28}
                handleDiameter={14}
                uncheckedIcon={false}
                checkedIcon={true}
                onChange={() => {
                  setToggleTimelineMode(!toggleTimelineMode)
                }}
                checked={toggleTimelineMode}
              />
              <span> Timeline Mode</span>
            </label>
          )}

          <div className={styles.padded}>
            <BagMetaTable metainfo={metainfo}></BagMetaTable>
          </div>
        </>

        <hr />

        <div className={styles.padded}>
          {/* Read/Parse Progress Component */}
          {progress < 100 && (
            <div className={styles.padded}>
              <em>{progress}%</em>
            </div>
          )}

          {/* Topic Filter Component */}
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

          {/* Topic Table Component */}
          {progress === 100 && !toggleTimelineMode && <TopicInfoTable messageSeries={neoMessageTimeSeries} messageDefinition={messageDefinition} filteredTopicInfos={filteredTopicInfos} metainfo={metainfo}></TopicInfoTable>}

          {/* Timeline Component */}
          {progress === 100 && toggleTimelineMode ? <Timeline maxTimestamp={metainfo.relativeEndTime} neoMessageSeries={neoMessageTimeSeries} filteredTopicList={filteredTopicList}></Timeline> : null}
        </div>
      </div>
    </>
  )
}

export default Inspector

type INSPECTOR_PROPS = {
  metainfo: META_INFO
  progress: number
  topicInfos: TOPIC_INFOS
  neoMessageTimeSeries: NEO_TIME_SERIES<Uint32Array>
  messageDefinition: MSG_DEFINITION_INFOS
}
