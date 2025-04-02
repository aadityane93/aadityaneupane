import React from 'react'
import PropTypes from 'prop-types';
import defaultImage from './assets/card.jpeg?url';
// { imageUrl, title, description, buttonLabel, onClick }
function Card(props) {
    console.log(props.imageUrl);
    return (
        <div className="card">
            {props.imageUrl && <img src={props.imageUrl} alt={props.title} className="card-image" />}
            <div className="card-content">
            <h3 className="card-title">{props.title}</h3>
            <p className="card-description">{props.description}</p>
            {props.buttonLabel && (
                <button className="card-button" onClick={props.onClick}>
                {props.buttonLabel}
                </button>
            )}
            </div>
        </div>
    );

}
Card.propTypes = {
    imageUrl: PropTypes.string,
    title: PropTypes.string,
    description: PropTypes.string,
    buttonLabel: PropTypes.string,
    onClick: PropTypes.func,
};

Card.defaultProps = {
    title: "This says Hello",
    description: "Say Hello",
    imageUrl: defaultImage,
    buttonLabel: "Hello",
    onClick: () => alert("Hello!"),
};
export default Card;