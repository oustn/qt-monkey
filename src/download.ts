import {useEffect, useRef, useState} from 'preact/hooks'
import md5 from 'crypto-js/hmac-md5'
import pLimit from 'p-limit';

type Status = 'pending' | 'downloading' | 'finished' | 'error'
const PAGE_SIZE = 100

function debug(...message: unknown[]) {
  console.log(`[dd]: ${message.join(' ')}`)
}

declare var CON: unknown

declare var GM: {
  download: (options: {
    url: string
    name: string
  }) => Promise<void>

  xmlHttpRequest: (options: {
    url: RequestInfo | URL
    data: BodyInit
  } & RequestInit) => Promise<{ responseText: string }>
}

function gmFetch(url: RequestInfo | URL, options: RequestInit = {}) {
  return GM.xmlHttpRequest({url, ...options, data: options.body})
}

async function Fetch<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const {body, headers, method} = init || {}
  const res = await gmFetch(input, {
    body,
    headers: {
      ...headers
    },
    method
  })

  const {errorno, errormsg, data} = JSON.parse(res.responseText) as QTResponse<T>
  if (errorno !== 0) {
    throw new Error(input + ' ' + errormsg)
  }
  return data
}

export interface Download {
  error?: Error
  loading: boolean
  programs: Array<{
    id: string,
    title: string,
    edition?: Edition,
    status: Status,
  }>
}

interface QTResponse<T> {
  errorno: number,
  errormsg: string
  data: T
}

interface Edition {
  format: string
  url: string
}

function getDeviceId(): string {
  return localStorage.getItem('weblogDeviceId') || '1e7c8c52-6363-475d-bf44-60212cd688b8'
}

function getId(): string {
  const reg = /.*qingting_id=(\S*?)(\s+|;|$)/
  const match = document.cookie.match(reg)
  return match ? match[1] : ''
}

async function getToken(id: string) {
  const refreshToken = localStorage.getItem('refresh')
  if (!refreshToken) throw new Error('获取 refresh token 失败， 请检查是否已登录')
  const res = await Fetch<{ access_token: string }>('https://user.qtfm.cn/u2/api/v4/auth', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      refresh_token: JSON.parse(refreshToken),
      grant_type: 'refresh_token',
      qingting_id: id
    })
  })

  return res.access_token
}

function getChannelId(): string {
  const url = location.href
  const reg = /.*\/channels\/(\S*?)(\/|$)/
  const match = url.match(reg)
  return match ? match[1] : ''
}

export async function getChannelInfo(channelId: string) {
  const url = `https://app.qtfm.cn/m-bff/v2/channel/${channelId}`
  const {id, description, novel_attrs, thumbs, title, podcasters, program_count} = await Fetch<{
    id: string,
    description: string,
    thumbs: string,
    title: string,
    podcasters: Array<{
      nick_name: string
    }>,
    novel_attrs: Array<{
      name: string,
      type: string
    }>,
    program_count: number
  }>(url)

  const podcastersName = podcasters.map(({nick_name}) => nick_name).join(',')
  const subcate = Array.isArray(novel_attrs) ? novel_attrs.find(d => d.type === 'subcate') : null
  const tags = Array.isArray(novel_attrs) ? novel_attrs.filter(d => d.type === 'label') : []
  return {
    id,
    title,
    description,
    thumbs,
    podcaster: podcastersName,
    type: subcate ? subcate.name : '',
    tags: tags.map(d => d.name),
    count: program_count
  }
}

export async function getPrograms(channelId: string, count: number, order = 'asc') {
  const pages = Math.ceil(count / PAGE_SIZE)
  const tasks = Array.from({length: pages}, (_, i) => {
    const url = `https://app.qtfm.cn/m-bff/v2/channel/${channelId}/programs?order=${order}&pagesize=${PAGE_SIZE}&curpage=${i + 1}`
    return Fetch<{
      programs: Array<{
        id: string,
        title: string,
      }>
    }>(url)
  })
  return (await Promise.all(tasks)).flatMap(({programs}) => programs)
}

async function getDownloadUrl(channelId: string, programId: string, id: string, token: string): Promise<Edition> {
  let url = `/m-bff/v1/audiostreams/channel/${channelId}/program/${programId}?access_token=${token}&device_id=${getDeviceId()}&qingting_id=${id}&type=play`
  const sign = md5(url, 'fpMn12&38f_2e').toString();
  url = `https://app.qtfm.cn${url}&sign=${sign}`
  const {editions} = await Fetch<{ editions: Array<{ bitrate: number, format: string, urls: Array<string> }> }>(url)
  editions.sort((a, b) => b.bitrate - a.bitrate)
  return {format: editions[0].format, url: editions[0].urls[0]}
}

async function downloadFile(name: string, url: Edition) {
  return GM.download({
    url: url.url,
    name: `${name}.${url.format}`
  })
}

export function useDownload(): Download {
  const [download, updateDownload] = useState<Download>({
    loading: true,
    programs: [],
  })

  const reference = useRef<Download>();

  const handleError = (err: Error) => {
    updateDownload({
      ...download,
      loading: false,
      error: err
    })
  }

  const handleUpdatePrograms = (id: string, info: { status?: Status, edition?: { url: string, format: string } }) => {
    const result = {
      ...reference.current,
      programs: reference.current.programs.map(d => {
        if (d.id === id) {
          return {
            ...d,
            ...info
          }
        }
        return d
      })
    }
    updateDownload(result)
    reference.current = result
  }

  useEffect(() => {
    const id = getId()
    if (!id) {
      handleError(new Error('获取 qingting_id 失败, 请检查是否已登录'))
      return
    }
    const single = /channels\/\d+\/programs\/\d+/.test(location.href);
    (async () => {
      try {
        const token = await getToken(id)
        debug('token', token)
        const channelId = getChannelId()
        debug('channelId', token)
        let programs: Array<{ id: string, title: string }>
        if (!single) {
          const info = await getChannelInfo(channelId)
          debug('fetch info success')
          programs = await getPrograms(channelId, info.count)
          debug('fetch programs success')
        } else {
          programs = [
            getProgram()
          ]
          debug('fetch program from url')
        }
        const result = {
          ...download,
          loading: false,
          programs: programs.map(d => ({
            ...d,
            status: 'pending' as Status
          }))
        }
        updateDownload(result)

        reference.current = result

        debug('start download')
        const concurrency = typeof CON === 'number' ? CON : 1
        const limit = pLimit(concurrency);

        const tasks = programs.map(program => limit(async () => {
          handleUpdatePrograms(program.id, {status: 'downloading'})
          let edition: Edition
          try {
            edition = await getDownloadUrl(channelId, program.id, id, token)
            handleUpdatePrograms(program.id, {edition})
          } catch (err) {
            handleUpdatePrograms(program.id, {status: 'error'})
            return
          }
          try {
            await downloadFile(program.title, edition)
            handleUpdatePrograms(program.id, {status: 'finished'})
          } catch (e) {
            handleUpdatePrograms(program.id, {status: 'error'})
            return
          }
        }))
        await Promise.all(tasks)
      } catch (err) {
        handleError(err)
        debug(err)
      }
    })()
  }, [])
  return download
}

function getProgram() {
  const reg = /channels\/(\d+)\/programs\/(\d+)/
  const match = location.href.match(reg)
  if (!match) {
    throw new Error('链接地址解析失败')
  }
  const channelId = match[1]
  const programId = match[2]
  const div = document.querySelector('.info .title')
  const name = `${div?.innerHTML || `${channelId}-${programId}`}`
  return {
    id: programId,
    title: name
  }
}
