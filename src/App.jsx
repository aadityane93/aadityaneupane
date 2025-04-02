import { useState } from 'react'
import reactLogo from './assets/react.svg'
import React from 'react'
import Header from './header.jsx'
import './App.css'
import Footer from './footer.jsx'
import Card from './card.jsx'
import Navbar from './navbar.jsx'
import ThreeScene from './threejs.jsx'
import './card.css'
import defaultImage from './assets/card.jpeg';
console.log('Default Image:', defaultImage);
function App() {
  // const cardData = {
  //   title: "Welcome to My App",
  //   description: "This is a sample card with some content.",
  //   imageUrl: defaultImage,
  //   buttonLabel: "Learn More",
  //   onClick: () => alert("Button clicked!"),
  // };
  // const navbar_content = ["Home", "About", "Projects", "Contact"];
  return (
    <>
      
      {/* <Navbar navbar_content={navbar_content}></Navbar>

      <Card 
        title={cardData.title}
        description={cardData.description} 
        imageUrl={cardData.imageUrl} 
        buttonLabel={cardData.buttonLabel} 
        onClick={cardData.onClick}/> */}
      {/* <Header></Header> */}
      <ThreeScene>
      

      </ThreeScene>
      {/* <Footer></Footer> */}


    </>
  )
}

export default App
