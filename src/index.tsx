import {render} from 'preact';
import { useState } from 'preact/hooks';
import IconButton from '@mui/material/IconButton';import Popover from '@mui/material/Popover';
import DownloadIcon from '@mui/icons-material/Download'

import { Panel } from './panel'
import {useDownload} from "./download";

const Id = '_qtfm_downloader'

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
        <DownloadIcon />
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

(() => {
  const downloadButton = document.querySelector('.actionRoot .downloadBtn')
  if (!downloadButton) return
  const cloned = downloadButton.cloneNode(true)
  let init = false
  cloned.addEventListener('click', () => {
    if (init) return
    init = true
    const el = document.getElementById(Id)
    if (!el) return
    el.classList.add('active')
    Renderer(el)
  })
  const container = document.createElement('div')
  container.style.display = 'inline-block'
  container.innerHTML = `
<div id="${Id}"></div>
<style>
#_qtfm_downloader {
  opacity: 0;
  z-index: -1;
  transition: all .3s;
}
#_qtfm_downloader.active {
    position: fixed;
    bottom: 50px;
    right: 50px;
    z-index: 999999;
    width: 50px;
    height: 50px;
    background: red;
    opacity: 1;
    transform: translate3d(0,0,-1px);
  }  
</style>
  `
  container.append(cloned)
  downloadButton.parentNode.insertBefore(container, downloadButton)
  downloadButton.parentNode.removeChild(downloadButton)
})()
