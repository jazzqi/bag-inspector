declare interface CONNECTION {
  topic: string
  type: string
  messageDefinition: string
  callerid: string
  md5sum: string
}

declare enum SORT_ORDINAL {
  'ASC' = 'ASC',
  'DESC' = 'DESC',
}

declare type SORT_BY = { by: string; ordinal: SORT_ORDINAL }

declare type NEO_TIME_SERIES = Map<string, Array<number> | Uint32Array>

declare type TOPIC_INFOS = Array<{
  topic_name: string
  caller: string
  md5: string
  md5_sliced: string
  type: string
  definition: string
  count: number
  frequency: number
}>

declare type META_INFO = {
  fileName: string
  fileSize: number
  startTime: any
  endTime: any
  duration: number
  absoluteStartTime?: any
  absoluteEndTime?: any
  relativeStartTime: number
  relativeEndTime: number
  actualDuration?: number
}
