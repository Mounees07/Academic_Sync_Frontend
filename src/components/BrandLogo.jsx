import React from 'react';
import logo from '../assets/academic-sync-logo.png';

const BrandLogo = ({ className = '', alt = 'Academic Sync logo' }) => {
    const classes = ['brand-logo-image', className].filter(Boolean).join(' ');

    return <img src={logo} alt={alt} className={classes} />;
};

export default BrandLogo;
