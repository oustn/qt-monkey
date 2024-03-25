import {Download} from './download'

interface PanelProps {
  download: Download
}

export function Panel(props: PanelProps) {

  return (<div>{JSON.stringify(props.download)}</div>)
}
