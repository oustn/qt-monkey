import {render} from 'preact';
import { useState } from 'preact/hooks';
import IconButton from '@mui/material/IconButton';import Popover from '@mui/material/Popover';
import DownloadIcon from '@mui/icons-material/Download'

import { Panel } from './panel'
import {handleDownloadProgram, useDownload} from "./download";

export function App() {
  const download = useDownload()
  const [anchorEl, setAnchorEl] = useState<Element | null>(null);

  const handleClick = (event: MouseEvent) => {
    setAnchorEl(event.currentTarget as unknown as Element);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);

  return (
    <div>
      <IconButton size="large" color={ anchorEl ? 'secondary' : 'default' } onClick={handleClick}>
        <DownloadIcon sx={{ color: '#fff' }}/>
      </IconButton>
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
      >
        <Panel download={download}/>
      </Popover>
    </div>
  )
}

export function Renderer(el: Element) {
  render(<App/>, el);
}
// Renderer(document.getElementById('app'));

function createDownload () {
  if (/channels\/\d+\/programs\/\d+/.test(location.href)) {
    handleDownloadProgram().then()
    return
  }
  const container = document.createElement('div')
  container.style.position = 'fixed'
  container.style.right = '100px'
  container.style.bottom = '100px'
  container.style.zIndex = '9999'
  container.style.background = '#757de8'
  container.style.borderRadius = '100%'
  container.style.boxShadow = 'rgba(0, 0, 0, 0.2) 0px 5px 5px -3px, rgba(0, 0, 0, 0.14) 0px 8px 10px 1px, rgba(0, 0, 0, 0.12) 0px 3px 14px 2px'
  document.body.append(container)
  Renderer(container)
}

(() => {
  const downloadButton = document.querySelector('.actionRoot .downloadBtn')
  if (!downloadButton) return
  const cloned = downloadButton.cloneNode(true)
  let init = false
  cloned.addEventListener('click', () => {
    if (init) return
    init = true
    createDownload()
  })

  downloadButton.parentNode.insertBefore(cloned, downloadButton)
  downloadButton.parentNode.removeChild(downloadButton)
})()
