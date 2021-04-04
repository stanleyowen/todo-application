import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faKey, faSignOutAlt } from '@fortawesome/free-solid-svg-icons';
import { faGithub, faGoogle } from '@fortawesome/free-brands-svg-icons';
import axios from 'axios';

import { setNotification, NOTIFICATION_TYPES } from '../libraries/setNotification';
import { ConnectOAuthGitHub, ConnectOAuthGoogle, getCSRFToken, openModal, closeModal, Logout } from '../libraries/validation';

const SERVER_URL = process.env.REACT_APP_SERVER_URL;

const Account = ({ userData }) => {
    const {email, id, thirdParty, isLoading} = userData;
    const [oldPassword, setOldPassword] = useState();
    const [newPassword, setNewPassword] = useState();
    const [confirmPsw, setConfirmPsw] = useState();
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const background = document.getElementById('background');
        const modal = document.getElementById('modal');
        window.onclick = function(e){
            if(e.target === modal || e.target === background){
                modal.classList.remove('showModal');
                modal.classList.add('closeModal');
                background.classList.remove('showBackground');
                background.classList.add('hideBackground');
            }
        }
    }, [userData])

    const submitNewPassword = (e) => {
        e.preventDefault();
        const btn = document.getElementById('btn-changePassword');
        async function submitData() {
            btn.innerHTML = "Updating...";
            const data = { id, email, oldPassword, newPassword, confirmPassword: confirmPsw }
            await axios.put(`${SERVER_URL}/account/user`, data, { headers: { 'X-CSRF-TOKEN': getCSRFToken()[0], 'X-XSRF-TOKEN': getCSRFToken()[1] }, withCredentials: true })
            .then(res => setNotification(NOTIFICATION_TYPES.SUCCESS, res.data.message))
            .catch(err => setNotification(NOTIFICATION_TYPES.DANGER, err.response.data.message));
            closeModal('background', 'modal');
            btn.removeAttribute("disabled");
            btn.classList.remove("disabled");
            btn.innerHTML = "Update";
            setOldPassword(''); setNewPassword(''); setConfirmPsw('');
        }
        if(!email) setNotification(NOTIFICATION_TYPES.DANGER, "Sorry, we are not able to process your request. Please try again later.")
        else if(!oldPassword || !newPassword || !confirmPsw) setNotification(NOTIFICATION_TYPES.DANGER, "Please Make Sure to Fill Out All Required the Fields !")
        else if(oldPassword.length < 6 || newPassword.length < 6 || confirmPsw.length < 6 || oldPassword.length > 40 || newPassword.length > 40 || confirmPsw.length > 40){ setNotification(NOTIFICATION_TYPES.DANGER, 'Please Provide a Password between 6 ~ 40 characters !'); document.getElementById('old-password').focus(); }
        else if(newPassword !== confirmPsw) { setNotification(NOTIFICATION_TYPES.DANGER, 'Please Make Sure Both Passwords are Match !'); document.getElementById('new-password').focus(); }
        else { btn.setAttribute("disabled", "true"); btn.classList.add("disabled"); submitData(); }
    }

    const notify = (e) => {
        e.preventDefault();
        setNotification(NOTIFICATION_TYPES.WARNING, 'Connecting Account with Multiple Third Parties Feature will be available in the Future Release.')
    }
    return (
        <div>
            { !email ?
            (<div className="loader"><div className="spin-container full-width">
                <div className="shape shape-1"></div>
                <div className="shape shape-2"></div>
                <div className="shape shape-3"></div>
                <div className="shape shape-4"></div>
            </div></div>) : null }
            <div id="form">
                <div className="form__contact">
                    <div className="get_in_touch"><h1>Account</h1></div>
                    <div className="form">
                        <div className="contact__formControl">
                            <div className="contact__infoField">
                                <label htmlFor="userEmail">Email Address</label>
                                <input title="Email" id="userEmail" type="email" className="contact__inputField" value={email} disabled={true}/>
                                <span className="contact__onFocus"></span>
                            </div>
                        </div>
                    </div>
                    <div className="oauth-container">
                        <div className="contact__formControl">
                            <button className="oauth-box change-password" onClick={() => {openModal('background', 'modal', 'old-password')}}>
                                <FontAwesomeIcon icon={faKey} size='2x'/> <p>Update Password</p>
                            </button>
                        </div>
                        <div className="contact__formControl">
                            <button className="oauth-box logout" onClick={() => Logout(id, email)}>
                                <FontAwesomeIcon icon={faSignOutAlt} size='2x'/> <p>Sign Out</p>
                            </button>
                        </div>
                    </div>
                    <div className="get_in_touch mt-40"><h2>Third Party</h2></div>
                    <div className="form__container">
                        <div className="contact__formControl">
                            <button className="oauth-box google" onClick={isLoading ? null : thirdParty.isThirdParty ? thirdParty.provider === "github" ? notify : null : ConnectOAuthGoogle}>
                                <FontAwesomeIcon icon={faGoogle} size='2x'/> <p>{ thirdParty ? thirdParty.provider === "google" ? 'Connected' : 'Connect' : 'Connect' } with Google</p>
                            </button>
                        </div>
                        <div className="contact__formControl">
                            <button className="oauth-box github" onClick={isLoading ? null : thirdParty.isThirdParty ? thirdParty.provider === "google" ? notify : null : ConnectOAuthGitHub}>
                                <FontAwesomeIcon icon={faGithub} size='2x'/> <p>{ thirdParty ? thirdParty.provider === "github" ? 'Connected' : 'Connect' : 'Connect' } with GitHub</p>
                            </button>
                        </div>
                    </div>
                    <hr className="mt-20"></hr>
                    <p className="isCentered mt-20 mb-20">Copyright &copy; 2021 Todo Application - All rights reserved.</p>
                </div>
                <div id="background" className="modal hiddenModal">
                    <div id="modal" className="modal__container hiddenModal">
                        <div className="modal__title">
                            <span className="modal__closeFireUI modal__closeBtn" onClick={() => closeModal('background', 'modal')}>&times;</span>
                            <h2>Update Password</h2>
                        </div>
                        <div className="modal__body">
                            <form onSubmit={submitNewPassword}>
                                <input type="text" className="contact__inputField" value={email} required autoComplete="username" readOnly style={{ display: 'none' }} />
                                <div className="contact__formControl">
                                    <div className="contact__infoField">
                                        <label htmlFor="old-password">Old Password <span className="required">*</span></label>
                                        <input title="Old Password" id="old-password" type={ visible ? 'text':'password' } className="contact__inputField" onChange={(event) => setOldPassword(event.target.value)} value={oldPassword} spellCheck="false" autoCapitalize="none" required autoComplete="current-password" />
                                        <span className="contact__onFocus"></span>
                                    </div>
                                </div>
                                <div className="form__container">
                                    <div className="contact__formControl">
                                        <div className="contact__infoField">
                                            <label htmlFor="new-password">New Password <span className="required">*</span></label>
                                            <input title="New Password" id="new-password" type={ visible ? 'text':'password' } className="contact__inputField" onChange={(event) => setNewPassword(event.target.value)} value={newPassword} spellCheck="false" autoCapitalize="none" required autoComplete="new-password" />
                                            <span className="contact__onFocus"></span>
                                        </div>
                                    </div>
                                    <div className="contact__formControl">
                                        <div className="contact__infoField">
                                            <label htmlFor="confirm-password">Confirm New Password <span className="required">*</span></label>
                                            <input title="Confirm New Password" id="confirm-password" type={ visible ? 'text':'password' } className="contact__inputField" onChange={(event) => setConfirmPsw(event.target.value)} value={confirmPsw} spellCheck="false" autoCapitalize="none" required autoComplete="new-password" />
                                            <span className="contact__onFocus"></span>
                                        </div>
                                    </div>
                                </div>
                                <div className="contact__formControl show-password">
                                    <input id="show-password" onClick={() => setVisible(!visible)} type="checkbox" /> <label htmlFor="show-password">Show Pasword</label>
                                </div>
                                <button type="submit" id="btn-changePassword" className="btn__outline" style={{outline: 'none'}}>Update</button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Account;