declare interface CONNECTION {
  topic: string
  type: string
  messageDefinition: string
  callerid: string
  md5sum: string
}

declare interface NEO_TIME_SERIES<T> {
  [K: string]: T // Array<number> | Uint32Array
}

declare type TOPIC_INFO = {
  topic_name: string
  caller: string
  md5: string
  md5_sliced?: string
  type: string
  count: number
  frequency: number
}

declare type TOPIC_INFOS = Array<TOPIC_INFO>

declare type MSG_DEFINITION_INFOS = {
  [MD5: string]: string
}

declare type META_INFO = {
  fileName: string
  fileSize: number
  startTime: any
  endTime: any
  duration: number
  actualStartTime?: any
  actualEndTime?: any
  relativeStartTime: number
  relativeEndTime: number
  actualDuration?: number
}

declare enum SORT_ORDINAL {
  'ASC' = 'ASC',
  'DESC' = 'DESC',
}

declare type SORT_BY = { by: string; ordinal: SORT_ORDINAL }
