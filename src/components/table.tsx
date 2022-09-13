import React, { useCallback, useState } from 'react'
import { NEO_TIME_SERIES } from '../App'
import styles from '../App.module.scss'
import { SORT_BY, SORT_ORDINAL } from '../types'
import { openDataURI } from '../utils'
import { SortArrow } from './sort-arrow'

export const Table: React.FC<{
  filteredMap
  messageSeries: NEO_TIME_SERIES
  metainfo
}> = (props) => {
  const [sortBy, setSortBy] = useState<SORT_BY | undefined>()

  const { filteredMap, messageSeries, metainfo } = props

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
        {filteredMap.map((t) => (
          <tr key={t.topic_name} id={t.topic_name} className={styles.row}>
            <td align="left">{t.topic_name}</td>
            <td align="left">
              <button onClick={() => openDataURI(t.type, `data::text/plain;charset=utf-8,${encodeURIComponent(t.definition)}`)} title="Click to see raw definition">
                {t.type}
              </button>
              &nbsp;
              <small className={styles.hash} title={t.md5}>
                {t.md5_sliced}
              </small>
            </td>
            <td align="left">{t.caller ?? 'N/A'}</td>
            <td align="right">{messageSeries[t.topic_name]?.length || 0}</td>
            <td align="right">
              {((messageSeries[t.topic_name] || 0) / metainfo.duration).toFixed(1)}
              <small>Hz</small>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
