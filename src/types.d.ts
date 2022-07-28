interface Connection {
  topic: string
  type: string
  messageDefinition: string
  callerid: string
  md5sum: string
}

enum SORT_DIRECTION {
  'ASC',
  'DESC',
}

type SORT_BY = { by: string; order: SORT_DIRECTION }
