import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language } from '../types';

type Translations = {
    [key in Language]: {
        [key: string]: string | ((args: any) =&gt; string);
    };
};

const translations: Translations = {
