import React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEnvelope, faChartLine } from '@fortawesome/free-solid-svg-icons'
import { faGithub } from '@fortawesome/free-brands-svg-icons'
import { Tooltip } from '@material-ui/core'
import Image from '../img/4f4adcbf8c6f66dcfc8a3282ac2bf10a.webp'

const PageNotFound = ({ userData }) => {
    return (
        <div className="main">
            <div className="contact__container">
                <img className="center-object" src={Image} alt="Page Not Found" />
                <div className="center-object">
                    <h1 className="blue-text monospace large">404</h1>
                    <h1 className="blue-text monospace">Page Not Found</h1>
                    <h3 className="mt-20 monospace">Oops! We are sorry, we can't find the page you were looking for.</h3>
                    <h3 className="mt-20 monospace">If you're experiencing a critical issue, please <a className="animation__underline" href="/contact">contact support</a>.</h3>
                    <button className="oauth-box google isCentered block mt-30 mb-20 p-12 button" onClick={() => userData.authenticated ? window.location='/' : window.location='/welcome'}>Back to Home</button>
                    <div className="footer__socialBtn mb-20">
                        <Tooltip title="Contact Support" arrow><a href="/support" rel="noopener noreferrer">
                            <FontAwesomeIcon icon={faEnvelope} style={{ fontSize: "1.8em" }} />
                        </a></Tooltip>
                        <Tooltip title="Current Status" arrow><a href="https://todoapp.freshstatus.io/" target="_blank" rel="noreferrer">
                            <FontAwesomeIcon icon={faChartLine} style={{ fontSize: "1.8em" }} />
                        </a></Tooltip>
                        <Tooltip title="View Code on GitHub" arrow><a href="https://github.com/stanleyowen/todo-application/" target="_blank" rel="noreferrer">
                            <FontAwesomeIcon icon={faGithub} style={{ fontSize: "1.8em" }} />
                        </a></Tooltip>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default PageNotFound