import React from 'react';
import {Grid, Typography} from '@mui/material';
import { Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';

export function Home():JSX.Element{
    let navigate = useNavigate();
    return(
        <Grid
            container
            spacing={0}
            direction="column"
            alignItems="center"
            justifyContent="center"
            style={{ minHeight: '100vh' }}
            >

            <Typography variant='h1' >賽道創作者</Typography>
            <Button onClick={()=>{navigate("/build_track")}} variant="contained">開始創作</Button>
            <Button onClick={()=>{navigate("/test_page")}} variant="contained">測試頁面</Button>
        </Grid> 
    );
}