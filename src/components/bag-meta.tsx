import React from 'react'
import prettyBytes from 'pretty-bytes'

// type Props any

const BagMeta: React.FC<any> = (props) => {
  const { fileName, fileSize, startTime, endTime, duration, actualStartTime, actualEndTime, actualDuration } = props.metainfo
  return (
    <table>
      <tbody>
        {/* <tr>
          <td colSpan={3}>@todo Add param_aggregator information</td>
        </tr> */}
        <tr>
          <th align="right">Name:</th>
          <td colSpan={5}>{fileName}</td>
        </tr>
        {/* <tr>
          <th align="right">Type:</th>
          <td colSpan={5}>mfbag | rosbag</td>
        </tr> */}
        <tr>
          <th align="right">MAF:</th>
          <td colSpan={5}>3.1.0</td>
        </tr>
        <tr>
          <th align="right">Size:</th>
          <td>
            <div title={`${fileSize} Bytes`}>{prettyBytes(fileSize, { maximumFractionDigits: 2 })}</div>
          </td>
        </tr>
        {startTime && <DateElement startTime={startTime} endTime={endTime} duration={duration} showTitle={true}></DateElement>}
        {actualStartTime && <DateElement startTime={actualStartTime} endTime={actualEndTime} duration={actualDuration} showTitle={false}></DateElement>}
      </tbody>
    </table>
  )
}

const DateElement: React.FC<any> = (props) => {
  const { startTime, endTime, duration, showTitle } = props
  return (
    <>
      <tr>
        <th align="right">{showTitle ? 'Start:' : 'Actual:'}</th>
        <td>
          <FormatedDateTime datetime={startTime}></FormatedDateTime>
        </td>
        <th align="right">{showTitle ? 'End:' : null} </th>
        <td>
          <FormatedDateTime datetime={endTime}></FormatedDateTime>
        </td>
        <th align="right">{showTitle ? 'Span:' : null} </th>
        <td>
          {duration}
          <small>s</small>
        </td>
      </tr>
    </>
  )
}

const FormatedDateTime: React.FC<{
  datetime: { sec: number; nsec: number }
}> = (props) => {
  const d = new Date(props.datetime.sec * 1000)
  return <span title={`${d.toLocaleString()}\n\n${props.datetime.sec} sec\n${props.datetime.nsec} nanosec`}>{d.toISOString()}</span>
}

// const FormatedTimestamp: React.FC<{
//   datetime: { sec: number; nsec: number }
// }> = (props) => (
//   <span>
//     <span>
//       {props.datetime.sec}
//       <small title="second">sec</small>
//     </span>
//     ,&nbsp;
//     <span>
//       {props.datetime.nsec}
//       <small title="nanosecond">nsec</small>
//     </span>
//   </span>
// )

export default BagMeta
