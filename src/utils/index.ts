export function openDataURI(title, datauri) {
  const target_window = window.open() as Window
  target_window.document.open()
  target_window.onload = function () {
    target_window.document.title = title
  }
  target_window.document.write(
    `<iframe title="${title}" src="data::text/plain;charset=utf-8,${encodeURIComponent(datauri)}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`
  )
  target_window.document.close()
}

export function calculateTimestamp(a, b) {
  const { sec: a_sec, nsec: a_nsec } = a
  const { sec: b_sec, nsec: b_nsec } = b
  let nsec = b_nsec - a_nsec
  let sec = b_sec - a_sec

  if (nsec < 0) {
    // 补位
    nsec = 1e9 + nsec
    sec -= 1
  }

  return { sec, nsec }
}

export function convertTimestampToMillisecond(s) {
  const { sec, nsec } = s
  return sec * 1e3 + Math.floor(nsec / 1e6)
}
