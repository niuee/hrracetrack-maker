import React from 'react';
import { Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';

export function fourOhFour(props):JSX.Element{
    let navigate = useNavigate();
    return(
        <div >
            <p>404</p>
        </div>
    );
}