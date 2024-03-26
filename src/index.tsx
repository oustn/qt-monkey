import {render} from 'preact';
import { useState } from 'preact/hooks';
import IconButton from '@mui/material/IconButton';import Popover from '@mui/material/Popover';
import DownloadIcon from '@mui/icons-material/Download'
import Box from '@mui/material/Box';
import green from '@mui/material/colors/green';
import Fab from '@mui/material/Fab';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';

import { Panel } from './panel'
import {useDownload} from "./download";
import CircularProgress from '@mui/material/CircularProgress';

export function App() {
  const download = useDownload()
  const [anchorEl, setAnchorEl] = useState<Element | null>(null);

  const handleClick = (event: MouseEvent) => {
    if (download.error || download.programs.length > 1) {
      setAnchorEl(event.currentTarget as unknown as Element);
    }
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);

  const loading = download.loading ||
    (download.programs && download.programs.length > 0 && download.programs.some(
      program => program.status === 'downloading' || program.status === 'pending'
    ))
  const success = !loading && !download.error && download.programs && download.programs.every(program => program.status === 'finished')
  const hasError = !loading && (download.error || (download.programs && download.programs.some(program => program.status === 'error')))

  const buttonSx = {
    ...(success ? {
      bgcolor: green[500],
      '&:hover': {
        bgcolor: green[700],
      },
    } : ( hasError ? {
        bgcolor: '#ff7961',
        '&:hover': {
          bgcolor: '#f44336',
        },
      } :
      {
      bgcolor: '#757de8',
      '&:hover': {
        bgcolor: '#3f51b5',
      },
    })),
  };

  return (
    <Box>
      <Fab
        sx={buttonSx}
        onClick={handleClick}
      >
        {success && <CheckIcon sx={{ color: '#fff' }}/>}
        {hasError && <CloseIcon sx={{ color: '#fff' }}/>}
        {loading && <DownloadIcon sx={{ color: '#fff' }}/>}
      </Fab>
      {loading && (
        <CircularProgress
          size={68}
          sx={{
            color: green[500],
            position: 'absolute',
            top: -6,
            left: -6,
            zIndex: 1,
          }}
        />
      )}
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
    </Box>
  )
}

export function Renderer(el: Element) {
  render(<App/>, el);
}
// Renderer(document.getElementById('app'));

function createDownload () {
  const container = document.createElement('div')
  container.style.position = 'fixed'
  container.style.right = '100px'
  container.style.bottom = '100px'
  container.style.zIndex = '9999'
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
