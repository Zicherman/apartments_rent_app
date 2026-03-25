import { useState, useEffect } from 'react'
import './App.css'

const card = () => {
  
}

function App() {
  const [apartments, setApartments] = useState([]);

  useEffect(() => {
    fetch('http://localhost:5000/api/apartments')
      .then(res => res.json())
      .then(data => {
        console.log("Data loaded:", data); // Check your F12 console for this!
        setApartments(data);
      })
      .catch(err => console.error("Fetch error:", err));
  }, []);

  return (
    <div className="card-container">
      {apartments.length === 0 && <h1 style={{color: 'white'}}>Connecting to database...</h1>}
      
      {apartments.map(apt => (
        <div key={apt.post_id} className="card">
          <h3>{apt.text ? apt.text: "Apartment Post"}</h3>
          
          {/* New Row for Rooms and Date */}
          <div className="card-row">
            <p> <strong> Rooms: {apt.rooms || 'לא צוין'} </strong> </p>
            <p> <strong> Date: {apt.date_published || 'לא צוין'} </strong> </p>
          </div>

          {/* Row for Price and potentially other actions */}
          <div className="card-row">
            <p> <strong> Size: {apt.size|| 'לא צוין'} </strong> </p>
            <p> <strong> Price: {apt.price || 'לא צוין'} </strong> </p>
            {/* <strong className="price">price:  {apt.price || 'N/A'}</strong> */}
          </div>
        </div>
      ))}
    </div>
  );
}

export default App