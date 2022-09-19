import React, { useCallback, useState } from 'react'
import styles from './topic-info-table.module.scss'
import { openDataURI } from '../../utils'
import { SortArrow, SORT_ORDINAL } from '../sort-arrow'

import './table.css'

export const TopicInfoTable: React.FC<{
  filteredTopicInfos: TOPIC_INFOS
  messageSeries: NEO_TIME_SERIES<Uint32Array>
  messageDefinition: MSG_DEFINITION_INFOS
  metainfo
}> = (props) => {
  const [sortBy, setSortBy] = useState<SORT_BY | undefined>()

  const { filteredTopicInfos, messageSeries, metainfo, messageDefinition } = props

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
  return (
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
        {filteredTopicInfos.map((t) => (
          <tr key={t.topic_name} id={t.topic_name} className={styles.row}>
            <td align="left">{t.topic_name}</td>
            <td align="left">
              <DefinitionButton messageDefinition={messageDefinition} topic={t}></DefinitionButton>
              &nbsp;
              <small className={styles.hash} title={t.md5}>
                {t.md5_sliced || t.md5.slice(0, 8)}
              </small>
            </td>
            <td align="left">{t.caller ?? 'N/A'}</td>
            <td align="right">{messageSeries[t.topic_name]?.length || 0}</td>
            <td align="right">
              {((messageSeries[t.topic_name]?.length || 0) / metainfo.duration).toFixed(1)}
              <small>Hz</small>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

const DefinitionButton: React.FC<DEFINITION_PROP> = (props) => {
  const { messageDefinition, topic } = props
  return (
    <button onClick={() => openDataURI(topic.type, messageDefinition[topic.md5])} title="Click to see raw definition">
      {topic.type}
    </button>
  )
}

interface DEFINITION_PROP {
  topic: TOPIC_INFO
  messageDefinition: MSG_DEFINITION_INFOS
}

export default TopicInfoTable
