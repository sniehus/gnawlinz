//import axios from 'axios';
import React, { useEffect, useState, useContext } from 'react'; //useState,
import { NavBar, TopContent1, TopContent2, TopContent3 } from './Styled'; //ContentBox
import { Link } from 'react-router-dom';
import dayjs from 'dayjs';

import { UserContext } from "../../App";

// Logo link props
type LinkProps = {
  isActive: boolean;
};

function Nav({ isActive }: LinkProps) {
  //do stuff

  const { avatar } = useContext(UserContext);
  const [remainingTime, setRemainingTime] = useState<any>('');

  // clock function
  function calculateRemainingTime() {
    let interval = setInterval(() => {
      let daysLeft = 3;
      let startTime = dayjs();
      let endTime = startTime.add( daysLeft, 'day').startOf('day');
      let remainingTime = endTime.diff(dayjs(), 'millisecond');
      let remainingHours = Math.floor(remainingTime / (1000 * 60 * 60));
      let remainingMinutes = Math.floor((remainingTime % (1000 * 60 * 60)) / (1000 * 60));
      let remainingSeconds = Math.floor((remainingTime % (1000 * 60)) / 1000);

      let formattedTime = `${remainingHours} hours, ${remainingMinutes} minutes, ${remainingSeconds} seconds`;
      setRemainingTime(formattedTime);

    }, 1000);
    return () => clearInterval(interval);
  };

  const defaultAvatar = 'https://res.cloudinary.com/de0mhjdfg/image/upload/v1676696909/gnawlinzIcons/noun-profile-1094753_lwnwm4.png';
  const googleAvatar = avatar ? avatar : defaultAvatar;


  useEffect(() => {
    calculateRemainingTime();
  }, []);

  // logic to make logo active/inactive depending on where it is being rendered
  return (
      <NavBar>
        <TopContent1>
          {isActive ? (
          <Link to="/menu" className='active-link' >GNAWLINZ</Link>
          ) : (
            <span className='inactive-link'>GNAWLINZ</span>
          )}
        </TopContent1>
        <TopContent2>{remainingTime}</TopContent2>
        <TopContent3>
          <img src={googleAvatar} width='18 px' height='18 px' ></img></TopContent3>
      </NavBar>
  )

}

export default Nav;