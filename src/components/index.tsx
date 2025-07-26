import React from 'react';
import { Button } from 'react-native';

export const CustomButton = ({ title, onPress }) => {
    return (
        <Button title={title} onPress={onPress} />
    );
};

export const Header = ({ title }) => {
    return (
        <Text style={{ fontSize: 24, fontWeight: 'bold' }}>{title}</Text>
    );
};