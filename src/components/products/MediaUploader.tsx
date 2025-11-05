'use client'

import React, { useCallback, useRef, useState } from 'react'

import { Box, Button, CircularProgress, IconButton, Paper, Typography } from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward'
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward'

export type UploadedMedia = {
  id: number
  url: string
  filename?: string
  alt_text?: string
}

interface MediaUploaderProps {
  value: UploadedMedia[]
  onChange: (images: UploadedMedia[]) => void
}

const MediaUploader: React.FC<MediaUploaderProps> = ({ value, onChange }) => {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onPick = useCallback(() => inputRef.current?.click(), [])

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return
      setIsUploading(true)
      setError(null)

      const uploaded: UploadedMedia[] = []

      try {
        for (let i = 0; i < files.length; i++) {
          const file = files[i]
          const form = new FormData()

          form.append('file', file)
          form.append('filename', file.name)

          const res = await fetch('/api/media/upload', {
            method: 'POST',
            body: form
          })

          const data = await res.json().catch(() => ({}))

          if (!res.ok || !data?.success) {
            const details = data?.details?.message || data?.details?.data?.message || data?.error

            throw new Error(details || 'Upload failed')
          }

          uploaded.push({
            id: data.media.id,
            url: data.media.url,
            filename: data.media.filename,
            alt_text: data.media.alt_text
          })
        }

        onChange([...(value || []), ...uploaded])
      } catch (e: any) {
        setError(e?.message || 'Upload error')
      } finally {
        setIsUploading(false)
        if (inputRef.current) inputRef.current.value = ''
      }
    },
    [onChange, value]
  )

  const onRemove = (index: number) => {
    const next = [...value]

    next.splice(index, 1)
    onChange(next)
  }

  const shift = (index: number, dir: -1 | 1) => {
    const next = [...value]
    const target = index + dir

    if (target < 0 || target >= next.length) return
    ;[next[index], next[target]] = [next[target], next[index]]
    onChange(next)
  }

  return (
    <Paper sx={{ p: 1.5 }}>
      <Box display='flex' alignItems='center' justifyContent='space-between' mb={1.25}>
        <Typography variant='subtitle1'>Media</Typography>
        <Button size='small' variant='outlined' onClick={onPick} disabled={isUploading}>
          {isUploading ? <CircularProgress size={16} /> : 'Add Images'}
        </Button>
        <input
          ref={inputRef}
          type='file'
          multiple
          accept='image/*'
          style={{ display: 'none' }}
          onChange={e => handleFiles(e.target.files)}
        />
      </Box>

      {error && (
        <Typography color='error' sx={{ mb: 1 }}>
          {error}
        </Typography>
      )}

      <Box sx={{ display: 'flex', gap: 1.5 }}>
        {/* Featured preview */}
        <Box sx={{ width: 180, flex: '0 0 180px' }}>
          <Paper sx={{ p: 0.5 }}>
            <Box sx={{ width: '100%', aspectRatio: '1 / 1', overflow: 'hidden', borderRadius: 1, bgcolor: 'grey.100' }}>
              {value?.[0]?.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={value?.[0]?.url}
                  alt={value?.[0]?.alt_text || ''}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <Box
                  sx={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'grey.500'
                  }}
                >
                  <Typography variant='caption'>No image</Typography>
                </Box>
              )}
            </Box>
            <Typography variant='caption' sx={{ mt: 0.5, display: 'block' }} noWrap>
              {value?.[0]?.filename || value?.[0]?.url || 'No image'}
            </Typography>
          </Paper>
        </Box>

        {/* Horizontal thumbnails */}
        <Box sx={{ flex: 1, minWidth: 0, overflowX: 'auto' }}>
          <Box sx={{ display: 'flex', gap: 1, pb: 0.5 }}>
            {value?.map((img, idx) => (
              <Paper key={`${img.id}-${idx}`} sx={{ p: 0.5, position: 'relative', flex: '0 0 auto', width: 88 }}>
                <Box sx={{ position: 'absolute', right: 2, top: 2, display: 'flex', gap: 0.25 }}>
                  <IconButton size='small' onClick={() => shift(idx, -1)} aria-label='left'>
                    <ArrowUpwardIcon sx={{ transform: 'rotate(-90deg)' }} fontSize='inherit' />
                  </IconButton>
                  <IconButton size='small' onClick={() => shift(idx, 1)} aria-label='right'>
                    <ArrowDownwardIcon sx={{ transform: 'rotate(-90deg)' }} fontSize='inherit' />
                  </IconButton>
                  <IconButton size='small' color='error' onClick={() => onRemove(idx)} aria-label='remove'>
                    <DeleteIcon fontSize='inherit' />
                  </IconButton>
                </Box>
                <Box
                  onClick={() => {
                    if (idx === 0) return
                    const next = [...value]
                    const [picked] = next.splice(idx, 1)

                    next.unshift(picked)
                    onChange(next)
                  }}
                  sx={{
                    width: '100%',
                    aspectRatio: '1 / 1',
                    overflow: 'hidden',
                    borderRadius: 1,
                    bgcolor: 'grey.100',
                    cursor: 'pointer'
                  }}
                  title={idx === 0 ? 'Featured' : 'Set as featured'}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.url}
                    alt={img.alt_text || ''}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </Box>
              </Paper>
            ))}
          </Box>
        </Box>
      </Box>
    </Paper>
  )
}

export default MediaUploader
