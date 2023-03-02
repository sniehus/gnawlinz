import axios from 'axios';
import Nav from '../nav/NavBar';
import Result from '../result/Result';
import ProgressBar from 'react-bootstrap/ProgressBar';

// import Investigate from './Investigate';
import React, { useEffect, useContext, useState } from 'react';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import {
  Container, Main, Content1,
  Content2, Content3, Footer, HudButton,
  EventText, StatContainer, ScrollableContainer
} from './Styled'; //ContentBox

import { Link } from 'react-router-dom';
import { UserContext, EventData, ChoiceData } from '../../App';

import { statCheck } from '../../utility/gameUtils';
import { complete, hit, dodge, evacuate, wildCard } from '../../utility/sounds';


const GameView: React.FC = () => {

  const { prevEventId, setPrevEventId, visited, setVisited, allLocations, setAllLocations, location, setLocation, currentChar, setCurrentChar, event, setEvent, selectedChoice, setSelectedChoice, choices, setChoices, outcome, setOutcome, investigateDisabled, setInvestigateDisabled } = useContext(UserContext);


  const fetchEvent = () => {
    axios.get<EventData>('/event/random', { params: { excludeEventId: prevEventId } })
      .then(event => {
        console.log('EVENT', event);
        setEvent(event.data);
        setChoices({
          engage: event.data.choice0,
          evade: event.data.choice1,
          evacuate: event.data.choice2,
          wildcard: event.data.choice3
        });
        setPrevEventId(event.data._id);
      })
      .catch(err => {
        console.log('RANDOM EVENT FETCH FAILED', err);
      });
  };

  const handleClickButt = () => {
    setInvestigateDisabled(true);
    console.log('button pressed');
  };

  //separate func for update char location via axios request to character/location endpoint

  // const fetchLocation = () => {
  //   axios.get<LocationData>(`/location/${location._id}`)
  //     .then((location) => {
  //       console.log('Location from DB', location);
  //       setLocation(location.data);
  //       fetchEvent();
  //       //update character location axios to server
  //     })
  //     .catch(err => console.log('Axios fail useEffect Location grab', err));
  // };

  // const updateLocationDB = () => {

  //

  const getAllLocations = () => {
    console.log('Current Event on State: ', event);
    axios.get('/location/allLocations')
      .then(locations => {
        console.log('current location: ', currentChar.location);
        // setCurrentChar(prevStats => ({
        //   ...prevStats,
        //   location: locations.data[0]._id
        setVisited(locations.data.filter((current) => current._id === currentChar.location));
        setAllLocations(locations.data.filter((current) => current._id !== currentChar.location));
        setLocation(locations.data.filter((current) => current._id === currentChar.location)[0]);
        if (!Object.entries(event).length) {
          fetchEvent();
        }
      })
      .catch((err) => {
        console.error('Failed to retrieve all locations: ', err);
      });
  };



  const handleLocationChange = () => {
    if (allLocations.length) {
      setSelectedChoice({} as ChoiceData);
      setOutcome('');
      setAllLocations(prevLocations => prevLocations.slice(1));
      setLocation(allLocations[0]);
      setCurrentChar(prevStats => ({
        ...prevStats,
        location: allLocations[0]._id
      }));
      setVisited(prevVisited => [...prevVisited, allLocations[0]]);
    } else {
      const randomNum = Math.floor(Math.random() * (visited.length));
      if (location !== visited[randomNum]) {
        setLocation(visited[randomNum]);
        setCurrentChar(prevStats => ({
          ...prevStats,
          location: visited[randomNum]._id
        }));
      } else {
        if (visited[randomNum + 1]) {
          setLocation(visited[randomNum + 1]);
          setCurrentChar(prevStats => ({
            ...prevStats,
            location: visited[randomNum + 1]._id
          }));
        } else {
          setLocation(visited[randomNum - 1]);
          setCurrentChar(prevStats => ({
            ...prevStats,
            location: visited[randomNum - 1]._id
          }));
        }
      }
    }
    fetchEvent();
    setInvestigateDisabled(false);
  };

  const resolveChoice = (index: number, stat: number, penalty = '') => {
    axios.get<ChoiceData>(`/choice/selected/${index}`)
      .then(choiceResponse => {
        setSelectedChoice(choiceResponse.data);
        // <-- computation for success check: -->
        const choiceOutcome = statCheck(stat);
        setOutcome(choiceOutcome);
        axios.post(`story/ending/${currentChar._id}`,
          {
            result: choiceResponse.data[choiceOutcome]
          })
          .then(() => {
            console.log('penalty: ', penalty);
            if (choiceOutcome === 'failure') {
              setCurrentChar(previousStats => ({
                ...previousStats,
                [penalty]: previousStats[penalty] - 2
              }));
            } else if (choiceOutcome === 'success' && penalty === 'mood') {
              setCurrentChar(previousStats => ({
                ...previousStats,
                [penalty]: previousStats[penalty] + 1 // this may need to be adjusted to avoid infinite scaling...
              }));
            }
          });
      }) // <-- maybe another .then() to update the currentChar in DB with updated stats ?? -->
      .catch(err => {
        console.error('Failed setting selectedChoice State', err);
      });
  };


  useEffect(() => {
    console.log('this is the use effect');
    getAllLocations();
  }, []);


  // state & functions for investigate modal
  const [show, setShow] = useState(false);
  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);


  const StatusBars = () => {
    const health: number = currentChar.health * 10;
    const mood: number = currentChar.mood * 10;

    return (
      <div>
        <div>Health<ProgressBar variant={health < 30 ? 'danger' : health < 70 ? 'warning' : 'success'} now={health} label={`${health}%`} style={{ backgroundColor: 'grey' }} /></div>
        <div>Mood<ProgressBar variant={mood < 30 ? 'danger' : health < 70 ? 'warning' : 'success'} now={mood} label={`${mood}%`} style={{ backgroundColor: 'grey' }} /></div>
      </div>
    );
  };


  // conditional for character loss involving health or mood reaching 0
  if (currentChar.health < 1 || currentChar.mood < 1) {
    console.log('this breaks it');
    return <Result />;
  }
  // Any hooks between above conditional and below return will crash the page.
  return (

    <Container>
      <Nav isActive={true} />
      <Main>
        <h2>{location.name}</h2>
        <div>
          <EventText>
            <ScrollableContainer>
              {
                Object.entries(event).length
                  ? <p>{event.initial_text}</p>
                  : <></>
              }
              {
                Object.entries(selectedChoice).length
                  ? <p style={{ margin: '1rem' }}>{selectedChoice.flavor_text}</p>
                  : <>
                    <p style={{ margin: '1rem' }}>What do you do?</p>
                    <p style={{ margin: '1rem' }}>Select an option below...</p>
                  </>
              }
              {
                outcome.length
                  ? <p style={{ margin: '1rem' }}>{selectedChoice[outcome]}</p>
                  : <></>
              }
            </ScrollableContainer>
          </EventText>
          <img src={location.image_url}></img>
        </div>
      </Main>
      <Footer>
        <Content1>
          <Link to="/result" style={{ textDecoration: 'none' }}>
            <Content1>
              <HudButton onClick={() => complete.play()}>Continue</HudButton>
            </Content1>
          </Link>
          <Link to="/gameView" style={{ textDecoration: 'none' }}>
            <Content1>
              <HudButton onClick={handleLocationChange}>New Location</HudButton>
            </Content1>
          </Link>
          <Content1>
            <HudButton onClick={() => { handleClickButt(); fetchEvent(); handleShow(); }} disabled={investigateDisabled}>Investigate</HudButton>
            <Modal
              show={show}
              onHide={handleClose}
              backdrop="static"
              keyboard={false}
            >
              <Modal.Header closeButton onClick={() => { handleClose(); handleTextBoxClose(); setModalText(''); }}>
                <Modal.Title>You investigated the area.</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                Choose from the options below:
                Choose from the options below:
                <p>1: Look for items</p>
                <p>2: Look for graffiti</p>
                <p>3: Write graffiti</p>
                {modalText}
              </Modal.Body>
              <Modal.Footer>
                <Button>Choice 1</Button>
                <Button onClick={() => setModalText(`You looked around and found a message in graffiti that said: "${location.graffiti_msg}"`)}>Choice 2</Button>
                <Button onClick={handleTextBoxClick}>Choice 3</Button>
                {showTextBox && <input type="text" />}
              </Modal.Footer>
            </Modal>
          </Content1>
        </Content1>
        <Content2>
          <div>
            <h4>{currentChar.name}</h4>
            <img src={currentChar.image_url} />
          </div>
          <StatContainer>

            <div style={{ textDecoration: 'underline' }}>Status</div>
            <div>{StatusBars()}</div>
          </StatContainer>
        </Content2>
        <Content3>
          <HudButton onClick={() => {
            hit.play();
            resolveChoice(choices.engage, currentChar.strength, 'health');
          }}>Engage</HudButton>
          <HudButton onClick={() => {
            dodge.play();
            resolveChoice(choices.evade, currentChar.endurance);
          }}>Evade</HudButton>
          <HudButton onClick={() => {
            evacuate.play();
            resolveChoice(choices.evacuate, 0);
          }}>Evacuate</HudButton>
          <HudButton onClick={() => {
            wildCard.play();
            resolveChoice(choices.wildcard, currentChar.mood, 'mood');
          }}>Wildcard</HudButton>
        </Content3>
      </Footer>
    </Container>
  );
};

export default GameView;

