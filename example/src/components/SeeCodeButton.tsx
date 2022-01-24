import React from 'react';
import { useHistory } from 'react-router-dom';
import { Box, Button } from '@mui/material';
import LinkIcon from '@mui/icons-material/Code';
import DudeIcon from '@mui/icons-material/Laptop';
import BackIcon from '@mui/icons-material/ArrowBack';

export function SeeCodeButton({ url, home }: { url: string; home?: boolean }) {
  const router = useHistory();

  return (
    <>
      {!home && (
        <Box sx={{ position: 'absolute', top: 0, left: 0, m: 4, zIndex: 999 }}>
          <Button color='secondary' size='large' startIcon={<BackIcon />} onClick={() => router.goBack()}>
            Back
          </Button>
        </Box>
      )}

      <Box sx={{ position: 'absolute', bottom: 0, left: 0, m: 4, zIndex: 999 }}>
        <Button color='secondary' size='large' startIcon={<DudeIcon />} href='https://giuliozausa.dev/'>
          Giulio Zausa
        </Button>
      </Box>

      <Box sx={{ position: 'absolute', bottom: 0, right: 0, m: 4, zIndex: 999 }}>
        <Button color='secondary' size='large' endIcon={<LinkIcon />} href={url}>
          Code
        </Button>
      </Box>
    </>
  );
}
