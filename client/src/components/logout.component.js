import React, { useEffect } from 'react'
import axios from 'axios'

import { getCSRFToken } from '../libraries/validation'

const Logout = ({ userData }) => {
    const {isLoading, authenticated, status} = userData

    useEffect(() => {
        async function logout() {
            await axios.post(`${process.env.REACT_APP_SERVER_URL}/account/logout`, {}, { headers: { 'XSRF-TOKEN': getCSRFToken() }, withCredentials: true })
            .then(() => status !== 302 ? localStorage.setItem('info', JSON.stringify({ status: 200, message: 'You have been logged out successfully.' })) : null)
            .catch(err => localStorage.setItem('info', JSON.stringify(err.response.data)))
            window.location = '/login'
        }
        if(authenticated || status === 302) logout()
        else if(!isLoading && !authenticated) window.location = '/login'
    }, [userData])

    return(<div className="loader"><div className="spin-container"><div className="loading">
        <div></div><div></div><div></div>
        <div></div><div></div>
    </div></div></div>)
}

export default Logout