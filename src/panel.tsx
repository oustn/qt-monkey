import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import LinearProgress from '@mui/material/LinearProgress';
import Typography from '@mui/material/Typography';
import ErrorIcon from '@mui/icons-material/Error'
import Schedule from '@mui/icons-material/Schedule'
import Stack from '@mui/material/Stack';
import HighlightOffIcon from '@mui/icons-material/HighlightOff'
import TaskAltIcon from '@mui/icons-material/TaskAlt'
import CircularProgress from '@mui/material/CircularProgress';
import Chip from '@mui/material/Chip';

import {Download} from './download'

interface PanelProps {
  download: Download
}

function Progress(props: { show: boolean }) {
  if (!props.show) return null
  return (
    <Box sx={{pt: 2, pb: 2}}>
      <LinearProgress color="secondary"/>
    </Box>
  )
}

function Error(props: { error?: Error }) {
  if (!props.error) return null
  return (
    <Box sx={{pt: 2, pb: 2}}>
      <Stack direction="row" spacing={1} alignItems="center">
        <ErrorIcon color='error'/>
        <Typography  variant="body2" color="text.secondary" gutterBottom>
          {props.error.message}
        </Typography>
      </Stack>
    </Box>
  )
}

function LinearProgressWithLabel(props: { total: number, finished: number, downloading: number }) {
  const value = (props.finished / props.total) * 100
  const buffer = (props.downloading / props.total) * 100
  return (
    <Stack>
      <Box>
        <Typography variant="body2" color="text.secondary">{`${Math.round(
          value,
        )}%(${props.finished}/${props.total})`}</Typography>
      </Box>
      <Box sx={{ width: '100%', mb: 1 }}>
        <LinearProgress variant="determinate" value={value} valueBuffer={buffer} />
      </Box>
    </Stack>
  );
}

export function Panel(props: PanelProps) {
  const isEmpty = !Array.isArray(props.download.programs) || props.download.programs.length === 0
  const showList = !props.download.loading && !props.download.error

  const total = showList ? props.download.programs.length : 0
  const finished = showList ? props.download.programs.filter(program => program.status === 'finished' || program.status === 'error').length : 0
  const downloading = showList ? props.download.programs.filter(program => program.status === 'downloading').length : 0
  return (
    <Container sx={{width: '360px', height: '480px', pt: 2, pb: 2}}>
      <Progress show={props.download.loading}/>
      <Error error={props.download.error}/>
      { showList && isEmpty && <Typography variant="body2" color="text.secondary">No programs found</Typography> }
      {
        showList && !isEmpty && (
          <Stack sx={{ height: '100%' }}>
            <LinearProgressWithLabel total={total} finished={finished} downloading={downloading}/>

            <Container sx={{ minHeight: 0, overflow: 'auto' }} disableGutters>
              <Stack>
                {props.download.programs.map(program => (
                  <Box key={program.id} sx={{pt: 1, pb: 1}}>
                    <Stack direction='row' alignItems='flex-start'>
                      <Box flexGrow="1" flexShrink="1" sx={{ minWidth: '0', pr: 2 }}>
                        <Typography color='text.primary' gutterBottom sx={{ wordBreak: 'break-all' }}>
                          {program.title}
                          { program.edition?.format && <Chip sx={{ display: 'inline' }} label={program.edition?.format} size="small"/> }
                        </Typography>
                      </Box>
                      <Box flexShrink={0}>
                        {
                          program.status === 'pending' && <Schedule color="disabled"/>
                        }
                        {
                          program.status === 'error' && <HighlightOffIcon color='warning'/>
                        }
                        {
                          program.status === 'finished' && <TaskAltIcon color="success"/>
                        }
                        {
                          program.status === 'downloading' && <CircularProgress size={22}/>
                        }
                      </Box>
                    </Stack>
                  </Box>
                ))}
              </Stack>
            </Container>
          </Stack>
        )
      }
    </Container>
  )
}
