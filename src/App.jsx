import { useState } from 'react'
import reactLogo from './assets/react.svg'
import Header from './header.jsx'
import './App.css'
import Footer from './footer.jsx'
import Card from './card.jsx'
import './card.css'
import defaultImage from './assets/card.jpeg';
console.log('Default Image:', defaultImage);
function App() {
  const cardData = {
    title: "Welcome to My App",
    description: "This is a sample card with some content.",
    imageUrl: defaultImage,
    buttonLabel: "Learn More",
    onClick: () => alert("Button clicked!"),
  };

  return (
    <>
      <Header></Header>


      <Card 
        title={cardData.title}
        description={cardData.description} 
        imageUrl={cardData.imageUrl} 
        buttonLabel={cardData.buttonLabel} 
        onClick={cardData.onClick}/>


      <Footer></Footer>

    </>
  )
}

export default App
