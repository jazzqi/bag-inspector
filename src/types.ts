export interface Connection {
  topic: string
  type: string
  messageDefinition: string
  callerid: string
  md5sum: string
}

export enum SORT_ORDINAL {
  'ASC' = 'ASC',
  'DESC' = 'DESC',
}

export type SORT_BY = { by: string; ordinal: SORT_ORDINAL }
