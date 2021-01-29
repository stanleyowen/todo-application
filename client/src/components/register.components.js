import React, { useState } from 'react';
import axios from 'axios';

const SECRET_KEY = process.env.REACT_APP_SECRET_KEY;
const SERVER_URL = process.env.REACT_APP_SERVER_URL;
const EMAIL_VAL = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

const Register = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [honeypot, setHoneypot] = useState('');
    const [confirmPsw, setConfirmPsw] = useState('');
    const [errMessage, setErrMessage] = useState('');

    const Submit = (e) => {
        e.preventDefault();
        async function submitData(){
            const registerData = { SECRET_KEY, email, password, confirmPsw }
            await axios.post(`${SERVER_URL}/data/accounts/register`, registerData)
            .then(res => {
                if(res && res.status === 200){
                    localStorage.setItem('__token', res.data.token);
                    localStorage.setItem('__email', res.data.email);
                    window.location = '/';
                }
            })
            .catch(err => { setErrMessage(err.response.data.message); });
        }
        if(!email || !password || !confirmPsw){ setErrMessage('Please Make Sure to Fill Out All the Required Fields !') }
        else if(honeypot) { return }
        else if(EMAIL_VAL.test(String(email).toLocaleLowerCase()) === false){ setErrMessage('Please Prvide a Valid Email Address !'); document.getElementById('email').focus(); }
        else if(email.length < 6 || email.length > 40){ setErrMessage('Please Provide an Email between 6 ~ 40 characters !'); document.getElementById('email').focus(); }
        else if(password.length < 6 || password.length > 40){ setErrMessage('Please Provide a Password between 6 ~ 40 characters !'); document.getElementById('password').focus(); }
        else if(password !== confirmPsw){ setErrMessage('Please Make Sure Both Password are Match !'); document.getElementById('password').focus(); }
        else { submitData(); }
    }

    return (
        <div>
            <div id="form">
                <div className="form__contact">
                    <div className="get_in_touch">
                        <h1>Register</h1>
                    </div>

                    <div className="form">
                        { errMessage ? (<div className="message__error">{errMessage}</div>) : null }
                        <form className="contact__form" name="contact__form" onSubmit={Submit}>
                            <div className="contact__formControl no-bot">
                                <div className="contact__infoField">
                                    <label htmlFor="email">Email <span className="required">*</span></label>
                                    <input title="Email" id="email" type="text" className="contact__inputField" onChange={(event) => setHoneypot(event.target.value)} value={honeypot} autoComplete="off"/>
                                    <span className="contact__onFocus"></span>
                                </div>
                            </div>
                            <div className="contact__formControl">
                                <div className="contact__infoField">
                                    <label htmlFor="email">Email <span className="required">*</span></label>
                                    <input title="Email" id="email" type="email" className="contact__inputField" onChange={(event) => setEmail(event.target.value)} value={email} required autoFocus autoComplete="username"/>
                                    <span className="contact__onFocus"></span>
                                </div>
                            </div>
                            <div className="form__container">
                                <div className="contact__formControl">
                                    <div className="contact__infoField">
                                        <label htmlFor="password">Password <span className="required">*</span></label>
                                        <input title="Password" id="password" type="password" className="contact__inputField" onChange={(event) => setPassword(event.target.value)} value={password} required autoComplete="new-password"/>
                                        <span className="contact__onFocus"></span>
                                    </div>
                                </div>
                                <div className="contact__formControl">
                                    <div className="contact__infoField">
                                        <label htmlFor="confirm_psw">Confirm Password <span className="required">*</span></label>
                                        <input title="Confirm Password" id="confirm_psw" type="password" className="contact__inputField" onChange={(event) => setConfirmPsw(event.target.value)} value={confirmPsw} required autoComplete="new-password"/>
                                        <span className="contact__onFocus"></span>
                                    </div>
                                </div>
                            </div>
                            <p style={{textAlign: 'center'}}>Already have an Account? <a className="animation__underline" href="/login">Login</a></p>
                            <button type="submit" className="contact__sendBtn">Register</button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Register;