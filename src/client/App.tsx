import React, { Suspense, lazy, createContext, useContext, useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { GlobalStyle } from './GlobalStyled';
import axios from 'axios';
import { Character, Enemy, Ally, EventData, ChoiceData, LocationData, Item } from './utility/interface';
// import { SettingsContext } from './components/title/Title';

const Title = lazy(() => import('./components/title/Title'));
const Menu = lazy(() => import('./components/menu/Menu'));
const GameView = lazy(() => import('./components/gameView/GameView'));
//const NavBar  = lazy(() => import('./components/nav/NavBar'));
const Result = lazy(() => import('./components/result/Result'));



export const UserContext = createContext<any>('');
export const SettingsContext = createContext<any>('');


const App = () => {

  const [volume, setVolume] = useState(0.7);
  // const { volume, setVolume } = useContext(SettingsContext);

  const [userChars, setUserChars] = useState<Character[]>([]);
  const [currentChar, setCurrentChar] = useState<Character>({} as Character);
  const [currentEnemy, setCurrentEnemy] = useState<Enemy | object>({});
  const [currentAlly, setCurrentAlly] = useState<Ally | object>({});
  const [metAllyArr, setMetAllyArr] = useState<number[]>([]);
  const [activeUser, setActiveUser] = useState({});
  const [stateSession, setStateSession] = useState('');
  const [avatar, setAvatar] = useState('');
  const [event, setEvent] = useState({} as EventData);
  const [selectedChoice, setSelectedChoice] = useState({} as ChoiceData);
  const [choices, setChoices] = useState({
    engage: 0,
    evade: 0,
    evacuate: 0,
    wildcard: 0
  });
  const [outcome, setOutcome] = useState('');
  const [location, setLocation] = useState({} as LocationData);
  const [allLocations, setAllLocations] = useState<LocationData[]>([]);
  const [visited, setVisited] = useState<LocationData[]>([]);
  const [investigateDisabled, setInvestigateDisabled] = useState();

  const [prevEventId, setPrevEventId] = useState(0); // maybe null if event _id starts at 0...
  // const speechElements = useRef<HTMLElement[]>([]);
  // item bonus/inventory state
  const [fetchedInventory, setFetchedInventory] = useState<Item[]>([]);


  const fetchItems = (charInventory) => {
    const currentInventory = charInventory.map(item =>
      axios.get(`/item/${item}`));
    Promise.all(currentInventory)
      .then(items => {
        console.log('currentInventory in App.tsx', fetchedInventory);
        const inventoryData = items.map(item => item.data);
        setFetchedInventory(inventoryData.sort((a, b) => b._id - a._id));
      })
      .then(() => console.log('currentInventory in App.tsx after setFetchedInventory', fetchedInventory))
      .catch(err => console.error('Error in fetchItems in App', err));
  };

  const characterUpdate = () => {
    const sortedInventoryChar = currentChar;
    if (sortedInventoryChar.inventory) {
      sortedInventoryChar.inventory.sort((a, b) => b - a);
    }
    console.log('WHAT AM I', currentChar);
    axios.patch<Character>(`/character/update/${currentChar._id}`, sortedInventoryChar)
      .then(() => {
        console.log('character updated (@APP LEVEL)', currentChar);
      })
      .catch((err) => console.error('error update from axios front end', err));
  };

  const locationUpdate = () => {
    console.log('WHAT AM I', location);
    axios.patch<LocationData>(`/location/update/${location._id}`, location)
      .then(() => console.log('location updated (@APP LEVEL)'))
      .catch((err) => console.error('error update from axios front end', err));
  };

  // text to speech functionality
  const msg = new SpeechSynthesisUtterance();

  const handleSpeak = (e) => {
    msg.text = e.target.innerText;
    window.speechSynthesis.speak(msg);
  };

  useEffect(() => {
    characterUpdate();
    if (currentChar.inventory) {
      fetchItems(currentChar.inventory);
    }
  }, [currentChar]);

  useEffect(() => {
    locationUpdate();
  }, [location]);

  return (
    <SettingsContext.Provider value={{ volume, setVolume }}>
      <UserContext.Provider value={{ metAllyArr, setMetAllyArr, currentAlly, setCurrentAlly, currentEnemy, setCurrentEnemy, prevEventId, setPrevEventId, visited, setVisited, allLocations, setAllLocations, location, setLocation, activeUser, stateSession, avatar, setAvatar, userChars, setUserChars, currentChar, setCurrentChar, setActiveUser, setStateSession, event, setEvent, selectedChoice, setSelectedChoice, choices, setChoices, outcome, setOutcome, investigateDisabled, setInvestigateDisabled, fetchedInventory, setFetchedInventory }}>
        <BrowserRouter>
          <GlobalStyle />

          <Suspense fallback={<div>LOADING...</div>}>

            <Routes>
              <Route path='/' element={<Title />} />
              <Route path='menu' element={<Menu />} />
              <Route path='game-view' element={<GameView handleSpeak={handleSpeak} />} />
              <Route path='result' element={<Result handleSpeak={handleSpeak} />} />
              <Route path='*' element={<Navigate to='/' replace />} />
            </Routes>

          </Suspense>
        </BrowserRouter>
      </UserContext.Provider>
    </SettingsContext.Provider>
  );
};
export default App;
