// context/UserContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const UserContext = createContext();

export const useUser = () => {
    return useContext(UserContext);
};

export const UserProvider = ({ children }) => {
    const [userID, setUserID] = useState(null);

    useEffect(() => {
        // Fetch user ID from local storage or any other logic
        const storedUserID = localStorage.getItem('userID');
        if (storedUserID) {
            setUserID(storedUserID);
        }
    }, []);

    const fetchUserDetails = async (id) => {
        try {
            const response = await axios.get('/api/user/details', {
                headers: {
                    Authorization: id,
                },
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching user details:', error);
            throw error;
        }
    };

    return (
        <UserContext.Provider value={{ userID, fetchUserDetails }}>
            {children}
        </UserContext.Provider>
    );
};
