import React from 'react'
import prettyBytes from 'pretty-bytes'

// type Props any

const BagMeta: React.FC<any> = (props) => {
  const { name, size, startTime, endTime, duration } = props
  return (
    <table>
      {' '}
      <tbody>
        <tr>
          <td colSpan={2}>Add param_aggregator information</td>
        </tr>
        <tr>
          <th align="right">Name:</th>
          <td>{name}</td>
        </tr>
        <tr>
          <th align="right">Type:</th>
          <td>mfbag | rosbag</td>
        </tr>
        <tr>
          <th align="right">MAF:</th>
          <td>3.1.0</td>
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
            <FormatedDateTime datetime={startTime}></FormatedDateTime>,&nbsp;<FormatedTimestamp datetime={startTime}></FormatedTimestamp>
          </td>
        </tr>
        <tr>
          <th align="right">End: </th>
          <td>
            <FormatedDateTime datetime={endTime}></FormatedDateTime>,&nbsp;<FormatedTimestamp datetime={endTime}></FormatedTimestamp>
          </td>
        </tr>
        <tr>
          <th align="right">Duration: </th>
          <td>
            {duration}
            <small>s</small>
          </td>
        </tr>
      </tbody>
    </table>
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

export default BagMeta
